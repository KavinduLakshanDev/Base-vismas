<?php

namespace App\Http\Controllers;

use App\Models\SupplierReturn;
use App\Models\Section;
use App\Models\Address;
use App\Models\ItemMaster;
use App\Models\StockInHand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupplierReturnController extends Controller
{
    /**
     * Display a listing of supplier returns.
     */
    public function index()
    {
        $returns = SupplierReturn::with(['supplier', 'recordedBy', 'section'])
            ->latest()
            ->paginate(15)
            ->through(function ($return) {
                $itemName = 'N/A';
                $itemCode = '';
                
                if ($return->item) {
                    $itemName = $return->item->ItmNm;
                    $itemCode = $return->item->ItemCode;
                }

                return [
                    'id' => $return->id,
                    'return_type' => $return->return_type,
                    'item_name' => $itemName,
                    'item_code' => $itemCode,
                    'supplier_name' => $return->supplier->FstNm ?? 'N/A',
                    'quantity' => $return->quantity,
                    'return_value' => $return->return_value,
                    'reason' => $return->reason,
                    'return_date' => $return->return_date->format('Y-m-d'),
                    'status' => $return->status,
                    'recorded_by' => $return->recordedBy->name ?? 'System',
                    'section_name' => $return->section->name ?? 'N/A',
                ];
            });

        return Inertia::render('SupplierReturn/Index', [
            'returns' => $returns,
        ]);
    }

    /**
     * Show the form for creating a new supplier return.
     */
    public function create()
    {
        $user = Auth::user();
        $sections = Section::where('is_active', true)->get();
        $userSection = $user?->section;

        return Inertia::render('SupplierReturn/Create', [
            'sections' => $sections,
            'userSection' => $userSection,
        ]);
    }

    /**
     * Search for suppliers.
     */
    public function searchSuppliers(Request $request)
    {
        $term = $request->get('term');
        
        if (!$term || strlen($term) < 1) {
            return response()->json([]);
        }

        $suppliers = Address::where('AdrTypKy', 4)
            ->where(function ($q) use ($term) {
                $q->where('FstNm', 'LIKE', "%{$term}%")
                  ->orWhere('AdrCd', 'LIKE', "%{$term}%");
            })
            ->select('AdrKy', 'AdrCd', 'FstNm', 'TP1')
            ->orderByRaw("CASE 
                WHEN FstNm LIKE ? THEN 1 
                WHEN AdrCd LIKE ? THEN 2 
                WHEN FstNm LIKE ? THEN 3 
                ELSE 4 END", ["{$term}%", "{$term}%", "%{$term}%"])
            ->limit(50)
            ->get()
            ->map(function ($supplier) {
                return [
                    'id' => $supplier->AdrKy,
                    'code' => $supplier->AdrCd,
                    'name' => $supplier->FstNm,
                    'phone' => $supplier->TP1,
                ];
            });

        return response()->json($suppliers);
    }

    /**
     * Search for items from itemmaster by supplier.
     */
    public function searchItems(Request $request)
    {
        $term = $request->get('term', '');
        $supplierId = $request->get('supplier_id');
        $sectionId = $request->get('section_id');

        if (!$supplierId || !$sectionId) {
            return response()->json([]);
        }

        // Get supplier code from Address table
        $supplier = Address::where('AdrKy', $supplierId)->first();
        if (!$supplier) {
            return response()->json([]);
        }

        $section = Section::findOrFail($sectionId);

        // First, calculate stock quantities per item and batch from stock_in_hand
        $stockSubquery = DB::table('stock_in_hand')
            ->select(
                'ItemKy',
                DB::raw('COALESCE(batch_no, "N/A") as batch_no'),
                DB::raw('SUM(Qty + COALESCE(FreeQty, 0)) as stock_quantity')
            )
            ->where('section_code', $section->section_code)
            ->where('company_code', $section->company_code)
            ->where('OrdDate', '<=', now()->toDateString())
            ->groupBy('ItemKy', DB::raw('COALESCE(batch_no, "N/A")'))
            ->havingRaw('SUM(Qty + COALESCE(FreeQty, 0)) > 0');

        // Join with itemmaster to get item details
        $query = DB::table('itemmaster as im')
            ->joinSub($stockSubquery, 'stock', function($join) {
                $join->on('im.ItmKy', '=', 'stock.ItemKy');
            });

        // Only add search filter if term is provided
        if ($term && strlen($term) > 0) {
            $query->where(function ($q) use ($term) {
                $q->where('im.ItmNm', 'LIKE', "%{$term}%")
                  ->orWhere('im.ItemCode', 'LIKE', "%{$term}%");
            });
        }

        $items = $query
            ->select(
                DB::raw('(SELECT MAX(ItemPriceKey) FROM item_price_det WHERE ItmKy = im.ItmKy) as ItemPriceKey'),
                'im.ItmKy',
                'im.ItemCode',
                'im.ItmNm',
                'stock.batch_no',
                DB::raw('(SELECT MAX(CosPri) FROM item_price_det WHERE ItmKy = im.ItmKy) as CosPri'),
                'stock.stock_quantity'
            )
            ->orderBy('im.ItmNm')
            ->limit(50)
            ->get();

        return response()->json($items);
    }

    /**
     * Search for printers (deprecated - printers removed).
     */
    public function searchPrinters(Request $request)
    {
        return response()->json([]);
    }

    /**
     * Store a newly created supplier return.
     */
    public function store(Request $request)
    {
        \Log::info('Store method called', ['data' => $request->all()]);
        
        $validated = $request->validate([
            'return_type' => 'required|in:item',
            'items' => 'required|array|min:1',
            'items.*.key' => 'required',
            'items.*.item_master_key' => 'nullable',
            'items.*.batch_no' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.return_value' => 'required|numeric|min:0',
            'supplier_code' => 'required|string',
            'reason' => 'required|string',
            'return_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'required|in:pending,approved,rejected',
            'section_id' => 'required|exists:sections,id',
        ]);
        
        \Log::info('Validation passed', ['validated' => $validated]);

        $section = Section::findOrFail($validated['section_id']);
        $user = Auth::user();
        
        \Log::info('Section and user loaded', ['section' => $section->id, 'user' => $user->id]);

        DB::beginTransaction();
        \Log::info('Transaction started');
        
        try {
            foreach ($validated['items'] as $index => $item) {
                \Log::info('Processing item', ['index' => $index, 'item' => $item]);
                
                $returnData = [
                    'return_type' => $validated['return_type'],
                    'supplier_code' => $validated['supplier_code'],
                    'quantity' => $item['quantity'],
                    'return_value' => $item['return_value'],
                    'reason' => $validated['reason'],
                    'return_date' => $validated['return_date'],
                    'notes' => $validated['notes'],
                    'status' => $validated['status'],
                    'recorded_by' => $user->id,
                    'section_id' => $section->id,
                    'company_code' => $section->company_code,
                    'section_code' => $section->section_code,
                    'item_key' => $item['key'],
                    'item_master_key' => $item['item_master_key'] ?? null,
                    'batch_no' => $item['batch_no'] ?? null,
                ];

                \Log::info('Return data prepared', ['returnData' => $returnData]);
                
                $supplierReturn = SupplierReturn::create($returnData);
                
                \Log::info('Supplier return created', ['id' => $supplierReturn->id]);

                // If approved, deduct from stock
                if ($validated['status'] === 'approved') {
                    \Log::info('Status is approved, deducting stock');
                    $this->deductStock($supplierReturn, $section);
                }
            }

            DB::commit();
            \Log::info('Transaction committed successfully');

            return redirect()->route('supplier-returns.index')
                ->with('success', 'Supplier return recorded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Transaction rolled back', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Failed to record supplier return: ' . $e->getMessage());
        }
    }

    /**
     * Deduct stock for approved returns.
     */
    private function deductStock(SupplierReturn $return, Section $section)
    {
        // Deduct item stock
        StockInHand::create([
            'RefNo' => 'SRET-OUT-' . $return->id,
            'Cky' => $section->id,
            'company_code' => $section->company_code,
            'section_code' => $section->section_code,
            'OrdDate' => now()->format('Y-m-d'),
            'ItemKy' => $return->item_master_key,
            'Qty' => -$return->quantity,
            'FreeQty' => 0,
            'TrnTyp' => 'SRET-OUT',
            'OrdKy' => $return->id,
            'batch_no' => $return->batch_no,
        ]);
    }

    /**
     * Remove the specified supplier return.
     */
    public function destroy(int $id)
    {
        try {
            $return = SupplierReturn::findOrFail($id);

            DB::beginTransaction();

            // If approved, restore stock
            if ($return->status === 'approved') {
                $this->restoreStock($return);
            }

            $return->delete();

            DB::commit();

            return redirect()->route('supplier-returns.index')
                ->with('success', 'Supplier return deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to delete supplier return: ' . $e->getMessage());
        }
    }

    /**
     * Restore stock when return is deleted.
     */
    private function restoreStock(SupplierReturn $return)
    {
        $outRecord = StockInHand::where('RefNo', 'SRET-OUT-' . $return->id)
            ->where('TrnTyp', 'SRET-OUT')
            ->first();

        if ($outRecord) {
            StockInHand::create([
                'RefNo' => 'SRET-IN-' . $return->id,
                'Cky' => $outRecord->Cky,
                'company_code' => $outRecord->company_code,
                'section_code' => $outRecord->section_code,
                'OrdDate' => now()->format('Y-m-d'),
                'ItemKy' => $outRecord->ItemKy,
                'Qty' => abs($outRecord->Qty),
                'FreeQty' => 0,
                'TrnTyp' => 'SRET-IN',
                'OrdKy' => $return->id,
                'batch_no' => $outRecord->batch_no,
                'serial_number' => $outRecord->serial_number,
                'brand' => $outRecord->brand,
                'model' => $outRecord->model,
                'warranty' => $outRecord->warranty,
            ]);
        }
    }
}
