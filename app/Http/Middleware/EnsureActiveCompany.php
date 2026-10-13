<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveCompany
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If authenticated as a Super Admin, enforce active company selection
        if ($user && method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            // Allowed routes without an active company selected
            if (
                !$request->routeIs('company.select') &&
                !$request->routeIs('company.select.store') &&
                !$request->routeIs('company.toggle-status') &&
                !$request->routeIs('logout') &&
                !$request->is('logout')
            ) {
                if (!session('active_company_code')) {
                    if ($request->wantsJson() || $request->is('api/*')) {
                        return response()->json(['error' => 'Please select an active company first.'], 403);
                    }

                    return redirect()->route('company.select');
                }
            }
        }

        return $next($request);
    }
}
