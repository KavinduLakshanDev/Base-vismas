<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\Company;
use App\Models\Section;
use App\Models\StockInHand;
use Barryvdh\DomPDF\Facade\Pdf;

class StockInHandReportController extends Controller
{
    /**
     * Display the stock in hand report.
     */
    public function index(Request $request)
    {
        if (!request()->user()->hasPermission('stock.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view stock.');
        }

        $user = Auth::user();

        // Get company & branch info from user first
        try {
            $company = $user->company ?? Company::first();
            $section = $user->section ?? Section::first();

            $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
            $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

            // Handle section filter from request
            if ($request->has('section') && !empty($request->section)) {
                $requestedSection = Section::find($request->section);
                if ($requestedSection) {
                    $sectionCode = $requestedSection->section_code;
                    $companyCode = $requestedSection->company_code; // Update company code to match selected section
                    $section = $requestedSection;
                }
            }

            $companyInfo = [
                'name' => $company ? ($company->name ?? 'Company') : 'Company',
                'section' => $section ? ($section->name ?? 'Main') : 'Main',
                'code' => $companyCode,
                'section_code' => $sectionCode,
            ];
        } catch (\Exception $e) {
            $companyInfo = [
                'name' => 'Company',
                'section' => 'Main',
                'code' => 'C01',
                'section_code' => 'BR01',
            ];
            $companyCode = 'C01';
            $sectionCode = 'BR01';
        }

        // Get all sections for the filter dropdown - excluding 'Malibu Section'
        $sections = Section::where('name', '!=', 'Malibu Section')
            ->where('is_active', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get categories for filter dropdown
        $categories = DB::table('code_masters')
            ->where('conkey', 'CAT') // Categories are stored with conkey 'CAT'
            ->where('company_code', $companyCode)
            ->select('catkey', 'cname')
            ->orderBy('cname')
            ->get();

        // Get suppliers for filter dropdown
        $suppliers = DB::table('acc_mas')
            ->where('AccTyp', 'SUPPLIER')
            ->where('Status', 'A')
            ->where('company_code', $companyCode)
            // ->where('section_code', $sectionCode) // Suppliers are usually company-wide
            ->select('AccKy as id', 'AccNm as name')
            ->orderBy('AccNm')
            ->get();

        // Get items for item code filter dropdown
        $dropdownItems = DB::table('itemmaster')
            ->select('ItmKy as id', 'ItemCode as code', 'ItmNm as name')
            ->where('fInAct', false) // Only active items
            ->where('company_code', $companyCode)
            ->orderBy('ItmNm')
            ->get();

        // Get unique printer details from purchase_det for selection
        $printerDetails = DB::table('purchase_det')
            ->where('company_code', $companyCode)
            ->where('section_code', $sectionCode)
            ->where(function($query) {
                $query->whereNotNull('brand')
                      ->orWhereNotNull('model')
                      ->orWhereNotNull('serial_number');
            })
            ->select('brand', 'model', 'serial_number')
            ->distinct()
            ->orderBy('brand')
            ->orderBy('model')
            ->get()
            ->map(function($item) {
                $labelParts = [];
                if ($item->brand) $labelParts[] = $item->brand;
                if ($item->model) $labelParts[] = $item->model;
                if ($item->serial_number) $labelParts[] = $item->serial_number;

                return [
                    'brand' => $item->brand,
                    'model' => $item->model,
                    'serial_number' => $item->serial_number,
                    'label' => implode(' - ', $labelParts)
                ];
            });

        // Build query for items based on filters
        $asAtDate = $request->query('as_at_date', date('Y-m-d'));
        
        // When "All Items" is selected, get items that actually have stock
        if ((!$request->has('item_code') || $request->item_code === 'all') && 
            (!$request->has('category') || $request->category === 'all')) {
            // Get items that have stock in stock_in_hand for this section
            $itemsWithStock = DB::table('stock_in_hand')
                ->where('company_code', $companyCode)
                ->where('section_code', $sectionCode)
                ->where('OrdDate', '<=', $asAtDate)
                ->select('ItemKy')
                ->groupBy('ItemKy')
                ->havingRaw('SUM(Qty + FreeQty) > 0')
                ->pluck('ItemKy')
                ->toArray();
            
            $itemsQuery = DB::table('itemmaster as im')
                ->leftJoin('code_masters as cm', function($join) use ($companyCode) {
                    $join->on('im.catkey', '=', 'cm.catkey')
                         ->where('cm.conkey', '=', 'CAT')
                         ->where('cm.company_code', '=', $companyCode);
                })
                ->where('im.company_code', $companyCode)
                ->whereIn('im.ItmKy', $itemsWithStock)
                ->select('im.ItmKy', 'im.ItemCode', 'im.ItmNm', 'im.catkey', 'im.SupKey', 'im.CosPri', 'im.WholePrice', 'im.SlsPri', 'cm.cname as category_name')
                ->orderBy('im.ItmNm');
        } else {
            // Original query for filtered results
            $itemsQuery = DB::table('itemmaster as im')
                ->leftJoin('code_masters as cm', function($join) use ($companyCode) {
                    $join->on('im.catkey', '=', 'cm.catkey')
                         ->where('cm.conkey', '=', 'CAT')
                         ->where('cm.company_code', '=', $companyCode);
                })
                ->where('im.company_code', $companyCode)
                ->select('im.ItmKy', 'im.ItemCode', 'im.ItmNm', 'im.catkey', 'im.SupKey', 'im.CosPri', 'im.WholePrice', 'im.SlsPri', 'cm.cname as category_name')
                ->orderBy('im.ItmNm');

            // Apply category filter if selected
            if ($request->has('category') && !empty($request->category) && $request->category !== 'all') {
                $itemsQuery->where('im.catkey', $request->category);
            }

            // Apply item code filter if provided
            if ($request->has('item_code') && !empty($request->item_code) && $request->item_code !== 'all') {
                $itemsQuery->where('im.ItemCode', $request->item_code);
            }

            // Apply supplier filter if selected
            if ($request->has('supplier') && !empty($request->supplier) && $request->supplier !== 'all') {
                $itemsQuery->where('im.SupKey', $request->supplier);
            }
        }
        
        // Get items without cache for immediate updates
        $items = $itemsQuery->get();

        // Get current stock from stock_in_hand table for selected branch
        $stockMovements = [];
        if ($items->isNotEmpty()) {
            $itemKeys = $items->pluck('ItmKy')->toArray();
            
            // Get fresh batch-wise stock data without cache for immediate updates
            $query = DB::table('stock_in_hand')
                ->where('company_code', $companyCode)
                ->where('section_code', $sectionCode)
                ->whereIn('ItemKy', $itemKeys);
            
            if ($asAtDate) {
                $query->where('OrdDate', '<=', $asAtDate);
            }

            // Get batch-wise stock data
            $stockRecords = $query->select(
                    'ItemKy', 
                    'batch_no',
                    DB::raw('SUM(Qty + FreeQty) as total_stock'),
                    DB::raw('MIN(OrdDate) as first_received_date'),
                    DB::raw('MAX(OrdDate) as last_received_date')
                )
                ->groupBy('ItemKy', 'batch_no')
                ->having('total_stock', '>', 0)
                ->orderBy('ItemKy')
                ->orderBy('batch_no')
                ->get();
            
            // Batch-wise view - process all items with batches
            foreach ($items as $item) {
                $itemBatches = $stockRecords->where('ItemKy', $item->ItmKy);
                
                if ($itemBatches->isEmpty()) {
                    // If item has no batches but was in the query results, show it with null batch
                    $stockMovements[] = [
                        'item_code' => $item->ItemCode,
                        'item_name' => $item->ItmNm,
                        'batch_no' => 'N/A',
                        'category_name' => $item->category_name ?? 'Uncategorized',
                        'cost_price' => (float) ($item->CosPri ?? 0),
                        'wholesale_price' => (float) ($item->WholePrice ?? 0),
                        'retail_price' => (float) ($item->SlsPri ?? 0),
                        'current_stock' => 0,
                        'first_received_date' => null,
                        'last_received_date' => null,
                    ];
                } else {
                    // Show each batch separately
                    foreach ($itemBatches as $batch) {
                        $currentStock = (float) $batch->total_stock;
                        
                        if ($currentStock <= 0) {
                            continue; // Skip batches with zero or negative stock
                        }

                        $stockMovements[] = [
                            'item_code' => $item->ItemCode,
                            'item_name' => $item->ItmNm,
                            'batch_no' => $batch->batch_no ?? 'N/A',
                            'category_name' => $item->category_name ?? 'Uncategorized',
                            'cost_price' => (float) ($item->CosPri ?? 0),
                            'wholesale_price' => (float) ($item->WholePrice ?? 0),
                            'retail_price' => (float) ($item->SlsPri ?? 0),
                            'current_stock' => $currentStock,
                            'first_received_date' => $batch->first_received_date,
                            'last_received_date' => $batch->last_received_date,
                        ];
                    }
                }
            }
        }

        // Group by category and calculate totals
        $groupedStock = [];
        foreach ($stockMovements as $item) {
            $category = $item['category_name'];
            if (!isset($groupedStock[$category])) {
                $groupedStock[$category] = [
                    'category_name' => $category,
                    'items' => [],
                    'total_cost_value' => 0,
                    'total_wholesale_value' => 0,
                ];
            }
                $groupedStock[$category]['items'][] = $item;
                $groupedStock[$category]['total_cost_value'] += ((float) $item['cost_price']) * ((float) $item['current_stock']);
                $groupedStock[$category]['total_wholesale_value'] += ((float) $item['wholesale_price']) * ((float) $item['current_stock']);
        }

        $groupedStock = array_values($groupedStock);

        // Calculate overall totals
        $overallTotalCostValue = 0;
        $overallTotalWholesaleValue = 0;
        foreach ($groupedStock as $group) {
            $overallTotalCostValue += $group['total_cost_value'];
            $overallTotalWholesaleValue += $group['total_wholesale_value'];
        }

        return Inertia::render('Reports/StockInHand', [
            'categories' => $categories,
            'suppliers' => $suppliers,
            'sections' => $sections,
            'items' => $dropdownItems,
            'printerDetails' => $printerDetails,
            'company' => $companyInfo,
            'filters' => $request->only(['category', 'as_at_date', 'item_code', 'supplier', 'section', 'brand', 'model', 'serial_number']),
            'groupedStock' => $groupedStock,
            'overallTotalCostValue' => $overallTotalCostValue,
            'overallTotalWholesaleValue' => $overallTotalWholesaleValue,
        ]);
    }

    public function generateReport(Request $request)
    {
        if (!request()->user()->hasPermission('stock.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view stock.');
        }

        try {
            $user = Auth::user();

            // Get company & branch from user first
            $company = $user->company ?? Company::first();
            $section = $user->section ?? Section::first();
            $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
            $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

            // Handle section filter from request
            if ($request->has('section') && !empty($request->section)) {
                $requestedSection = Section::find($request->section);
                if ($requestedSection) {
                    $sectionCode = $requestedSection->section_code;
                    $companyCode = $requestedSection->company_code; // Update company code to match selected section
                    $section = $requestedSection;
                }
            }

            $asAtDate = $request->query('as_at_date', date('Y-m-d'));

            // Get stock movements and calculate stock as of the specified date
            $stockMovements = [];
            
            // Build query for items based on category filter
            $itemsQuery = DB::table('itemmaster as im')
                ->leftJoin('code_masters as cm', function($join) use ($companyCode) {
                    $join->on('im.catkey', '=', 'cm.catkey')
                         ->where('cm.conkey', '=', 'CAT')
                         ->where('cm.company_code', '=', $companyCode);
                })
                ->where('im.company_code', $companyCode)
                ->select('im.ItmKy', 'im.ItemCode', 'im.ItmNm', 'im.catkey', 'im.SupKey', 'im.CosPri', 'im.WholePrice', 'im.SlsPri', 'cm.cname as category_name')
                ->orderBy('im.ItmNm');
            
            // Apply category filter if selected
            if ($request->has('category') && $request->category !== 'all' && !empty($request->category)) {
                $itemsQuery->where('im.catkey', $request->category);
            }
            
            // Apply item code filter
            if ($request->has('item_code') && $request->item_code !== 'all' && !empty($request->item_code)) {
                $itemsQuery->where('im.ItemCode', $request->item_code);
            }

            // Apply supplier filter
            if ($request->has('supplier') && $request->supplier !== 'all' && !empty($request->supplier)) {
                $itemsQuery->where('im.SupKey', $request->supplier);
            }
            
            $items = $itemsQuery->get();

            // Always process items, even if empty
            $itemKeys = $items->pluck('ItmKy')->toArray();

            if (!empty($itemKeys)) {
                $stockQuery = DB::table('stock_in_hand')
                    ->where('company_code', $companyCode)
                    ->where('section_code', $sectionCode)
                    ->whereIn('ItemKy', $itemKeys);
                
                if ($asAtDate) {
                    $stockQuery->where('OrdDate', '<=', $asAtDate);
                }

                // Get batch-wise stock data
                $stockRecords = $stockQuery->select(
                        'ItemKy', 
                        'batch_no',
                        DB::raw('SUM(Qty + FreeQty) as total_stock'),
                        DB::raw('MIN(OrdDate) as first_received_date'),
                        DB::raw('MAX(OrdDate) as last_received_date')
                    )
                    ->groupBy('ItemKy', 'batch_no')
                    ->having('total_stock', '>', 0)
                    ->orderBy('ItemKy')
                    ->orderBy('batch_no')
                    ->get();
                
                // Process batch-wise data
                foreach ($items as $item) {
                    $itemBatches = $stockRecords->where('ItemKy', $item->ItmKy);
                    
                    if ($itemBatches->isEmpty()) {
                        $stockMovements[] = [
                            'item_code' => $item->ItemCode,
                            'item_name' => $item->ItmNm,
                            'batch_no' => 'N/A',
                            'category_name' => $item->category_name ?? 'Uncategorized',
                            'cost_price' => (float) ($item->CosPri ?? 0),
                            'wholesale_price' => (float) ($item->WholePrice ?? 0),
                            'retail_price' => (float) ($item->SlsPri ?? 0),
                            'current_stock' => 0,
                            'first_received_date' => null,
                            'last_received_date' => null,
                        ];
                    } else {
                        foreach ($itemBatches as $batch) {
                            $currentStock = (float) $batch->total_stock;
                            
                            if ($currentStock <= 0) {
                                continue;
                            }
                            
                            $stockMovements[] = [
                                'item_code' => $item->ItemCode,
                                'item_name' => $item->ItmNm,
                                'batch_no' => $batch->batch_no ?? 'N/A',
                                'category_name' => $item->category_name ?? 'Uncategorized',
                                'cost_price' => (float) ($item->CosPri ?? 0),
                                'wholesale_price' => (float) ($item->WholePrice ?? 0),
                                'retail_price' => (float) ($item->SlsPri ?? 0),
                                'current_stock' => $currentStock,
                                'first_received_date' => $batch->first_received_date,
                                'last_received_date' => $batch->last_received_date,
                            ];
                        }
                    }
                }
            }

            // Group by category and calculate totals
            $groupedStock = [];
            foreach ($stockMovements as $item) {
                $category = $item['category_name'];
                if (!isset($groupedStock[$category])) {
                    $groupedStock[$category] = [
                        'category_name' => $category,
                        'items' => [],
                        'total_cost_value' => 0,
                        'total_wholesale_value' => 0,
                        'total_retail_value' => 0,
                    ];
                }
                $groupedStock[$category]['items'][] = $item;
                $groupedStock[$category]['total_cost_value'] += ((float) $item['cost_price']) * ((float) $item['current_stock']);
                $groupedStock[$category]['total_wholesale_value'] += ((float) $item['wholesale_price']) * ((float) $item['current_stock']);
                $groupedStock[$category]['total_retail_value'] += ((float) $item['retail_price']) * ((float) $item['current_stock']);
            }

            $groupedStock = array_values($groupedStock);

            // Calculate overall totals
            $overallTotalCostValue = 0;
            $overallTotalWholesaleValue = 0;
            $overallTotalRetailValue = 0;
            foreach ($groupedStock as $group) {
                $overallTotalCostValue += $group['total_cost_value'];
                $overallTotalWholesaleValue += $group['total_wholesale_value'];
                $overallTotalRetailValue += $group['total_retail_value'];
            }

            // Get company info for PDF
            $company = $user->company ?? Company::first();
            $section = $user->section ?? Section::first();

            // Prepare data for PDF
            $data = [
                'groupedStock' => $groupedStock,
                'overallTotalCostValue' => $overallTotalCostValue,
                'overallTotalWholesaleValue' => $overallTotalWholesaleValue,
                'overallTotalRetailValue' => $overallTotalRetailValue,
                'filters' => [
                    'category' => $request->category,
                    'as_at_date' => $request->as_at_date,
                    'item_code' => $request->item_code,
                    'supplier' => $request->supplier,
                ],
                'generated_at' => now()->format('d M Y, h:i A'),
                'generated_by' => $user->username ?? $user->name ?? 'System',
                'company' => [
                    'name' => $company ? $company->name : 'Company',
                    'section' => $section ? $section->name : 'Main',
                ],
            ];

            // Debug data
            Log::info('PDF Data:', $data);

            // Set options for PDF generation
            $options = [
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true,
                'enable_unicode' => true,
                'enable_html5_parser' => true,
            ];

            // Generate PDF using DomPDF
            $pdf = Pdf::loadView('reports.stock_in_hand', $data);
            $pdf->setOptions($options);

            // Set paper size and orientation to A4 portrait
            $pdf->setPaper('A4', 'portrait');

            // Generate filename with timestamp
            $filename = 'stock-in-hand-report-' . date('Y-m-d-H-i-s') . '.pdf';

            // Return PDF download
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('Error generating stock in hand report: ' . $e->getMessage());
            return back()->with('error', 'Failed to generate report: ' . $e->getMessage());
        }
    }

    /**
     * Get stock chart data for a specific item.
     */
    public function getStockChartData(Request $request, $itemId)
    {
        if (!request()->user()->hasPermission('stock.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Validate that itemId is an integer
        if (!is_numeric($itemId) || !ctype_digit($itemId)) {
            return response()->json(['error' => 'Invalid item ID'], 400);
        }

        $user = Auth::user();
        $company = $user->company ?? Company::first();
        $section = $user->section ?? Section::first();
        $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
        $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

        // Get date range parameters
        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');

        // Get stock movements ordered by date
        $query = DB::table('stock_in_hand')
            ->where('company_code', $companyCode)
            ->where('section_code', $sectionCode)
            ->where('ItemKy', $itemId);

        // Apply date filters if provided
        if ($fromDate) {
            $query->where('OrdDate', '>=', $fromDate);
        }
        if ($toDate) {
            $query->where('OrdDate', '<=', $toDate);
        }

        $stockData = $query->orderBy('OrdDate')
            ->select('OrdDate', 'Qty', 'FreeQty')
            ->get();

        $chartData = [];
        $cumulativeQty = 0;

        foreach ($stockData as $record) {
            $cumulativeQty += (float) $record->Qty + (float) $record->FreeQty;
            $chartData[] = [
                'date' => $record->OrdDate,
                'quantity' => $cumulativeQty,
            ];
        }

        return response()->json($chartData);
    }

    /**
     * Get sales chart data for a specific item.
     */
    public function getSalesChartData(Request $request, $itemId)
    {
        if (!request()->user()->hasPermission('stock.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Validate that itemId is an integer
        if (!is_numeric($itemId) || !ctype_digit($itemId)) {
            return response()->json(['error' => 'Invalid item ID'], 400);
        }

        $user = Auth::user();
        $company = $user->company ?? Company::first();
        $section = $user->section ?? Section::first();
        $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
        $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

        // Get date range parameters
        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');

        // Get sales data (TrnTyp = 'SAL') grouped by date
        $query = DB::table('stock_in_hand')
            ->where('company_code', $companyCode)
            ->where('section_code', $sectionCode)
            ->where('ItemKy', $itemId)
            ->where('TrnTyp', 'SAL');

        // Apply date filters if provided
        if ($fromDate) {
            $query->where('OrdDate', '>=', $fromDate);
        }
        if ($toDate) {
            $query->where('OrdDate', '<=', $toDate);
        }

        $salesData = $query->select('OrdDate', DB::raw('SUM(Qty) as total_qty'))
            ->groupBy('OrdDate')
            ->orderBy('OrdDate')
            ->get();

        $chartData = $salesData->map(function ($record) {
            return [
                'date' => $record->OrdDate,
                'quantity' => (float) $record->total_qty,
            ];
        });

        return response()->json($chartData);
    }

    /**
     * Display the stock charts page.
     */
    public function charts()
    {
        if (!request()->user()->hasPermission('stock.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view stock charts.');
        }

        // Get items for dropdown
        $dropdownItems = DB::table('itemmaster')
            ->select('ItmKy as id', 'ItemCode as code', 'ItmNm as name')
            ->where('fInAct', false) // Only active items
            ->orderBy('ItmNm')
            ->get();

        return Inertia::render('Reports/StockCharts', [
            'items' => $dropdownItems,
        ]);
    }

    /**
     * Display the sales history page.
     */
    public function salesHistory()
    {
        if (!request()->user()->hasPermission('stock.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view sales history.');
        }

        return Inertia::render('Reports/SalesHistory');
    }

    /**
     * Get sales history data.
     */
    public function getSalesHistory()
    {
        if (!request()->user()->hasPermission('stock.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        $user = Auth::user();
        $company = $user->company ?? Company::first();
        $section = $user->section ?? Section::first();
        $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
        $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

        // Get sales data with item details
        $salesData = DB::table('stock_in_hand as sih')
            ->join('itemmaster as im', 'sih.ItemKy', '=', 'im.ItmKy')
            ->where('sih.company_code', $companyCode)
            ->where('sih.section_code', $sectionCode)
            ->where('sih.TrnTyp', 'SAL')
            ->select('im.ItemCode', 'im.ItmNm', 'sih.Qty', 'sih.OrdDate')
            ->orderBy('sih.OrdDate', 'desc')
            ->get();

        $formattedData = $salesData->map(function ($record) {
            return [
                'item_code' => $record->ItemCode,
                'item_name' => $record->ItmNm,
                'qty' => (float) $record->Qty,
                'date' => $record->OrdDate,
            ];
        });

        return response()->json($formattedData);
    }

    /**
     * Get sales transactions for a specific item.
     */
    public function getItemSalesTransactions(Request $request, $itemId)
    {
        if (!request()->user()->hasPermission('stock.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Validate that itemId is an integer
        if (!is_numeric($itemId) || !ctype_digit($itemId)) {
            return response()->json(['error' => 'Invalid item ID'], 400);
        }

        $user = Auth::user();
        $company = $user->company ?? Company::first();
        $section = $user->section ?? Section::first();
        $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
        $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

        // Get date range parameters
        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');

        // Get sales transactions with item details
        $query = DB::table('stock_in_hand as sih')
            ->join('itemmaster as im', 'sih.ItemKy', '=', 'im.ItmKy')
            ->where('sih.company_code', $companyCode)
            ->where('sih.section_code', $sectionCode)
            ->where('sih.ItemKy', $itemId)
            ->where('sih.TrnTyp', 'SAL');

        // Apply date filters if provided
        if ($fromDate) {
            $query->where('sih.OrdDate', '>=', $fromDate);
        }
        if ($toDate) {
            $query->where('sih.OrdDate', '<=', $toDate);
        }

        $salesTransactions = $query->select('im.ItemCode', 'im.ItmNm', 'sih.Qty', 'sih.OrdDate', 'sih.RefNo')
            ->orderBy('sih.OrdDate', 'desc')
            ->get();

        $formattedData = $salesTransactions->map(function ($record) {
            return [
                'item_code' => $record->ItemCode,
                'item_name' => $record->ItmNm,
                'qty' => (float) $record->Qty,
                'date' => $record->OrdDate,
                'ref_no' => $record->RefNo,
            ];
        });

        return response()->json($formattedData);
    }
}