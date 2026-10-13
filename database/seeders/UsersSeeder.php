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

        // 2. Define Companies and Sections
        // Vismass Sections
        $visServiceSection = Section::where('section_code', 'VIS-SEC-001')->first();
        $visImportSection = Section::where('section_code', 'VIS-SEC-002')->first();
        $visMainStockSection = Section::where('section_code', 'VIS-SEC-003')->first();

        // Malibo Sections
        $malDeliverySection = Section::where('section_code', 'MAL-SEC-001')->first();
        $malPrintingSection = Section::where('section_code', 'MAL-SEC-002')->first();


        // 3. Technicians (Assigned to Service Section)
        if ($technicianRole && $visServiceSection) {
            // Create 2 technicians for Vismass
            for ($i = 1; $i <= 2; $i++) {
                User::firstOrCreate(
                    ['email' => "tech{$i}.vismass@example.com"],
                    [
                        'username' => "vismass_tech_{$i}",
                        'password' => Hash::make('password'),
                        'first_name' => 'Vismass',
                        'last_name' => "Technician {$i}",
                        'user_type' => 'section_user',
                        'role_id' => $technicianRole->id,
                        'company_code' => 'VIS001',
                        'section_code' => $visServiceSection->section_code,
                        'is_active' => true,
                        'is_verified' => true,
                        'email_verified_at' => now(),
                        'uuid' => (string) Str::uuid(),
                    ]
                );
            }
        }

        // 4. Cashiers (Assigned to Import Section)
        if ($cashierRole && $visImportSection) {
            // Create 2 cashiers for Vismass
            for ($i = 1; $i <= 2; $i++) {
                User::firstOrCreate(
                    ['email' => "cashier{$i}.vismass@example.com"],
                    [
                        'username' => "vismass_cashier_{$i}",
                        'password' => Hash::make('password'),
                        'first_name' => 'Vismass',
                        'last_name' => "Cashier {$i}",
                        'user_type' => 'section_user',
                        'role_id' => $cashierRole->id,
                        'company_code' => 'VIS001',
                        'section_code' => $visImportSection->section_code,
                        'is_active' => true,
                        'is_verified' => true,
                        'email_verified_at' => now(),
                        'uuid' => (string) Str::uuid(),
                    ]
                );
            }
        }


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
                    'section_code' => $malDeliverySection->section_code ?? null,
                    'is_active' => true,
                    'is_verified' => true,
                    'email_verified_at' => now(),
                    'uuid' => (string) Str::uuid(),
                ]
            );
        }



        // 3. Cashiers (Assigned to Printing Section or generic)
        if ($cashierRole && $malPrintingSection) {
             // Create 2 cashiers for Malibo
             for ($i = 1; $i <= 2; $i++) {
                User::firstOrCreate(
                    ['email' => "cashier{$i}.malibo@example.com"],
                    [
                        'username' => "malibo_cashier_{$i}",
                        'password' => Hash::make('password'),
                        'first_name' => 'Malibo',
                        'last_name' => "Cashier {$i}",
                        'user_type' => 'section_user',
                        'role_id' => $cashierRole->id,
                        'company_code' => 'MAL001',
                        'section_code' => $malPrintingSection->section_code,
                        'is_active' => true,
                        'is_verified' => true,
                        'email_verified_at' => now(),
                        'uuid' => (string) Str::uuid(),
                    ]
                );
            }
        }
    }
}
