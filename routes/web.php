<?php

use App\Http\Controllers\CompanyAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\Api\CompanyController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

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

        $user = auth()->user();
        if ($user && $user->user_type === 'super_admin' && !session('active_company_code') && !$user->getRawOriginal('company_code')) {
            return redirect()->route('company.select');
        }

        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('select-company', [\App\Http\Controllers\CompanySelectionController::class, 'index'])->name('company.select');
    Route::post('select-company', [\App\Http\Controllers\CompanySelectionController::class, 'select'])->name('company.select.store');
    Route::post('companies/{company}/toggle-status', [\App\Http\Controllers\CompanySelectionController::class, 'toggleStatus'])->name('company.toggle-status');
});

Route::middleware('guest:company')->group(function () {
    Route::get('company/login', [CompanyAuthController::class, 'create'])->name('company.login');
    Route::post('company/login', [CompanyAuthController::class, 'store']);
});

Route::middleware(['auth:web,company'])->group(function () {
    Route::get('company/dashboard', function () {
        return Inertia::render('company-dashboard');
    })->name('company.dashboard');

    Route::resource('sections', \App\Http\Controllers\SectionController::class);
    
    Route::post('company/logout', [CompanyAuthController::class, 'destroy'])->name('company.logout');
});

Route::middleware(['auth:web,company'])->group(function () {
    Route::get('company/profile', [\App\Http\Controllers\CompanyProfileController::class, 'show'])->name('company.profile');
    Route::put('company/profile', [\App\Http\Controllers\CompanyProfileController::class, 'update'])->name('company.profile.update');

    Route::get('api/company-data', function() {
        return \App\Models\Company::first();
    });

    Route::get('/user-management', [UserController::class, 'index'])->name('user-management');
    Route::resource('users', UserController::class);
    Route::post('users/{user}/toggle', [UserController::class, 'toggle'])->name('users.toggle');

    // Admin routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('controller-master', \App\Http\Controllers\Admin\ControllerMasterController::class);
        Route::post('controller-master/{controlMaster}/toggle', [\App\Http\Controllers\Admin\ControllerMasterController::class, 'toggle'])->name('controller-master.toggle');
        
        Route::resource('code-master', \App\Http\Controllers\Admin\CodeMasterController::class);
        Route::post('code-master/{codeMaster}/toggle', [\App\Http\Controllers\Admin\CodeMasterController::class, 'toggle'])->name('code-master.toggle');
    });

    // Role and Permission Routes
    Route::resource('roles', \App\Http\Controllers\RoleController::class);
    Route::resource('permissions', \App\Http\Controllers\PermissionController::class);

    // API routes for user management
    Route::prefix('api')->name('api.')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('user-roles', [UserRoleController::class, 'index']);
        Route::get('sections', [SectionController::class, 'apiIndex']);
        Route::get('companies', [\App\Http\Controllers\Api\CompanyController::class, 'index']);
    });

    // Media Library Routes
    Route::get('/media-library', [\App\Http\Controllers\MediaController::class, 'page'])->name('media-library');
    Route::get('/media', [\App\Http\Controllers\MediaController::class, 'index'])->name('media.index');
    Route::post('/media/batch', [\App\Http\Controllers\MediaController::class, 'batchStore'])->name('media.batch');
    Route::get('/media/{id}/download', [\App\Http\Controllers\MediaController::class, 'download'])->name('media.download');
    Route::delete('/media/{id}', [\App\Http\Controllers\MediaController::class, 'destroy'])->name('media.destroy');
    Route::post('/media/directories', [\App\Http\Controllers\MediaController::class, 'createDirectory'])->name('media.directories.create');
    Route::put('/media/directories/{id}', [\App\Http\Controllers\MediaController::class, 'updateDirectory'])->name('media.directories.update');
    Route::delete('/media/directories/{id}', [\App\Http\Controllers\MediaController::class, 'destroyDirectory'])->name('media.directories.destroy');
    Route::patch('/media/{id}/directory', [\App\Http\Controllers\MediaController::class, 'updateMediaDirectory'])->name('media.directory.update');
});

require __DIR__.'/settings.php';
