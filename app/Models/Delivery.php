<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_number',
        'delivery_route_id',
        'distributor_id',
        'status',
        'company_code',
        'customer_name',
        'customer_address',
        'customer_phone',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function deliveryRoute(): BelongsTo
    {
        return $this->belongsTo(DeliveryRoute::class);
    }

    public function distributor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'distributor_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_code', 'company_code');
    }
}