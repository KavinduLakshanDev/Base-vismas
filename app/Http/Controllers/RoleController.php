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
        $activeCompanyCode = session('active_company_code', $user?->company_code);

        $query = Role::with(['permissions', 'company', 'section']);

        // Filter based on active company
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
        $permissions = $this->getFilteredPermissions();

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
            'filters' => $request->only(['search', 'level']),
            'currentUserType' => $user?->type ?? $user?->user_type,
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

        $activeCompanyCode = session('active_company_code', $user?->company_code);
        if ($activeCompanyCode) {
            $query->where(function($q) use ($activeCompanyCode) {
                $q->where('company_code', $activeCompanyCode)
                  ->orWhere('is_system_role', true);
            });
        }

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

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
     * Get permissions filtered based on user privileges.
     */
    private function getFilteredPermissions()
    {
        return Permission::orderBy('name')->get();
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        $user = Auth::user();
        $activeCompanyCode = session('active_company_code', $user?->company_code);

        $permissions = $this->getFilteredPermissions();
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

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name'], '_');
        }

        $originalSlug = $data['slug'];
        $counter = 1;
        while (Role::where('slug', $data['slug'])->exists()) {
            $data['slug'] = $originalSlug . '_' . $counter;
            $counter++;
        }

        $activeCompanyCode = session('active_company_code', $user?->company_code);
        $data['company_code'] = $activeCompanyCode;
        if ($activeCompanyCode) {
            $comp = Company::where('company_code', $activeCompanyCode)->first();
            if ($comp) {
                $data['company_id'] = $comp->id;
            }
        }

        $isSuperAdmin = method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : in_array($user?->user_type ?? '', ['super_admin', 'superadmin', 'super admin']);
        $data['is_system_role'] = $isSuperAdmin && $request->boolean('is_system_role', false);

        $permissions = $data['permissions'] ?? [];
        unset($data['permissions']);

        DB::transaction(function () use ($data, $permissions) {
            $role = Role::create($data);
            $role->permissions()->sync($permissions);
        });

        return redirect()->route('roles.index')
            ->with('success', 'Role created successfully with Permissions!');
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
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
        $activeCompanyCode = session('active_company_code', $user?->company_code);

        if ($role->company_code && $activeCompanyCode && $role->company_code !== $activeCompanyCode) {
            return redirect()->route('roles.index')->with('error', 'Unauthorized access to this role.');
        }

        $isSuperAdmin = method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : in_array($user?->user_type ?? '', ['super_admin', 'superadmin', 'super admin']);
        if ($role->is_system_role && !$isSuperAdmin) {
            return redirect()->back()->with('error', 'System roles can only be edited by super admins.');
        }

        $permissions = $this->getFilteredPermissions();
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
        $isSuperAdmin = method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : in_array($user?->user_type ?? '', ['super_admin', 'superadmin', 'super admin']);

        if ($role->is_system_role && !$isSuperAdmin) {
            return redirect()->back()->with('error', 'System roles can only be edited by super admins.');
        }

        $activeCompanyCode = session('active_company_code', $user?->company_code);
        if ($role->company_code && $activeCompanyCode && $role->company_code !== $activeCompanyCode) {
            return redirect()->route('roles.index')->with('error', 'Unauthorized access to this role.');
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

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name'], '_');
        }

        $originalSlug = $data['slug'];
        $counter = 1;
        while (Role::where('slug', $data['slug'])->where('id', '!=', $role->id)->exists()) {
            $data['slug'] = $originalSlug . '_' . $counter;
            $counter++;
        }

        $permissions = $data['permissions'] ?? [];
        unset($data['permissions']);

        DB::transaction(function () use ($role, $data, $permissions) {
            $role->update($data);
            $role->permissions()->sync($permissions);
        });

        return redirect()->route('roles.index')
            ->with('success', 'Role updated successfully with Permissions!');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role): RedirectResponse
    {
        $user = Auth::user();
        $isSuperAdmin = method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : in_array($user?->user_type ?? '', ['super_admin', 'superadmin', 'super admin']);

        // Prevent deletion of system roles by non-superadmins
        if ($role->is_system_role && !$isSuperAdmin) {
            return redirect()->back()->with('error', 'System roles cannot be deleted!');
        }

        // Prevent deletion of core super_admin role
        if ($role->slug === 'super_admin') {
            return redirect()->back()->with('error', 'The super_admin role cannot be deleted.');
        }

        // If the role has users assigned, prevent deletion
        if ($role->users()->count() > 0) {
            return redirect()->back()->with('error', 'Role cannot be deleted as it is assigned to users!');
        }

        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully!');
    }
}