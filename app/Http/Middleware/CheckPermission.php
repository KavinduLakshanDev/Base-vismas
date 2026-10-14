<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!auth()->check() && !auth()->guard('company')->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user() ?? auth()->guard('company')->user();
        
        // Super admin has all permissions
        if (
            $user->type === 'superadmin' || 
            $user->type === 'super admin' || 
            $user->user_type === 'super_admin' || 
            $user->user_type === 'superadmin' || 
            (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin())
        ) {
            return $next($request);
        }

        // Check if user has the required permission
        if (!$user->hasPermissionTo($permission)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            
            // Redirect to first available page
            return redirect()->route('dashboard.redirect');
        }

        return $next($request);
    }
}
