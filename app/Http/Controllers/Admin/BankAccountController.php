<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Company;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BankAccountController extends Controller
{
    /**
     * Display a listing of bank accounts.
     */
    public function index(Request $request): Response
    {
        $query = BankAccount::with(['creator', 'company', 'section']);

        // Filter by company/section for non-superadmin users
        $user = Auth::guard('web')->user() ?? Auth::guard('company')->user();
        if ($user && $user->role_id !== 1) { // Not superadmin
            if ($user->role_id === 3) { // Branch/Section admin - filter by their section
                $query->where('section_code', $user->section_code);
            } else { // Company admin - filter by their company
                $query->where('company_code', $user->company_code);
            }
        }

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('account_name', 'like', "%{$search}%")
                  ->orWhere('account_number', 'like', "%{$search}%")
                  ->orWhere('bank_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('company_code')) {
            $query->where('company_code', $request->company_code);
        }

        if ($request->filled('section_code')) {
            $query->where('section_code', $request->section_code);
        }

        $bankAccounts = $query->latest()->paginate(15);

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

        return Inertia::render('admin/bank-accounts/index', [
            'bankAccounts' => $bankAccounts,
            'filters' => $request->only(['search', 'status', 'company_code', 'section_code']),
            'companies' => $companies->map(function ($company) {
                return [
                    'value' => $company->company_code,
                    'label' => $company->company_name,
                ];
            }),
            'branches' => $sections->map(function ($section) {
                return [
                    'value' => $section->section_code,
                    'label' => $section->name,
                ];
            }),
        ]);
    }

    /**
     * Show the form for creating a new bank account.
     */
    public function create(): Response
    {
        return Inertia::render('admin/bank-accounts/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'account_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:50', 'unique:bank_accounts'],
            'bank_name' => ['required', 'string', 'max:255'],
            'branch_name' => ['required', 'string', 'max:255'],
            'account_type' => ['required', 'in:savings,current,checking'],
            'opening_balance' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            DB::beginTransaction();

            // Get the authenticated user from either web or company guard
            $user = Auth::guard('web')->user() ?? Auth::guard('company')->user();

            // Debug: Check authentication
            if (!$user) {
                throw new \Exception('User not authenticated.');
            }

            // Determine company and section based on user role
            $companyCode = $user->company_code;
            $sectionCode = null;

            if ($user->role_id === 1) { // Super admin
                // For super admin, use their company/section if set, otherwise default
                if ($user->company_code && $user->section_code) {
                    $sectionCode = $user->section_code;
                } else {
                    // Default to main section of first company
                    $section = Section::where('is_active', true)
                        ->orderBy('is_main_stock', 'desc')
                        ->first();

                    if (!$section) {
                        throw new \Exception('No valid sections found in the system.');
                    }
                    $companyCode = $section->company_code;
                    $sectionCode = $section->section_code;
                }
            } elseif ($user->role_id === 2) { // Company admin
                // Use the user's section_code directly
                $sectionCode = $user->section_code;
            } elseif ($user->role_id === 3) { // Section admin
                $sectionCode = $user->section_code;
            }

            if (!$companyCode || !$sectionCode) {
                throw new \Exception('Unable to determine company or section for the user.');
            }

            $bankAccount = BankAccount::create([
                ...$validated,
                'company_code' => $companyCode,
                'section_code' => $sectionCode,
                'current_balance' => $validated['opening_balance'] ?? 0,
                'status' => 'active',
                'created_by' => $user->id,
            ]);

            DB::commit();

            return redirect()->route('admin.bank-accounts.index')
                ->with('success', 'Bank account registered successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to register bank account: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified bank account.
     */
    public function show(BankAccount $bankAccount): Response
    {
        $user = Auth::user();

        // Authorization check
        if ($user->role_id === 3 && $bankAccount->section_code !== $user->section_code) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role_id === 2 && $bankAccount->company_code !== $user->company_code) {
            abort(403, 'Unauthorized access.');
        }

        return Inertia::render('admin/bank-accounts/show', [
            'bankAccount' => $bankAccount->load(['creator', 'company', 'section']),
        ]);
    }

    /**
     * Show the form for editing the specified bank account.
     */
    public function edit(BankAccount $bankAccount): Response
    {
        $user = Auth::user();

        // Authorization check
        if ($user->role_id === 3 && $bankAccount->section_code !== $user->section_code) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role_id === 2 && $bankAccount->company_code !== $user->company_code) {
            abort(403, 'Unauthorized access.');
        }

        $companies = collect();
        $sections = collect();

        // Get available companies and sections based on user role
        if ($user->role_id === 1) { // Superadmin
            $companies = Company::all();
            $sections = Section::all();
        } elseif ($user->role_id === 2) { // Company admin
            $companies = Company::where('company_code', $user->company_code)->get();
            $sections = Section::where('company_code', $user->company_code)->get();
        } elseif ($user->role_id === 3) { // Section admin
            $companies = Company::where('company_code', $user->company_code)->get();
            $userSection = Section::where('section_code', $user->section_code)->first();
            if ($userSection) {
                $sections = collect([$userSection]);
            }
        }

        return Inertia::render('admin/bank-accounts/edit', [
            'bankAccount' => $bankAccount,
            'companies' => $companies->map(function ($company) {
                return [
                    'value' => $company->company_code,
                    'label' => $company->company_name,
                ];
            }),
            'sections' => $sections->map(function ($section) {
                return [
                    'value' => $section->section_code,
                    'label' => $section->name,
                ];
            }),
        ]);
    }

    /**
     * Update the specified bank account in storage.
     */
    public function update(Request $request, BankAccount $bankAccount): RedirectResponse
    {
        $validated = $request->validate([
            'account_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:50', 'unique:bank_accounts,account_number,' . $bankAccount->id],
            'bank_name' => ['required', 'string', 'max:255'],
            'branch_name' => ['required', 'string', 'max:255'],
            'account_type' => ['required', 'in:savings,current,checking'],
            'currency' => ['required', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'in:active,inactive,closed'],
        ]);

        $user = Auth::user();

        // Authorization check
        if ($user->role_id === 3 && $bankAccount->section_code !== $user->section_code) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role_id === 2 && $bankAccount->company_code !== $user->company_code) {
            abort(403, 'Unauthorized access.');
        }

        try {
            $bankAccount->update($validated);

            return redirect()->route('admin.bank-accounts.index')
                ->with('success', 'Bank account updated successfully.');

        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update bank account: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified bank account from storage.
     */
    public function destroy(BankAccount $bankAccount): RedirectResponse
    {
        $user = Auth::user();

        // Authorization check
        if ($user->role_id === 3 && $bankAccount->section_code !== $user->section_code) {
            abort(403, 'Unauthorized access.');
        }

        if ($user->role_id === 2 && $bankAccount->company_code !== $user->company_code) {
            abort(403, 'Unauthorized access.');
        }

        try {
            $bankAccount->delete();

            return redirect()->route('admin.bank-accounts.index')
                ->with('success', 'Bank account deleted successfully.');

        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to delete bank account: ' . $e->getMessage());
        }
    }
}
