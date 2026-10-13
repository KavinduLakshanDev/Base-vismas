<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Section;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use App\Models\Sequence;
use Illuminate\Support\Facades\Auth;

class StockTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_number',
        'from_section_code',
        'to_section_code',
        'item_id',
        'stock_id',
        'quantity',
        'cost_price',
        'transfer_date',
        'notes',
        'company_code',
        'batch_no',
        'brand',
        'model',
        'serial_number',
        'warranty',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'transfer_date' => 'date',
        'warranty' => 'string',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (empty($transfer->transfer_number)) {
                $transfer->transfer_number = Sequence::generateNextNumber('stock_transfer');
            }
        });
    }

    // Relationships
    public function fromSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'from_section_code', 'section_code');
    }

    public function toSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'to_section_code', 'section_code');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'item_id', 'ItmKy');
    }

    // Method to perform the transfer (update stock_in_hand records)
    public function executeTransfer(): bool
    {
        // Note: This method is called within a transaction from the controller
        // No need for nested transactions or additional stock checks since validation
        // with locking already happened in the controller

        $userId = Auth::id() ?? 0;

        // Get the source stock record details
        $sourceStock = DB::table('stock_in_hand')->where('TableKy', $this->stock_id)->first();

        // Create OUT record for source section instead of decrementing
        DB::table('stock_in_hand')->insert([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'RefNo' => 'TRF-OUT-' . $this->id,
            'company_code' => $this->company_code,
            'section_code' => $this->from_section_code,
            'OrdDate' => $this->transfer_date,
            'ItemKy' => $this->item_id,
            'batch_no' => $sourceStock->batch_no,
            'brand' => $sourceStock->brand,
            'model' => $sourceStock->model,
            'serial_number' => $sourceStock->serial_number,
            'warranty' => $sourceStock->warranty,
            'Qty' => -$this->quantity,
            'FreeQty' => 0,
            'TrnTyp' => 'OUT',
            'OrdKy' => $this->id,
            'StkKy' => null,
            'OrdTypKy' => null,
            'CounterID' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Always create a new batch record in destination section
        DB::table('stock_in_hand')->insert([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'RefNo' => 'TRF-IN-' . $this->id,
            'company_code' => $this->company_code,
            'section_code' => $this->to_section_code,
            'OrdDate' => $this->transfer_date,
            'ItemKy' => $this->item_id,
            'batch_no' => $sourceStock->batch_no,
            'brand' => $sourceStock->brand,
            'model' => $sourceStock->model,
            'serial_number' => $sourceStock->serial_number,
            'warranty' => $sourceStock->warranty,
            'Qty' => $this->quantity,
            'FreeQty' => 0,
            'TrnTyp' => 'IN',
            'OrdKy' => $this->id,
            'StkKy' => null,
            'OrdTypKy' => null,
            'CounterID' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return true;
    }
}