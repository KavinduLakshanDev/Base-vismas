<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'is_public',
        'created_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function set(string $key, $value, bool $isPublic = true, ?int $createdBy = null)
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'is_public' => $isPublic,
                'created_by' => $createdBy,
            ]
        );
    }
}
