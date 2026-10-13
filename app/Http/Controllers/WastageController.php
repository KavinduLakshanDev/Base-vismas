<?php

namespace App\Http\Controllers;

use App\Models\ItemMaster;
use App\Models\Wastage;
use App\Models\StockInHand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WastageController extends Controller
{
    /**
     * Display a listing of the wastage records.
     */
    public function index()
    {
        $wastages = Wastage::with(['product', 'recordedBy', 'section'])
            ->latest()
            ->paginate(15)
            ->through(function ($wastage) {
                return [
                    'id' => $wastage->id,
                    'product_name' => $wastage->product->ItmNm ?? $wastage->category ?? 'N/A',
                    'category' => $wastage->category ?? 'N/A',
                    'quantity' => $wastage->quantity,
                    'unit' => $wastage->unit ?? 'Unit',
                    'cost_price' => $wastage->cost_price ?? 0,
                    'batch_no' => $wastage->batch_no,
                    'serial_number' => $wastage->serial_number,
                    'warranty' => $wastage->warranty,
                    'reason' => $wastage->reason,
                    'notes' => $wastage->notes,
                    'section_name' => $wastage->section->name ?? 'N/A',
                    'wastage_date' => $wastage->wastage_date,
                    'recorded_by' => $wastage->recordedBy->name ?? 'System',
                    'recorded_at' => $wastage->created_at->format('Y-m-d H:i'),
                    'status' => $wastage->status,
                ];
            });

        return Inertia::render('wastage/index', [
            'wastages' => $wastages,
        ]);
    }

    /**
     * Show the form for creating a new wastage record.
     */
    public function create()
    {
        // Get products from itemmaster table with pricing details
        $products = ItemMaster::select([
            'ItmKy as id',
            'ItmNm as name',
            'ItemCode as code',
            'BarCode as barcode',
            'catkey as category',
            'UnitKy as unit',
            'CosPri as cost_price',
            'SlsPri as sale_price',
            'WholePrice as wholesale_price',
        ])
        ->orderBy('ItmNm')
        ->get()
        ->map(function ($item) {
            // Get latest price details if available
            $latestPrice = DB::table('item_price_det')
                ->where('ItmKy', $item->id)
                ->where('Status', 'A')
                ->orderBy('ChangedDate', 'desc')
                ->first();

            // Note: Stock quantity is NOT shown here as it varies by batch and section
            // Use getProductBatches() API to get accurate batch-specific stock

            return [
                'id' => $item->id,
                'name' => $item->name,
                'code' => $item->code ?? '',
                'barcode' => $item->barcode ?? '',
                'category' => $item->category ?? 'N/A',
                'unit' => $item->unit ?? 'Unit',
                'cost_price' => $latestPrice->NCostPrice ?? $item->cost_price ?? 0,
                'sale_price' => $latestPrice->SlsPri ?? $item->sale_price ?? 0,
                'wholesale_price' => $latestPrice->WholePrice ?? $item->wholesale_price ?? 0,
                'purchase_price' => $latestPrice->CosPri ?? $item->cost_price ?? 0,
            ];
        });

        // Get all sections
        $sections = \App\Models\Section::orderByRaw('is_main_stock DESC, name ASC')
            ->get()
            ->map(function ($section) {
                return [
                    'id' => $section->id,
                    'section_code' => $section->section_code,
                    'name' => $section->name,
                ];
            });

        return Inertia::render('wastage/create', [
            'products' => $products,
            'sections' => $sections,
        ]);
    }

    /**
     * Store a newly created wastage record in storage (supports multiple items).
     */
    public function store(Request $request)
    {
        // Check if this is a multi-item request
        if ($request->has('items') && is_array($request->items)) {
            return $this->storeMultipleItems($request);
        }

        // Original single-item logic
        // Basic validation without product_id existence check (to allow orphaned items)
        $validated = $request->validate([
            'product_id' => 'required',
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
            'wastage_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'required|in:pending,approved,rejected',
            'serial_number' => 'nullable|string|max:255',
            'batch_no' => 'nullable|string|max:255',
            'warranty' => 'nullable|string|max:255',
            'section_id' => 'required|exists:sections,id',
        ]);

        // Product from itemmaster
        $productId = (int) $validated['product_id'];
        
        // Verify product exists
        $product = ItemMaster::where('ItmKy', $productId)->first();
        if (!$product) {
            return back()->withErrors(['product_id' => 'The selected product is invalid.']);
        }

        // Find specific stock record if serial number or batch number is provided
        $stockInHandId = null;
        
        if (!empty($validated['serial_number']) || !empty($validated['batch_no'])) {
            $stockQuery = StockInHand::where('ItemKy', $productId)
                ->where('Qty', '>', 0);
            
            if (!empty($validated['serial_number'])) {
                $stockQuery->where('serial_number', $validated['serial_number']);
            }
            if (!empty($validated['batch_no'])) {
                $stockQuery->where('batch_no', $validated['batch_no']);
            }
            
            $specificStock = $stockQuery->first();
            if ($specificStock) {
                $stockInHandId = $specificStock->TableKy;
            }
        }

        // Get section_code from section_id
        $section = \App\Models\Section::find($validated['section_id']);
        if (!$section) {
            return back()->withErrors(['section_id' => 'Invalid section selected.']);
        }
        $sectionCode = $section->section_code;

        // Validate available stock before creating wastage
        $availableStockQuery = StockInHand::where('ItemKy', $productId)
            ->where('section_code', $sectionCode);
        
        if (!empty($validated['serial_number'])) {
            $availableStockQuery->where('serial_number', $validated['serial_number']);
        }
        if (!empty($validated['batch_no'])) {
            $availableStockQuery->where('batch_no', $validated['batch_no']);
        }
        
        // Calculate available stock including free quantity
        $availableStock = $availableStockQuery
            ->selectRaw('SUM(Qty + COALESCE(FreeQty, 0)) as total')
            ->value('total') ?? 0;
        
        if ($validated['quantity'] > $availableStock) {
            $errorMsg = 'Insufficient stock. Available: ' . $availableStock;
            if (!empty($validated['batch_no']) || !empty($validated['serial_number'])) {
                $errorMsg .= ' for the selected batch/serial';
            }
            return back()->withErrors(['quantity' => $errorMsg])->withInput();
        }

        // Create wastage record
        $wastage = Wastage::create([
            'product_id' => $productId,
            'category' => $product->catkey ?? 'N/A',
            'quantity' => $validated['quantity'],
            'unit' => $product->UnitKy ?? 'Unit',
            'serial_number' => $validated['serial_number'] ?? null,
            'batch_no' => $validated['batch_no'] ?? null,
            'warranty' => $validated['warranty'] ?? null,
            'purchase_det_id' => null,
            'stock_in_hand_id' => $stockInHandId,
            'reason' => $validated['reason'],
            'wastage_date' => $validated['wastage_date'],
            'notes' => $validated['notes'],
            'status' => $validated['status'],
            'recorded_by' => Auth::id(),
            'section_id' => $validated['section_id'],
        ]);

        // Deduct from stock immediately (status is 'pending' by default)
        Log::info("Deducting stock for wastage", [
            'product_id' => $productId,
            'quantity' => $validated['quantity'],
            'serial_number' => $validated['serial_number'] ?? null,
            'batch_no' => $validated['batch_no'] ?? null,
            'stock_in_hand_id' => $stockInHandId,
            'section_code' => $sectionCode
        ]);
        
        $this->deductStock(
            $productId, 
            $validated['quantity'], 
            $sectionCode,
            $validated['serial_number'] ?? null,
            $validated['batch_no'] ?? null,
            $stockInHandId
        );

        return redirect()->route('wastages.index')
            ->with('success', 'Wastage record created successfully.');
    }

    /**
     * Store multiple wastage items at once.
     */
    private function storeMultipleItems(Request $request)
    {
        // Validate global fields and items array
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.cost_price' => 'required|numeric|min:0',
            'items.*.reason' => 'required|string|max:255',
            'items.*.serial_number' => 'nullable|string|max:255',
            'items.*.batch_no' => 'nullable|string|max:255',
            'items.*.warranty' => 'nullable|string|max:255',
            'wastage_date' => 'required|date',
            'status' => 'required|in:pending,approved,rejected',
            'section_id' => 'required|exists:sections,id',
        ]);

        // Get section details
        $section = \App\Models\Section::find($validated['section_id']);
        if (!$section) {
            return back()->withErrors(['section_id' => 'Invalid section selected.']);
        }
        $sectionCode = $section->section_code;

        $createdCount = 0;
        $errors = [];

        // Use database transaction to ensure all-or-nothing
        DB::beginTransaction();
        try {
            foreach ($validated['items'] as $index => $item) {
                try {
                    // Product from itemmaster
                    $productId = (int) $item['product_id'];
                    
                    // Verify product exists
                    $product = ItemMaster::where('ItmKy', $productId)->first();
                    if (!$product) {
                        $errors[] = "Item " . ($index + 1) . ": Invalid product.";
                        continue;
                    }

                    // Find specific stock record if serial number or batch number is provided
                    $stockInHandId = null;
                    
                    if (!empty($item['serial_number']) || !empty($item['batch_no'])) {
                        $stockQuery = StockInHand::where('ItemKy', $productId)
                            ->where('Qty', '>', 0);
                        
                        if (!empty($item['serial_number'])) {
                            $stockQuery->where('serial_number', $item['serial_number']);
                        }
                        if (!empty($item['batch_no'])) {
                            $stockQuery->where('batch_no', $item['batch_no']);
                        }
                        
                        $specificStock = $stockQuery->first();
                        if ($specificStock) {
                            $stockInHandId = $specificStock->TableKy;
                        }
                    }

                    // Validate available stock before creating wastage
                    $availableStockQuery = StockInHand::where('ItemKy', $productId)
                        ->where('section_code', $sectionCode);
                    
                    if (!empty($item['serial_number'])) {
                        $availableStockQuery->where('serial_number', $item['serial_number']);
                    }
                    if (!empty($item['batch_no'])) {
                        $availableStockQuery->where('batch_no', $item['batch_no']);
                    }
                    
                    // Calculate available stock including free quantity
                    $availableStock = $availableStockQuery
                        ->selectRaw('SUM(Qty + COALESCE(FreeQty, 0)) as total')
                        ->value('total') ?? 0;
                    
                    if ($item['quantity'] > $availableStock) {
                        $errorMsg = "Item " . ($index + 1) . ": Insufficient stock. Available: " . $availableStock;
                        if (!empty($item['batch_no']) || !empty($item['serial_number'])) {
                            $errorMsg .= ' for the selected batch/serial';
                        }
                        $errors[] = $errorMsg;
                        continue;
                    }

                    // Create wastage record
                    $wastage = Wastage::create([
                        'product_id' => $productId,
                        'category' => $product->catkey ?? 'N/A',
                        'quantity' => $item['quantity'],
                        'unit' => $product->UnitKy ?? 'Unit',
                        'cost_price' => $item['cost_price'],
                        'serial_number' => $item['serial_number'] ?? null,
                        'batch_no' => $item['batch_no'] ?? null,
                        'warranty' => $item['warranty'] ?? null,
                        'purchase_det_id' => null,
                        'stock_in_hand_id' => $stockInHandId,
                        'reason' => $item['reason'],
                        'wastage_date' => $validated['wastage_date'],
                        'notes' => null,
                        'status' => $validated['status'],
                        'recorded_by' => Auth::id(),
                        'section_id' => $validated['section_id'],
                    ]);

                    // Deduct from stock immediately (status is 'pending' by default)
                    Log::info("Deducting stock for multi-item wastage", [
                        'product_id' => $productId,
                        'quantity' => $item['quantity'],
                        'serial_number' => $item['serial_number'] ?? null,
                        'batch_no' => $item['batch_no'] ?? null,
                        'stock_in_hand_id' => $stockInHandId,
                        'section_code' => $sectionCode
                    ]);
                    
                    $this->deductStock(
                        $productId, 
                        $item['quantity'], 
                        $sectionCode,
                        $item['serial_number'] ?? null,
                        $item['batch_no'] ?? null,
                        $stockInHandId
                    );
                    
                    $createdCount++;
                } catch (\Exception $e) {
                    $errors[] = "Item " . ($index + 1) . ": " . $e->getMessage();
                    Log::error("Error creating wastage for item", [
                        'item' => $item,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // If any items were created successfully, commit the transaction
            if ($createdCount > 0) {
                DB::commit();
                $message = "{$createdCount} wastage record(s) created successfully.";
                if (!empty($errors)) {
                    $message .= " " . count($errors) . " item(s) failed: " . implode('; ', $errors);
                }
                return redirect()->route('wastages.index')->with('success', $message);
            } else {
                DB::rollBack();
                return back()->withErrors(['items' => 'No items could be created. ' . implode('; ', $errors)])->withInput();
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error in multi-item wastage creation", ['error' => $e->getMessage()]);
            return back()->withErrors(['items' => 'Error creating wastage records: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Display the specified wastage record.
     */
    public function show(string $id)
    {
        $wastage = Wastage::with(['product', 'recordedBy'])->findOrFail($id);

        return Inertia::render('wastage/show', [
            'wastage' => [
                'id' => $wastage->id,
                'product_name' => $wastage->product->ItmNm ?? 'N/A',
                'category' => $wastage->category ?? 'N/A',
                'quantity' => $wastage->quantity,
                'unit' => $wastage->unit ?? 'Unit',
                'reason' => $wastage->reason,
                'wastage_date' => $wastage->wastage_date->format('Y-m-d'),
                'notes' => $wastage->notes,
                'status' => $wastage->status,
                'recorded_by' => $wastage->recordedBy->name ?? 'System',
                'created_at' => $wastage->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $wastage->updated_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified wastage record.
     */
    public function edit(string $id)
    {
        $wastage = Wastage::findOrFail($id);
        
        $products = ItemMaster::select([
            'ItmKy as id',
            'ItmNm as name',
            'catkey as category',
            'UnitKy as unit',
        ])
        ->orderBy('ItmNm')
        ->get()
        ->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'category' => $item->category ?? 'N/A',
                'unit' => $item->unit ?? 'Unit',
            ];
        });

        // Get all sections
        $sections = \App\Models\Section::orderByRaw('is_main_stock DESC, name ASC')
            ->get()
            ->map(function ($section) {
                return [
                    'id' => $section->id,
                    'section_code' => $section->section_code,
                    'name' => $section->name,
                ];
            });

        return Inertia::render('wastage/edit', [
            'wastage' => $wastage,
            'products' => $products,
            'sections' => $sections,
        ]);
    }

    /**
     * Update the specified wastage record in storage.
     */
    public function update(Request $request, string $id)
    {
        $wastage = Wastage::findOrFail($id);
        $oldStatus = $wastage->status;
        $oldQuantity = $wastage->quantity;
        $oldProductId = $wastage->product_id;

        $validated = $request->validate([
            'product_id' => 'required|exists:itemmaster,ItmKy',
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
            'wastage_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'required|in:pending,approved,rejected',
            'serial_number' => 'nullable|string|max:255',
            'batch_no' => 'nullable|string|max:255',
            'warranty' => 'nullable|string|max:255',
            'section_id' => 'required|exists:sections,id',
        ]);

        // Get product details
        $product = ItemMaster::where('ItmKy', $validated['product_id'])->first();

        // Get section_code from section_id
        $section = \App\Models\Section::find($validated['section_id']);
        if (!$section) {
            return back()->withErrors(['section_id' => 'Invalid section selected.']);
        }
        $sectionCode = $section->section_code;

        // Find specific stock record if serial number or batch number is provided
        $stockInHandId = null;
        $purchaseDetId = null;
        
        if (!empty($validated['serial_number']) || !empty($validated['batch_no'])) {
            $stockQuery = StockInHand::where('ItemKy', $validated['product_id'])
                ->where('Qty', '>', 0);
            
            if (!empty($validated['serial_number'])) {
                $stockQuery->where('serial_number', $validated['serial_number']);
            }
            if (!empty($validated['batch_no'])) {
                $stockQuery->where('batch_no', $validated['batch_no']);
            }
            
            $specificStock = $stockQuery->first();
            if ($specificStock) {
                $stockInHandId = $specificStock->TableKy;
            }
        }

        // Validate available stock if status is approved or changing to approved
        if ($validated['status'] === 'approved') {
            $availableStockQuery = StockInHand::where('ItemKy', $validated['product_id'])
                ->where('section_code', $sectionCode);
            
            if (!empty($validated['serial_number'])) {
                $availableStockQuery->where('serial_number', $validated['serial_number']);
            }
            if (!empty($validated['batch_no'])) {
                $availableStockQuery->where('batch_no', $validated['batch_no']);
            }
            
            // Calculate available stock including free quantity
            $availableStock = $availableStockQuery
                ->selectRaw('SUM(Qty + COALESCE(FreeQty, 0)) as total')
                ->value('total') ?? 0;
            
            // If status was already approved, add back the old quantity to available stock
            if ($oldStatus === 'approved' && $oldProductId === $validated['product_id']) {
                $availableStock += $oldQuantity;
            }
            
            if ($validated['quantity'] > $availableStock) {
                $errorMsg = 'Insufficient stock. Available: ' . $availableStock;
                if (!empty($validated['batch_no']) || !empty($validated['serial_number'])) {
                    $errorMsg .= ' for the selected batch/serial';
                }
                return back()->withErrors(['quantity' => $errorMsg])->withInput();
            }
        }

        $wastage->update([
            'product_id' => $validated['product_id'],
            'category' => $product->catkey ?? 'N/A',
            'quantity' => $validated['quantity'],
            'unit' => $product->UnitKy ?? 'Unit',
            'serial_number' => $validated['serial_number'] ?? null,
            'batch_no' => $validated['batch_no'] ?? null,
            'warranty' => $validated['warranty'] ?? null,
            'stock_in_hand_id' => $stockInHandId,
            'reason' => $validated['reason'],
            'wastage_date' => $validated['wastage_date'],
            'notes' => $validated['notes'],
            'status' => $validated['status'],
            'section_id' => $validated['section_id'],
        ]);

        // Get old and new section codes
        $oldSection = \App\Models\Section::find($wastage->section_id);
        $oldSectionCode = $oldSection ? $oldSection->section_code : null;

        // Handle stock changes based on status change
        if ($oldStatus !== $validated['status']) {
            if ($validated['status'] === 'approved' && $oldStatus !== 'approved') {
                // Status changed to approved - deduct stock
                $this->deductStock(
                    $validated['product_id'], 
                    $validated['quantity'],
                    $sectionCode,
                    $validated['serial_number'] ?? null,
                    $validated['batch_no'] ?? null,
                    $stockInHandId
                );
            } elseif ($oldStatus === 'approved' && $validated['status'] !== 'approved') {
                // Status changed from approved to something else - restore stock
                $this->restoreStock(
                    $oldProductId, 
                    $oldQuantity,
                    $oldSectionCode,
                    $wastage->serial_number,
                    $wastage->batch_no,
                    $wastage->stock_in_hand_id
                );
            }
        } elseif ($validated['status'] === 'approved') {
            // Status is still approved but quantity or product changed
            if ($oldProductId !== $validated['product_id'] || $oldQuantity != $validated['quantity']) {
                // Restore old stock
                $this->restoreStock(
                    $oldProductId, 
                    $oldQuantity,
                    $oldSectionCode,
                    $wastage->serial_number,
                    $wastage->batch_no,
                    $wastage->stock_in_hand_id
                );
                // Deduct new stock
                $this->deductStock(
                    $validated['product_id'], 
                    $validated['quantity'],
                    $sectionCode,
                    $validated['serial_number'] ?? null,
                    $validated['batch_no'] ?? null,
                    $stockInHandId
                );
            }
        }

        return redirect()->route('wastages.index')
            ->with('success', 'Wastage record updated successfully.');
    }

    /**
     * Remove the specified wastage record from storage.
     */
    public function destroy(string $id)
    {
        $wastage = Wastage::findOrFail($id);
        
        // Restore stock for all wastages when deleted, regardless of status
        if ($wastage->product_id) {
            $section = \App\Models\Section::find($wastage->section_id);
            $sectionCode = $section ? $section->section_code : null;
            
            Log::info("Restoring stock before deleting wastage", [
                'wastage_id' => $wastage->id,
                'product_id' => $wastage->product_id,
                'quantity' => $wastage->quantity,
                'serial_number' => $wastage->serial_number,
                'batch_no' => $wastage->batch_no,
                'stock_in_hand_id' => $wastage->stock_in_hand_id,
                'section_code' => $sectionCode,
                'status' => $wastage->status
            ]);
            
            $this->restoreStock(
                $wastage->product_id, 
                $wastage->quantity,
                $sectionCode,
                $wastage->serial_number,
                $wastage->batch_no,
                $wastage->stock_in_hand_id
            );
        }
        
        $wastage->delete();

        return redirect()->route('wastages.index')
            ->with('success', 'Wastage record deleted successfully.');
    }

    /**
     * Search products by serial number from purchase details.
     */
    public function searchBySerial(Request $request)
    {
        $serialNumber = $request->input('serial_number');

        if (!$serialNumber) {
            return response()->json([]);
        }

        $results = collect();

        $stockItems = StockInHand::where('serial_number', 'LIKE', "%{$serialNumber}%")
            ->where('Qty', '>', 0)
            ->limit(20)
            ->get();

        foreach ($stockItems as $stock) {
            $product = ItemMaster::find($stock->ItemKy);
            if ($product) {
                $latestPrice = DB::table('item_price_det')
                    ->where('ItmKy', $product->ItmKy)
                    ->where('Status', 'A')
                    ->orderBy('ChangedDate', 'desc')
                    ->first();

                $results->push([
                    'id' => $product->ItmKy,
                    'name' => $product->ItmNm ?? 'Unknown Product',
                    'code' => $product->ItemCode ?? '',
                    'barcode' => $product->BarCode ?? '',
                    'category' => $product->catkey ?? 'N/A',
                    'unit' => $product->UnitKy ?? 'Unit',
                    'cost_price' => $latestPrice->NCostPrice ?? $product->CosPri ?? 0,
                    'sale_price' => $latestPrice->SlsPri ?? $product->SlsPri ?? 0,
                    'wholesale_price' => $latestPrice->WholePrice ?? $product->WholePrice ?? 0,
                    'purchase_price' => $latestPrice->CosPri ?? $product->CosPri ?? 0,
                    'serial_number' => $stock->serial_number,
                    'batch_no' => $stock->batch_no,
                    'warranty' => $stock->warranty,
                ]);
            }
        }

        return response()->json($results->values()->all());
    }

    /**
     * Unified search for products and serial numbers.
     */
    public function unifiedSearch(Request $request)
    {
        $term = $request->input('term');

        if (!$term) {
            return response()->json([]);
        }

        // Search for products by name, code, barcode
        $products = ItemMaster::select([
            'ItmKy as id', 'ItmNm as name', 'ItemCode as code', 'BarCode as barcode',
            'catkey as category', 'UnitKy as unit', 'CosPri as cost_price',
            'SlsPri as sale_price', 'WholePrice as wholesale_price',
        ])
        ->where(function ($query) use ($term) {
            $query->where('ItmNm', 'LIKE', "%{$term}%")
                  ->orWhere('ItemCode', 'LIKE', "%{$term}%")
                  ->orWhere('BarCode', 'LIKE', "%{$term}%");
        })
        ->orderBy('ItmNm')
        ->limit(10)
        ->get()
        ->map(function ($item) {
            $latestPrice = DB::table('item_price_det')
                ->where('ItmKy', $item->id)
                ->where('Status', 'A')
                ->orderBy('ChangedDate', 'desc')
                ->first();

            return [
                'id' => $item->id,
                'name' => $item->name,
                'code' => $item->code ?? '',
                'barcode' => $item->barcode ?? '',
                'category' => $item->category ?? 'N/A',
                'unit' => $item->unit ?? 'Unit',
                'cost_price' => $latestPrice->NCostPrice ?? $item->cost_price ?? 0,
                'sale_price' => $latestPrice->SlsPri ?? $item->sale_price ?? 0,
                'wholesale_price' => $latestPrice->WholePrice ?? $item->wholesale_price ?? 0,
                'purchase_price' => $latestPrice->CosPri ?? $item->cost_price ?? 0,
                'type' => 'product',
            ];
        });

        // Search for serial numbers
        $serialResults = $this->searchBySerialLogic($term);

        // Combine and return unique results
        $combined = $products->concat($serialResults)->unique('id')->values();

        return response()->json($combined);
    }

    private function searchBySerialLogic($serialNumber)
    {
        $results = collect();

        $stockItems = StockInHand::where('serial_number', 'LIKE', "%{$serialNumber}%")
            ->where('Qty', '>', 0)
            ->limit(10)
            ->get();

        foreach ($stockItems as $stock) {
            $product = ItemMaster::find($stock->ItemKy);
            if ($product) {
                $latestPrice = DB::table('item_price_det')
                    ->where('ItmKy', $product->ItmKy)
                    ->where('Status', 'A')
                    ->orderBy('ChangedDate', 'desc')
                    ->first();

                $results->push([
                    'id' => $product->ItmKy,
                    'name' => $product->ItmNm,
                    'code' => $product->ItemCode ?? '',
                    'barcode' => $product->BarCode ?? '',
                    'category' => $product->catkey ?? 'N/A',
                    'unit' => $product->UnitKy ?? 'Unit',
                    'cost_price' => $latestPrice->NCostPrice ?? $product->CosPri ?? 0,
                    'sale_price' => $latestPrice->SlsPri ?? $product->SlsPri ?? 0,
                    'wholesale_price' => $latestPrice->WholePrice ?? $product->WholePrice ?? 0,
                    'purchase_price' => $latestPrice->CosPri ?? $product->CosPri ?? 0,
                    'serial_number' => $stock->serial_number,
                    'batch_no' => $stock->batch_no,
                    'warranty' => $stock->warranty,
                    'type' => 'serial',
                ]);
            }
        }

        return $results;
    }

    /**
     * Calculate total available stock for a product from stock_in_hand
     */
    private function calculateStock($productId)
    {
        return StockInHand::where('ItemKy', $productId)
            ->selectRaw('SUM(Qty + COALESCE(FreeQty, 0)) as total')
            ->value('total') ?? 0;
    }

    /**
     * Get available batches for a product with stock quantities
     */
    public function getProductBatches(Request $request)
    {
        $productId = $request->input('product_id');
        $sectionId = $request->input('section_id');

        if (!$productId) {
            return response()->json([]);
        }

        // Get section_code from section_id
        $sectionCode = null;
        if ($sectionId) {
            $section = \App\Models\Section::find($sectionId);
            $sectionCode = $section ? $section->section_code : null;
        }

        // Query stock_in_hand for ALL transactions of this product
        // We need to include both positive and negative transactions to calculate NET stock
        $batchesQuery = StockInHand::where('ItemKy', $productId);

        if ($sectionCode) {
            $batchesQuery->where('section_code', $sectionCode);
        }

        // Group by batch_no and sum quantities (including negative transactions)
        // Use COALESCE to handle NULL batch_no as 'N/A'
        $batches = $batchesQuery
            ->select(
                DB::raw('COALESCE(batch_no, "N/A") as batch_no'),
                DB::raw('GROUP_CONCAT(DISTINCT serial_number SEPARATOR ", ") as serial_number'),
                DB::raw('GROUP_CONCAT(DISTINCT brand SEPARATOR ", ") as brand'),
                DB::raw('GROUP_CONCAT(DISTINCT model SEPARATOR ", ") as model'),
                DB::raw('GROUP_CONCAT(DISTINCT warranty SEPARATOR ", ") as warranty'),
                DB::raw('SUM(Qty + COALESCE(FreeQty, 0)) as total_quantity'),
                DB::raw('MAX(OrdDate) as last_date')
            )
            ->groupBy(DB::raw('COALESCE(batch_no, "N/A")'))
            ->havingRaw('SUM(Qty + COALESCE(FreeQty, 0)) > 0') // Only show batches with positive net stock
            ->orderBy('last_date', 'desc')
            ->get()
            ->map(function ($batch) {
                // Clean up concatenated values - remove NULLs and empty strings
                $serialNumbers = array_filter(explode(', ', $batch->serial_number ?? ''), function($v) {
                    return $v !== '' && $v !== null && strtolower($v) !== 'null';
                });
                $brands = array_filter(explode(', ', $batch->brand ?? ''), function($v) {
                    return $v !== '' && $v !== null && strtolower($v) !== 'null';
                });
                $models = array_filter(explode(', ', $batch->model ?? ''), function($v) {
                    return $v !== '' && $v !== null && strtolower($v) !== 'null';
                });
                $warranties = array_filter(explode(', ', $batch->warranty ?? ''), function($v) {
                    return $v !== '' && $v !== null && strtolower($v) !== 'null';
                });
                
                return [
                    'batch_no' => $batch->batch_no === 'N/A' ? null : $batch->batch_no,
                    'serial_number' => !empty($serialNumbers) ? implode(', ', $serialNumbers) : null,
                    'available_quantity' => (float) $batch->total_quantity,
                    'brand' => !empty($brands) ? implode(', ', $brands) : null,
                    'model' => !empty($models) ? implode(', ', $models) : null,
                    'warranty' => !empty($warranties) ? implode(', ', $warranties) : null,
                    'last_date' => $batch->last_date,
                ];
            });

        return response()->json($batches);
    }

    /**
     * Deduct quantity from stock_in_hand for the given product.
     * Creates a new negative transaction record.
     */
    private function deductStock($productId, $quantity, $sectionCode, $serialNumber = null, $batchNo = null, $stockInHandId = null)
    {
        DB::transaction(function () use ($productId, $quantity, $sectionCode, $serialNumber, $batchNo, $stockInHandId) {
            // Get reference stock record for company info
            $referenceStock = null;
            
            if ($stockInHandId) {
                $referenceStock = StockInHand::where('TableKy', $stockInHandId)->first();
            }
            
            if (!$referenceStock && ($serialNumber || $batchNo)) {
                $query = StockInHand::where('ItemKy', $productId)
                    ->where('section_code', $sectionCode);
                if ($serialNumber) {
                    $query->where('serial_number', $serialNumber);
                }
                if ($batchNo) {
                    $query->where('batch_no', $batchNo);
                }
                $referenceStock = $query->orderBy('TableKy', 'desc')->first();
            }
            
            if (!$referenceStock) {
                $referenceStock = StockInHand::where('ItemKy', $productId)
                    ->where('section_code', $sectionCode)
                    ->orderBy('TableKy', 'desc')
                    ->first();
            }
            
            // Get company info (section_code is now explicitly passed)
            $companyCode = $referenceStock->company_code ?? session('company_code') ?? optional(Auth::user())->company_code ?? null;
            $companyId = $referenceStock->Cky ?? session('company_id') ?? optional(Auth::user())->company_id ?? null;
            
            // Create new NEGATIVE transaction record for wastage deduction
            $newStock = StockInHand::create([
                'company_code' => $companyCode,
                'section_code' => $sectionCode,
                'Cky' => $companyId,
                'OrdDate' => now()->toDateString(),
                'ItemKy' => $productId,
                'Qty' => -$quantity, // NEGATIVE quantity for deduction
                'FreeQty' => 0,
                'TrnTyp' => 'WASTAGE',
                'serial_number' => $serialNumber,
                'batch_no' => $batchNo,
                'brand' => $referenceStock->brand ?? null,
                'model' => $referenceStock->model ?? null,
                'warranty' => $referenceStock->warranty ?? null,
            ]);
            
            Log::info("Stock wastage deduction record created", [
                'product_id' => $productId,
                'table_ky' => $newStock->TableKy,
                'qty' => -$quantity,
                'serial_number' => $serialNumber,
                'batch_no' => $batchNo,
                'stock_in_hand_id' => $stockInHandId
            ]);
        });
    }

    /**
     * Restore quantity to stock_in_hand for the given product.
     * Creates a new positive transaction record to reverse the wastage.
     */
    private function restoreStock($productId, $quantity, $sectionCode, $serialNumber = null, $batchNo = null, $stockInHandId = null)
    {
        DB::transaction(function () use ($productId, $quantity, $sectionCode, $serialNumber, $batchNo, $stockInHandId) {
            // Get reference stock record for company info
            $referenceStock = null;
            
            if ($stockInHandId) {
                $referenceStock = StockInHand::where('TableKy', $stockInHandId)->first();
            }
            
            if (!$referenceStock && ($serialNumber || $batchNo)) {
                $query = StockInHand::where('ItemKy', $productId)
                    ->where('section_code', $sectionCode);
                if ($serialNumber) {
                    $query->where('serial_number', $serialNumber);
                }
                if ($batchNo) {
                    $query->where('batch_no', $batchNo);
                }
                $referenceStock = $query->orderBy('TableKy', 'desc')->first();
            }
            
            if (!$referenceStock) {
                $referenceStock = StockInHand::where('ItemKy', $productId)
                    ->where('section_code', $sectionCode)
                    ->orderBy('TableKy', 'desc')
                    ->first();
            }
            
            // Get company info (section_code is now explicitly passed)
            $companyCode = $referenceStock->company_code ?? session('company_code') ?? optional(Auth::user())->company_code ?? null;
            $companyId = $referenceStock->Cky ?? session('company_id') ?? optional(Auth::user())->company_id ?? null;
            
            // Create new POSITIVE transaction record to restore stock
            $newStock = StockInHand::create([
                'company_code' => $companyCode,
                'section_code' => $sectionCode,
                'Cky' => $companyId,
                'OrdDate' => now()->toDateString(),
                'ItemKy' => $productId,
                'Qty' => $quantity, // POSITIVE quantity to restore
                'FreeQty' => 0,
                'TrnTyp' => 'WST_RESTO',
                'serial_number' => $serialNumber,
                'batch_no' => $batchNo,
                'brand' => $referenceStock->brand ?? null,
                'model' => $referenceStock->model ?? null,
                'warranty' => $referenceStock->warranty ?? null,
            ]);
            
            Log::info("Stock wastage restoration record created", [
                'product_id' => $productId,
                'table_ky' => $newStock->TableKy,
                'qty' => $quantity,
                'serial_number' => $serialNumber,
                'batch_no' => $batchNo,
                'stock_in_hand_id' => $stockInHandId,
                'reference_stock_id' => $referenceStock->TableKy ?? null
            ]);
        });
    }
}



