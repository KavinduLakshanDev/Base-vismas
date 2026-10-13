<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ItemMaster extends Model
{
    use HasFactory;

    protected $table = 'itemmaster';

    protected $primaryKey = 'ItmKy';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'ItmKy',
        'batch_no',
        'ItemCode',
        'ItmNm',
        'EnglishName',
        'PartNo',
        'ItmGrp',
        'Unit',
        
        'CosPri',
        'SlsPri',
        'BatchNo',
        'MfgDate',
        'ExpDate',
        'BalQty',
        'company_code',
        'section_code',
        'Status',
        'InUse',
        'RtQty3',
        'RtDis3',
        'RtQty4',
        'RtDis4',
        'DiscountQty',
        'QuntityDiscount',
        'CCPrice',
        'WithDates',
        'VATItem',
        'DoProcess',
        'DoRound',
        'ProcessRatio',
        'OrderNo',
        'uuid',
        'BarCode',
        'catkey',
        'brand_id',
        'UnitKy',
        'NCostPrice',
        'ExtraPrice',
        'WholePrice',
        'ReOrdlLvl',
        'ScallItem',
        'SupKey',
        'warranty',
    ];

    protected $casts = [
        'CosPri' => 'decimal:4',
        'SlsPri' => 'decimal:4',
        'BalQty' => 'decimal:4',
        'NCostPrice' => 'decimal:4',
        'ExtraPrice' => 'decimal:4',
        'WholePrice' => 'decimal:4',
        'RtDis1' => 'decimal:4',
        'RtDis2' => 'decimal:4',
        'RtDis3' => 'decimal:4',
        'RtDis4' => 'decimal:4',
        'QuntityDiscount' => 'decimal:4',
        'CCPrice' => 'decimal:4',
        'ProcessRatio' => 'decimal:4',
        'MfgDate' => 'date',
        'ExpDate' => 'date',
        'fInAct' => 'boolean',
        'ScallItem' => 'boolean',
        'WithDates' => 'boolean',
        'VATItem' => 'boolean',
        'DoProcess' => 'boolean',
        'DoRound' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(CodeMaster::class, 'catkey', 'catkey');
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

    public function priceDetails()
    {
        return $this->hasMany(ItemPriceDet::class, 'ItmKy', 'ItmKy');
    }

    public function stockInHand()
    {
        return $this->hasMany(StockInHand::class, 'ItemKy', 'ItmKy');
    }

    /**
     * Scope for active items
     */
    public function scopeActive($query)
    {
        return $query->where('Status', 'A');
    }

    /**
     * Scope for items in use
     */
    public function scopeInUse($query)
    {
        return $query->where('InUse', 'Y');
    }

    /**
     * Scope for company
     */
    public function scopeForCompany($query, $companyCode)
    {
        return $query->where('company_code', $companyCode);
    }

    /**
     * Scope for section
     */
    public function scopeForSection($query, $sectionCode)
    {
        return $query->where('section_code', $sectionCode);
    }
}