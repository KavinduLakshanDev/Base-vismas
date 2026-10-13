<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $table = 'itemmaster';

    protected $primaryKey = 'ItmKy';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'ItmKy',
        'fInAct',
        'Status',
        'company_code',
        'section_code',
        'ItemCode',
        'BarCode',
        'batch_no',
        'brand_id',
        'warranty',
        'ItmNm',
        'catkey',
        'UnitKy',
        'CosPri',
        'NCostPrice',
        'ExtraPrice',
        'WholePrice',
        'ReOrdlLvl',
        'ScallItem',
        'SupKey',
        'RtQty1',
        'RtDis1',
        'RtQty2',
        'RtDis2',
        'RtQty3',
        'RtDis3',
        'RtQty4',
        'RtDis4',
     
        'CCPrice',
        'SlsPri',
   
        'VATItem',
        'uuid',
    ];

    protected $casts = [
        'fInAct' => 'boolean',
        'ScallItem' => 'boolean',
        'VATItem' => 'boolean',
        'CosPri' => 'decimal:2',
        'NCostPrice' => 'decimal:2',
        'ExtraPrice' => 'decimal:2',
        'WholePrice' => 'decimal:2',
        'RtDis1' => 'decimal:2',
        'RtDis2' => 'decimal:2',
        'RtDis3' => 'decimal:2',
        'RtDis4' => 'decimal:2',
        'CCPrice' => 'decimal:2',
        'SlsPri' => 'decimal:2',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            
            // Auto-generate ItmKy if not provided
            if (empty($model->ItmKy)) {
                $maxItmKy = static::max('ItmKy');
                $model->ItmKy = $maxItmKy ? $maxItmKy + 1 : 1;
            }
        });
    }

    public function controllerMaster()
    {
        return $this->belongsTo(ControlMaster::class, 'controller_master_id');
    }
    
    public function category()
    {
        return $this->belongsTo(CodeMaster::class, 'catkey', 'catkey')
            ->where('conkey', 'CAT');
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function supplier()
    {
        return $this->belongsTo(AccMas::class, 'SupKey', 'AccKy');
    }

    public function unit()
    {
        return $this->belongsTo(CodeMaster::class, 'UnitKy', 'id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_code', 'company_code');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_code', 'section_code');
    }

    /**
     * Get price details for this specific product and batch combination
     */
    public function itemPriceDet()
    {
        return $this->hasMany(ItemPriceDet::class, 'ItmKy', 'ItmKy')
            ->latest('ChangedDate');
    }

    /**
     * Get stock in hand records for this product
     */
    public function stockInHand()
    {
        return $this->hasMany(StockInHand::class, 'ItemKy', 'ItmKy');
    }

    /**
     * Get all price details for this product across all batches
     */
    public function allPriceDetails()
    {
        return $this->hasMany(ItemPriceDet::class, 'ItmKy', 'ItmKy')
            ->latest('ChangedDate');
    }
    
    /**
     * Get price details for a specific batch
     */
    public function priceDetailsForBatch($batchNo)
    {
        return $this->hasMany(ItemPriceDet::class, 'ItmKy', 'ItmKy')
            ->latest('ChangedDate');
    }

    /**
     * Override getKey to handle composite primary key
     */
    public function getKey()
    {
        $keys = [];
        foreach ((array) $this->getKeyName() as $key) {
            $keys[$key] = $this->getAttribute($key);
        }
        return count($keys) === 1 ? reset($keys) : $keys;
    }

    /**
     * Override getKeyName to handle composite primary key
     */
    public function getKeyName()
    {
        return $this->primaryKey;
    }
    
    /**
     * Override setKeysForSaveQuery to handle composite primary key
     */
    protected function setKeysForSaveQuery($query)
    {
        $keys = $this->getKeyName();
        if (!is_array($keys)) {
            return parent::setKeysForSaveQuery($query);
        }

        foreach ($keys as $keyName) {
            $query->where($keyName, '=', $this->getKeyForSaveQuery($keyName));
        }

        return $query;
    }

    /**
     * Get the primary key value for a save query for composite keys
     */
    protected function getKeyForSaveQuery($keyName = null)
    {
        if (is_null($keyName)) {
            $keyName = $this->getKeyName();
        }

        if (isset($this->original[$keyName])) {
            return $this->original[$keyName];
        }

        return $this->getAttribute($keyName);
    }
}
