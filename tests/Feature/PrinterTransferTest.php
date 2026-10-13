<?php

use App\Models\Company;
use App\Models\Section;
use App\Models\StockInHand;
use App\Models\StockTransfer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('can display printer transfers index page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('printer-transfers.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('PrinterTransfer/Index')
        ->has('stockTransfers')
    );
});

it('can display create printer transfer page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('printer-transfers.create'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('PrinterTransfer/Create')
        ->has('sections')
    );
});

it('can search printers', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $section = Section::factory()->create(['company_code' => $company->company_code]);
    $user->update(['company_code' => $company->company_code]);

    // Create some stock with printers
    StockInHand::factory()->create([
        'company_code' => $company->company_code,
        'section_code' => $section->section_code,
        'serial_number' => 'TEST123',
        'brand' => 'Test Brand',
        'model' => 'Test Model',
        'Qty' => 1,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('printer-transfers.search-printers', [
        'from_section_code' => $section->section_code,
        'serial_number' => 'TEST123'
    ]));

    $response->assertStatus(200);
    $response->assertJsonStructure([
        '*' => [
            'id',
            'item' => [
                'ItmKy',
                'ItemCode',
                'ItmNm'
            ],
            'brand',
            'model',
            'serial_number',
            'qty',
            'section_code'
        ]
    ]);
});

it('can get section trf in stock', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $section = Section::factory()->create(['company_code' => $company->company_code]);
    $user->update(['company_code' => $company->company_code]);

    // Create a purchase record first
    $purchaseId = DB::table('purchase')->insertGetId([
        'company_code' => $company->company_code,
        'section_code' => $section->section_code,
        'PurchaseKey' => 1,
        'PurchaseNo' => 1,
        'type' => 'supplier',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Create 7 different printers (each with unique serial number)
    for ($i = 1; $i <= 7; $i++) {
        $serialNumber = 'TEST' . str_pad($i, 3, '0', STR_PAD_LEFT);
        
        // Create stock in the section (with serial number to identify as printer)
        $stock = StockInHand::factory()->create([
            'company_code' => $company->company_code,
            'section_code' => $section->section_code,
            'serial_number' => $serialNumber,
            'batch_no' => 'BATCH001',
            'Qty' => 1,
            'FreeQty' => 0,
        ]);

        // Create matching purchase_det record for complete printer information
        DB::table('purchase_det')->insert([
            'company_code' => $company->company_code,
            'section_code' => $section->section_code,
            'PerchaseDetKy' => $i,
            'PurchaseKey' => $purchaseId,
            'iTimKy' => $stock->ItemKy,
            'serial_number' => $serialNumber,
            'batch_no' => 'BATCH001',
            'brand' => 'Test Brand',
            'model' => 'Test Model',
            'warranty' => '1 year',
            'Qty' => 1,
        ]);
    }

    $this->actingAs($user);

    $response = $this->get(route('printer-transfers.section-trf-in-stock', [
        'section_code' => $section->section_code
    ]));

    $response->assertStatus(200);
    $response->assertJson([
        'section_code' => $section->section_code,
        'total_trf_in_stock' => 7, // 7 unique printers
    ]);
});

it('can create printer transfer', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $fromSection = Section::factory()->create(['company_code' => $company->company_code]);
    $toSection = Section::factory()->create(['company_code' => $company->company_code]);
    $user->update(['company_code' => $company->company_code]);

    $stock = StockInHand::factory()->create([
        'company_code' => $company->company_code,
        'section_code' => $fromSection->section_code,
        'serial_number' => 'TRANSFER123',
        'Qty' => 2,
    ]);

    $this->actingAs($user);

    $transferData = [
        'from_section_code' => $fromSection->section_code,
        'to_section_code' => $toSection->section_code,
        'stock_transfers' => [
            [
                'stock_id' => $stock->TableKy,
                'quantity' => 1,
                'serial_number' => 'TRANSFER123',
                'brand' => 'Test Brand',
                'model' => 'Test Model',
            ]
        ],
        'transfer_date' => now()->format('Y-m-d'),
        'notes' => 'Test transfer',
    ];

    $response = $this->post(route('printer-transfers.store'), $transferData);

    $response->assertRedirect(route('printer-transfers.index'));
    $this->assertDatabaseHas('stock_transfers', [
        'from_section_code' => $fromSection->section_code,
        'to_section_code' => $toSection->section_code,
        'quantity' => 1,
        'company_code' => $company->company_code,
    ]);
});

it('validates printer transfer data', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post(route('printer-transfers.store'), []);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['from_section_code', 'to_section_code', 'stock_transfers']);
});

it('can preview pdf', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $fromSection = Section::factory()->create(['company_code' => $company->company_code]);
    $toSection = Section::factory()->create(['company_code' => $company->company_code]);
    $user->update(['company_code' => $company->company_code]);

    $stock = StockInHand::factory()->create([
        'company_code' => $company->company_code,
        'section_code' => $fromSection->section_code,
        'serial_number' => 'PDF123',
        'Qty' => 1,
    ]);

    $this->actingAs($user);

    $pdfData = [
        'from_section_code' => $fromSection->section_code,
        'to_section_code' => $toSection->section_code,
        'transfer_date' => now()->format('Y-m-d'),
        'notes' => 'PDF Preview Test',
        'stock_transfers' => [
            [
                'stock_id' => $stock->TableKy,
                'quantity' => 1,
                'serial_number' => 'PDF123',
            ]
        ],
    ];

    $response = $this->post(route('printer-transfers.preview-pdf'), $pdfData);

    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'application/pdf');
});