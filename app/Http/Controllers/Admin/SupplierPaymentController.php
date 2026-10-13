<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupplierPayment;
use App\Models\Address;
use App\Models\AccMas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Dompdf\Dompdf;
use Dompdf\Options;

class SupplierPaymentController extends Controller
{
    /**
     * Display a listing of supplier payments
     */
    public function index(Request $request)
    {
        if (!request()->user()->hasPermission('supplier_payments.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view supplier payments.');
        }

        return Inertia::render('admin/supplier-payments/index');
    }

    /**
     * Search suppliers for payment
     */
    public function searchSuppliers(Request $request)
    {
        if (!request()->user()->hasPermission('supplier_payments.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        $search = $request->query('search');

        $suppliersQuery = Address::select('address.AdrKy', 'address.AdrCd', 'address.FstNm', 'address.LstNm', 'address.TP1', 'address.Address')
            ->join('acc_mas', 'address.AccKy', '=', 'acc_mas.AccKy')
            ->where('address.AdrTypKy', 4)
            ->where('acc_mas.AccTyp', 'SUPPLIER')
            ->whereNotNull('address.AccKy');

        if ($search) {
            $suppliersQuery->where(function ($query) use ($search) {
                $query->where('address.AdrCd', 'like', "%{$search}%")
                    ->orWhere('address.FstNm', 'like', "%{$search}%")
                    ->orWhere('address.LstNm', 'like', "%{$search}%")
                    ->orWhere('address.TP1', 'like', "%{$search}%");
            });
        }

        if ($user && $user->role_id !== 1) {
            if ($user->role_id === 3) {
                $suppliersQuery->where('address.section_code', $user->section_code);
            } else {
                $suppliersQuery->where('address.company_code', $user->company_code);
            }
        }

        $suppliers = $suppliersQuery->limit(10)->get();

        return response()->json($suppliers);
    }

    /**
     * Show the form for creating a new supplier payment
     */
    public function create(Request $request)
    {
        if (!request()->user()->hasPermission('supplier_payments.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create supplier payments.');
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        
        // Get suppliers based on user role
        $suppliersQuery = Address::select('address.AdrKy', 'address.AdrCd', 'address.FstNm', 'address.LstNm', 'address.Address', 'address.TP1', 'address.TP2', 'address.TP3', 'address.AccKy')
            ->join('acc_mas', 'address.AccKy', '=', 'acc_mas.AccKy')
            ->where('address.AdrTypKy', 4) // 4 = Supplier type
            ->where('acc_mas.AccTyp', 'SUPPLIER')
            ->whereNotNull('address.AccKy');

        if ($user && $user->role_id !== 1) { // Not superadmin
            if ($user->role_id === 3) { // Branch level
                $suppliersQuery->where('address.section_code', $user->section_code);
            } else { // Company level
                $suppliersQuery->where('address.company_code', $user->company_code);
            }
        }

        $suppliers = $suppliersQuery->orderBy('address.AdrCd')->get();

        return Inertia::render('admin/supplier-payments/create', [
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Get supplier details by ID
     */
    public function getSupplierDetails(Request $request)
    {
        if (!request()->user()->hasPermission('supplier_payments.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $supplierId = $request->query('supplier_id');

            if (!$supplierId) {
                Log::warning('Supplier ID not provided in request');
                return response()->json(['error' => 'Supplier ID is required'], 400);
            }

            Log::info('Fetching supplier details for ID: ' . $supplierId);

            $supplier = Address::with('account')
                ->where('AdrKy', $supplierId)
                ->where('AdrTypKy', 4)
                ->first();

            if (!$supplier) {
                Log::warning('Supplier not found for ID: ' . $supplierId);
                return response()->json(['error' => 'Supplier not found'], 404);
            }

            Log::info('Supplier found: ' . $supplier->AdrCd . ', AccKy: ' . ($supplier->AccKy ?? 'NULL'));

            // Calculate balance from purchases and payments
            // Get total purchases for this supplier
            $totalPurchases = DB::table('purchase')
                ->where(function ($query) use ($supplier) {
                    $query->where('SuppCode', $supplier->AdrCd)
                          ->orWhere('AccKy', $supplier->AccKy);
                })
                ->sum('TotalVal');

            // Get total payments for this supplier
            $totalPayments = SupplierPayment::where('supplier_code', $supplier->AdrCd)
                ->sum('paid_amount');

            // Calculate current balance (purchases - payments)
            $balance = $totalPurchases - $totalPayments;
            
            Log::info('Balance calculation for ' . $supplier->AdrCd . ' - Purchases: ' . $totalPurchases . ', Payments: ' . $totalPayments . ', Balance: ' . $balance);

            return response()->json([
                'code' => $supplier->AdrCd,
                'name' => trim(($supplier->FstNm ?? '') . ' ' . ($supplier->MidNm ?? '') . ' ' . ($supplier->LstNm ?? '')),
                'address' => $supplier->Address,
                'tel' => $supplier->TP1 ?? $supplier->TP2 ?? $supplier->TP3,
                'current_balance' => $balance,
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting supplier details: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Store a newly created supplier payment
     */
    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('supplier_payments.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create supplier payments.');
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:address,AdrKy',
            'payment_method' => 'required|in:Cash,Cheque,Bank,Online Transfer',
            'paid_amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            
            // Cheque fields
            'cheque_no' => 'required_if:payment_method,Cheque|nullable|string',
            'cheque_date' => 'required_if:payment_method,Cheque|nullable|date',
            'cheque_account_no' => 'required_if:payment_method,Cheque|nullable|string',
            'cheque_bank_name' => 'required_if:payment_method,Cheque|nullable|string',
            'cheque_branch' => 'nullable|string',
            
            // Bank deposit fields
            'bank_name' => 'required_if:payment_method,Bank|nullable|string',
            'bank_reference_no' => 'required_if:payment_method,Bank|nullable|string',
            'bank_deposit_date' => 'required_if:payment_method,Bank|nullable|date',
            'bank_account_no' => 'required_if:payment_method,Bank|nullable|string',
            'bank_branch' => 'nullable|string',
            
            // Online transfer fields
            'transfer_bank_name' => 'required_if:payment_method,Online Transfer|nullable|string',
            'transfer_transaction_id' => 'required_if:payment_method,Online Transfer|nullable|string',
            'transfer_date' => 'required_if:payment_method,Online Transfer|nullable|date',
            'transfer_reference_no' => 'required_if:payment_method,Online Transfer|nullable|string',
            'transfer_branch' => 'nullable|string',
            
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            /** @var \App\Models\User $user */
            $user = $request->user();

            // Get supplier details
            $supplier = Address::findOrFail($validated['supplier_id']);

            // Generate payment number (thread-safe)
            $paymentNo = SupplierPayment::generatePaymentNo();

            // Create payment record
            $payment = SupplierPayment::create([
                'payment_no' => $paymentNo,
                'supplier_id' => $validated['supplier_id'],
                'supplier_code' => $supplier->AdrCd,
                'supplier_name' => trim(($supplier->FstNm ?? '') . ' ' . ($supplier->MidNm ?? '') . ' ' . ($supplier->LstNm ?? '')),
                'supplier_address' => $supplier->Address,
                'supplier_tel' => $supplier->TP1 ?? $supplier->TP2 ?? $supplier->TP3,
                'payment_method' => $validated['payment_method'],
                'paid_amount' => $validated['paid_amount'],
                'payment_date' => $validated['payment_date'],
                'cheque_no' => $validated['cheque_no'] ?? null,
                'cheque_date' => $validated['cheque_date'] ?? null,
                'cheque_account_no' => $validated['cheque_account_no'] ?? null,
                'cheque_bank_name' => $validated['cheque_bank_name'] ?? null,
                'branch' => $validated['cheque_branch'] ?? $validated['bank_branch'] ?? $validated['transfer_branch'] ?? null,
                'bank_name' => $validated['bank_name'] ?? null,
                'bank_reference_no' => $validated['bank_reference_no'] ?? null,
                'bank_deposit_date' => $validated['bank_deposit_date'] ?? null,
                'bank_account_no' => $validated['bank_account_no'] ?? null,
                'transfer_bank_name' => $validated['transfer_bank_name'] ?? null,
                'transfer_transaction_id' => $validated['transfer_transaction_id'] ?? null,
                'transfer_date' => $validated['transfer_date'] ?? null,
                'transfer_reference_no' => $validated['transfer_reference_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed',
                'company_code' => $user->company_code,
                'section_code' => $user->section_code,
                'created_by' => $user->name,
            ]);

            // Update supplier's current balance with calculated outstanding balance
            $supplierAcc = AccMas::where('AccKy', $supplier->AccKy)->first();
            if ($supplierAcc) {
                // Calculate the actual outstanding balance
                $totalPurchases = DB::table('purchase')
                    ->where(function ($query) use ($supplier) {
                        $query->where('SuppCode', $supplier->AdrCd)
                              ->orWhere('AccKy', $supplier->AccKy);
                    })
                    ->sum('TotalVal');

                // Get total payments for this supplier (including this new payment)
                $totalPayments = SupplierPayment::where('supplier_code', $supplier->AdrCd)
                    ->sum('paid_amount');

                // Update CurBal with the outstanding balance (purchases - payments)
                $supplierAcc->CurBal = $totalPurchases - $totalPayments;
                $supplierAcc->save();

                // Create Accounting Transaction
                \App\Models\AccTrn::create([
                    'AccKy' => $supplierAcc->AccKy,
                    'TrnDt' => $validated['payment_date'],
                    'TrnNo' => $paymentNo,
                    'Amt' => -1 * abs((float) $validated['paid_amount']), // Negative for payments made to suppliers
                    'VaucherNo' => null,
                    'ReferenceNo' => $validated['bank_reference_no'] ?? $validated['transfer_reference_no'] ?? null,
                    'ChqueNo' => $validated['cheque_no'] ?? null,
                    'BankNm' => $validated['cheque_bank_name'] ?? $validated['bank_name'] ?? $validated['transfer_bank_name'] ?? null,
                    'BranchNm' => $validated['cheque_branch'] ?? $validated['bank_branch'] ?? $validated['transfer_branch'] ?? null,
                    'Dec' => $validated['notes'] ?? 'Supplier Payment',
                    'FInAct' => 1,
                    'Status' => 'A',
                    'company_code' => $supplierAcc->company_code ?? null,
                    'section_code' => $supplierAcc->section_code ?? null,
                    'customer_code' => $supplier->AdrCd,
                    'customer_name' => trim(($supplier->FstNm ?? '') . ' ' . ($supplier->MidNm ?? '') . ' ' . ($supplier->LstNm ?? '')),
                ]);
            }

            DB::commit();

            return back()->with('success', 'Supplier payment created successfully.')->with('payment_id', $payment->id);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating supplier payment: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to create payment. Please try again.']);
        }
    }

    /**
     * Generate PDF receipt for supplier payment
     */
    public function generateReceipt(SupplierPayment $supplierPayment)
    {
        if (!request()->user()->hasPermission('supplier_payments.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view supplier payments.');
        }

        $supplierPayment->load('supplier');
        
        $currentBalance = 0;
        $supplierId = $supplierPayment->supplier_id;
        $accKy = null;

        // Resolve AccKy and Supplier ID
        if ($supplierPayment->supplier) {
            $supplierId = $supplierPayment->supplier->AdrKy;
            $accKy = $supplierPayment->supplier->AccKy;
        }

        // Calculate balance consistently with getSupplierDetails method
        if ($supplierPayment->supplier) {
            // Get total purchases for this supplier
            $totalPurchases = DB::table('purchase')
                ->where(function ($query) use ($supplierPayment) {
                    $query->where('SuppCode', $supplierPayment->supplier->AdrCd)
                          ->orWhere('AccKy', $supplierPayment->supplier->AccKy);
                })
                ->sum('TotalVal');

            // Get total payments for this supplier (including this payment)
            $totalPayments = SupplierPayment::where('supplier_code', $supplierPayment->supplier->AdrCd)
                ->sum('paid_amount');

            // Calculate current balance (purchases - payments)
            $currentBalance = $totalPurchases - $totalPayments;
        }

        $html = $this->generateReceiptHtml($supplierPayment, $currentBalance);

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        
        $dompdf = new Dompdf($options);
        // 80mm generic thermal paper width (approx 226pt)
        $dompdf->setPaper([0, 0, 226.77, 600], 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return $dompdf->stream('supplier-payment-' . $supplierPayment->id . '.pdf', [
            'Attachment' => false
        ]);
    }

    /**
     * Generate HTML for supplier payment receipt
     */
    private function generateReceiptHtml($payment, $balance)
    {
        $companyName = auth()->user()->company->name ?? 'Company Name';
        $companyAddress = auth()->user()->company->address ?? 'Address';
        $companyPhone = auth()->user()->company->phone ?? 'Phone';

        $totalPaid = number_format($payment->paid_amount, 2);
        $balanceFormatted = number_format(abs($balance), 2);
        
        $supplierName = 'N/A';
        if ($payment->supplier) {
            $supplierName = trim($payment->supplier->FstNm . ' ' . $payment->supplier->LstNm);
            if (empty($supplierName) && $payment->supplier->account) {
                 $supplierName = $payment->supplier->account->AccNm;
            }
        }
        
        // Fallback to stored supplier name if no relationship exists
        if ($supplierName === 'N/A' || empty($supplierName)) {
            $supplierName = $payment->supplier_name ?? 'N/A';
        }
        
        $date = $payment->payment_date instanceof \DateTime ? $payment->payment_date->format('Y-m-d H:i') : $payment->payment_date;

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
                <div style='margin-top:5px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 2px;'>SUPPLIER PAYMENT RECEIPT</div>
            </div>

            <div class='details'>
                <div class='row'>
                    <span class='label'>Date:</span>
                    <span>$date</span>
                </div>
                <div class='row'>
                    <span class='label'>Receipt No:</span>
                    <span>{$payment->payment_no}</span>
                </div>
                <div class='row'>
                    <span class='label'>Supplier:</span>
                    <span>{$supplierName}</span>
                </div>
                <div class='row'>
                    <span class='label'>Code:</span>
                    <span>{$payment->supplier_code}</span>
                </div>
            </div>

            <div class='details'>
                <div class='row'>
                    <span class='label'>Payment Mode:</span>
                    <span style='text-transform: capitalize;'>{$payment->payment_method}</span>
                </div>
                " . ($payment->payment_method == 'Cheque' ? "
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
                 " . ($payment->payment_method == 'Bank' ? "
                <div class='row'>
                    <span class='label'>Ref No:</span>
                    <span>{$payment->bank_reference_no}</span>
                </div>
                " . ($payment->branch ? "
                <div class='row'>
                    <span class='label'>Branch:</span>
                    <span>{$payment->branch}</span>
                </div>" : "") . "
                " : "") . "
                 " . ($payment->payment_method == 'Online Transfer' ? "
                <div class='row'>
                    <span class='label'>Transaction ID:</span>
                    <span>{$payment->transfer_transaction_id}</span>
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

    /**
     * Display the specified supplier payment
     */
    public function show($id)
    {
        if (!request()->user()->hasPermission('supplier_payments.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view supplier payments.');
        }

        $payment = SupplierPayment::with('supplier')->findOrFail($id);

        return Inertia::render('admin/supplier-payments/show', [
            'payment' => $payment,
        ]);
    }

    /**
     * Show the form for editing the specified supplier payment
     */
    public function edit($id)
    {
        if (!request()->user()->hasPermission('supplier_payments.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit supplier payments.');
        }

        /** @var \App\Models\User $user */
        $user = request()->user();
        
        $payment = SupplierPayment::findOrFail($id);

        // Get suppliers based on user role
        $suppliersQuery = Address::select('address.AdrKy', 'address.AdrCd', 'address.FstNm', 'address.LstNm', 'address.Address', 'address.TP1', 'address.TP2', 'address.TP3', 'address.AccKy')
            ->join('acc_mas', 'address.AccKy', '=', 'acc_mas.AccKy')
            ->where('address.AdrTypKy', 4) // 4 = Supplier type
            ->where('acc_mas.AccTyp', 'SUPPLIER')
            ->whereNotNull('address.AccKy');

        if ($user && $user->role_id !== 1) { // Not superadmin
            if ($user->role_id === 3) { // Branch level
                $suppliersQuery->where('address.section_code', $user->section_code);
            } else { // Company level
                $suppliersQuery->where('address.company_code', $user->company_code);
            }
        }

        $suppliers = $suppliersQuery->orderBy('address.AdrCd')->get();

        return Inertia::render('admin/supplier-payments/edit', [
            'payment' => $payment,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Update the specified supplier payment
     */
    public function update(Request $request, $id)
    {
        if (!request()->user()->hasPermission('supplier_payments.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit supplier payments.');
        }

        $payment = SupplierPayment::findOrFail($id);

        $validated = $request->validate([
            'supplier_id' => 'required|exists:address,AdrKy',
            'payment_method' => 'required|in:Cash,Cheque,Bank,Online Transfer',
            'paid_amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            
            // Cheque fields
            'cheque_no' => 'required_if:payment_method,Cheque|nullable|string',
            'cheque_date' => 'required_if:payment_method,Cheque|nullable|date',
            'cheque_account_no' => 'required_if:payment_method,Cheque|nullable|string',
            'cheque_bank_name' => 'required_if:payment_method,Cheque|nullable|string',
            'cheque_branch' => 'nullable|string',
            
            // Bank deposit fields
            'bank_name' => 'required_if:payment_method,Bank|nullable|string',
            'bank_reference_no' => 'required_if:payment_method,Bank|nullable|string',
            'bank_deposit_date' => 'required_if:payment_method,Bank|nullable|date',
            'bank_account_no' => 'required_if:payment_method,Bank|nullable|string',
            'bank_branch' => 'nullable|string',
            
            // Online transfer fields
            'transfer_bank_name' => 'required_if:payment_method,Online Transfer|nullable|string',
            'transfer_transaction_id' => 'required_if:payment_method,Online Transfer|nullable|string',
            'transfer_date' => 'required_if:payment_method,Online Transfer|nullable|date',
            'transfer_reference_no' => 'required_if:payment_method,Online Transfer|nullable|string',
            'transfer_branch' => 'nullable|string',
            
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Get supplier details
            $supplier = Address::findOrFail($validated['supplier_id']);

            // Update payment record
            $payment->update([
                'supplier_id' => $validated['supplier_id'],
                'supplier_code' => $supplier->AdrCd,
                'supplier_name' => trim(($supplier->FstNm ?? '') . ' ' . ($supplier->MidNm ?? '') . ' ' . ($supplier->LstNm ?? '')),
                'supplier_address' => $supplier->Address,
                'supplier_tel' => $supplier->TP1 ?? $supplier->TP2 ?? $supplier->TP3,
                'payment_method' => $validated['payment_method'],
                'paid_amount' => $validated['paid_amount'],
                'payment_date' => $validated['payment_date'],
                'cheque_no' => $validated['cheque_no'] ?? null,
                'cheque_date' => $validated['cheque_date'] ?? null,
                'cheque_account_no' => $validated['cheque_account_no'] ?? null,
                'cheque_bank_name' => $validated['cheque_bank_name'] ?? null,
                'branch' => $validated['cheque_branch'] ?? $validated['bank_branch'] ?? $validated['transfer_branch'] ?? null,
                'bank_name' => $validated['bank_name'] ?? null,
                'bank_reference_no' => $validated['bank_reference_no'] ?? null,
                'bank_deposit_date' => $validated['bank_deposit_date'] ?? null,
                'bank_account_no' => $validated['bank_account_no'] ?? null,
                'transfer_bank_name' => $validated['transfer_bank_name'] ?? null,
                'transfer_transaction_id' => $validated['transfer_transaction_id'] ?? null,
                'transfer_date' => $validated['transfer_date'] ?? null,
                'transfer_reference_no' => $validated['transfer_reference_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            DB::commit();

            return redirect()->route('admin.supplier-payments.show', $payment->id)
                ->with('success', 'Supplier payment updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating supplier payment: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to update payment. Please try again.'])->withInput();
        }
    }

    /**
     * Remove the specified supplier payment
     */
    public function destroy($id)
    {
        if (!request()->user()->hasPermission('supplier_payments.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete supplier payments.');
        }

        try {
            $payment = SupplierPayment::findOrFail($id);
            $payment->delete();

            return redirect()->route('admin.supplier-payments.index')
                ->with('success', 'Supplier payment deleted successfully.');

        } catch (\Exception $e) {
            Log::error('Error deleting supplier payment: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to delete payment. Please try again.']);
        }
    }
}
