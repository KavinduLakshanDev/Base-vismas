<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        /** @var \Illuminate\Http\Request $request */
        $quote = Inspiring::quotes()->random();
        [$message, $author] = str($quote)->explode('-', 2); // Limit to 2 parts

        $user = $request->user() ?? $request->user('company');

        if ($user instanceof \App\Models\User) {
            $user->loadMissing('role.permissions');
            $permissions = $user->role ? $user->role->permissions->pluck('slug')->toArray() : [];
            if ($user->user_type === 'super_admin' || $user->role?->level === 'super_admin' || $user->role?->level === 'company_admin') {
                $permissions = array_values(array_unique(array_merge($permissions, [
                    'manage-settings', 'manage-brand-settings', 'manage-company-settings', 'manage-system-settings',
                    'manage-currency-settings', 'manage-cookie-settings', 'manage-pusher-settings', 'manage-seo-settings',
                    'manage-storage-settings', 'manage-email-settings', 'manage-email-notification-settings',
                    'manage-bank-transfer-settings', 'manage-cache-settings',
                    'edit-brand-settings', 'edit-company-settings', 'edit-system-settings', 'edit-currency-settings',
                    'clear-cache', 'edit-cookie-settings', 'manage-cookie-settings', 'edit-email-settings',
                    'test-email', 'edit-seo-settings', 'edit-storage-settings', 'edit-bank-transfer-settings',
                    'edit-pusher-settings'
                ])));
            }
            $roles = array_values(array_unique(array_filter([$user->user_type, $user->role?->level])));
            $user->setAttribute('permissions', $permissions);
            $user->setAttribute('roles', $roles);
        } elseif ($user instanceof \App\Models\Company) {
            $user->setAttribute('permissions', [
                'manage-settings', 'manage-brand-settings', 'manage-company-settings', 'manage-system-settings',
                'manage-currency-settings', 'manage-cookie-settings', 'manage-pusher-settings', 'manage-seo-settings',
                'manage-storage-settings', 'manage-email-settings', 'manage-email-notification-settings',
                'manage-bank-transfer-settings', 'manage-cache-settings',
                'edit-brand-settings', 'edit-company-settings', 'edit-system-settings', 'edit-currency-settings',
                'clear-cache', 'edit-cookie-settings', 'manage-cookie-settings', 'edit-email-settings',
                'test-email', 'edit-seo-settings', 'edit-storage-settings', 'edit-bank-transfer-settings',
                'edit-pusher-settings'
            ]);
            $user->setAttribute('roles', ['company', 'company_admin']);
        }

        $activeCompanyCode = session('active_company_code', $user?->company_code);
        $activeCompany = $activeCompanyCode ? \App\Models\Company::where('company_code', $activeCompanyCode)->first() : null;

        $company = $request->user('company');
        if (! $company) {
            if ($user instanceof \App\Models\Company) {
                $company = $user;
            } elseif ($activeCompany) {
                $company = $activeCompany;
            } elseif ($user instanceof \App\Models\User) {
                $company = $user->company ?? ($user->user_type === 'super_admin' ? \App\Models\Company::first() : null);
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message ?? ''), 'author' => trim($author ?? '')],
            'auth' => [
                'user' => $user,
                'company' => $company,
                'active_company' => $activeCompany,
            ],
            'adminAllSetting' => fn () => function_exists('getAdminAllSetting') ? getAdminAllSetting() : [],
            'companyAllSetting' => fn () => function_exists('getCompanyAllSetting') ? getCompanyAllSetting() : [],
            'imageUrlPrefix' => fn () => function_exists('getImageUrlPrefix') ? getImageUrlPrefix() : asset('storage/media'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'ziggy' => fn () => array_merge((new Ziggy)->toArray(), [
                'location' => $request->url(),
            ]),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'payment_id' => fn () => $request->session()->get('payment_id'),
                'transfer_id' => fn () => $request->session()->get('transfer_id'),
                'transfer_ids' => fn () => $request->session()->get('transfer_ids'),
            ],
        ];
    }
}
