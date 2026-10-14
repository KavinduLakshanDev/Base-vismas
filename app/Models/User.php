<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'username',
        'email',
        'password',
        'previous_password1',
        'previous_password2',
        'previous_password3',
        'first_name',
        'last_name',
        'phone',
        'user_type',
        'company_code',
        'section_code',
        'role_id',
        'avatar_url',
        'is_active',
        'is_verified',
        'email_verified_at',
        'last_login_at',
        'last_login_ip',
        'failed_login_attempts',
        'locked_until',
        'password_reset_token',
        'storage_limit',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'is_verified' => 'boolean',
            'last_login_at' => 'datetime',
            'locked_until' => 'datetime',
        ];
    }

    public function getCompanyCodeAttribute($value)
    {
        if ($this->user_type === 'super_admin') {
            return session('active_company_code', $value);
        }
        return $value;
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_code', 'company_code');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_code', 'section_code');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function getTypeAttribute()
    {
        return $this->user_type;
    }

    public function hasPermissionTo($permission)
    {
        return $this->hasPermission($permission);
    }

    public function hasPermission($permissionSlug)
    {
        if (in_array($this->user_type, ['super_admin', 'superadmin', 'super admin'])) {
            return true;
        }

        if (!$this->role) {
            return false;
        }

        if (in_array($this->role->level, ['super_admin', 'superadmin', 'super admin', 'company_admin'])) {
            return true;
        }

        if (!$this->relationLoaded('role.permissions')) {
            $this->loadMissing('role.permissions');
        }

        $permissions = $this->role->permissions ?? collect();

        // Direct check
        if ($permissions->contains('slug', $permissionSlug) || $permissions->contains('name', $permissionSlug)) {
            return true;
        }

        // Bridge hyphenated and dot notation
        if (str_contains($permissionSlug, '-')) {
            [$action, $resource] = explode('-', $permissionSlug, 2);
            if ($permissions->contains('slug', "{$resource}.{$action}")) {
                return true;
            }
            if ($action === 'manage' && $permissions->contains('slug', "{$resource}.view")) {
                return true;
            }
        } elseif (str_contains($permissionSlug, '.')) {
            [$resource, $action] = explode('.', $permissionSlug, 2);
            if ($permissions->contains('slug', "{$action}-{$resource}")) {
                return true;
            }
            if ($action === 'view' && $permissions->contains('slug', "manage-{$resource}")) {
                return true;
            }
        }

        return false;
    }

    public function isSuperAdmin()
    {
        return in_array($this->user_type, ['super_admin', 'superadmin', 'super admin']);
    }
}
