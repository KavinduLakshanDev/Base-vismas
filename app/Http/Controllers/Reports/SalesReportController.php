<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\SalesTransaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class SalesReportController extends Controller
{
    public function index(Request $request)
    {
        $company = $this->getCompany();
        
        $reportType = $request->get('report_type', 'daily');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $itemType = $request->get('item_type', 'all');
        
        $filters = [
            'report_type' => $reportType,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'item_type' => $itemType,
        ];
        
        $salesData = null;
        
        if ($fromDate && $toDate) {
            $salesData = $this->getSalesData($reportType, $fromDate, $toDate, $itemType);
        }
        
        return Inertia::render('Reports/SalesReport', [
            'company' => [
                'name' => $company->company_name ?? 'VISMASS PVT LTD',
                'branch' => $company->branch ?? 'Main Branch',
                'code' => $company->company_code ?? 'VISMASS',
                'branch_code' => $company->branch_code ?? '001',
            ],
            'filters' => $filters,
            'salesData' => $salesData,
        ]);
    }
    
    public function pdf(Request $request)
    {
        $company = $this->getCompany();
        $reportType = $request->get('report_type', 'daily');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $itemType = $request->get('item_type', 'all');
        
        if (!$fromDate || !$toDate) {
            return back()->with('error', 'Please select valid date range');
        }
        
        $salesData = $this->getSalesData($reportType, $fromDate, $toDate, $itemType);
        
        $pdf = Pdf::loadView('reports.sales-pdf', [
            'company' => [
                'name' => $company->company_name ?? 'VISMASS PVT LTD',
                'branch' => $company->branch ?? 'Main Branch',
                'code' => $company->company_code ?? 'VISMASS',
                'branch_code' => $company->branch_code ?? '001',
            ],
            'reportType' => $reportType,
            'salesData' => $salesData,
            'fromDate' => $fromDate,
            'toDate' => $toDate,
        ]);
        
        $filename = "sales-report-{$reportType}-" . date('Y-m-d') . ".pdf";
        
        return $pdf->download($filename);
    }
    
    private function getSalesData($reportType, $fromDate, $toDate, $itemType = 'all')
    {
        $from = Carbon::parse($fromDate)->startOfDay();
        $to = Carbon::parse($toDate)->endOfDay();
        
        if ($reportType === 'daily') {
            return $this->getDailySalesData($from, $to, $itemType);
        } else {
            return $this->getMonthlySalesData($from, $to, $itemType);
        }
    }
    
    private function getDailySalesData($from, $to, $itemType = 'all')
    {
        $query = SalesTransaction::whereBetween('transaction_date', [$from, $to])
            ->where('status', 'completed');
        
        // Filter by item type based on invoice prefix
        if ($itemType === 'printer') {
            $query->where('invoice_no', 'like', 'PRI-%');
        } elseif ($itemType === 'stationary') {
            $query->where('invoice_no', 'like', 'ITM-%');
        }
        
        $transactions = $query->orderBy('transaction_date')
            ->orderBy('invoice_no')
            ->get();
        
        // Group transactions by date
        $dailySummaries = [];
        $transactionsByDate = $transactions->groupBy(function ($transaction) {
            return $transaction->transaction_date->format('Y-m-d');
        });
        
        foreach ($transactionsByDate as $date => $dayTransactions) {
            $paymentDetails = $dayTransactions->pluck('payment_details')->filter();
            
            $totalCash = $paymentDetails->sum(function ($details) {
                return $details['cash'] ?? 0;
            });
            
            $totalCredit = $paymentDetails->sum(function ($details) {
                return $details['voucher'] ?? 0;
            });
            
            $totalCard = $paymentDetails->sum(function ($details) {
                return $details['card'] ?? 0;
            });
            
            $dailySummaries[] = [
                'date' => $date,
                'start_invoice' => $dayTransactions->first()->invoice_no,
                'end_invoice' => $dayTransactions->last()->invoice_no,
                'total_amount' => $dayTransactions->sum('total_amount'),
                'total_cash' => $totalCash,
                'total_credit' => $totalCredit,
                'total_card' => $totalCard,
                'transaction_count' => $dayTransactions->count(),
                'transactions' => $dayTransactions->map(function ($transaction) {
                    $payment = $transaction->payment_details ?? [];
                    return [
                        'invoice_no' => $transaction->invoice_no,
                        'total_amount' => $transaction->total_amount,
                        'cash_payment' => $payment['cash'] ?? 0,
                        'voucher_amount' => $payment['voucher'] ?? 0,
                        'credit_card_amount' => $payment['card'] ?? 0,
                        'points_redeemed' => $payment['points'] ?? 0,
                        'transaction_date' => $transaction->transaction_date->format('Y-m-d'),
                    ];
                })->values()->all(),
            ];
        }
        
        $totalPaymentDetails = $transactions->pluck('payment_details')->filter();
        
        return [
            'daily_summaries' => $dailySummaries,
            'total_amount' => $transactions->sum('total_amount'),
            'total_cash' => $totalPaymentDetails->sum(function ($details) {
                return $details['cash'] ?? 0;
            }),
            'total_credit' => $totalPaymentDetails->sum(function ($details) {
                return $details['voucher'] ?? 0;
            }),
            'total_card' => $totalPaymentDetails->sum(function ($details) {
                return $details['card'] ?? 0;
            }),
            'total_points' => $totalPaymentDetails->sum(function ($details) {
                return $details['points'] ?? 0;
            }),
            'transaction_count' => $transactions->count(),
        ];
    }
    
    private function getMonthlySalesData($from, $to, $itemType = 'all')
    {
        $query = SalesTransaction::whereBetween('transaction_date', [$from, $to])
            ->where('status', 'completed');
        
        // Filter by item type based on invoice prefix
        if ($itemType === 'printer') {
            $query->where('invoice_no', 'like', 'PRI-%');
        } elseif ($itemType === 'stationary') {
            $query->where('invoice_no', 'like', 'ITM-%');
        }
        
        $transactions = $query->orderBy('transaction_date')
            ->get();
        
        // Group transactions by date for daily summaries
        $dailySummaries = [];
        $transactionsByDate = $transactions->groupBy(function ($transaction) {
            return $transaction->transaction_date->format('Y-m-d');
        });
        
        foreach ($transactionsByDate as $date => $dayTransactions) {
            $paymentDetails = $dayTransactions->pluck('payment_details')->filter();
            
            $totalCash = $paymentDetails->sum(function ($details) {
                return $details['cash'] ?? 0;
            });
            
            $totalCredit = $paymentDetails->sum(function ($details) {
                return $details['voucher'] ?? 0;
            });
            
            $totalCard = $paymentDetails->sum(function ($details) {
                return $details['card'] ?? 0;
            });
            
            $dailySummaries[] = [
                'date' => $date,
                'start_invoice' => $dayTransactions->first()->invoice_no,
                'end_invoice' => $dayTransactions->last()->invoice_no,
                'total_amount' => $dayTransactions->sum('total_amount'),
                'total_cash' => $totalCash,
                'total_credit' => $totalCredit,
                'total_card' => $totalCard,
                'transaction_count' => $dayTransactions->count(),
            ];
        }
        
        $totalPaymentDetails = $transactions->pluck('payment_details')->filter();
        
        return [
            'daily_summaries' => $dailySummaries,
            'total_amount' => $transactions->sum('total_amount'),
            'total_cash' => $totalPaymentDetails->sum(function ($details) {
                return $details['cash'] ?? 0;
            }),
            'total_credit' => $totalPaymentDetails->sum(function ($details) {
                return $details['voucher'] ?? 0;
            }),
            'total_card' => $totalPaymentDetails->sum(function ($details) {
                return $details['card'] ?? 0;
            }),
            'total_points' => $totalPaymentDetails->sum(function ($details) {
                return $details['points'] ?? 0;
            }),
            'transaction_count' => $transactions->count(),
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
