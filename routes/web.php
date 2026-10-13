<?php
use App\Http\Controllers\CompanyAuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Reports\StockInHandReportController;
use App\Http\Controllers\Reports\PrinterStockReportController;
use App\Http\Controllers\Reports\CollectionReportController;
use App\Http\Controllers\Reports\ItemListReportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\AccMas;

Route::middleware(['auth:web,company', 'verified'])->group(function () {
    Route::post('customers', [CustomerController::class, 'store'])
        ->name('customers.store');
});
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth:web,company', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        if (auth()->guard('company')->check()) {
            return redirect()->route('company.dashboard');
        }
        return Inertia::render('dashboard');
    })->name('dashboard');
});


Route::middleware('guest:company')->group(function () {
    Route::get('company/login', [CompanyAuthController::class, 'create'])->name('company.login');
    Route::post('company/login', [CompanyAuthController::class, 'store']);
});

Route::middleware([])->group(function () {
    Route::get('company/dashboard', function () {
        return Inertia::render('company-dashboard');
    })->name('company.dashboard');

    Route::resource('sections', \App\Http\Controllers\SectionController::class);
    
    Route::post('company/logout', [CompanyAuthController::class, 'destroy'])->name('company.logout');
});

Route::middleware(['auth:web,company'])->group(function () {
    Route::get('company/profile', [\App\Http\Controllers\CompanyProfileController::class, 'show'])->name('company.profile');
    Route::put('company/profile', [\App\Http\Controllers\CompanyProfileController::class, 'update'])->name('company.profile.update');

    Route::get('company/vat-rates', [\App\Http\Controllers\VatRateController::class, 'index'])->name('company.vat-rates.index');
    Route::post('company/vat-rates', [\App\Http\Controllers\VatRateController::class, 'store'])->name('company.vat-rates.store');
    // Route::get('company/vat-rates/{vat_rate}', [\App\Http\Controllers\VatRateController::class, 'show'])->name('company.vat-rates.show');
    Route::put('company/vat-rates/{vatRate}', [\App\Http\Controllers\VatRateController::class, 'update'])->name('company.vat-rates.update');
    Route::delete('company/vat-rates/{vatRate}', [\App\Http\Controllers\VatRateController::class, 'destroy'])->name('company.vat-rates.destroy');

    Route::get('api/company-data', function() {
        return \App\Models\Company::first();
    });

    Route::get('/user-management', function () {
        return Inertia::render('user-management');
    })->name('user-management');

    // Admin routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('controller-master', \App\Http\Controllers\Admin\ControllerMasterController::class);
        Route::post('controller-master/{controlMaster}/toggle', [\App\Http\Controllers\Admin\ControllerMasterController::class, 'toggle'])->name('controller-master.toggle');
        
        Route::resource('code-master', \App\Http\Controllers\Admin\CodeMasterController::class);
        Route::post('code-master/{codeMaster}/toggle', [\App\Http\Controllers\Admin\CodeMasterController::class, 'toggle'])->name('code-master.toggle');

        // Customer Routes
        Route::resource('customers', \App\Http\Controllers\Admin\CustomerController::class);
        Route::post('customers/{customer}/toggle', [\App\Http\Controllers\Admin\CustomerController::class, 'toggle'])->name('customers.toggle');

        // Customer Payment Routes
        Route::get('customer-payments', [\App\Http\Controllers\Admin\CustomerController::class, 'paymentsIndex'])->name('customer-payments.index');
        Route::post('customer-payments', [\App\Http\Controllers\Admin\CustomerController::class, 'storePayment'])->name('customer-payments.store');
        Route::get('customer-payments/search-customers', [\App\Http\Controllers\Admin\CustomerController::class, 'searchCustomers'])->name('customer-payments.search-customers');
        Route::get('customer-payments/{customer}/outstanding', [\App\Http\Controllers\Admin\CustomerController::class, 'getOutstandingBalance'])->name('customer-payments.outstanding');

        Route::get('customer-payments/pending-invoices', [\App\Http\Controllers\Admin\CustomerPaymentController::class, 'getPendingInvoices'])->name('customer-payments.pending-invoices');
        Route::get('customer-payments/{customerPayment}/receipt', [\App\Http\Controllers\Admin\CustomerPaymentController::class, 'generateReceipt'])->name('customer-payments.receipt');
        Route::resource('customer-payments', \App\Http\Controllers\Admin\CustomerPaymentController::class);

        

        // Bank Account Routes
        Route::resource('bank-accounts', \App\Http\Controllers\Admin\BankAccountController::class);
    });

    // Role and Permission Routes
    Route::resource('roles', \App\Http\Controllers\RoleController::class);
    Route::resource('permissions', \App\Http\Controllers\PermissionController::class);

    // API routes for user management
    Route::prefix('api')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('user-roles', [UserRoleController::class, 'index']);
        Route::get('sections', [SectionController::class, 'apiIndex']);
        Route::get('companies', [CompanyController::class, 'index']);
    });



    

    // Customer routes
    Route::resource('customers', CustomerController::class);
    Route::get('/customers/search', [CustomerController::class, 'search'])->name('customers.search');

    

    // Reports routes
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('stock-in-hand', [StockInHandReportController::class, 'index'])->name('stock-in-hand.index');
        Route::get('stock-in-hand/download', [StockInHandReportController::class, 'generateReport'])->name('stock-in-hand.download');
        
        // Printer Stock Report
        Route::get('printer-stock', [PrinterStockReportController::class, 'index'])->name('printer-stock.index');
        Route::get('printer-stock/download', [PrinterStockReportController::class, 'generateReport'])->name('printer-stock.download');

        



        // Customer and Supplier Details Reports
        Route::get('customer-details', function () {
            $company = null;
            if (auth('company')->check()) {
                $company = auth('company')->user();
            } else {
                $user = auth('web')->user();
                $company = $user ? $user->company : \App\Models\Company::first();
            }

            // Ensure company is not null, use default if needed
            if (!$company) {
                $company = (object) [
                    'company_code' => 'C01',
                    'name' => 'VISION COPIER',
                    'primary_color' => '#00aeef',
                    'secondary_color' => '#737578'
                ];
            }

            $customers = \App\Models\Customer::where('company_code', $company->company_code ?? 'C01')
                ->whereHas('account', function ($q) {
                    $q->where('AccTyp', 'CUSTOMER');
                })
                ->when(request('from_date'), function ($query) {
                    return $query->whereDate('created_at', '>=', request('from_date'));
                })
                ->when(request('to_date'), function ($query) {
                    return $query->whereDate('created_at', '<=', request('to_date'));
                })
                ->when(request('customer_type') && request('customer_type') !== 'all', function ($query) {
                    $typeMap = [
                        'individual' => 1,
                        'business' => 2,
                        'corporate' => 3,
                    ];
                    $typeId = $typeMap[request('customer_type')] ?? null;
                    if ($typeId) {
                        return $query->where('AdrTypKy', $typeId);
                    }
                    return $query;
                })
                ->orderBy('AdrCd')
                ->get();

            return Inertia::render('Reports/CustomerDetails', [
                'customers' => $customers,
                'company' => $company,
            ]);
        })->name('customer-details');
        
        // Customer Ledger Card
        Route::get('customer-ledger', function () {
            $company = null;
            if (auth('company')->check()) {
                $company = auth('company')->user();
            } else {
                $user = auth('web')->user();
                $company = $user ? $user->company : \App\Models\Company::first();
            }

            if (!$company) {
                $company = (object) [
                    'company_code' => 'C01',
                    'name' => 'VISION COPIER',
                    'primary_color' => '#00aeef',
                    'secondary_color' => '#737578'
                ];
            }

            $customers = \App\Models\Address::where('company_code', $company->company_code ?? 'C01')
                ->whereHas('accMas', function ($q) {
                    $q->where('AccTyp', 'CUSTOMER');
                })
                ->with(['accMas', 'section'])
                ->orderBy('FstNm')
                ->get();

            $sections = \App\Models\Section::where('company_code', $company->company_code ?? 'C01')->get();

            $data = [
                'customers' => $customers,
                'company' => $company,
                'sections' => $sections,
            ];

            // If customer is selected, fetch transactions
            if (request('customer_id')) {
                $customer = \App\Models\Address::where('AdrCd', request('customer_id'))
                    ->with(['accMas', 'section'])
                    ->first();
                
                if ($customer) {
                    $fromDate = request('from_date') ? \Carbon\Carbon::parse(request('from_date')) : \Carbon\Carbon::now()->subMonths(3);
                    $toDate = request('to_date') ? \Carbon\Carbon::parse(request('to_date')) : \Carbon\Carbon::now();

                    // Sales table dropped
                    $salesBeforeDate = 0;
                    
                    $paymentsBeforeDate = \App\Models\CustomerPayment::where('customer_id', $customer->AdrKy)
                        ->where('date', '<', $fromDate)
                        ->sum('amount');
                    
                    $openingBalance = $salesBeforeDate - $paymentsBeforeDate;

                    // Sales transactions for the period
                    $sales = collect([]);

                    // Get payment transactions for the period
                    $payments = \App\Models\CustomerPayment::where('customer_id', $customer->AdrKy)
                        ->whereBetween('date', [$fromDate, $toDate])
                        ->get()
                        ->map(function($payment) {
                            $description = 'Payment';
                            if ($payment->method) {
                                $description .= ' - ' . ucfirst($payment->method);
                            }
                            if ($payment->cheque_no) {
                                $description .= ' (Cheque: ' . $payment->cheque_no . ')';
                            }
                            return [
                                'date' => $payment->date,
                                'type' => 'payment',
                                'description' => $description,
                                'invoice_no' => $payment->reference ?? '-',
                                'debit' => 0,
                                'credit' => $payment->amount,
                            ];
                        });

                    // Merge and sort all transactions by date
                    $allTransactions = $sales->concat($payments)->sortBy('date')->values();

                    $balance = $openingBalance;
                    $ledgerTransactions = [];

                    foreach ($allTransactions as $index => $trn) {
                        $balance += $trn['debit'] - $trn['credit'];

                        $ledgerTransactions[] = [
                            'id' => $index + 1,
                            'date' => $trn['date'],
                            'description' => $trn['description'],
                            'invoice_no' => $trn['invoice_no'],
                            'debit' => $trn['debit'],
                            'credit' => $trn['credit'],
                            'balance' => $balance,
                        ];
                    }

                    $data['selectedCustomer'] = $customer;
                    $data['transactions'] = $ledgerTransactions;
                    $data['fromDate'] = $fromDate->format('Y-m-d');
                    $data['toDate'] = $toDate->format('Y-m-d');
                    $data['openingBalance'] = $openingBalance;
                    $data['closingBalance'] = $balance;
                }
            }

            return Inertia::render('Reports/CustomerLedger', $data);
        })->name('customer-ledger');
        
        Route::get('stock-bin-card', function () {
            $company = null;
            if (auth('company')->check()) {
                $company = auth('company')->user();
            } else {
                $user = auth('web')->user();
                $company = $user ? $user->company : \App\Models\Company::first();
            }

            if (!$company) {
                $company = (object) [
                    'company_code' => 'C01',
                    'name' => 'VISION COPIER',
                    'primary_color' => '#00aeef',
                    'secondary_color' => '#737578'
                ];
            }

            $items = \App\Models\ItemMaster::where('company_code', $company->company_code ?? 'C01')
                ->orderBy('ItmNm')
                ->get();

            $sections = \App\Models\Section::where('company_code', $company->company_code ?? 'C01')->get();

            $data = [
                'items' => $items,
                'company' => $company,
                'sections' => $sections,
            ];

            // If item is selected, fetch transactions
            if (request('item_code')) {
                $item = \App\Models\ItemMaster::where('ItemCode', request('item_code'))->first();
                
                if ($item) {
                    $fromDate = request('from_date') ? \Carbon\Carbon::parse(request('from_date')) : \Carbon\Carbon::now()->subMonths(3);
                    $toDate = request('to_date') ? \Carbon\Carbon::parse(request('to_date')) : \Carbon\Carbon::now();

                    // Purchases and sales tables dropped
                    $purchasesBeforeDate = 0;
                    $salesBeforeDate = 0;
                    
                    // Get wastages before date (they have negative Qty in stock_in_hand)
                    $wastagesBeforeDate = \App\Models\StockInHand::where('ItemKy', $item->ItmKy)
                        ->where('TrnTyp', 'WASTAGE')
                        ->where('OrdDate', '<', $fromDate)
                        ->sum('Qty'); // This will be negative, so we add it (which subtracts from balance)
                    
                    // Get supplier returns before date (they affect opening balance)
                    $supplierReturnsBeforeDate = \App\Models\StockInHand::where('ItemKy', $item->ItmKy)
                        ->whereIn('TrnTyp', ['SRET-OUT', 'SRET-IN'])
                        ->where('OrdDate', '<', $fromDate)
                        ->sum('Qty'); // SRET-OUT is negative (reduces stock), SRET-IN is positive (restores stock)
                    
                    $openingBalance = $purchasesBeforeDate - $salesBeforeDate + $wastagesBeforeDate + $supplierReturnsBeforeDate;

                    // Purchases and sales transactions for the period (tables dropped)
                    $purchases = collect([]);
                    $sales = collect([]);

                    // Get wastage transactions from stock_in_hand table (issues)
                    $wastages = \App\Models\StockInHand::where('ItemKy', $item->ItmKy)
                        ->where('TrnTyp', 'WASTAGE')
                        ->whereBetween('OrdDate', [$fromDate, $toDate])
                        ->get()
                        ->map(function($wastageStock) {
                            // Wastage has negative Qty, so we get absolute value for display
                            $issuedQty = abs(floatval($wastageStock->Qty));
                            $description = 'Wastage';
                            if ($wastageStock->batch_no) {
                                $description .= ' - Batch: ' . $wastageStock->batch_no;
                            }
                            if ($wastageStock->serial_number) {
                                $description .= ' - SN: ' . $wastageStock->serial_number;
                            }
                            
                            return [
                                'date' => $wastageStock->OrdDate,
                                'type' => 'wastage',
                                'description' => $description,
                                'reference' => 'WST-' . $wastageStock->TableKy,
                                'received' => 0,
                                'issued' => $issuedQty,
                            ];
                        });

                    // Get wastage restoration transactions from stock_in_hand table (receipts)
                    $wastageRestorations = \App\Models\StockInHand::where('ItemKy', $item->ItmKy)
                        ->where('TrnTyp', 'WST_RESTO')
                        ->whereBetween('OrdDate', [$fromDate, $toDate])
                        ->get()
                        ->map(function($restorationStock) {
                            // Restoration has positive Qty
                            $receivedQty = floatval($restorationStock->Qty);
                            $description = 'Wastage Restored';
                            if ($restorationStock->batch_no) {
                                $description .= ' - Batch: ' . $restorationStock->batch_no;
                            }
                            if ($restorationStock->serial_number) {
                                $description .= ' - SN: ' . $restorationStock->serial_number;
                            }
                            
                            return [
                                'date' => $restorationStock->OrdDate,
                                'type' => 'wastage_restoration',
                                'description' => $description,
                                'reference' => 'WST-REST-' . $restorationStock->TableKy,
                                'received' => $receivedQty,
                                'issued' => 0,
                            ];
                        });

                    // Get supplier return transactions from stock_in_hand table
                    $supplierReturns = \App\Models\StockInHand::where('ItemKy', $item->ItmKy)
                        ->whereIn('TrnTyp', ['SRET-OUT', 'SRET-IN'])
                        ->whereBetween('OrdDate', [$fromDate, $toDate])
                        ->get()
                        ->map(function($returnStock) {
                            $qty = floatval($returnStock->Qty);
                            $isCancellation = $returnStock->TrnTyp === 'SRET-IN';
                            
                            $description = $isCancellation ? 'Supplier Return Cancelled' : 'Supplier Return';
                            if ($returnStock->batch_no) {
                                $description .= ' - Batch: ' . $returnStock->batch_no;
                            }
                            if ($returnStock->serial_number) {
                                $description .= ' - SN: ' . $returnStock->serial_number;
                            }
                            
                            return [
                                'date' => $returnStock->OrdDate,
                                'type' => $isCancellation ? 'supplier_return_cancel' : 'supplier_return',
                                'description' => $description,
                                'reference' => $returnStock->RefNo,
                                'received' => $isCancellation ? abs($qty) : 0,
                                'issued' => $isCancellation ? 0 : abs($qty),
                            ];
                        });

                    // Merge and sort all transactions by date
                    $allTransactions = $purchases->concat($sales)->concat($wastages)->concat($wastageRestorations)->concat($supplierReturns)->sortBy('date')->values();

                    $balance = $openingBalance;
                    $stockTransactions = [];

                    foreach ($allTransactions as $index => $trn) {
                        $balance += $trn['received'] - $trn['issued'];

                        $stockTransactions[] = [
                            'id' => $index + 1,
                            'date' => $trn['date'],
                            'description' => $trn['description'],
                            'reference' => $trn['reference'],
                            'received' => $trn['received'],
                            'issued' => $trn['issued'],
                            'balance' => $balance,
                        ];
                    }

                    $data['selectedItem'] = $item;
                    $data['transactions'] = $stockTransactions;
                    $data['fromDate'] = $fromDate->format('Y-m-d');
                    $data['toDate'] = $toDate->format('Y-m-d');
                    $data['openingBalance'] = $openingBalance;
                    $data['closingBalance'] = $balance;
                }
            }

            return Inertia::render('Reports/StockBinCard', $data);
        })->name('stock-bin-card');

        // Collection Report
        Route::get('collection-report', [CollectionReportController::class, 'index'])->name('collection-report');

        // Item List Report
        Route::get('item-list', [ItemListReportController::class, 'index'])->name('item-list');

        Route::get('stock-in-hand/chart-data/{itemId}', [StockInHandReportController::class, 'getStockChartData'])->name('stock-in-hand.chart-data');
        Route::get('stock-in-hand/sales-chart-data/{itemId}', [StockInHandReportController::class, 'getSalesChartData'])->name('stock-in-hand.sales-chart-data');
        Route::get('stock-charts', [StockInHandReportController::class, 'charts'])->name('stock-charts');
        Route::get('sales-history', [StockInHandReportController::class, 'salesHistory'])->name('sales-history');
        Route::get('sales-history-data', [StockInHandReportController::class, 'getSalesHistory'])->name('sales-history-data');
        Route::get('item-sales-transactions/{itemId}', [StockInHandReportController::class, 'getItemSalesTransactions'])->name('item-sales-transactions');
    });

require __DIR__.'/settings.php';
