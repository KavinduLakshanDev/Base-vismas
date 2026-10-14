<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Str;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Dashboard permissions
            ['name' => 'manage-dashboard', 'module' => 'dashboard', 'label' => 'Manage Dashboard', 'description' => 'Can view dashboard'],
            ['name' => 'view-dashboard', 'module' => 'dashboard', 'label' => 'View Dashboard', 'description' => 'Can view dashboard'],

            // User management
            ['name' => 'manage-users', 'module' => 'users', 'label' => 'Manage Users', 'description' => 'Can manage users'],
            ['name' => 'manage-any-users', 'module' => 'users', 'label' => 'Manage All Users', 'description' => 'Manage Any Users'],
            ['name' => 'manage-own-users', 'module' => 'users', 'label' => 'Manage Own Users', 'description' => 'Manage Limited Users that is created by own'],
            ['name' => 'view-users', 'module' => 'users', 'label' => 'View Users', 'description' => 'View Users'],
            ['name' => 'create-users', 'module' => 'users', 'label' => 'Create Users', 'description' => 'Can create users'],
            ['name' => 'edit-users', 'module' => 'users', 'label' => 'Edit Users', 'description' => 'Can edit users'],
            ['name' => 'delete-users', 'module' => 'users', 'label' => 'Delete Users', 'description' => 'Can delete users'],
            ['name' => 'reset-password-users', 'module' => 'users', 'label' => 'Reset Password Users', 'description' => 'Can reset password users'],
            ['name' => 'toggle-status-users', 'module' => 'users', 'label' => 'Change Status Users', 'description' => 'Can change status users'],

            // Roles & Permissions
            ['name' => 'manage-roles', 'module' => 'roles', 'label' => 'Manage Roles', 'description' => 'Can manage roles'],
            ['name' => 'view-roles', 'module' => 'roles', 'label' => 'View Roles', 'description' => 'Can view roles'],
            ['name' => 'create-roles', 'module' => 'roles', 'label' => 'Create Roles', 'description' => 'Can create new roles'],
            ['name' => 'edit-roles', 'module' => 'roles', 'label' => 'Edit Roles', 'description' => 'Can edit existing roles'],
            ['name' => 'delete-roles', 'module' => 'roles', 'label' => 'Delete Roles', 'description' => 'Can delete roles'],

            // Permissions Management
            ['name' => 'manage-permissions', 'module' => 'permissions', 'label' => 'Manage Permissions', 'description' => 'Can manage permissions'],
            ['name' => 'view-permissions', 'module' => 'permissions', 'label' => 'View Permissions', 'description' => 'Can view permissions'],
            ['name' => 'create-permissions', 'module' => 'permissions', 'label' => 'Create Permissions', 'description' => 'Can create new permissions'],
            ['name' => 'edit-permissions', 'module' => 'permissions', 'label' => 'Edit Permissions', 'description' => 'Can edit existing permissions'],
            ['name' => 'delete-permissions', 'module' => 'permissions', 'label' => 'Delete Permissions', 'description' => 'Can delete permissions'],

            // Sections
            ['name' => 'manage-sections', 'module' => 'sections', 'label' => 'Manage Sections', 'description' => 'Can manage sections'],
            ['name' => 'view-sections', 'module' => 'sections', 'label' => 'View Sections', 'description' => 'Can view sections'],
            ['name' => 'create-sections', 'module' => 'sections', 'label' => 'Create Sections', 'description' => 'Can create sections'],
            ['name' => 'edit-sections', 'module' => 'sections', 'label' => 'Edit Sections', 'description' => 'Can edit sections'],
            ['name' => 'delete-sections', 'module' => 'sections', 'label' => 'Delete Sections', 'description' => 'Can delete sections'],

            // Company & System Settings
            ['name' => 'manage-company-profile', 'module' => 'company', 'label' => 'Manage Company Profile', 'description' => 'Can manage company profile'],
            ['name' => 'manage-vat-rates', 'module' => 'company', 'label' => 'Manage VAT Rates', 'description' => 'Can manage VAT rates'],
            ['name' => 'manage-settings', 'module' => 'settings', 'label' => 'Manage Settings', 'description' => 'Can view and modify system settings'],
            ['name' => 'view-settings', 'module' => 'settings', 'label' => 'View Settings', 'description' => 'Can view system settings'],
            ['name' => 'edit-settings', 'module' => 'settings', 'label' => 'Edit Settings', 'description' => 'Can modify system settings'],

            // Media Library
            ['name' => 'manage-media', 'module' => 'media', 'label' => 'Manage Media', 'description' => 'Can access and manage media library'],
            ['name' => 'manage-any-media', 'module' => 'media', 'label' => 'Manage All Media', 'description' => 'Can manage media across company'],
            ['name' => 'manage-own-media', 'module' => 'media', 'label' => 'Manage Own Media', 'description' => 'Can manage own uploaded media'],
            ['name' => 'create-media', 'module' => 'media', 'label' => 'Create Media', 'description' => 'Can upload new media files'],
            ['name' => 'download-media', 'module' => 'media', 'label' => 'Download Media', 'description' => 'Can download media files'],
            ['name' => 'delete-media', 'module' => 'media', 'label' => 'Delete Media', 'description' => 'Can delete media files'],
            ['name' => 'manage-media-directories', 'module' => 'media', 'label' => 'Manage Media Directories', 'description' => 'Can manage directories'],
            ['name' => 'create-media-directories', 'module' => 'media', 'label' => 'Create Media Directories', 'description' => 'Can create media directories'],
            ['name' => 'edit-media-directories', 'module' => 'media', 'label' => 'Edit Media Directories', 'description' => 'Can edit media directories'],
            ['name' => 'delete-media-directories', 'module' => 'media', 'label' => 'Delete Media Directories', 'description' => 'Can delete media directories'],
        ];

        // Clean up any removed master data permissions
        Permission::where('slug', 'like', '%controller-master%')
            ->orWhere('slug', 'like', '%code-master%')
            ->delete();

        $permissionIds = [];

        foreach ($permissions as $permission) {
            $record = Permission::updateOrCreate(
                ['slug' => $permission['name']],
                [
                    'name' => $permission['label'] ?? $permission['name'],
                    'description' => $permission['description'] ?? null,
                    'uuid' => (string) Str::uuid(),
                ]
            );
            $permissionIds[] = $record->id;
        }

        // Ensure super_admin role has all seeded permissions
        $superAdminRole = Role::where('slug', 'super_admin')->first();
        if ($superAdminRole) {
            $superAdminRole->permissions()->syncWithoutDetaching($permissionIds);
        }

        // Ensure company_admin role has company-scoped permissions
        $companyAdminRole = Role::where('slug', 'company_admin')->first();
        if ($companyAdminRole) {
            $companyAdminRole->permissions()->syncWithoutDetaching($permissionIds);
        }
    }
}
