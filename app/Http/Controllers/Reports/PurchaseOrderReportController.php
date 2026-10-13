<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Purchase;
use App\Models\Address;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseOrderReportController extends Controller
{
    public function index(Request $request)
    {
        $company = $this->getCompany();
        
        $fromDate = $request->get('from_date', Carbon::now()->subMonths(1)->format('Y-m-d'));
        $toDate = $request->get('to_date', Carbon::now()->format('Y-m-d'));
        $supplierId = $request->get('supplier_id', 'all');
        $status = $request->get('status', 'all');
        
        $filters = [
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'supplier_id' => $supplierId,
            'status' => $status,
        ];
        
        // Fetch Suppliers for dropdown
        $suppliers = Address::where('company_code', $company->company_code ?? 'C01')
            ->whereHas('accMas', function ($q) {
                $q->where('AccTyp', 'SUPPLIER');
            })
            ->select('AdrKy', 'AdrCd', 'FstNm', 'LstNm')
            ->orderBy('FstNm')
            ->get()
            ->map(function ($supplier) {
                return [
                    'value' => $supplier->AdrCd,
                    'label' => $supplier->FstNm . ' ' . $supplier->LstNm,
                ];
            });
            
        $data = null;
        $totals = null;
        
        if ($fromDate && $toDate) {
            $result = $this->getPurchaseData($fromDate, $toDate, $supplierId, $status);
            $data = $result['data'];
            $totals = $result['totals'];
        }
        
        return Inertia::render('Reports/PurchaseOrderReport', [
            'company' => [
                'name' => $company->company_name ?? 'VISMASS PVT LTD',
                'branch' => $company->branch ?? 'Main Branch',
                'code' => $company->company_code ?? 'VISMASS',
                'branch_code' => $company->branch_code ?? '001',
            ],
            'filters' => $filters,
            'suppliers' => $suppliers,
            'reportData' => $data,
            'totals' => $totals,
        ]);
    }
    
    public function pdf(Request $request)
    {
        $company = $this->getCompany();
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $supplierId = $request->get('supplier_id', 'all');
        $status = $request->get('status', 'all');
        
        if (!$fromDate || !$toDate) {
            return back()->with('error', 'Please select valid date range');
        }
        
        $result = $this->getPurchaseData($fromDate, $toDate, $supplierId, $status);
        
        $pdf = Pdf::loadView('reports.purchase-orders-pdf', [
            'company' => [
                'name' => $company->company_name ?? 'VISMASS PVT LTD',
                'branch' => $company->branch ?? 'Main Branch',
                'code' => $company->company_code ?? 'VISMASS',
                'branch_code' => $company->branch_code ?? '001',
            ],
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'supplier_id' => $supplierId,
                'status' => $status,
            ],
            'reportData' => $result['data'],
            'totals' => $result['totals'],
            'fromDate' => $fromDate,
            'toDate' => $toDate,
        ]);
        
        $filename = "purchase-order-report-" . date('Y-m-d') . ".pdf";
        
        return $pdf->download($filename);
    }
    
    private function getPurchaseData($fromDate, $toDate, $supplierId, $status)
    {
        $from = Carbon::parse($fromDate)->startOfDay();
        $to = Carbon::parse($toDate)->endOfDay();
        
        $query = Purchase::with(['supplier', 'details'])
            ->whereBetween('GRNDate', [$from, $to]);
            
        if ($supplierId !== 'all') {
            $query->where('SuppCode', $supplierId);
        }
        
        if ($status !== 'all') {
            $query->where('Status', $status);
        }
        
        $purchases = $query->orderBy('GRNDate', 'desc')->get();
        
        $data = $purchases->map(function ($purchase) {
            $totalItems = $purchase->details->count();
            $totalQty = $purchase->details->sum(function($detail) {
                return $detail->Qty + ($detail->Free ?? 0);
            });
            
            return [
                'id' => $purchase->PurchaseKey,
                'order_number' => $purchase->formatted_purchase_no ?? 'GRN-' . $purchase->PurchaseNo,
                'order_date' => $purchase->GRNDate->format('Y-m-d'),
                'supplier_name' => $purchase->supplier ? ($purchase->supplier->FstNm . ' ' . $purchase->supplier->LstNm) : 'N/A',
                'branch_name' => 'Main Branch', // Adjust if multi-branch logic exists
                'total_items' => $totalItems,
                'total_quantity' => $totalQty,
                'total_value' => $purchase->TotalVal,
                'received_value' => $purchase->TotalVal, // Assuming GRN implies received
                'status' => $purchase->Status == 'A' ? 'Completed' : 'Pending', // Adjust based on Status mapping
            ];
        });
        
        $totals = [
            'orders_count' => $data->count(),
            'total_value' => $data->sum('total_value'),
            'received_value' => $data->sum('received_value'),
            'total_items' => $data->sum('total_quantity'), // Summing qty as "Items" usually refers to unit count
        ];
        
        return [
            'data' => $data,
            'totals' => $totals
        ];
    }
    
    private function getCompany()
    {
        if (auth('company')->check()) {
            return auth('company')->user();
        }
        
        $user = auth('web')->user();
        return $user ? $user->company : Company::first();
    }
}
