<?php

namespace App\Http\Controllers;

use App\Models\VatRate;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VatRateController extends Controller
{
    /**
     * @return \App\Models\Company|null
     */
    private function getCompany()
    {
        if (Auth::guard('company')->check()) {
            /** @var \App\Models\Company $user */
            $user = Auth::guard('company')->user();
            return $user;
        }
        // Fallback for testing/development
        return Company::first();
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $company = $this->getCompany();
        if (!$company) {
            return response()->json([], 200);
        }
        $vatRates = $company->vatRates()->orderBy('effective_date', 'desc')->get();
        
        $today = now()->format('Y-m-d');
        $foundActive = false;
        
        // Calculate active status dynamically based on date ranges
        $vatRates->transform(function ($rate) use ($today, &$foundActive) {
            $isActive = false;
            
           
            if (!$foundActive) {
                 if ($rate->effective_date <= $today && ($rate->end_date === null || $rate->end_date >= $today)) {
                     $isActive = true;
                     $foundActive = true;
                 }
            }
            
            $rate->is_active = $isActive;
            return $rate;
        });
        
        // Sync company main record with the calculated active rate
        if ($foundActive) {
             $activeRate = $vatRates->firstWhere('is_active', true);
             if ($activeRate && ($company->vat_rate != $activeRate->vat_rate || $company->vat_no != $activeRate->vat_no)) {
                 $company->update([
                     'vat_rate' => $activeRate->vat_rate,
                     'vat_no' => $activeRate->vat_no,
                     'vat_effective_date' => $activeRate->effective_date,
                 ]);
             }
        }

        return response()->json($vatRates);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'vat_rate' => 'required|numeric|min:0|max:100',
            'vat_no' => 'nullable|string',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:effective_date',
        ]);

        $company = $this->getCompany();

        $vatRate = $company->vatRates()->create($request->only(['vat_rate', 'vat_no', 'effective_date', 'end_date', 'is_active']));
        
        // Trigger index logic to sync company table if needed (optional, or rely on frontend reloading)
        // For now, we trust the next index call or page refresh to sync.

        return response()->json($vatRate, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VatRate $vatRate)
    {
        $company = $this->getCompany();
        
        if ($vatRate->company_id !== $company->id) {
            abort(403);
        }

        $request->validate([
            'vat_rate' => 'required|numeric|min:0|max:100',
            'vat_no' => 'nullable|string',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:effective_date',
        ]);

        $vatRate->update($request->only(['vat_rate', 'vat_no', 'effective_date', 'end_date']));

        return response()->json($vatRate);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VatRate $vatRate)
    {
        $company = $this->getCompany();

        if ($vatRate->company_id !== $company->id) {
            abort(403);
        }

        $vatRate->delete();

        return response()->json(['message' => 'VAT rate deleted']);
    }
}
