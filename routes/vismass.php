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

});