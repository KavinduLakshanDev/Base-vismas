<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\AccMas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        if (!request()->user()->hasPermission('customers.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view customers.');
        }

        $customers = Customer::query()
            ->where('AdrTypKy', 1)
            ->latest()
            ->paginate(10);
        
        if (request()->expectsJson()) {
            return response()->json($customers);
        }
        
        return Inertia::render('customers/Index', [
            'customers' => $customers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('customers.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create customers.');
        }

        $validator = Validator::make($request->all(), [
            'FstNm' => 'required|string|max:60',
            'LstNm' => 'nullable|string|max:60',
            'AdrCd' => 'nullable|string|max:30|unique:address,AdrCd',
            'Email' => 'nullable|email|max:100',
            'TP1' => 'nullable|string|max:30',
            'Address' => 'nullable|string|max:250',
            'City' => 'nullable|string|max:60',
            'Country' => 'nullable|string|max:60',
            'IDNo' => 'nullable|string|max:50',
            'fVATRegistered' => 'boolean',
            'VATNo' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Set customer type (AdrTypKy = 1 for customers, adjust as needed)
        $data = $validator->validated();
        $data['AdrTypKy'] = 1; // Customer type
        $data['uuid'] = Str::uuid();
        $data['Status'] = 'A'; // Active status
        $data['company_code'] = Auth::user()->company_code ?? null;
        $data['section_code'] = Auth::user()->section_code ?? null;

        // Generate AdrCd if not provided
        if (empty($data['AdrCd'])) {
            // Use Sequence model to generate sequential Customer Code
            $nextVal = \App\Models\Sequence::incrementSequence('customer_code', function() {
                // Initializer: Find the max number from existing customers with format CUSxxx
                $maxCode = Customer::where('AdrCd', 'LIKE', 'CUS%')->max('AdrCd');
                if ($maxCode) {
                    // Extract number part: CUS005 -> 5
                    $numPart = substr($maxCode, 3);
                    return is_numeric($numPart) ? (int)$numPart : 0;
                }
                return 0;
            });
            
            $data['AdrCd'] = 'CUS' . str_pad($nextVal, 3, '0', STR_PAD_LEFT);
        }

        $account = AccMas::create([
            'AccCd' => $data['AdrCd'],
            'AccNm' => trim($data['FstNm'] . ' ' . ($data['LstNm'] ?? '')),
            'AccTyp' => 'CUSTOMER',
            'company_code' => Auth::user()->company_code ?? null,
            'section_code' => Auth::user()->section_code ?? null,
            'Status' => 'A',
            // Save VAT details to AccMas as well
            'fVATRegistered' => $data['fVATRegistered'] ?? false,
            'VATNo' => $data['VATNo'] ?? null,
        ]);

        $data['AccKy'] = $account->AccKy;

        $customer = Customer::create($data);

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Customer created successfully', 'customer' => $customer], 201);
        }

        return redirect()->route('customers.index')->with('success', 'Customer created successfully');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        if (!request()->user()->hasPermission('customers.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create customers.');
        }

        return Inertia::render('customers/Create');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        if (!request()->user()->hasPermission('customers.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view customers.');
        }

        $customer = Customer::query()->findOrFail($id);
        return Inertia::render('customers/Show', [
            'customer' => $customer
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        if (!request()->user()->hasPermission('customers.edit')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit customers.');
        }

        $customer = Customer::query()->findOrFail($id);
        return Inertia::render('customers/Edit', [
            'customer' => $customer
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        if (!request()->user()->hasPermission('customers.edit')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit customers.');
        }

        $customer = Customer::query()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'FstNm' => 'required|string|max:60',
            'LstNm' => 'nullable|string|max:60',
            'AdrCd' => 'nullable|string|max:30|unique:address,AdrCd,' . $id . ',AdrKy',
            'Email' => 'nullable|email|max:100',
            'TP1' => 'nullable|string|max:30',
            'Address' => 'nullable|string|max:250',
            'City' => 'nullable|string|max:60',
            'Country' => 'nullable|string|max:60',
            'IDNo' => 'nullable|string|max:50',
            'fVATRegistered' => 'boolean',
            'VATNo' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $customer->update($validator->validated());

        // Update linked AccMas
        if ($customer->account) {
            $customer->account->update([
                'AccNm' => trim(($request->FstNm) . ' ' . ($request->LstNm ?? '')),
                'fVATRegistered' => $request->boolean('fVATRegistered'),
                'VATNo' => $request->VATNo,
            ]);
        }

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Customer updated successfully', 'customer' => $customer]);
        }

        return redirect()->route('customers.index')->with('success', 'Customer updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        if (!request()->user()->hasPermission('customers.delete')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete customers.');
        }

        $customer = Customer::query()->findOrFail($id);
        
        // Soft delete by updating status or hard delete
        $customer->update(['Status' => 'D']); // D for deleted/inactive
        
        // Or hard delete if preferred:
        // $customer->delete();

        if (request()->expectsJson()) {
            return response()->json(['message' => 'Customer deleted successfully']);
        }

        return redirect()->route('customers.index')->with('success', 'Customer deleted successfully');
    }
    
    /**
     * Search customers
     */
    public function search(Request $request)
    {
        if (!request()->user()->hasPermission('customers.view')) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        $search = $request->input('search');
        
        $customers = Customer::query()
            ->where(function($query) use ($search) {
                $query->where('FstNm', 'like', "%{$search}%")
                    ->orWhere('LstNm', 'like', "%{$search}%")
                    ->orWhere('AdrCd', 'like', "%{$search}%")
                    ->orWhere('Email', 'like', "%{$search}%")
                    ->orWhere('TP1', 'like', "%{$search}%");
            })
            ->paginate(10);
            
        return response()->json($customers);
    }
}