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
            // User & Access Management
            ['name' => 'View Users', 'slug' => 'users.view', 'description' => 'Can view users'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'description' => 'Can create new users'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'description' => 'Can edit existing users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'description' => 'Can delete users'],
            
            // Roles & Permissions
            ['name' => 'View Roles', 'slug' => 'roles.view', 'description' => 'Can view roles'],
            ['name' => 'Create Roles', 'slug' => 'roles.create', 'description' => 'Can create new roles'],
            ['name' => 'Edit Roles', 'slug' => 'roles.edit', 'description' => 'Can edit existing roles'],
            ['name' => 'Delete Roles', 'slug' => 'roles.delete', 'description' => 'Can delete roles'],

            // Permissions Management
            ['name' => 'View Permissions', 'slug' => 'permissions.view', 'description' => 'Can view permissions'],
            ['name' => 'Create Permissions', 'slug' => 'permissions.create', 'description' => 'Can create new permissions'],
            ['name' => 'Edit Permissions', 'slug' => 'permissions.edit', 'description' => 'Can edit existing permissions'],
            ['name' => 'Delete Permissions', 'slug' => 'permissions.delete', 'description' => 'Can delete permissions'],

            // Company & System Settings
            ['name' => 'Manage Company Profile', 'slug' => 'company.profile', 'description' => 'Can manage company profile'],
            ['name' => 'Manage Sections', 'slug' => 'sections.manage', 'description' => 'Can manage sections'],
            ['name' => 'Manage VAT Rates', 'slug' => 'vat_rates.manage', 'description' => 'Can manage VAT rates'],
            ['name' => 'Manage Controller Master', 'slug' => 'admin.controller_master', 'description' => 'Can manage controller master settings'],
            ['name' => 'Manage Code Master', 'slug' => 'admin.code_master', 'description' => 'Can manage code master settings'],
            ['name' => 'View Settings', 'slug' => 'settings.view', 'description' => 'Can view system settings'],
            ['name' => 'Edit Settings', 'slug' => 'settings.edit', 'description' => 'Can modify system settings'],

        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                [
                    'name' => $permission['name'],
                    'description' => $permission['description'],
                    'uuid' => (string) Str::uuid(),
                ]
            );
        }
    }

}
