<?php
use App\Http\Controllers\CompanyAuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\DeliveryRouteController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Reports\StockInHandReportController;
use App\Http\Controllers\Reports\PrinterStockReportController;
use App\Http\Controllers\Reports\CollectionReportController;
use App\Http\Controllers\Reports\ItemListReportController;
use App\Http\Controllers\Reports\WastageReportController;
use App\Http\Controllers\Reports\SalesReportController;
use App\Http\Controllers\Reports\PurchaseOrderReportController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\PrinterTransferController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\POS\ChequeReturnController;
use App\Http\Controllers\ServiceJobController;
use App\Http\Controllers\SalesController;
use App\Models\AccMas;

// Group for Service Jobs and related search routes
Route::middleware(['auth:web,company', 'verified'])->group(function () {
    // Sales Routes
    Route::get('sales/search/customers', [SalesController::class, 'searchCustomers'])->name('sales.search-customers');
    Route::get('sales/search/items', [SalesController::class, 'searchItems'])->name('sales.search-items');
    Route::get('sales/search/printers', [SalesController::class, 'searchPrinters'])->name('sales.search-printers');
    Route::resource('sales', SalesController::class);
    Route::get('sales/{sale}/receipt', [SalesController::class, 'generateReceipt'])->name('sales.receipt');
    Route::get('sales/{sale}/invoice', [SalesController::class, 'generateInvoice'])->name('sales.invoice');
    Route::post('sales/preview-receipt', [SalesController::class, 'previewReceipt'])->name('sales.preview-receipt');

    // Service Jobs Specific Routes (MUST come before resource)
    Route::get('service-jobs/history', [ServiceJobController::class, 'history'])->name('service-jobs.history');
    Route::get('service-jobs/search/customers', [ServiceJobController::class, 'searchCustomers'])
        ->name('service-jobs.search-customers');
    
    Route::get('service-jobs/search/items', [ServiceJobController::class, 'searchItems'])
        ->name('service-jobs.search-items');
    
    Route::get('service-jobs/customer-details/{customer}', [ServiceJobController::class, 'getCustomerDetails'])
        ->name('service-jobs.get-customer-details');
    
    Route::get('service-jobs/get-customer-by-device', [ServiceJobController::class, 'getCustomerByDevice'])
        ->name('service-jobs.get-customer-by-device');

    // Main Resource Route
    Route::resource('service-jobs', ServiceJobController::class);
    
    // Additional Member Routes
    Route::post('service-jobs/{service_job}/add-item', [ServiceJobController::class, 'addItem'])
        ->name('service-jobs.add-item');
    
    Route::delete('service-jobs/{service_job}/items/{item}', [ServiceJobController::class, 'removeItem'])
        ->name('service-jobs.remove-item');
    
    Route::post('service-jobs/{service_job}/update-status', [ServiceJobController::class, 'updateStatus'])
        ->name('service-jobs.update-status');

    Route::get('service-jobs/{service_job}/invoice', [ServiceJobController::class, 'generateInvoice'])
        ->name('service-jobs.invoice');
    
    Route::get('service-jobs/{service_job}/receipt', [ServiceJobController::class, 'generateReceipt'])
        ->name('service-jobs.receipt');
    
    // Quotation Routes
    Route::get('quotations', [ServiceJobController::class, 'quotationsIndex'])
        ->name('quotations.index');
    
    Route::get('quotations/{quotation}', [ServiceJobController::class, 'viewQuotation'])
        ->name('quotations.show');
    
    Route::get('service-jobs/{service_job}/quotations/create', [ServiceJobController::class, 'createQuotationPage'])
        ->name('quotations.create');
    
    Route::post('quotations', [ServiceJobController::class, 'createQuotation'])
        ->name('quotations.store');
    
    Route::get('quotations/{quotation}/edit', [ServiceJobController::class, 'editQuotation'])
        ->name('quotations.edit');
    
    Route::put('quotations/{quotation}', [ServiceJobController::class, 'updateQuotation'])
        ->name('quotations.update');
    
    Route::prefix('api')->group(function () {
        Route::get('device-serial-numbers', [ServiceJobController::class, 'getDeviceSerialNumbers']);
        Route::get('device-details', [ServiceJobController::class, 'getDeviceDetails']);
    });
    
    // Customer routes (often needed in the same context)
    Route::post('customers', [CustomerController::class, 'store'])
        ->name('customers.store');

    // Privilege System Routes (Moved from api.php to use web session)
    Route::prefix('api')->group(function () {
        Route::post('privilege-users/search', [\App\Http\Controllers\Api\PrivilegeUserController::class, 'search']);
        Route::post('privilege-points/generate', [\App\Http\Controllers\TempPrivilegePointController::class, 'store']);
        Route::post('privilege-points/redeem', [\App\Http\Controllers\TempPrivilegePointController::class, 'redeemPoints']);
        Route::post('privilege-points/redeem-permanent', [\App\Http\Controllers\TempPrivilegePointController::class, 'redeemPointsToPermanent']);
        Route::post('privilege-points/transfer', [\App\Http\Controllers\TempPrivilegePointController::class, 'transferToPermanentPoints']);
        Route::get('privilege-points/transaction-number', [\App\Http\Controllers\TempPrivilegePointController::class, 'generateTransactionNumber']);

    });
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

    Route::get('api/points-rule', [\App\Http\Controllers\Api\PointsRuleController::class, 'getCurrentUserPointsRule']);

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



        // Privilege User Routes
        Route::resource('privilege-users', \App\Http\Controllers\Admin\PrivilegeUserController::class);
        Route::post('privilege-users/{privilegeUser}/toggle', [\App\Http\Controllers\Admin\PrivilegeUserController::class, 'toggle'])->name('privilege-users.toggle');
        Route::get('privilege-users/search/sections', [\App\Http\Controllers\Admin\PrivilegeUserController::class, 'search'])->name('privilege-users.search');
        Route::post('privilege-users/send-otp', [\App\Http\Controllers\Admin\PrivilegeUserController::class, 'sendOtp'])->name('privilege-users.send-otp');
        Route::post('privilege-users/verify-otp', [\App\Http\Controllers\Admin\PrivilegeUserController::class, 'verifyOtp'])->name('privilege-users.verify-otp');

        // Customer Payment Routes
        Route::get('customer-payments/pending-service-jobs', [\App\Http\Controllers\Admin\CustomerPaymentController::class, 'getPendingServiceJobs'])->name('customer-payments.pending-service-jobs');
        Route::get('customer-payments/pending-invoices', [\App\Http\Controllers\Admin\CustomerPaymentController::class, 'getPendingInvoices'])->name('customer-payments.pending-invoices');
        Route::get('customer-payments/{customerPayment}/receipt', [\App\Http\Controllers\Admin\CustomerPaymentController::class, 'generateReceipt'])->name('customer-payments.receipt');
        Route::resource('customer-payments', \App\Http\Controllers\Admin\CustomerPaymentController::class);

        // Supplier Payment Routes
        Route::get('supplier-payments/search-suppliers', [\App\Http\Controllers\Admin\SupplierPaymentController::class, 'searchSuppliers'])->name('supplier-payments.search-suppliers');
        Route::get('supplier-details', [\App\Http\Controllers\Admin\SupplierPaymentController::class, 'getSupplierDetails'])->name('supplier-details');
        Route::get('supplier-payments/{supplierPayment}/receipt', [\App\Http\Controllers\Admin\SupplierPaymentController::class, 'generateReceipt'])->name('supplier-payments.receipt');
        Route::resource('supplier-payments', \App\Http\Controllers\Admin\SupplierPaymentController::class)->only(['index', 'store', 'destroy']);

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

    // POS routes
    Route::middleware(['auth:web,company', 'verified'])->prefix('pos')->name('pos.')->group(function () {
        // API Routes - Map to ProductController for simple array response
        Route::get('api/categories', [\App\Http\Controllers\POS\ProductController::class, 'getCategories'])->name('api.categories');
        Route::get('api/units', [\App\Http\Controllers\POS\ProductController::class, 'getUnits'])->name('api.units');
        Route::get('api/price-history/{itemKey}', [\App\Http\Controllers\POS\ProductController::class, 'getPriceHistory'])->name('api.price-history');

        Route::resource('categories', \App\Http\Controllers\POS\CategoryController::class);
        Route::post('categories/{category}/toggle', [\App\Http\Controllers\POS\CategoryController::class, 'toggle'])->name('categories.toggle');
        Route::get('categories-api', [\App\Http\Controllers\POS\CategoryController::class, 'getCategories'])->name('categories.api');
        
        Route::resource('brands', \App\Http\Controllers\POS\BrandController::class);
        Route::post('brands/{brand}/toggle', [\App\Http\Controllers\POS\BrandController::class, 'toggle'])->name('brands.toggle');
        Route::get('brands-api', [\App\Http\Controllers\POS\BrandController::class, 'getBrands'])->name('brands.api');
        
        Route::resource('models', \App\Http\Controllers\POS\ModelController::class);
        Route::post('models/{model}/toggle', [\App\Http\Controllers\POS\ModelController::class, 'toggle'])->name('models.toggle');
        Route::get('models-api', [\App\Http\Controllers\POS\ModelController::class, 'getModels'])->name('models.api');
        
        Route::resource('units', \App\Http\Controllers\POS\UnitController::class);
        Route::post('units/{unit}/toggle', [\App\Http\Controllers\POS\UnitController::class, 'toggle'])->name('units.toggle');

        // Product specific routes - MUST be before resource route to avoid conflicts
        Route::post('products/{product}/toggle', [\App\Http\Controllers\POS\ProductController::class, 'toggle'])->name('products.toggle');
        Route::get('products/search', [\App\Http\Controllers\POS\ProductController::class, 'search'])->name('products.search');
        Route::get('products/get-item-details/{itemCode}', [\App\Http\Controllers\POS\ProductController::class, 'getItemDetails'])->name('products.get-item-details');
        Route::get('products/get-item-codes-with-category', [\App\Http\Controllers\POS\ProductController::class, 'getItemCodesWithCategory'])->name('products.get-item-codes-with-category');
        Route::get('products/get-suppliers', [\App\Http\Controllers\POS\ProductController::class, 'getSuppliers'])->name('products.get-suppliers');
        Route::get('products/get-categories', [\App\Http\Controllers\POS\ProductController::class, 'getCategories'])->name('products.get-categories');
        Route::get('products/get-units', [\App\Http\Controllers\POS\ProductController::class, 'getUnits'])->name('products.get-units');
        Route::get('products/get-items-for-selection', [\App\Http\Controllers\POS\ProductController::class, 'getItemsForSelection'])->name('products.get-items-for-selection');
        Route::get('products/get-price-history/{itemKey}', [\App\Http\Controllers\POS\ProductController::class, 'getPriceHistory'])->name('products.get-price-history');
        Route::get('products/get-items-for-list', [\App\Http\Controllers\POS\ProductController::class, 'getItemsForList'])->name('products.get-items-for-list');
        Route::get('products/get-item-with-discounts', [\App\Http\Controllers\POS\ProductController::class, 'getItemWithDiscounts'])->name('products.get-item-with-discounts');
        Route::delete('products/delete-price-history/{priceHistoryId}', [\App\Http\Controllers\POS\ProductController::class, 'deletePriceHistory'])->name('products.delete-price-history');
        
        // Item Search routes
        Route::get('items/search-by-code', [\App\Http\Controllers\POS\ItemSearchController::class, 'searchByItemCode'])->name('items.search-by-code');
        Route::get('items/search-by-name', [\App\Http\Controllers\POS\ItemSearchController::class, 'searchByItemName'])->name('items.search-by-name');
        Route::get('items/get-by-code', [\App\Http\Controllers\POS\ItemSearchController::class, 'getItemByCode'])->name('items.get-by-code');
        Route::get('items/get-prices', [\App\Http\Controllers\POS\ItemSearchController::class, 'getItemPrices'])->name('items.get-prices');
        Route::get('items/get-prices-for-modal', [\App\Http\Controllers\POS\ItemSearchController::class, 'getItemPricesForModal'])->name('items.get-prices-for-modal');
        Route::get('items/get-cc-price', [\App\Http\Controllers\POS\ItemSearchController::class, 'getCCPrice'])->name('items.get-cc-price');
        
        // Resource route MUST be last
        Route::resource('products', \App\Http\Controllers\POS\ProductController::class);

        // Purchase routes - API routes MUST come before resource routes
        Route::get('api/purchases/products-by-branch', [\App\Http\Controllers\POS\PurchaseController::class, 'getProductsByBranch'])->name('api.purchases.products-by-branch');
        Route::get('api/purchases/search-barcode', [\App\Http\Controllers\POS\PurchaseController::class, 'searchByBarcode'])->name('api.purchases.search-barcode');
        Route::get('purchases/{purchase}/download-pdf', [\App\Http\Controllers\POS\PurchaseController::class, 'downloadPdf'])->name('purchases.download-pdf');
        Route::get('printing-section-products', [\App\Http\Controllers\POS\PurchaseController::class, 'printingSectionProducts'])->name('printing-section-products');
        Route::resource('purchases', \App\Http\Controllers\POS\PurchaseController::class);

        // Cheque Return Routes
        Route::prefix('cheque-return')->name('cheque-return.')->group(function () {
            Route::get('/', [ChequeReturnController::class, 'index'])->name('index');
            Route::post('/search', [ChequeReturnController::class, 'searchCheque'])->name('search');
            Route::post('/process', [ChequeReturnController::class, 'returnCheque'])->name('process');
        });
    });

    // Delivery routes
    Route::prefix('deliveries')->name('delivery.')->group(function () {
        Route::get('/', [DeliveryController::class, 'index'])->name('index');
        Route::get('/create', [DeliveryController::class, 'create'])->name('create');
        Route::post('/', [DeliveryController::class, 'store'])->name('store');
        
        Route::prefix('routes')->name('routes.')->group(function () {
            Route::get('/', [DeliveryRouteController::class, 'index'])->name('index');
            Route::get('/create', [DeliveryRouteController::class, 'create'])->name('create');
            Route::post('/', [DeliveryRouteController::class, 'store'])->name('store');
            Route::get('/{route}', [DeliveryRouteController::class, 'show'])->name('show');
            Route::get('/{route}/edit', [DeliveryRouteController::class, 'edit'])->name('edit');
            Route::put('/{route}', [DeliveryRouteController::class, 'update'])->name('update');
            Route::delete('/{route}', [DeliveryRouteController::class, 'destroy'])->name('destroy');
        });
        
        Route::get('/{delivery}', [DeliveryController::class, 'show'])->name('show');
        Route::get('/{delivery}/edit', [DeliveryController::class, 'edit'])->name('edit');
        Route::put('/{delivery}', [DeliveryController::class, 'update'])->name('update');
        Route::patch('/{delivery}/status', [DeliveryController::class, 'updateStatus'])->name('update-status');
        Route::delete('/{delivery}', [DeliveryController::class, 'destroy'])->name('destroy');
    });

    // Customer routes
    Route::resource('customers', CustomerController::class);
    Route::get('/customers/search', [CustomerController::class, 'search'])->name('customers.search');

    // Supplier routes
    Route::resource('suppliers', SupplierController::class);
    Route::patch('suppliers/{id}/toggle-status', [SupplierController::class, 'toggleStatus'])->name('suppliers.toggle-status');

    // Reports routes
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('stock-in-hand', [StockInHandReportController::class, 'index'])->name('stock-in-hand.index');
        Route::get('stock-in-hand/download', [StockInHandReportController::class, 'generateReport'])->name('stock-in-hand.download');
        
        // Printer Stock Report
        Route::get('printer-stock', [PrinterStockReportController::class, 'index'])->name('printer-stock.index');
        Route::get('printer-stock/download', [PrinterStockReportController::class, 'generateReport'])->name('printer-stock.download');

        // Wastage Report
        Route::get('wastage', [WastageReportController::class, 'index'])->name('wastage.index');

        // Sales Report
        Route::get('sales', [SalesReportController::class, 'index'])->name('sales.index');
        Route::get('sales/pdf', [SalesReportController::class, 'pdf'])->name('sales.pdf');
        
        // Purchase Order Report
        Route::get('purchase-orders', [PurchaseOrderReportController::class, 'index'])->name('purchase-orders.index');
        Route::get('purchase-orders/pdf', [PurchaseOrderReportController::class, 'pdf'])->name('purchase-orders.pdf');

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

                    // Get opening balance - sum of sales minus payments before fromDate
                    $salesBeforeDate = \App\Models\SalesTransaction::where('customer_id', $customer->AdrKy)
                        ->where('transaction_date', '<', $fromDate)
                        ->sum('total_amount');
                    
                    $paymentsBeforeDate = \App\Models\CustomerPayment::where('customer_id', $customer->AdrKy)
                        ->where('date', '<', $fromDate)
                        ->sum('amount');
                    
                    $openingBalance = $salesBeforeDate - $paymentsBeforeDate;

                    // Get sales transactions for the period
                    $sales = \App\Models\SalesTransaction::where('customer_id', $customer->AdrKy)
                        ->whereBetween('transaction_date', [$fromDate, $toDate])
                        ->get()
                        ->map(function($sale) {
                            return [
                                'date' => $sale->transaction_date,
                                'type' => 'sale',
                                'description' => 'Sale - Invoice #' . $sale->invoice_no,
                                'invoice_no' => $sale->invoice_no,
                                'debit' => $sale->total_amount,
                                'credit' => 0,
                            ];
                        });

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
        
        Route::get('supplier-ledger', function () {
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

            $suppliers = \App\Models\Address::where('company_code', $company->company_code ?? 'C01')
                ->whereHas('accMas', function ($q) {
                    $q->where('AccTyp', 'SUPPLIER');
                })
                ->with(['accMas', 'section'])
                ->orderBy('FstNm')
                ->get();

            $sections = \App\Models\Section::where('company_code', $company->company_code ?? 'C01')->get();

            $data = [
                'suppliers' => $suppliers,
                'company' => $company,
                'sections' => $sections,
            ];

            // If supplier is selected, fetch transactions
            if (request('supplier_id')) {
                $supplier = \App\Models\Address::where('AdrCd', request('supplier_id'))
                    ->with(['accMas', 'section'])
                    ->first();
                
                if ($supplier) {
                    $fromDate = request('from_date') ? \Carbon\Carbon::parse(request('from_date')) : \Carbon\Carbon::now()->subMonths(3);
                    $toDate = request('to_date') ? \Carbon\Carbon::parse(request('to_date')) : \Carbon\Carbon::now();

                    // Get opening balance - sum of purchases minus payments before fromDate
                    $purchasesBeforeDate = \App\Models\Purchase::where('SuppCode', $supplier->AdrCd)
                        ->where('GRNDate', '<', $fromDate)
                        ->sum('TotalVal');
                    
                    $paymentsBeforeDate = \App\Models\SupplierPayment::where('supplier_code', $supplier->AdrCd)
                        ->where('payment_date', '<', $fromDate)
                        ->sum('paid_amount');
                    
                    $openingBalance = $purchasesBeforeDate - $paymentsBeforeDate;

                    // Get purchase transactions for the period
                    $purchases = \App\Models\Purchase::where('SuppCode', $supplier->AdrCd)
                        ->whereBetween('GRNDate', [$fromDate, $toDate])
                        ->get()
                        ->map(function($purchase) {
                            return [
                                'date' => $purchase->GRNDate,
                                'type' => 'purchase',
                                'description' => 'Purchase - GRN #' . $purchase->PurchaseNo,
                                'reference' => $purchase->SuppInvNo ?? 'GRN-' . $purchase->PurchaseNo,
                                'debit' => 0,
                                'credit' => $purchase->TotalVal,
                            ];
                        });

                    // Get payment transactions for the period
                    $payments = \App\Models\SupplierPayment::where('supplier_code', $supplier->AdrCd)
                        ->whereBetween('payment_date', [$fromDate, $toDate])
                        ->get()
                        ->map(function($payment) {
                            $description = 'Payment';
                            if ($payment->payment_method) {
                                $description .= ' - ' . ucfirst($payment->payment_method);
                            }
                            if ($payment->cheque_no) {
                                $description .= ' (Cheque: ' . $payment->cheque_no . ')';
                            }
                            return [
                                'date' => $payment->payment_date,
                                'type' => 'payment',
                                'description' => $description,
                                'reference' => $payment->payment_no ?? '-',
                                'debit' => $payment->paid_amount,
                                'credit' => 0,
                            ];
                        });

                    // Merge and sort all transactions by date
                    $allTransactions = $purchases->concat($payments)->sortBy('date')->values();

                    $balance = $openingBalance;
                    $ledgerTransactions = [];

                    foreach ($allTransactions as $index => $trn) {
                        $balance += $trn['credit'] - $trn['debit'];

                        $ledgerTransactions[] = [
                            'id' => $index + 1,
                            'date' => $trn['date'],
                            'description' => $trn['description'],
                            'reference' => $trn['reference'],
                            'debit' => $trn['debit'],
                            'credit' => $trn['credit'],
                            'balance' => $balance,
                        ];
                    }

                    $data['selectedSupplier'] = $supplier;
                    $data['transactions'] = $ledgerTransactions;
                    $data['fromDate'] = $fromDate->format('Y-m-d');
                    $data['toDate'] = $toDate->format('Y-m-d');
                    $data['openingBalance'] = $openingBalance;
                    $data['closingBalance'] = $balance;
                }
            }

            return Inertia::render('Reports/SupplierLedger', $data);
        })->name('supplier-ledger');
        
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

                    // Get opening balance - sum of purchases (Qty + Free) minus sales and wastages before fromDate
                    $purchasesBeforeDate = \App\Models\PurchaseDet::where('iTimKy', $item->ItmKy)
                        ->whereHas('purchase', function($q) use ($fromDate) {
                            $q->where('GRNDate', '<', $fromDate);
                        })
                        ->selectRaw('SUM(Qty + COALESCE(Free, 0)) as total_qty')
                        ->value('total_qty') ?? 0;
                    
                    $salesBeforeDate = \App\Models\SalesTransactionItem::where('item_code', $item->ItemCode)
                        ->whereHas('salesTransaction', function($q) use ($fromDate) {
                            $q->where('transaction_date', '<', $fromDate);
                        })
                        ->sum('quantity');
                    
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

                    // Get purchase transactions for the period (receipts) - include Free Qty
                    $purchases = \App\Models\PurchaseDet::where('iTimKy', $item->ItmKy)
                        ->whereHas('purchase', function($q) use ($fromDate, $toDate) {
                            $q->whereBetween('GRNDate', [$fromDate, $toDate]);
                        })
                        ->with('purchase')
                        ->get()
                        ->map(function($purchaseDet) {
                            $qty = floatval($purchaseDet->Qty);
                            $freeQty = floatval($purchaseDet->Free ?? 0);
                            $totalReceived = $qty + $freeQty;
                            
                            $description = 'Purchase - GRN #' . $purchaseDet->purchase->PurchaseNo;
                            if ($freeQty > 0) {
                                $description .= ' (Qty: ' . number_format($qty, 2) . ', Free: ' . number_format($freeQty, 2) . ')';
                            }
                            
                            return [
                                'date' => $purchaseDet->purchase->GRNDate,
                                'type' => 'purchase',
                                'description' => $description,
                                'reference' => $purchaseDet->purchase->SuppInvNo ?? 'GRN-' . $purchaseDet->purchase->PurchaseNo,
                                'received' => $totalReceived,
                                'issued' => 0,
                            ];
                        });

                    // Get sales transactions for the period (issues)
                    $sales = \App\Models\SalesTransactionItem::where('item_code', $item->ItemCode)
                        ->whereHas('salesTransaction', function($q) use ($fromDate, $toDate) {
                            $q->whereBetween('transaction_date', [$fromDate, $toDate]);
                        })
                        ->with('salesTransaction')
                        ->get()
                        ->map(function($saleItem) {
                            return [
                                'date' => $saleItem->salesTransaction->transaction_date,
                                'type' => 'sale',
                                'description' => 'Sale - Invoice #' . $saleItem->salesTransaction->invoice_no,
                                'reference' => $saleItem->salesTransaction->invoice_no,
                                'received' => 0,
                                'issued' => $saleItem->quantity,
                            ];
                        });

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
        
        Route::get('supplier-details', function () {
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

            // Get suppliers from address table - try different AdrTypKy values or get all non-customer addresses
            $suppliers = \App\Models\Address::where('company_code', $company->company_code ?? 'C01')
                ->where('AdrTypKy', '!=', 1) // Not customers
                ->whereNotNull('AdrTypKy')
                ->when(request('from_date'), function ($query) {
                    return $query->whereDate('created_at', '>=', request('from_date'));
                })
                ->when(request('to_date'), function ($query) {
                    return $query->whereDate('created_at', '<=', request('to_date'));
                })
                ->orderBy('AdrCd')
                ->get();

            // If no suppliers found with AdrTypKy != 1, try to get from acc_mas and match with addresses
            if ($suppliers->isEmpty()) {
                $supplierAccKeys = AccMas::where('AccTyp', 'SUPPLIER')
                    ->where('company_code', $company->company_code ?? 'C01')
                    ->pluck('AccKy');

                $suppliers = \App\Models\Address::whereIn('AccKy', $supplierAccKeys)
                    ->when(request('from_date'), function ($query) {
                        return $query->whereDate('created_at', '>=', request('from_date'));
                    })
                    ->when(request('to_date'), function ($query) {
                        return $query->whereDate('created_at', '<=', request('to_date'));
                    })
                    ->orderBy('AdrCd')
                    ->get();
            }

            return Inertia::render('Reports/SupplierDetails', [
                'suppliers' => $suppliers,
                'company' => $company
            ]);
        })->name('supplier-details');

        // Sale Items Report - list sale items with transaction details
        Route::get('sale-items', function () {
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

            $records = \App\Models\SalesTransactionItem::select([
                'sales_transaction_items.id',
                'sales_transaction_items.item_code',
                'sales_transaction_items.item_name',
                'sales_transaction_items.quantity',
                'sales_transaction_items.unit_price',
                'sales_transaction_items.line_total',
                'sales_transaction_items.brand',
                'sales_transaction_items.model',
                'sales_transaction_items.serial_number',
                'sales_transaction_items.section_code',
                'sales_transactions.invoice_no',
                'sales_transactions.transaction_date',
                'sales_transactions.customer_name',
                'sections.name as section_name',
            ])
            ->join('sales_transactions', 'sales_transaction_items.sales_transaction_id', '=', 'sales_transactions.id')
            ->leftJoin('sections', 'sales_transaction_items.section_code', '=', 'sections.section_code')
            ->when($company->company_code ?? null, function ($q, $companyCode) {
                return $q->where('sales_transaction_items.company_code', $companyCode);
            })
            ->orderBy('sales_transactions.transaction_date', 'desc')
            ->get();

            // Get all sections for filtering
            $sections = \App\Models\Section::where('is_active', true)
                ->when($company->company_code ?? null, function ($q, $companyCode) {
                    return $q->where('company_code', $companyCode);
                })
                ->orderBy('section_code')
                ->get(['section_code', 'name']);

            return Inertia::render('Reports/SaleItems', [
                'records' => $records,
                'company' => $company,
                'sections' => $sections,
            ]);
        })->name('sale-items');

        // Printer Sales Report - filter likely printer items by name/code/brand
        Route::get('printer-sales', function () {
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

            $records = \App\Models\SalesTransactionItem::select([
                'sales_transaction_items.id',
                'sales_transaction_items.item_code',
                'sales_transaction_items.item_name',
                'sales_transaction_items.quantity',
                'sales_transaction_items.unit_price',
                'sales_transaction_items.line_total',
                'sales_transaction_items.brand',
                'sales_transaction_items.model',
                'sales_transaction_items.serial_number',
                'sales_transactions.invoice_no',
                'sales_transactions.transaction_date',
                'sales_transactions.customer_name',
            ])
            ->join('sales_transactions', 'sales_transaction_items.sales_transaction_id', '=', 'sales_transactions.id')
            ->where(function ($q) {
                $q->where('sales_transaction_items.item_name', 'like', '%printer%')
                  ->orWhere('sales_transaction_items.item_code', 'like', 'PR%')
                  ->orWhere('sales_transaction_items.brand', 'like', '%printer%');
            })
            ->when($company->company_code ?? null, function ($q, $companyCode) {
                return $q->where('sales_transaction_items.company_code', $companyCode);
            })
            ->orderBy('sales_transactions.transaction_date', 'desc')
            ->get();

            return Inertia::render('Reports/PrinterSales', [
                'records' => $records,
                'company' => $company,
            ]);
        })->name('printer-sales');

        // Printer Stock Bin Card
        Route::get('printer-stock-bin-card', [\App\Http\Controllers\Reports\PrinterStockBinCardController::class, 'index'])->name('printer-stock-bin-card');

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

    // Stock Transfer routes
    Route::resource('stock-transfers', StockTransferController::class)->only(['index', 'create', 'store']);
    Route::get('stock-transfers/get-product-stock', [StockTransferController::class, 'getProductStock'])->name('stock-transfers.get-product-stock');
    Route::post('stock-transfers/download-pdf', [StockTransferController::class, 'downloadPdf'])->name('stock-transfers.download-pdf');
    Route::get('stock-transfers/{stockTransfer}/download-pdf', [StockTransferController::class, 'downloadPdfById'])->name('stock-transfers.download-pdf-id');

    // Printer Transfer routes
    Route::get('printer-transfers/download-pdf-batch', [PrinterTransferController::class, 'downloadPdfBatch'])->name('printer-transfers.download-pdf-batch');
    Route::resource('printer-transfers', PrinterTransferController::class)->only(['index', 'create', 'store']);
    Route::get('printer-transfers/search-printers', [PrinterTransferController::class, 'searchPrinters'])->name('printer-transfers.search-printers');
    Route::get('printer-transfers/section-trf-in-stock', [PrinterTransferController::class, 'getSectionTrfInStock'])->name('printer-transfers.section-trf-in-stock');
    Route::post('printer-transfers/preview-pdf', [PrinterTransferController::class, 'previewPdf'])->name('printer-transfers.preview-pdf');

    // Wastage Management routes (Item Wastage - ItemPriceDet)
    Route::get('wastages/search-serial', [\App\Http\Controllers\WastageController::class, 'searchBySerial'])->name('wastages.search-serial');
    Route::get('wastages/unified-search', [\App\Http\Controllers\WastageController::class, 'unifiedSearch'])->name('wastages.unified-search');
    Route::get('wastages/product-batches', [\App\Http\Controllers\WastageController::class, 'getProductBatches'])->name('wastages.product-batches');
    Route::resource('wastages', \App\Http\Controllers\WastageController::class);

    // Printer Wastage Management routes (Printer Wastage - PurchasesDet)
    Route::get('printer-wastages/search-printers', [\App\Http\Controllers\PrinterWastageController::class, 'searchPrinters'])->name('printer-wastages.search-printers');
    Route::resource('printer-wastages', \App\Http\Controllers\PrinterWastageController::class);

    // Supplier Returns routes
    Route::get('supplier-returns/search-suppliers', [\App\Http\Controllers\SupplierReturnController::class, 'searchSuppliers'])->name('supplier-returns.search-suppliers');
    Route::get('supplier-returns/search-items', [\App\Http\Controllers\SupplierReturnController::class, 'searchItems'])->name('supplier-returns.search-items');
    Route::get('supplier-returns/search-printers', [\App\Http\Controllers\SupplierReturnController::class, 'searchPrinters'])->name('supplier-returns.search-printers');
    Route::resource('supplier-returns', \App\Http\Controllers\SupplierReturnController::class);

    // Privilege Points
    Route::resource('points-rules', \App\Http\Controllers\PointsRulesController::class);
    Route::get('privilege-points', [\App\Http\Controllers\PrivilegePointsController::class, 'index'])->name('privilege-points.index');
    Route::get('privilege-points/{companyCode}/{sectionCode}/{customerCode}', [\App\Http\Controllers\PrivilegePointsController::class, 'show'])->name('privilege-points.show');
});

require __DIR__.'/settings.php';
