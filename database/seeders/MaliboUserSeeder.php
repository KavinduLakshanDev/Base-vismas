<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MaliboUserSeeder extends Seeder
{
    public function run(): void
    {
        // Check if user exists
        $user = User::where('email', 'malibo@example.com')->first();

        if (!$user) {
            // Get company admin role
            $role = Role::where('slug', 'company_admin')->first();

            // Create the user
            User::create([
                'email' => 'malibo@example.com',
                'password' => Hash::make('password'), // Default password
                'first_name' => 'Malibo',
                'last_name' => 'Admin',
                'user_type' => 'company_user',
                'company_code' => 'MAL001',
                'section_code' => 'MAL-SEC-001', // Delivery section
                'role_id' => $role ? $role->id : null,
                'is_active' => true,
                'is_verified' => true,
                'email_verified_at' => now(),
            ]);

            echo "User malibo@example.com created as company_user.\n";
        } else {
            // Update if exists
            $user->update([
                'user_type' => 'company_user',
                'company_code' => 'MAL001',
                'section_code' => 'MAL-SEC-001', // Delivery section
                'is_active' => true,
            ]);
            echo "User malibo@example.com updated to company_user.\n";
        }
    }
}