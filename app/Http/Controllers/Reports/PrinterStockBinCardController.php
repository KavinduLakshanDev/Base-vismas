<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Company;
use App\Models\Section;

class PrinterStockBinCardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $company = $user->company ?? Company::first();
        $section = $user->section ?? Section::first();

        $companyCode = $company ? ($company->company_code ?? 'C01') : 'C01';
        $sectionCode = $section ? ($section->section_code ?? 'BR01') : 'BR01';

        if ($request->has('section') && !empty($request->section)) {
            $requestedSection = Section::where('section_code', $request->section)->first();
            if ($requestedSection) {
                $sectionCode = $requestedSection->section_code;
                $companyCode = $requestedSection->company_code;
                $section = $requestedSection;
            }
        }

        $companyInfo = [
            'name' => $company ? ($company->name ?? 'Company') : 'Company',
            'section' => $section ? ($section->name ?? 'Main') : 'Main',
            'code' => $companyCode,
            'section_code' => $sectionCode,
        ];

        // Get all printers (items with serial numbers in stock_in_hand)
        $printers = DB::table('stock_in_hand as sh')
            ->leftJoin('itemmaster as im', 'sh.ItemKy', '=', 'im.ItmKy')
            ->leftJoin('purchase_det as pd', function($join) {
                $join->on('sh.batch_no', '=', 'pd.batch_no')
                     ->on('sh.ItemKy', '=', 'pd.iTimKy')
                     ->on('sh.serial_number', '=', 'pd.serial_number');
            })
            ->select(
                'sh.brand',
                'sh.model',
                'sh.serial_number',
                'im.ItemCode',
                DB::raw('COALESCE(pd.item_name, im.ItmNm) as item_name'),
                DB::raw('SUM(COALESCE(sh.Qty, 0) + COALESCE(sh.FreeQty, 0)) as balance')
            )
            ->where(function($q) {
                $q->whereNotNull('sh.serial_number')
                  ->where('sh.serial_number', '!=', '');
            })
            ->where('sh.company_code', $companyCode)
            ->groupBy(
                'sh.brand',
                'sh.model',
                'sh.serial_number',
                'im.ItemCode',
                'pd.item_name',
                'im.ItmNm'
            )
            // ->having('balance', '>', 0) // Temporarily commented out for debugging
            ->orderBy('sh.brand')
            ->orderBy('sh.model')
            ->orderBy('sh.serial_number')
            ->get()
            ->map(function($printer) {
                return [
                    'serial_number' => $printer->serial_number,
                    'brand' => $printer->brand,
                    'model' => $printer->model,
                    'item_code' => $printer->ItemCode,
                    'item_name' => $printer->item_name,
                    'balance' => $printer->balance,
                ];
            });

        $sections = Section::where('company_code', $companyCode)
            ->where('is_active', true)
            ->select('id', 'name', 'section_code')
            ->orderBy('name')
            ->get();

        $data = [
            'printers' => $printers,
            'company' => $companyInfo,
            'sections' => $sections,
        ];

        // If printer is selected, fetch transactions
        if ($request->has('serial_number') && !empty($request->serial_number)) {
            $selectedPrinter = $printers->firstWhere('serial_number', $request->serial_number);

            if ($selectedPrinter) {
                $fromDate = $request->from_date ? \Carbon\Carbon::parse($request->from_date) : \Carbon\Carbon::now()->subMonths(3);
                $toDate = $request->to_date ? \Carbon\Carbon::parse($request->to_date) : \Carbon\Carbon::now();

                // Get opening balance - sum of receipts minus issues before fromDate
                $openingBalance = $this->getOpeningBalance($selectedPrinter['serial_number'], $companyCode, $fromDate);

                // Get all transactions for the period
                $transactions = $this->getPrinterTransactions($selectedPrinter['serial_number'], $companyCode, $fromDate, $toDate);

                // Calculate running balance
                $balance = $openingBalance;
                $ledgerTransactions = [];

                foreach ($transactions as $index => $trn) {
                    $balance += $trn['received'] - $trn['issued'];

                    $ledgerTransactions[] = [
                        'id' => $index + 1,
                        'date' => $trn['date'],
                        'description' => $trn['description'],
                        'reference' => $trn['reference'],
                        'received' => $trn['received'],
                        'issued' => $trn['issued'],
                        'balance' => $balance,
                    ];
                }

                $data['selectedPrinter'] = $selectedPrinter;
                $data['transactions'] = $ledgerTransactions;
                $data['fromDate'] = $fromDate->format('Y-m-d');
                $data['toDate'] = $toDate->format('Y-m-d');
                $data['openingBalance'] = $openingBalance;
                $data['closingBalance'] = $balance;
            }
        }

        return Inertia::render('Reports/PrinterStockBinCard', $data);
    }

    private function getOpeningBalance($serialNumber, $companyCode, $beforeDate)
    {
        // Get all stock movements before the date for this serial number
        $balance = DB::table('stock_in_hand')
            ->where('serial_number', $serialNumber)
            ->where('company_code', $companyCode)
            ->where('OrdDate', '<', $beforeDate)
            ->selectRaw('SUM(COALESCE(Qty, 0) + COALESCE(FreeQty, 0)) as total')
            ->value('total') ?? 0;

        return $balance;
    }

    private function getPrinterTransactions($serialNumber, $companyCode, $fromDate, $toDate)
    {
        $transactions = [];

        // Get purchase transactions (receipts)
        $purchases = DB::table('stock_in_hand as sh')
            ->leftJoin('purchase_det as pd', function($join) {
                $join->on('sh.batch_no', '=', 'pd.batch_no')
                     ->on('sh.ItemKy', '=', 'pd.iTimKy')
                     ->on('sh.serial_number', '=', 'pd.serial_number');
            })
            ->leftJoin('purchase as p', 'pd.PurchaseKey', '=', 'p.PurchaseKey')
            ->where('sh.serial_number', $serialNumber)
            ->where('sh.company_code', $companyCode)
            ->where('sh.TrnTyp', 'PURCHASE')
            ->whereBetween('sh.OrdDate', [$fromDate, $toDate])
            ->select(
                'sh.OrdDate as date',
                'p.PurchaseNo',
                'p.SuppInvNo',
                'sh.Qty',
                'sh.FreeQty',
                'sh.batch_no'
            )
            ->get()
            ->map(function($purchase) {
                $qty = floatval($purchase->Qty ?? 0);
                $freeQty = floatval($purchase->FreeQty ?? 0);
                $totalReceived = $qty + $freeQty;

                $description = 'Purchase';
                if ($purchase->batch_no) {
                    $description .= ' - Batch: ' . $purchase->batch_no;
                }

                return [
                    'date' => $purchase->date,
                    'type' => 'purchase',
                    'description' => $description,
                    'reference' => $purchase->SuppInvNo ?? 'PUR-' . $purchase->PurchaseNo,
                    'received' => $totalReceived,
                    'issued' => 0,
                ];
            });

        // Get sales transactions (issues)
        $sales = DB::table('stock_in_hand as sh')
            ->leftJoin('sales_transaction_items as sti', function($join) {
                $join->on('sh.serial_number', '=', 'sti.serial_number')
                     ->on('sh.ItemKy', '=', 'sti.product_id');
            })
            ->leftJoin('sales_transactions as st', 'sti.sales_transaction_id', '=', 'st.id')
            ->where('sh.serial_number', $serialNumber)
            ->where('sh.company_code', $companyCode)
            ->where('sh.TrnTyp', 'SALE')
            ->whereBetween('sh.OrdDate', [$fromDate, $toDate])
            ->select(
                'sh.OrdDate as date',
                'st.invoice_no',
                'sh.Qty'
            )
            ->get()
            ->map(function($sale) {
                return [
                    'date' => $sale->date,
                    'type' => 'sale',
                    'description' => 'Sale - Invoice #' . $sale->invoice_no,
                    'reference' => $sale->invoice_no,
                    'received' => 0,
                    'issued' => abs(floatval($sale->Qty ?? 0)),
                ];
            });

        // Get transfer transactions (received/issued)
        $transfers = DB::table('stock_in_hand as sh')
            ->leftJoin('stock_transfers as st', 'sh.StkKy', '=', 'st.id')
            ->where('sh.serial_number', $serialNumber)
            ->where('sh.company_code', $companyCode)
            ->whereIn('sh.TrnTyp', ['TRF-IN', 'TRF-OUT'])
            ->whereBetween('sh.OrdDate', [$fromDate, $toDate])
            ->select(
                'sh.OrdDate as date',
                'sh.TrnTyp',
                'st.transfer_number',
                'sh.section_code',
                'sh.Qty'
            )
            ->get()
            ->map(function($transfer) {
                $isTransferIn = $transfer->TrnTyp === 'TRF-IN';
                $description = $isTransferIn ? 'Transfer In' : 'Transfer Out';
                if ($transfer->section_code) {
                    $description .= ' - ' . $transfer->section_code;
                }

                return [
                    'date' => $transfer->date,
                    'type' => $isTransferIn ? 'transfer_in' : 'transfer_out',
                    'description' => $description,
                    'reference' => $transfer->transfer_number ?? 'TRF-' . $transfer->date,
                    'received' => $isTransferIn ? abs(floatval($transfer->Qty ?? 0)) : 0,
                    'issued' => $isTransferIn ? 0 : abs(floatval($transfer->Qty ?? 0)),
                ];
            });

        // Get wastage transactions (issues)
        $wastages = DB::table('stock_in_hand as sh')
            ->where('sh.serial_number', $serialNumber)
            ->where('sh.company_code', $companyCode)
            ->where('sh.TrnTyp', 'WASTAGE')
            ->whereBetween('sh.OrdDate', [$fromDate, $toDate])
            ->select(
                'sh.OrdDate as date',
                'sh.Qty'
            )
            ->get()
            ->map(function($wastage) {
                return [
                    'date' => $wastage->date,
                    'type' => 'wastage',
                    'description' => 'Wastage',
                    'reference' => 'WST-' . $wastage->date,
                    'received' => 0,
                    'issued' => abs(floatval($wastage->Qty ?? 0)),
                ];
            });

        // Get printer wastage restoration transactions (receipts)
        $wastageRestorations = DB::table('stock_in_hand as sh')
            ->where('sh.serial_number', $serialNumber)
            ->where('sh.company_code', $companyCode)
            ->where('sh.TrnTyp', 'PWST-IN')
            ->whereBetween('sh.OrdDate', [$fromDate, $toDate])
            ->select(
                'sh.OrdDate as date',
                'sh.Qty'
            )
            ->get()
            ->map(function($restoration) {
                return [
                    'date' => $restoration->date,
                    'type' => 'wastage_restoration',
                    'description' => 'Printer Wastage Restored',
                    'reference' => 'PWST-REST-' . $restoration->date,
                    'received' => floatval($restoration->Qty ?? 0),
                    'issued' => 0,
                ];
            });

        // Get supplier return transactions
        $supplierReturns = DB::table('stock_in_hand as sh')
            ->leftJoin('supplier_returns as sr', function($join) {
                $join->on('sh.serial_number', '=', 'sr.serial_number')
                     ->on('sh.ItemKy', '=', 'sr.item_key')
                     ->on('sh.OrdDate', '=', 'sr.return_date');
            })
            ->where('sh.serial_number', $serialNumber)
            ->where('sh.company_code', $companyCode)
            ->whereIn('sh.TrnTyp', ['SRET-IN', 'SRET-OUT'])
            ->whereBetween('sh.OrdDate', [$fromDate, $toDate])
            ->select(
                'sh.OrdDate as date',
                'sh.TrnTyp',
                'sr.reason',
                'sr.id as return_number',
                'sh.Qty'
            )
            ->get()
            ->map(function($return) {
                $isReturnIn = $return->TrnTyp === 'SRET-IN';
                $description = $isReturnIn ? 'Supplier Return In' : 'Supplier Return Out';
                if ($return->reason) {
                    $description .= ' - ' . $return->reason;
                }

                return [
                    'date' => $return->date,
                    'type' => $isReturnIn ? 'supplier_return_in' : 'supplier_return_out',
                    'description' => $description,
                    'reference' => 'RET-' . $return->return_number,
                    'received' => $isReturnIn ? abs(floatval($return->Qty ?? 0)) : 0,
                    'issued' => $isReturnIn ? 0 : abs(floatval($return->Qty ?? 0)),
                ];
            });

        // Merge and sort all transactions by date
        $allTransactions = $purchases->concat($sales)->concat($transfers)->concat($wastages)->concat($wastageRestorations)->concat($supplierReturns);
        return $allTransactions->sortBy('date')->values();
    }
}
