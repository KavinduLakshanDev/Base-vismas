<?php

namespace App\Http\Controllers;

use App\Models\Address;
use App\Models\Section;
use App\Models\AccMas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->hasPermission('suppliers.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view suppliers.');
        }

        $query = Address::with(['company', 'section'])
            ->where('AdrTypKy', 4)
            ->where('company_code', $request->user()->company_code);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('FstNm', 'like', "%{$search}%")
                  ->orWhere('MidNm', 'like', "%{$search}%")
                  ->orWhere('LstNm', 'like', "%{$search}%")
                  ->orWhere('Email', 'like', "%{$search}%")
                  ->orWhere('TP1', 'like', "%{$search}%")
                  ->orWhere('City', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('Status', $request->status);
        }

        $perPage = $request->input('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }

        $suppliers = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('supplier/index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    public function create()
    {
        if (!auth()->user()->hasPermission('suppliers.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create suppliers.');
        }

        return Inertia::render('supplier/create');
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasPermission('suppliers.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create suppliers.');
        }

        $validated = $request->validate([
            'FstNm' => 'required|string|max:60',
            'MidNm' => 'nullable|string|max:60',
            'LstNm' => 'nullable|string|max:60',
            'Address' => 'nullable|string|max:250',
            'Town' => 'nullable|string|max:60',
            'City' => 'nullable|string|max:60',
            'Country' => 'nullable|string|max:60',
            'CtPerson' => 'nullable|string|max:100',
            'TP1' => 'nullable|string|max:30',
            'Fax' => 'nullable|string|max:30',
            'Email' => 'nullable|email|max:100',
            'Website' => 'nullable|url|max:100',
            'fVATRegistered' => 'boolean',
            'VATNo' => 'nullable|required_if:fVATRegistered,1|string|max:50',
        ]);

        $user = auth()->user();
        $section = Section::where('section_code', $user->section_code)->firstOrFail();

        // Generate Supplier Code
        // Format: SUP[Sequence] (e.g. SUP001)
        $prefix = 'SUP';
        
        // Find the latest supplier code with this prefix
        $latestParams = AccMas::where('company_code', $section->company_code)
            ->where('AccCd', 'LIKE', $prefix . '%')
            ->orderBy('AccKy', 'desc')
            ->first();

        $nextSequence = 1;
        if ($latestParams) {
            // Extract the sequence number from the last code (remove 'SUP' prefix)
            $lastSequence = (int) substr($latestParams->AccCd, 3);
            $nextSequence = $lastSequence + 1;
        }

        $accCd = $prefix . str_pad($nextSequence, 3, '0', STR_PAD_LEFT);

        $account = AccMas::create([
            'AccCd' => $accCd,
            'AccNm' => $validated['FstNm'] . ' ' . ($validated['LstNm'] ?? ''),
            'AccTyp' => 'SUPPLIER',
            'company_code' => $section->company_code,
            'section_code' => $section->section_code,
            'Status' => 'A',
        ]);

        Address::create([
            'AccKy' => $account->AccKy,
            'AdrCd' => $accCd, // Also using generated code for AdrCd
            'company_code' => $section->company_code,
            'section_code' => $section->section_code,
            'FstNm' => $validated['FstNm'],
            'MidNm' => $validated['MidNm'],
            'LstNm' => $validated['LstNm'],
            'Address' => $validated['Address'],
            'Town' => $validated['Town'],
            'City' => $validated['City'],
            'Country' => $validated['Country'],
            'CtPerson' => $validated['CtPerson'],
            'TP1' => $validated['TP1'],
            'Fax' => $validated['Fax'],
            'Email' => $validated['Email'],
            'Website' => $validated['Website'],
            'fVATRegistered' => $validated['fVATRegistered'],
            'VATNo' => $validated['VATNo'],
            'uuid' => Str::uuid(),
            'Status' => '1', // Active by default?
            'AdrTypKy' => 4, // 4 for Supplier
        ]);

        return redirect()->route('suppliers.create')->with('success', 'Supplier registered successfully.');
    }

    public function edit($id)
    {
        if (!auth()->user()->hasPermission('suppliers.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit suppliers.');
        }

        $supplier = Address::where('company_code', auth()->user()->company_code)->findOrFail($id);

        return Inertia::render('supplier/edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, $id)
    {
        if (!auth()->user()->hasPermission('suppliers.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit suppliers.');
        }

        $supplier = Address::where('company_code', auth()->user()->company_code)->findOrFail($id);

        $validated = $request->validate([
            'FstNm' => 'required|string|max:60',
            'MidNm' => 'nullable|string|max:60',
            'LstNm' => 'nullable|string|max:60',
            'Address' => 'nullable|string|max:250',
            'Town' => 'nullable|string|max:60',
            'City' => 'nullable|string|max:60',
            'Country' => 'nullable|string|max:60',
            'CtPerson' => 'nullable|string|max:100',
            'TP1' => 'nullable|string|max:30',
            'Fax' => 'nullable|string|max:30',
            'Email' => 'nullable|email|max:100',
            'Website' => 'nullable|url|max:100',
            'fVATRegistered' => 'boolean',
            'VATNo' => 'nullable|required_if:fVATRegistered,1|string|max:50',
        ]);

        $user = auth()->user();
        $section = Section::where('section_code', $user->section_code)->firstOrFail();

        $supplier->update([
            'company_code' => $section->company_code,
            'section_code' => $section->section_code,
            'FstNm' => $validated['FstNm'],
            'MidNm' => $validated['MidNm'],
            'LstNm' => $validated['LstNm'],
            'Address' => $validated['Address'],
            'Town' => $validated['Town'],
            'City' => $validated['City'],
            'Country' => $validated['Country'],
            'CtPerson' => $validated['CtPerson'],
            'TP1' => $validated['TP1'],
            'Fax' => $validated['Fax'],
            'Email' => $validated['Email'],
            'Website' => $validated['Website'],
            'fVATRegistered' => $validated['fVATRegistered'],
            'VATNo' => $validated['VATNo'],
        ]);

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    public function show($id)
    {
        if (!auth()->user()->hasPermission('suppliers.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view suppliers.');
        }

        $supplier = Address::with(['company', 'section'])
            ->where('company_code', auth()->user()->company_code)
            ->findOrFail($id);

        return Inertia::render('supplier/show', [
            'supplier' => $supplier,
        ]);
    }

    public function toggleStatus($id)
    {
        if (!auth()->user()->hasPermission('suppliers.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit suppliers.');
        }

        $supplier = Address::where('company_code', auth()->user()->company_code)->findOrFail($id);

        // Toggle status between '1' (active) and '0' (inactive)
        $supplier->Status = $supplier->Status === '1' ? '0' : '1';
        $supplier->save();

        $statusText = $supplier->Status === '1' ? 'activated' : 'deactivated';

        return redirect()->back()->with('success', "Supplier {$statusText} successfully.");
    }
}
