<?php

namespace App\Http\Controllers;

use App\Models\ServiceJob;
use App\Models\ServiceJobItem;
use App\Models\AccMas;
use App\Models\Address;
use App\Models\User;
use App\Models\Company;
use App\Models\ItemMaster;
use App\Models\ServiceCharge;
use App\Models\Purchase;
use App\Models\PurchaseDet;
use App\Models\SalesTransaction;
use App\Models\SalesTransactionItem;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ServiceJobController extends Controller
{
    public function index(Request $request)
    {
        if (!request()->user()->hasPermission('service_jobs.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view service jobs.');
        }

        $user = auth()->user();

        if ($user && $user->role && $user->role->id == 3) {
            // Technicians see:
            // 1. Pending unassigned jobs (available to claim)
            // 2. All their assigned jobs that aren't completed/delivered/cancelled
            $query = ServiceJob::with(['customer', 'technician'])
                ->latest()
                ->where(function($q) use ($user) {
                    // Pending unassigned jobs
                    $q->where(function($subQ) {
                        $subQ->where('status', 'pending')
                             ->whereNull('assigned_technician_id');
                    })
                    // OR their assigned jobs that aren't completed
                    ->orWhere(function($subQ) use ($user) {
                        $subQ->where('assigned_technician_id', $user->id)
                             ->whereNotIn('status', ['completed', 'delivered', 'cancelled']);
                    });
                });
        } else {
            // Keep existing logic for other roles
            $query = ServiceJob::with(['customer', 'technician'])
                ->latest();

            if ($request->has('status') && $request->status !== '') {
                if ($request->status === 'all') {
                    // Show all jobs
                } else {
                    $query->where('status', $request->status);
                }
            } else {
                // Default to active jobs with assigned technicians (in queue)
                $query->whereNotIn('status', ['completed', 'delivered', 'cancelled'])
                      ->whereNotNull('assigned_technician_id');
            }
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('job_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%")
                  ->orWhere('device_serial', 'like', "%{$search}%")
                  ->orWhere('device_barcode', 'like', "%{$search}%");
            });
        }

        $jobs = $query->paginate(20);

        // Get counts for stats
        $totalActiveJobs = ServiceJob::whereNotIn('status', ['completed', 'delivered', 'cancelled'])
                                    ->whereNotNull('assigned_technician_id')
                                    ->count();
        $pendingCount = ServiceJob::where('status', 'pending')->whereNotNull('assigned_technician_id')->count();
        $completedCount = ServiceJob::whereIn('status', ['completed', 'delivered'])->count();
        $inProgressCount = ServiceJob::whereIn('status', ['in_progress', 'assigned'])->whereNotNull('assigned_technician_id')->count();

        return Inertia::render('ServiceJobs/Index', [
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'status']),
            'statuses' => [
                'pending' => 'Pending',
                'assigned' => 'Assigned',
                'in_progress' => 'In Progress',
                'waiting_for_parts' => 'Waiting for Parts',
                'quotation_generated' => 'Quotation Generated',
                'completed' => 'Completed',
                'delivered' => 'Delivered',
                'cancelled' => 'Cancelled',
            ],
            'stats' => [
                'active_jobs' => $totalActiveJobs,
                'pending' => $pendingCount,
                'completed' => $completedCount,
                'in_progress' => $inProgressCount,
            ],
        ]);
    }

    public function history(Request $request)
    {
        if (!request()->user()->hasPermission('service_jobs.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view service jobs.');
        }

        // eager load everything needed for a full history view
        $query = ServiceJob::with(['customer', 'technician', 'items', 'statusHistory.changedBy', 'createdBy'])
            ->latest();

        // generic search across multiple fields (job number, serial, barcode, customer, technician)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('job_number', 'like', "%{$search}%")
                    ->orWhere('device_serial', 'like', "%{$search}%")
                    ->orWhere('device_barcode', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhereHas('customer', function($q2) use ($search) {
                        $q2->where('AccNm', 'like', "%{$search}%");
                    })
                    ->orWhereHas('technician', function($q3) use ($search) {
                        $q3->where('first_name', 'like', "%{$search}%")
                           ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        // allow direct serial search param for exact match
        if ($request->filled('serial')) {
            $serial = $request->serial;
            $query->where(function($q) use ($serial) {
                $q->where('device_serial', $serial)
                  ->orWhere('device_barcode', $serial);
            });
        }

        // filter by technician id
        if ($request->filled('technician_id')) {
            $query->where('assigned_technician_id', $request->technician_id);
        }

        // filter by customer AccKy
        if ($request->filled('customer_accky')) {
            $query->where('AccKy', $request->customer_accky);
        }

        $jobs = $query->paginate(20)->withQueryString();

        // get active technicians for filter dropdown
        $technicians = User::whereHas('role', function($q) {
                $q->where('id', 3);
            })->where('is_active', true)
            ->select('id', 'first_name', 'last_name')
            ->get();

        return Inertia::render('ServiceJobs/History', [
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'serial', 'technician_id', 'customer_accky']),
            'technicians' => $technicians,
        ]);
    }

    public function create()
    {
        if (!request()->user()->hasPermission('service_jobs.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create service jobs.');
        }

        // Get customers with their address information
        $customers = AccMas::where('AccTyp', 'CUSTOMER')
            ->select('AccKy', 'AccCd', 'AccNm', 'CurBal', 'CrLmt')
            ->with(['addresses' => function($query) {
                $query->where('AdrTypKy', 1)->select('AccKy', 'TP1', 'Email', 'Address', 'City');
            }])
            ->get()
            ->map(function($customer) {
                $address = $customer->addresses->first();
                return [
                    'AccKy' => $customer->AccKy,
                    'AccCd' => $customer->AccCd,
                    'AccNm' => $customer->AccNm,
                    'CurBal' => $customer->CurBal,
                    'CrLmt' => $customer->CrLmt,
                    'phone' => $address ? $address->TP1 : null,
                    'email' => $address ? $address->Email : null,
                    'address' => $address ? $address->Address : null,
                    'city' => $address ? $address->City : null,
                ];
            });

        return Inertia::render('ServiceJobs/Create', [
            'customers' => $customers,
            'technicians' => User::whereHas('role', function($q) {
                $q->where('id', 3);
            })->where('is_active', true)
            ->select('id', 'first_name', 'last_name', 'phone', 'email')
            ->get(),
            'serviceCharges' => ServiceCharge::active()->get(),
        ]);
    }

    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('service_jobs.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create service jobs.');
        }

        // Decode items from JSON string to array
        if ($request->has('items') && is_string($request->input('items'))) {
            $request->merge(['items' => json_decode($request->input('items'), true)]);
        }
        /** @var User|null $authUser */
        $authUser = \Illuminate\Support\Facades\Auth::user();

        $validated = $request->validate([
            'AccKy' => 'nullable|integer|exists:acc_mas,AccKy',
            'customer_name' => 'required|string|max:100',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email|max:100',
            'customer_address' => 'nullable|string|max:255',
            'device_model' => 'nullable|string|max:100',
            'device_brand' => 'nullable|string|max:100',
            'device_warranty' => 'nullable|string|max:50',
            'device_serial' => 'nullable|string|max:100',
            'device_barcode' => 'nullable|string|max:100',
            'problem_description' => 'required|string',
            'received_date' => 'required|date',
            'estimated_completion_date' => 'nullable|date',
            'assigned_technician_id' => 'nullable|integer|exists:users,id',
            'advanced_payment' => 'nullable|numeric|min:0',
            'items' => 'nullable|array',
            'items.*.item_type' => 'required|in:part,service_charge,other',
            'items.*.ItmKy' => 'nullable|string',
            'items.*.item_code' => 'nullable|string',
            'items.*.item_name' => 'required|string',
            'items.*.barcode' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.description' => 'nullable|string',
            'is_existing_customer' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $isExistingCustomer = $request->input('is_existing_customer') === '1';
            
            // Check if device exists with serial/barcode to auto-find customer
            $deviceSearchResult = $this->findCustomerByDevice($validated);
            
            if ($deviceSearchResult && empty($validated['AccKy'])) {
                $validated['AccKy'] = $deviceSearchResult['customer']->AccKy;
                $validated = array_merge($validated, $deviceSearchResult['details']);
                $isExistingCustomer = true;
            }

            // Handle customer logic
            if (!empty($validated['AccKy']) && $isExistingCustomer) {
                // Existing customer - just verify it exists and use the AccKy
                // Do NOT create or update customer records
                $customer = AccMas::where('AccKy', $validated['AccKy'])->first();
                
                if (!$customer) {
                    throw new \Exception('Selected customer not found in database.');
                }
                
                // Get customer details for the service job record
                $customerData = $this->getCustomerDataForJob($validated['AccKy']);
                if ($customerData) {
                    // Use database values for the service job record
                    $validated['customer_name'] = $customerData['customer_name'] ?? $validated['customer_name'];
                    $validated['customer_phone'] = $customerData['customer_phone'] ?? $validated['customer_phone'];
                    $validated['customer_email'] = $customerData['customer_email'] ?? $validated['customer_email'];
                    $validated['customer_address'] = $customerData['customer_address'] ?? $validated['customer_address'];
                }
                
                Log::info("Using existing customer for service job", [
                    'AccKy' => $validated['AccKy'],
                    'customer_name' => $validated['customer_name']
                ]);
            } elseif (empty($validated['AccKy']) || !$isExistingCustomer) {
                // New customer - create customer record
                $customer = $this->createNewCustomer($validated, $authUser);
                $validated['AccKy'] = $customer->AccKy;
                
                Log::info("Created new customer for service job", [
                    'AccKy' => $validated['AccKy'],
                    'customer_name' => $validated['customer_name']
                ]);
            }

            // Generate job number
            $lastJob = ServiceJob::orderBy('id', 'desc')->first();
            $jobNumber = 'SJ' . str_pad(($lastJob ? $lastJob->id + 1 : 1), 6, '0', STR_PAD_LEFT);
            $validated['job_number'] = $jobNumber;
            $validated['created_by'] = $authUser?->id ?? null;
            $validated['status'] = 'pending'; // Set initial status

            // Check if customer is VAT registered
            $customerAccMas = AccMas::where('AccKy', $validated['AccKy'])->first();
            $isVatRegistered = $customerAccMas && $customerAccMas->fVATRegistered;
            
            if ($isVatRegistered) {
                $validated['is_vat_invoice'] = true;
                $validated['customer_vat_no'] = $customerAccMas->VATNo;
                
                // Get company VAT info
                $company = Company::where('company_code', $authUser?->company_code)->first();
                if ($company) {
                    $validated['company_vat_no'] = $company->vat_no;
                    $validated['vat_rate'] = $company->vat_rate ?? 15.00; // Default 15% if not set
                }
            } else {
                $validated['is_vat_invoice'] = false;
                $validated['customer_vat_no'] = null;
                $validated['company_vat_no'] = null;
                $validated['vat_rate'] = null;
            }

            $serviceJob = ServiceJob::create($validated);

            // Create items with VAT information
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    // Check if item has VAT from ItemMaster or PurchaseDet
                    $vatInclusive = false;
                    $vatRate = 0;
                    
                    if ($isVatRegistered) {
                        if (!empty($item['ItmKy'])) {
                            // Check ItemMaster for VAT info
                            $itemMaster = \App\Models\ItemMaster::where('ItmKy', $item['ItmKy'])->first();
                            if ($itemMaster && $itemMaster->VATItem) {
                                $vatInclusive = true;
                                $vatRate = $validated['vat_rate'];
                            }
                        }
                        
                        // Items from purchase_det always have VAT included
                        if ($item['item_type'] === 'part') {
                            $purchaseDet = \App\Models\PurchaseDet::where('serial_number', $validated['device_serial'] ?? '')
                                ->where('flnAct', true)
                                ->first();
                            if ($purchaseDet && $purchaseDet->VATItem) {
                                $vatInclusive = true;
                                $vatRate = $validated['vat_rate'];
                            }
                        }
                    }
                    
                    $item['vat_inclusive'] = $vatInclusive;
                    $item['vat_rate'] = $vatRate;
                    
                    $serviceJob->items()->create($item);
                }
            }

            // Update totals
            $serviceJob->updateTotals();

            // Status history is automatically created by model event

            DB::commit();

            // Send SMS notification to customer
            try {
                $smsService = app(SmsService::class);
                $smsResult = $smsService->sendJobCreationNotification(
                    $serviceJob->customer_phone,
                    $serviceJob->job_number
                );

                if (!$smsResult['success']) {
                    Log::warning('Failed to send SMS notification for service job: ' . $serviceJob->job_number);
                }
            } catch (\Exception $e) {
                Log::error('SMS sending error for service job ' . $serviceJob->job_number . ': ' . $e->getMessage());
                // Don't fail the entire transaction for SMS errors
            }

            // Redirect to the show page and include a query param so the frontend
            // can open the printable receipt automatically.
            $showUrl = route('service-jobs.show', $serviceJob) . '?print=1';
            return redirect()->to($showUrl)
                ->with('success', 'Service job and invoice created successfully. SMS notification sent to customer.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Service job creation error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to create service job: ' . $e->getMessage()]);
        }
    }

    private function findCustomerByDevice(array $data)
    {
        if (!empty($data['device_serial']) || !empty($data['device_barcode'])) {
            $query = ServiceJob::whereNotNull('AccKy');
            
            if (!empty($data['device_serial'])) {
                $query->where('device_serial', $data['device_serial']);
            }
            if (!empty($data['device_barcode'])) {
                $query->orWhere('device_barcode', $data['device_barcode']);
            }
            
            $previousJob = $query->orderBy('created_at', 'desc')->first();
            
            if ($previousJob) {
                // Get customer details
                $customer = AccMas::where('AccKy', $previousJob->AccKy)->first();
                $address = Address::where('AccKy', $previousJob->AccKy)->first();
                
                if ($customer) {
                    return [
                        'customer' => $customer,
                        'details' => [
                            'customer_name' => $customer->AccNm,
                            'customer_phone' => $address->TP1 ?? '',
                            'customer_email' => $address->Email ?? '',
                            'customer_address' => $address->Address ?? '',
                            'device_brand' => $previousJob->device_brand ?? '',
                            'device_warranty' => $previousJob->device_warranty ?? '',
                        ]
                    ];
                }
            }
        }
        
        return null;
    }

    private function createNewCustomer(array $data, ?User $authUser = null)
    {
        // Generate customer code
        // Logic from CustomerController: 'CUS' . str_pad(Customer::max('AdrKy') + 1, 3, '0', STR_PAD_LEFT);
        // Using Address model here as it maps to the same table
        $nextId = Address::max('AdrKy') + 1;
        $customerCode = 'CUS' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

        // Create customer in acc_mas
        $customer = AccMas::create([
            'AccCd' => $customerCode,
            'AccNm' => $data['customer_name'],
            'AccTyp' => 'CUSTOMER',
            'Status' => 'A',
            'CurBal' => 0,
            'CrLmt' => 0,
            'company_code' => $authUser?->company_code ?? null,
            'section_code' => $authUser?->section_code ?? null,
        ]);

        // Create address record
        Address::create([
            'AccKy' => $customer->AccKy,
            'AdrCd' => $customerCode,
            'CtPerson' => $data['customer_name'],
            'FstNm' => $data['customer_name'],
            'TP1' => $data['customer_phone'],
            'Email' => $data['customer_email'],
            'Address' => $data['customer_address'],
            'AdrTypKy' => 1, // Assuming 1 is for customer address
            'Status' => 'A', // Explicitly set active status
            'company_code' => $authUser?->company_code ?? null,
            'section_code' => $authUser?->section_code ?? null,
        ]);

        return $customer;
    }

    private function getCustomerDataForJob($accKy)
    {
        $customer = AccMas::where('AccKy', $accKy)->first();
        $address = Address::where('AccKy', $accKy)->orderBy('AdrKy', 'desc')->first();

        if ($customer) {
            return [
                'customer_name' => $customer->AccNm,
                'customer_phone' => $address->TP1 ?? '',
                'customer_email' => $address->Email ?? '',
                'customer_address' => $address->Address ?? '',
            ];
        }

        return null;
    }

    private function updateCustomerAddress(array $data, ?User $authUser = null)
    {
        $address = Address::where('AccKy', $data['AccKy'])
            ->orderBy('AdrKy', 'desc')
            ->first();

        if ($address) {
            $address->update([
                'CtPerson' => $data['customer_name'] ?? $address->CtPerson,
                'FstNm' => $data['customer_name'] ?? $address->FstNm,
                'TP1' => $data['customer_phone'] ?? $address->TP1,
                'Email' => $data['customer_email'] ?? $address->Email,
                'Address' => $data['customer_address'] ?? $address->Address,
            ]);
        } else {
            // Create address if doesn't exist
            $customer = AccMas::find($data['AccKy']);
            Address::create([
                'AccKy' => $data['AccKy'],
                'AdrCd' => $customer ? $customer->AccCd : null,
                'CtPerson' => $data['customer_name'],
                'FstNm' => $data['customer_name'],
                'TP1' => $data['customer_phone'],
                'Email' => $data['customer_email'],
                'Address' => $data['customer_address'],
                'AdrTypKy' => 1,
                'Status' => 'A', // Explicitly set active status
                'company_code' => $authUser?->company_code ?? null,
                'section_code' => $authUser?->section_code ?? null,
            ]);
        }
    }

    private function createInvoiceForServiceJob(ServiceJob $serviceJob, ?User $authUser = null): SalesTransaction
    {
        // Generate invoice number
        $lastInvoice = SalesTransaction::orderBy('id', 'desc')->first();
        $invoiceNumber = 'SJ-' . str_pad(($lastInvoice ? $lastInvoice->id + 1 : 1), 6, '0', STR_PAD_LEFT);

        // Calculate totals
        $subtotal = $serviceJob->items->sum(function ($item) {
            return $item->quantity * $item->unit_price;
        });

        $taxAmount = 0; // You can add tax calculation logic here if needed
        $discountAmount = 0; // You can add discount logic here if needed
        $totalAmount = $subtotal + $taxAmount - $discountAmount;

        // Get customer details
        $customer = AccMas::where('AccKy', $serviceJob->AccKy)->first();

        // Create the sales transaction (invoice)
        $invoice = SalesTransaction::create([
            'invoice_no' => $invoiceNumber,
            'transaction_date' => now(),
            'customer_code' => $customer ? $customer->AccCd : null,
            'customer_name' => $serviceJob->customer_name,
            'company_code' => $authUser?->company_code ?? 'DEFAULT',
            'section_code' => $authUser?->section_code ?? 'DEFAULT',
            'cashier_id' => $authUser?->id ?? null,
            'customer_id' => $serviceJob->AccKy,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'status' => 'pending', // Service job invoices start as pending
            'notes' => "Service Job: {$serviceJob->job_number} - {$serviceJob->device_brand} {$serviceJob->device_model}",
        ]);

        // Create invoice items
        $lineNumber = 1;
        foreach ($serviceJob->items as $item) {
            SalesTransactionItem::create([
                'sales_transaction_id' => $invoice->id,
                'item_code' => $item->item_code,
                'item_name' => $item->item_name,
                'barcode' => $item->barcode,
                'unit_price' => $item->unit_price,
                'quantity' => $item->quantity,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'line_total' => $item->quantity * $item->unit_price,
                'line_subtotal' => $item->quantity * $item->unit_price,
                'line_number' => $lineNumber++,
                'company_code' => $authUser?->company_code ?? 'DEFAULT',
                'section_code' => $authUser?->section_code ?? 'DEFAULT',
                'price_type' => 'retail',
            ]);
        }

        // Update service job with invoice reference
        $serviceJob->update([
            'invoice_number' => $invoiceNumber,
            'invoice_date' => now(),
        ]);

        return $invoice;
    }

    public function show(ServiceJob $serviceJob)
    {
        if (!request()->user()->hasPermission('service_jobs.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view service jobs.');
        }

        $serviceJob->load([
            'items',
            'customer.addresses',
            'technician',
            'statusHistory.changedBy',
            'createdBy',
            'payments'
        ]);

        return Inertia::render('ServiceJobs/Show', [
            'job' => $serviceJob,
            'items' => $serviceJob->items,
            'statusHistory' => $serviceJob->statusHistory,
            'technicians' => User::whereHas('role', function($q) {
                $q->where('id', 3);
            })->where('is_active', true)
            ->select('id', 'first_name', 'last_name', 'phone', 'email')
            ->get(),
            'serviceCharges' => ServiceCharge::active()->get(),
        ]);
    }

    public function generateInvoice(ServiceJob $serviceJob)
    {
        if (!request()->user()->hasPermission('service_jobs.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view service jobs.');
        }

        // Check if job has items
        if ($serviceJob->items()->count() === 0) {
            return back()->with('error', 'Cannot generate invoice for a job with no items.');
        }

        if (empty($serviceJob->invoice_number)) {
            $lastInvoice = ServiceJob::whereNotNull('invoice_number')
                ->orderBy('id', 'desc')
                ->first();
            
            $nextNumber = 1;
            if ($lastInvoice) {
                if (preg_match('/INV-(\d+)/', $lastInvoice->invoice_number, $matches)) {
                    $nextNumber = intval($matches[1]) + 1;
                } else {
                    $nextNumber = $lastInvoice->id + 1;
                }
            } else {
                $lastJobWithId = ServiceJob::orderBy('id', 'desc')->first();
                $nextNumber = $lastJobWithId ? $lastJobWithId->id : 1;
            }

            $serviceJob->invoice_number = 'INV-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
            $serviceJob->invoice_date = now();
            $serviceJob->save();
        }

        $serviceJob->load(['items', 'customer', 'technician', 'payments']);

        return view('service_jobs.invoice', [
            'job' => $serviceJob,
        ]);
    }

    public function generateReceipt(ServiceJob $serviceJob)
    {
        if (!request()->user()->hasPermission('service_jobs.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view service jobs.');
        }

        $serviceJob->load(['customer', 'technician']);

        return view('service_jobs.receipt', [
            'job' => $serviceJob,
        ]);
    }

    public function destroy(ServiceJob $serviceJob)
    {
        if (!request()->user()->hasPermission('service_jobs.delete')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete service jobs.');
        }

        $serviceJob->delete();
        
        return redirect()->route('service-jobs.index')
            ->with('success', 'Service job deleted successfully.');
    }

    public function addItem(Request $request, ServiceJob $serviceJob)
    {
        if (!request()->user()->hasPermission('service_jobs.edit')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit service jobs.');
        }

        $validated = $request->validate([
            'item_type' => 'required|in:part,service_charge,other',
            'ItmKy' => 'nullable|string',
            'item_code' => 'nullable|string',
            'item_name' => 'required|string',
            'barcode' => 'nullable|string',
            'quantity' => 'required|numeric|min:0.0001',
            'unit_price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $serviceJob->items()->create($validated);
        $serviceJob->updateTotals();

        return back()->with('success', 'Item added successfully.');
    }

    public function removeItem(ServiceJob $serviceJob, ServiceJobItem $item)
    {
        if (!request()->user()->hasPermission('service_jobs.edit')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit service jobs.');
        }

        $item->delete();
        $serviceJob->updateTotals();
        
        return back()->with('success', 'Item removed successfully.');
    }

    public function updateStatus(Request $request, ServiceJob $serviceJob, SmsService $smsService)
    {
        if (!request()->user()->hasPermission('service_jobs.edit')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit service jobs.');
        }

        /** @var User|null $authUser */
        $authUser = \Illuminate\Support\Facades\Auth::user();
        
        $validated = $request->validate([
            'status' => 'required|in:pending,assigned,in_progress,waiting_for_parts,quotation_received,quotation_rejected,quotation_approved,completed,delivered,cancelled',
            'notes' => 'nullable|string',
            'assigned_technician_id' => 'nullable|integer|exists:users,id',
        ]);

        // Prevent assigning an already assigned job (concurrency protection)
        if (isset($validated['assigned_technician_id']) && 
            $serviceJob->assigned_technician_id !== null && 
            $serviceJob->assigned_technician_id != $validated['assigned_technician_id']) {
            return back()->with('error', 'This job is already assigned to another technician.');
        }

        $oldStatus = $serviceJob->status;

        // Check if status is already the same
        if ($serviceJob->status === $validated['status'] && 
            (!isset($validated['assigned_technician_id']) || $serviceJob->assigned_technician_id == $validated['assigned_technician_id'])) {
            return back()->with('info', 'No changes were made - status and technician assignment are already set.');
        }

        $updateData = [
            'status' => $validated['status'],
            'technician_notes' => $validated['notes'] ?? $serviceJob->technician_notes,
        ];

        // Only update assigned_technician_id if it's provided in the request
        if (isset($validated['assigned_technician_id'])) {
            $updateData['assigned_technician_id'] = $validated['assigned_technician_id'];
        }

        // Set actual completion date when status is completed
        if ($validated['status'] === 'completed' && !$serviceJob->actual_completion_date) {
            $updateData['actual_completion_date'] = now()->toDateString();
        }

        try {
            $serviceJob->update($updateData);
        } catch (\Illuminate\Database\QueryException $ex) {
            // Handle MySQL enum truncation (e.g., value not present in ENUM)
            $message = $ex->getMessage();
            if (str_contains($message, 'Data truncated for column') || str_contains($message, '1265')) {
                try {
                    // Ensure enum includes 'quotation_received'
                    DB::statement("ALTER TABLE `service_jobs` MODIFY `status` ENUM('pending','assigned','in_progress','waiting_for_parts','quotation_received','quotation_rejected','quotation_approved','completed','delivered','cancelled') NOT NULL DEFAULT 'pending'");
                    // Retry update
                    $serviceJob->refresh();
                    $serviceJob->update($updateData);
                } catch (\Exception $inner) {
                    Log::error('Failed to update status after altering enum: ' . $inner->getMessage());
                    return back()->withErrors(['error' => 'Failed to update status: ' . $inner->getMessage()]);
                }
            } else {
                throw $ex;
            }
        }

        // Create status history
        $serviceJob->statusHistory()->create([
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? 'Status updated',
            'changed_by' => $authUser?->id ?? null,
        ]);

        // Send SMS if status is updated to completed
        if ($validated['status'] === 'completed' && $oldStatus !== 'completed') {
            if ($serviceJob->customer_phone) {
                try {
                    $smsService->sendJobCompletionNotification(
                        $serviceJob->customer_phone,
                        $serviceJob->job_number,
                        (float) $serviceJob->total_amount
                    );
                } catch (\Exception $e) {
                    Log::error('Failed to send job completion SMS: ' . $e->getMessage());
                }
            }
        }

        return back()->with('success', 'Status updated successfully.');
    }

    public function searchCustomers(Request $request)
    {
        $search = $request->search;
        
        $customers = AccMas::where('AccTyp', 'CUSTOMER')
            ->where(function($q) use ($search) {
                $q->where('AccCd', 'like', "%{$search}%")
                  ->orWhere('AccNm', 'like', "%{$search}%")
                  ->orWhereHas('addresses', function($q2) use ($search) {
                      $q2->where('TP1', 'like', "%{$search}%")
                         ->orWhere('Email', 'like', "%{$search}%");
                  });
            })
            ->limit(10)
            ->get(['AccKy', 'AccCd', 'AccNm', 'CurBal', 'CrLmt']);
        
        return response()->json($customers);
    }

    public function getCustomerDetails($AccKy)
    {
        try {
            Log::info("Fetching customer details for AccKy: {$AccKy}");
            
            $customer = AccMas::where('AccKy', $AccKy)->first();
            
            if (!$customer) {
                Log::warning("Customer not found for AccKy: {$AccKy}");
                return response()->json(['error' => 'Customer not found'], 404);
            }
            
            Log::info("Customer found: {$customer->AccNm}");
            
            // Get address details from address table - try without AdrTypKy filter first
            $address = Address::where('AccKy', $AccKy)
                ->orderBy('AdrKy', 'desc') // Get the most recent address
                ->first();
            
            Log::info("Address found: " . ($address ? "Yes (AdrKy: {$address->AdrKy})" : "No"));

            // Get customer's previous service jobs to find device details
            $previousJobs = ServiceJob::where('AccKy', $AccKy)
                ->where(function($q) {
                    $q->whereNotNull('device_serial')
                      ->orWhereNotNull('device_barcode');
                })
                ->select('device_brand', 'device_model', 'device_serial', 'device_barcode')
                ->distinct()
                ->limit(10)
                ->get();

            $response = [
                'customer' => [
                    'AccKy' => $customer->AccKy,
                    'AccCd' => $customer->AccCd,
                    'AccNm' => $customer->AccNm,
                    'AccTyp' => $customer->AccTyp,
                    'CurBal' => $customer->CurBal ?? 0,
                    'CrLmt' => $customer->CrLmt ?? 0,
                ],
                'address' => $address ? [
                    'AdrKy' => $address->AdrKy,
                    'CtPerson' => $address->CtPerson ?? '',
                    'FstNm' => $address->FstNm ?? '',
                    'LstNm' => $address->LstNm ?? '',
                    'TP1' => $address->TP1 ?? '',
                    'TP2' => $address->TP2 ?? '',
                    'TP3' => $address->TP3 ?? '',
                    'Email' => $address->Email ?? '',
                    'Address' => $address->Address ?? '',
                    'Town' => $address->Town ?? '',
                    'City' => $address->City ?? '',
                    'Country' => $address->Country ?? ''
                ] : null,
                'previousDevices' => $previousJobs
            ];
            
            Log::info("Response prepared successfully", ['response' => $response]);
            
            return response()->json($response);
        } catch (\Exception $e) {
            Log::error("Error in getCustomerDetails: " . $e->getMessage(), [
                'AccKy' => $AccKy,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Server error occurred while fetching customer details',
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    public function searchItems(Request $request)
    {
        try {
            $search = $request->search;
            $results = [];

            // Search in ItemMaster table
            $items = ItemMaster::where(function($q) use ($search) {
                    $q->where('ItemCode', 'like', "%{$search}%")
                      ->orWhere('ItmNm', 'like', "%{$search}%")
                      ->orWhere('BarCode', 'like', "%{$search}%");
                })
                ->limit(20)
                ->get(['ItmKy', 'ItemCode', 'ItmNm', 'SlsPri', 'Unit', 'BarCode']);

            // Format ItemMaster results
            foreach ($items as $item) {
                $results[] = [
                    'ItmKy' => $item->ItmKy,
                    'ItemCode' => $item->ItemCode,
                    'ItmNm' => $item->ItmNm,
                    'SlsPri' => $item->SlsPri,
                    'Unit' => $item->Unit,
                    'BarCode' => $item->BarCode,
                    'source' => 'itemmaster',
                ];
            }

            // Search in PurchaseDet table by serial number, barcode, item_name, brand, or model
            // Note: flnAct = true means active (not inactive)
            $purchaseItems = PurchaseDet::where(function($q) use ($search) {
                    $q->where('serial_number', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%")
                      ->orWhere('item_name', 'like', "%{$search}%")
                      ->orWhere('brand', 'like', "%{$search}%")
                      ->orWhere('model', 'like', "%{$search}%");
                })
                ->where(function($q) {
                    $q->where('flnAct', false) // flnAct = false means active (not inactive)
                      ->orWhereNull('flnAct');
                })
                ->where('Status', 'A')
                ->with('product')
                ->limit(20)
                ->get();

            Log::info('PurchaseDet search results: ' . $purchaseItems->count() . ' items found for search: ' . $search);

            // Format PurchaseDet results
            foreach ($purchaseItems as $purchaseItem) {
                $itemName = $purchaseItem->item_name;
                if (!$itemName && $purchaseItem->product) {
                    $itemName = $purchaseItem->product->ItmNm;
                }
                if (!$itemName && $purchaseItem->brand && $purchaseItem->model) {
                    $itemName = $purchaseItem->brand . ' ' . $purchaseItem->model;
                }
                
                $results[] = [
                    'ItmKy' => $purchaseItem->iTimKy ?? '',
                    'ItemCode' => $purchaseItem->serial_number ?? $purchaseItem->barcode ?? '',
                    'ItmNm' => $itemName ?? 'Unknown Item',
                    'SlsPri' => $purchaseItem->SalePrice ?? $purchaseItem->CostPrice ?? 0,
                    'Unit' => $purchaseItem->product ? $purchaseItem->product->Unit : 'PCS',
                    'BarCode' => $purchaseItem->barcode ?? $purchaseItem->serial_number ?? '',
                    'serial_number' => $purchaseItem->serial_number,
                    'brand' => $purchaseItem->brand,
                    'model' => $purchaseItem->model,
                    'source' => 'purchase_det',
                    'purchase_det_ky' => $purchaseItem->PerchaseDetKy,
                ];
            }

            return response()->json($results);
        } catch (\Exception $e) {
            Log::error('Item search error: ' . $e->getMessage());
            Log::error('Item search trace: ' . $e->getTraceAsString());
            return response()->json([], 500);
        }
    }

    public function getCustomerByDevice(Request $request)
    {
        try {
            $serial = $request->query('serial');
            $barcode = $request->query('barcode');
            
            Log::info('ServiceJob: Searching for device', ['serial' => $serial, 'barcode' => $barcode]);
            
            if (!$serial && !$barcode) {
                return response()->json(['error' => 'Serial number or barcode is required'], 400);
            }
            
            // First, search in sales_transactions and sales_transaction_items tables
            $salesTransaction = null;
            $saleItem = null;
            
            if ($serial) {
                // Search by serial number in sales_transaction_items
                $saleItem = DB::table('sales_transaction_items')
                    ->where(function($query) use ($serial) {
                        $query->where('serial_number', $serial)
                              ->orWhere('barcode', $serial);
                    })
                    ->orderBy('id', 'desc') // Get most recent sale
                    ->first();
                
                Log::info('ServiceJob: Searched by serial', ['found' => $saleItem ? 'yes' : 'no', 'serial' => $serial]);
            }
            
            if (!$saleItem && $barcode) {
                // Search by barcode in sales_transaction_items
                $saleItem = DB::table('sales_transaction_items')
                    ->where(function($query) use ($barcode) {
                        $query->where('barcode', $barcode)
                              ->orWhere('serial_number', $barcode);
                    })
                    ->orderBy('id', 'desc') // Get most recent sale
                    ->first();
                
                Log::info('ServiceJob: Searched by barcode', ['found' => $saleItem ? 'yes' : 'no', 'barcode' => $barcode]);
            }
            
            // If found in sales, get the full transaction details
            if ($saleItem) {
                Log::info('ServiceJob: Found sale item', [
                    'item_id' => $saleItem->id,
                    'sales_transaction_id' => $saleItem->sales_transaction_id,
                    'brand' => $saleItem->brand,
                    'model' => $saleItem->model,
                    'serial_number' => $saleItem->serial_number
                ]);
                
                $salesTransaction = DB::table('sales_transactions')
                    ->where('id', $saleItem->sales_transaction_id)
                    ->first();
                
                Log::info('ServiceJob: Sales transaction lookup', [
                    'sales_transaction_id' => $saleItem->sales_transaction_id,
                    'found' => $salesTransaction ? 'yes' : 'no'
                ]);
                
                if ($salesTransaction) {
                    Log::info('ServiceJob: Found sales transaction', [
                        'transaction_id' => $salesTransaction->id,
                        'customer_id' => $salesTransaction->customer_id,
                        'customer_code' => $salesTransaction->customer_code,
                        'customer_name' => $salesTransaction->customer_name
                    ]);
                    
                    // Get all items from this sale
                    $allSaleItems = DB::table('sales_transaction_items')
                        ->where('sales_transaction_id', $salesTransaction->id)
                        ->get();
                    
                    // Get customer details using customer_id from sales_transactions
                    $customer = null;
                    $address = null;
                    $customerPhone = '';
                    $customerEmail = '';
                    $customerAddress = '';
                    $customerName = $salesTransaction->customer_name ?? '';
                    
                    // Try to get customer from AccMas using customer_id
                    if (!empty($salesTransaction->customer_id)) {
                        $customer = DB::table('acc_mas')
                            ->where('AccKy', $salesTransaction->customer_id)
                            ->first();
                        
                        Log::info('ServiceJob: Searched acc_mas by customer_id', [
                            'customer_id' => $salesTransaction->customer_id,
                            'found' => $customer ? 'yes' : 'no'
                        ]);
                        
                        if ($customer) {
                            $customerName = $customer->AccNm ?? $customerName;
                            
                            // Get address details from address table using AccKy (not AdrKy)
                            // Note: Not filtering by AdrTypKy as it may be NULL for customers
                            $address = DB::table('address')
                                ->where('AccKy', $salesTransaction->customer_id)
                                ->orderBy('AdrKy', 'desc') // Get most recent address
                                ->first();
                            
                            Log::info('ServiceJob: Searched address by AccKy', [
                                'AccKy' => $salesTransaction->customer_id,
                                'found' => $address ? 'yes' : 'no'
                            ]);
                            
                            if ($address) {
                                $customerPhone = $address->TP1 ?? $address->TP2 ?? $address->TP3 ?? '';
                                $customerEmail = $address->Email ?? '';
                                $customerAddress = $address->Address ?? '';
                            }
                        }
                    }
                    
                    // If no customer_id or not found, try using customer_code
                    if (!$customer && !empty($salesTransaction->customer_code)) {
                        $customer = DB::table('acc_mas')
                            ->where('AccCd', $salesTransaction->customer_code)
                            ->first();
                        
                        Log::info('ServiceJob: Searched acc_mas by customer_code', [
                            'customer_code' => $salesTransaction->customer_code,
                            'found' => $customer ? 'yes' : 'no'
                        ]);
                        
                        if ($customer) {
                            $customerName = $customer->AccNm ?? $customerName;
                            
                            // Get address details using AccKy (not AdrKy)
                            // Note: Not filtering by AdrTypKy as it may be NULL for customers
                            $address = DB::table('address')
                                ->where('AccKy', $customer->AccKy)
                                ->orderBy('AdrKy', 'desc') // Get most recent address
                                ->first();
                            
                            Log::info('ServiceJob: Searched address by customer AccKy', [
                                'AccKy' => $customer->AccKy,
                                'found' => $address ? 'yes' : 'no'
                            ]);
                            
                            if ($address) {
                                $customerPhone = $address->TP1 ?? $address->TP2 ?? $address->TP3 ?? '';
                                $customerEmail = $address->Email ?? '';
                                $customerAddress = $address->Address ?? '';
                            }
                        }
                    }
                    
                    Log::info('ServiceJob: Final customer data', [
                        'customer_name' => $customerName,
                        'customer_phone' => $customerPhone,
                        'customer_email' => $customerEmail,
                        'has_address_record' => $address ? 'yes' : 'no'
                    ]);
                    
                    // Prepare response with sale data
                    $result = [
                        'customer' => [
                            'AccKy' => $customer->AccKy ?? $salesTransaction->customer_id ?? '',
                            'AdrKy' => $customer->AccKy ?? $salesTransaction->customer_id ?? '',
                            'AccCd' => $customer->AccCd ?? $salesTransaction->customer_code ?? '',
                            'AccNm' => $customerName,
                            'full_name' => $customerName,
                            'customer_name' => $customerName,
                            'customer_phone' => $customerPhone,
                            'customer_email' => $customerEmail,
                            'customer_address' => $customerAddress,
                            'TP1' => $customerPhone,
                            'Email' => $customerEmail,
                            'Address' => $customerAddress,
                        ],
                        'address' => $address ? [
                            'TP1' => $address->TP1 ?? '',
                            'TP2' => $address->TP2 ?? '',
                            'TP3' => $address->TP3 ?? '',
                            'Email' => $address->Email ?? '',
                            'Address' => $address->Address ?? '',
                            'City' => $address->City ?? '',
                        ] : null,
                        'device_serial' => $saleItem->serial_number ?? $serial,
                        'device_brand' => $saleItem->brand ?? '',
                        'device_model' => $saleItem->model ?? '',
                        'device_barcode' => $saleItem->barcode ?? $barcode ?? '',
                        'device_warranty' => $saleItem->warranty ?? '',
                        'sale_date' => $salesTransaction->transaction_date ?? $salesTransaction->created_at,
                        'items' => $allSaleItems->map(function($item) {
                            return [
                                'ItmKy' => $item->product_id ?? $item->item_code,
                                'item_code' => $item->item_code ?? '',
                                'item_name' => $item->item_name ?? '',
                                'ItemCode' => $item->item_code ?? '',
                                'ItmNm' => $item->item_name ?? '',
                                'barcode' => $item->barcode ?? '',
                                'BarCode' => $item->barcode ?? '',
                                'quantity' => $item->quantity ?? 1,
                                'unit_price' => $item->unit_price ?? 0,
                                'SlsPri' => $item->unit_price ?? 0,
                                'description' => $item->notes ?? '',
                            ];
                        })->toArray(),
                    ];
                    
                    return response()->json($result);
                }
            }
            
            // If not found in sales, fallback to purchase_det table (original logic)
            $purchaseDet = PurchaseDet::where('flnAct', true)
                ->where('Status', 'A')
                ->when($serial, function($query) use ($serial) {
                    return $query->where('serial_number', $serial);
                })
                ->when($barcode, function($query) use ($barcode) {
                    return $query->where('serial_number', $barcode);
                })
                ->with(['purchase.customer', 'product'])
                ->first();
            
            if (!$purchaseDet) {
                Log::warning('ServiceJob: No record found', [
                    'serial' => $serial,
                    'barcode' => $barcode,
                    'checked_sales' => 'yes',
                    'checked_purchase' => 'yes'
                ]);
                
                return response()->json([
                    'error' => 'No sale or purchase record found for this device serial/barcode',
                    'message' => 'The serial number or barcode you entered does not exist in our records. Please check the number and try again.',
                    'searched_value' => $serial ?? $barcode
                ], 404);
            }
            
            $purchase = $purchaseDet->purchase;
            $customer = $purchase ? $purchase->customer : null;
            $product = $purchaseDet->product;
            
            if (!$customer) {
                return response()->json(['error' => 'Customer not found for this purchase'], 404);
            }
            
            // Get customer address
            $address = Address::where('AccKy', $customer->AccKy)
                ->where('AdrTypKy', 1)
                ->first();
            
            $result = [
                'customer' => [
                    'AccKy' => $customer->AccKy,
                    'AccCd' => $customer->AccCd,
                    'AccNm' => $customer->AccNm,
                    'CurBal' => $customer->CurBal,
                    'CrLmt' => $customer->CrLmt,
                ],
                'address' => $address ? [
                    'TP1' => $address->TP1,
                    'TP2' => $address->TP2,
                    'TP3' => $address->TP3,
                    'Email' => $address->Email,
                    'Address' => $address->Address,
                    'City' => $address->City,
                ] : null,
                'device_serial' => $purchaseDet->serial_number,
                'device_model' => $purchaseDet->model ?? '',
                'device_brand' => $purchaseDet->brand ?? '',
                'device_barcode' => $purchaseDet->serial_number,
                'device_warranty' => $purchaseDet->warranty ?? '',
                'items' => $product ? [[
                    'ItmKy' => $product->ItmKy,
                    'ItemCode' => $product->ItemCode,
                    'ItmNm' => $product->ItmNm,
                    'BarCode' => $product->BarCode,
                    'SlsPri' => $product->SlsPri,
                    'Unit' => $product->UnitKy,
                ]] : [],
            ];
            
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('getCustomerByDevice error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function getItemByCode($itemCode)
    {
        try {
            $item = ItemMaster::where('ItemCode', $itemCode)
                ->orWhere('BarCode', $itemCode)
                ->first();

            if (!$item) {
                return response()->json(['error' => 'Item not found'], 404);
            }

            return response()->json($item);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function getDeviceDetails(Request $request)
    {
        $serialNumber = $request->query('serial_number');

        if (!$serialNumber) {
            return response()->json(['error' => 'Serial number is required'], 400);
        }

        $device = DB::table('purchase_det')
            ->where('serial_number', $serialNumber)
            ->select('brand', 'model', 'warranty')
            ->first();

        if (!$device) {
            return response()->json(['error' => 'Device not found'], 404);
        }

        return response()->json($device);
    }

    public function getDeviceSerialNumbers()
    {
        $serialNumbers = DB::table('sales_transaction_items')
            ->whereNotNull('serial_number')
            ->where('serial_number', '!=', '')
            ->pluck('serial_number')
            ->unique()
            ->values();

        return response()->json($serialNumbers);
    }

    /**
     * General update handler for a service job.
     * Accepts customer/device info, payments, assigned technician and status changes.
     */
    public function update(Request $request, ServiceJob $serviceJob)
    {
        /** @var User|null $authUser */
        $authUser = \Illuminate\Support\Facades\Auth::user();
        
        $validated = $request->validate([
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email|max:100',
            'customer_address' => 'nullable|string|max:255',
            'device_model' => 'nullable|string|max:100',
            'device_brand' => 'nullable|string|max:100',
            'device_warranty' => 'nullable|string|max:50',
            'device_serial' => 'nullable|string|max:100',
            'device_barcode' => 'nullable|string|max:100',
            'assigned_technician_id' => 'nullable|integer|exists:users,id',
            'technician_notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'advanced_payment' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,assigned,in_progress,waiting_for_parts,completed,delivered,cancelled',
        ]);

        DB::beginTransaction();
        try {
            $updateData = [];

            $allowed = [
                'customer_name','customer_phone','customer_email','customer_address',
                'device_model','device_brand','device_warranty','device_serial','device_barcode',
                'assigned_technician_id','technician_notes','admin_notes','advanced_payment','paid_amount'
            ];

            foreach ($allowed as $field) {
                if (array_key_exists($field, $validated)) {
                    $updateData[$field] = $validated[$field];
                }
            }

            $statusChanged = false;
            if (isset($validated['status']) && $validated['status'] !== $serviceJob->status) {
                $updateData['status'] = $validated['status'];
                $statusChanged = true;
                if ($validated['status'] === 'completed' && !$serviceJob->actual_completion_date) {
                    $updateData['actual_completion_date'] = now()->toDateString();
                }
            }

            if (!empty($updateData)) {
                $serviceJob->update($updateData);
            }

            // Recalculate totals/balance
            $serviceJob->updateTotals();

            if ($statusChanged) {
                $serviceJob->statusHistory()->create([
                    'status' => $serviceJob->status,
                    'notes' => $validated['technician_notes'] ?? 'Status updated',
                    'changed_by' => $authUser?->id ?? null,
                ]);
            }

            DB::commit();

            // If this is an Inertia request, return a proper Inertia redirect
            if ($request->header('X-Inertia')) {
                return redirect()->route('service-jobs.show', $serviceJob);
            }

            // For non-Inertia JSON API clients, return JSON
            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json(['success' => true, 'job' => $serviceJob]);
            }

            return back()->with('success', 'Service job updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Service job update error: ' . $e->getMessage());
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['error' => 'Failed to update service job: ' . $e->getMessage()]);
            }

            if ($request->wantsJson() && !$request->header('X-Inertia')) {
                return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
            }

            return back()->withErrors(['error' => 'Failed to update service job: ' . $e->getMessage()]);
        }
    }

    public function quotationsIndex(Request $request)
    {
        if (!request()->user()->hasPermission('quotations.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view quotations.');
        }

        $query = \App\Models\Quotation::with(['serviceJob.customer', 'createdBy'])
            ->latest();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('serviceJob', function($q2) use ($search) {
                    $q2->where('job_number', 'like', "%{$search}%")
                       ->orWhere('customer_name', 'like', "%{$search}%");
                });
            });
        }

        $quotations = $query->paginate(20);

        return Inertia::render('ServiceJobs/QuotationsIndex', [
            'quotations' => $quotations,
            'filters' => $request->only(['search']),
        ]);
    }

    public function viewQuotation(\App\Models\Quotation $quotation)
    {
        if (!request()->user()->hasPermission('quotations.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view quotations.');
        }

        // Load relationships
        $quotation->load(['serviceJob.customer', 'createdBy']);
        
        $company = \App\Models\Company::first();

        return Inertia::render('ServiceJobs/ViewQuotation', [
            'quotation' => [
                'id' => $quotation->id,
                'service_job_id' => $quotation->service_job_id,
                'total_amount' => $quotation->total_amount,
                'notes' => $quotation->notes,
                'items' => $quotation->items,
                'created_at' => $quotation->created_at,
                'service_job' => [
                    'id' => $quotation->serviceJob->id,
                    'job_number' => $quotation->serviceJob->job_number,
                    'customer_name' => $quotation->serviceJob->customer_name,
                    'customer_phone' => $quotation->serviceJob->customer_phone,
                    'device_type' => $quotation->serviceJob->device_type,
                    'device_brand' => $quotation->serviceJob->device_brand,
                    'device_model' => $quotation->serviceJob->device_model,
                    'device_serial' => $quotation->serviceJob->device_serial,
                ],
                'created_by' => $quotation->createdBy ? [
                    'first_name' => $quotation->createdBy->first_name,
                    'last_name' => $quotation->createdBy->last_name,
                ] : null,
            ],
            'company' => $company,
        ]);
    }

    public function createQuotationPage(ServiceJob $serviceJob)
    {
        if (!request()->user()->hasPermission('quotations.create')) {
            return redirect()->route('service-jobs.show', $serviceJob)->with('error', 'Unauthorized. You do not have permission to create quotations.');
        }

        // Load necessary relationships
        $serviceJob->load('items.itemMaster', 'customer');
        
        // Get service charges for quick add
        $serviceCharges = \App\Models\ServiceCharge::where('is_active', true)
            ->get()
            ->map(function ($charge) {
                return [
                    'id' => $charge->id,
                    'charge_name' => $charge->charge_name,
                    'charge_value' => $charge->amount,
                    'description' => $charge->description ?? null,
                ];
            });

        // Get technicians if needed
        $technicians = \App\Models\User::where('is_active', true)->get(['id', 'first_name', 'last_name']);

        return Inertia::render('ServiceJobs/CreateQuotation', [
            'job' => [
                'id' => $serviceJob->id,
                'job_number' => $serviceJob->job_number,
                'customer_name' => $serviceJob->customer?->CustNm ?? 'N/A',
            ],
            'serviceCharges' => $serviceCharges,
            'technicians' => $technicians,
        ]);
    }

    public function createQuotation(Request $request)
    {
        if (!request()->user()->hasPermission('quotations.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create quotations.');
        }

        /** @var User|null $authUser */
        $authUser = \Illuminate\Support\Facades\Auth::user();
        
        try {
            $validated = $request->validate([
                'service_job_id' => 'required|exists:service_jobs,id',
                'items' => 'required|json',
                'notes' => 'nullable|string',
                'total_amount' => 'required|numeric|min:0',
            ]);

            $quotation = \App\Models\Quotation::create([
                'service_job_id' => $validated['service_job_id'],
                'items' => json_decode($validated['items'], true),
                'notes' => $validated['notes'] ?? null,
                'total_amount' => $validated['total_amount'],
                'created_by' => $authUser?->id ?? null,
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'quotation' => $quotation
                ], 201);
            }

            return back()->with('success', 'Quotation created successfully');
        } catch (\Exception $e) {
            Log::error('Quotation creation error: ' . $e->getMessage());
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to create quotation: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing a quotation.
     */
    public function editQuotation(\App\Models\Quotation $quotation)
    {
        if (!request()->user()->hasPermission('quotations.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit quotations.');
        }

        // Load the service job with relationships
        $serviceJob = $quotation->serviceJob;
        $serviceJob->load('items.itemMaster', 'customer');
        
        // Get service charges for quick add
        $serviceCharges = \App\Models\ServiceCharge::where('is_active', true)
            ->get()
            ->map(function ($charge) {
                return [
                    'id' => $charge->id,
                    'charge_name' => $charge->charge_name,
                    'charge_value' => $charge->amount,
                    'description' => $charge->description ?? null,
                ];
            });

        return Inertia::render('ServiceJobs/EditQuotation', [
            'quotation' => [
                'id' => $quotation->id,
                'items' => $quotation->items,
                'notes' => $quotation->notes,
                'total_amount' => $quotation->total_amount,
                'created_at' => $quotation->created_at->format('Y-m-d H:i:s'),
            ],
            'job' => [
                'id' => $serviceJob->id,
                'job_number' => $serviceJob->job_number,
                'customer_name' => $serviceJob->customer?->CustNm ?? 'N/A',
            ],
            'serviceCharges' => $serviceCharges,
        ]);
    }

    /**
     * Update the specified quotation.
     */
    public function updateQuotation(Request $request, \App\Models\Quotation $quotation)
    {
        if (!request()->user()->hasPermission('quotations.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit quotations.');
        }

        /** @var User|null $authUser */
        $authUser = \Illuminate\Support\Facades\Auth::user();
        
        try {
            $validated = $request->validate([
                'items' => 'required|json',
                'notes' => 'nullable|string',
                'total_amount' => 'required|numeric|min:0',
            ]);

            $quotation->update([
                'items' => json_decode($validated['items'], true),
                'notes' => $validated['notes'] ?? null,
                'total_amount' => $validated['total_amount'],
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'quotation' => $quotation
                ], 200);
            }

            return redirect()->route('quotations.show', $quotation->id)
                ->with('success', 'Quotation updated successfully');
        } catch (\Exception $e) {
            Log::error('Quotation update error: ' . $e->getMessage());
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to update quotation: ' . $e->getMessage()]);
        }
    }
}
