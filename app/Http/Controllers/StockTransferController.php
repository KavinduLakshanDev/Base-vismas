<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        if (!request()->user()->hasPermission('stock.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view stock transfers.');
        }

        // Get company_code from authenticated user or session
        $companyCode = Auth::user()->company_code ?? session('company_code');

        $query = StockTransfer::where('company_code', $companyCode)
            ->where('item_id', '!=', 0) // Filter invalid transfers on backend
            ->with(['fromSection', 'toSection', 'item']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('transfer_number', 'LIKE', "%{$search}%")
                  ->orWhere('notes', 'LIKE', "%{$search}%")
                  ->orWhereHas('item', function ($q) use ($search) {
                      $q->where('ItmNm', 'LIKE', "%{$search}%")
                        ->orWhere('ItemCode', 'LIKE', "%{$search}%");
                  })
                  ->orWhereHas('fromSection', function ($q) use ($search) {
                      $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('section_code', 'LIKE', "%{$search}%");
                  })
                  ->orWhereHas('toSection', function ($q) use ($search) {
                      $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('section_code', 'LIKE', "%{$search}%");
                  });
            });
        }

        $stockTransfers = $query->orderBy('transfer_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Ensure relationships are properly included in the response
        $stockTransfers->getCollection()->transform(function ($transfer) {
            $transfer->fromSection = $transfer->fromSection ? [
                'name' => $transfer->fromSection->name,
                'section_code' => $transfer->fromSection->section_code,
            ] : null;
            $transfer->toSection = $transfer->toSection ? [
                'name' => $transfer->toSection->name,
                'section_code' => $transfer->toSection->section_code,
            ] : null;
            $transfer->item = $transfer->item ? [
                'ItemCode' => $transfer->item->ItemCode,
                'ItmNm' => $transfer->item->ItmNm,
            ] : null;
            return $transfer;
        });

        return Inertia::render('StockTransfer/Index', [
            'stockTransfers' => $stockTransfers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        if (!request()->user()->hasPermission('stock.transfer')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create stock transfers.');
        }

        // Get company_code from authenticated user or session
        $companyCode = Auth::user()->company_code ?? session('company_code');

        // Removed company_code filter for sections as per user request to show all 5 core sections (Service, Import, etc.)
        return Inertia::render('StockTransfer/Create', [
            'sections' => Section::orderByRaw('is_main_stock DESC, name ASC')
                ->get(),
            'items' => Product::where('itemmaster.company_code', $companyCode)
                ->where('itemmaster.fInAct', false)
                ->leftJoin('item_price_det', function($join) use ($companyCode) {
                    $join->on('itemmaster.ItmKy', '=', 'item_price_det.ItmKy')
                         ->where('item_price_det.company_code', '=', $companyCode)
                         ->where('item_price_det.fInAct', '=', false);
                })
                ->select('itemmaster.ItmKy', 'itemmaster.ItemCode', 'itemmaster.ItmNm', 'item_price_det.CosPri as cost_price')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('stock.transfer')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create stock transfers.');
        }

        // Get company_code from authenticated user or session
        $companyCode = Auth::user()->company_code ?? session('company_code');

        $validated = $request->validate([
            'from_section_code' => 'required|exists:sections,section_code',
            'to_section_code' => 'required|exists:sections,section_code|different:from_section_code',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:itemmaster,ItmKy',
            'items.*.stock_id' => 'nullable|exists:stock_in_hand,TableKy', // Make nullable for backward compatibility but UI will enforce
            'items.*.quantity' => 'required|numeric|min:0.0001', // Allow small decimal quantities
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        // Additional validation: ensure sections exist
        $fromSection = Section::where('section_code', $validated['from_section_code'])
            ->first();
        $toSection = Section::where('section_code', $validated['to_section_code'])
            ->first();

        if (!$fromSection) {
            return redirect()->back()->withErrors(['from_section_code' => 'Source section not found.']);
        }
        if (!$toSection) {
            return redirect()->back()->withErrors(['to_section_code' => 'Destination section not found.']);
        }

        try {
            return DB::transaction(function () use ($validated, $companyCode) {
                $errors = [];

                // Generate sequential transfer number (Thread-safe)
                // This uses a database lock to ensure no duplicate numbers are generated, even under high concurrency
                $sequenceValue = \App\Models\Sequence::incrementSequence('STOCK_TRANSFER');
                $transferNumber = 'TRF-' . date('Ymd') . '-' . str_pad($sequenceValue, 5, '0', STR_PAD_LEFT);

                // Group items by item_id to handle duplicate items correctly
                $groupedItems = [];
                foreach ($validated['items'] as $index => $itemData) {
                    $itemId = $itemData['item_id'];
                    if (!isset($groupedItems[$itemId])) {
                        $groupedItems[$itemId] = [
                            'total_quantity' => 0,
                            'indices' => []
                        ];
                    }
                    $groupedItems[$itemId]['total_quantity'] += $itemData['quantity'];
                    $groupedItems[$itemId]['indices'][] = $index;
                }

                // Validate each item
                foreach ($validated['items'] as $index => $itemData) {
                    $itemId = $itemData['item_id'];
                    $stockId = $itemData['stock_id'] ?? null;
                    $quantity = $itemData['quantity'];

                    // Ensure product belongs to the user's company
                    $item = Product::where('itemmaster.ItmKy', $itemId)
                        ->where('itemmaster.company_code', $companyCode)
                        ->leftJoin('item_price_det', function($join) use ($companyCode) {
                            $join->on('itemmaster.ItmKy', '=', 'item_price_det.ItmKy')
                                 ->where('item_price_det.company_code', '=', $companyCode)
                                 ->where('item_price_det.fInAct', '=', false);
                        })
                        ->select('itemmaster.*', 'item_price_det.CosPri as cost_price')
                        ->first();

                    if (!$item) {
                        $errors["items.{$index}.item_id"] = 'Item not found or does not belong to your company.';
                        continue;
                    }

                    // Check specific batch stock if stock_id is provided
                    if ($stockId) {
                        $batchStock = DB::table('stock_in_hand')
                            ->where('TableKy', $stockId)
                            ->first();

                        if (!$batchStock) {
                            $errors["items.{$index}.stock_id"] = 'Selected batch not found in source section.';
                            continue;
                        }

                        // Calculate REAL available quantity by summing ledger entries for this batch
                        $availableQty = DB::table('stock_in_hand')
                            ->where('company_code', $companyCode)
                            ->where('section_code', $validated['from_section_code'])
                            ->where('ItemKy', $itemId)
                            ->where('batch_no', $batchStock->batch_no)
                            ->lockForUpdate()
                            ->sum(DB::raw('Qty + COALESCE(FreeQty, 0)'));

                        if ($quantity > $availableQty) {
                            $errors["items.{$index}.quantity"] = 'Insufficient stock in selected batch. Available: ' . number_format($availableQty, 2);
                        }
                    } else {
                        // Fallback to total stock check if no batch selected (legacy behavior)
                        $availableStock = DB::table('stock_in_hand')
                            ->where('company_code', $companyCode)
                            ->where('section_code', $validated['from_section_code'])
                            ->where('ItemKy', $itemId)
                            ->lockForUpdate()
                            ->sum(DB::raw('Qty + COALESCE(FreeQty, 0)'));

                        if ($quantity > $availableStock) {
                            $errors["items.{$index}.quantity"] = 'Insufficient total stock. Available: ' . number_format($availableStock, 2);
                        }
                    }
                }

                if (!empty($errors)) {
                    throw new \Exception('Validation failed: ' . json_encode($errors));
                }

                // Create transfers and execute them atomically
                $firstTransferId = null;
                foreach ($validated['items'] as $itemData) {
                    $item = Product::where('itemmaster.ItmKy', $itemData['item_id'])
                        ->where('itemmaster.company_code', $companyCode)
                        ->leftJoin('item_price_det', function($join) use ($companyCode) {
                            $join->on('itemmaster.ItmKy', '=', 'item_price_det.ItmKy')
                                 ->where('item_price_det.company_code', '=', $companyCode)
                                 ->where('item_price_det.fInAct', '=', false);
                        })
                        ->select('itemmaster.*', 'item_price_det.CosPri as cost_price')
                        ->first();

                    // Find the original inward stock record
                    $sourceStock = null;
                    if (!empty($itemData['stock_id'])) {
                        $sourceStock = DB::table('stock_in_hand')
                            ->where('TableKy', $itemData['stock_id'])
                            ->first();
                    }

                    // Fallback if no stock_id provided
                    if (!$sourceStock) {
                        $sourceStock = DB::table('stock_in_hand')
                            ->where('company_code', $companyCode)
                            ->where('section_code', $validated['from_section_code'])
                            ->where('ItemKy', $itemData['item_id'])
                            ->whereRaw('(Qty + COALESCE(FreeQty, 0)) > 0') // Prefer stock with quantity
                            ->orderBy('OrdDate', 'asc') // FIFO
                            ->first();
                    }

                    if (!$sourceStock) {
                        throw new \Exception("No stock records found for item {$itemData['item_id']} in source section.");
                    }

                    $transfer = StockTransfer::create([
                        'transfer_number' => $transferNumber,
                        'from_section_code' => $validated['from_section_code'],
                        'to_section_code' => $validated['to_section_code'],
                        'item_id' => $itemData['item_id'],
                        'stock_id' => $sourceStock->TableKy,
                        'quantity' => $itemData['quantity'],
                        'cost_price' => $sourceStock->CosPri ?? $item->cost_price ?? 0, // Use batch cost price
                        'transfer_date' => $validated['transfer_date'],
                        'notes' => $validated['notes'],
                        'company_code' => $companyCode,
                        'batch_no' => $sourceStock->batch_no,
                        'brand' => $sourceStock->brand,
                        'model' => $sourceStock->model,
                        'serial_number' => $sourceStock->serial_number,
                        'warranty' => $sourceStock->warranty,
                    ]);

                    // Save the first transfer ID for PDF download
                    if ($firstTransferId === null) {
                        $firstTransferId = $transfer->id;
                    }

                    // Execute transfer by inserting new IN and OUT rows
                    $transfer->executeTransfer();
                }

                return redirect()->back()->with('success', 'Stock transferred successfully.')->with('transfer_id', $firstTransferId);
            });
        } catch (\Exception $e) {
            $message = $e->getMessage();
            if (str_starts_with($message, 'Validation failed: ')) {
                $errors = json_decode(str_replace('Validation failed: ', '', $message), true);
                return redirect()->back()->withErrors($errors);
            } else {
                return redirect()->back()->withErrors(['general' => $message]);
            }
        }
    }

    public function getProductStock(Request $request): JsonResponse
    {
        if (!request()->user()->hasPermission('stock.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $itemId = $request->get('item_id');
            $sectionCode = $request->get('section_code');
            $companyCode = Auth::user()->company_code ?? session('company_code');

            if (!$itemId || !$sectionCode) {
                return response()->json([
                    'stock' => 0,
                    'batches' => [],
                    'error' => 'Item ID and section code are required'
                ], 400);
            }

            // Get all available stock batches with positive quantity
            $batches = DB::table('stock_in_hand as s')
                ->where('s.company_code', $companyCode)
                ->where('s.section_code', $sectionCode)
                ->where('s.ItemKy', $itemId)
                ->select(
                    DB::raw('MAX(s.TableKy) as id'),
                    's.batch_no',
                    DB::raw('MIN(s.OrdDate) as date'),
                    DB::raw('SUM(s.Qty) + SUM(COALESCE(s.FreeQty, 0)) as quantity')
                )
                ->selectSub(function ($query) use ($companyCode) {
                    $query->from('item_price_det')
                        ->select('CosPri')
                        ->whereColumn('ItmKy', 's.ItemKy')
                        ->whereColumn('batch_no', 's.batch_no')
                        ->where('company_code', $companyCode)
                        ->where('fInAct', false)
                        ->limit(1);
                }, 'cost_price')
                ->groupBy('s.batch_no', 's.ItemKy')
                ->having('quantity', '>', 0)
                ->orderBy('date', 'asc') // FIFO
                ->get();

            // Transform batches to numeric values
            $batches->transform(function ($batch) {
                return [
                    'id' => $batch->id,
                    'batch_no' => $batch->batch_no,
                    'cost_price' => (float) ($batch->cost_price ?? 0),
                    'date' => $batch->date,
                    'quantity' => (float) $batch->quantity,
                ];
            });

            $totalStock = $batches->sum('quantity');

            return response()->json([
                'stock' => (float) $totalStock,
                'batches' => $batches
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'stock' => 0,
                'batches' => [],
                'error' => 'Failed to retrieve stock information: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadPdf(Request $request)
    {
        if (!request()->user()->hasPermission('stock.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view stock transfers.');
        }

        try {
            $companyCode = Auth::user()->company_code ?? session('company_code');
            $user = Auth::user();

            // Parse items data from request
            $items = $request->get('items', []);
            $fromSectionCode = $request->get('from_section_code');
            $toSectionCode = $request->get('to_section_code');
            $transferDate = $request->get('transfer_date');
            $notes = $request->get('notes', '');

            // Get section information
            $fromSection = Section::where('section_code', $fromSectionCode)->first();
            $toSection = Section::where('section_code', $toSectionCode)->first();
            $company = $user->company ?? Company::first();

            // Process items for PDF with details
            $processedItems = [];
            $totalCostValue = 0;

            foreach ($items as $itemData) {
                if (empty($itemData['item_id']) || empty($itemData['quantity'])) {
                    continue;
                }

                $item = Product::where('itemmaster.ItmKy', $itemData['item_id'])
                    ->where('itemmaster.company_code', $companyCode)
                    ->leftJoin('item_price_det', function($join) use ($companyCode) {
                        $join->on('itemmaster.ItmKy', '=', 'item_price_det.ItmKy')
                             ->where('item_price_det.company_code', '=', $companyCode)
                             ->where('item_price_det.fInAct', '=', false);
                    })
                    ->select('itemmaster.ItmKy', 'itemmaster.ItemCode', 'itemmaster.ItmNm', 'item_price_det.CosPri as cost_price')
                    ->first();

                if ($item) {
                    $quantity = floatval($itemData['quantity']);
                    
                    // Fetch batch info if stock_id is provided
                    $batchNo = 'N/A';
                    $batchCostPrice = null;
                    
                    if (!empty($itemData['stock_id'])) {
                        $batchInfo = DB::table('stock_in_hand')
                            ->where('TableKy', $itemData['stock_id'])
                            ->select('batch_no')
                            ->first();
                        
                        if ($batchInfo) {
                            $batchNo = $batchInfo->batch_no;
                            
                            // Find cost price from price details for this batch
                            $priceDetail = DB::table('item_price_det')
                                ->where('ItmKy', $item->ItmKy)
                                ->where('batch_no', $batchNo)
                                ->where('company_code', $companyCode)
                                ->select('CosPri')
                                ->first();
                                
                            if ($priceDetail) {
                                $batchCostPrice = $priceDetail->CosPri;
                            }
                        }
                    }

                    // Use batch cost price if available, otherwise item cost price
                    $costPrice = floatval($batchCostPrice ?? $item->cost_price ?? 0);
                    $totalValue = $quantity * $costPrice;

                    $processedItems[] = [
                        'item_code' => $item->ItemCode,
                        'item_name' => $item->ItmNm,
                        'batch_no' => $batchNo,
                        'quantity' => $quantity,
                        'cost_price' => $costPrice,
                        'total_value' => $totalValue,
                    ];

                    $totalCostValue += $totalValue;
                }
            }

            // Prepare data for PDF
            $data = [
                'company_name' => $company ? $company->name : 'Company',
                'transfer_number' => 'PENDING', // Default for preview
                'transfer_date' => $transferDate,
                'from_section' => $fromSection ? $fromSection->name : 'Unknown',
                'to_section' => $toSection ? $toSection->name : 'Unknown',
                'items' => $processedItems,
                'total_cost_value' => $totalCostValue,
                'notes' => $notes,
                'generated_at' => now()->format('d M Y, h:i A'),
                'generated_by' => $user->username ?? $user->name ?? 'System',
            ];

            // Set PDF options
            $options = [
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'enable_unicode' => true,
            ];

            // Generate PDF
            $pdf = Pdf::loadView('stock_transfer_pdf', $data);
            $pdf->setOptions($options);
            $pdf->setPaper('A4', 'portrait');

            // Generate filename with timestamp
            $filename = 'stock-transfer-preview-' . date('Y-m-d-H-i-s') . '.pdf';

            // Return PDF download
            return $pdf->download($filename);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('PDF Download Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    public function downloadPdfById(StockTransfer $stockTransfer)
    {
        if (!request()->user()->hasPermission('stock.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view stock transfers.');
        }

        try {
            $user = Auth::user();
            $company = $user->company ?? Company::first(); // Or fetch by company_code

            $stockTransfer->load(['fromSection', 'toSection', 'item']);

            // Fetch ALL transfers with the same transfer_number
            $transferNumber = $stockTransfer->transfer_number;
            $allTransfers = StockTransfer::where('transfer_number', $transferNumber)
                ->with(['item'])
                ->get();

            // Process all items in this transfer
            $processedItems = [];
            $totalCostValue = 0;

            foreach ($allTransfers as $transfer) {
                $itemValue = $transfer->quantity * $transfer->cost_price;
                $processedItems[] = [
                    'item_code' => $transfer->item->ItemCode ?? 'N/A',
                    'item_name' => $transfer->item->ItmNm ?? 'N/A',
                    'batch_no' => $transfer->batch_no ?? 'N/A',
                    'quantity' => $transfer->quantity,
                    'cost_price' => $transfer->cost_price,
                    'total_value' => $itemValue,
                ];
                $totalCostValue += $itemValue;
            }

            $data = [
                'company_name' => $company ? $company->name : 'Company',
                'transfer_number' => $stockTransfer->transfer_number ?? 'N/A',
                'transfer_date' => $stockTransfer->transfer_date,
                'from_section' => $stockTransfer->fromSection->name ?? $stockTransfer->from_section_code,
                'to_section' => $stockTransfer->toSection->name ?? $stockTransfer->to_section_code,
                'items' => $processedItems,
                'total_cost_value' => $totalCostValue,
                'notes' => $stockTransfer->notes,
                'generated_at' => now()->format('d M Y, h:i A'),
                'generated_by' => $user->username ?? $user->name ?? 'System',
            ];

            $pdf = Pdf::loadView('stock_transfer_pdf', $data);
            $pdf->setPaper('A4', 'portrait');

            $filename = 'stock-transfer-' . ($stockTransfer->transfer_number ?? $stockTransfer->id) . '.pdf';

            return $pdf->download($filename);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('PDF Download By ID Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF'], 500);
        }
    }
}