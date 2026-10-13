<?php

use App\Http\Controllers\Admin\CodeMasterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| VISMASS Business Unit Routes (VAT Operations)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:web,company', 'verified', 'business.unit:vismass'])->prefix('vismass')->name('vismass.')->group(function () {

    // Master Data Management (VAT-related)
    Route::prefix('admin')->name('admin.')->group(function () {
        // Categories and Items
        Route::resource('categories', CodeMasterController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::post('categories/{codeMaster}/toggle', [CodeMasterController::class, 'toggle'])->name('categories.toggle');
    });

    // VAT Management
    Route::prefix('vat')->name('vat.')->group(function () {
        Route::get('/rates', [\App\Http\Controllers\VatRateController::class, 'index'])->name('rates.index');
        Route::post('/rates', [\App\Http\Controllers\VatRateController::class, 'store'])->name('rates.store');
        Route::put('/rates/{vatRate}', [\App\Http\Controllers\VatRateController::class, 'update'])->name('rates.update');
        Route::delete('/rates/{vatRate}', [\App\Http\Controllers\VatRateController::class, 'destroy'])->name('rates.destroy');
    });

});