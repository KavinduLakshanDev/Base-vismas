<?php

namespace App\Actions\Fortify;

use Illuminate\Auth\AuthManager;
use Illuminate\Contracts\Auth\StatefulGuard;
use Laravel\Fortify\Actions\AttemptToAuthenticate as BaseAttemptToAuthenticate;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\LoginRateLimiter;

class AttemptToAuthenticate extends BaseAttemptToAuthenticate
{
    protected $auth;

    public function __construct(AuthManager $auth, StatefulGuard $guard, LoginRateLimiter $limiter)
    {
        \Illuminate\Support\Facades\Log::info('AttemptToAuthenticate constructor', [
            'auth' => get_class($auth),
            'guard' => get_class($guard),
            'limiter' => get_class($limiter),
        ]);
        parent::__construct($guard, $limiter);
        $this->auth = $auth;
    }

    public function handle($request, $next)
    {
        // Try web guard first
        if ($this->guard->attempt(
            $request->only(Fortify::username(), 'password'),
            $request->boolean('remember')
        )) {
            return $next($request);
        }

        // Try company guard
        if ($this->auth->guard('company')->attempt(
            $request->only(Fortify::username(), 'password'),
            $request->boolean('remember')
        )) {
            return $next($request);
        }

        $this->throwFailedAuthenticationException($request);
    }
}
