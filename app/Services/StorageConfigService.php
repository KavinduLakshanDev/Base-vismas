<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class StorageConfigService
{
    /**
     * Get the active storage disk name
     */
    public static function getActiveDisk(): string
    {
        $config = self::getStorageConfig();
        return $config['disk'] ?? 'public';
    }

    /**
     * Get file validation rules based on settings
     */
    public static function getFileValidationRules(): array
    {
        $config = self::getStorageConfig();

        $allowedTypes = $config['allowed_file_types'] ?? '';
        $maxSize = $config['max_file_size_kb'] ?? 10240;

        $rules = ['max:' . $maxSize];

        if (!empty($allowedTypes)) {
            $rules[] = 'mimes:' . $allowedTypes;
        }

        return $rules;
    }

    /**
     * Get complete storage configuration
     */
    public static function getStorageConfig(): array
    {
        $cacheKey = 'active_storage_config';
        return Cache::remember($cacheKey, 300, function () {
            return self::loadStorageConfigFromDB();
        });
    }

    /**
     * Clear storage configuration cache
     */
    public static function clearCache(): void
    {
        Cache::forget('active_storage_config');
    }

    /**
     * Load storage configuration from database
     */
    private static function loadStorageConfigFromDB(): array
    {
        try {
            $storageType = Setting::get('storageType', 'local');
            $diskName = match ($storageType) {
                'local' => 'public',
                'aws_s3', 's3' => 's3',
                'wasabi' => 'wasabi',
                default => 'public',
            };

            return [
                'disk' => $diskName,
                'storage_type' => $storageType,
                'allowed_file_types' => Setting::get('allowedFileTypes', 'jpg,jpeg,png,webp,gif,pdf,doc,docx,csv,txt,zip,mp4,mp3,xlsx'),
                'max_file_size_kb' => (int) Setting::get('maxUploadSize', 10240),
                's3' => [
                    'key' => Setting::get('awsAccessKeyId', config('filesystems.disks.s3.key')),
                    'secret' => Setting::get('awsSecretAccessKey', config('filesystems.disks.s3.secret')),
                    'region' => Setting::get('awsDefaultRegion', config('filesystems.disks.s3.region', 'us-east-1')),
                    'bucket' => Setting::get('awsBucket', config('filesystems.disks.s3.bucket')),
                    'endpoint' => Setting::get('awsEndpoint', config('filesystems.disks.s3.endpoint')),
                    'url' => Setting::get('awsUrl', config('filesystems.disks.s3.url')),
                ],
                'wasabi' => [
                    'key' => Setting::get('wasabiAccessKey'),
                    'secret' => Setting::get('wasabiSecretKey'),
                    'region' => Setting::get('wasabiRegion', 'us-east-1'),
                    'bucket' => Setting::get('wasabiBucket'),
                    'endpoint' => Setting::get('wasabiUrl'),
                ],
            ];
        } catch (\Exception $e) {
            return [
                'disk' => 'public',
                'storage_type' => 'local',
                'allowed_file_types' => 'jpg,jpeg,png,webp,gif,pdf,doc,docx,csv,txt,zip,mp4,mp3,xlsx',
                'max_file_size_kb' => 10240,
                's3' => [],
                'wasabi' => [],
            ];
        }
    }
}
