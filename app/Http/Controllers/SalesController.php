<?php

namespace App\Http\Controllers;

use App\Models\PointsRule;
use App\Models\SalesTransaction;
use App\Models\SalesTransactionItem;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\ItemMaster;
use App\Models\StockInHand;
use App\Models\PrivilagePoint;
use App\Models\PrivilegeUser;
use App\Models\AccMas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Dompdf\Dompdf;

class SalesController extends Controller
{
    public function index(Request $request)
    {
        if (!request()->user()->hasPermission('sales.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view sales.');
        }

        $query = SalesTransaction::query();

        // Search by invoice number
        if ($request->has('search') && $request->search) {
            $query->where('invoice_no', 'like', '%' . $request->search . '%');
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to'])
        ]);
    }

    public function getTransactions(Request $request)
    {
        if (!request()->user()->hasPermission('sales.view')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to view sales.'], 403);
        }

        $query = SalesTransaction::query();

        // Search by invoice number
        if ($request->has('search') && $request->search) {
            $query->where('invoice_no', 'like', '%' . $request->search . '%');
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'sales' => $sales
        ]);
    }

    public function create()
    {
        if (!request()->user()->hasPermission('sales.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create sales.');
        }

        return Inertia::render('Sales/Create', [
            'nextInvoiceNo' => $this->getNextInvoiceNoPreview(),
            'currentDate' => date('Y-m-d'),
        ]);
    }

    public function show(SalesTransaction $sale)
    {
        if (!request()->user()->hasPermission('sales.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view sales.');
        }

        $sale->load('items');
        return Inertia::render('Sales/Show', [
            'sale' => $sale
        ]);
    }

    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('sales.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create sales.');
        }

        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'customer_code' => 'nullable|string',
            'customer_name' => 'nullable|string',
            'price_type' => 'required|string',
            'subtotal' => 'required|numeric',
            'total_amount' => 'required|numeric',
            'is_vat_invoice' => 'nullable|boolean',
            'vat_rate' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric|min:0',
            'cash_payment' => 'nullable|numeric|min:0',
            'card_payment' => 'nullable|numeric|min:0',
            'points_redeem' => 'nullable|numeric|min:0',
            'payment_mode' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.item_code' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($request) {
            // Determine sale type based on items
            $hasPrinters = collect($request->items)->contains(fn($item) => !empty($item['serial_number']));
            $saleType = $hasPrinters ? 'printer' : 'item';

            // For printer sales, require customer selection
            if ($saleType === 'printer') {
                if (!$request->customer_code || $request->customer_code === '0001') {
                    return response()->json([
                        'message' => 'Registered customer required for printer sales',
                        'errors' => ['customer' => 'Registered customer required for printer sales']
                    ], 422);
                }
            }

            $invoiceNo = $this->generateInvoiceNo($saleType);

            // Validate serial numbers for printers - ensure no duplicates in the same sale
            $serialNumbers = collect($request->items)
                ->filter(fn($item) => !empty($item['serial_number']))
                ->pluck('serial_number')
                ->toArray();
            
            if (count($serialNumbers) !== count(array_unique($serialNumbers))) {
                return response()->json([
                    'message' => 'Duplicate printer serial numbers detected in this sale. Each printer can only be sold once.',
                    'errors' => ['items' => 'Cannot sell the same printer multiple times in one transaction']
                ], 422);
            }

            // Validate stock availability for ALL items with locking to prevent race conditions
            foreach ($request->items as $itemData) {
                $itmKy = $itemData['itm_ky'] ?? null;
                if (!$itmKy) continue;

                $requestedQty = ($itemData['quantity'] ?? 0) + ($itemData['free_quantity'] ?? 0);
                $batchNo = $itemData['batch_no'] ?? null;
                $serialNumber = $itemData['serial_number'] ?? null;
                $sectionCode = Auth::user()->section_code ?? 'MAIN';

                // 1. Lock the ItemMaster record to serialize access to this item's stock
                // This ensures that while we are checking and deducting stock, no one else can do the same 
                // for this item, preventing race conditions.
                $lock = ItemMaster::where('ItmKy', $itmKy)->lockForUpdate()->first();

                // 2. Query valid stock
                $query = StockInHand::where('ItemKy', $itmKy)
                    ->where('section_code', $sectionCode);

                if ($serialNumber) {
                    $query->where('serial_number', $serialNumber);
                } elseif ($batchNo) {
                    $query->where('batch_no', $batchNo);
                }

                $currentStock = $query->sum(DB::raw('COALESCE(Qty, 0) + COALESCE(FreeQty, 0)'));

                if ($currentStock < $requestedQty) {
                    $itemDesc = $itemData['item_name'];
                    if ($serialNumber) $itemDesc .= " (S/N: $serialNumber)";
                    elseif ($batchNo) $itemDesc .= " (Batch: $batchNo)";

                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => "Insufficient stock for item '{$itemDesc}'. Available: " . number_format($currentStock, 2) . ", Requested: " . number_format($requestedQty, 2)
                    ]);
                }
            }

            $customer = Customer::where('AdrCd', $request->customer_code)->first();
            
            // For printer sales, ensure customer exists
            if ($saleType === 'printer' && !$customer) {
                return response()->json([
                    'message' => 'Registered customer required for printer sales',
                    'errors' => ['customer' => 'Please select a valid registered customer']
                ], 422);
            }

            $totalPaid = ($request->cash_payment ?? 0) + ($request->card_payment ?? 0) + ($request->points_redeem ?? 0);
            $balance = $request->total_amount - $totalPaid;

            // Only allow partial payments for registered customers
            $isRegisteredCustomer = $customer && $request->customer_code !== '0001';

            $status = 'completed';
            if ($request->payment_mode === 'credit' || $balance > 0) {
                if ($isRegisteredCustomer) {
                    $status = ($balance <= 0) ? 'completed' : (($totalPaid > 0) ? 'partially_paid' : 'pending');
                } else {
                    // For unregistered customers, require full payment
                    if ($balance > 0) {
                        return response()->json([
                            'message' => 'Partial payments are only allowed for registered customers. Please register the customer or pay the full amount.',
                            'errors' => ['payment' => 'Partial payments require customer registration']
                        ], 422);
                    }
                }
            }
            
            $sale = SalesTransaction::create([
                'uuid' => (string) Str::uuid(),
                'invoice_no' => $invoiceNo,
                'transaction_date' => $request->transaction_date,
                'section_code' => Auth::user()->section_code, // Added section_code
                'customer_code' => $request->customer_code,
                'customer_name' => $request->customer_name,
                'customer_id' => $customer ? $customer->AdrKy : null,
                'cashier_id' => Auth::id(),
                'price_type' => $request->price_type,
                'subtotal' => $request->subtotal,
                'discount_amount' => $request->discount_amount ?? 0,
                'tax_amount' => $request->tax_amount ?? 0,
                'vat_rate' => $request->vat_rate ?? 0,
                'is_vat_invoice' => $request->is_vat_invoice ?? false,
                'total_amount' => $request->total_amount,
                'balance_amount' => $balance > 0 ? $balance : 0,
                'payment_details' => [
                    'mode' => $request->payment_mode,
                    'cash' => $request->cash_payment ?? 0,
                    'card' => $request->card_payment ?? 0,
                    'points' => $request->points_redeem ?? 0,
                ],
                'status' => $status,
                'completed_at' => now(),
            ]);

            // Generate separate stock reference number different from invoice number
            $stockRefNo = 'STK-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT);

            // Create payment records for each payment method used
            if ($customer) {
                $paymentMethods = [];

                if (($request->cash_payment ?? 0) > 0) {
                    $paymentMethods[] = [
                        'method' => 'cash',
                        'amount' => $request->cash_payment,
                    ];
                }

                if (($request->card_payment ?? 0) > 0) {
                    $paymentMethods[] = [
                        'method' => 'card',
                        'amount' => $request->card_payment,
                    ];
                }

                if (($request->points_redeem ?? 0) > 0) {
                    $paymentMethods[] = [
                        'method' => 'points',
                        'amount' => $request->points_redeem,
                    ];
                }

                // Create payment records for each method
                foreach ($paymentMethods as $payment) {
                    CustomerPayment::create([
                        'customer_id' => $customer->AdrKy,
                        'customer_code' => $request->customer_code,
                        'sales_transaction_id' => $sale->id,
                        'amount' => $payment['amount'],
                        'date' => $request->transaction_date,
                        'method' => $payment['method'],
                        'reference' => $invoiceNo,
                        'notes' => "Initial {$payment['method']} payment for sale",
                        'status' => 'completed',
                    ]);
                }
            }

            foreach ($request->items as $index => $itemData) {
                $sale->items()->create([
                    'uuid' => (string) Str::uuid(),
                    'invoice_no' => $invoiceNo,
                    'item_code' => $itemData['item_code'],
                    'item_name' => $itemData['item_name'],
                    'barcode' => $itemData['barcode'] ?? null,
                    'category' => $itemData['category'] ?? null,
                    'unit' => $itemData['unit'] ?? null,
                    'batch_no' => $itemData['batch_no'] ?? null,
                    'product_id' => $itemData['itm_ky'] ?? null,
                    'company_code' => Auth::user()->company_code ?? null,
                    'section_code' => Auth::user()->section_code ?? 'MAIN',
                    'original_item_id' => $itemData['itm_ky'] ?? null,
                    'unit_price' => $itemData['unit_price'],
                    'our_price' => $itemData['our_price'] ?? $itemData['unit_price'],
                    'cost_price' => $itemData['cost_price'] ?? 0,
                    'quantity' => $itemData['quantity'],
                    'free_quantity' => $itemData['free_quantity'] ?? 0,
                    'line_total' => $itemData['total'],
                    'line_number' => $index + 1,
                    'price_type' => $request->price_type,
                    'brand' => $itemData['brand'] ?? null,
                    'model' => $itemData['model'] ?? null,
                    'serial_number' => $itemData['serial_number'] ?? null,
                    'warranty' => $itemData['warranty'] ?? null,
                ]);

                // Update stock logic - Create a new row in stock_in_hand for the sale
                StockInHand::create([
                    'RefNo' => $stockRefNo,
                    'OrdDate' => $request->transaction_date,
                    'ItemKy' => $itemData['itm_ky'] ?? null,
                    'Qty' => -$itemData['quantity'],
                    'FreeQty' => -($itemData['free_quantity'] ?? 0),
                    'TrnTyp' => 'SAL', // Sale transaction type
                    'batch_no' => $itemData['batch_no'] ?? null,
                    'company_code' => Auth::user()->company_code ?? null,
                    'section_code' => Auth::user()->section_code ?? 'MAIN', // Use user's section
                    'serial_number' => $itemData['serial_number'] ?? null,
                    'brand' => $itemData['brand'] ?? null,
                    'model' => $itemData['model'] ?? null,
                    'warranty' => $itemData['warranty'] ?? null,
                ]);
            }

            // Update Customer Account Balance (AccMas)
            if ($customer && $balance > 0) {
                $accMas = AccMas::where('AccKy', $customer->AccKy)->first();
                if ($accMas) {
                    $accMas->increment('CurBal', $balance);
                }
            }

            // Return success response with sale ID for invoice generation
            return response()->json([
                'success' => true,
                'message' => 'Sale saved successfully. Invoice: ' . $invoiceNo,
                'sale_id' => $sale->id,
                'invoice_no' => $invoiceNo,
            ]);
        });
    }

    public function searchCustomers(Request $request)
    {
        $query = $request->get('query');
        $type = $request->get('type');

        $customers = Customer::where(function ($q) use ($query) {
            $q->where('AdrCd', 'like', "%{$query}%")
                ->orWhere('FstNm', 'like', "%{$query}%")
                ->orWhere('LstNm', 'like', "%{$query}%");
        });

        // Filter by type if specified
        if ($type === 'customer') {
            $customers->where('AdrCd', 'like', 'CUS%');
        }

        return $customers->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'code' => $item->AdrCd,
                    'name' => trim($item->FstNm . ' ' . $item->LstNm),
                    'is_vat_registered' => (bool)$item->fVATRegistered,
                    'vat_no' => $item->VATNo,
                ];
            });
    }

    public function searchItems(Request $request)
    {
        $query = $request->get('query');
        return ItemMaster::where('ItemCode', 'like', "%{$query}%")
            ->orWhere('BarCode', 'like', "%{$query}%")
            ->orWhere('ItmNm', 'like', "%{$query}%")
            ->with(['priceDetails' => function($q) {
                $q->where('Status', 'A')->orderBy('ItemPriceKey', 'desc');
            }])
            ->limit(10)
            ->get()
            ->flatMap(function ($item) {
                // Fetch stock grouped by batch for this item in current section
                $sectionCode = Auth::user()->section_code ?? 'MAIN';
                $stocks = StockInHand::where('ItemKy', $item->ItmKy)
                    ->where('section_code', $sectionCode)
                    ->select('batch_no', DB::raw('SUM(Qty + COALESCE(FreeQty, 0)) as total_qty'))
                    ->groupBy('batch_no')
                    ->having('total_qty', '>', 0)
                    ->get();

                $priceDetail = $item->priceDetails->first();
                $baseItem = [
                    'item_code' => $item->ItemCode,
                    'item_name' => $item->ItmNm,
                    'unit_price' => (float)($priceDetail ? $priceDetail->SlsPri : $item->SlsPri),
                    'cost_price' => (float)($priceDetail ? $priceDetail->NCostPrice : $item->NCostPrice),
                    'retail_price' => (float)($priceDetail ? $priceDetail->SlsPri : $item->SlsPri),
                    'wholesale_price' => (float)($priceDetail ? $priceDetail->WholePrice : ($item->WholePrice ?? $item->SlsPri)),
                    'extra_price' => (float)($priceDetail ? $priceDetail->ExtraPrice : ($item->ExtraPrice ?? $item->SlsPri)),
                    'card_price' => (float)($priceDetail ? $priceDetail->CCPrice : ($item->CCPrice ?? $item->SlsPri)),
                    'barcode' => $item->BarCode,
                    'brand' => $item->brand,
                    'model' => $item->model,
                    'serial_number' => $item->serial_number,
                    'warranty' => $item->warranty,
                    'category' => $item->category ? $item->category->cname : null,
                    'unit' => $item->unit ? $item->unit->UnitCd : null,
                    'itm_ky' => $item->ItmKy,
                    'vat_inclusive' => (bool)$item->VATItem,
                    // Quantity-based discount tiers
                    'tiers' => [
                        'tier1' => [
                            'qty' => $priceDetail ? $priceDetail->RtQty1 : $item->RtQty1,
                            'discount' => $priceDetail ? $priceDetail->RtDis1 : $item->RtDis1
                        ],
                        'tier2' => [
                            'qty' => $priceDetail ? $priceDetail->RtQty2 : $item->RtQty2,
                            'discount' => $priceDetail ? $priceDetail->RtDis2 : $item->RtDis2
                        ],
                        'tier3' => [
                            'qty' => $priceDetail ? $priceDetail->RtQty3 : $item->RtQty3,
                            'discount' => $priceDetail ? $priceDetail->RtDis3 : $item->RtDis3
                        ],
                        'tier4' => [
                            'qty' => $priceDetail ? $priceDetail->RtQty4 : $item->RtQty4,
                            'discount' => $priceDetail ? $priceDetail->RtDis4 : $item->RtDis4
                        ],
                    ],
                ];

                if ($stocks->isEmpty()) {
                    return [array_merge($baseItem, ['batch_no' => null, 'stock' => 0])];
                }

                return $stocks->map(function ($stk) use ($baseItem, $item) {
                    // Fetch specific price for this batch from PurchaseDet
                    $purchaseDet = \App\Models\PurchaseDet::where('batch_no', $stk->batch_no)
                        ->where('iTimKy', $item->ItmKy)
                        ->orderBy('PerchaseDetKy', 'desc')
                        ->first();

                    // If batch-specific price exists, override base prices
                    $batchPrices = [];
                    if ($purchaseDet) {
                        $batchPrices = [
                            'unit_price' => (float)$purchaseDet->SalePrice,
                            'retail_price' => (float)$purchaseDet->SalePrice,
                            'wholesale_price' => (float)$purchaseDet->WholePrice,
                            'extra_price' => (float)$purchaseDet->ExtraPrice,
                            'card_price' => (float)$purchaseDet->CCPrice,
                            'cost_price' => (float)$purchaseDet->CostPrice,
                        ];
                    }

                    return array_merge($baseItem, $batchPrices, [
                        'batch_no' => $stk->batch_no,
                        'stock' => (float)$stk->total_qty
                    ]);
                });
            })
            ->take(15)
            ->values();
    }

    public function searchPrinters(Request $request)
    {
        $query = $request->get('query');
        if (empty($query)) return response()->json([]);

        // Search from purchase_det table for printers (GRN data)
        // Group by serial number to get unique printers with their latest purchase details
        $purchaseQuery = \App\Models\PurchaseDet::select(
                'purchase_det.serial_number',
                'purchase_det.brand',
                'purchase_det.model',
                'purchase_det.warranty',
                'purchase_det.batch_no',
                'purchase_det.iTimKy as ItemKy',
                'purchase_det.SalePrice',
                'purchase_det.WholePrice',
                'purchase_det.ExtraPrice',
                'purchase_det.CCPrice',
                'purchase_det.CostPrice',
                'purchase_det.barcode',
                'purchase_det.VATItem',
                'purchase_det.item_name', // Added item_name
                'purchase_det.CusDiscountRate', // Added CusDiscountRate
                DB::raw('MAX(purchase_det.PerchaseDetKy) as latest_purchase')
            )
            ->whereNotNull('purchase_det.serial_number')
            ->where('purchase_det.serial_number', '!=', '')
            ->where(function($q) use ($query) {
                // Search by serial number (exact match)
                $q->where('purchase_det.serial_number', '=', $query)
                  // OR search by barcode (exact match)
                  ->orWhere('purchase_det.barcode', '=', $query)
                  // OR search by item key from itemmaster (contains query for item names)
                  ->orWhereIn('purchase_det.iTimKy', function($subQuery) use ($query) {
                      $subQuery->select('ItmKy')
                               ->from('itemmaster')
                               ->where('ItmNm', 'like', "%{$query}%");
                  })
                  // OR search by specific item details in purchase_det (for ad-hoc/generic items)
                  ->orWhere('purchase_det.item_name', 'like', "%{$query}%")
                  ->orWhere('purchase_det.brand', 'like', "%{$query}%")
                  ->orWhere('purchase_det.model', 'like', "%{$query}%");
            });

        $purchaseResults = $purchaseQuery
            ->groupBy('purchase_det.serial_number', 'purchase_det.brand', 'purchase_det.model', 'purchase_det.warranty', 
                      'purchase_det.batch_no', 'purchase_det.iTimKy', 'purchase_det.SalePrice', 'purchase_det.WholePrice',
                      'purchase_det.ExtraPrice', 'purchase_det.CCPrice', 'purchase_det.CostPrice', 'purchase_det.barcode', 
                      'purchase_det.VATItem', 'purchase_det.item_name', 'purchase_det.CusDiscountRate') // Added item_name & CusDiscountRate
            ->limit(50)
            ->get();

        return $purchaseResults->map(function ($purchase) {
            // Get stock information for this serial number in current section
            $sectionCode = Auth::user()->section_code ?? 'MAIN';
            $stock = StockInHand::where('serial_number', $purchase->serial_number)
                ->where('section_code', $sectionCode)
                ->selectRaw('SUM(Qty + COALESCE(FreeQty, 0)) as total_qty')
                ->first();

            $availableStock = $stock ? (float)$stock->total_qty : 0;

            // Only return printers with positive stock
            if ($availableStock <= 0) {
                return null;
            }

            $item = null;
            if ($purchase->ItemKy) {
                $item = \App\Models\ItemMaster::find($purchase->ItemKy);
            }

            $retailPrice = (float)$purchase->SalePrice ?: ($item ? $item->SlsPri : 0);
            $wholesalePrice = (float)$purchase->WholePrice ?: ($item ? ($item->WholePrice ?? $item->SlsPri) : 0);
            $extraPrice = (float)$purchase->ExtraPrice ?: ($item ? ($item->ExtraPrice ?? $item->SlsPri) : 0);
            $cardPrice = (float)$purchase->CCPrice ?: ($item ? ($item->CCPrice ?? $item->SlsPri) : 0);
            $costPrice = (float)$purchase->CostPrice ?: ($item ? $item->NCostPrice : 0);
            
            // Get tier information from item or price details
            $priceDetail = null;
            if ($item) {
                $priceDetail = $item->priceDetails()->where('Status', 'A')->orderBy('ItemPriceKey', 'desc')->first();
            }

            return [
                'item_code' => $item ? $item->ItemCode : 'PRINTER',
                'item_name' => $purchase->item_name ?: ($item ? $item->ItmNm : (($purchase->brand ?? '') . ' ' . ($purchase->model ?? ''))),
                'serial_number' => $purchase->serial_number,
                'brand' => $purchase->brand,
                'model' => $purchase->model,
                'warranty' => $purchase->warranty,
                'batch_no' => $purchase->batch_no,
                'barcode' => $purchase->barcode ?: ($item ? $item->BarCode : null),
                'category' => $item && $item->category ? $item->category->cname : null,
                'unit' => $item && $item->unit ? $item->unit->UnitCd : null,
                'itm_ky' => $purchase->ItemKy,
                'stock' => $availableStock,
                'unit_price' => $retailPrice,
                'cost_price' => $costPrice,
                'retail_price' => $retailPrice,
                'wholesale_price' => $wholesalePrice,
                'extra_price' => $extraPrice,
                'card_price' => $cardPrice,
                'vat_inclusive' => (bool)($purchase->VATItem ?? false),
                'cus_discount_rate' => (float)$purchase->CusDiscountRate ?? 0,
                'is_printer' => true,
                // Quantity-based discount tiers
                'tiers' => [
                    'tier1' => [
                        'qty' => $priceDetail ? $priceDetail->RtQty1 : ($item ? $item->RtQty1 : null),
                        'discount' => $priceDetail ? $priceDetail->RtDis1 : ($item ? $item->RtDis1 : null)
                    ],
                    'tier2' => [
                        'qty' => $priceDetail ? $priceDetail->RtQty2 : ($item ? $item->RtQty2 : null),
                        'discount' => $priceDetail ? $priceDetail->RtDis2 : ($item ? $item->RtDis2 : null)
                    ],
                    'tier3' => [
                        'qty' => $priceDetail ? $priceDetail->RtQty3 : ($item ? $item->RtQty3 : null),
                        'discount' => $priceDetail ? $priceDetail->RtDis3 : ($item ? $item->RtDis3 : null)
                    ],
                    'tier4' => [
                        'qty' => $priceDetail ? $priceDetail->RtQty4 : ($item ? $item->RtQty4 : null),
                        'discount' => $priceDetail ? $priceDetail->RtDis4 : ($item ? $item->RtDis4 : null)
                    ],
                ],
            ];
        })->filter()->values(); // Remove null values (out of stock items) and reset array keys
    }

    private function getNextInvoiceNoPreview($type = 'item')
    {
        $prefix = match($type) {
            'printer' => 'PRI-',
            'item' => 'ITM-',
            default => 'INV-'
        };

        $sequenceName = 'sales_' . $type;
        
        // Peek at the next value without incrementing
        $nextValue = \App\Models\Sequence::peekNextValue($sequenceName);
        
        // If it's 1 (default), check if we have existing legacy records to initialize from
        if ($nextValue == 1) {
             $lastSale = SalesTransaction::where('invoice_no', 'like', $prefix . '%')
                ->orderBy('invoice_no', 'desc')
                ->first();
            
            if ($lastSale) {
                $numericPart = substr($lastSale->invoice_no, strlen($prefix));
                if (is_numeric($numericPart)) {
                    $nextValue = (int)$numericPart + 1;
                }
            }
        }

        return $prefix . str_pad($nextValue, 6, '0', STR_PAD_LEFT);
    }

    private function generateInvoiceNo($type = 'item')
    {
        $prefix = match($type) {
            'printer' => 'PRI-',
            'item' => 'ITM-',
            default => 'INV-'
        };

        $sequenceName = 'sales_' . $type;
        
        // Use generic sequence generator with initialization capability
        $nextValue = \App\Models\Sequence::incrementSequence($sequenceName, function () use ($prefix) {
            // Initializer: Find the max existing invoice number to continue from if sequence is new
            $lastSale = SalesTransaction::where('invoice_no', 'like', $prefix . '%')
                ->orderBy('invoice_no', 'desc')
                ->first();
            
            if ($lastSale) {
                // Extract numeric part (e.g., ITM-00123 -> 123)
                $numericPart = substr($lastSale->invoice_no, strlen($prefix));
                return is_numeric($numericPart) ? (int)$numericPart : 0;
            }
            
            return 0;
        });

        return $prefix . str_pad($nextValue, 6, '0', STR_PAD_LEFT);
    }

    private function getLogoBase64()
    {
        $path = public_path('logo.png');
        if (file_exists($path)) {
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            return 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        // Try to fetch remote and base64 it to avoid Dompdf fetch issues
        try {
            $url = 'https://www.vismass.lk/wp-content/uploads/2023/12/vismass.png';
            $data = file_get_contents($url);
            if ($data !== false) {
                return 'data:image/png;base64,' . base64_encode($data);
            }
        } catch (\Exception $e) {
            // Log error or ignore
        }

        return '';
    }

    public function generateReceipt(SalesTransaction $sale)
    {
        if (!request()->user()->hasPermission('sales.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view sales.');
        }

        $sale->load(['items', 'cashier']);

        // Check for printer entry (items with serial numbers in StockInHand)
        // We verify via StockInHand entries for this sale that have serial numbers
        $stockRefNo = 'STK-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT);
        $printerEntries = StockInHand::where('RefNo', $stockRefNo)
                            ->where('TrnTyp', 'SAL')
                            ->whereNotNull('serial_number')
                            ->where('serial_number', '!=', '')
                            ->get();

        $isPrinterEntry = $printerEntries->count() > 0;

        // Map serial numbers to items if possible, for display in A5
        if ($isPrinterEntry) {
            foreach ($sale->items as $item) {
                // Find matching stock entry by product_id/ItemKy
                $stk = $printerEntries->where('ItemKy', $item->product_id)->first();
                if ($stk) {
                    $item->serial_number = $stk->serial_number;
                    $item->brand = $stk->brand;
                    $item->model = $stk->model;
                    $item->warranty = $stk->warranty;
                }
            }
        }

        if ($isPrinterEntry) {
             $html = $this->generateHalfA4Html($sale);
             $paper = 'a5';
             $orientation = 'landscape';
        } else {
             $html = $this->generatePosReceiptHtml($sale);
             // 80mm width, custom paper height
             $paper = [0, 0, 226.77, 1000]; 
             $orientation = 'portrait';
        }

        // Use DomPDF to generate PDF
        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $dompdf = new Dompdf($options);
        
        if (is_array($paper)) {
            $dompdf->setPaper($paper);
        } else {
            $dompdf->setPaper($paper, $orientation);
        }
        
        $dompdf->loadHtml($html);

        $dompdf->render();

        return $dompdf->stream('receipt-' . $sale->invoice_no . '.pdf', [
            'Attachment' => false
        ]);
    }

    public function generateInvoice(SalesTransaction $sale)
    {
        if (!request()->user()->hasPermission('sales.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view sales.');
        }

        $sale->load(['items', 'cashier']);

        // Check if the sale contains printers (items with serial_number, brand, and model)
        $hasPrinters = $sale->items->contains(function ($item) {
            return !empty($item->serial_number) && !empty($item->brand) && !empty($item->model);
        });

        // Use printer invoice template for printer sales, regular invoice for others
        $template = $hasPrinters ? 'sales.printer_invoice' : 'sales.invoice';

        return view($template, [
            'sale' => $sale,
        ]);
    }

    private function generateHalfA4Html(SalesTransaction $sale)
    {
        $company = \App\Models\Company::first();
        $logo = $this->getLogoBase64();

        $vatMultiplier = 1 + (($sale->vat_rate ?? 0) / 100);
        $isVatInvoice = $sale->is_vat_invoice;
        
        $itemsHtml = '';
        foreach ($sale->items as $item) {
            // Determine price to display based on VAT Invoice status
            $displayUnitPrice = $isVatInvoice ? $item->unit_price : ($item->unit_price * $vatMultiplier);
            $displayLineTotal = $isVatInvoice ? $item->line_total : ($item->line_total * $vatMultiplier);

            $itemsHtml .= '
                <tr>
                    <td style="border: 1px solid #000; padding: 5px;">' . ($item->item_code ?? 'N/A') . '</td>
                    <td style="border: 1px solid #000; padding: 5px;">
                        <div style="font-weight: bold;">' . $item->item_name . '</div>
                        <div style="font-size: 9px; margin-top: 2px;">
                            ' . ($item->brand ? 'Brand: ' . $item->brand . ' | ' : '') . '
                            ' . ($item->model ? 'Model: ' . $item->model . ' | ' : '') . '
                            ' . ($item->serial_number ? 'S/N: ' . $item->serial_number . ' | ' : '') . '
                            ' . ($item->warranty ? 'Warranty: ' . $item->warranty : '') . '
                        </div>
                        ' . ($item->batch_no ? '<div style="font-size: 8px; color: #555;">Batch: '.$item->batch_no.'</div>' : '') . '
                    </td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">' . number_format($item->quantity, 2) . '</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">' . number_format($displayUnitPrice, 2) . '</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">' . number_format($displayLineTotal, 2) . '</td>
                </tr>';
        }

        return '
        <html>
        <head>
            <style>
                @page { margin: 10px; }
                body { font-family: "Helvetica", sans-serif; font-size: 11px; margin: 0; padding: 15px; color: #333; }
                .header-table { width: 100%; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
                .company-name { font-size: 22px; font-weight: bold; color: #000; text-transform: uppercase; }
                .invoice-info { width: 100%; margin-bottom: 15px; }
                .invoice-info td { vertical-align: top; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .items-table th { background: #f2f2f2; border: 1px solid #000; padding: 6px; text-align: left; text-transform: uppercase; font-size: 10px; }
                .items-table td { border: 1px solid #000; padding: 5px; }
                .footer-section { width: 100%; }
                .totals-table { width: 250px; float: right; }
                .totals-table td { padding: 3px 0; }
                .total-amount { font-size: 16px; font-weight: bold; border-top: 1px double #000; border-bottom: 1px solid #000; }
                .signature-section { margin-top: 30px; width: 100%; }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td width="60%">
                        <div class="company-name">' . ($company->company_name ?? 'VISMASS PVT LTD') . '</div>
                        <div style="font-size: 10px;">
                            ' . ($company->address ?? '32, Ground Floor, Yakkala Park, Kandy Road, Yakkala.') . '<br>
                            Tel: ' . ($company->phone ?? '0332234300') . ' ' . ($company->email ? '| Email: '.$company->email : '') . '
                        </div>
                    </td>
                    <td width="40%" style="text-align: right; vertical-align: middle;">
                        ' . ($logo ? '<img src="' . $logo . '" style="height: 50px;">' : '') . '
                    </td>
                </tr>
            </table>

            <table class="invoice-info">
                <tr>
                    <td width="50%">
                        <strong>BILL TO:</strong><br>
                        <span style="font-size: 13px;">' . ($sale->customer_name ?: 'Walk-in Customer') . '</span><br>
                        ' . ($sale->customer_code ? 'Code: ' . $sale->customer_code : '') . '
                    </td>
                    <td width="50%" style="text-align: right;">
                        <span style="font-size: 16px; font-weight: bold;">SALES RECEIPT</span><br>
                        <strong>Invoice No:</strong> ' . $sale->invoice_no . '<br>
                        <strong>Date:</strong> ' . (is_string($sale->transaction_date) ? $sale->transaction_date : $sale->transaction_date->format('Y-m-d H:i')) . '<br>
                        <strong>Cashier:</strong> ' . ($sale->cashier->name ?? 'Admin') . '
                    </td>
                </tr>
            </table>

            <table class="items-table">
                <thead>
                    <tr>
                        <th width="15%">Item Code</th>
                        <th width="45%">Description</th>
                        <th width="10%" style="text-align: center;">Qty</th>
                        <th width="15%" style="text-align: right;">Unit Price</th>
                        <th width="15%" style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ' . $itemsHtml . '
                </tbody>
            </table>

            <div class="footer-section">
                <div style="float: left; width: 50%;">
                    <div style="margin-top: 5px;">
                        <strong>Payment Method:</strong> ' . strtoupper($sale->payment_mode ?? 'cash') . '<br>
                        ' . ($sale->is_vat_invoice && $company->vat_no ? '<strong>Company VAT:</strong> ' . $company->vat_no . '<br>' : '') . '
                    </div>
                </div>
                
                <table class="totals-table">
                    <tr>
                        <td>Subtotal</td>
                        <td style="text-align: right;">' . number_format($sale->is_vat_invoice ? $sale->subtotal : $sale->subtotal * $vatMultiplier, 2) . '</td>
                    </tr>
                    ' . ($sale->discount_amount > 0 ? '
                    <tr>
                        <td>Discount</td>
                        <td style="text-align: right; color: red;">-' . number_format($sale->is_vat_invoice ? $sale->discount_amount : $sale->discount_amount * $vatMultiplier, 2) . '</td>
                    </tr>' : '') . '
                    ' . ($sale->is_vat_invoice ? '
                    <tr>
                        <td>VAT (' . $sale->vat_rate . '%)</td>
                        <td style="text-align: right;">' . number_format($sale->tax_amount, 2) . '</td>
                    </tr>' : '') . '
                    <tr class="total-amount">
                        <td>GRAND TOTAL</td>
                        <td style="text-align: right;">' . number_format($sale->total_amount, 2) . '</td>
                    </tr>
                    <tr>
                        <td>Cash Paid</td>
                        <td style="text-align: right;">' . number_format($sale->cash_payment ?? $sale->total_amount, 2) . '</td>
                    </tr>
                    <tr>
                        <td>Balance</td>
                        <td style="text-align: right;">' . number_format($sale->balance_amount ?? 0, 2) . '</td>
                    </tr>
                </table>
                <div style="clear: both;"></div>
            </div>

            <table class="signature-section">
                <tr>
                    <td width="33%" style="text-align: center; border-top: 1px solid #000; padding-top: 5px;">Customer Signature</td>
                    <td width="33%"></td>
                    <td width="33%" style="text-align: center; border-top: 1px solid #000; padding-top: 5px;">Authorized Signature</td>
                </tr>
            </table>

            <div style="text-align: center; margin-top: 20px; font-size: 10px;">
                Thank you for your business! Goods once sold are not returnable.<br>
                *** Powered by UNITEC ***
            </div>
        </body>
        </html>';
    }

    public function previewReceipt(Request $request)
    {
        $data = $request->all();

        // Determine if printer entry logic applies
        $isPrinterEntry = false;
        if (isset($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $item) {
                if (!empty($item['serial_number'])) {
                    $isPrinterEntry = true;
                    break;
                }
            }
        }

        if ($isPrinterEntry) {
            $html = $this->generatePreviewHalfA4Html($data);
            $paper = 'a5';
            $orientation = 'landscape';
        } else {
            $html = $this->generatePreviewReceiptHtml($data);
             // 80mm width
             $paper = [0, 0, 226.77, 1000];
             $orientation = 'portrait';
        }

        // Use DomPDF to generate PDF
        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $dompdf = new Dompdf($options);
        
        if (is_array($paper)) {
            $dompdf->setPaper($paper);
        } else {
            $dompdf->setPaper($paper, $orientation);
        }
        
        $dompdf->loadHtml($html);

        $dompdf->render();

        return $dompdf->stream('receipt-preview.pdf', [
            'Attachment' => false
        ]);
    }

    private function generatePreviewHalfA4Html($data)
    {
        $company = \App\Models\Company::first();
        $logo = $this->getLogoBase64();

        $vatRate = $data['vat_rate'] ?? 0;
        $vatMultiplier = 1 + ($vatRate / 100);
        $isVatInvoice = $data['is_vat_invoice'] ?? false;
        
        $itemsHtml = '';
        foreach ($data['items'] ?? [] as $item) {
            $displayUnitPrice = $isVatInvoice ? ($item['unit_price'] ?? 0) : (($item['unit_price'] ?? 0) * $vatMultiplier);
            $displayTotal = $isVatInvoice ? ($item['total'] ?? 0) : (($item['total'] ?? 0) * $vatMultiplier);

            $itemsHtml .= '
                <tr>
                    <td style="border: 1px solid #000; padding: 5px;">' . ($item['item_code'] ?? 'N/A') . '</td>
                    <td style="border: 1px solid #000; padding: 5px;">
                        <div style="font-weight: bold;">' . $item['item_name'] . '</div>
                        <div style="font-size: 9px; margin-top: 2px;">
                            ' . (isset($item['brand']) ? 'Brand: ' . $item['brand'] . ' | ' : '') . '
                            ' . (isset($item['model']) ? 'Model: ' . $item['model'] . ' | ' : '') . '
                            ' . (isset($item['serial_number']) ? 'S/N: ' . $item['serial_number'] . ' | ' : '') . '
                            ' . (isset($item['warranty']) ? 'Warranty: ' . $item['warranty'] : '') . '
                        </div>
                        ' . ($item['batch_no'] ? '<div style="font-size: 8px; color: #555;">Batch: '.$item['batch_no'].'</div>' : '') . '
                    </td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">' . number_format($item['quantity'], 2) . '</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">' . number_format($displayUnitPrice, 2) . '</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">' . number_format($displayTotal, 2) . '</td>
                </tr>';
        }

        return '
        <html>
        <head>
            <style>
                @page { margin: 10px; }
                body { font-family: "Helvetica", sans-serif; font-size: 11px; margin: 0; padding: 15px; color: #333; }
                .header-table { width: 100%; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
                .company-name { font-size: 22px; font-weight: bold; color: #000; text-transform: uppercase; }
                .invoice-info { width: 100%; margin-bottom: 15px; }
                .invoice-info td { vertical-align: top; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .items-table th { background: #f2f2f2; border: 1px solid #000; padding: 6px; text-align: left; text-transform: uppercase; font-size: 10px; }
                .items-table td { border: 1px solid #000; padding: 5px; }
                .footer-section { width: 100%; }
                .totals-table { width: 250px; float: right; }
                .totals-table td { padding: 3px 0; }
                .total-amount { font-size: 16px; font-weight: bold; border-top: 1px double #000; border-bottom: 1px solid #000; }
                .signature-section { margin-top: 30px; width: 100%; }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td width="60%">
                        <div class="company-name">' . ($company->company_name ?? 'VISMASS PVT LTD') . '</div>
                        <div style="font-size: 10px;">
                            ' . ($company->address ?? '32, Ground Floor, Yakkala Park, Kandy Road, Yakkala.') . '<br>
                            Tel: ' . ($company->phone ?? '0332234300') . '
                        </div>
                    </td>
                    <td width="40%" style="text-align: right; vertical-align: middle;">
                        <span style="font-size: 12px; color: #999;">PREVIEW ONLY</span><br>
                        ' . ($logo ? '<img src="' . $logo . '" style="height: 50px;">' : '') . '
                    </td>
                </tr>
            </table>

            <table class="invoice-info">
                <tr>
                    <td width="50%">
                        <strong>BILL TO:</strong><br>
                        <span style="font-size: 13px;">' . ($data['customer_name'] ?: 'Walk-in Customer') . '</span><br>
                        ' . (($data['customer_code'] ?? '') ? 'Code: ' . $data['customer_code'] : '') . '
                    </td>
                    <td width="50%" style="text-align: right;">
                        <span style="font-size: 16px; font-weight: bold;">SALES RECEIPT</span><br>
                        <strong>Invoice No:</strong> ' . ($data['invoice_no'] ?? 'PREVIEW') . '<br>
                        <strong>Date:</strong> ' . ($data['transaction_date'] ?? date('Y-m-d')) . '<br>
                        <strong>Cashier:</strong> ' . (Auth::user()->name ?? 'Admin') . '
                    </td>
                </tr>
            </table>

            <table class="items-table">
                <thead>
                    <tr>
                        <th width="15%">Item Code</th>
                        <th width="45%">Description</th>
                        <th width="10%" style="text-align: center;">Qty</th>
                        <th width="15%" style="text-align: right;">Unit Price</th>
                        <th width="15%" style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ' . $itemsHtml . '
                </tbody>
            </table>

            <div class="footer-section">
                <div style="float: left; width: 50%;">
                    <div style="margin-top: 5px;">
                        <strong>Payment Method:</strong> ' . strtoupper($data['payment_mode'] ?? 'cash') . '<br>
                    </div>
                </div>
                
                <table class="totals-table">
                    <tr>
                        <td>Subtotal</td>
                        <td style="text-align: right;">' . number_format($isVatInvoice ? ($data['subtotal'] ?? 0) : ($data['subtotal'] ?? 0) * $vatMultiplier, 2) . '</td>
                    </tr>
                    ' . (($data['discount_amount'] ?? 0) > 0 ? '
                    <tr>
                        <td>Discount</td>
                        <td style="text-align: right; color: red;">-' . number_format($isVatInvoice ? ($data['discount_amount'] ?? 0) : ($data['discount_amount'] ?? 0) * $vatMultiplier, 2) . '</td>
                    </tr>' : '') . '
                    ' . ($isVatInvoice ? '
                    <tr>
                        <td>VAT (' . $vatRate . '%)</td>
                        <td style="text-align: right;">' . number_format($data['tax_amount'] ?? 0, 2) . '</td>
                    </tr>' : '') . '
                    <tr class="total-amount">
                        <td>GRAND TOTAL</td>
                        <td style="text-align: right;">' . number_format($data['total_amount'] ?? 0, 2) . '</td>
                    </tr>
                </table>
                <div style="clear: both;"></div>
            </div>

            <div style="text-align: center; margin-top: 40px; font-size: 10px;">
                *** This is a preview version of the bill ***
            </div>
        </body>
        </html>';
    }

    private function generatePosReceiptHtml(SalesTransaction $sale, $widthMm = 80)
    {
        $company = \App\Models\Company::first();
        $companyName = $company ? $company->company_name : 'Your Company Name';
        $companyAddress = $company ? $company->address : '123 Main Street, City, Country';
        $companyPhone = $company ? $company->phone : '+1-234-567-8900';
        $companyVatNo = $company ? $company->vat_no : '';

        $customer = \App\Models\Customer::where('AdrCd', $sale->customer_code)->first();
        $customerVatNo = $customer ? $customer->vat_no : '';
        $isVatInvoice = $sale->is_vat_invoice;

        $contentWidth = $widthMm - 4; // 2mm margin on each side

        // Set Sri Lankan timezone
        $sriLankaTime = new \DateTime('now', new \DateTimeZone('Asia/Colombo'));

        $billTitle = 'SALES RECEIPT';

        $html = '
        <style>
            @page {
                margin: 0;
            }
            body {
                font-family: Courier, monospace;
                font-size: 11px;
                margin: 0;
                padding: 10px;
                background-color: #fff;
                width: ' . ($widthMm - 10) . 'mm;
                line-height: 1.2;
                color: #000;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            
            .header h1 {
                margin: 0;
                font-size: 18px;
                text-transform: uppercase;
                margin-bottom: 2px;
            }
            .header p {
                margin: 0;
                font-size: 10px;
            }
            .bill-title {
                margin: 10px 0;
                font-size: 14px;
                font-weight: bold;
                text-align: left;
            }
            .dotted-line {
                border-top: 1px dashed #000;
                margin: 5px 0;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
            }
            .items-table th {
                border-bottom: 1px dashed #000;
                padding-bottom: 4px;
                text-align: left;
                font-weight: bold;
                font-size: 10px;
            }
            .info-block {
                margin-bottom: 8px;
            }
            .info-row {
                width: 100%;
                margin-bottom: 2px;
                clear: both;
            }
            .info-label { float: left; }
            .info-value { float: right; }
            .total-block {
                font-weight: bold;
                margin-top: 4px;
            }
            .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 10px;
            }
        </style>

        <div class="receipt-box">
            <div class="header text-center">
                <center><img src="' . $this->getLogoBase64() . '" style="height: 60px; width: auto; margin-bottom: 5px;"></center>
                <h1>' . $companyName . '</h1>
                <p>' . $companyAddress . '</p>
                <div style="height: 10px;"></div>
                <p>Tel: ' . $companyPhone . '</p>
                <div style="height: 10px;"></div>
            </div>

            <div class="bill-title">' . $billTitle . '</div>

            <div class="info-block">
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">' . $sriLankaTime->format('n/j/Y, g:i:s A') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Invoice No:</span>
                    <span class="info-value">' . $sale->invoice_no . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cashier:</span>
                    <span class="info-value">' . ($sale->cashier->name ?? 'Admin') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Customer:</span>
                    <span class="info-value">' . ($sale->customer_name ?: 'Walk-in Customer') . '</span>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>';

        $vatMultiplier = 1 + ($sale->vat_rate / 100);
        foreach ($sale->items as $item) {
            $unitPriceInclusive = $item->unit_price * $vatMultiplier;
            $totalInclusive = $item->line_total * $vatMultiplier;

            $html .= '
                    <tr>
                        <td colspan="4" style="padding-top: 4px;">' . substr($item->item_name, 0, 30) . '</td>
                    </tr>';
            
            // Add warranty information if available
            if ($item->warranty) {
                $html .= '
                    <tr>
                        <td colspan="4" style="font-size: 9px; color: #666; padding-left: 5px;">Warranty: ' . $item->warranty . '</td>
                    </tr>';
            }
            
            $html .= '
                    <tr>
                        <td></td>
                        <td class="text-right">' . number_format($item->quantity, 0) . '</td>
                        <td class="text-right">' . number_format($unitPriceInclusive, 2) . '</td>
                        <td class="text-right">' . number_format($totalInclusive, 2) . '</td>
                    </tr>';
        }

        $html .= '
                </tbody>
            </table>

            <div class="info-block">
                <div class="info-row">
                    <span class="info-label">SUBTOTAL:</span>
                    <span class="info-value">' . number_format($isVatInvoice ? $sale->subtotal : $sale->subtotal * $vatMultiplier, 2) . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">DISCOUNT:</span>
                    <span class="info-value">-' . number_format($isVatInvoice ? ($sale->discount_amount ?? 0) : ($sale->discount_amount ?? 0) * $vatMultiplier, 2) . '</span>
                </div>';

        if ($isVatInvoice) {
            $html .= '
                <div class="info-row">
                    <span class="info-label">VAT (' . number_format($sale->vat_rate, 0) . '%):</span>
                    <span class="info-value">' . number_format($sale->tax_amount ?? 0, 2) . '</span>
                </div>';
        }

        $html .= '
                <div class="info-row" style="margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px;">
                    <span class="info-label font-bold" style="font-size: 14px;">TOTAL:</span>
                    <span class="info-value font-bold" style="font-size: 14px;">' . number_format($sale->total_amount, 2) . '</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Pay Mode:</span>
                    <span class="info-value uppercase">' . ($sale->payment_mode ?? 'cash') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cash Paid:</span>
                    <span class="info-value">' . number_format($sale->cash_payment ?? $sale->total_amount, 2) . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Balance:</span>
                    <span class="info-value">' . number_format($sale->balance_amount ?? 0, 2) . '</span>
                </div>
            </div>

            <div class="footer">
                ' . ($isVatInvoice ? '
                <div style="text-align: left; margin-bottom: 15px;">
                    <div class="info-row">
                        <span class="info-label">VAT Rate:</span>
                        <span class="info-value">' . number_format($sale->vat_rate, 0) . '%</span>
                    </div>' . ($companyVatNo ? '
                    <div class="info-row">
                        <span class="info-label">Company VAT:</span>
                        <span class="info-value">' . $companyVatNo . '</span>
                    </div>' : '') . '
                    <div class="info-row">
                        <span class="info-label">Customer VAT:</span>
                        <span class="info-value">' . ($customerVatNo ?: '') . '</span>
                    </div>
                </div>' : '') . '
                Thank you for your business!<br>
                *** Powered by UNITEC ***
            </div>
        </div>';

        return $html;
    }

    private function generatePreviewReceiptHtml($data, $widthMm = 80)
    {
        $company = \App\Models\Company::first();
        $companyName = $company ? $company->company_name : 'VISMASS PVT LTD';
        $companyAddress = $company ? $company->address : '32, Ground Floor, Yakkala Park, Kandy Road, Yakkala.';
        $companyPhone = $company ? $company->phone : '0332234300';
        $companyVatNo = $company ? $company->vat_no : '';

        $isVatInvoice = isset($data['is_vat_invoice']) && $data['is_vat_invoice'];
        $customerVatNo = $data['customer_vat_no'] ?? '';
        $vatRate = $data['vat_rate'] ?? 0;

        $contentWidth = $widthMm - 4; // 2mm margin on each side

        // Set Sri Lankan timezone
        $sriLankaTime = new \DateTime('now', new \DateTimeZone('Asia/Colombo'));

        $billTitle = 'SALES RECEIPT';

        $html = '
        <style>
            @page {
                margin: 0;
            }
            body {
                font-family: Courier, monospace;
                font-size: 11px;
                margin: 0;
                padding: 10px;
                background-color: #fff;
                width: ' . ($widthMm - 10) . 'mm;
                line-height: 1.2;
                color: #000;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            
            .header h1 {
                margin: 0;
                font-size: 18px;
                text-transform: uppercase;
                margin-bottom: 2px;
            }
            .header p {
                margin: 0;
                font-size: 10px;
            }
            .bill-title {
                margin: 10px 0;
                font-size: 14px;
                font-weight: bold;
                text-align: left;
            }
            .dotted-line {
                border-top: 1px dashed #000;
                margin: 5px 0;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
            }
            .items-table th {
                border-bottom: 1px dashed #000;
                padding-bottom: 4px;
                text-align: left;
                font-weight: bold;
                font-size: 10px;
            }
            .info-block {
                margin-bottom: 8px;
            }
            .info-row {
                width: 100%;
                margin-bottom: 2px;
                clear: both;
            }
            .info-label { float: left; }
            .info-value { float: right; }
            .total-block {
                font-weight: bold;
                margin-top: 4px;
            }
            .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 10px;
            }
        </style>

        <div class="receipt-box">
            <div class="header text-center">
                <center><img src="' . $this->getLogoBase64() . '" style="height: 60px; width: auto; margin-bottom: 5px;"></center>
                <h1>' . $companyName . '</h1>
                <p>' . $companyAddress . '</p>
                <div style="height: 10px;"></div>
                <p>Tel: ' . $companyPhone . '</p>
                <div style="height: 10px;"></div>
            </div>

            <div class="bill-title">' . $billTitle . '</div>

            <div class="info-block">
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">' . $sriLankaTime->format('n/j/Y, g:i:s A') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Invoice No:</span>
                    <span class="info-value">' . ($data['invoice_no'] ?? '(PREVIEW)') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cashier:</span>
                    <span class="info-value">' . (Auth::user()->name ?? 'Admin') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Customer:</span>
                    <span class="info-value">' . (($data['customer_name'] ?? '') ?: 'Walk-in Customer') . '</span>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>';

        if (isset($data['items']) && is_array($data['items'])) {
            $vatMultiplier = 1 + ($vatRate / 100);
            foreach ($data['items'] as $item) {
                $unitPriceInclusive = ($item['unit_price'] ?? 0) * $vatMultiplier;
                $totalInclusive = ($item['total'] ?? 0) * $vatMultiplier;

                $html .= '
                    <tr>
                        <td colspan="4" style="padding-top: 4px;">' . substr($item['item_name'] ?? '', 0, 30) . '</td>
                    </tr>';
                
                // Add warranty information if available
                if (isset($item['warranty']) && $item['warranty']) {
                    $html .= '
                    <tr>
                        <td colspan="4" style="font-size: 9px; color: #666; padding-left: 5px;">Warranty: ' . $item['warranty'] . '</td>
                    </tr>';
                }
                
                $html .= '
                    <tr>
                        <td></td>
                        <td class="text-right">' . number_format($item['quantity'] ?? 0, 0) . '</td>
                        <td class="text-right">' . number_format($unitPriceInclusive, 2) . '</td>
                        <td class="text-right">' . number_format($totalInclusive, 2) . '</td>
                    </tr>';
            }
        }

        $html .= '
                </tbody>
            </table>

            <div class="info-block">
                <div class="info-row">
                    <span class="info-label">SUBTOTAL:</span>
                    <span class="info-value">' . number_format($isVatInvoice ? ($data['subtotal'] ?? 0) : ($data['subtotal'] ?? 0) * $vatMultiplier, 2) . '</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">DISCOUNT:</span>
                    <span class="info-value">-' . number_format($isVatInvoice ? ($data['discount_amount'] ?? 0) : ($data['discount_amount'] ?? 0) * $vatMultiplier, 2) . '</span>
                </div>';

        if ($isVatInvoice) {
            $html .= '
                <div class="info-row">
                    <span class="info-label">VAT (' . number_format($vatRate, 0) . '%):</span>
                    <span class="info-value">' . number_format($data['tax_amount'] ?? 0, 2) . '</span>
                </div>';
        }

        $html .= '
                <div class="info-row" style="margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px;">
                    <span class="info-label font-bold" style="font-size: 14px;">TOTAL:</span>
                    <span class="info-value font-bold" style="font-size: 14px;">' . number_format($data['total_amount'] ?? 0, 2) . '</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Pay Mode:</span>
                    <span class="info-value uppercase">' . ($data['payment_mode'] ?? 'cash') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cash Paid:</span>
                    <span class="info-value">' . number_format($data['cash_payment'] ?? ($data['total_amount'] ?? 0), 2) . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Balance:</span>
                    <span class="info-value">' . number_format($data['balance_amount'] ?? 0, 2) . '</span>
                </div>
            </div>

            <div class="footer">
                ' . ($isVatInvoice ? '
                <div style="text-align: left; margin-bottom: 15px;">
                    <div class="info-row">
                        <span class="info-label">VAT Rate:</span>
                        <span class="info-value">' . number_format($vatRate, 0) . '%</span>
                    </div>' . ($companyVatNo ? '
                    <div class="info-row">
                        <span class="info-label">Company VAT:</span>
                        <span class="info-value">' . $companyVatNo . '</span>
                    </div>' : '') . '
                    <div class="info-row">
                        <span class="info-label">Customer VAT:</span>
                        <span class="info-value">' . ($data['customer_vat_no'] ?? '') . '</span>
                    </div>
                </div>' : '') . '
                Thank you for your business!<br>
                *** Powered by UNITEC ***
            </div>
        </div>';

        return $html;
    }

    private function mmToPoints($mm)
    {
        // Convert millimeters to points (1 mm = 2.83465 points)
        return $mm * 2.83465;
    }
}
