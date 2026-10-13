<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\TrnMas;
use App\Models\AccTrn;
use App\Models\AccMas;
use App\Models\Address;
use App\Models\Section;
use App\Services\NumberGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChequeReturnController extends Controller
{
    /**
     * Display the cheque return page.
     */
    public function index(): Response
    {
        if (!Auth::user()->hasPermission('cheque_returns.view') && !Auth::user()->hasPermission('cheque_returns.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to access cheque returns.');
        }
        return Inertia::render('pos/cheque-return/index');
    }

    /**
     * Search for valid cheques by cheque number, bank, and branch.
     */
    public function searchCheque(Request $request): JsonResponse
    {
        $request->validate([
            'cheque_no' => ['required', 'string'],
            'bank_name' => ['required', 'string'],
            'branch_name' => ['nullable', 'string'],
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!$user->hasPermission('cheque_returns.create')) {
            return response()->json(['error' => 'Unauthorized. Permission required.'], 403);
        }

        try {
            // Log search parameters for debugging
            Log::info('Cheque search initiated', [
                'cheque_no' => $request->cheque_no,
                'bank_name' => $request->bank_name,
                'branch_name' => $request->branch_name,
                'user_id' => $user->id,
                'user_section' => $user->section_code,
                'user_company' => $user->company_code,
            ]);

            // Search for valid cheques in AccTrn table with flexible matching
            $chequeQuery = AccTrn::with(['accMas'])
                ->where('ChqueNo', trim($request->cheque_no))
                ->where('BankNm', trim($request->bank_name))
                ->where('FInAct', true)
                ->where('Status', 'A')
                ->where('Amt', '<', 0) // Only payment records (negative amounts)
                ->where('company_code', $user->company_code);
            
            // Only filter by branch if provided
            if (!empty($request->branch_name)) {
                $chequeQuery->where('BranchNm', trim($request->branch_name));
            }

            // Note: Removed strict section filtering for cheque returns
            // Bounced cheques may need to be processed by any branch/section
            // Only company-level filtering is applied

            $cheques = $chequeQuery->get();
            
            Log::info('Cheque search results', [
                'count' => $cheques->count(),
            ]);

            // Check if any of these cheques have already been returned
            $validCheques = [];
            foreach ($cheques as $cheque) {
                // Check if this cheque has already been returned
                $returnExists = AccTrn::where('original_payment_id', $cheque->AccTrnKy)
                    ->where('FInAct', true)
                    ->where('Status', 'A')
                    ->where('Amt', '>', 0) // Return records are positive
                    ->exists();

                if (!$returnExists) {
                    // Get customer details
                    $customer = AccMas::find($cheque->AccKy);
                    $cheque->customer = $customer;

                    // Get customer address for additional details
                    if ($customer) {
                        $address = Address::where('AccKy', $customer->AccKy)->first();
                        if ($address) {
                            $cheque->customer->address_details = [
                                'address' => $address->Address,
                                'city' => $address->City,
                                'phone' => $address->TP1,
                            ];
                        }
                    }

                    $validCheques[] = $cheque;
                }
            }

            return response()->json([
                'success' => true,
                'cheques' => $validCheques,
                'message' => count($validCheques) > 0 ? 'Cheques found' : 'No valid cheques found'
            ]);

        } catch (\Exception $e) {
            Log::error('Cheque search failed', [
                'error' => $e->getMessage(),
                'cheque_no' => $request->cheque_no,
                // 'bank_name' => $request->bank_name,
                // 'branch_name' => $request->branch_name,
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to search cheques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process cheque return.
     */
    public function returnCheque(Request $request): JsonResponse
    {
        $request->validate([
            'cheque_id' => ['required', 'integer'],
            'return_reason' => ['required', 'string', 'max:255'],
            'return_date' => ['required', 'date'],
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!$user->hasPermission('cheque_returns.create')) {
             return response()->json(['error' => 'Unauthorized. Permission required.'], 403);
        }

        try {
            DB::beginTransaction();

            $userSection = Section::where('section_code', $user->section_code)->first();
            // Fallback for company admin (no section) -> use default section or allow passing
            if (!$userSection && $user->section_code) {
                 // Log warning but proceed if user has code but section record missing (should not happen)
                 // Or create dummy section object if needed
            }

            // Get the original cheque payment record with SELECT FOR UPDATE lock
            $originalCheque = AccTrn::with(['accMas'])
                ->where('AccTrnKy', $request->cheque_id)
                ->where('FInAct', true)
                ->where('Status', 'A')
                ->where('company_code', $user->company_code)
                ->lockForUpdate() // Prevents concurrent modifications
                ->first();

            if (!$originalCheque) {
                throw new \Exception('Cheque payment record not found');
            }

            // Verify this cheque hasn't already been returned (check again with lock)
            $returnExists = AccTrn::where('original_payment_id', $originalCheque->AccTrnKy)
                ->where('FInAct', true)
                ->where('Status', 'A')
                ->lockForUpdate()
                ->exists();

            if ($returnExists) {
                throw new \Exception('This cheque has already been returned by another user');
            }

            // Get customer account
            $customerAccount = AccMas::find($originalCheque->AccKy);
            if (!$customerAccount) {
                throw new \Exception('Customer account not found');
            }

            // Generate return number using static method directly
            $returnNumber = NumberGeneratorService::generate(
                'cheque_return',
                $user->company_code,
                $user->section_code ?? 'MAIN' // Fallback if section code is null
            );

            // Optional: Create transaction in trn_mas for cheque return (if table exists)
            $trnKy = null;
            try {
                // Check if trn_mas table exists by attempting to query it
                $maxTrnNo = TrnMas::where('company_code', $user->company_code)->max('TrnNo') ?? 0;
                $trnNo = (int) $maxTrnNo + 1;

                // Find customer address for AdrKy
                $customerAddress = Address::where('AccKy', $customerAccount->AccKy)->first();
                $adrKy = $customerAddress ? $customerAddress->AdrKy : $customerAccount->AccKy;

                $trnMasData = [
                    'company_code' => $user->company_code,
                    'section_code' => $user->section_code,
                    'TrnDt' => $request->return_date,
                    'TrnNo' => $trnNo,
                    'TrnTypKy' => 5, // Cheque return transaction type
                    'Amt' => abs($originalCheque->Amt),
                    'AdrKy' => $adrKy,
                    'AccKy' => $customerAccount->AccKy,
                    'Des' => 'Cheque Return: ' . $request->return_reason,
                    'EntUsr' => (int) $user->id,
                    'EntDtm' => now(),
                    'Status' => 'A',
                    'fnAct' => true,
                ];

                $trnMas = TrnMas::create($trnMasData);
                $trnKy = $trnMas ? $trnMas->TrnKy : null;
            } catch (\Exception $e) {
                // TrnMas table doesn't exist or error occurred, continue without it
                Log::warning('TrnMas creation skipped: ' . $e->getMessage());
            }

            // Create cheque return transaction in acc_trn
            $returnData = [
                'TrnKy' => $trnKy, // Optional, may be null if TrnMas doesn't exist
                'FInAct' => true,
                'Status' => 'A',
                'AccKy' => $customerAccount->AccKy,
                'TrnDt' => $request->return_date,
                'TrnNo' => $returnNumber,
                'Amt' => abs($originalCheque->Amt), // Positive amount to increase customer balance
                'VaucherNo' => $returnNumber,
                'Reason' => 'Cheque Return: ' . $request->return_reason,
                'Dec' => 'Cheque Return - Original Cheque: ' . $originalCheque->ChqueNo,
                'company_code' => $user->company_code,
                'section_code' => $user->section_code, // Use section code
                'customer_code' => $originalCheque->customer_code,
                'customer_name' => $originalCheque->customer_name,
                'ChqueNo' => $originalCheque->ChqueNo, // Reference original cheque number
                'BankNm' => $originalCheque->BankNm,
                'BranchNm' => $originalCheque->BranchNm,
                'original_payment_id' => $originalCheque->AccTrnKy, // Link to original payment
            ];

            $chequeReturn = AccTrn::create($returnData);
            if (!$chequeReturn) {
                throw new \Exception('Failed to create cheque return record');
            }

            // Update customer balance (increase outstanding balance)
            // Note: CurBal on AccMas should be updated
            // Calculate new balance based on all active transactions
            $newBalance = AccTrn::where('AccKy', $customerAccount->AccKy)
                ->where('FInAct', true)
                ->where('Status', 'A')
                ->sum('Amt'); // This will include the new positive amount, reducing credit or increasing debit (outstanding)

            $customerAccount->update(['CurBal' => $newBalance]);

            DB::commit();

            Log::info('Cheque return processed successfully', [
                'original_cheque_id' => $originalCheque->AccTrnKy,
                'return_id' => $chequeReturn->AccTrnKy,
                'customer_code' => $originalCheque->customer_code,
                'cheque_no' => $originalCheque->ChqueNo,
                'amount' => abs($originalCheque->Amt),
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cheque return processed successfully',
                'return_number' => $returnNumber,
                'return_amount' => abs($originalCheque->Amt)
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            
            // Check if it's a unique constraint violation (duplicate return)
            if ($e->getCode() === '23000' && str_contains($e->getMessage(), 'unique_active_return_per_payment')) {
                Log::warning('Duplicate cheque return attempt prevented by database constraint', [
                    'cheque_id' => $request->cheque_id,
                    'user_id' => $user ? $user->id : null,
                    'error' => $e->getMessage()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'This cheque has already been returned by another user. Please refresh and try again.'
                ], 409); // Conflict status code
            }
            
            // For other database exceptions, fall through to general exception handler
            Log::error('Database error during cheque return', [
                'error' => $e->getMessage(),
                'cheque_id' => $request->cheque_id,
                'user_id' => $user ? $user->id : null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Database error occurred: ' . $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Cheque return failed', [
                'error' => $e->getMessage(),
                'cheque_id' => $request->cheque_id,
                'user_id' => $user ? $user->id : null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process cheque return: ' . $e->getMessage()
            ], 500);
        }
    }
}
