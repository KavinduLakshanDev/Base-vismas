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

    public function create(Request $request)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);
        $suggestedCode = Section::generateNextCode($activeCompanyCode);

        return Inertia::render('sections/create', [
            'suggestedCode' => $suggestedCode,
            'activeCompanyCode' => $activeCompanyCode,
        ]);
    }

    public function generateCode(Request $request)
    {
        $companyCode = $request->input('company_code') ?: $this->getActiveCompanyCode($request);
        $code = Section::generateNextCode($companyCode);

        return response()->json([
            'section_code' => $code,
        ]);
    }

    public function store(Request $request)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        // Auto-generate section_code if empty or not provided
        if (!$request->filled('section_code')) {
            $request->merge([
                'section_code' => Section::generateNextCode($activeCompanyCode),
            ]);
        }

        $validated = $request->validate([
            'section_code' => 'required|string|max:50|unique:sections,section_code',
            'name' => 'required|string|max:255',
            'section_type' => 'required|in:warehouse,store,office,other',
            'is_main_stock' => 'boolean',
        ]);

        // Prevent race condition: ensure code is strictly unique before insert
        if (Section::where('section_code', $validated['section_code'])->exists()) {
            $validated['section_code'] = Section::generateNextCode($activeCompanyCode);
        }

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
            'section_type' => 'required|in:warehouse,store,office,other',
            'is_main_stock' => 'boolean',
        ]);

        $section->update($validated);

        return redirect()->route('sections.show', $section)->with('success', 'Section updated successfully.');
    }

    public function toggle(Request $request, Section $section)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        if ($section->company_code && $activeCompanyCode && $section->company_code !== $activeCompanyCode) {
            abort(403, 'Unauthorized access.');
        }

        $section->is_active = !$section->is_active;
        $section->save();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($section);
        }

        $status = $section->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "Section {$section->name} {$status} successfully.");
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
