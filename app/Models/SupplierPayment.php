<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_no',
        'supplier_id',
        'supplier_code',
        'supplier_name',
        'supplier_address',
        'supplier_tel',
        'payment_method',
        'paid_amount',
        'payment_date',
        'cheque_no',
        'cheque_date',
        'cheque_account_no',
        'cheque_bank_name',
        'branch',
        'bank_name',
        'bank_reference_no',
        'bank_deposit_date',
        'bank_account_no',
        'transfer_bank_name',
        'transfer_transaction_id',
        'transfer_date',
        'transfer_reference_no',
        'notes',
        'status',
        'company_code',
        'section_code',
        'created_by',
    ];

    protected $casts = [
        'paid_amount' => 'decimal:2',
        'payment_date' => 'date',
        'cheque_date' => 'date',
        'bank_deposit_date' => 'date',
        'transfer_date' => 'date',
    ];

    /**
     * Relationship with supplier (Address table)
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'supplier_id', 'AdrKy');
    }

    /**
     * Generate a unique thread-safe payment number
     */
    public static function generatePaymentNo(): string
    {
        return 'SPY-' . now()->format('YmdHis') . '-' . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }
}
