<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'level',
        'company_code',
        'section_code',
        'is_system_role',
        'uuid',
    ];

    protected $casts = [
        'is_system_role' => 'boolean',
    ];

    protected $with = ['permissions'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_code', 'section_code');
    }

    public function users(): HasMany
    {
        // Users have a role_id column on users table, not a role_user pivot table
        return $this->hasMany(User::class, 'role_id', 'id');
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id')
                    ->withTimestamps();
    }
}
