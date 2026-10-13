<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class DynamicStorageService
{
    /**
     * Configure dynamic storage disks based on settings
     */
    public static function configureDynamicDisks(): void
    {
        try {
            $config = StorageConfigService::getStorageConfig();

            // Configure S3 disk if credentials exist
            if (!empty($config['s3']['key']) && !empty($config['s3']['secret'])) {
                self::configureS3Disk($config['s3']);
            }

            // Configure Wasabi disk if credentials exist
            if (!empty($config['wasabi']['key']) && !empty($config['wasabi']['secret'])) {
                self::configureWasabiDisk($config['wasabi']);
            }
        } catch (\Exception $e) {
            Log::error('Failed to configure dynamic storage disks', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private static function configureS3Disk(array $s3Config): void
    {
        Config::set('filesystems.disks.s3.key', $s3Config['key']);
        Config::set('filesystems.disks.s3.secret', $s3Config['secret']);
        Config::set('filesystems.disks.s3.region', $s3Config['region'] ?? 'us-east-1');
        Config::set('filesystems.disks.s3.bucket', $s3Config['bucket']);
        if (!empty($s3Config['endpoint'])) {
            Config::set('filesystems.disks.s3.endpoint', $s3Config['endpoint']);
        }
        if (!empty($s3Config['url'])) {
            Config::set('filesystems.disks.s3.url', $s3Config['url']);
        }
    }

    private static function configureWasabiDisk(array $wasabiConfig): void
    {
        Config::set('filesystems.disks.wasabi', [
            'driver' => 's3',
            'key' => $wasabiConfig['key'],
            'secret' => $wasabiConfig['secret'],
            'region' => $wasabiConfig['region'] ?? 'us-east-1',
            'bucket' => $wasabiConfig['bucket'],
            'endpoint' => $wasabiConfig['endpoint'] ?: 'https://s3.wasabisys.com',
        ]);
    }
}
