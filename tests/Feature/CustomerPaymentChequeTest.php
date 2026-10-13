<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\CustomerPayment;
use App\Models\AccMas;
use App\Models\AccTrn;
use App\Models\Address;
use App\Models\User;
use App\Models\Company;

uses(RefreshDatabase::class);

test('cheque payment saves correctly in customer_payments and acc_mas', function () {
    // Create a company and user for authentication
    $company = Company::create([
        'name' => 'Test Company',
        'company_code' => 'COMP001',
        'email' => 'company@example.com',
        'password' => bcrypt('password'),
    ]);

    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
        'company_code' => 'COMP001',
        'role_id' => 1, // superadmin
    ]);

    // Create test data
    $accMas = AccMas::create([
        'AccKy' => 1,
        'AccCd' => 'CUS001',
        'AccNm' => 'Test Customer',
        'CurBal' => 1000.00, // Initial balance
        'company_code' => 'COMP001',
        'section_code' => 'SEC001',
    ]);

    $address = Address::create([
        'AdrKy' => 1,
        'AccKy' => 1,
        'AdrCd' => 'CUS001',
        'FstNm' => 'John',
        'LstNm' => 'Doe',
    ]);

    // Authenticate the user
    $this->actingAs($user);

    // Simulate POST request to store payment
    $response = $this->post('/admin/customer-payments', [
        'AccKy' => 1,
        'amount' => 500.00,
        'TrnDt' => '2023-10-01',
        'method' => 'cheque',
        'ChqueNo' => '123456',
        'BankNm' => 'Test Bank',
        'ChqueBranch' => 'Main Branch',
        'ChqueDt' => '2023-10-01',
        'notes' => 'Test cheque payment',
    ]);

    $response->assertRedirect();

    // Check CustomerPayment table
    expect(DB::table('customer_payments')->where([
        'customer_id' => 1,
        'customer_code' => 'CUS001',
        'amount' => 500.00,
        'date' => '2023-10-01',
        'method' => 'cheque',
        'cheque_no' => '123456',
        'bank_name' => 'Test Bank',
        'branch' => 'Main Branch',
        'cheque_date' => '2023-10-01',
        'notes' => 'Test cheque payment',
        'status' => 'completed',
    ])->exists())->toBeTrue();

    // Check AccMas CurBal updated
    $updatedAccMas = AccMas::find(1);
    expect((float)$updatedAccMas->CurBal)->toBe(500.00); // 1000 - 500

    // Check AccTrn created
    $payment = CustomerPayment::first();
    $accTrn = DB::table('acc_trn')->where([
        'AccKy' => 1,
        'TrnDt' => '2023-10-01 00:00:00',
        'Amt' => -500,
        'VaucherNo' => null,
        'ChqueNo' => '123456',
        'BankNm' => 'Test Bank',
        'BranchNm' => null,
        'Dec' => 'Test cheque payment',
        'FInAct' => 1,
        'Status' => 'A',
        'company_code' => 'COMP001',
        'section_code' => 'SEC001',
        'customer_code' => 'CUS001',
        'customer_name' => 'Test Customer',
        'original_payment_id' => null,
    ])->first();
    
    expect($accTrn)->not->toBeNull();
    expect($accTrn->TrnNo)->toStartWith('CPY-');
});