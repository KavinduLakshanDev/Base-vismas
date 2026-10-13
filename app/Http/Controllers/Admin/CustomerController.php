<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\Section;
use App\Models\Company;
use App\Models\AccMas;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request): Response
    {
        if (!request()->user()->hasPermission('customers.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view customers.');
        }

        $query = Customer::query();

        // Only show records where acc_mas.AccTyp = 'CUSTOMER'
        $query->whereHas('account', function ($q) {
            $q->where('AccTyp', 'CUSTOMER');
        });

        // Filter by company/section for non-superadmin users
        $user = $request->user();
        if ($user && $user->role_id !== 1) { // Not superadmin
            if ($user->role_id === 3) { // Branch/Section admin - filter by their section
                // Get the user's section to get the section_code string
                $userSection = Section::where('section_code', $user->section_code)->first();
                if ($userSection) {
                    $query->where('section_code', $userSection->section_code);
                } else {
                     // Fallback if user has section_code directly
                     $query->where('section_code', $user->section_code);
                }
            } else { // Company admin - filter by their company
                $query->where('company_code', $user->company_code);
            }
        }

        // Create a clone for stats before applying search/filters
        $statsQuery = clone $query;
        $totalCustomers = $statsQuery->count();
        $activeCustomers = (clone $statsQuery)->where('Status', 'A')->count();
        $inactiveCustomers = (clone $statsQuery)->where('Status', '!=', 'A')->count();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('FstNm', 'like', "%{$search}%")
                    ->orWhere('LstNm', 'like', "%{$search}%")
                    ->orWhere('CtPerson', 'like', "%{$search}%")
                    ->orWhere('AdrCd', 'like', "%{$search}%")
                    ->orWhere('Email', 'like', "%{$search}%")
                    ->orWhere('TP1', 'like', "%{$search}%")
                    ->orWhere('Address', 'like', "%{$search}%");
            });
        }

        // Filter by active status
        if ($request->filled('status')) {
             // AddressController uses Status = 'A'
             $status = $request->status === 'active' ? 'A' : 'I';
            $query->where('Status', $status);
        }

        // Filter by company
        if ($request->filled('company_code')) {
            $query->where('company_code', $request->company_code);
        }

        // Filter by section
        if ($request->filled('section_code')) {
            $query->where('section_code', $request->section_code);
        }

        $perPage = $request->input('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }

        $customers = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();
        
        // Transform for frontend
        $customers->through(function ($customer) {
            return [
                'AdrKy' => $customer->AdrKy,
                'AdrCd' => $customer->AdrCd,
                'full_name' => trim($customer->FstNm . ' ' . ($customer->LstNm ?? '')),
                'formatted_address' => $customer->Address . ', ' . $customer->City,
                'EMail' => $customer->Email,
                'TP1' => $customer->TP1,
                'CPerson' => $customer->CtPerson,
                'flnAct' => $customer->Status === 'A',
                'created_at' => $customer->created_at,
            ];
        });

        // Get available companies and sections based on user role
        $user = $request->user();
        $companies = collect();
        $sections = collect();

        if ($user) {
            if ($user->role_id === 1) { // Superadmin - all companies and sections
                $companies = Company::all();
                $sections = Section::all();
            } elseif ($user->role_id === 2) { // Company admin - their company and its sections
                $companies = Company::where('company_code', $user->company_code)->get();
                $sections = Section::where('company_code', $user->company_code)->get();
            } elseif ($user->role_id === 3) { // Section admin - their company and section
                $companies = Company::where('company_code', $user->company_code)->get();
                $userSection = Section::where('section_code', $user->section_code)->first();
                if ($userSection) {
                    $sections = collect([$userSection]);
                }
            }
        }

        return Inertia::render('admin/customers/index', [
            'customers' => $customers,
            'stats' => [ // Pass stats to frontend
                'total' => $totalCustomers,
                'active' => $activeCustomers,
                'inactive' => $inactiveCustomers,
            ],
            'filters' => $request->only(['search', 'status', 'company_code', 'section_code']),
            'companies' => $companies->map(function ($company) {
                return [
                    'value' => $company->company_code,
                    'label' => $company->company_name,
                ];
            }),
            'branches' => $sections->map(function ($section) { // Frontend expects 'branches'
                return [
                    'value' => $section->section_code,
                    'label' => $section->name,
                ];
            }),
        ]);
    }

    /**
     * Show the form for creating a new customer.
     */
    public function create(): Response
    {
        if (!request()->user()->hasPermission('customers.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create customers.');
        }

        $user = Auth::user();
        $companies = collect();

        // Get available companies based on user role
        if ($user && $user->role_id !== 1) { // Not superadmin
            if ($user->role_id === 2 || $user->role_id === 3) { // Company or section admin - their company
                $companies = Company::where('company_code', $user->company_code)->get();
            }
        } else {
            // Super admin - get all companies
            $companies = Company::all();
        }

        return Inertia::render('admin/customers/create');
    }

    /**
     * Store a newly created customer in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        if (!request()->user()->hasPermission('customers.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create customers.');
        }

        Log::info('Customer store initiated', $request->all());
        $validated = $request->validate([
            'FstNm' => ['required', 'string', 'max:60'],
            'MidNm' => ['nullable', 'string', 'max:60'],
            'LstNm' => ['nullable', 'string', 'max:60'],
            'CtPerson' => ['nullable', 'string', 'max:100'],
            'Address' => ['required', 'string', 'max:250'],
            'Town' => ['nullable', 'string', 'max:60'],
            'City' => ['nullable', 'string', 'max:60'],
            'Country' => ['nullable', 'string', 'max:60'],
            'TP1' => ['required', 'string', 'max:30'],
            'Fax' => ['nullable', 'string', 'max:14'],
            'Email' => ['nullable', 'email', 'max:60'],
            'Website' => ['nullable', 'url', 'max:60'],
            'fVATRegistered' => ['boolean'],
            'VATNo' => ['nullable', 'string', 'max:50'],
            'IDNo' => ['nullable', 'string', 'max:20'],
            'Title' => ['required', 'string', 'max:30'],
            'CurBal' => ['nullable', 'string'],
            'CrLmt' => ['nullable', 'string'],
        ]);
        Log::info('Validation passed');

        try {
            DB::beginTransaction();

            // Get authenticated user for company/section context
            $user = Auth::user();

            // Determine section based on user's company
            $section = null;
            if ($user && $user->company_code) {
                // Get the first/main section for the user's company
                $section = Section::where('company_code', $user->company_code)
                    ->where('is_active', true)
                    ->orderBy('is_main_stock', 'desc') // Prefer main stock sections
                    ->first();
            }
            
            if (!$section) {
                throw new \Exception('No valid section found for your company.');
            }
            
            Log::info('Section found: ' . $section->section_code);

            // Authorization check - users can only create customers in their own company
            if ($user->role_id === 3) { 
                if ($section->section_code !== $user->section_code) {
                    throw new \Exception('Unauthorized section access.');
                }
            }

            // Generate unique customer code (sequential like CUS001, CUS002, etc.)
            $customerCode = 'CUS' . str_pad(Customer::max('AdrKy') + 1, 3, '0', STR_PAD_LEFT);
            Log::info('Customer Code generated: ' . $customerCode);

            // Create Account Master record
            $accData = [
                'AccCd' => $customerCode,
                'AccNm' => trim($validated['FstNm'] . ' ' . ($validated['LstNm'] ?? '')),
                'AccTyp' => 'CUSTOMER',
                'company_code' => $section->company_code,
                'section_code' => $section->section_code,
                'Status' => 'A',
                'CurBal' => $validated['CurBal'] ?? 0,
                'CrLmt' => $validated['CrLmt'] ?? 0,
                'fVATRegistered' => $validated['fVATRegistered'] ?? false,
                'VATNo' => $validated['VATNo'] ?? null,
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
            ];
            Log::info('Creating AccMas', $accData);
            $account = AccMas::create($accData);

            // Final data preparation
            $customerData = [
                'company_code' => $section->company_code,
                'section_code' => $section->section_code,
                'AdrCd' => $customerCode,
                'FstNm' => $validated['FstNm'],
                'MidNm' => $validated['MidNm'] ?? null,
                'LstNm' => $validated['LstNm'],
                'CtPerson' => $validated['CtPerson'],
                'Address' => $validated['Address'],
                'Town' => $validated['Town'],
                'City' => $validated['City'],
                'Country' => $validated['Country'],
                'TP1' => $validated['TP1'],
                'Fax' => $validated['Fax'],
                'Email' => $validated['Email'],
                'Website' => $validated['Website'],
                'IDNo' => $validated['IDNo'],
                'Title' => $validated['Title'],
                'Status' => 'A',
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'AccKy' => $account->AccKy,
                'fVATRegistered' => $validated['fVATRegistered'] ?? false,
                'VATNo' => $validated['VATNo'] ?? null,
            ];
            
            Log::info('Creating Customer', $customerData);
            // Create customer record
            $customer = Customer::create($customerData);

            DB::commit();
            Log::info('Transaction committed');

            $createdCustomer = [
                'AccKy' => $account->AccKy,
                'AdrKy' => $customer->AdrKy,
                'AccCd' => $account->AccCd,
                'full_name' => trim($customer->FstNm . ' ' . ($customer->LstNm ?? '')),
                'EMail' => $customer->Email,
                'TP1' => $customer->TP1,
                'Address' => $customer->Address,
            ];

            if ($request->filled('return_to')) {
                return redirect($request->input('return_to'))
                    ->with('success', 'Customer registered successfully.')
                    ->with('created_customer', $createdCustomer);
            }

            // Handle the new action for going to service form
            if ($request->input('action') === 'register_and_go_to_service') {
                return redirect('/service-jobs/create')
                    ->with('success', 'Customer registered successfully. You can now create a service job.')
                    ->with('created_customer', $createdCustomer);
            }

            return redirect()->route('admin.customers.index')
                ->with('success', 'Customer registered successfully.')
                ->with('created_customer', $createdCustomer);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Customer creation failed: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return back()
                ->withInput()
                ->with('error', 'Failed to register customer: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer): Response
    {
        if (!request()->user()->hasPermission('customers.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view customers.');
        }

        // Authorization check
        $user = Auth::user();
        if ($user->role_id === 3) { 
            if ($customer->section_code !== $user->section_code) {
                return redirect()->back()->with('error', 'You can only view customers from your own section.');
            }
        } elseif ($user->role_id === 2) { 
            if ($customer->company_code !== $user->company_code) {
                return redirect()->back()->with('error', 'You can only view customers from your company.');
            }
        }

        return Inertia::render('admin/customers/show', [
            'customer' => [
                'AdrKy' => $customer->AdrKy,
                'AdrCd' => $customer->AdrCd,
                'full_name' => trim($customer->FstNm . ' ' . ($customer->LstNm ?? '')),
                'formatted_address' => $customer->Address . ', ' . $customer->City,
                'EMail' => $customer->Email,
                'TP1' => $customer->TP1,
                'CPerson' => $customer->CtPerson,
                'flnAct' => $customer->Status === 'A',
                'created_at' => $customer->created_at,
                'updated_at' => $customer->updated_at,
                'Address' => $customer->Address,
                'Town' => $customer->Town,
                'City' => $customer->City,
                'Country' => $customer->Country,
                'WebSite' => $customer->Website,
                'fVATRegistered' => $customer->fVATRegistered,
                'VATNo' => $customer->VATNo,
                'Status' => $customer->Status,
                'IDNo' => $customer->IDNo,
                'Title' => $customer->Title,
                'FstNm' => $customer->FstNm,
                'MidNm' => $customer->MidNm,
                'LstNm' => $customer->LstNm,
                'CurBal' => $customer->account?->CurBal ?? 0,
                'CrLmt' => $customer->account?->CrLmt ?? 0,
                'Fax' => $customer->Fax,
            ],
        ]);
    }
    /**
     * Show the form for editing the specified customer.
     */
    public function edit($id)
    {
        if (!request()->user()->hasPermission('customers.edit')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit customers.');
        }

        $customer = Customer::findOrFail($id);

        // Authorization check
        $user = Auth::user();
        if ($user->role_id === 3) { 
            if ($customer->section_code !== $user->section_code) {
                return redirect()->back()->with('error', 'You can only edit customers from your own section.');
            }
        } elseif ($user->role_id === 2) { 
            if ($customer->company_code !== $user->company_code) {
                return redirect()->back()->with('error', 'You can only edit customers from your company.');
            }
        }

        $companies = collect();

        // Get available companies based on user role
        if ($user && $user->role_id !== 1) { // Not superadmin
            if ($user->role_id === 2 || $user->role_id === 3) { // Company or section admin - their company
                $companies = Company::where('company_code', $user->company_code)->get();
            }
        } else {
            // Super admin - get all companies
            $companies = Company::all();
        }

        return Inertia::render('admin/customers/edit', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified customer in storage.
     */
    public function update(Request $request, $id)
    {
        if (!request()->user()->hasPermission('customers.edit')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit customers.');
        }

        $customer = Customer::findOrFail($id);

        // Authorization check
        $user = Auth::user();
        if ($user->role_id === 3) { 
            if ($customer->section_code !== $user->section_code) {
                return back()
                    ->with('error', 'You can only update customers from your own section.');
            }
        } elseif ($user->role_id === 2) { 
            if ($customer->company_code !== $user->company_code) {
                return back()
                    ->with('error', 'You can only update customers from your company.');
            }
        }

        $validated = $request->validate([
            'FstNm' => ['required', 'string', 'max:60'],
            'MidNm' => ['nullable', 'string', 'max:60'],
            'LstNm' => ['nullable', 'string', 'max:60'],
            'CtPerson' => ['nullable', 'string', 'max:100'],
            'Address' => ['required', 'string', 'max:250'],
            'Town' => ['nullable', 'string', 'max:60'],
            'City' => ['nullable', 'string', 'max:60'],
            'Country' => ['nullable', 'string', 'max:60'],
            'TP1' => ['required', 'string', 'max:30'],
            'Fax' => ['nullable', 'string', 'max:14'],
            'Email' => ['nullable', 'email', 'max:60'],
            'Website' => ['nullable', 'url', 'max:60'],
            'fVATRegistered' => ['boolean'],
            'VATNo' => ['nullable', 'string', 'max:50'],
            'IDNo' => ['nullable', 'string', 'max:20'],
            'Title' => ['required', 'string', 'max:30'],
            'CurBal' => ['nullable', 'string'],
            'CrLmt' => ['nullable', 'string'],
            'Status' => ['nullable', 'string'],
        ]);

        DB::beginTransaction();

        try {
            $customer->update($validated);

            // Update Account Master with financial and VAT info
            AccMas::where('AccKy', $customer->AccKy)->update([
                'CurBal' => $validated['CurBal'] ?? 0,
                'CrLmt' => $validated['CrLmt'] ?? 0,
                'fVATRegistered' => $validated['fVATRegistered'] ?? false,
                'VATNo' => $validated['VATNo'] ?? null,
            ]);

            DB::commit();

            return redirect()
                ->route('admin.customers.index')
                ->with('success', 'Customer updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->withErrors(['error' => 'Failed to update customer: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified customer from storage.
     */
    public function destroy(Customer $customer): RedirectResponse
    {
        if (!request()->user()->hasPermission('customers.delete')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete customers.');
        }

        // Authorization check
        $user = Auth::user();
        if ($user->role_id === 3) { 
            if ($customer->section_code !== $user->section_code) {
                return back()
                    ->with('error', 'You can only delete customers from your own section.');
            }
        } elseif ($user->role_id === 2) { 
            if ($customer->company_code !== $user->company_code) {
                return back()
                    ->with('error', 'You can only delete customers from your company.');
            }
        }

        try {
            DB::beginTransaction();
            
            // Get the customer name for the success message
            $customerName = $customer->FstNm . ' ' . $customer->LstNm;
            $customerCode = $customer->AdrCd;
            
            // Get AccKy from the customer's account relationship
            $accKy = null;
            if ($customer->account) {
                $accKy = $customer->account->AccKy;
            }
            
            // Delete the customer address record
            $customer->delete();
            
            // If there's an associated AccMas record, delete it too
            if ($accKy) {
                AccMas::where('AccKy', $accKy)->delete();
            }
            
            DB::commit();
            
            Log::info("Customer deleted successfully", [
                'customer_code' => $customerCode,
                'customer_name' => $customerName,
                'deleted_by' => $user->id
            ]);

            return redirect()->route('admin.customers.index')
                ->with('success', "Customer '{$customerName}' ({$customerCode}) deleted successfully from database.");
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error("Failed to delete customer", [
                'customer_id' => $customer->AdrKy,
                'error' => $e->getMessage()
            ]);
            
            return back()
                ->with('error', 'Failed to delete customer: ' . $e->getMessage());
        }
    }

    /**
     * Toggle customer active status.
     */
    public function toggle(Customer $customer): RedirectResponse
    {
        if (!request()->user()->hasPermission('customers.edit')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit customers.');
        }

        // Authorization check
        $user = Auth::user();
        if ($user->role_id === 3) { 
            if ($customer->section_code !== $user->section_code) {
                return back()
                    ->with('error', 'You can only modify customers from your own section.');
            }
        } elseif ($user->role_id === 2) { 
            if ($customer->company_code !== $user->company_code) {
                return back()
                    ->with('error', 'You can only modify customers from your company.');
            }
        }

        try {
            $newStatus = $customer->Status === 'A' ? 'I' : 'A';
            $customer->update(['Status' => $newStatus]);

            $status = $newStatus === 'A' ? 'activated' : 'deactivated';

            return redirect()->back()
                ->with('success', "Customer {$status} successfully.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to toggle customer status: ' . $e->getMessage());
        }
    }

    /**
     * Display customer payments management page.
     */
    public function paymentsIndex(): Response
    {
        if (!request()->user()->hasPermission('customer_payments.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view customer payments.');
        }

        return Inertia::render('admin/customer-payments/index');
    }

    /**
     * Search customers for payment management.
     */
    public function searchCustomers(Request $request)
    {
        if (!request()->user()->hasPermission('customers.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = Customer::query();

        // Only show records where acc_mas.AccTyp = 'CUSTOMER'
        $query->whereHas('account', function ($q) {
            $q->where('AccTyp', 'CUSTOMER');
        });

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('FstNm', 'like', "%{$search}%")
                    ->orWhere('LstNm', 'like', "%{$search}%")
                    ->orWhere('AdrCd', 'like', "%{$search}%")
                    ->orWhere('TP1', 'like', "%{$search}%");
            });
        }

        $customers = $query->limit(20)->get()->map(function ($customer) {
            return [
                'AdrKy' => $customer->AdrKy,
                'AdrCd' => $customer->AdrCd,
                'full_name' => trim($customer->FstNm . ' ' . ($customer->LstNm ?? '')),
                'TP1' => $customer->TP1,
                'Address' => $customer->Address,
            ];
        });

        return response()->json($customers);
    }

    /**
     * Get outstanding balance for a customer.
     */
    public function getOutstandingBalance(Customer $customer)
    {
        if (!request()->user()->hasPermission('customers.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Calculate outstanding balance from sales transactions
        $outstandingBalance = $customer->salesTransactions()
            ->whereIn('status', ['partially_paid', 'pending'])
            ->sum('balance_amount');

        // Get recent payments
        $recentPayments = $customer->payments()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'date' => $payment->date,
                    'method' => $payment->method,
                    'reference' => $payment->reference,
                    'status' => $payment->status,
                ];
            });

        return response()->json([
            'outstanding_balance' => $outstandingBalance,
            'recent_payments' => $recentPayments,
            'customer' => [
                'AdrKy' => $customer->AdrKy,
                'AdrCd' => $customer->AdrCd,
                'full_name' => trim($customer->FstNm . ' ' . ($customer->LstNm ?? '')),
                'TP1' => $customer->TP1,
                'Address' => $customer->Address,
            ]
        ]);
    }

    /**
     * Store a new customer payment.
     */
    public function storePayment(Request $request)
    {
        if (!request()->user()->hasPermission('customer_payments.create')) {
             return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:address,AdrKy',
            'payment_method' => 'required|in:cash,cheque,bank_transfer',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',

            // Cash payment fields
            'cash_description' => 'nullable|string|max:255',

            // Cheque payment fields
            'cheque_no' => 'required_if:payment_method,cheque|string|max:50',
            'cheque_bank' => 'required_if:payment_method,cheque|string|max:100',
            'cheque_branch' => 'required_if:payment_method,cheque|string|max:100',
            'cheque_date' => 'required_if:payment_method,cheque|date',
            'cheque_description' => 'nullable|string|max:255',

            // Bank transfer fields
            'transfer_ref_no' => 'required_if:payment_method,bank_transfer|string|max:100',
            'transfer_bank' => 'required_if:payment_method,bank_transfer|string|max:100',
            'transfer_branch' => 'required_if:payment_method,bank_transfer|string|max:100',
            'transfer_date' => 'required_if:payment_method,bank_transfer|date',
            'transfer_description' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $customer = Customer::findOrFail($validated['customer_id']);

            // Prepare payment data based on method
            $paymentData = [
                'customer_id' => $customer->AdrKy,
                'customer_code' => $customer->AdrCd,
                'amount' => $validated['amount'],
                'date' => $validated['payment_date'],
                'method' => $validated['payment_method'],
                'status' => 'completed',
            ];

            switch ($validated['payment_method']) {
                case 'cash':
                    $paymentData['notes'] = $validated['cash_description'] ?? null;
                    break;

                case 'cheque':
                    $paymentData['cheque_no'] = $validated['cheque_no'];
                    $paymentData['bank_name'] = $validated['cheque_bank'];
                    $paymentData['branch'] = $validated['cheque_branch'];
                    $paymentData['cheque_date'] = $validated['cheque_date'];
                    $paymentData['notes'] = $validated['cheque_description'] ?? null;
                    break;

                case 'bank_transfer':
                    $paymentData['reference'] = $validated['transfer_ref_no'];
                    $paymentData['bank_name'] = $validated['transfer_bank'];
                    $paymentData['branch'] = $validated['transfer_branch'];
                    $paymentData['transfer_date'] = $validated['transfer_date'];
                    $paymentData['notes'] = $validated['transfer_description'] ?? null;
                    break;
            }

            CustomerPayment::create($paymentData);

            // Update Customer Account Balance (AccMas)
            // Decrement the balance as they have paid
            $accMas = AccMas::where('AccKy', $customer->AccKy)->first();
            if ($accMas) {
                $accMas->decrement('CurBal', $validated['amount']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to record payment: ' . $e->getMessage()
            ], 500);
        }
    }
}
