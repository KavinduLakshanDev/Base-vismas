<?php

namespace App\Http\Controllers\Reports;

use App\Models\CustomerPayment;
use App\Models\ServiceJob;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Http\Controllers\Controller;

class CollectionReportController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));
        $customerId = $request->get('customer_id');
        $paymentMethod = $request->get('payment_method');
        $technicianId = $request->get('technician_id');
        $serialNumber = $request->get('serial_number');
        $jobNumber = $request->get('job_number');
        $reportType = $request->get('report_type', 'daily'); // daily, monthly

        // Build query for payments
        $paymentsQuery = CustomerPayment::with(['customer', 'serviceJob.technician'])
            ->whereBetween('date', [$startDate, $endDate]);

        if ($customerId && $customerId !== 'all') {
            $paymentsQuery->where('customer_id', $customerId);
        }

        if ($paymentMethod && $paymentMethod !== 'all') {
            $paymentsQuery->where('method', $paymentMethod);
        }

        if ($technicianId && $technicianId !== 'all') {
            $paymentsQuery->whereHas('serviceJob', function ($q) use ($technicianId) {
                $q->where('assigned_technician_id', $technicianId);
            });
        }

        if ($serialNumber) {
            $paymentsQuery->whereHas('serviceJob', function ($q) use ($serialNumber) {
                $q->where('device_serial', 'like', '%' . $serialNumber . '%');
            });
        }

        if ($jobNumber) {
            $paymentsQuery->whereHas('serviceJob', function ($q) use ($jobNumber) {
                $q->where('job_number', 'like', '%' . $jobNumber . '%');
            });
        }

        $payments = $paymentsQuery->orderBy('date', 'desc')->get();

        // FALLBACK LOGIC: For payments without a direct service_job_id, 
        // try to find the most relevant service job for the customer for reporting purposes.
        $payments->each(function($payment) {
            if (!$payment->service_job_id && $payment->customer) {
                // 1. Try matching by AccKy (Account Key)
                $bestJob = null;
                if ($payment->customer->AccKy) {
                    $bestJob = ServiceJob::with(['technician'])
                        ->where('AccKy', $payment->customer->AccKy)
                        ->where('received_date', '<=', $payment->date)
                        ->orderByRaw("ABS(DATEDIFF(received_date, ?))", [$payment->date])
                        ->first();
                }

                // 2. If no AccKy match, try matching by Customer Name in service_jobs table
                if (!$bestJob) {
                    $fullName = trim($payment->customer->FstNm . ' ' . $payment->customer->LstNm);
                    $bestJob = ServiceJob::with(['technician'])
                        ->where('customer_name', 'like', '%' . $fullName . '%')
                        ->where('received_date', '<=', $payment->date)
                        ->orderByRaw("ABS(DATEDIFF(received_date, ?))", [$payment->date])
                        ->first();
                }

                if ($bestJob) {
                    // Dynamically associate it for the report view
                    $payment->setRelation('serviceJob', $bestJob);
                }
            }
        });

        // Specific customer data if filtered
        $customerSummary = null;
        if ($customerId && $customerId !== 'all') {
            $customer = Customer::find($customerId);
            if ($customer) {
                $customerSummary = [
                    'name' => $customer->FstNm . ' ' . $customer->LstNm,
                    'code' => $customer->AdrCd,
                    'phone' => $customer->Mob,
                    'email' => $customer->Email,
                    'total_paid' => CustomerPayment::where('customer_id', $customerId)->sum('amount'),
                    'total_outstanding' => ServiceJob::where('AccKy', $customer->AccKy)->sum('balance_amount'),
                    'job_count' => ServiceJob::where('AccKy', $customer->AccKy)->count(),
                    'last_payment' => CustomerPayment::where('customer_id', $customerId)->latest('date')->first()?->date,
                ];
            }
        }

        // Get filter options
        $customers = Customer::select('AdrKy', 'FstNm', 'LstNm', 'AdrCd')->get();
        $technicians = User::whereHas('serviceJobs')
            ->select('id', 'first_name', 'last_name')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->first_name . ' ' . $u->last_name
                ];
            });
        $paymentMethods = ['cash', 'cheque', 'bank', 'card', 'credit'];

        // Generate chart data
        $chartData = $this->generateChartData($payments, $reportType, $startDate, $endDate);

        return inertia('Reports/CollectionReport', [
            'payments' => $payments,
            'customers' => $customers,
            'technicians' => $technicians,
            'paymentMethods' => $paymentMethods,
            'chartData' => $chartData,
            'customerSummary' => $customerSummary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'customer_id' => $customerId,
                'payment_method' => $paymentMethod,
                'technician_id' => $technicianId,
                'serial_number' => $serialNumber,
                'job_number' => $jobNumber,
                'report_type' => $reportType,
            ],
            'summary' => $this->generateSummary($payments),
        ]);
    }

    private function generateChartData($payments, $reportType, $startDate, $endDate)
    {
        $data = [];

        if ($reportType === 'daily') {
            // Daily chart data
            $dates = collect();
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate <= $endDateCarbon) {
                $dateStr = $currentDate->format('Y-m-d');
                $dayPayments = $payments->where('date', $dateStr);

                $data[] = [
                    'date' => $currentDate->format('M d'),
                    'full_date' => $dateStr,
                    'total' => $dayPayments->sum('amount'),
                    'cash' => $dayPayments->where('method', 'cash')->sum('amount'),
                    'cheque' => $dayPayments->where('method', 'cheque')->sum('amount'),
                    'bank' => $dayPayments->where('method', 'bank')->sum('amount'),
                    'card' => $dayPayments->where('method', 'card')->sum('amount'),
                    'credit' => $dayPayments->where('method', 'credit')->sum('amount'),
                    'count' => $dayPayments->count(),
                ];

                $currentDate->addDay();
            }
        } else {
            // Monthly chart data
            $months = collect();
            $currentDate = Carbon::parse($startDate)->startOfMonth();
            $endDateCarbon = Carbon::parse($endDate)->endOfMonth();

            while ($currentDate <= $endDateCarbon) {
                $monthStr = $currentDate->format('Y-m');
                $monthPayments = $payments->filter(function ($payment) use ($monthStr) {
                    return Carbon::parse($payment->date)->format('Y-m') === $monthStr;
                });

                $data[] = [
                    'date' => $currentDate->format('M Y'),
                    'full_date' => $monthStr,
                    'total' => $monthPayments->sum('amount'),
                    'cash' => $monthPayments->where('method', 'cash')->sum('amount'),
                    'cheque' => $monthPayments->where('method', 'cheque')->sum('amount'),
                    'bank' => $monthPayments->where('method', 'bank')->sum('amount'),
                    'card' => $monthPayments->where('method', 'card')->sum('amount'),
                    'credit' => $monthPayments->where('method', 'credit')->sum('amount'),
                    'count' => $monthPayments->count(),
                ];

                $currentDate->addMonth();
            }
        }

        return $data;
    }

    private function generateSummary($payments)
    {
        return [
            'total_amount' => $payments->sum('amount'),
            'total_payments' => $payments->count(),
            'average_payment' => $payments->count() > 0 ? $payments->sum('amount') / $payments->count() : 0,
            'payment_methods' => [
                'cash' => $payments->where('method', 'cash')->sum('amount'),
                'cheque' => $payments->where('method', 'cheque')->sum('amount'),
                'bank' => $payments->where('method', 'bank')->sum('amount'),
                'card' => $payments->where('method', 'card')->sum('amount'),
                'credit' => $payments->where('method', 'credit')->sum('amount'),
            ],
            'top_customers' => $payments->groupBy('customer_id')->map(function ($customerPayments) {
                $customer = $customerPayments->first()->customer;
                return [
                    'name' => $customer ? ($customer->FstNm . ' ' . $customer->LstNm) : 'Unknown',
                    'code' => $customer ? $customer->AdrCd : 'N/A',
                    'total' => $customerPayments->sum('amount'),
                    'count' => $customerPayments->count(),
                ];
            })->sortByDesc('total')->take(10)->values(),
            'technician_performance' => $payments->groupBy(function ($payment) {
                if ($payment->serviceJob) {
                    return $payment->serviceJob->technician_name ?: ($payment->serviceJob->technician ? ($payment->serviceJob->technician->first_name . ' ' . $payment->serviceJob->technician->last_name) : 'Unassigned');
                }
                return 'Unassigned';
            })->map(function ($techPayments, $techName) {
                return [
                    'name' => $techName,
                    'total' => $techPayments->sum('amount'),
                    'count' => $techPayments->count(),
                ];
            })->sortByDesc('total')->values(),
        ];
    }
}