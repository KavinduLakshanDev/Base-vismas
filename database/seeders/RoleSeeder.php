<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Super Admin Role
        Role::firstOrCreate(
            ['slug' => 'super_admin'],
            [
                'name' => 'Super Admin',
                'description' => 'Has full access to the entire system',
                'level' => 'super_admin',
                'company_code' => null,
            ]
        );

        // Company Admin Role
        Role::firstOrCreate(
            ['slug' => 'company_admin'],
            [
                'name' => 'Company Admin',
                'description' => 'Has full access to their company',
                'level' => 'company_admin',
                'company_code' => null,
            ]
        );



        // Technician
        Role::firstOrCreate(
            ['slug' => 'technician'],
            [
                'name' => 'Technician',
                'description' => 'Technician role',
                'level' => 'section_user',
                'company_code' => null,
            ]
        );


        // Cashier
        Role::firstOrCreate(
            ['slug' => 'cashier'],
            [
                'name' => 'Cashier',
                'description' => 'Cashier role',
                'level' => 'section_user',
                'company_code' => null,
            ]
        );
    }
}
