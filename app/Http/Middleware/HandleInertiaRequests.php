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

        $user = $request->user();

        if ($user instanceof \App\Models\User) {
            $user->loadMissing('role.permissions');
        }

        $company = $request->user('company');
        if (! $company) {
            if ($user instanceof \App\Models\Company) {
                $company = $user;
            } elseif ($user instanceof \App\Models\User) {
                $company = $user->company;
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message ?? ''), 'author' => trim($author ?? '')],
            'auth' => [
                'user' => $user,
                'company' => $company,
            ],
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
