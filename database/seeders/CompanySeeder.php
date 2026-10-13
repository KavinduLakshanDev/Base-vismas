<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Section;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Main Company: Vismass
        $vismass = Company::firstOrCreate(
            ['company_code' => 'VIS001'],
            [
                'name' => 'Vismass',
                'contact_person_name' => 'John Doe',
                'contact_person_number' => '0771234567',
                'email' => 'vismass@example.com',
                'password' => 'password', // Will be hashed by model cast
                'phone' => '0112345678',
                'address' => '123, Main Street',
                'city' => 'Colombo',
                'state' => 'Western',
                'country' => 'Sri Lanka',
                'postal_code' => '10100',
                'tax_id' => 'TAX123',
                'vat_rate' => 18.00,
                'vat_no' => '123456789V',
                'vat_effective_date' => now(),
            ]
        );


        // Create MALIBO Company
        $malibo = Company::firstOrCreate(
            ['company_code' => 'MAL001'],
            [
                'name' => 'Malibo',
                'contact_person_name' => 'Jane Smith',
                'contact_person_number' => '0777654321',
                'email' => 'malibo@example.com',
                'password' => 'password', // Will be hashed by model cast
                'phone' => '0118765432',
                'address' => '456, Secondary Street',
                'city' => 'Colombo',
                'state' => 'Western',
                'country' => 'Sri Lanka',
                'postal_code' => '10200',
                'tax_id' => 'TAX456',
                'vat_rate' => 0.00, // No VAT for MALIBO
                'vat_no' => null,
                'vat_effective_date' => null,
            ]
        );
    }
}
