<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MALIBO Business Unit Routes (Non-VAT Operations)  
|--------------------------------------------------------------------------
| Routes for MALIBO operations
*/

Route::middleware(['auth:web,company', 'verified', 'business.unit:malibo'])->prefix('malibo')->name('malibo.')->group(function () {
    // Non-VAT compliant operations
});