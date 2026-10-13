<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Company;
use App\Models\Section;
use App\Models\ItemMaster;
use App\Models\CodeMaster;
use App\Models\AccMas;
use App\Models\ItemPriceDet;

class ItemListReportController extends Controller
{
    /**
     * Display the item list report.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            // Get company & branch info from user first
            try {
                $company = $user->company ?? Company::first();
                $section = $user->section ?? Section::first();

                $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
                $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

                $companyInfo = [
                    'name' => $company ? ($company->name ?? 'Company') : 'Company',
                    'section' => $section ? ($section->name ?? 'Main') : 'Main',
                    'code' => $companyCode,
                    'section_code' => $sectionCode,
                    'primary_color' => $company ? ($company->primary_color ?? '#00aeef') : '#00aeef',
                    'secondary_color' => $company ? ($company->secondary_color ?? '#737578') : '#737578',
                ];
            } catch (\Exception $e) {
                $companyInfo = [
                    'name' => 'Company',
                    'section' => 'Main',
                    'code' => 'C01',
                    'section_code' => 'BR01',
                    'primary_color' => '#00aeef',
                    'secondary_color' => '#737578',
                ];
                $companyCode = 'C01';
                $sectionCode = 'BR01';
            }

            // Get section filter
            $sectionFilter = $request->query('section', 'all');

            // --- Dynamic Categories Fetching ---
            // Get all active categories for filter dropdown
            $categoriesQuery = CodeMaster::where('conkey', 'CAT')
                ->where('is_active', true);

            // Apply company filter if needed (optional, depending on if categories are company-specific)
            // if ($companyCode) {
            //     $categoriesQuery->where('company_code', $companyCode);
            // }

            $categories = $categoriesQuery->select('catkey', 'cname')
                ->orderBy('cname')
                ->get();


            // --- Dynamic Sections Fetching ---
            // Get all active sections from Sections model filtered by company
            $sectionsData = Section::select('section_code', 'name')
                ->where('is_active', true)
                ->where('company_code', $companyCode)
                ->orderBy('name')
                ->get();

            // Format sections for dropdown
            $sections = [['value' => 'all', 'label' => 'All Sections']];
            foreach ($sectionsData as $sec) {
                $sections[] = [
                    'value' => $sec->section_code,
                    'label' => $sec->name
                ];
            }

            // --- Build Query ---
            $itemsQuery = ItemMaster::query()
                ->select(
                    'itemmaster.ItmKy',
                    'itemmaster.ItemCode',
                    'itemmaster.ItmNm',
                    'itemmaster.catkey',
                    'itemmaster.SupKey',
                    'itemmaster.UnitKy',
                    'itemmaster.Unit',
                    'itemmaster.CosPri',
                    'itemmaster.SlsPri',
                    'itemmaster.WholePrice',
                    'itemmaster.section_code',
                    'itemmaster.company_code',
                    // Add other necessary fields, potentially needing joins if details are in other tables
                    // For now, assuming core data is in itemmaster or can be loaded via relationships
                    'itemmaster.batch_no',
                    'itemmaster.BarCode',
                    'itemmaster.brand_id'
                );
            
            // Calculate Qty from StockInHand
            $itemsQuery->withSum('stockInHand as Qty', 'Qty');

            // Apply Section Filter
            if ($sectionFilter !== 'all') {
                $itemsQuery->where('itemmaster.section_code', $sectionFilter);
            }

            // Apply Company Filter (Typically we filter by current user's company or allow all if authorized)
            $itemsQuery->where('itemmaster.company_code', $companyCode);


            // Apply Category Filter
            if ($request->has('category') && !empty($request->category) && $request->category !== 'all') {
                $itemsQuery->where('itemmaster.catkey', $request->category);
            }

            // Apply Search Filter
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $itemsQuery->where(function ($q) use ($search) {
                    $q->where('itemmaster.ItemCode', 'like', "%{$search}%")
                        ->orWhere('itemmaster.ItmNm', 'like', "%{$search}%");
                });
            }

            // Apply Date Filter
            if ($request->has('start_date') && !empty($request->start_date)) {
                $itemsQuery->whereDate('itemmaster.created_at', '>=', $request->start_date);
            }
            if ($request->has('end_date') && !empty($request->end_date)) {
                $itemsQuery->whereDate('itemmaster.created_at', '<=', $request->end_date);
            }

            // Order by creation order (by primary key)
            $itemsQuery->orderBy('itemmaster.ItmKy', 'asc');

            // Get Items
            $itemMasters = $itemsQuery->get();


            // Transform items for display
            $transformedItems = $itemMasters->map(function ($item) {
                // Load relationships individually to avoid errors or use loaded relations
                $category = null;
                $supplier = null;
                $unit = null;
                $brand = null;

                try {
                    if ($item->catkey) {
                        $category = CodeMaster::where('catkey', $item->catkey)
                            ->where('conkey', 'CAT')
                            ->first();
                    }
                } catch (\Exception $e) {}

                try {
                    if ($item->SupKey) {
                        $supplier = AccMas::where('AccKy', $item->SupKey)->first();
                    }
                } catch (\Exception $e) {}

                try {
                    if ($item->UnitKy) {
                        $unit = CodeMaster::where('id', $item->UnitKy)->first();
                    }
                } catch (\Exception $e) {}
                
                 try {
                    if ($item->brand_id) {
                         // Assuming Brand model exists or stored in CodeMaster/Brand table
                         // Using relationships if defined in ItemMaster would be better
                         $brand = $item->brand; 
                    }
                } catch (\Exception $e) {}


                return [
                    'ItmKy' => $item->ItmKy,
                    'ItemCode' => $item->ItemCode,
                    'ItmNm' => $item->ItmNm,
                    'category_name' => $category ? $category->cname : 'N/A',
                    'supplier_name' => $supplier ? $supplier->AccNm : 'N/A',
                    'unit_name' => $unit ? $unit->cname : ($item->Unit ?? 'N/A'),
                    'CosPri' => (float) $item->CosPri,
                    'SlsPri' => (float) $item->SlsPri,
                    'WholePrice' => (float) $item->WholePrice,
                    'source_section' => $item->section_code,
                    'Qty' => (float) $item->Qty, 
                    'batch_no' => $item->batch_no ?? null,
                    'BarCode' => $item->BarCode ?? null,
                    'brand' => $brand ? $brand->name : null, // Adjust based on Brand model
                    // Fields that were specific to printers/stationaries in previous query might be missing
                    // or need to be mapped if they exist in ItemMaster
                    'PurchaseKey' => null, // Not standard in ItemMaster usually
                    'model' => null,
                    'serial_number' => null,
                ];
            })->toArray();

            return Inertia::render('Reports/ItemList', [
                'items' => $transformedItems,
                'categories' => $categories->toArray(),
                'sections' => $sections,
                'company' => $companyInfo,
                'filters' => [
                    'category' => $request->query('category', 'all'),
                    'section' => $request->query('section', 'all'),
                    'search' => $request->query('search', ''),
                    'start_date' => $request->query('start_date', ''),
                    'end_date' => $request->query('end_date', ''),
                ],
            ]);
        } catch (\Exception $e) {
            // Log the error
            Log::error('ItemList Report Error: ' . $e->getMessage());
            Log::error('ItemList Report Stack Trace: ' . $e->getTraceAsString());

            // Return with error data
            return Inertia::render('Reports/ItemList', [
                'items' => [],
                'categories' => [],
                'sections' => [
                    ['value' => 'all', 'label' => 'All Sections'],
                ],
                'company' => [
                    'name' => 'Company',
                    'section' => 'Main',
                    'code' => 'C01',
                    'section_code' => 'BR01',
                    'primary_color' => '#00aeef',
                    'secondary_color' => '#737578',
                ],
                'filters' => [
                    'category' => 'all',
                    'section' => 'all',
                    'search' => '',
                    'start_date' => '',
                    'end_date' => '',
                ],
                'error' => 'An error occurred while loading the report. Please try again.',
                'debug_error' => config('app.debug') ? $e->getMessage() : null,
            ]);
        }
    }
}