<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Section;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    private function getActiveCompanyCode(Request $request): ?string
    {
        $company = $request->user('company');
        $user = $request->user('web');

        return session('active_company_code', $company ? $company->company_code : ($user ? $user->company_code : null));
    }

    public function index(Request $request)
    {
        $company = $request->user('company');
        $user = $request->user('web');

        if (!$company && !$user) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return redirect()->route('company.login');
        }

        $activeCompanyCode = $this->getActiveCompanyCode($request);

        $query = User::with(['company', 'section', 'role']);

        // Strictly isolate all users to the selected company
        if ($activeCompanyCode) {
            $query->where('company_code', $activeCompanyCode);
        }

        // Filter by section within active company
        if ($request->has('section_code') && $request->section_code) {
            $query->where('section_code', $request->section_code);
        }

        // Filter by role within active company
        if ($request->has('role_id') && $request->role_id) {
            $query->where('role_id', $request->role_id);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($users);
        }

        $roles = Role::where(function ($q) use ($activeCompanyCode) {
            $q->where('company_code', $activeCompanyCode)
              ->orWhere('is_system_role', true);
        })->orderBy('name')->get();

        $sections = Section::where('company_code', $activeCompanyCode)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $companies = Company::where('company_code', $activeCompanyCode)->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'sections' => $sections,
            'companies' => $companies,
            'activeCompanyCode' => $activeCompanyCode,
        ]);
    }

    public function create(Request $request)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        $roles = Role::where(function ($q) use ($activeCompanyCode) {
            $q->where('company_code', $activeCompanyCode)
              ->orWhere('is_system_role', true);
        })->orderBy('name')->get();

        $sections = Section::where('company_code', $activeCompanyCode)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $companies = Company::where('company_code', $activeCompanyCode)->get();

        return Inertia::render('Users/Create', [
            'roles' => $roles,
            'sections' => $sections,
            'companies' => $companies,
            'activeCompanyCode' => $activeCompanyCode,
        ]);
    }

    public function store(Request $request)
    {
        $authUser = $request->user('web');
        $authCompany = $request->user('company');

        if (!$authUser && !$authCompany) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return redirect()->route('company.login');
        }

        $activeCompanyCode = $this->getActiveCompanyCode($request);

        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'section_code' => 'nullable|string|exists:sections,section_code',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        // Automatically assign user strictly to the active selected company
        $validated['user_type'] = 'company_user';
        $validated['company_code'] = $activeCompanyCode;

        $validated['password'] = Hash::make($validated['password']);
        $validated['uuid'] = (string) Str::uuid();
        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $user = User::create($validated);
        $user->load(['company', 'section', 'role']);

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($user, 201);
        }

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function show(Request $request, User $user)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        // Disallow viewing users from other companies
        if ($user->company_code && $activeCompanyCode && $user->company_code !== $activeCompanyCode) {
            abort(403, 'Unauthorized access to this user.');
        }

        $user->load(['company', 'section', 'role.permissions']);

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($user);
        }

        return Inertia::render('Users/Show', [
            'user' => $user,
        ]);
    }

    public function edit(Request $request, User $user)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        // Disallow editing users from other companies
        if ($user->company_code && $activeCompanyCode && $user->company_code !== $activeCompanyCode) {
            abort(403, 'Unauthorized access to this user.');
        }

        $user->load(['company', 'section', 'role']);

        $roles = Role::where(function ($q) use ($activeCompanyCode) {
            $q->where('company_code', $activeCompanyCode)
              ->orWhere('is_system_role', true);
        })->orderBy('name')->get();

        $sections = Section::where('company_code', $activeCompanyCode)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $companies = Company::where('company_code', $activeCompanyCode)->get();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'sections' => $sections,
            'companies' => $companies,
            'activeCompanyCode' => $activeCompanyCode,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        // Disallow editing users from other companies
        if ($user->company_code && $activeCompanyCode && $user->company_code !== $activeCompanyCode) {
            abort(403, 'Unauthorized access to this user.');
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'section_code' => 'nullable|string|exists:sections,section_code',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        // Keep company locked to active company
        $validated['company_code'] = $activeCompanyCode;

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        $user->load(['company', 'section', 'role']);

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($user);
        }

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(Request $request, User $user)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        if ($user->company_code && $activeCompanyCode && $user->company_code !== $activeCompanyCode) {
            abort(403, 'Unauthorized access.');
        }

        $user->delete();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'User deleted successfully']);
        }

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }

    public function toggle(Request $request, User $user)
    {
        $activeCompanyCode = $this->getActiveCompanyCode($request);

        if ($user->company_code && $activeCompanyCode && $user->company_code !== $activeCompanyCode) {
            abort(403, 'Unauthorized access.');
        }

        $user->is_active = !$user->is_active;
        $user->save();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($user);
        }

        return back()->with('success', 'User status updated successfully.');
    }
}
