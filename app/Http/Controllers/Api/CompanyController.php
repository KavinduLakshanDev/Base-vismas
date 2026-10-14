<?php

namespace App\Http\Controllers\Api;

use App\Models\Company;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $activeCompanyCode = session('active_company_code', $user ? $user->company_code : null);
        
        if ($activeCompanyCode) {
            return response()->json(Company::where('company_code', $activeCompanyCode)->get());
        }

        if ($user && $user->user_type === 'super_admin') {
            return response()->json(Company::all());
        }

        return response()->json(['error' => 'Unauthorized'], 401);
    }
}