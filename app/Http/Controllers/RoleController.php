<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use App\Models\Company;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Check if user has permission to view roles
        if (!$user->hasPermission('roles.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view roles.');
        }
        $query = Role::with(['permissions', 'company', 'section']);

        // Filter based on active company
        $activeCompanyCode = session('active_company_code', $user->company_code);
        if ($activeCompanyCode) {
            $query->where(function($q) use ($activeCompanyCode) {
                $q->where('company_code', $activeCompanyCode)
                  ->orWhere('is_system_role', true);
            });
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Filter by level
        if ($request->filled('level')) {
            $query->where('level', $request->get('level'));
        }

        $roles = $query->orderBy('name')->paginate(20);

        // Ensure permissions are loaded for each role
        $roles->getCollection()->transform(function ($role) {
            if (!$role->relationLoaded('permissions')) {
                $role->load('permissions');
            }
            return $role;
        });

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'filters' => $request->only(['search', 'level']),
            'success' => session('success'),
            'error' => session('error'),
        ]);
    }

    /**
     * Get roles data in JSON format
     */
    public function getJsonRoles(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();
        $query = Role::with(['permissions:id,name,slug,description', 'company:id,name,company_code', 'section:id,name,section_code']);

        // Filter based on active company
        $activeCompanyCode = session('active_company_code', $user->company_code);
        if ($activeCompanyCode) {
            $query->where(function($q) use ($activeCompanyCode) {
                $q->where('company_code', $activeCompanyCode)
                  ->orWhere('is_system_role', true);
            });
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Filter by level
        if ($request->filled('level')) {
            $query->where('level', $request->get('level'));
        }

        $roles = $query->orderBy('name')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $roles->items(),
            'pagination' => [
                'current_page' => $roles->currentPage(),
                'per_page' => $roles->perPage(),
                'total' => $roles->total(),
                'last_page' => $roles->lastPage(),
                'from' => $roles->firstItem(),
                'to' => $roles->lastItem(),
            ],
            'filters' => $request->only(['search', 'level']),
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        $user = Auth::user();

        // Check if user has permission to create roles
        if (!$user->hasPermission('roles.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create roles.');
        }
        $permissions = Permission::orderBy('name')->get();
        $activeCompanyCode = session('active_company_code', $user->company_code);
        $companies = $activeCompanyCode ? Company::where('company_code', $activeCompanyCode)->get() : [];
        $sections = $activeCompanyCode ? Section::where('company_code', $activeCompanyCode)->where('is_active', true)->orderBy('name')->get() : [];

        return Inertia::render('Roles/Create', [
            'permissions' => $permissions,
            'companies' => $companies,
            'sections' => $sections,
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('roles.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create roles.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:roles,slug',
            'description' => 'nullable|string|max:500',
            'level' => 'required|in:super_admin,company_admin,branch_admin,user',
            'company_id' => 'nullable|exists:companies,id',
            'section_id' => 'nullable|exists:sections,id',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $data = $validator->validated();

        // Auto-generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name'], '_');
        }

        // Ensure slug is unique
        $originalSlug = $data['slug'];
        $counter = 1;
        while (Role::where('slug', $data['slug'])->exists()) {
            $data['slug'] = $originalSlug . '_' . $counter;
            $counter++;
        }

        $activeCompanyCode = session('active_company_code', $user->company_code);
        $data['company_code'] = $activeCompanyCode;
        if ($activeCompanyCode) {
            $comp = Company::where('company_code', $activeCompanyCode)->first();
            if ($comp) {
                $data['company_id'] = $comp->id;
            }
        }

        // System roles can only be created by super admins
        if ($user->user_type !== 'super_admin') {
            $data['is_system_role'] = false;
        } else {
            $data['is_system_role'] = $request->boolean('is_system_role', false);
        }

        $permissions = $data['permissions'] ?? [];
        unset($data['permissions']);

        DB::transaction(function () use ($data, $permissions) {
            $role = Role::create($data);
            $role->permissions()->sync($permissions);
        });

        return redirect()->route('roles.index')
            ->with('success', 'Role created successfully.');
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('roles.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view roles.');
        }

        // Check if user has access to view this role
        if ($user->user_type === 'company_user' &&
            $role->company_code &&
            $role->company_code !== $user->company_code) {
            return redirect()->back()->with('error', 'You do not have permission to view this role.');
        }

        $role->load(['permissions', 'company', 'section', 'users']);

        return Inertia::render('Roles/Show', [
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('roles.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit roles.');
        }

        // Check if user has access to edit this role
        if ($user->user_type === 'company_user' &&
            $role->company_id &&
            $role->company_id !== $user->company_id) {
            return redirect()->back()->with('error', 'You do not have permission to edit this role.');
        }

        // System roles can only be edited by super admins
        if ($role->is_system_role && $user->user_type !== 'super_admin') {
            return redirect()->back()->with('error', 'You do not have permission to edit system roles.');
        }

        $permissions = Permission::orderBy('name')->get();
        $activeCompanyCode = session('active_company_code', $user->company_code);
        if ($role->company_code && $activeCompanyCode && $role->company_code !== $activeCompanyCode) {
            return redirect()->route('roles.index')->with('error', 'Unauthorized access to this role.');
        }

        $companies = $activeCompanyCode ? Company::where('company_code', $activeCompanyCode)->get() : [];
        $sections = $activeCompanyCode ? Section::where('company_code', $activeCompanyCode)->where('is_active', true)->orderBy('name')->get() : [];

        $role->load('permissions');

        return Inertia::render('Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
            'companies' => $companies,
            'sections' => $sections,
            'selectedPermissions' => $role->permissions->pluck('id'),
        ]);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('roles.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit roles.');
        }

        $activeCompanyCode = session('active_company_code', $user->company_code);
        if ($role->company_code && $activeCompanyCode && $role->company_code !== $activeCompanyCode) {
            return redirect()->route('roles.index')->with('error', 'Unauthorized access to this role.');
        }

        // System roles can only be edited by super admins
        if ($role->is_system_role && $user->user_type !== 'super_admin') {
            return redirect()->back()->with('error', 'You do not have permission to edit system roles.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:roles,slug,' . $role->id,
            'description' => 'nullable|string|max:500',
            'level' => 'required|in:super_admin,company_admin,branch_admin,user',
            'company_id' => 'nullable|exists:companies,id',
            'section_id' => 'nullable|exists:sections,id',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $data = $validator->validated();

        // Auto-generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name'], '_');
        }

        // Ensure slug is unique (excluding current role)
        $originalSlug = $data['slug'];
        $counter = 1;
        while (Role::where('slug', $data['slug'])->where('id', '!=', $role->id)->exists()) {
            $data['slug'] = $originalSlug . '_' . $counter;
            $counter++;
        }

        // Validate access restrictions
        if ($user->user_type === 'company_user') {
            $data['company_code'] = $user->company_code;

            // Company users cannot modify certain role levels
            if (in_array($data['level'], ['super_admin', 'company_admin']) && $user->role->level !== 'company_admin') {
                return redirect()->back()
                    ->with('error', 'You do not have permission to set this role level.')
                    ->withInput();
            }
        }

        $permissions = $data['permissions'] ?? [];
        unset($data['permissions']);

        DB::transaction(function () use ($role, $data, $permissions) {
            $role->update($data);
            $role->permissions()->sync($permissions);
        });

        return redirect()->route('roles.index')
            ->with('success', 'Role updated successfully.');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Request $request, Role $role): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('roles.delete')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete roles.');
        }

        $activeCompanyCode = session('active_company_code', $user->company_code);
        if ($role->company_code && $activeCompanyCode && $role->company_code !== $activeCompanyCode) {
            return redirect()->route('roles.index')->with('error', 'Unauthorized access to this role.');
        }

        // System roles can only be deleted by super admins
        if ($role->is_system_role && $user->user_type !== 'super_admin') {
            return redirect()->back()
                ->with('error', 'System roles cannot be deleted.');
        }

        $force = (bool) $request->get('force', false);

        // Prevent deletion of core super_admin role at all costs
        if ($role->slug === 'super_admin') {
            return redirect()->back()->with('error', 'The super_admin role cannot be deleted.');
        }

        // Check if role is being used by any users
        if (!$force && $role->users()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete role. It is currently assigned to one or more users.');
        }

        // When forcing deletion, only super admins can perform it
        if ($force) {
            if ($user->user_type !== 'super_admin') {
                return redirect()->back()->with('error', 'Only super_admins can force delete roles.');
            }

            DB::transaction(function () use ($role) {
                // Detach permissions
                $role->permissions()->detach();

                // Reassign users assigned to this role to a fallback 'user' role (or first available role)
                $fallbackRole = Role::where('level', 'user')->where('id', '!=', $role->id)->first();
                if (!$fallbackRole) {
                    // Try to find any role that's not the one being deleted
                    $fallbackRole = Role::where('id', '!=', $role->id)->first();
                }
                if (!$fallbackRole) {
                    // Create a fallback role if none exist
                    $fallbackRole = Role::firstOrCreate(
                        ['slug' => 'staff_user'],
                        [
                            'name' => 'Staff User',
                            'description' => 'Default staff role',
                            'level' => 'user',
                            'is_system_role' => true,
                        ]
                    );
                }

                // Update each user to fallback role
                if ($fallbackRole) {
                    $role->users()->update(['role_id' => $fallbackRole->id]);
                }

                // Finally delete the role
                $role->delete();
            });

            \Illuminate\Support\Facades\Log::info("Role {$role->id} force-deleted by user " . ($user?->id ?? 'unknown'));

            return redirect()->route('roles.index')
                ->with('success', 'Role force-deleted successfully.');
        }

        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully.');
    }

    /**
     * Get all roles for API use (used in dropdowns, etc.)
     */
    public function getAllRoles(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();

        // Check if permissions should be included
        $includePermissions = $request->boolean('include_permissions', false);

        if ($includePermissions) {
            $query = Role::with(['permissions:id,name,slug,description']);
        } else {
            $query = Role::select('id', 'name', 'slug', 'description', 'level', 'company_code', 'section_code');
        }

        // Filter based on user access
        if ($user->user_type === 'company_user') {
            $query->where(function($q) use ($user) {
                $q->where('company_code', $user->company_code)
                  ->orWhere('is_system_role', true);
            });
        }

        $roles = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
            'count' => $roles->count(),
        ]);
    }

    /**
     * Get sections for a specific company
     */
    public function getSectionsByCompany(Company $company): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this company
        if ($user->user_type === 'company_user' && $user->company_code !== $company->company_code) {
            return redirect()->back()->with('error', 'You do not have permission to view sections for this company.');
        }

        $sections = Section::where('company_code', $company->company_code)
            ->select('id', 'name', 'section_code')
            ->orderBy('name')
            ->get();

        return response()->json($sections);
    }
}