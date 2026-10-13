<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SalesTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'invoice_no',
        'transaction_date',
        'customer_code',
        'customer_name',
        'price_type',
        'section_code',
        'cashier_id',
        'customer_id',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'balance_amount',
        'vat_rate',
        'is_vat_invoice',
        'payment_details',
        'status',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'payment_details' => 'array',
        'completed_at' => 'timestamp',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'is_vat_invoice' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'AdrKy');
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesTransactionItem::class, 'sales_transaction_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(CustomerPayment::class, 'sales_transaction_id');
    }
}
