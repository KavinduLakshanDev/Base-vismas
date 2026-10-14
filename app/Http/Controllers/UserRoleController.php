<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;

class UserRoleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = $user && ($user->user_type === 'super_admin' || ($user->role && $user->role->level === 'super_admin'));
        $activeCompanyCode = session('active_company_code', $user?->company_code);

        $query = Role::query();

        if (!$isSuperAdmin) {
            $query->where('slug', '!=', 'super_admin')->where('level', '!=', 'super_admin');
            if ($activeCompanyCode) {
                $query->where(function ($q) use ($activeCompanyCode) {
                    $q->where('company_code', $activeCompanyCode)
                      ->orWhere('is_system_role', true);
                });
            }
        }

        return response()->json($query->orderBy('name')->get());
    }
}
