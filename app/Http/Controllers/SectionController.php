<?php

namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SectionController extends Controller
{
    private function getActiveCompanyCode(Request $request): ?string
    {
        $user = $request->user();
        return session('active_company_code', $user?->company_code);
    }

    public function index(Request $request)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        $sections = Section::where('company_code', $activeCompanyCode)
            ->orderBy('name')
            ->get();

        return Inertia::render('sections/index', [
            'sections' => $sections,
            'activeCompanyCode' => $activeCompanyCode,
        ]);
    }

    public function create()
    {
        return Inertia::render('sections/create');
    }

    public function store(Request $request)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        $validated = $request->validate([
            'section_code' => 'required|string|unique:sections,section_code',
            'name' => 'required|string|max:255',
            'contact_person_name' => 'nullable|string|max:255',
            'contact_person_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:255',
            'section_type' => 'required|in:warehouse,store,office,other',
            'is_main_stock' => 'boolean',
        ]);

        $validated['uuid'] = Str::uuid();
        $validated['company_code'] = $activeCompanyCode;
        $validated['is_active'] = true;

        Section::create($validated);

        return redirect()->route('sections.index')->with('success', 'Section created successfully.');
    }

    public function show(Request $request, Section $section)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        if ($section->company_code !== $activeCompanyCode) {
            return redirect()->route('sections.index')->with('error', 'Unauthorized access to section.');
        }

        return Inertia::render('sections/show', [
            'section' => $section
        ]);
    }

    public function edit(Request $request, Section $section)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        if ($section->company_code !== $activeCompanyCode) {
            return redirect()->route('sections.index')->with('error', 'Unauthorized access to section.');
        }

        return Inertia::render('sections/edit', [
            'section' => $section
        ]);
    }

    public function update(Request $request, Section $section)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        if ($section->company_code !== $activeCompanyCode) {
            return redirect()->route('sections.index')->with('error', 'Unauthorized access to section.');
        }

        $validated = $request->validate([
            'section_code' => 'nullable|string',
            'name' => 'required|string|max:255',
            'contact_person_name' => 'nullable|string|max:255',
            'contact_person_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:255',
            'section_type' => 'required|in:warehouse,store,office,other',
            'is_main_stock' => 'boolean',
        ]);

        $section->update($validated);

        return redirect()->route('sections.show', $section)->with('success', 'Section updated successfully.');
    }

    public function apiIndex(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $activeCompanyCode = $this->getActiveCompanyCode($request);

        $query = Section::with('company');

        if ($activeCompanyCode) {
            $query->where('company_code', $activeCompanyCode);
        }

        return response()->json($query->orderBy('name')->get());
    }
}
