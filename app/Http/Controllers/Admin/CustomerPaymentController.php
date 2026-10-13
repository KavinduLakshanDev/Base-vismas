<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\CustomerPayment;
use App\Models\Customer;
use App\Models\AccMas;
use App\Models\Address;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

use Dompdf\Dompdf;
use Dompdf\Options;

class CustomerPaymentController extends Controller
{
    // ... existing code ...

    public function generateReceipt(CustomerPayment $customerPayment)
    {
        if (!request()->user()->hasPermission('customer_payments.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view customer payments.');
        }

        $customerPayment->load('customer');
        
        $currentBalance = 0;
        $customerId = $customerPayment->customer_id;
        $accKy = null;

        // Resolve AccKy and Customer ID
        if ($customerPayment->customer) {
            $customerId = $customerPayment->customer->AdrKy;
            $accKy = $customerPayment->customer->AccKy;
        }

        // Get the actual account balance from AccMas, which can be negative for overpayments
        if ($accKy) {
            $customerAcc = AccMas::find($accKy);
            $currentBalance = $customerAcc ? (float)$customerAcc->CurBal : 0;
        }

        $html = $this->generateReceiptHtml($customerPayment, $currentBalance);

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        
        $dompdf = new Dompdf($options);
        // 80mm generic thermal paper width (approx 226pt)
        $dompdf->setPaper([0, 0, 226.77, 600], 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return $dompdf->stream('payment-' . $customerPayment->id . '.pdf', [
            'Attachment' => false
        ]);
    }

    private function generateReceiptHtml($payment, $balance)
    {
        $companyName = auth()->user()->company->name ?? 'Company Name';
        $companyAddress = auth()->user()->company->address ?? 'Address';
        $companyPhone = auth()->user()->company->phone ?? 'Phone';

        $totalPaid = number_format($payment->amount, 2);
        $balanceFormatted = number_format($balance, 2);
        
        $customerName = 'N/A';
        if ($payment->customer) {
            $customerName = trim($payment->customer->FstNm . ' ' . $payment->customer->LstNm);
            if (empty($customerName) && $payment->customer->account) {
                 $customerName = $payment->customer->account->AccNm;
            }
        }
        
        $date = $payment->date instanceof \DateTime ? $payment->date->format('Y-m-d H:i') : $payment->date;

        return "
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; }
                .header { text-align: center; margin-bottom: 10px; }
                .title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
                .details { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                .label { font-weight: bold; }
                .footer { text-align: center; margin-top: 15px; font-size: 10px; }
                .amount-box { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0; margin: 5px 0; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class='header'>
                <div class='title'>$companyName</div>
                <div>$companyAddress</div>
                <div>Tel: $companyPhone</div>
                <div style='margin-top:5px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 2px;'>PAYMENT RECEIPT</div>
            </div>

            <div class='details'>
                <div class='row'>
                    <span class='label'>Date:</span>
                    <span>$date</span>
                </div>
                <div class='row'>
                    <span class='label'>Receipt No:</span>
                    <span>PAY-{$payment->id}</span>
                </div>
                <div class='row'>
                    <span class='label'>Customer:</span>
                    <span>{$customerName}</span>
                </div>
                <!-- <div class='row'>
                    <span class='label'>Code:</span>
                    <span>{$payment->customer_code}</span>
                </div> -->
                " . ($payment->sales_transaction_id ? "
                <div class='row'>
                    <span class='label'>Invoice Ref:</span>
                    <span>{$payment->sales_transaction_id}</span>
                </div>" : "") . "
                 " . ($payment->service_job_id ? "
                <div class='row'>
                    <span class='label'>Job Ref:</span>
                    <span>{$payment->service_job_id}</span>
                </div>" : "") . "
            </div>

            <div class='details'>
                <div class='row'>
                    <span class='label'>Payment Mode:</span>
                    <span style='text-transform: capitalize;'>{$payment->method}</span>
                </div>
                " . ($payment->method == 'cheque' ? "
                <div class='row'>
                    <span class='label'>Cheque No:</span>
                    <span>{$payment->cheque_no}</span>
                </div>
                " . ($payment->branch ? "
                <div class='row'>
                    <span class='label'>Branch:</span>
                    <span>{$payment->branch}</span>
                </div>" : "") . "
                " : "") . "
                 " . ($payment->method == 'bank' ? "
                <div class='row'>
                    <span class='label'>Ref No:</span>
                    <span>{$payment->reference}</span>
                </div>
                " . ($payment->branch ? "
                <div class='row'>
                    <span class='label'>Branch:</span>
                    <span>{$payment->branch}</span>
                </div>" : "") . "
                " : "") . "
            </div>

            <div class='amount-box'>
                <div class='row' style='font-size: 14px;'>
                    <span>AMOUNT PAID:</span>
                    <span>Rs $totalPaid</span>
                </div>
            </div>

            <div class='row' style='margin-top: 10px;'>
                <span class='label'>Outstanding Balance:</span>
                <span>Rs $balanceFormatted</span>
            </div>

            <div class='footer'>
                <p>Thank you for your business!</p>
                <p>System Generated Receipt</p>
            </div>
        </body>
        </html>
        ";
    }
    public function index(Request $request)
    {
        if (!request()->user()->hasPermission('customer_payments.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view customer payments.');
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = CustomerPayment::with('customer');
        $customerQuery = Customer::select('AdrKy', 'FstNm', 'LstNm', 'AdrCd', 'AccKy')
            ->where('AdrCd', 'like', 'CUS%');

        if ($user && $user->role_id !== 1) { // Not superadmin
            if ($user->role_id === 3) {
                $query->whereHas('customer', function($q) use ($user) {
                    $q->where('section_code', $user->section_code);
                });
                $customerQuery->where('section_code', $user->section_code);
            } else {
                $query->whereHas('customer', function($q) use ($user) {
                    $q->where('company_code', $user->company_code);
                });
                $customerQuery->where('company_code', $user->company_code);
            }
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('CustomerPayments/Create', [
            'payments' => $payments,
            'customers' => $customerQuery->get()
        ]);
    }

    public function getPendingServiceJobs(Request $request)
    {
        if (!request()->user()->hasPermission('customer_payments.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $customerId = $request->query('customer_id');

            if (!$customerId) {
                return response()->json([]);
            }

            // Robust resolution: try to find by AdrKy first, if not assume it's AccKy
            $address = Address::find($customerId);
            if ($address) {
                $accKy = $address->AccKy;
            } else {
                // Check if it's a direct AccKy
                $existsInAccMas = AccMas::where('AccKy', $customerId)->exists();
                $accKy = $existsInAccMas ? $customerId : null;
            }

            if (!$accKy) {
                return response()->json([]);
            }

            $jobs = ServiceJob::with('items')
                ->where('AccKy', (int) $accKy)
                ->where('status', '!=', 'cancelled')
                ->where(function($q) {
                    $q->where('balance_amount', '>', 0)
                      ->orWhereNull('balance_amount');
                })
                ->orderBy('id', 'desc')
                ->get();

            // Get account balance
            $customerAcc = AccMas::find($accKy);
            $accountBalance = $customerAcc ? (float)$customerAcc->CurBal : 0;

            return response()->json([
                'jobs' => $jobs,
                'account_balance' => $accountBalance
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getPendingServiceJobs: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function getPendingInvoices(Request $request)
    {
        if (!request()->user()->hasPermission('customer_payments.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            return response()->json([]);
        } catch (\Exception $e) {
            Log::error('Error in getPendingInvoices: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('customer_payments.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create customer payments.');
        }

        $rules = [
            'amount' => 'required|numeric|min:0.01',
            'TrnDt' => 'required|date',
            'method' => 'required|string',
            'ChqueNo' => 'nullable|string',
            'BankNm' => 'nullable|string',
            'ChqueBranch' => 'nullable|string',
            'BankBranch' => 'nullable|string',
            'ChqueDt' => 'nullable|date',
            'CardLast4' => 'nullable|string',
            'CardAuthCode' => 'nullable|string',
            'Reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'AccKy' => 'required',
        ];

        $validated = $request->validate($rules);
        
        $accKy = null; 
        $adrKy = null; 
        $customerCode = null;

        // RESOLUTION LOGIC: Determine if it's an AdrKy or AccKy
        $inputKey = $validated['AccKy'];
        
        // Try treating it as AdrKy (Address ID)
        $address = Address::find($inputKey);
        if ($address) {
            $adrKy = $address->AdrKy;
            $accKy = $address->AccKy;
        } else {
            // Try treating it as AccKy (Account ID)
            $accMas = AccMas::find($inputKey);
            if ($accMas) {
                $accKy = $accMas->AccKy;
                // Find primary address for this account
                $address = Address::where('AccKy', $accKy)->orderBy('AdrTypKy', 'asc')->first();
                $adrKy = $address ? $address->AdrKy : null;
            }
        }

        if (!$accKy) {
            return back()->withErrors(['AccKy' => 'Invalid Customer selection.']);
        }

        // Get customer code from AccMas
        if ($accKy) {
            $accMas = AccMas::find($accKy);
            $customerCode = $accMas ? $accMas->AccCd : null;
        }

        $payment = DB::transaction(function () use ($validated, $accKy, $adrKy, $customerCode) {
            $payment = CustomerPayment::create([
                'customer_id' => $adrKy,
                'customer_code' => $customerCode,
                'amount' => $validated['amount'],
                'date' => $validated['TrnDt'],
                'method' => $validated['method'],
                'cheque_no' => $validated['ChqueNo'] ?? null,
                'bank_name' => $validated['BankNm'] ?? null,
                'branch' => $validated['ChqueBranch'] ?? $validated['BankBranch'] ?? null,
                'card_last_4' => $validated['CardLast4'] ?? null,
                'card_auth_code' => $validated['CardAuthCode'] ?? null,
                'reference' => $validated['Reference'] ?? null,
                'cheque_date' => $validated['ChqueDt'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed',
            ]);

            // Update customer's current balance
            if ($accKy) {
                /** @var AccMas $customerAcc */
                $customerAcc = AccMas::find($accKy);
                if ($customerAcc) {
                    $customerAcc->CurBal = (float) $customerAcc->CurBal - (float) $validated['amount'];
                    $customerAcc->save();

                    // Create Accounting Transaction with Unique Reference
                    \App\Models\AccTrn::create([
                        'AccKy' => $customerAcc->AccKy,
                        'TrnDt' => $validated['TrnDt'],
                        'TrnNo' => 'CPY-' . now()->format('YmdHis') . '-' . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT),
                        'Amt' => -1 * abs($validated['amount']),
                        'VaucherNo' => $validated['Reference'] ?? null,
                        'ChqueNo' => $validated['ChqueNo'] ?? null,
                        'BankNm' => $validated['BankNm'] ?? null,
                        'BranchNm' => $validated['ChqueBranch'] ?? $validated['BankBranch'] ?? null,
                        'Dec' => $validated['notes'] ?? 'Customer Payment',
                        'FInAct' => 1,
                        'Status' => 'A',
                        'company_code' => $customerAcc->company_code ?? null,
                        'section_code' => $customerAcc->section_code ?? null,
                        'customer_code' => $customerCode,
                        'customer_name' => $customerAcc->AccNm ?? null,
                    ]);
                }
            }

            return $payment;
        });

        return redirect()->back()->with('success', 'Payment recorded successfully')->with('payment_id', $payment->id);
    }
}
