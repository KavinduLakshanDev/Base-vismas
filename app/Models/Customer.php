<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'address';

    protected $primaryKey = 'AdrKy';

    protected $fillable = [
        'company_code',
        'section_code',
        'AdrCd',
        'CtPerson',
        'FstNm',
        'MidNm',
        'LstNm',
        'IDNo',
        'Title',
        'Address',
        'Town',
        'City',
        'Country',
        'AdrTypKy',
        'TP1',
        'TP3',
        'Fax',
        'Email',
        'Website',
        'AccKy',
        'uuid',
        'Status',
        'fVATRegistered',
        'VATNo',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'fVATRegistered' => 'boolean',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        // static::addGlobalScope('customer', function (Builder $builder) {
        //     $builder->where('AdrTypKy', 1);
        // });
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(AccMas::class, 'AccKy', 'AccKy');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_code', 'company_code');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Section::class, 'section_code', 'section_code');
    }

    public function getCustomerTypeAttribute()
    {
        return $this->account?->AccTyp;
    }
}