<?php

use App\Http\Controllers\Admin\CodeMasterController;
use App\Http\Controllers\Admin\ControllerMasterController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\CompanyAuthController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\CompanySelectionController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
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

    Route::get('dashboard/redirect', function () {
        if (auth()->guard('company')->check()) {
            return redirect()->route('company.dashboard');
        }
        return redirect()->route('dashboard');
    })->name('dashboard.redirect');

    Route::get('select-company', [CompanySelectionController::class, 'index'])->name('company.select');
    Route::post('select-company', [CompanySelectionController::class, 'select'])->name('company.select.store');
    Route::post('companies/{company}/toggle-status', [CompanySelectionController::class, 'toggleStatus'])->name('company.toggle-status');
});

Route::middleware('guest:company')->group(function () {
    Route::get('company/login', [CompanyAuthController::class, 'create'])->name('company.login');
    Route::post('company/login', [CompanyAuthController::class, 'store']);
});

Route::middleware(['auth:web,company'])->group(function () {
    Route::get('company/dashboard', function () {
        return Inertia::render('company-dashboard');
    })->name('company.dashboard');

    Route::post('company/logout', [CompanyAuthController::class, 'destroy'])->name('company.logout');

    // Company Profile
    Route::middleware('permission:manage-company-profile')->group(function () {
        Route::get('company/profile', [CompanyProfileController::class, 'show'])->name('company.profile');
        Route::put('company/profile', [CompanyProfileController::class, 'update'])->name('company.profile.update');
    });

    Route::get('api/company-data', function() {
        return \App\Models\Company::first();
    });

    // Sections routes with granular permissions
    Route::middleware('permission:manage-sections')->group(function () {
        Route::get('sections', [SectionController::class, 'index'])->middleware('permission:manage-sections')->name('sections.index');
        Route::get('sections/create', [SectionController::class, 'create'])->middleware('permission:create-sections')->name('sections.create');
        Route::post('sections', [SectionController::class, 'store'])->middleware('permission:create-sections')->name('sections.store');
        Route::get('sections/{section}', [SectionController::class, 'show'])->middleware('permission:view-sections')->name('sections.show');
        Route::get('sections/{section}/edit', [SectionController::class, 'edit'])->middleware('permission:edit-sections')->name('sections.edit');
        Route::put('sections/{section}', [SectionController::class, 'update'])->middleware('permission:edit-sections')->name('sections.update');
        Route::patch('sections/{section}', [SectionController::class, 'update'])->middleware('permission:edit-sections');
        Route::delete('sections/{section}', [SectionController::class, 'destroy'])->middleware('permission:delete-sections')->name('sections.destroy');
    });

    // Users routes with granular permissions
    Route::middleware('permission:manage-users')->group(function () {
        Route::get('/user-management', [UserController::class, 'index'])->middleware('permission:manage-users')->name('user-management');
        Route::get('users', [UserController::class, 'index'])->middleware('permission:manage-users')->name('users.index');
        Route::get('users/create', [UserController::class, 'create'])->middleware('permission:create-users')->name('users.create');
        Route::post('users', [UserController::class, 'store'])->middleware('permission:create-users')->name('users.store');
        Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:view-users')->name('users.show');
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->middleware('permission:edit-users')->name('users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users')->name('users.update');
        Route::patch('users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:delete-users')->name('users.destroy');
        Route::post('users/{user}/toggle', [UserController::class, 'toggle'])->middleware('permission:edit-users')->name('users.toggle');
    });

    // Admin routes with granular permissions
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::middleware('permission:manage-controller-master')->group(function () {
            Route::get('controller-master', [ControllerMasterController::class, 'index'])->middleware('permission:manage-controller-master')->name('controller-master.index');
            Route::get('controller-master/create', [ControllerMasterController::class, 'create'])->middleware('permission:create-controller-master')->name('controller-master.create');
            Route::post('controller-master', [ControllerMasterController::class, 'store'])->middleware('permission:create-controller-master')->name('controller-master.store');
            Route::get('controller-master/{controlMaster}', [ControllerMasterController::class, 'show'])->middleware('permission:view-controller-master')->name('controller-master.show');
            Route::get('controller-master/{controlMaster}/edit', [ControllerMasterController::class, 'edit'])->middleware('permission:edit-controller-master')->name('controller-master.edit');
            Route::put('controller-master/{controlMaster}', [ControllerMasterController::class, 'update'])->middleware('permission:edit-controller-master')->name('controller-master.update');
            Route::patch('controller-master/{controlMaster}', [ControllerMasterController::class, 'update'])->middleware('permission:edit-controller-master');
            Route::delete('controller-master/{controlMaster}', [ControllerMasterController::class, 'destroy'])->middleware('permission:delete-controller-master')->name('controller-master.destroy');
            Route::post('controller-master/{controlMaster}/toggle', [ControllerMasterController::class, 'toggle'])->middleware('permission:edit-controller-master')->name('controller-master.toggle');
        });
        
        Route::middleware('permission:manage-code-master')->group(function () {
            Route::get('code-master', [CodeMasterController::class, 'index'])->middleware('permission:manage-code-master')->name('code-master.index');
            Route::get('code-master/create', [CodeMasterController::class, 'create'])->middleware('permission:create-code-master')->name('code-master.create');
            Route::post('code-master', [CodeMasterController::class, 'store'])->middleware('permission:create-code-master')->name('code-master.store');
            Route::get('code-master/{codeMaster}', [CodeMasterController::class, 'show'])->middleware('permission:view-code-master')->name('code-master.show');
            Route::get('code-master/{codeMaster}/edit', [CodeMasterController::class, 'edit'])->middleware('permission:edit-code-master')->name('code-master.edit');
            Route::put('code-master/{codeMaster}', [CodeMasterController::class, 'update'])->middleware('permission:edit-code-master')->name('code-master.update');
            Route::patch('code-master/{codeMaster}', [CodeMasterController::class, 'update'])->middleware('permission:edit-code-master');
            Route::delete('code-master/{codeMaster}', [CodeMasterController::class, 'destroy'])->middleware('permission:delete-code-master')->name('code-master.destroy');
            Route::post('code-master/{codeMaster}/toggle', [CodeMasterController::class, 'toggle'])->middleware('permission:edit-code-master')->name('code-master.toggle');
        });
    });

    // Roles routes with granular permissions
    Route::middleware('permission:manage-roles')->group(function () {
        Route::get('roles', [RoleController::class, 'index'])->middleware('permission:manage-roles')->name('roles.index');
        Route::get('roles/create', [RoleController::class, 'create'])->middleware('permission:create-roles')->name('roles.create');
        Route::post('roles', [RoleController::class, 'store'])->middleware('permission:create-roles')->name('roles.store');
        Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:view-roles')->name('roles.show');
        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->middleware('permission:edit-roles')->name('roles.edit');
        Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles')->name('roles.update');
        Route::patch('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:delete-roles')->name('roles.destroy');
    });

    // Permissions routes with granular permissions
    Route::middleware('permission:manage-permissions')->group(function () {
        Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:manage-permissions')->name('permissions.index');
        Route::get('permissions/create', [PermissionController::class, 'create'])->middleware('permission:create-permissions')->name('permissions.create');
        Route::post('permissions', [PermissionController::class, 'store'])->middleware('permission:create-permissions')->name('permissions.store');
        Route::get('permissions/{permission}', [PermissionController::class, 'show'])->middleware('permission:view-permissions')->name('permissions.show');
        Route::get('permissions/{permission}/edit', [PermissionController::class, 'edit'])->middleware('permission:edit-permissions')->name('permissions.edit');
        Route::put('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions')->name('permissions.update');
        Route::patch('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions');
        Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:delete-permissions')->name('permissions.destroy');
    });

    // API routes for user management
    Route::prefix('api')->name('api.')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('user-roles', [UserRoleController::class, 'index']);
        Route::get('sections', [SectionController::class, 'apiIndex']);
        Route::get('companies', [CompanyController::class, 'index']);
    });

    // Media Library Routes with granular permissions
    Route::middleware('permission:manage-media')->group(function () {
        Route::get('/media-library', [MediaController::class, 'page'])->name('media-library');
        Route::get('/media', [MediaController::class, 'index'])->name('media.index');
        Route::post('/media/batch', [MediaController::class, 'batchStore'])->middleware('permission:create-media')->name('media.batch');
        Route::get('/media/{id}/download', [MediaController::class, 'download'])->middleware('permission:download-media')->name('media.download');
        Route::delete('/media/{id}', [MediaController::class, 'destroy'])->middleware('permission:delete-media')->name('media.destroy');
        Route::post('/media/directories', [MediaController::class, 'createDirectory'])->middleware('permission:create-media-directories')->name('media.directories.create');
        Route::put('/media/directories/{id}', [MediaController::class, 'updateDirectory'])->middleware('permission:edit-media-directories')->name('media.directories.update');
        Route::delete('/media/directories/{id}', [MediaController::class, 'destroyDirectory'])->middleware('permission:delete-media-directories')->name('media.directories.destroy');
        Route::patch('/media/{id}/directory', [MediaController::class, 'updateMediaDirectory'])->middleware('permission:edit-media-directories')->name('media.directory.update');
    });
});

require __DIR__.'/settings.php';
