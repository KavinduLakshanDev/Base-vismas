<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Company;
use App\Models\Section;
use Barryvdh\DomPDF\Facade\Pdf;

class PrinterStockReportController extends Controller
{
    public function index(Request $request)
    {
        if (!request()->user()->hasPermission('printing.stock.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view printer stock.');
        }

        $user = Auth::user();
        $company = $user->company ?? Company::first();
        $section = $user->section ?? Section::first();

        $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
        $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

        if ($request->has('section') && !empty($request->section)) {
            $requestedSection = Section::find($request->section);
            if ($requestedSection) {
                $sectionCode = $requestedSection->section_code;
                $companyCode = $requestedSection->company_code;
                $section = $requestedSection;
            }
        }

        $companyInfo = [
            'name' => $company ? ($company->name ?? 'Company') : 'Company',
            'section' => $section ? ($section->name ?? 'Main') : 'Main',
            'code' => $companyCode,
            'section_code' => $sectionCode,
        ];

        $sections = Section::where('company_code', $companyCode)
            ->where('is_active', true)
            ->select('id', 'name', 'section_code')
            ->orderBy('name')
            ->get();

        // Base query for printer stock
        $query = DB::table('stock_in_hand as sh')
            ->leftJoin('itemmaster as im', 'sh.ItemKy', '=', 'im.ItmKy')
            ->leftJoin('purchase_det as pd', function($join) {
                $join->on('sh.batch_no', '=', 'pd.batch_no')
                     ->on('sh.ItemKy', '=', 'pd.iTimKy')
                     ->on('sh.serial_number', '=', 'pd.serial_number');
            })
            ->leftJoin('sections as s', 'sh.section_code', '=', 's.section_code')
            ->select(
                'sh.brand',
                'sh.model',
                'sh.serial_number',
                'sh.batch_no',
                'sh.warranty',
                'sh.section_code',
                's.name as section_name',
                'im.ItemCode',
                DB::raw('COALESCE(pd.item_name, im.ItmNm) as item_name'),
                DB::raw('SUM(COALESCE(sh.Qty, 0) + COALESCE(sh.FreeQty, 0)) as balance')
            )
            ->where(function($q) {
                $q->whereNotNull('sh.serial_number')
                  ->where('sh.serial_number', '!=', '');
            })
            ->groupBy(
                'sh.brand',
                'sh.model',
                'sh.serial_number',
                'sh.batch_no',
                'sh.warranty',
                'sh.section_code',
                's.name',
                'im.ItemCode',
                'pd.item_name',
                'im.ItmNm'
            )
            ->having('balance', '>', 0);

        // Filters
        if ($request->section && $request->section !== 'all') {
            $requestedSection = Section::find($request->section);
            if ($requestedSection) {
                $query->where('sh.section_code', $requestedSection->section_code);
            }
        }

        if ($request->search) {
            $search = '%' . $request->search . '%';
            $query->where(function($q) use ($search) {
                $q->where('sh.serial_number', 'like', $search)
                  ->orWhere('sh.model', 'like', $search)
                  ->orWhere('sh.brand', 'like', $search)
                  ->orWhere('sh.batch_no', 'like', $search)
                  ->orWhere('pd.item_name', 'like', $search)
                  ->orWhere('im.ItmNm', 'like', $search);
            });
        }

        $perPage = $request->input('per_page', 10);
        
        $stockData = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Reports/PrinterStock', [
            'stockData' => $stockData,
            'sections' => $sections,
            'filters' => array_merge($request->all(['section', 'search']), ['per_page' => $perPage]),
            'companyInfo' => $companyInfo,
        ]);
    }

    public function generateReport(Request $request)
    {
        if (!request()->user()->hasPermission('printing.stock.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view printer stock.');
        }

        $user = Auth::user();
        $company = $user->company ?? Company::first();
        
        $query = DB::table('stock_in_hand as sh')
            ->leftJoin('itemmaster as im', 'sh.ItemKy', '=', 'im.ItmKy')
            ->leftJoin('purchase_det as pd', function($join) {
                $join->on('sh.batch_no', '=', 'pd.batch_no')
                     ->on('sh.ItemKy', '=', 'pd.iTimKy')
                     ->on('sh.serial_number', '=', 'pd.serial_number');
            })
            ->leftJoin('sections as s', 'sh.section_code', '=', 's.section_code')
            ->select(
                'sh.brand',
                'sh.model',
                'sh.serial_number',
                'sh.batch_no',
                'sh.warranty',
                'sh.section_code',
                's.name as section_name',
                'im.ItemCode',
                DB::raw('COALESCE(pd.item_name, im.ItmNm) as item_name'),
                DB::raw('SUM(COALESCE(sh.Qty, 0) + COALESCE(sh.FreeQty, 0)) as balance')
            )
            ->where(function($q) {
                $q->whereNotNull('sh.serial_number')
                  ->where('sh.serial_number', '!=', '');
            })
            ->groupBy(
                'sh.brand',
                'sh.model',
                'sh.serial_number',
                'sh.batch_no',
                'sh.warranty',
                'sh.section_code',
                's.name',
                'im.ItemCode',
                'pd.item_name',
                'im.ItmNm'
            )
            ->having('balance', '>', 0)
            ->orderBy('sh.brand')
            ->orderBy('sh.model');

        if ($request->section && $request->section !== 'all') {
            $requestedSection = Section::find($request->section);
            if ($requestedSection) {
                $query->where('sh.section_code', $requestedSection->section_code);
            }
        }

        if ($request->search) {
            $search = '%' . $request->search . '%';
            $query->where(function($q) use ($search) {
                $q->where('sh.serial_number', 'like', $search)
                  ->orWhere('sh.model', 'like', $search)
                  ->orWhere('sh.brand', 'like', $search)
                  ->orWhere('sh.batch_no', 'like', $search);
            });
        }

        $stockData = $query->get();

        $data = [
            'title' => 'Printer Stock In Hand Report',
            'date' => date('Y-m-d H:i:s'),
            'stockData' => $stockData,
            'company' => $company,
        ];

        $pdf = Pdf::loadView('reports.printer_stock', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download('printer-stock-report.pdf');
    }
}
