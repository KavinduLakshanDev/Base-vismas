<?php

use App\Models\Setting;
use App\Models\User;
use App\Models\Company;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

if (!function_exists('creatorId')) {
    function creatorId(): ?int
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }

        if (isset($user->user_type) && in_array($user->user_type, ['super_admin', 'company_admin'])) {
            return $user->id;
        }

        return $user->created_by ?? $user->id;
    }
}

if (!function_exists('creatorUser')) {
    function creatorUser()
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }

        if (isset($user->user_type) && in_array($user->user_type, ['super_admin', 'company_admin'])) {
            return $user;
        }

        return isset($user->created_by) ? User::find($user->created_by) : $user;
    }
}

if (!function_exists('setSetting')) {
    function setSetting(string $key, $value, $userId = null, $isPublic = true): void
    {
        $createdBy = $userId ?? creatorId();

        Setting::updateOrCreate(
            ['key' => $key, 'created_by' => $createdBy],
            ['value' => $value, 'is_public' => $isPublic]
        );

        // Bust the cache immediately
        if (Auth::check() && isset(Auth::user()->user_type) && Auth::user()->user_type === 'super_admin') {
            Cache::forget('admin_settings');
            Cache::forget('admin_settings_public');
        }
        if ($createdBy) {
            Cache::forget('company_settings_' . $createdBy);
            Cache::forget('company_settings_' . $createdBy . '_public');
        }
        Cache::forget('global_settings');
    }
}

if (!function_exists('getAdminAllSetting')) {
    function getAdminAllSetting($publicOnly = false): array
    {
        $cacheKey = $publicOnly ? 'admin_settings_public' : 'admin_settings';

        return Cache::rememberForever($cacheKey, function () use ($publicOnly) {
            $superAdmin = User::where('user_type', 'super_admin')->first();
            $adminId = $superAdmin ? $superAdmin->id : null;

            $query = Setting::query();
            if ($adminId) {
                $query->where(function ($q) use ($adminId) {
                    $q->where('created_by', $adminId)->orWhereNull('created_by');
                });
            } else {
                $query->whereNull('created_by');
            }

            if ($publicOnly) {
                $query->where('is_public', 1);
            }

            return $query->pluck('value', 'key')->toArray();
        });
    }
}

if (!function_exists('getCompanyAllSetting')) {
    function getCompanyAllSetting($userId = null, $publicOnly = false): array
    {
        $cId = $userId ?? creatorId();
        if (!$cId) {
            return getAdminAllSetting($publicOnly);
        }

        $cacheKey = $publicOnly ? 'company_settings_' . $cId . '_public' : 'company_settings_' . $cId;

        return Cache::rememberForever($cacheKey, function () use ($cId, $publicOnly) {
            $query = Setting::where(function ($q) use ($cId) {
                $q->where('created_by', $cId)->orWhereNull('created_by');
            });

            if ($publicOnly) {
                $query->where('is_public', 1);
            }

            return $query->pluck('value', 'key')->toArray();
        });
    }
}

if (!function_exists('admin_setting')) {
    function admin_setting($key, $default = null)
    {
        if (!$key) {
            return $default;
        }
        $settings = getAdminAllSetting();
        return $settings[$key] ?? $default;
    }
}

if (!function_exists('company_setting')) {
    function company_setting($key, $userId = null, $default = null)
    {
        if (!$key) {
            return $default;
        }
        $settings = getCompanyAllSetting($userId);
        return $settings[$key] ?? $default;
    }
}

if (!function_exists('getImageUrlPrefix')) {
    function getImageUrlPrefix(): string
    {
        $storageType = admin_setting('storageType') ?: 'local';

        switch ($storageType) {
            case 's3':
            case 'aws_s3':
                $endpoint = admin_setting('awsEndpoint');
                if ($endpoint && strpos($endpoint, 'amazonaws.com') === false) {
                    return rtrim($endpoint, '/') . '/media';
                }
                $bucket = admin_setting('awsBucket');
                $region = admin_setting('awsDefaultRegion') ?: 'us-east-1';
                return "https://{$bucket}.s3.{$region}.amazonaws.com/media";
            case 'wasabi':
                $bucket = admin_setting('wasabiBucket');
                $region = admin_setting('wasabiRegion') ?: 'us-east-1';
                return "https://s3.{$region}.wasabisys.com/{$bucket}/media";
            case 'local':
            default:
                return asset('storage/media');
        }
    }
}
