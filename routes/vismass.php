<?php

use App\Http\Controllers\Admin\CodeMasterController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\SupplierPaymentController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\Reports\StockInHandReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| VISMASS Business Unit Routes (VAT Operations)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:web,company', 'verified', 'business.unit:vismass'])->prefix('vismass')->name('vismass.')->group(function () {

    // Stock Management (Main Stock)
    Route::prefix('stock')->name('stock.')->group(function () {
        Route::get('/', [StockInHandReportController::class, 'index'])->name('index');
        Route::get('/transfers', [StockTransferController::class, 'index'])->name('transfers.index');
        Route::get('/transfers/create', [StockTransferController::class, 'create'])->name('transfers.create');
        Route::post('/transfers', [StockTransferController::class, 'store'])->name('transfers.store');
        Route::get('/transfers/{transfer}', [StockTransferController::class, 'show'])->name('transfers.show');
        Route::delete('/transfers/{transfer}', [StockTransferController::class, 'destroy'])->name('transfers.destroy');
        
        // Stock-specific routes
        Route::get('/search', [StockInHandReportController::class, 'search'])->name('search');
        Route::get('/low-stock', [StockInHandReportController::class, 'lowStock'])->name('low-stock');
        Route::get('/export', [StockInHandReportController::class, 'export'])->name('export');
    });

    // Master Data Management (VAT-related)
    Route::prefix('admin')->name('admin.')->group(function () {
        // Categories and Items
        Route::resource('categories', CodeMasterController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::post('categories/{codeMaster}/toggle', [CodeMasterController::class, 'toggle'])->name('categories.toggle');
        
        // Customers (VAT customers)
        Route::resource('customers', AdminCustomerController::class);
        Route::post('customers/{customer}/toggle', [AdminCustomerController::class, 'toggle'])->name('customers.toggle');
    });

    // VAT Management
    Route::prefix('vat')->name('vat.')->group(function () {
        Route::get('/rates', [\App\Http\Controllers\VatRateController::class, 'index'])->name('rates.index');
        Route::post('/rates', [\App\Http\Controllers\VatRateController::class, 'store'])->name('rates.store');
        Route::put('/rates/{vatRate}', [\App\Http\Controllers\VatRateController::class, 'update'])->name('rates.update');
        Route::delete('/rates/{vatRate}', [\App\Http\Controllers\VatRateController::class, 'destroy'])->name('rates.destroy');
    });

});