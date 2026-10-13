<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class VismassUserSeeder extends Seeder
{
    public function run(): void
    {
        // Check if user exists
        $user = User::where('email', 'vismass@example.com')->first();

        if (!$user) {
            // Get company admin role
            $role = Role::where('slug', 'company_admin')->first();

            // Create the user
            User::create([
                'email' => 'vismass@example.com',
                'password' => Hash::make('password'), // Default password
                'first_name' => 'Vismass',
                'last_name' => 'Admin',
                'user_type' => 'company_user',
                'company_code' => 'VIS001',
                'section_code' => 'VIS-SEC-002',
                'role_id' => $role ? $role->id : null,
                'is_active' => true,
                'is_verified' => true,
                'email_verified_at' => now(),
            ]);

            echo "User vismass@example.com created as company_user.\n";
        } else {
            // Update if exists
            $user->update([
                'user_type' => 'company_user',
                'company_code' => 'VIS001',
                'section_code' => 'VIS-SEC-002',
                'is_active' => true,
            ]);
            echo "User vismass@example.com updated to company_user.\n";
        }
    }
}