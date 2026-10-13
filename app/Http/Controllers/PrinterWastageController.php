<?php

namespace App\Http\Controllers;

use App\Models\PrinterWastage;
use App\Models\PurchaseDet;
use App\Models\Product;
use App\Models\Section;
use App\Models\StockInHand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PrinterWastageController extends Controller
{
    /**
     * Display a listing of printer wastage records.
     */
    public function index()
    {
        $wastages = PrinterWastage::with(['purchaseDet', 'recordedBy'])
            ->latest()
            ->paginate(15)
            ->through(function ($wastage) {
                return [
                    'id' => $wastage->id,
                    'printer_name' => $wastage->purchaseDet->item_name ?? 'N/A',
                    'serial_number' => $wastage->purchaseDet->serial_number ?? 'N/A',
                    'batch_no' => $wastage->purchaseDet->batch_no ?? 'N/A',
                    'brand' => $wastage->purchaseDet->brand ?? 'N/A',
                    'model' => $wastage->purchaseDet->model ?? 'N/A',
                    'warranty' => $wastage->purchaseDet->warranty ?? 'N/A',
                    'reason' => $wastage->reason,
                    'recorded_by' => $wastage->recordedBy->name ?? 'System',
                    'recorded_at' => $wastage->created_at->format('Y-m-d'),
                    'status' => $wastage->status,
                ];
            });

        return Inertia::render('PrinterWastage/Index', [
            'wastages' => $wastages,
        ]);
    }

    /**
     * Show the form for creating a new printer wastage record.
     */
    public function create()
    {
        $sections = Section::all();
        $userSection = Auth::user()?->section;

        return Inertia::render('PrinterWastage/Create', [
            'sections' => $sections,
            'userSection' => $userSection,
        ]);
    }

    /**
     * Search for printers in stock by serial number, name, or code.
     */
    public function searchPrinters(Request $request)
    {
        $term = $request->get('term');
        $sectionId = $request->get('section_id');

        if (!$term || strlen($term) < 2 || !$sectionId) {
            return response()->json([]);
        }

        try {
            // Search in purchase_det for printers with serial numbers that have stock
            // Only uses purchase_det and stock_in_hand tables
            $printers = DB::table('purchase_det as pd')
                ->join('stock_in_hand as sih', function ($join) use ($sectionId) {
                    $join->on('pd.batch_no', '=', 'sih.batch_no')
                        ->on('pd.iTimKy', '=', 'sih.ItemKy')
                        ->where('sih.Cky', '=', $sectionId);
                })
                ->whereNotNull('pd.serial_number')
                ->where('pd.serial_number', '!=', '')
                ->where(function ($query) use ($term) {
                    $query->where('pd.item_name', 'LIKE', "%{$term}%")
                        ->orWhere('pd.iTimKy', 'LIKE', "%{$term}%")
                        ->orWhere('pd.serial_number', 'LIKE', "%{$term}%")
                        ->orWhere('pd.batch_no', 'LIKE', "%{$term}%")
                        ->orWhere('pd.brand', 'LIKE', "%{$term}%")
                        ->orWhere('pd.model', 'LIKE', "%{$term}%");
                })
                ->select(
                    'pd.PerchaseDetKy as id',
                    'pd.iTimKy',
                    'pd.item_name as name',
                    'pd.iTimKy as code',
                    'pd.serial_number',
                    'pd.batch_no',
                    'pd.brand',
                    'pd.model',
                    'pd.warranty',
                    DB::raw('SUM(sih.Qty) as stock_quantity')
                )
                ->groupBy(
                    'pd.PerchaseDetKy',
                    'pd.iTimKy',
                    'pd.item_name',
                    'pd.serial_number',
                    'pd.batch_no',
                    'pd.brand',
                    'pd.model',
                    'pd.warranty'
                )
                ->having('stock_quantity', '>', 0)
                ->limit(20)
                ->get();

            return response()->json($printers);
        } catch (\Exception $e) {
            \Log::error('Printer search error: ' . $e->getMessage());
            return response()->json(['error' => 'Search failed'], 500);
        }
    }

    /**
     * Store a newly created printer wastage record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.serial_number' => 'required|string|exists:purchase_det,serial_number',
            'items.*.quantity' => 'required|numeric|in:1', // Always 1 for printers
            'reason' => 'required|string|max:255',
            'wastage_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'required|in:pending,approved,rejected',
            'section_id' => 'required|exists:sections,id',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['items'] as $item) {
                $purchaseDet = PurchaseDet::where('serial_number', $item['serial_number'])->firstOrFail();

                // Create printer wastage record
                $wastage = PrinterWastage::create([
                    'purchase_det_key' => $purchaseDet->PerchaseDetKy,
                    'quantity' => 1, // Always 1 for printers
                    'reason' => $validated['reason'],
                    'wastage_date' => $validated['wastage_date'],
                    'notes' => $validated['notes'],
                    'status' => $validated['status'],
                    'recorded_by' => Auth::id(),
                    'section_id' => $validated['section_id'],
                ]);

                // If approved, deduct from stock_in_hand
                if ($validated['status'] === 'approved') {
                    $this->deductPrinterStock($purchaseDet, $validated['section_id'], $wastage->id);
                }
            }

            DB::commit();

            return redirect()->route('printer-wastages.index')
                ->with('success', 'Printer wastage recorded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to record printer wastage: ' . $e->getMessage());
        }
    }

    /**
     * Deduct printer stock from stock_in_hand.
     */
    private function deductPrinterStock(PurchaseDet $purchaseDet, int $sectionId, int $wastageId)
    {
        // Get the section to retrieve section_code
        $section = Section::findOrFail($sectionId);
        
        // Find the stock record for this printer by serial number
        $stock = StockInHand::where('serial_number', $purchaseDet->serial_number)
            ->where('batch_no', $purchaseDet->batch_no)
            ->where('Cky', $sectionId)
            ->where('Qty', '>', 0)
            ->orderBy('OrdDate', 'asc')
            ->first();

        if ($stock) {
            // Create wastage OUT record (negative quantity)
            StockInHand::create([
                'RefNo' => 'PWST-OUT-' . $wastageId,
                'Cky' => $sectionId,
                'company_code' => $section->company_code,
                'section_code' => $section->section_code,
                'OrdDate' => now()->format('Y-m-d'),
                'ItemKy' => $purchaseDet->iTimKy,
                'Qty' => -1, // Negative to deduct
                'FreeQty' => 0,
                'TrnTyp' => 'PWST-OUT',
                'OrdKy' => $wastageId,
                'batch_no' => $purchaseDet->batch_no,
                'serial_number' => $purchaseDet->serial_number,
                'brand' => $purchaseDet->brand,
                'model' => $purchaseDet->model,
                'warranty' => $purchaseDet->warranty,
            ]);
        } else {
            // If no existing stock found, still create the OUT record to track wastage
            StockInHand::create([
                'RefNo' => 'PWST-OUT-' . $wastageId,
                'Cky' => $sectionId,
                'company_code' => $section->company_code,
                'section_code' => $section->section_code,
                'OrdDate' => now()->format('Y-m-d'),
                'ItemKy' => $purchaseDet->iTimKy,
                'Qty' => -1, // Negative to deduct
                'FreeQty' => 0,
                'TrnTyp' => 'PWST-OUT',
                'OrdKy' => $wastageId,
                'batch_no' => $purchaseDet->batch_no,
                'serial_number' => $purchaseDet->serial_number,
                'brand' => $purchaseDet->brand,
                'model' => $purchaseDet->model,
                'warranty' => $purchaseDet->warranty,
            ]);
        }
    }

    /**
     * Remove the specified printer wastage record.
     */
    public function destroy(int $id)
    {
        try {
            $wastage = PrinterWastage::findOrFail($id);

            DB::beginTransaction();

            // Restore stock for all printer wastages when deleted, regardless of status
            $this->restorePrinterStock($wastage);

            $wastage->delete();

            DB::commit();

            return redirect()->route('printer-wastages.index')
                ->with('success', 'Printer wastage record deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to delete printer wastage: ' . $e->getMessage());
        }
    }

    /**
     * Restore printer stock when wastage is deleted.
     */
    private function restorePrinterStock(PrinterWastage $wastage)
    {
        $purchaseDet = $wastage->purchaseDet;

        // Find the original OUT record
        $outRecord = StockInHand::where('RefNo', 'PWST-OUT-' . $wastage->id)
            ->where('TrnTyp', 'PWST-OUT')
            ->first();

        if ($outRecord) {
            // Create an IN record to restore the stock
            StockInHand::create([
                'RefNo' => 'PWST-IN-' . $wastage->id,
                'Cky' => $outRecord->Cky,
                'company_code' => $outRecord->company_code,
                'section_code' => $outRecord->section_code,
                'OrdDate' => now()->format('Y-m-d'),
                'ItemKy' => $outRecord->ItemKy,
                'Qty' => 1, // Restore 1 unit (positive)
                'FreeQty' => 0,
                'TrnTyp' => 'PWST-IN',
                'OrdKy' => $wastage->id,
                'batch_no' => $outRecord->batch_no,
                'serial_number' => $outRecord->serial_number,
                'brand' => $outRecord->brand,
                'model' => $outRecord->model,
                'warranty' => $outRecord->warranty,
            ]);
        }
    }
}
