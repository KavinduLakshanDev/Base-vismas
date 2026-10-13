<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CustomerPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'customer_code',
        'amount',
        'date',
        'method',
        'cheque_no',
        'bank_name',
        'branch',
        'card_last_4',
        'card_auth_code',
        'reference',
        'cheque_date',
        'transfer_date',
        'notes',
        'status',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'AdrKy');
    }
}
