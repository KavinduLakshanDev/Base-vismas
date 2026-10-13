<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanySelectionController extends Controller
{
    /**
     * Show the company selection screen.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // If not super admin and user already has a company_code, redirect to dashboard
        if ($user instanceof User && $user->user_type !== 'super_admin' && $user->getRawOriginal('company_code')) {
            return redirect()->route('dashboard');
        }

        $companies = Company::orderBy('name')->get();

        return Inertia::render('auth/select-company', [
            'companies' => $companies,
            'currentCompanyCode' => session('active_company_code', $user?->company_code),
        ]);
    }

    /**
     * Select / switch to a company.
     */
    public function select(Request $request)
    {
        $validated = $request->validate([
            'company_code' => ['required', 'string', 'exists:companies,company_code'],
        ]);

        $company = Company::where('company_code', $validated['company_code'])->firstOrFail();

        // Check active status
        if (!$company->is_active && $request->user()?->user_type !== 'super_admin') {
            return back()->with('error', 'This company is currently disabled.');
        }

        // Store active company in session
        session(['active_company_code' => $company->company_code]);

        return redirect()->route('dashboard')->with('success', "Switched to {$company->name}");
    }

    /**
     * Toggle company active status (Super Admin only).
     */
    public function toggleStatus(Request $request, Company $company)
    {
        $user = $request->user();
        if (!$user || $user->user_type !== 'super_admin') {
            abort(403, 'Unauthorized');
        }

        $company->is_active = !$company->is_active;
        $company->save();

        $status = $company->is_active ? 'activated' : 'disabled';
        return back()->with('success', "Company {$company->name} has been {$status}.");
    }
}
