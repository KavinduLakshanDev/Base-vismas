<?php

use App\Http\Controllers\SettingController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth:web,company'])->group(function () {
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::post('settings/brand', [SettingController::class, 'updateBrandSettings'])->name('settings.brand.update');
    Route::post('settings/company', [SettingController::class, 'updateCompanySettings'])->name('settings.company.update');
    Route::post('settings/system', [SettingController::class, 'updateSystemSettings'])->name('settings.system.update');
    Route::post('settings/currency', [SettingController::class, 'updateCurrencySettings'])->name('settings.currency.update');
    Route::post('settings/cache/clear', [SettingController::class, 'clearCache'])->name('settings.cache.clear');
    Route::post('settings/optimize', [SettingController::class, 'optimizeSite'])->name('settings.optimize');
    Route::post('settings/cookie', [SettingController::class, 'updateCookieSettings'])->name('settings.cookie.update');
    Route::post('settings/seo', [SettingController::class, 'updateSeoSettings'])->name('settings.seo.update');
    Route::post('settings/storage', [SettingController::class, 'updateStorageSettings'])->name('settings.storage.update');
    Route::get('settings/cookie/download', [SettingController::class, 'downloadCookieData'])->name('settings.cookie.download');
    Route::post('settings/email', [SettingController::class, 'updateEmailSettings'])->name('settings.email.update');
    Route::post('settings/email/test', [SettingController::class, 'testEmail'])->name('settings.email.test');
    Route::post('settings/pusher', [SettingController::class, 'updatePusherSettings'])->name('settings.pusher.update');
    Route::post('settings/bank-transfer', [SettingController::class, 'updateBankTransferSettings'])->name('settings.bank-transfer.update');
    Route::post('email-notification-settings-save', [SettingController::class, 'mailNotificationStore'])->name('email.notification.setting.store');
    Route::post('/cookie-consent-log', [SettingController::class, 'logCookieConsent'])->name('cookie.consent.log');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');
});
