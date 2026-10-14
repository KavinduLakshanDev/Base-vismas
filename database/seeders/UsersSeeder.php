<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Get or create Company Admin Role
        $companyAdminRole = Role::firstOrCreate(
            ['slug' => 'company_admin'],
            [
                'name' => 'Company Admin',
                'description' => 'Has full access to their company',
                'level' => 'company_admin',
                'company_code' => null,
            ]
        );

        // --- 1. VISMASS (VIS001) COMPANY ADMIN ---
        User::firstOrCreate(
            ['email' => 'admin.vismass@example.com'],
            [
                'username' => 'vismass_admin',
                'password' => Hash::make('password'),
                'first_name' => 'Vismass',
                'last_name' => 'Admin',
                'phone' => '0771234567',
                'user_type' => 'company_admin',
                'role_id' => $companyAdminRole->id,
                'company_code' => 'VIS001',
                'section_code' => null,
                'is_active' => true,
                'is_verified' => true,
                'email_verified_at' => now(),
                'uuid' => (string) Str::uuid(),
            ]
        );

        // --- 2. MALIBO (MAL001) COMPANY ADMIN ---
        User::firstOrCreate(
            ['email' => 'admin.malibo@example.com'],
            [
                'username' => 'malibo_admin',
                'password' => Hash::make('password'),
                'first_name' => 'Malibo',
                'last_name' => 'Admin',
                'phone' => '0777654321',
                'user_type' => 'company_admin',
                'role_id' => $companyAdminRole->id,
                'company_code' => 'MAL001',
                'section_code' => null,
                'is_active' => true,
                'is_verified' => true,
                'email_verified_at' => now(),
                'uuid' => (string) Str::uuid(),
            ]
        );
    }
}
