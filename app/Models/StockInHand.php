<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockInHand extends Model
{
    use HasFactory;

    protected $table = 'stock_in_hand';
    protected $primaryKey = 'TableKy';

    protected $fillable = [
        'company_code',
        'section_code',
        'RefNo',
        'Cky',
        'OrdDate',
        'ItemKy',
        'Qty',
        'FreeQty',
        'TrnTyp',
        'OrdKy',
        'StkKy',
        'OrdTypKy',
        'CounterID',
        'batch_no',
        'brand',
        'model',
        'serial_number',
        'warranty',
        'uuid',
    ];

    protected $casts = [
        'OrdDate' => 'date',
        'Qty' => 'decimal:2',
        'FreeQty' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    /**
     * Get the company that owns the stock record.
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'Cky', 'id');
    }

    /**
     * Get the item associated with this stock record.
     */
    public function item()
    {
        return $this->belongsTo(Product::class, 'ItemKy', 'ItmKy');
    }

    /**
     * Get the section associated with this stock record.
     */
    public function section()
    {
        return $this->belongsTo(Section::class, 'section_code', 'section_code');
    }
}