<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\StockInHand;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class PrinterTransferController extends Controller
{
    public function index()
    {
        if (!request()->user()->hasPermission('printing.transfers.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view printer transfers.');
        }

        // Get company_code from authenticated user or session
        $companyCode = Auth::user()->company_code ?? session('company_code');

        $stockTransfers = StockTransfer::where('company_code', $companyCode)
            ->with(['fromSection', 'toSection', 'item'])
            ->orderBy('transfer_date', 'desc')
            ->paginate(15);

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

        return Inertia::render('PrinterTransfer/Index', [
            'stockTransfers' => $stockTransfers,
        ]);
    }

    public function create()
    {
        if (!request()->user()->hasPermission('printing.transfers.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create printer transfers.');
        }

        $companyCode = Auth::user()->company_code ?? session('company_code');

        // For Vismass company admin, fetch both Vismass and Malibu sections
        if ($companyCode === 'VIS001') {
            $sections = Section::whereIn('company_code', ['VIS001', 'MAL001'])->get(['section_code', 'name', 'company_code']);
        } else {
            // Other company admins can only see their own sections
            $sections = Section::where('company_code', $companyCode)->get(['section_code', 'name', 'company_code']);
        }

        return Inertia::render('PrinterTransfer/Create', [
            'sections' => $sections,
        ]);
    }

    public function getSectionTrfInStock(Request $request): JsonResponse
    {
        if (!request()->user()->hasPermission('printing.stock.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $sectionCode = $request->get('section_code');
            $companyCode = Auth::user()->company_code ?? session('company_code');

            if (!$sectionCode) {
                return response()->json([
                    'error' => 'Section code is required'
                ], 400);
            }

            // Calculate total unique printers in the section (count unique serial numbers with stock > 0)
            $totalTrfInStock = DB::table('stock_in_hand')
                ->where('company_code', $companyCode)
                ->where('section_code', $sectionCode)
                ->whereNotNull('serial_number')
                ->where('serial_number', '!=', '')
                ->select(
                    'serial_number',
                    DB::raw('SUM(Qty + FreeQty) as total_qty')
                )
                ->groupBy('serial_number')
                ->havingRaw('SUM(Qty + FreeQty) > 0')
                ->get()
                ->count();

            return response()->json([
                'section_code' => $sectionCode,
                'total_trf_in_stock' => $totalTrfInStock,
                'message' => "Total TRF-IN stock in section {$sectionCode}: {$totalTrfInStock}"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to calculate TRF-IN stock: ' . $e->getMessage()
            ], 500);
        }
    }

    public function searchPrinters(Request $request)
    {
        if (!request()->user()->hasPermission('printing.stock.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $companyCode = Auth::user()->company_code ?? session('company_code');

            $query = DB::table('stock_in_hand as sih')
                ->leftJoin('itemmaster as im', 'sih.ItemKy', '=', 'im.ItmKy') // LEFT JOIN to include items without itemmaster record
                ->leftJoin('purchase_det as pd', function($join) {
                    $join->on('sih.ItemKy', '=', 'pd.iTimKy')
                         ->on('sih.serial_number', '=', 'pd.serial_number')
                         ->on('sih.batch_no', '=', 'pd.batch_no');
                })
                ->where('sih.company_code', $companyCode);

            // Filter by the selected from section
            if ($request->filled('from_section_code')) {
                $query->where('sih.section_code', $request->from_section_code);
            }

            if ($request->filled('serial_number')) {
                 $query->whereRaw("TRIM(sih.serial_number) LIKE ?", ['%' . trim($request->serial_number) . '%']);
            }

            if ($request->filled('brand')) {
                $query->where(function($q) use ($request) {
                    $q->where('pd.brand', 'like', '%' . $request->brand . '%')
                      ->orWhere('sih.brand', 'like', '%' . $request->brand . '%')
                      ->orWhere('pd.item_name', 'like', '%' . $request->brand . '%')
                      ->orWhere('im.ItmNm', 'like', '%' . $request->brand . '%'); // Allow searching by Item Master name too
                });
            }

            if ($request->filled('model')) {
                $query->where(function($q) use ($request) {
                    $q->where('pd.model', 'like', '%' . $request->model . '%')
                      ->orWhere('sih.model', 'like', '%' . $request->model . '%');
                });
            }

            // FILTER: Show only Generic Items (ID 999 or whatever generic code is)
            // OR show items that actually have a serial number in stock
            $query->where(function($q) {
                 $q->whereNotNull('sih.serial_number')
                   ->where('sih.serial_number', '!=', '');
            });

            // Group by printer details and sum Qty
            $results = $query->select(
                    'sih.ItemKy',
                    DB::raw('COALESCE(pd.brand, sih.brand) as brand'),
                    DB::raw('COALESCE(pd.model, sih.model) as model'),
                    'sih.serial_number',
                    'sih.section_code',
                    'pd.item_name', // Include item name from purchase details
                    'im.ItemCode',
                    'im.ItmNm',
                    DB::raw('COALESCE(pd.warranty, sih.warranty) as warranty'),
                    DB::raw('MAX(sih.TableKy) as TableKy'),
                    DB::raw('MAX(sih.batch_no) as batch_no'),
                    DB::raw('MAX(pd.CostPrice) as cost_price'),
                    DB::raw('SUM(sih.Qty + sih.FreeQty) as total_qty')
                )
                ->groupBy(
                    'sih.ItemKy', 
                    'sih.serial_number', 
                    'sih.section_code', 
                    'pd.item_name',
                    'pd.brand',
                    'sih.brand',
                    'pd.model',
                    'sih.model',
                    'pd.warranty',
                    'sih.warranty',
                    'im.ItemCode', 
                    'im.ItmNm',
                    'pd.CostPrice'
                )
                ->having('total_qty', '>', 0) // Only show items with positive stock
                ->get();

            $printers = $results->map(function($stock) {
                return [
                    'id' => $stock->TableKy,
                    'item' => [
                        'ItmKy' => $stock->ItemKy,
                        'ItemCode' => $stock->ItemCode,
                        'ItmNm' => $stock->item_name ?: $stock->ItmNm, // Use specific item name if available, otherwise generic name
                    ],
                    'brand' => $stock->brand,
                    'model' => $stock->model,
                    'serial_number' => $stock->serial_number,
                    'batch_no' => $stock->batch_no,
                    'warranty' => $stock->warranty,
                    'qty' => $stock->total_qty,
                    'section_code' => $stock->section_code,
                    'cost_price' => $stock->cost_price,
                ];
            });

            return response()->json($printers);
        } catch (\Exception $e) {
            Log::error('Search Printers Error: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);
            return response()->json(['error' => 'Failed to search printers: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('printing.transfers.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create printer transfers.');
        }

        // Get company_code from authenticated user or session
        $companyCode = Auth::user()->company_code ?? session('company_code');

        $validated = $request->validate([
            'from_section_code' => 'required|exists:sections,section_code',
            'to_section_code' => 'required|exists:sections,section_code|different:from_section_code',
            'stock_transfers' => 'required|array|min:1',
            'stock_transfers.*.stock_id' => 'required|exists:stock_in_hand,TableKy',
            'stock_transfers.*.quantity' => 'required|integer|min:1',
            'stock_transfers.*.batch_no' => 'nullable|string|max:255',
            'stock_transfers.*.brand' => 'nullable|string|max:255',
            'stock_transfers.*.model' => 'nullable|string|max:255',
            'stock_transfers.*.serial_number' => 'nullable|string|max:255',
            'stock_transfers.*.warranty' => 'nullable|string|max:255',
            'stock_transfers.*.cost_price' => 'nullable|numeric|min:0',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        // Additional validation: ensure sections exist
        $fromSection = Section::where('section_code', $validated['from_section_code'])->first();
        $toSection = Section::where('section_code', $validated['to_section_code'])->first();

        if (!$fromSection) {
            return redirect()->back()->withErrors(['from_section_code' => 'Source section not found.']);
        }
        if (!$toSection) {
            return redirect()->back()->withErrors(['to_section_code' => 'Destination section not found.']);
        }

        try {
            return DB::transaction(function () use ($validated, $companyCode) {
                // Generate distinct transfer number for the entire batch (e.g. PRI-2026-00001)
                $transferNumber = \App\Models\Sequence::generateNextNumber('printer_transfer');
                $transfers = [];

                foreach ($validated['stock_transfers'] as $transfer) {
                    $stock = StockInHand::find($transfer['stock_id']);
                    if (!$stock || $stock->company_code != $companyCode) {
                        continue; // Skip invalid
                    }

                    $quantity = intval($transfer['quantity']);

                    // Get item to retrieve item_id
                    $item = $stock->item;
                    $itemId = $item ? $item->ItmKy : 0;

                    $stockTransfer = StockTransfer::create([
                        'transfer_number' => $transferNumber,
                        'from_section_code' => $validated['from_section_code'],
                        'to_section_code' => $validated['to_section_code'],
                        'item_id' => $itemId,
                        'stock_id' => $stock->TableKy,
                        'quantity' => $quantity,
                        'cost_price' => $transfer['cost_price'] ?? 0,
                        'transfer_date' => $validated['transfer_date'],
                        'notes' => $validated['notes'],
                        'company_code' => $companyCode,
                        'batch_no' => $transfer['batch_no'] ?? null,
                        'brand' => $transfer['brand'] ?? null,
                        'model' => $transfer['model'] ?? null,
                        'serial_number' => $transfer['serial_number'] ?? null,
                        'warranty' => $transfer['warranty'] ?? null,
                    ]);

                    // Execute the transfer by creating new stock record in destination section
                    // and updating the source record
                    $userId = Auth::id() ?? 0;

                    // Create new stock record in destination section with transfer quantity
                    DB::table('stock_in_hand')->insert([
                        'uuid' => (string) \Illuminate\Support\Str::uuid(),
                        'RefNo' => 'PRT-TRF-IN-' . $stockTransfer->id,
                        'company_code' => $companyCode,
                        'section_code' => $validated['to_section_code'],
                        'OrdDate' => $validated['transfer_date'],
                        'ItemKy' => $itemId,
                        'batch_no' => $transfer['batch_no'] ?? $stock->batch_no,
                        'brand' => $transfer['brand'] ?? $stock->brand,
                        'model' => $transfer['model'] ?? $stock->model,
                        'serial_number' => $transfer['serial_number'] ?? $stock->serial_number,
                        'warranty' => $transfer['warranty'] ?? $stock->warranty,
                        'Qty' => $quantity, // Use the quantity from stock_transfer
                        'FreeQty' => 0,
                        'TrnTyp' => 'TRF-IN',
                        'OrdKy' => $stockTransfer->id,
                        'StkKy' => null,
                        'OrdTypKy' => null,
                        'CounterID' => $userId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Create negative stock record for source section (TRF-OUT) instead of decrementing
                    DB::table('stock_in_hand')->insert([
                        'uuid' => (string) \Illuminate\Support\Str::uuid(),
                        'RefNo' => 'PRT-TRF-OUT-' . $stockTransfer->id,
                        'company_code' => $companyCode,
                        'section_code' => $validated['from_section_code'],
                        'OrdDate' => $validated['transfer_date'],
                        'ItemKy' => $itemId,
                        'batch_no' => $stock->batch_no,
                        'brand' => $stock->brand,
                        'model' => $stock->model,
                        'serial_number' => $stock->serial_number,
                        'warranty' => $stock->warranty,
                        'Qty' => -$quantity, // Negative quantity to reduce stock
                        'FreeQty' => 0,
                        'TrnTyp' => 'TRF-OUT',
                        'OrdKy' => $stockTransfer->id,
                        'StkKy' => null,
                        'OrdTypKy' => null,
                        'CounterID' => $userId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $transfers[] = $stockTransfer->id;
                }

                return redirect()->back()
                    ->with('success', 'Printer transfers created successfully.')
                    ->with('transfer_ids', $transfers);
            });
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to create transfers: ' . $e->getMessage()]);
        }
    }

    public function previewPdf(Request $request)
    {
        if (!request()->user()->hasPermission('printing.transfers.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view printer transfers.');
        }

        try {
            $companyCode = Auth::user()->company_code ?? session('company_code');
            $user = Auth::user();

            // Parse data from request
            $fromSectionCode = $request->get('from_section_code');
            $toSectionCode = $request->get('to_section_code');
            $transferDate = $request->get('transfer_date');
            $notes = $request->get('notes', '');
            $stockTransfers = $request->get('stock_transfers', []);

            // Get section information
            $fromSection = Section::where('section_code', $fromSectionCode)->first();
            $toSection = Section::where('section_code', $toSectionCode)->first();
            $company = $user->company ?? Company::first();

            // Process stock transfers for PDF with details
            $processedItems = [];
            $totalCostValue = 0;

            foreach ($stockTransfers as $transferData) {
                if (empty($transferData['stock_id']) || empty($transferData['quantity'])) {
                    continue;
                }

                // Get stock information
                $stock = StockInHand::where('TableKy', $transferData['stock_id'])
                    ->where('company_code', $companyCode)
                    ->with('item')
                    ->first();

                if ($stock) {
                    $quantity = floatval($transferData['quantity']);
                    $costPrice = floatval($transferData['cost_price'] ?? $stock->item->cost_price ?? 0);
                    $totalValue = $quantity * $costPrice;

                    $processedItems[] = [
                        'original_serial_number' => $stock->serial_number ?? '',
                        'original_brand' => $stock->brand ?? '',
                        'original_model' => $stock->model ?? '',
                        'serial_number' => $transferData['serial_number'] ?? $stock->serial_number ?? '',
                        'brand' => $transferData['brand'] ?? $stock->brand ?? '',
                        'model' => $transferData['model'] ?? $stock->model ?? '',
                        'batch_no' => $transferData['batch_no'] ?? $stock->batch_no ?? '',
                        'warranty' => $transferData['warranty'] ?? $stock->warranty ?? '',
                        'item_code' => $stock->item->ItemCode ?? 'N/A',
                        'item_name' => $stock->item->ItmNm ?? 'Unknown Item',
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
                'transfer_date' => $transferDate,
                'from_section' => $fromSection ? $fromSection->name : 'Unknown',
                'to_section' => $toSection ? $toSection->name : 'Unknown',
                'items' => $processedItems,
                'total_cost_value' => $totalCostValue,
                'notes' => $notes,
                'generated_at' => now()->format('d M Y, h:i A'),
                'generated_by' => $user->username ?? $user->name ?? 'System',
                'is_preview' => true,
            ];

            // Set PDF options
            $options = [
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'enable_unicode' => true,
            ];

            // Generate PDF
            $pdf = Pdf::loadView('printer_transfer_pdf', $data);
            $pdf->setOptions($options);
            $pdf->setPaper('A4', 'portrait');

            // Return PDF as stream for preview
            return $pdf->stream('printer-transfer-preview.pdf');

        } catch (\Exception $e) {
            Log::error('PDF Preview Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF preview: ' . $e->getMessage()], 500);
        }
    }

    public function downloadPdfBatch(Request $request)
    {
        if (!request()->user()->hasPermission('printing.transfers.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view printer transfers.');
        }

        try {
            Log::info('Batch PDF Download Request Initiated', ['params' => $request->all()]);

            $ids = $request->input('ids');
            if (empty($ids)) {
                Log::warning('Batch PDF Download: No IDs provided');
                return response()->json(['error' => 'No transfer IDs provided'], 400);
            }

            // If IDs is a string (comma separated), explode it
            if (is_string($ids)) {
                $ids = explode(',', $ids);
            }
            
            // Clean IDs
            $ids = array_map('trim', (array) $ids);
            $ids = array_filter($ids); // Remove empty values

            Log::info('Batch PDF Download: Resolved IDs', ['ids' => $ids]);

            $companyCode = Auth::user()->company_code ?? session('company_code');
            $user = Auth::user();
            $company = $user->company ?? Company::first();

            $transfers = StockTransfer::whereIn('id', $ids)
                ->where('company_code', $companyCode)
                ->with(['fromSection', 'toSection', 'item'])
                ->get();
            
            Log::info('Batch PDF Download: Transfers Found', ['count' => $transfers->count()]);

            if ($transfers->isEmpty()) {
                Log::warning('Batch PDF Download: No matching transfers found in DB');
                return response()->json(['error' => 'Transfers not found'], 404);
            }

            // Use the first transfer for header details
            $firstTransfer = $transfers->first();
            
            // Determine Transaction Number display
            // If multiple, show range or first? showing first for now as "Reference"
            $transactionNumber = $firstTransfer->transfer_number;
            if ($transfers->count() > 1) {
                $lastTransfer = $transfers->last();
                if ($firstTransfer->transfer_number !== $lastTransfer->transfer_number) {
                    $transactionNumber = $firstTransfer->transfer_number . ' - ' . $lastTransfer->transfer_number;
                }
            }

            $processedItems = [];
            $totalCostValue = 0;

            foreach ($transfers as $transfer) {
                // Determine item name (from relationship or fallback)
                $item = $transfer->item;
                $itemName = $item ? $item->ItmNm : 'Unknown Item';
                $itemCode = $item ? $item->ItemCode : 'N/A';
                
                $quantity = $transfer->quantity;
                $costPrice = $transfer->cost_price;
                $totalValue = $quantity * $costPrice;

                $processedItems[] = [
                    'original_serial_number' => $transfer->serial_number ?? '', // In transfer record, these ARE the transferred item details
                    'original_brand' => $transfer->brand ?? '',
                    'original_model' => $transfer->model ?? '',
                    'batch_no' => $transfer->batch_no ?? '',
                    'warranty' => $transfer->warranty ?? '',
                    'item_code' => $itemCode,
                    'item_name' => $itemName,
                    'quantity' => $quantity,
                    'cost_price' => $costPrice,
                    'total_value' => $totalValue, // not used in view currently but good to have
                    'transfer_number' => $transfer->transfer_number, // Individual number
                ];

                $totalCostValue += $totalValue;
            }

            $data = [
                'company_name' => $company ? $company->name : 'Company',
                'transfer_number' => $transactionNumber,
                'transfer_date' => $firstTransfer->transfer_date,
                'from_section' => $firstTransfer->fromSection->name ?? $firstTransfer->from_section_code,
                'to_section' => $firstTransfer->toSection->name ?? $firstTransfer->to_section_code,
                'items' => $processedItems,
                'total_cost_value' => $totalCostValue,
                'notes' => $firstTransfer->notes,
                'generated_at' => now()->format('d M Y, h:i A'),
                'generated_by' => $user->username ?? $user->name ?? 'System',
                'is_preview' => false,
            ];

            $pdf = Pdf::loadView('printer_transfer_pdf', $data);
            $pdf->setPaper('A4', 'portrait');

            $filename = 'printer-transfer-' . $transactionNumber . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Batch PDF Download Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }
}