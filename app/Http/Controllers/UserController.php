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
    public function index(Request $request)
    {
        $query = User::with(['company', 'section', 'role']);

        $company = $request->user('company');
        $user = $request->user('web');
        
        if (!$company && !$user) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return redirect()->route('company.login');
        }
        
        $companyCode = $company ? $company->company_code : ($user ? $user->company_code : null);
        
        // Filter by company for non-super-admins
        if ($user && $user->user_type === 'super_admin') {
            if ($request->has('company_code') && $request->company_code) {
                $query->where('company_code', $request->company_code);
            }
        } elseif ($companyCode) {
            $query->where('company_code', $companyCode);
        }

        // Filter by section
        if ($request->has('section_code') && $request->section_code) {
            $query->where('section_code', $request->section_code);
        }

        // Filter by role
        if ($request->has('role_id') && $request->role_id) {
            $query->where('role_id', $request->role_id);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($users);
        }

        $roles = Role::orderBy('name')->get();
        $sections = Section::where('is_active', true)->orderBy('name')->get();
        $companies = ($user && $user->user_type === 'super_admin') ? Company::where('is_active', true)->orderBy('name')->get() : [];

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'sections' => $sections,
            'companies' => $companies,
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user('web');
        $company = $request->user('company');
        $companyCode = $company ? $company->company_code : ($user ? $user->company_code : null);

        $rolesQuery = Role::orderBy('name');
        if ($user && $user->user_type !== 'super_admin') {
            $rolesQuery->where('level', '!=', 'super_admin');
        }
        $roles = $rolesQuery->get();

        $sectionsQuery = Section::where('is_active', true)->orderBy('name');
        if ($user && $user->user_type !== 'super_admin' && $companyCode) {
            $sectionsQuery->where('company_code', $companyCode);
        }
        $sections = $sectionsQuery->get();

        $companies = ($user && $user->user_type === 'super_admin') ? Company::where('is_active', true)->orderBy('name')->get() : [];

        return Inertia::render('Users/Create', [
            'roles' => $roles,
            'sections' => $sections,
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'user_type' => 'nullable|in:super_admin,company_user',
            'company_code' => 'nullable|string|exists:companies,company_code',
            'section_code' => 'nullable|string|exists:sections,section_code',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $authUser = $request->user('web');
        $authCompany = $request->user('company');

        if (!$authUser && !$authCompany) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return redirect()->route('company.login');
        }

        // Set user_type and company_code appropriately
        if ($authUser && $authUser->user_type === 'super_admin') {
            if (!empty($validated['company_code'])) {
                $validated['user_type'] = 'company_user';
            } else {
                $validated['user_type'] = 'super_admin';
                $validated['company_code'] = null;
                $validated['section_code'] = null;
            }
        } else {
            $companyCode = $authCompany ? $authCompany->company_code : ($authUser ? $authUser->company_code : null);
            $validated['user_type'] = 'company_user';
            $validated['company_code'] = $companyCode;
        }

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
        $user->load(['company', 'section', 'role']);

        $authUser = $request->user('web');
        $authCompany = $request->user('company');
        $companyCode = $authCompany ? $authCompany->company_code : ($authUser ? $authUser->company_code : null);

        $rolesQuery = Role::orderBy('name');
        if ($authUser && $authUser->user_type !== 'super_admin') {
            $rolesQuery->where('level', '!=', 'super_admin');
        }
        $roles = $rolesQuery->get();

        $sectionsQuery = Section::where('is_active', true)->orderBy('name');
        if ($authUser && $authUser->user_type !== 'super_admin' && $companyCode) {
            $sectionsQuery->where('company_code', $companyCode);
        }
        $sections = $sectionsQuery->get();

        $companies = ($authUser && $authUser->user_type === 'super_admin') ? Company::where('is_active', true)->orderBy('name')->get() : [];

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'sections' => $sections,
            'companies' => $companies,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'company_code' => 'nullable|string|exists:companies,company_code',
            'section_code' => 'nullable|string|exists:sections,section_code',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

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
        $user->delete();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'User deleted successfully']);
        }

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }

    public function toggle(Request $request, User $user)
    {
        $user->is_active = !$user->is_active;
        $user->save();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($user);
        }

        return back()->with('success', 'User status updated successfully.');
    }
}
