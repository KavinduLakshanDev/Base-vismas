# Batch Number System Implementation Guide

## Overview
This implementation adds support for multiple batches per product in the Distribution System. Each product can now have multiple batches, and each batch can have its own price history.

## Database Changes

### 1. itemmaster Table
- **Renamed Column**: `branch_code` → `section_code`
- **Added Column**: `batch_no` (VARCHAR(50))
- **Primary Key**: Changed from `ItmKy` alone to composite key `(ItmKy, batch_no)`
- **Indexes Added**:
  - `idx_itemcode_batch` on `(ItemCode, batch_no)`
  - `idx_company_section_batch` on `(company_code, section_code, batch_no)`

### 2. item_price_det Table
- **Renamed Column**: `branch_code` → `section_code`
- **Added Column**: `batch_no` (VARCHAR(50))
- **Indexes Added**:
  - `idx_itmky_batch` on `(ItmKy, batch_no)`
  - `idx_company_section_batch_price` on `(company_code, section_code, batch_no)`

## Migration Files Created

1. **2026_01_01_000001_add_batch_no_to_itemmaster.php**
   - Renames `branch_code` to `section_code`
   - Adds `batch_no` column
   - Creates composite primary key
   - Adds performance indexes

2. **2026_01_01_000002_add_batch_no_to_item_price_det.php**
   - Renames `branch_code` to `section_code`
   - Adds `batch_no` column
   - Adds performance indexes

3. **2026_01_01_000003_update_existing_batch_data.php**
   - Updates existing records with default batch_no value ('DEFAULT')
   - Ensures data integrity after schema changes

## Model Changes

### Product Model (app/Models/Product.php)
```php
// Composite primary key
protected $primaryKey = ['ItmKy', 'batch_no'];
public $incrementing = false;

// New fillable fields
'ItmKy', 'batch_no', 'section_code'

// New relationships
itemPriceDet()           // Prices for this specific batch
allPriceDetails()        // All prices across all batches
priceDetailsForBatch()   // Prices for a specific batch

// Composite key handling methods
getKey()
getKeyName()
setKeysForSaveQuery()
getKeyForSaveQuery()
```

### ItemPriceDet Model (app/Models/ItemPriceDet.php)
```php
// New fillable fields
'batch_no', 'section_code'

// New scopes
scopeForBatch()              // Filter by batch number
scopeForItemAndBatch()       // Filter by item and batch
scopeLatestPriceForItemAndBatch() // Get latest price for item+batch

// Updated relationships
product()    // Now filters by both ItmKy and batch_no
section()    // Replaces branch() relationship
```

## Running the Migrations

Execute these commands in order:

```powershell
# Step 1: Run the migrations
php artisan migrate

# Step 2: If you encounter any errors, you can rollback and retry
php artisan migrate:rollback --step=3
php artisan migrate

# Step 3: Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

## Key Concepts

### 1. Batch System Logic
- Each product (ItemCode) can have multiple batches
- Each batch is identified by: `ItmKy + batch_no`
- If no batch is specified, 'DEFAULT' is used automatically
- Each batch can have its own price history in `item_price_det`

### 2. Price History per Batch
- Previously: One item → Multiple price records (time-based)
- Now: One item + One batch → Multiple price records (time-based)
- This allows tracking different prices for different batches of the same product

### 3. Section Code
- Replaces the term "branch_code" with "section_code"
- More accurate terminology for organizational hierarchy
- Maintains backward compatibility through migration

## Example Usage

### Creating a Product with Batch
```php
$product = Product::create([
    'ItemCode' => 'ITEM001',
    'ItmNm' => 'Test Product',
    'batch_no' => 'BATCH001',
    'section_code' => 'SEC001',
    // ... other fields
]);
```

### Creating Price Details for a Batch
```php
ItemPriceDet::create([
    'ItmKy' => $product->ItmKy,
    'batch_no' => 'BATCH001',
    'SlsPri' => 100.00,
    'CosPri' => 80.00,
    'section_code' => 'SEC001',
    // ... other fields
]);
```

### Querying Price Details
```php
// Get latest price for a specific batch
$latestPrice = ItemPriceDet::latestPriceForItemAndBatch($itmKy, 'BATCH001');

// Get all prices for a product across all batches
$allPrices = ItemPriceDet::where('ItmKy', $itmKy)->get();

// Get prices for specific batch
$batchPrices = ItemPriceDet::forItemAndBatch($itmKy, 'BATCH001')->get();
```

## Controller Updates Needed

The ProductController will need updates to:
1. Handle `batch_no` input in create/update forms
2. Update queries to include `batch_no` in where clauses
3. Save `batch_no` when creating price records
4. Display batch information in lists and details
5. Handle composite primary key in route parameters

## Frontend Updates Needed

### Forms
- Add `batch_no` input field to product create/edit forms
- Add batch selector when viewing price history
- Show batch information in product lists

### Display
- Show batch number in product cards/tables
- Group price history by batch
- Add batch filter in search/filter options

## Testing Checklist

- [ ] Create product without batch (should use 'DEFAULT')
- [ ] Create product with custom batch number
- [ ] Create multiple batches for same product
- [ ] Add price records for different batches
- [ ] View price history filtered by batch
- [ ] Update product details for specific batch
- [ ] Search/filter products by batch
- [ ] Verify composite primary key constraints
- [ ] Test section_code functionality
- [ ] Verify existing data migration

## Rollback Plan

If issues occur:

```powershell
# Rollback migrations
php artisan migrate:rollback --step=3

# This will:
# 1. Restore single primary key on itemmaster
# 2. Rename section_code back to branch_code
# 3. Remove batch_no columns
# 4. Drop added indexes
```

## Notes

1. **Backward Compatibility**: Existing records will automatically get 'DEFAULT' as batch_no
2. **Performance**: Added indexes ensure queries remain fast even with batch filtering
3. **Data Integrity**: Composite primary key ensures no duplicate item+batch combinations
4. **Flexibility**: System supports both single-batch and multi-batch workflows

## Next Steps

1. Run migrations
2. Update ProductController (see separate controller update file)
3. Update frontend forms and displays
4. Test thoroughly in development environment
5. Update API endpoints to handle batch_no parameter
6. Update documentation for end users
