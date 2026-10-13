<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    protected $table = 'media';

    protected $fillable = [
        'model_type',
        'model_id',
        'uuid',
        'collection_name',
        'name',
        'file_name',
        'mime_type',
        'disk',
        'conversions_disk',
        'size',
        'manipulations',
        'custom_properties',
        'generated_conversions',
        'responsive_images',
        'order_column',
        'directory_id',
        'creator_id',
        'created_by',
    ];

    protected $casts = [
        'manipulations' => 'array',
        'custom_properties' => 'array',
        'generated_conversions' => 'array',
        'responsive_images' => 'array',
        'size' => 'integer',
        'order_column' => 'integer',
    ];

    protected $appends = [
        'url',
        'thumb_url',
    ];

    public function directory(): BelongsTo
    {
        return $this->belongsTo(MediaDirectory::class, 'directory_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getUrlAttribute(): string
    {
        $disk = $this->disk ?: config('filesystems.default', 'public');
        try {
            if ($disk === 'public' || $disk === 'local') {
                return asset('storage/media/' . $this->file_name);
            }
            return Storage::disk($disk)->url('media/' . $this->file_name);
        } catch (\Exception $e) {
            return asset('storage/media/' . $this->file_name);
        }
    }

    public function getThumbUrlAttribute(): string
    {
        return $this->url;
    }

    public function getPath(): string
    {
        $disk = $this->disk ?: config('filesystems.default', 'public');
        return Storage::disk($disk)->path('media/' . $this->file_name);
    }
}
