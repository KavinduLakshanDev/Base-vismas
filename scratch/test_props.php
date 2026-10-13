<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = App\Models\User::first();
$req = \Illuminate\Http\Request::create('/settings', 'GET');
$req->setUserResolver(fn() => $user);

$middleware = new \App\Http\Middleware\HandleInertiaRequests();
$props = $middleware->share($req);

echo "AUTH KEYS:\n";
print_r(array_keys($props['auth']));
echo "\nUSER TYPE:\n";
echo $props['auth']['user']->user_type . "\n";
echo "\nROLES:\n";
print_r($props['auth']['user']->roles);
echo "\nPERMISSIONS:\n";
print_r($props['auth']['user']->permissions);
