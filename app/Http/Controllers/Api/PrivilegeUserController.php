<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrivilegeUser;
use App\Models\PrivilagePoint;
use App\Services\PointGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PrivilegeUserController extends Controller
{
    public function search(Request $request)
    {
        $user = $request->user();

        if (!$user->hasPermission('privilege_users.manage') && !$user->hasPermission('pos.access')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = $request->input('value');
        $type = $request->input('type', 'all'); // 'card', 'mobile', 'name'
        
        // Assuming company code is required or inferred from auth user
        $companyCode = $user->company_code ?? null;
        
        if (!$companyCode) {
            // Fallback for testing if user doesn't have company_code directly on model
            // or if we are using sanctum token that has company relation
             if ($user->company) {
                 $companyCode = $user->company->company_code;
             } else {
                 return response()->json(['error' => 'Company code not determined'], 400);
             }
        }

        $dbQuery = PrivilegeUser::where('company_code', $companyCode);

        if ($type === 'card') {
            $dbQuery->where('card_no', $query);
        } elseif ($type === 'phone' || $type === 'mobile') {
            $dbQuery->where('phone', $query);
        } else {
             $dbQuery->where(function($q) use ($query) {
                $q->where('card_no', $query)
                  ->orWhere('phone', $query)
                  ->orWhere('privCusName', 'LIKE', "%{$query}%")
                  ->orWhere('customer_code', $query);
            });
        }

        $privilegeUser = $dbQuery->first();

        if (!$privilegeUser) {
            return response()->json(['found' => false, 'message' => 'Customer not found']);
        }

        return response()->json([
            'found' => true,
            'customer' => [
                'id' => $privilegeUser->id,
                'customer_code' => $privilegeUser->customer_code,
                'name' => $privilegeUser->privCusName,
                'phone' => $privilegeUser->phone,
                'card_no' => $privilegeUser->card_no,
                'address' => $privilegeUser->address,
                'nic' => $privilegeUser->NIC,
                'gender' => $privilegeUser->gender,
            ]
        ]);
    }
}
