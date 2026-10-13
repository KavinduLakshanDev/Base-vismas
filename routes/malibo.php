<?php


use App\Http\Controllers\Reports\PrinterStockReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MALIBO Business Unit Routes (Non-VAT Operations)  
|--------------------------------------------------------------------------
| Routes for MALIBO operations including:
| - Printing Operations
| - Non-VAT compliant operations
*/

Route::middleware(['auth:web,company', 'verified', 'business.unit:malibo'])->prefix('malibo')->name('malibo.')->group(function () {
    
     // Printing Operations
    Route::prefix('printing')->name('printing.')->group(function () {
        // Printer Stock Management
        Route::get('/stock', [PrinterStockReportController::class, 'index'])->name('stock.index');
        Route::get('/stock/search', [PrinterStockReportController::class, 'search'])->name('stock.search');
        Route::get('/stock/export', [PrinterStockReportController::class, 'export'])->name('stock.export');
        Route::get('/stock/low-stock', [PrinterStockReportController::class, 'lowStock'])->name('stock.low-stock');
        

        
        // Printing Jobs Management - TODO: Implement Controller
        // Route::prefix('jobs')->name('jobs.')->group(function () {
        //     Route::get('/', [\App\Http\Controllers\PrintingJobController::class, 'index'])->name('index');
        //     Route::get('/create', [\App\Http\Controllers\PrintingJobController::class, 'create'])->name('create');
        //     Route::post('/', [\App\Http\Controllers\PrintingJobController::class, 'store'])->name('store');
        //     Route::get('/{job}', [\App\Http\Controllers\PrintingJobController::class, 'show'])->name('show');
        //     Route::patch('/{job}/status', [\App\Http\Controllers\PrintingJobController::class, 'updateStatus'])->name('update-status');
        //     Route::delete('/{job}', [\App\Http\Controllers\PrintingJobController::class, 'destroy'])->name('destroy');
        // });
        
        // Barcode Generation - TODO: Implement Controller
        // Route::prefix('barcodes')->name('barcodes.')->group(function () {
        //     Route::get('/', [\App\Http\Controllers\BarcodeController::class, 'index'])->name('index');
        //     Route::post('/generate', [\App\Http\Controllers\BarcodeController::class, 'generate'])->name('generate');
        //     Route::post('/batch-generate', [\App\Http\Controllers\BarcodeController::class, 'batchGenerate'])->name('batch-generate');
        //     Route::get('/templates', [\App\Http\Controllers\BarcodeController::class, 'templates'])->name('templates');
        // });
    });

    // Distribution Management - TODO: Implement Controller
    // Route::prefix('distribution')->name('distribution.')->group(function () {
    //     Route::get('/dashboard', [\App\Http\Controllers\DistributionController::class, 'dashboard'])->name('dashboard');
    //     Route::get('/schedule', [\App\Http\Controllers\DistributionController::class, 'schedule'])->name('schedule');
    //     Route::post('/schedule', [\App\Http\Controllers\DistributionController::class, 'createSchedule'])->name('schedule.store');
    //     Route::get('/tracking', [\App\Http\Controllers\DistributionController::class, 'tracking'])->name('tracking');
    //     Route::get('/performance', [\App\Http\Controllers\DistributionController::class, 'performance'])->name('performance');
    // });

    // Reports (MALIBO-specific) - TODO: Implement Controllers
    // Route::prefix('reports')->name('reports.')->group(function () {
    //     Route::get('/deliveries', [\App\Http\Controllers\Reports\DeliveryReportController::class, 'index'])->name('deliveries');
    //     Route::get('/printer-stock', [PrinterStockReportController::class, 'index'])->name('printer-stock');
    //     Route::get('/routes-performance', [\App\Http\Controllers\Reports\RoutePerformanceReportController::class, 'index'])->name('routes-performance');
    //     Route::get('/printing-jobs', [\App\Http\Controllers\Reports\PrintingJobReportController::class, 'index'])->name('printing-jobs');
    //     Route::get('/distribution', [\App\Http\Controllers\Reports\DistributionReportController::class, 'index'])->name('distribution');
    // });

    // Customer Management (Non-VAT customers) - TODO: Implement Controller
    // Route::prefix('customers')->name('customers.')->group(function () {
    //     Route::get('/', [\App\Http\Controllers\MALIBO\CustomerController::class, 'index'])->name('index');
    //     Route::get('/create', [\App\Http\Controllers\MALIBO\CustomerController::class, 'create'])->name('create');
    //     Route::post('/', [\App\Http\Controllers\MALIBO\CustomerController::class, 'store'])->name('store');
    //     Route::get('/{customer}', [\App\Http\Controllers\MALIBO\CustomerController::class, 'show'])->name('show');
    //     Route::get('/{customer}/edit', [\App\Http\Controllers\MALIBO\CustomerController::class, 'edit'])->name('edit');
    //     Route::put('/{customer}', [\App\Http\Controllers\MALIBO\CustomerController::class, 'update'])->name('update');
    //     Route::delete('/{customer}', [\App\Http\Controllers\MALIBO\CustomerController::class, 'destroy'])->name('destroy');
        
    //     // Customer delivery management
    //     Route::get('/{customer}/deliveries', [\App\Http\Controllers\MALIBO\CustomerController::class, 'deliveries'])->name('deliveries');
    //     Route::get('/{customer}/delivery-history', [\App\Http\Controllers\MALIBO\CustomerController::class, 'deliveryHistory'])->name('delivery-history');
    // });
});