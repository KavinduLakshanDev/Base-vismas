<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Section;
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
        // 1. Get Roles
        $companyAdminRole = Role::where('slug', 'company_admin')->first();

        $technicianRole = Role::where('slug', 'technician')->first();
        $cashierRole = Role::where('slug', 'cashier')->first();


         // --- MALIBO (MAL001) USERS ---

        // 1. Company Admin
        if ($companyAdminRole) {
            User::firstOrCreate(
                ['email' => 'admin.malibo@example.com'],
                [
                    'username' => 'malibo_admin',
                    'password' => Hash::make('password'),
                    'first_name' => 'Malibo',
                    'last_name' => 'Admin',
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
}
