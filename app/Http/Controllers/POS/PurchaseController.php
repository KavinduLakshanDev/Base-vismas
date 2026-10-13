<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseDet;
use App\Models\Address;
use App\Models\Product;
use App\Models\ItemPriceDet;
use App\Models\AccMas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseController extends Controller
{

    private function userIsSuperAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        if (method_exists($user, 'isSuperAdmin')) {
            return (bool) $user->isSuperAdmin();
        }

        if (method_exists($user, 'hasRole')) {
            try {
                return (bool) $user->hasRole('super_admin') || (bool) $user->hasRole('admin');
            } catch (\Throwable $e) {
                // ignore and continue fallback checks
            }
        }

        if (property_exists($user, 'role') && !empty($user->role)) {
            $role = strtolower((string)$user->role);
            return in_array($role, ['super_admin', 'superadmin', 'admin', 'administrator']);
        }

        if (isset($user->is_super_admin)) {
            return (bool) $user->is_super_admin;
        }

        return false;
    }

    /**
     * Display a listing of purchases (GRN).
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('purchases.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view purchases.');
        }
        
        $query = Purchase::with(['supplier', 'section'])
            ->withCount('details')
            ->where('company_code', $user->company_code);

        // Filter by section for branch admins
        if ($user->role_id === 3) { // Branch Admin
            $query->where('section_code', $user->section_code);
        }

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                // Search in purchase number (both formatted and raw)
                $q->where('PurchaseNo', 'LIKE', "%{$search}%")
                  ->orWhere('SuppInvNo', 'LIKE', "%{$search}%")
                  ->orWhere('SuppCode', 'LIKE', "%{$search}%")
                  ->orWhere('Des', 'LIKE', "%{$search}%");

                // Also search for formatted GRN numbers (e.g., "C5C5-BR001TAX-000123" or "C5C5-BR001NON-000123")
                // Pattern: CompanyCode-BranchCodeTAX/NON-Number
                if (preg_match('/^([A-Z0-9]+)-([A-Z0-9]+)TAX-(\d+)$/', $search, $matches)) {
                    $purchaseNo = (int) $matches[3];
                    $q->orWhere('PurchaseNo', $purchaseNo)->where('Purchase_Type', 'TAX001');
                }

                if (preg_match('/^([A-Z0-9]+)-([A-Z0-9]+)NON-(\d+)$/', $search, $matches)) {
                    $purchaseNo = (int) $matches[3];
                    $q->orWhere('PurchaseNo', $purchaseNo)->where('Purchase_Type', 'TAX002');
                }

                // Search for partial GRN matches (e.g., "C5C5-BR001TAX-001" should find C5C5-BR001TAX-000123)
                if (preg_match('/^([A-Z0-9]+)-([A-Z0-9]+)TAX-(\d*)$/', $search, $matches)) {
                    $partialNo = $matches[3];
                    if (!empty($partialNo)) {
                        $q->orWhereRaw('PurchaseNo LIKE ?', ["{$partialNo}%"])->where('Purchase_Type', 'TAX001');
                    }
                }

                if (preg_match('/^([A-Z0-9]+)-([A-Z0-9]+)NON-(\d*)$/', $search, $matches)) {
                    $partialNo = $matches[3];
                    if (!empty($partialNo)) {
                        $q->orWhereRaw('PurchaseNo LIKE ?', ["{$partialNo}%"])->where('Purchase_Type', 'TAX002');
                    }
                }
            });
        }

        // Filter by supplier
        if ($request->filled('supplier')) {
            $query->where('SuppCode', $request->supplier);
        }

        // Filter by section
        if ($request->filled('branch')) {
            $query->where('section_code', $request->branch);
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'posted') {
                $query->where('flused', true);
            } elseif ($request->status === 'active') {
                $query->where('flused', false)->where('Status', 'A')->where('flnact', false);
            } elseif ($request->status === 'inactive') {
                $query->where(function($q) {
                    $q->where('flnact', true)->orWhere('Status', 'I');
                });
            }
        }

        // Filter by date range
        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('GRNDate', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('GRNDate', '<=', $request->date_to);
        }

        $perPage = $request->input('per_page', 10);
        $purchases = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // Transform purchases for frontend
        $purchases->getCollection()->transform(function($purchase) {
            return [
                'id' => $purchase->PurchaseKey,
                'purchase_no' => $purchase->company_code . '-' . $purchase->section_code . '-' . sprintf('%06d', $purchase->PurchaseNo),
                'purchase_key' => $purchase->PurchaseKey,
                'date' => $purchase->GRNDate->format('Y-m-d'),
                'supplier_code' => $purchase->SuppCode,
                'supplier_name' => $purchase->supplier->FstNm ?? 'N/A',
                'branch_name' => $purchase->branch->name ?? 'N/A',
                'supplier_invoice_no' => $purchase->SuppInvNo,
                'description' => $purchase->Des,
                'cost_total' => (float) $purchase->CostTotal,
                'total_value' => (float) $purchase->TotalVal,
                'total_discount' => (float) $purchase->ToIDscount,
                'tax_amount' => (float) $purchase->TaxAmount,
                'net_amount' => (float) ($purchase->CostTotal - $purchase->ToIDscount),
                'grand_total' => (float) ($purchase->CostTotal - $purchase->ToIDscount + $purchase->TaxAmount),
                'status' => $purchase->Status,
                'is_used' => $purchase->flused,
                'is_inactive' => $purchase->flnact,
                'details_count' => $purchase->details_count,
                'can_edit' => true,
                'can_delete' => !$purchase->flused,
                'created_at' => $purchase->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Get suppliers for filter dropdown
        $suppliers = \App\Models\AccMas::where('AccTyp', 'SUPPLIER')
            ->where('Status', 'A')
            ->where('company_code', $user->company_code);
        
        // Filter by section for branch admins and staff users
        if ($user->role_id === 3 || $user->role_id === 4) { // Branch Admin or Staff User
            $suppliers->where('section_code', $user->section_code);
        }
        
        $suppliers = $suppliers->orderBy('AccNm')
            ->select('AccCd', 'AccNm')
            ->get()
            ->map(function($supplier) {
                return [
                    'code' => $supplier->AccCd,
                    'name' => $supplier->AccNm
                ];
            });

        // Get sections for filter dropdown (only for company admins)
        $sections = collect();
        if ($user->role_id === 2) { // Company Admin
            $sections = \App\Models\Section::where('company_code', $user->company_code)
                ->where('is_active', true)
                ->orderBy('name')
                ->select('section_code', 'name')
                ->get()
                ->map(function($section) {
                    return [
                        'code' => $section->section_code,
                        'name' => $section->name
                    ];
                });
        }

        return Inertia::render('pos/purchases/index', [
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'sections' => $sections,
            'filters' => $request->only(['search', 'supplier', 'branch', 'status', 'date_from', 'date_to', 'per_page']),
            'download_pdf' => $request->query('download_pdf') === 'true',
            'purchase_id' => $request->query('purchase_id'),
        ]);
    }

    /**
     * Show the form for creating a new purchase.
     */
    public function create(Request $request): Response
    {
        ini_set('memory_limit', '512M');
        ini_set('max_execution_time', '300');
        
        $user = Auth::user();

        if (!$user->hasPermission('purchases.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create purchases.');
        }

        $type = $request->get('type', 'supplier'); // default to supplier
        
        // Get suppliers with AccKy
        $suppliers = \App\Models\AccMas::where('AccTyp', 'SUPPLIER')
            ->where('Status', 'A')
            ->where('company_code', $user->company_code);
        
        $suppliers = $suppliers->orderBy('AccNm')
            ->get()
            ->map(function($supplier) {
                return [
                    'id' => $supplier->AccKy,
                    'code' => $supplier->AccCd,
                    'name' => $supplier->AccNm,
                    'acc_ky' => $supplier->AccKy,
                    'section_code' => $supplier->section_code,
                    'vat_no' => $supplier->VATNo,
                    'vat_registered' => $supplier->fVATRegistered,
                ];
            });

        // Get purchase types from code_master (TAX = Tax)
        $purchaseTypes = \App\Models\CodeMaster::where('conkey', 'TAX')
            ->when($user && $user->company_code, function($q) use ($user) { return $q->where('company_code', $user->company_code); })
            ->where('is_active', true)
            ->orderBy('concode')
            ->get()
            ->map(function($type) {
                return [
                    'code' => $type->concode,
                    'name' => $type->cname,
                    'description' => $type->description,
                ];
            });

        // Get categories for filtering
        $categories = \App\Models\CodeMaster::where('conkey', 'CAT')
            ->where('is_active', true)
            ->where('company_code', $user->company_code)
            ->orderBy('cname')
            ->get()
            ->map(function($category) {
                return [
                    'id' => $category->catkey,
                    'code' => $category->concode,
                    'name' => $category->cname,
                ];
            });

        // Get all products from itemmaster with prices from item_price_det and category info
        $query = Product::where('fInAct', false)
            ->whereHas('itemPriceDet', function($q) use ($user) {
                $q->where('fInAct', false)
                  ->where('company_code', $user->company_code);
            })
            ->with(['itemPriceDet' => function($q) use ($user) {
                $q->where('fInAct', false)
                  ->where('company_code', $user->company_code);
            }, 'category'])
            ->where('company_code', $user->company_code)
            ->select('ItmKy', 'ItemCode', 'ItmNm', 'BarCode', 'catkey', 'CosPri', 'NCostPrice', 'SlsPri', 'WholePrice', 'ExtraPrice', 'CCPrice')
            ->orderBy('ItmNm');

        // Load all stock data in one query for performance
        $stockData = \App\Models\StockInHand::where('company_code', $user->company_code)
            ->where('section_code', $user->section_code)
            ->selectRaw('ItemKy, SUM(Qty) as total_qty, SUM(FreeQty) as total_free_qty')
            ->groupBy('ItemKy')
            ->get()
            ->keyBy('ItemKy');

        // Debug logging
        Log::info('Purchase Create - User company_code: ' . ($user->company_code ?? 'null'));
        Log::info('Purchase Create - User section_code: ' . ($user->section_code ?? 'null'));
        Log::info('Purchase Create - User is super admin: ' . ($this->userIsSuperAdmin($user) ? 'yes' : 'no'));
        Log::info('Purchase Create - Product query count: ' . $query->count());

        $products = $query->get()
            ->map(function($product) use ($user, $stockData) {
                // Get current stock for this product from preloaded data
                $currentStock = $stockData->get($product->ItmKy);

                return [
                    'id' => $product->ItmKy,
                    'code' => $product->ItemCode,
                    'name' => $product->ItmNm,
                    'barcode' => $product->BarCode,
                    'category_id' => $product->catkey,
                    'category_name' => $product->category ? $product->category->cname : null,
                    'cost_price' => (float) ($product->itemPriceDet->first()?->CosPri ?? $product->CosPri ?? 0),
                    'normal_cost' => (float) ($product->itemPriceDet->first()?->NCostPrice ?? $product->NCostPrice ?? 0),
                    'retail_price' => (float) ($product->itemPriceDet->first()?->SlsPri ?? $product->SlsPri ?? 0),
                    'wholesale_price' => (float) ($product->itemPriceDet->first()?->WholePrice ?? $product->WholePrice ?? 0),
                    'extra_price' => (float) ($product->itemPriceDet->first()?->ExtraPrice ?? $product->ExtraPrice ?? 0),
                    'cc_price' => (float) ($product->itemPriceDet->first()?->CCPrice ?? $product->CCPrice ?? 0),
                    'current_stock' => (float) (($currentStock?->total_qty ?? 0) + ($currentStock?->total_free_qty ?? 0)),
                    'free_stock' => (float) ($currentStock?->total_free_qty ?? 0),
                    'brand' => $product->brand ?? null,
                    'model' => $product->model ?? null,
                    'serial_number' => $product->serial_number ?? null,
                ];
            });

        // Get companies and sections for selection
        $companies = collect();
        $sections = collect();
        
        // Super Admin can see all companies and sections
        if ($this->userIsSuperAdmin($user)) {
            $companies = \App\Models\Company::with('packageDetails.packageMaster')
                ->where('subscription_status', 'active')
                ->orderBy('name')
                ->get()
                ->map(function($company) {
                    return [
                        'id' => $company->id,
                        'company_code' => $company->company_code,
                        'name' => $company->name,
                    ];
                });
            
            $sections = \App\Models\Section::where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(function($section) {
                    return [
                        'id' => $section->id,
                        'company_code' => $section->company_code ?? null,
                        'section_code' => $section->section_code,
                        'name' => $section->name,
                        'is_main_stock' => $section->is_main_stock,
                    ];
                });
            } else {
                // Company/Branch users can only see their company and its branches
                if ($user->company_code) {
                    // Get user's company
                    $userCompany = \App\Models\Company::where('company_code', $user->company_code)->first();
                    
                    if ($userCompany) {
                        $companies = collect([
                            [
                                'id' => $userCompany->id,
                                'company_code' => $userCompany->company_code,
                                'name' => $userCompany->name,
                            ]
                        ]);
                        
                        // Role-based section access
                        if ($user->role_id === 2) { // Company Admin - can see all sections in their company
                            $sections = \App\Models\Section::where('company_code', $user->company_code)
                                ->where('is_active', true)
                                ->orderBy('name')
                                ->get()
                                ->map(function($section) use ($user) {
                                    return [
                                        'id' => $section->id,
                                        'company_code' => $user->company_code,
                                        'section_code' => $section->section_code,
                                        'name' => $section->name,
                                        'is_main_stock' => $section->is_main_stock,
                                    ];
                                });
                        } elseif ($user->role_id === 3 || $user->role_id === 4) { // Branch Admin or Staff User - can only see their own section
                            $userSection = \App\Models\Section::where('company_code', $user->company_code)
                                ->where('section_code', $user->section_code)
                                ->where('is_active', true)
                                ->first();
                            
                            if ($userSection) {
                                $sections = collect([$userSection])->map(function($section) use ($user) {
                                    return [
                                        'id' => $section->id,
                                        'company_code' => $user->company_code,
                                        'section_code' => $section->section_code,
                                        'name' => $section->name,
                                        'is_main_stock' => $section->is_main_stock,
                                    ];
                                });
                            }
                        } else {
                            // Other roles - show first section as fallback
                            $firstSection = \App\Models\Section::where('company_code', $user->company_code)
                                ->where('is_active', true)
                                ->orderBy('name')
                                ->first();
                            
                            if ($firstSection) {
                                $sections = collect([$firstSection])->map(function($section) use ($user) {
                                    return [
                                        'id' => $section->id,
                                        'company_code' => $user->company_code,
                                        'section_code' => $section->section_code,
                                        'name' => $section->name,
                                        'is_main_stock' => $section->is_main_stock,
                                    ];
                                });
                            }
                        }
                    }
                }
            }

        // Generate next purchase number and key based on user role
        // For role-based GRN generation:
        // - Super Admin: Can select any company/section
        // - Company Admin: Auto-selected company, can choose section
        // - Branch Admin: Auto-selected company and section
        $previewCompanyCode = null;
        $previewSectionCode = null;
        
        if ($this->userIsSuperAdmin($user)) {
            // Super Admin: Use first available company/section for preview
            $previewCompanyCode = $companies->first()['company_code'] ?? $user->company_code;
            $previewSectionCode = $sections->first()['section_code'] ?? $user->section_code;
        } elseif ($user->role_id === 2) { // Company Admin
            // Company Admin: Use company, first available section for preview
            $previewCompanyCode = $user->company_code;
            $previewSectionCode = $sections->first()['section_code'] ?? $user->section_code;
        } else { // Branch Admin or other roles
            // Branch Admin: Use user's company and section
            $previewCompanyCode = $user->company_code;
            $previewSectionCode = $user->section_code;
        }
        
        // Generate preview purchase number based on role-appropriate company/section
        $maxPurchaseNo = Purchase::where('company_code', $previewCompanyCode)
            ->where('section_code', $previewSectionCode)
            ->max('PurchaseNo') ?? 0;
        $nextPurchaseNo = $maxPurchaseNo + 1;
        
        $maxPurchaseKey = Purchase::max('PurchaseKey') ?? 0;
        $nextPurchaseKey = $maxPurchaseKey + 1;

        // Create user context for role-based UI behavior
        // Resolve company_id and branch_id from codes or user object
        $actualCompanyId = null;
        $actualBranchId = null;
        
        // Find company ID from companies collection based on user's company_code
        if ($user->company_code) {
            $company = collect($companies)->firstWhere('company_code', $user->company_code);
            if ($company) {
                $actualCompanyId = $company['id'];
            }
        }
        
        // Fallback to user's company_id if not found
        if (!$actualCompanyId && $user->company_id) {
            $actualCompanyId = $user->company_id;
        }
        
        // Find branch/section ID from sections collection based on user's section_code
        if ($user->section_code) {
            $section = collect($sections)->firstWhere('section_code', $user->section_code);
            if ($section) {
                $actualBranchId = $section['id'];
            }
        }
        
        // Fallback to user's branch_id if not found
        if (!$actualBranchId && $user->branch_id) {
            $actualBranchId = $user->branch_id;
        }
        
        $userContext = [
            'company_id' => $actualCompanyId,
            'branch_id' => $actualBranchId,
            'is_super_admin' => $this->userIsSuperAdmin($user),
            'is_company_admin' => $user->role_id === 2, // Company Admin role
            'is_branch_admin' => $user->role_id === 3,  // Branch Admin role
            'is_staff_user' => $user->role_id === 4,    // Staff User role
        ];

        // Fetch unique brands and models for suggestion dropdowns
        $existingBrands = \App\Models\Brand::active()
            ->where('company_code', $user->company_code)
            ->with(['category', 'models' => function($query) use ($user) {
                $query->active()
                    ->where('company_code', $user->company_code)
                    ->select('id', 'name', 'brand_id');
            }])
            ->get()
            ->map(function($brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'category_id' => $brand->category_id,
                    'category_code' => $brand->category ? $brand->category->catkey : null,
                    'models' => $brand->models->pluck('name')->toArray(),
                ];
            })
            ->toArray();
            
        $existingModels = \App\Models\PurchaseDet::whereNotNull('model')
            ->where('model', '!=', '')
            ->distinct()
            ->pluck('model')
            ->toArray();

        return Inertia::render('pos/purchases/create', [
            'suppliers' => $suppliers,
            'products' => $products,
            'categories' => $categories,
            'companies' => $companies,
            'branches' => $sections,
            'nextPurchaseNo' => $nextPurchaseNo,
            'previewGrnInfo' => [
                'company_code' => $previewCompanyCode,
                'section_code' => $previewSectionCode,
                'next_number' => $nextPurchaseNo,
            ],
            'userRole' => $user->role_id,
            'userContext' => $userContext,
            'user' => [
                'company_code' => $user->company_code,
                'branch_code' => $user->section_code, // Frontend expects branch_code but DB has section_code
            ],
            'type' => $type,
            'existingBrands' => $existingBrands,
            'existingModels' => $existingModels,
        ]);
    }

    /**
     * Store a newly created purchase in storage.
     * 
     * Role-based GRN Generation:
     * - Super Admin: Can select any company and branch → GRN generated based on selections
     * - Company Admin: Auto-selected company, can choose branch → GRN based on company + selected branch
     * - Branch Admin: Auto-selected company and branch → GRN generated automatically
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('purchases.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create purchases.');
        }

        $validated = $request->validate([
            'type' => ['required', 'in:supplier,transfer', 'string'],
            'supplier_code' => ['required_if:type,supplier', 'nullable', 'string', 'max:50'],
            'company_id' => ['required', 'integer'],
            'branch_id' => ['required', 'integer'],
            'from_section' => ['required_if:type,transfer', 'nullable', 'string'],
            'to_section' => ['required_if:type,transfer', 'nullable', 'string'],
            'grn_date' => ['required', 'date'],
            'supplier_invoice_no' => ['required_if:type,supplier', 'nullable', 'string', 'max:25'],
            'description' => ['nullable', 'string', 'max:100'],
            'batch_no' => ['nullable', 'string', 'max:50'],
            'stock_location_type' => ['nullable', 'string', 'in:main_stock,printing_section'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.product_name' => ['nullable', 'string'], // Add product_name validation for new items
            'items.*.qty' => ['required', 'numeric', 'min:0'],
            'items.*.cost_price' => ['required', 'numeric', 'min:0'],
            'items.*.normal_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.cus_discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.free_qty' => ['nullable', 'numeric', 'min:0'],
            'items.*.retail_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.wholesale_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.extra_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.cc_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.new_cost_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.brand' => ['nullable', 'string'],
            'items.*.model' => ['nullable', 'string'],
            'items.*.serial_number' => ['nullable', 'string'],
            'items.*.warranty' => ['nullable', 'string'],
            'items.*.barcode' => ['nullable', 'string'],
            'items.*.remark' => ['nullable', 'string'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'total_discount' => ['nullable', 'numeric', 'min:0'],
            'total_payable' => ['required', 'numeric', 'min:0'],
        ]);

        // Get the selected section and company information for authorization
        $selectedSection = \App\Models\Section::find($validated['branch_id']);
        $selectedCompany = \App\Models\Company::find($validated['company_id']);
        
        if (!$selectedSection || !$selectedCompany) {
            return back()->withErrors(['error' => 'Invalid company or section selection']);
        }

        // Auto-detect stock_location_type based on section name if not provided
        if (!isset($validated['stock_location_type']) || empty($validated['stock_location_type'])) {
            $sectionName = strtolower($selectedSection->name);
            if (strpos($sectionName, 'printing') !== false || 
                strpos($sectionName, 'printer') !== false || 
                strpos($sectionName, 'delivery') !== false ||
                strpos($sectionName, 'service') !== false) {
                $validated['stock_location_type'] = 'printing_section';
            } else {
                $validated['stock_location_type'] = 'main_stock';
            }
        }

        // Role-based authorization checks for GRN generation
        if (!$this->userIsSuperAdmin($user)) {
            // Company Admin can only create purchases for their company
            if ($user->role_id === 2 && $selectedCompany->company_code !== $user->company_code) {
                return back()->withErrors(['company_id' => 'You can only create purchases for your company']);
            }
            // Branch Admin can only create purchases for their company and section
            if ($user->role_id === 3 && 
                ($selectedCompany->company_code !== $user->company_code || $selectedSection->section_code !== $user->section_code)) {
                return back()->withErrors(['branch_id' => 'You can only create purchases for your assigned section']);
            }
        }

        try {
            DB::beginTransaction();

            // Generate keys based on selected company and section (role-based GRN generation)
            // Use lockForUpdate to prevent race conditions during concurrent requests
            $maxPurchaseNo = Purchase::where('company_code', $selectedCompany->company_code)
                ->where('section_code', $selectedSection->section_code)
                ->lockForUpdate()
                ->max('PurchaseNo') ?? 0;
            $purchaseNo = $maxPurchaseNo + 1;
            
            $maxPurchaseKey = Purchase::lockForUpdate()->max('PurchaseKey') ?? 0;
            $purchaseKey = $maxPurchaseKey + 1;

            // Generate batch_no if not provided
            $batchNo = $validated['batch_no'] ?? \App\Services\NumberGeneratorService::generate(
                $validated['type'] === 'transfer' ? 'TRN' : 'GRN',
                $selectedCompany->company_code,
                $selectedSection->section_code
            );

            $purchase = new Purchase();
            $purchase->company_code = $selectedCompany->company_code;
            $purchase->section_code = $selectedSection->section_code;
            $purchase->PurchaseKey = $purchaseKey;
            $purchase->PurchaseNo = $purchaseNo;
            $purchase->GRNDate = $validated['grn_date'];
            $purchase->type = $validated['type'];

            if ($validated['type'] === 'supplier') {
                // Get supplier AccKy from selected company
                $supplier = Address::where('AdrCd', $validated['supplier_code'])
                    ->where('company_code', $selectedCompany->company_code)
                    ->first();
                
                if (!$supplier) {
                    throw new \Exception("Supplier not found: {$validated['supplier_code']}");
                }
                
                $purchase->SuppCode = $validated['supplier_code'];
                $purchase->AccKy = $supplier->AccKy; // Get AccKy from supplier's account
                $purchase->SuppInvNo = $validated['supplier_invoice_no'] ?? null;
            } else {
                // Transfer
                $purchase->SuppCode = null;
                $purchase->AccKy = null;
                $purchase->SuppInvNo = null;
            }
            $purchase->Des = $validated['description'] ?? null;
            $purchase->batch_no = $batchNo;
            $purchase->barcode = $validated['items'][0]['barcode'] ?? null; // Use first item's barcode as representative
            $purchase->item_name = $validated['items'][0]['product_name'] ?? null; // Use first item's name as representative
            $purchase->CostTotal = $validated['total_amount'];
            $purchase->TotalVal = $validated['total_payable'];
            $purchase->ToIDscount = $validated['total_discount'] ?? 0;
            $purchase->TaxAmount = 0;
            $purchase->AddUser = substr($user->username ?? $user->email, 0, 15);
            $purchase->Status = 'A';
            $purchase->flnact = false;
            $purchase->flused = false;
            $purchase->save();

            // Create new details
            $maxDetKey = PurchaseDet::max('PerchaseDetKy') ?? 0;
            $createdNewItems = []; // Track newly created items
            
            foreach ($validated['items'] as $index => $item) {
                $detKey = $maxDetKey + $index + 1;
                
                $qty = $item['qty'];
                $costPrice = $item['cost_price'];
                $discountRate = $item['discount_rate'] ?? 0;
                $freeQty = $item['free_qty'] ?? 0;
                
                $itemDiscount = ($costPrice * $qty * $discountRate) / 100;
                $amount = ($costPrice * $qty) - $itemDiscount;
                
                // Handle new items (product_id = 0) for both Main Stock and Printing Section
                $actualProductId = $item['product_id'];
                $hasSerialNumber = !empty($item['serial_number']);
                
                // Check if this is a new product (product_id = 0) but barcode exists
                // If barcode exists in database, use existing product instead of creating new
                if ($item['product_id'] == 0 && isset($item['barcode']) && !empty($item['barcode']) && !$hasSerialNumber) {
                    $existingProduct = Product::where('BarCode', $item['barcode'])
                        ->where('company_code', $selectedCompany->company_code)
                        ->where('fInAct', false)
                        ->first();
                    
                    if ($existingProduct) {
                        // Product exists with this barcode - use existing product_id
                        $actualProductId = $existingProduct->ItmKy;
                        Log::info('Found existing product by barcode', [
                            'barcode' => $item['barcode'],
                            'product_id' => $actualProductId,
                            'product_name' => $existingProduct->ItmNm
                        ]);
                    }
                }
                
                // If item has serial number, use ItemKy=0 (printers don't need itemmaster entries)
                if ($item['product_id'] == 0 && $actualProductId == 0 && $hasSerialNumber) {
                    // Printers only exist in purchase_det and stock_in_hand tables
                    $actualProductId = 0;
                } elseif ($item['product_id'] == 0 && $actualProductId == 0 && isset($validated['stock_location_type']) &&
                    $validated['stock_location_type'] === 'main_stock' && !$hasSerialNumber) {
                    // Create new product in itemmaster and item_price_det ONLY for main_stock
                    // Printing section items are tracked in purchase_det directly without master records
                    // Debug logging
                    Log::info('Creating new item for stock', [
                        'stock_location_type' => $validated['stock_location_type'],
                        'product_name' => $item['product_name'] ?? 'N/A',
                        'barcode' => $item['barcode'] ?? 'N/A'
                    ]);

                    // Create new product in itemmaster
                    $maxItmKy = Product::max('ItmKy') ?? 0;
                    $newProductId = $maxItmKy + 1;

                    // Generate unique ItemCode based on stock location type
                    $prefix = $validated['stock_location_type'] === 'printing_section' ? 'PS' : 'MS';
                    $categoryCode = substr($item['brand'] ?? $prefix, 0, 3); // Use first 3 chars of brand or prefix
                    $timeStamp = now()->format('ymdHis'); // YYMMDDHHMMSS
                    $newItemCode = "{$prefix}-{$categoryCode}-{$timeStamp}";

                    Log::info('Generated ItemCode', [
                        'prefix' => $prefix,
                        'categoryCode' => $categoryCode,
                        'timeStamp' => $timeStamp,
                        'newItemCode' => $newItemCode
                    ]);

                    $newProduct = Product::create([
                        'Status' => 'A',
                        'company_code' => $selectedCompany->company_code,
                        'section_code' => $selectedSection->section_code,
                        'ItemCode' => $newItemCode,
                        'BarCode' => $item['barcode'] ?? null,
                        'batch_no' => $batchNo, // Add batch_no to itemmaster
                        'ItmNm' => $item['product_name'] ?? $item['brand'] ?? 'Unknown Product', // Use product_name if provided, fallback to brand
                        'warranty' => $item['warranty'] ?? null,
                        'CosPri' => $costPrice,
                        'NCostPrice' => $item['normal_cost'] ?? $costPrice,
                        'SlsPri' => $item['retail_price'] ?? 0,
                        'WholePrice' => $item['wholesale_price'] ?? 0,
                        'ExtraPrice' => $item['extra_price'] ?? 0,
                        'CCPrice' => $item['cc_price'] ?? 0,
                        'catkey' => 1, // Default category
                        'UnitKy' => 1, // Default unit
                        'ReOrdlLvl' => 0,
                        'ScallItem' => false,
                        'RtQty1' => 0,
                        'RtDis1' => 0,
                        'RtQty2' => 0,
                        'RtDis2' => 0,
                        'RtQty3' => 0,
                        'RtDis3' => 0,
                        'RtQty4' => 0,
                        'RtDis4' => 0,
                        'DiscountQty' => 0,
                        'QuntityDiscount' => 0,
                    ]);

                    // Create corresponding item_price_det record
                    ItemPriceDet::create([
                        'fInAct' => false,
                        'Status' => 'A',
                        'ItmKy' => $newProductId,
                        'batch_no' => $batchNo, // Add batch_no to item_price_det
                        'BarCode' => $item['barcode'] ?? null,
                        'ItemCode' => $newItemCode,
                        'company_code' => $selectedCompany->company_code,
                        'section_code' => $selectedSection->section_code,
                        'warranty' => $item['warranty'] ?? null,
                        'CosPri' => $costPrice,
                        'NCostPrice' => $item['normal_cost'] ?? $costPrice,
                        'SlsPri' => $item['retail_price'] ?? 0,
                        'WholePrice' => $item['wholesale_price'] ?? 0,
                        'ExtraPrice' => $item['extra_price'] ?? 0,
                        'CCPrice' => $item['cc_price'] ?? 0,
                        'RtQty1' => 0,
                        'RtDis1' => 0,
                        'RtQty2' => 0,
                        'RtDis2' => 0,
                        'RtQty3' => 0,
                        'RtDis3' => 0,
                        'RtQty4' => 0,
                        'RtDis4' => 0,
                        'DiscountQty' => 0,
                        'QuntityDiscount' => 0,
                        'ChangedDate' => now(),
                        'uuid' => (string) \Illuminate\Support\Str::uuid(),
                    ]);

                    $actualProductId = $newProductId;
                    $createdNewItems[] = $newProductId;
                } elseif ($item['product_id'] == 0 && $actualProductId == 0 && 
                    isset($validated['stock_location_type']) && 
                    $validated['stock_location_type'] === 'printing_section' && 
                    !$hasSerialNumber) {
                    // Printing section items without serial numbers use ItemKy=0
                    $actualProductId = 0;
                }
                
                $detail = new PurchaseDet();
                $detail->company_code = $selectedCompany->company_code;
                $detail->section_code = $selectedSection->section_code;
                $detail->batch_no = $batchNo;
                $detail->PerchaseDetKy = $detKey;
                $detail->PurchaseKey = $purchase->PurchaseKey;
                $detail->iTimKy = $actualProductId;
                $detail->item_name = $item['product_name'] ?? null; // Add item name to purchase_det
                $detail->Qty = $qty;
                $detail->CostPrice = $costPrice;
                $detail->DiscountRate = $discountRate;
                $detail->CusDiscountRate = $item['cus_discount_rate'] ?? 0;
                $detail->iTimDiscount = $itemDiscount;
                $detail->Free = $freeQty;
                $detail->AmountF = $amount;
                $detail->SalePrice = $item['retail_price'] ?? 0;
                $detail->WholePrice = $item['wholesale_price'] ?? 0;
                $detail->ExtraPrice = $item['extra_price'] ?? 0;
                $detail->CCPrice = $item['cc_price'] ?? 0;
                $detail->NormalCost = $item['normal_cost'] ?? $costPrice;
                $detail->NewCostPrice = $item['new_cost_price'] ?? $costPrice;
                $detail->brand = $item['brand'] ?? null;
                $detail->model = $item['model'] ?? null;
                $detail->serial_number = $item['serial_number'] ?? null;
                $detail->warranty = $item['warranty'] ?? null;
                $detail->barcode = $item['barcode'] ?? null;
                $detail->item_name = $item['product_name'] ?? null; // Add item name to purchase_det
                $detail->stock_location_type = $validated['stock_location_type'] ?? null; // Add stock location type
                $detail->VATItem = ($validated['stock_location_type'] ?? null) === 'printing_section' ? true : false; // Auto-set VAT for printing section
                $detail->remark = $item['remark'] ?? null;
                $detail->Status = 'A';
                $detail->flnAct = false;
                $detail->save();
                
                // Auto-create model in models table if it's a new model
                if (!empty($item['brand']) && !empty($item['model'])) {
                    // Find the brand by name
                    $brand = \App\Models\Brand::where('name', $item['brand'])
                        ->where('company_code', $selectedCompany->company_code)
                        ->where('is_active', true)
                        ->first();
                    
                    if ($brand) {
                        // Check if model already exists for this brand
                        $existingModel = \App\Models\ProductModel::where('name', $item['model'])
                            ->where('brand_id', $brand->id)
                            ->where('company_code', $selectedCompany->company_code)
                            ->first();
                        
                        // If model doesn't exist, create it
                        if (!$existingModel) {
                            // Generate unique code per company (shared across all sections)
                            $models = \App\Models\ProductModel::where('company_code', $selectedCompany->company_code)
                                ->where('code', 'LIKE', 'MDL%')
                                ->pluck('code');

                            $maxNumber = 0;
                            foreach ($models as $existingCode) {
                                if (preg_match('/^MDL(\d+)$/', $existingCode, $matches)) {
                                    $maxNumber = max($maxNumber, (int) $matches[1]);
                                }
                            }

                            // Find next available code (handle concurrent requests)
                            $code = null;
                            $attempts = 0;
                            while ($code === null && $attempts < 100) {
                                $nextNumber = $maxNumber + 1 + $attempts;
                                $testCode = 'MDL' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                                
                                // Check if this code is already taken in this company
                                $exists = \App\Models\ProductModel::where('code', $testCode)
                                    ->where('company_code', $selectedCompany->company_code)
                                    ->exists();
                                
                                if (!$exists) {
                                    $code = $testCode;
                                } else {
                                    $attempts++;
                                }
                            }

                            if ($code === null) {
                                throw new \Exception('Unable to generate unique model code after 100 attempts');
                            }

                            \App\Models\ProductModel::create([
                                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                                'code' => $code,
                                'name' => $item['model'],
                                'brand_id' => $brand->id,
                                'company_code' => $selectedCompany->company_code,
                                'section_code' => $selectedSection->section_code,
                                'is_active' => true,
                            ]);
                            
                            Log::info('Created new model', [
                                'model_name' => $item['model'],
                                'brand_id' => $brand->id,
                                'brand_name' => $brand->name,
                                'code' => $code,
                            ]);
                        }
                    }
                }
            }

            // Add new stock entries for new items
            foreach ($validated['items'] as $index => $item) {
                $trnTyp = $validated['type'] === 'transfer' ? 'TRN' : 'GRN';
                
                // For new items (product_id = 0), use the actual created product ID
                $actualItemKy = $item['product_id'];
                if ($item['product_id'] == 0 && isset($validated['stock_location_type']) &&
                    $validated['stock_location_type'] === 'main_stock') {
                    // Find the created product ID for this item (by index)
                    $productCreationIndex = 0;
                    foreach ($validated['items'] as $i => $checkItem) {
                        if ($checkItem['product_id'] == 0) {
                            if ($i == $index) {
                                $actualItemKy = $createdNewItems[$productCreationIndex] ?? 0;
                                break;
                            }
                            $productCreationIndex++;
                        }
                    }
                }
                
                \App\Models\StockInHand::create([
                    'company_code' => $selectedCompany->company_code,
                    'section_code' => $selectedSection->section_code,
                    'RefNo' => $selectedCompany->company_code . '-' . $selectedSection->section_code . '-' . sprintf('%06d', $purchaseNo),
                    'Cky' => $selectedCompany->id,
                    'OrdDate' => $validated['grn_date'],
                    'ItemKy' => $actualItemKy,
                    'Qty' => $item['qty'],
                    'FreeQty' => $item['free_qty'] ?? 0,
                    'TrnTyp' => $trnTyp,
                    'OrdKy' => $purchase->PurchaseKey,
                    'batch_no' => $batchNo,
                    'brand' => $item['brand'] ?? null,
                    'model' => $item['model'] ?? null,
                    'serial_number' => $item['serial_number'] ?? null,
                    'warranty' => $item['warranty'] ?? null,
                ]);

                // For transfer, create StockTransfer log
                if ($validated['type'] === 'transfer') {
                    \App\Models\StockTransfer::create([
                        'from_section_code' => $validated['from_section'],
                        'to_section_code' => $selectedSection->section_code,
                        'item_id' => $actualItemKy,
                        'quantity' => $item['qty'],
                        'cost_price' => $item['cost_price'],
                        'transfer_date' => $validated['grn_date'],
                        'notes' => 'GRN Transfer',
                        'company_code' => $selectedCompany->company_code,
                    ]);
                }
            }

            // Update product prices in itemmaster and item_price_det
            $productUpdates = [];
            foreach ($validated['items'] as $item) {
                $productId = $item['product_id'];
                if (!isset($productUpdates[$productId])) {
                    // Check if new_cost_price is provided and different from cost_price
                    $costPriceToUse = isset($item['new_cost_price']) && $item['new_cost_price'] != $item['cost_price']
                        ? $item['new_cost_price']
                        : $item['cost_price'];

                    $productUpdates[$productId] = [
                        'cos_pri' => $costPriceToUse,
                        'n_cost_price' => $item['normal_cost'] ?? $item['cost_price'],
                        'sls_pri' => $item['retail_price'] ?? 0,
                        'whole_price' => $item['wholesale_price'] ?? 0,
                        'extra_price' => $item['extra_price'] ?? 0,
                        'cc_price' => $item['cc_price'] ?? 0,
                        'only_cost_price_changed' => isset($item['new_cost_price']) && $item['new_cost_price'] != $item['cost_price'] &&
                                                   $item['normal_cost'] == $item['cost_price'] &&
                                                   $item['retail_price'] == 0 &&
                                                   $item['wholesale_price'] == 0 &&
                                                   $item['extra_price'] == 0 &&
                                                   $item['cc_price'] == 0,
                        'item_data' => $item, // Store item data for ItemPriceDet creation
                    ];
                }
            }

            foreach ($productUpdates as $productId => $prices) {
                // Skip updating if product_id is 0 or less (e.g. main stock serialized entries without a product master)
                // Also skip newly created items since they already have the correct prices
                if ($productId <= 0 || in_array($productId, $createdNewItems)) {
                    continue;
                }

                // Get current product prices
                $currentProduct = Product::where('ItmKy', $productId)
                    ->where('company_code', $user->company_code)
                    ->first();

                if ($currentProduct) {
                    // Always create ItemPriceDet record for each item in the purchase
                    // Get current item_price_det for this product
                    $currentPriceDet = ItemPriceDet::where('ItmKy', $productId)
                        ->latest('ChangedDate')
                        ->first();

                    // Insert new row in item_price_det with current prices
                    ItemPriceDet::create([
                        'fInAct' => false,
                        'Status' => 'A',
                        'ItmKy' => $productId,
                        'ItemCode' => $currentProduct->ItemCode,
                        'BarCode' => $prices['item_data']['barcode'] ?? $currentProduct->BarCode ?? null,
                        'company_code' => $selectedCompany->company_code,
                        'section_code' => $selectedSection->section_code,
                        'brand' => $prices['item_data']['brand'] ?? $currentProduct->brand ?? null,
                        'model' => $prices['item_data']['model'] ?? $currentProduct->model ?? null,
                        'serial_number' => $prices['item_data']['serial_number'] ?? $currentProduct->serial_number ?? null,
                        'warranty' => $prices['item_data']['warranty'] ?? null,
                        'CosPri' => $prices['cos_pri'],
                        'NCostPrice' => $prices['n_cost_price'],
                        'SlsPri' => $prices['sls_pri'],
                        'WholePrice' => $prices['whole_price'],
                        'ExtraPrice' => $prices['extra_price'],
                        'CCPrice' => $prices['cc_price'],
                        'RtQty1' => $currentPriceDet->RtQty1 ?? $currentProduct->RtQty1 ?? 0,
                        'RtDis1' => $currentPriceDet->RtDis1 ?? $currentProduct->RtDis1 ?? 0,
                        'RtQty2' => $currentPriceDet->RtQty2 ?? $currentProduct->RtQty2 ?? 0,
                        'RtDis2' => $currentPriceDet->RtDis2 ?? $currentProduct->RtDis2 ?? 0,
                        'RtQty3' => $currentPriceDet->RtQty3 ?? $currentProduct->RtQty3 ?? 0,
                        'RtDis3' => $currentPriceDet->RtDis3 ?? $currentProduct->RtDis3 ?? 0,
                        'RtQty4' => $currentPriceDet->RtQty4 ?? $currentProduct->RtQty4 ?? 0,
                        'RtDis4' => $currentPriceDet->RtDis4 ?? $currentProduct->RtDis4 ?? 0,
                        'DiscountQty' => $currentPriceDet->DiscountQty ?? $currentProduct->DiscountQty ?? 0,
                        'QuntityDiscount' => $currentPriceDet->QuntityDiscount ?? $currentProduct->QuntityDiscount ?? 0,
                        'ChangedDate' => now(),
                        'uuid' => (string) \Illuminate\Support\Str::uuid(),
                    ]);

                    // Check if any price has changed for updating itemmaster
                    $hasChanged = 
                        $currentProduct->CosPri != $prices['cos_pri'] ||
                        $currentProduct->NCostPrice != $prices['n_cost_price'] ||
                        $currentProduct->SlsPri != $prices['sls_pri'] ||
                        $currentProduct->WholePrice != $prices['whole_price'] ||
                        $currentProduct->ExtraPrice != $prices['extra_price'] ||
                        $currentProduct->CCPrice != $prices['cc_price'];

                    if ($hasChanged) {
                        // Update itemmaster - conditionally update only CosPri if only cost price changed
                        if ($prices['only_cost_price_changed']) {
                            Product::where('ItmKy', $productId)
                                ->where('company_code', $selectedCompany->company_code)
                                ->update([
                                    'CosPri' => $prices['cos_pri'],
                                ]);
                        } else {
                            Product::where('ItmKy', $productId)
                                ->where('company_code', $selectedCompany->company_code)
                                ->update([
                                    'CosPri' => $prices['cos_pri'],
                                    'NCostPrice' => $prices['n_cost_price'],
                                    'SlsPri' => $prices['sls_pri'],
                                    'WholePrice' => $prices['whole_price'],
                                    'ExtraPrice' => $prices['extra_price'],
                                    'CCPrice' => $prices['cc_price'],
                                ]);
                        }
                    }
                }
            }

            DB::commit();

            // Update supplier's outstanding balance for supplier purchases
            if ($validated['type'] === 'supplier' && isset($supplier)) {
                $supplierAcc = AccMas::where('AccKy', $supplier->AccKy)->first();
                if ($supplierAcc) {
                    $supplierAcc->CurBal -= (float) $purchase->TotalVal; // We owe more, so balance decreases (more negative)
                    $supplierAcc->save();

                    // Create Accounting Transaction
                    \App\Models\AccTrn::create([
                        'AccKy' => $supplierAcc->AccKy,
                        'TrnDt' => $validated['grn_date'],
                        'TrnNo' => $purchase->company_code . '-' . $purchase->section_code . '-' . sprintf('%06d', $purchase->PurchaseNo),
                        'Amt' => -(float) $purchase->TotalVal, // Negative for GRN (liability increase)
                        'VaucherNo' => $validated['supplier_invoice_no'] ?? null,
                        'Dec' => 'GRN - ' . ($validated['description'] ?? 'Supplier Purchase'),
                        'FInAct' => 1,
                        'Status' => 'A',
                        'company_code' => $selectedCompany->company_code,
                        'section_code' => $selectedSection->section_code,
                        'customer_code' => $supplier->AdrCd,
                        'customer_name' => $supplier->FstNm ?? 'N/A',
                    ]);
                }
            }

            // Redirect with query parameters to trigger PDF download
            return redirect()
                ->route('pos.purchases.index', [
                    'purchase_id' => $purchaseKey,
                    'download_pdf' => 'true'
                ])
                ->with('success', "Purchase " . $purchase->company_code . '-' . $purchase->section_code . '-' . sprintf('%06d', $purchaseNo) . " created successfully!");

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()
                ->withErrors(['error' => 'Failed to create purchase. ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified purchase.
     * Note: View temporarily redirects to index until show page is created
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $purchase = Purchase::with(['supplier', 'section', 'details.product'])
            ->where('PurchaseKey', $id)
            ->where('company_code', $user->company_code)
            ->firstOrFail();

        return Inertia::render('pos/purchases/show', [
            'purchase' => [
                'id' => $purchase->PurchaseKey,
                'purchase_no' => $purchase->company_code . '-' . $purchase->section_code . '-' . sprintf('%06d', $purchase->PurchaseNo),
                'date' => $purchase->GRNDate->format('Y-m-d'),
                'supplier_code' => $purchase->SuppCode,
                'supplier_name' => $purchase->supplier->FstNm ?? 'N/A',
                'supplier_invoice_no' => $purchase->SuppInvNo,
                'company_code' => $purchase->company_code,
                'branch_code' => $purchase->section_code,
                'branch_name' => $purchase->section->SecNm ?? 'N/A',
                'purchase_type' => $purchase->Purchase_Type,
                'description' => $purchase->Des,
                'total_amount' => (float) $purchase->TotalVal,
                'total_discount' => (float) $purchase->ToIDscount,
                'total_payable' => (float) $purchase->TotalVal,
                'status' => $purchase->Status,
                'is_used' => (bool) $purchase->flused,
                'is_inactive' => (bool) $purchase->flInActive,
                'created_at' => $purchase->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $purchase->updated_at->format('Y-m-d H:i:s'),
                'can_edit' => true,
                'can_delete' => !$purchase->flused,
                'items' => $purchase->details->map(function($detail) {
                    return [
                        'id' => $detail->PerchaseDetKy,
                        'product_id' => $detail->iTimKy,
                        'product_code' => $detail->product ? ($detail->product->ItemCode ?? '') : '',
                        'product_name' => $detail->product ? ($detail->product->ItmNm ?? 'N/A') : ($detail->item_name ?? 'Consumable'),
                        'qty' => (float) $detail->Qty,
                        'cost_price' => (float) $detail->CostPrice,
                        'brand' => $detail->brand ?? '',
                        'model' => $detail->model ?? '',
                        'serial_number' => $detail->serial_number ?? '',
                        'warranty' => $detail->warranty ?? '',
// In show() method
                        'item_discount' => (float) $detail->iTimDiscount,
                        'amount' => (float) $detail->AmountF,
                        'free_qty' => (float) $detail->Free,
                        'discount_rate' => (float) ($detail->DiscountRate ?? 0),
                        'cus_discount_rate' => (float) ($detail->CusDiscountRate ?? 0),
                    ];
                }),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified purchase.
     * Note: View temporarily redirects to index until edit page is created
     */
    public function edit($id)
    {
        ini_set('memory_limit', '512M');
        ini_set('max_execution_time', '300');
        ini_set('memory_limit', '512M');
        ini_set('max_execution_time', '300');

        $user = Auth::user();
        
        $purchase = Purchase::with(['supplier', 'details.product'])
            ->where('PurchaseKey', $id)
            ->where('company_code', $user->company_code)
            ->firstOrFail();

        // Check if can edit
        if ($purchase->flused) {
            return redirect()->back()->with('error', 'Cannot edit a posted purchase');
        }

        // Get suppliers
        $suppliers = \App\Models\AccMas::where('AccTyp', 'SUPP')
            ->where('Status', 'A')
            ->where('company_code', $user->company_code);
        
        // Filter by section for branch admins and staff users
        if ($user->role_id === 3 || $user->role_id === 4) { // Branch Admin or Staff User
            $suppliers->where('section_code', $user->section_code);
        }
        
        $suppliers = $suppliers->orderBy('AccNm')
            ->get()
            ->map(function($supplier) {
                return [
                    'id' => $supplier->AccKy,
                    'code' => $supplier->AccCd,
                    'name' => $supplier->AccNm,
                    'acc_ky' => $supplier->AccKy,
                    'section_code' => $supplier->section_code,
                    'vat_no' => $supplier->VATNo,
                    'vat_registered' => $supplier->fVATRegistered,
                ];
            });

        // Get categories for filtering
        $categories = \App\Models\CodeMaster::where('conkey', 'CAT')
            ->where('is_active', true)
            ->where('company_code', $user->company_code)
            ->orderBy('cname')
            ->get()
            ->map(function($category) {
                return [
                    'id' => $category->catkey,
                    'code' => $category->concode,
                    'name' => $category->cname,
                ];
            });

        // Get all products from itemmaster with prices from item_price_det and category info
        $query = Product::where('fInAct', false)
            ->whereHas('itemPriceDet', function($q) use ($user) {
                $q->where('fInAct', false)
                    ->where('company_code', $user->company_code);
            })
            ->with(['itemPriceDet' => function($q) use ($user) {
                $q->where('fInAct', false)
                    ->where('company_code', $user->company_code);
            }, 'category'])
            ->where('company_code', $user->company_code)
            ->select('ItmKy', 'ItemCode', 'ItmNm', 'BarCode', 'catkey', 'CosPri', 'NCostPrice', 'SlsPri', 'WholePrice', 'ExtraPrice', 'CCPrice')
            ->orderBy('ItmNm');

        // Debug logging
        Log::info('Purchase Edit - User company_code: ' . ($user->company_code ?? 'null'));
        Log::info('Purchase Edit - User section_code: ' . ($user->section_code ?? 'null'));
        Log::info('Purchase Edit - Product query count: ' . $query->count());

        // Load all stock data in one query for performance
        $stockData = \App\Models\StockInHand::where('company_code', $user->company_code)
            ->where('section_code', $user->section_code)
            ->selectRaw('ItemKy, SUM(Qty) as total_qty, SUM(FreeQty) as total_free_qty')
            ->groupBy('ItemKy')
            ->get()
            ->keyBy('ItemKy');

        $products = $query->get()
            ->map(function($product) use ($user, $stockData) {
                // Get current stock for this product from preloaded data
                $currentStock = $stockData->get($product->ItmKy);

                return [
                    'id' => $product->ItmKy,
                    'code' => $product->ItemCode,
                    'name' => $product->ItmNm,
                    'barcode' => $product->BarCode,
                    'category_id' => $product->catkey,
                    'category_name' => $product->category ? $product->category->cname : null,
                    'cost_price' => (float) ($product->itemPriceDet->first()?->CosPri ?? $product->CosPri ?? 0),
                    'normal_cost' => (float) ($product->itemPriceDet->first()?->NCostPrice ?? $product->NCostPrice ?? 0),
                    'retail_price' => (float) ($product->itemPriceDet->first()?->SlsPri ?? $product->SlsPri ?? 0),
                    'wholesale_price' => (float) ($product->itemPriceDet->first()?->WholePrice ?? $product->WholePrice ?? 0),
                    'extra_price' => (float) ($product->itemPriceDet->first()?->ExtraPrice ?? $product->ExtraPrice ?? 0),
                    'cc_price' => (float) ($product->itemPriceDet->first()?->CCPrice ?? $product->CCPrice ?? 0),
                    'current_stock' => (float) (($currentStock?->total_qty ?? 0) + ($currentStock?->total_free_qty ?? 0)),
                    'free_stock' => (float) ($currentStock?->total_free_qty ?? 0),
                ];
            });

        return Inertia::render('pos/purchases/edit', [
            'purchase' => [
                'id' => $purchase->PurchaseKey,
                'purchase_no' => $purchase->company_code . '-' . $purchase->section_code . '-' . sprintf('%06d', $purchase->PurchaseNo),
                'supplier_code' => $purchase->SuppCode,
                'supplier_name' => $purchase->supplier->FstNm ?? 'N/A',
                'date' => $purchase->GRNDate->format('Y-m-d'),
                'supplier_invoice_no' => $purchase->SuppInvNo,
                'company_code' => $purchase->company_code,
                'purchase_type' => $purchase->type ?? 'supplier', // Or use Purchase_Type logic
                'description' => $purchase->Des,
                'total_amount' => (float) $purchase->CostTotal,
                'total_discount' => (float) $purchase->ToIDscount,
                'total_payable' => (float) $purchase->TotalVal,
                'status' => $purchase->Status,
                'is_used' => (bool) $purchase->flused,
                'is_inactive' => (bool) $purchase->flnact,
                'created_at' => $purchase->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $purchase->updated_at->format('Y-m-d H:i:s'),
                'items' => $purchase->details->map(function($detail) {
                    // For printing section items (iTimKy = 0), use stored item_name instead of product relationship
                    if ($detail->iTimKy == 0) {
                        return [
                            'id' => $detail->PerchaseDetKy, // Ensure ID is passed
                            'product_id' => $detail->iTimKy,
                            'product_code' => '', // No product code for printing section items
                            'product_name' => $detail->item_name ?? 'Printing Consumable',
                            'qty' => (float) $detail->Qty,
                            'cost_price' => (float) $detail->CostPrice,
                            'item_discount' => (float) $detail->iTimDiscount, // Ensure item_discount is passed
                            'discount_rate' => (float) $detail->DiscountRate,
                            'free_qty' => (float) $detail->Free,
                            'retail_price' => (float) $detail->SalePrice,
                            'wholesale_price' => (float) $detail->WholePrice,
                            'extra_price' => (float) $detail->ExtraPrice,
                            'cc_price' => (float) $detail->CCPrice,
                            'new_cost_price' => (float) $detail->NewCostPrice,
                            'normal_cost' => (float) $detail->NormalCost,
                            'brand' => $detail->brand,
                            'model' => $detail->model,
                            'serial_number' => $detail->serial_number,
                            'warranty' => $detail->warranty,
                            'barcode' => $detail->barcode,
                            'stock_location_type' => $detail->stock_location_type,
                        ];
                    } else {
                        // Regular products
                        return [
                            'id' => $detail->PerchaseDetKy, // Ensure ID is passed
                            'product_id' => $detail->iTimKy,
                            'product_code' => $detail->product->ItemCode ?? '',
                            'product_name' => $detail->product->ItmNm ?? '',
                            'qty' => (float) $detail->Qty,
                            'cost_price' => (float) $detail->CostPrice,
                            'item_discount' => (float) $detail->iTimDiscount, // Ensure item_discount is passed
                            'discount_rate' => (float) $detail->DiscountRate,
                            'free_qty' => (float) $detail->Free,
                            'retail_price' => (float) $detail->SalePrice,
                            'wholesale_price' => (float) $detail->WholePrice,
                            'extra_price' => (float) $detail->ExtraPrice,
                            'cc_price' => (float) $detail->CCPrice,
                            'new_cost_price' => (float) $detail->NewCostPrice,
                            'normal_cost' => (float) $detail->NormalCost,
                            'brand' => $detail->brand,
                            'model' => $detail->model,
                            'serial_number' => $detail->serial_number,
                            'warranty' => $detail->warranty,
                            'barcode' => $detail->barcode,
                            'stock_location_type' => $detail->stock_location_type,
                        ];
                    }
                }),
            ],
            'suppliers' => $suppliers,
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified purchase in storage.
     */
    public function update(Request $request, $id): RedirectResponse
    {
        $user = Auth::user();

        /** @var Purchase $purchase */
        $purchase = Purchase::where('PurchaseKey', $id)
            ->where('company_code', $user->company_code)
            ->firstOrFail();

        $validated = $request->validate([
            'supplier_invoice_no' => ['nullable', 'string', 'max:25'],
            'description' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.qty' => ['required', 'numeric', 'min:0'],
            'items.*.cost_price' => ['required', 'numeric', 'min:0'],
            'items.*.item_discount' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.cus_discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.free_qty' => ['nullable', 'numeric', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            $oldTotalVal = $purchase->TotalVal; // Store old total for balance adjustment

            // Update purchase header fields only
            $purchase->SuppInvNo = $validated['supplier_invoice_no'] ?? null;
            $purchase->Des = $validated['description'] ?? null;

            // Calculate new totals
            $totalAmount = 0;
            $totalDiscount = 0;

            // Recalculate totals from items
            foreach ($validated['items'] as $item) {
                // Calculate line discount and amount based on rate if provided, or fallback to passed discount
                $qty = $item['qty'];
                $costPrice = $item['cost_price'];
                $discountRate = $item['discount_rate'] ?? 0;
                
                // If discount rate is provided, recalculate item discount
                if (isset($item['discount_rate'])) {
                    $itemDiscount = ($costPrice * $qty * $discountRate) / 100;
                } else {
                    $itemDiscount = $item['item_discount'] ?? 0;
                }
                
                $itemAmount = ($qty * $costPrice) - $itemDiscount;
                
                $totalAmount += ($qty * $costPrice);
                $totalDiscount += $itemDiscount;
            }

            $purchase->CostTotal = $totalAmount;
            $purchase->TotalVal = $totalAmount - $totalDiscount;
            $purchase->ToIDscount = $totalDiscount;
            $purchase->save();

            // Adjust supplier balance for total change
            if ($purchase->type === 'supplier' && $purchase->AccKy) {
                $supplierAcc = AccMas::where('AccKy', $purchase->AccKy)->first();
                if ($supplierAcc) {
                    $totalChange = $purchase->TotalVal - $oldTotalVal;
                    $supplierAcc->CurBal -= (float) $totalChange; // Adjust balance by the difference
                    $supplierAcc->save();
                }
            }

            // Update details
            foreach ($validated['items'] as $item) {
                $detail = PurchaseDet::find($item['id']);
                
                if ($detail) {
                    $qty = $item['qty'];
                    $costPrice = $item['cost_price'];
                    $discountRate = $item['discount_rate'] ?? 0;
                    
                    if (isset($item['discount_rate'])) {
                        $itemDiscount = ($costPrice * $qty * $discountRate) / 100;
                    } else {
                        $itemDiscount = $item['item_discount'] ?? 0;
                    }
                    
                    $amount = ($qty * $costPrice) - $itemDiscount;

                    $detail->Qty = $qty;
                    $detail->CostPrice = $costPrice;
                    $detail->DiscountRate = $discountRate;
                    $detail->CusDiscountRate = $item['cus_discount_rate'] ?? 0;
                    $detail->iTimDiscount = $itemDiscount;
                    $detail->AmountF = $amount;
                    $detail->Free = $item['free_qty'] ?? 0;
                    $detail->save();
                }
            }

            // Sync Stock In Hand: Delete all and recreate to ensure consistency (handle duplicates, etc)
            // Get Company ID
            $companyId = \App\Models\Company::where('company_code', $purchase->company_code)->value('id');
            
            // Delete existing stock entries for this purchase
            \App\Models\StockInHand::where('OrdKy', $purchase->PurchaseKey)
                ->where('company_code', $purchase->company_code)
                ->where('section_code', $purchase->section_code)
                ->delete();

            // Determine TrnTyp
            $trnTyp = $purchase->type === 'transfer' ? 'TRN' : 'GRN';

            // Recreate stock entries from refreshed details
            $purchase->refresh();
            foreach ($purchase->details as $detail) {
                // Ensure active items only? purchase_det flnAct should match purchase flnAct usually
                if ($detail->Status == 'A') {
                   \App\Models\StockInHand::create([
                       'company_code' => $purchase->company_code,
                       'section_code' => $purchase->section_code,
                       'RefNo' => $purchase->company_code . '-' . $purchase->section_code . '-' . sprintf('%06d', $purchase->PurchaseNo),
                       'Cky' => $companyId,
                       'OrdDate' => $purchase->GRNDate,
                       'ItemKy' => $detail->iTimKy,
                       'Qty' => $detail->Qty,
                       'FreeQty' => $detail->Free,
                       'TrnTyp' => $trnTyp,
                       'OrdKy' => $purchase->PurchaseKey,
                       'batch_no' => $purchase->batch_no,
                       'brand' => $detail->brand,
                       'model' => $detail->model,
                       'serial_number' => $detail->serial_number,
                       'warranty' => $detail->warranty,
                   ]); 
                }
            }

            DB::commit();

            return redirect()
                ->route('pos.purchases.show', $id)
                ->with('success', 'Purchase updated successfully with stock synchronization.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()
                ->withErrors(['error' => 'Failed to update purchase. ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Remove the specified purchase from storage.
     */
    /**
     * Remove the specified purchase from storage.
     */
    public function destroy($id): RedirectResponse
    {
        $user = Auth::user();

        $purchase = Purchase::where('PurchaseKey', $id)
            ->where('company_code', $user->company_code)
            ->firstOrFail();

        // Check if can delete
        if ($purchase->flused) {
            return back()->withErrors(['error' => 'Cannot delete a posted purchase']);
        }

        try {
            DB::beginTransaction();

            // 1. Remove stock entries that were created by this GRN
            // Note: TrnTyp is stored as 'GRN' or 'TRN' (for transfers), not 'PURCHASE'
            \App\Models\StockInHand::where('OrdKy', $purchase->PurchaseKey)
                ->where('company_code', $purchase->company_code)
                ->where('section_code', $purchase->section_code)
                ->whereIn('TrnTyp', ['GRN', 'TRN', 'PURCHASE']) // Cover all potential types
                ->delete();

            // 2. Delete details
            PurchaseDet::where('PurchaseKey', $purchase->PurchaseKey)->delete();
            
            // 3. Reverse supplier balance for supplier purchases
            if ($purchase->type === 'supplier' && $purchase->AccKy) {
                $supplierAcc = AccMas::where('AccKy', $purchase->AccKy)->first();
                if ($supplierAcc) {
                    $supplierAcc->CurBal += (float) $purchase->TotalVal; // Reverse the debt
                    $supplierAcc->save();
                }
            }
            
            // 4. Delete master
            $purchase->delete();

            DB::commit();

            return redirect()
                ->route('pos.purchases.index')
                ->with('success', 'Purchase deleted successfully! Stock reversed.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->withErrors(['error' => 'Failed to delete purchase. ' . $e->getMessage()]);
        }
    }

    /**
     * Cancel (soft-cancel) the specified purchase.
     * This will: delete stock_in_hand records created by this GRN and mark the purchase/details inactive.
     */
    public function cancel(Request $request, $id): RedirectResponse
    {
        $user = Auth::user();

        $purchase = Purchase::where('PurchaseKey', $id)
            ->where('company_code', $user->company_code)
            ->firstOrFail();

        // Do not allow cancelling a posted purchase
        if ($purchase->flused) {
            return back()->withErrors(['error' => 'Cannot cancel a posted purchase']);
        }

        try {
            DB::beginTransaction();

            // Remove stock entries that were created by this GRN
            \App\Models\StockInHand::where('OrdKy', $purchase->PurchaseKey)
                ->where('company_code', $user->company_code)
                ->where('section_code', $user->section_code)
                ->where('TrnTyp', 'PURCHASE')
                ->delete();

            // Reverse supplier balance for supplier purchases
            if ($purchase->type === 'supplier' && $purchase->AccKy) {
                $supplierAcc = AccMas::where('AccKy', $purchase->AccKy)->first();
                if ($supplierAcc) {
                    $supplierAcc->CurBal += (float) $purchase->TotalVal; // Reverse the debt
                    $supplierAcc->save();
                }
            }

            // Mark purchase details inactive
            PurchaseDet::where('PurchaseKey', $purchase->PurchaseKey)
                ->update([
                    'Status' => 'I',
                    'flnAct' => true,
                ]);

            // Mark purchase master inactive
            $purchase->Status = 'I';
            $purchase->flnact = true;
            $purchase->save();

            DB::commit();

            return redirect()
                ->route('pos.purchases.index')
                ->with('success', "Purchase cancelled successfully!");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to cancel purchase. ' . $e->getMessage()]);
        }
    }

    /**
     * Generate PDF for filtered purchases (bulk report).
     */
    public function downloadBulkPdf(Request $request)
    {
        try {
            $user = Auth::user();

            // Build the same query as the index method
            $query = Purchase::with(['supplier', 'details'])
                ->where('company_code', $user->company_code);

            // Apply search filter
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    // Search in purchase number (both formatted and raw)
                    $q->where('PurchaseNo', 'LIKE', "%{$search}%")
                      ->orWhere('SuppInvNo', 'LIKE', "%{$search}%")
                      ->orWhere('SuppCode', 'LIKE', "%{$search}%")
                      ->orWhere('Des', 'LIKE', "%{$search}%");

                    // Also search for formatted GRN numbers (e.g., "C5C5-BR001TAX-000123" or "C5C5-BR001NON-000123")
                    // Pattern: CompanyCode-BranchCodeTAX/NON-Number
                    if (preg_match('/^([A-Z0-9]+)-([A-Z0-9]+)(TAX|NON)-(\d+)$/', $search, $matches)) {
                        $purchaseNo = (int) $matches[4];
                        $taxType = $matches[3] === 'NON' ? 'TAX002' : 'TAX001';
                        $q->orWhere('PurchaseNo', $purchaseNo)->where('Purchase_Type', $taxType);
                    }

                    // Search for partial GRN matches
                    if (preg_match('/^([A-Z0-9]+)-([A-Z0-9]+)(TAX|NON)-(\d*)$/', $search, $matches)) {
                        $partialNo = $matches[4];
                        if (!empty($partialNo)) {
                            $taxType = $matches[3] === 'NON' ? 'TAX002' : 'TAX001';
                            $q->orWhereRaw('PurchaseNo LIKE ?', ["{$partialNo}%"])->where('Purchase_Type', $taxType);
                        }
                    }
                });
            }

            // Filter by supplier
            if ($request->filled('supplier')) {
                $query->where('SuppCode', $request->supplier);
            }

            // Filter by status
            if ($request->filled('status')) {
                if ($request->status === 'posted') {
                    $query->where('flused', true);
                } elseif ($request->status === 'active') {
                    $query->where('flused', false)->where('Status', 'A')->where('flnact', false);
                } elseif ($request->status === 'inactive') {
                    $query->where(function($q) {
                        $q->where('flnact', true)->orWhere('Status', 'I');
                    });
                }
            }

            // Filter by date range
            if ($request->filled('date_from')) {
                $query->whereDate('GRNDate', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('GRNDate', '<=', $request->date_to);
            }

            // Get all purchases (not paginated) for PDF
            $purchases = $query->latest('GRNDate')->get();

            // Load relationships for PDF
            $purchases->load(['supplier', 'details.product', 'company', 'branch']);

            // Group purchases by date for better organization
            $groupedPurchases = $purchases->groupBy(function($purchase) {
                return $purchase->GRNDate->format('Y-m-d');
            });

            // Separate active and inactive purchases
            $activePurchases = $purchases->where('flnact', false);
            $inactivePurchases = $purchases->where('flnact', true);

            // Prepare data for PDF
            $data = [
                'purchases' => $purchases,
                'groupedPurchases' => $groupedPurchases,
                'activePurchases' => $activePurchases,
                'inactivePurchases' => $inactivePurchases,
                'filters' => [
                    'search' => $request->input('search'),
                    'supplier' => $request->input('supplier'),
                    'status' => $request->input('status'),
                    'date_from' => $request->input('date_from'),
                    'date_to' => $request->input('date_to'),
                ],
                'generated_at' => now()->format('d M Y, h:i A'),
                'generated_by' => $user->username,
                'total_purchases' => $purchases->count(),
                'total_value' => $purchases->sum('TotalVal'),
                'active_count' => $activePurchases->count(),
                'inactive_count' => $inactivePurchases->count(),
            ];

            // Generate PDF using DomPDF
            $pdf = Pdf::loadView('reports.purchase_bulk', $data);
            
            // Set paper size and orientation
            $pdf->setPaper('A4', 'landscape');

            // Generate filename with date range
            $dateRange = '';
            if ($request->filled('date_from') && $request->filled('date_to')) {
                $dateRange = $request->date_from . '_to_' . $request->date_to;
            } elseif ($request->filled('date_from')) {
                $dateRange = 'from_' . $request->date_from;
            } elseif ($request->filled('date_to')) {
                $dateRange = 'to_' . $request->date_to;
            }

            $filename = 'Purchase_Report_' . ($dateRange ?: now()->format('Y-m-d')) . '.pdf';

            // Return PDF download
            return $pdf->download($filename);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * Get products with stock information for a specific branch.
     * Used when branch selection changes in purchase create form.
     */
    public function getProductsByBranch(Request $request)
    {
        $request->validate([
            'company_id' => 'required|integer',
            'branch_id' => 'required|integer',
        ]);

        $user = Auth::user();
        
        // Get company and section information
        $company = \App\Models\Company::find($request->company_id);
        $section = \App\Models\Section::find($request->branch_id);
        
        if (!$company || !$section) {
            return response()->json(['error' => 'Invalid company or section'], 404);
        }

        // Get all products from itemmaster with prices from item_price_det and category info
        $query = Product::where('fInAct', false)
            ->whereHas('itemPriceDet', function($q) use ($company) {
                $q->where('fInAct', false)
                  ->where('company_code', $company->company_code);
            })
            ->with(['itemPriceDet' => function($q) use ($company) {
                $q->where('fInAct', false)
                  ->where('company_code', $company->company_code);
            }, 'category'])
            ->where('company_code', $company->company_code)
            ->select('ItmKy', 'ItemCode', 'ItmNm', 'BarCode', 'catkey', 'CosPri', 'NCostPrice', 'SlsPri', 'WholePrice', 'ExtraPrice', 'CCPrice')
            ->orderBy('ItmNm');

        $products = $query->get()
            ->map(function($product) use ($company, $section) {
                // Get current stock for this product in the specific section
                $currentStock = \App\Models\StockInHand::where('ItemKy', $product->ItmKy)
                    ->where('company_code', $company->company_code)
                    ->where('section_code', $section->section_code)
                    ->selectRaw('SUM(Qty) as total_qty, SUM(FreeQty) as total_free_qty')
                    ->first();

                return [
                    'id' => $product->ItmKy,
                    'code' => $product->ItemCode,
                    'name' => $product->ItmNm,
                    'barcode' => $product->BarCode,
                    'category_id' => $product->catkey,
                    'category_name' => $product->category ? $product->category->cname : null,
                    'cost_price' => (float) ($product->itemPriceDet->first()?->CosPri ?? $product->CosPri ?? 0),
                    'normal_cost' => (float) ($product->itemPriceDet->first()?->NCostPrice ?? $product->NCostPrice ?? 0),
                    'retail_price' => (float) ($product->itemPriceDet->first()?->SlsPri ?? $product->SlsPri ?? 0),
                    'wholesale_price' => (float) ($product->itemPriceDet->first()?->WholePrice ?? $product->WholePrice ?? 0),
                    'extra_price' => (float) ($product->itemPriceDet->first()?->ExtraPrice ?? $product->ExtraPrice ?? 0),
                    'cc_price' => (float) ($product->itemPriceDet->first()?->CCPrice ?? $product->CCPrice ?? 0),
                    'current_stock' => (float) (($currentStock?->total_qty ?? 0) + ($currentStock?->total_free_qty ?? 0)),
                    'free_stock' => (float) ($currentStock?->total_free_qty ?? 0),
                    'brand' => $product->brand ?? null,
                    'model' => $product->model ?? null,
                    'serial_number' => $product->serial_number ?? null,
                ];
            });

        return response()->json([
            'products' => $products,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->company_code,
            ],
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'code' => $section->section_code,
            ],
        ]);
    }

    /**
     * Search product by barcode.
     * Returns existing product details if barcode is found, null otherwise.
     */
    public function searchByBarcode(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
            'company_id' => 'required|integer',
        ]);

        $user = Auth::user();
        $company = \App\Models\Company::find($request->company_id);
        
        if (!$company) {
            return response()->json(['error' => 'Invalid company'], 404);
        }

        // Search for product by barcode in the company
        $product = Product::where('BarCode', $request->barcode)
            ->where('company_code', $company->company_code)
            ->where('fInAct', false)
            ->with(['itemPriceDet' => function($q) use ($company) {
                $q->where('company_code', $company->company_code)
                  ->where('fInAct', false)
                  ->latest('ChangedDate')
                  ->limit(1);
            }, 'category'])
            ->first();

        if (!$product) {
            // Check in purchase_det if not found in itemmaster (for Printing Section items)
            $purchaseDetail = \App\Models\PurchaseDet::where('barcode', $request->barcode)
                ->where('company_code', $company->company_code)
                ->where('Status', '!=', 'I') // Exclude inactive/cancelled items
                ->latest('PerchaseDetKy')
                ->first();

            if ($purchaseDetail) {
                 return response()->json([
                    'found' => true,
                    'product' => [
                        'id' => $purchaseDetail->iTimKy ?? 0,
                        'code' => '', // No item code for non-master items
                        'name' => $purchaseDetail->item_name,
                        'barcode' => $purchaseDetail->barcode,
                        'category_id' => null, // Cannot determine category easily without master
                        'category_name' => null,
                        'brand' => $purchaseDetail->brand ?? '',
                        'model' => $purchaseDetail->model ?? '',
                        'serial_number' => $purchaseDetail->serial_number ?? '',
                        'cost_price' => (float) $purchaseDetail->CostPrice,
                        'normal_cost' => (float) $purchaseDetail->NormalCost,
                        'retail_price' => (float) $purchaseDetail->SalePrice,
                        'wholesale_price' => (float) $purchaseDetail->WholePrice,
                        'extra_price' => (float) $purchaseDetail->ExtraPrice,
                        'cc_price' => (float) $purchaseDetail->CCPrice,
                        'warranty' => $purchaseDetail->warranty ?? '',
                    ],
                    'message' => 'Product found in history! loaded from previous purchase.',
                ]);
            }

            return response()->json([
                'found' => false,
                'message' => 'Product not found. You can create a new product with this barcode.',
            ]);
        }

        // Get the latest price details
        $priceDetails = $product->itemPriceDet->first();
        
        // Get the latest purchase details for brand, model, warranty from purchase_det
        $purchaseDetail = \App\Models\PurchaseDet::where('barcode', $request->barcode)
            ->where('company_code', $company->company_code)
            ->whereNotNull('brand')
            ->latest('PerchaseDetKy')
            ->first();
        
        // If no purchase detail found by barcode, try by item key
        if (!$purchaseDetail && $product->ItmKy) {
            $purchaseDetail = \App\Models\PurchaseDet::where('iTimKy', $product->ItmKy)
                ->where('company_code', $company->company_code)
                ->whereNotNull('brand')
                ->latest('PerchaseDetKy')
                ->first();
        }
        
        // Get category ID from the loaded category relationship
        $categoryId = $product->category ? $product->category->concode : null;
        
        // Log for debugging
        Log::info('Barcode Search Category Debug', [
            'product_catkey' => $product->catkey,
            'category_object' => $product->category ? [
                'id' => $product->category->id,
                'catkey' => $product->category->catkey,
                'concode' => $product->category->concode,
                'cname' => $product->category->cname,
            ] : null,
            'final_category_id' => $categoryId
        ]);

        return response()->json([
            'found' => true,
            'product' => [
                'id' => $product->ItmKy,
                'code' => $product->ItemCode,
                'name' => $product->ItmNm,
                'barcode' => $product->BarCode,
                'category_id' => $categoryId,
                'category_name' => $product->category ? $product->category->cname : null,
                'brand' => $purchaseDetail?->brand ?? $product->brand ?? '',
                'model' => $purchaseDetail?->model ?? $product->model ?? '',
                'serial_number' => $purchaseDetail?->serial_number ?? $product->serial_number ?? '',
                'cost_price' => (float) ($priceDetails?->CosPri ?? $product->CosPri ?? 0),
                'normal_cost' => (float) ($priceDetails?->NCostPrice ?? $product->NCostPrice ?? 0),
                'retail_price' => (float) ($priceDetails?->SlsPri ?? $product->SlsPri ?? 0),
                'wholesale_price' => (float) ($priceDetails?->WholePrice ?? $product->WholePrice ?? 0),
                'extra_price' => (float) ($priceDetails?->ExtraPrice ?? $product->ExtraPrice ?? 0),
                'cc_price' => (float) ($priceDetails?->CCPrice ?? $product->CCPrice ?? 0),
                'warranty' => $purchaseDetail?->warranty ?? $priceDetails?->warranty ?? $product->warranty ?? '',
            ],
            'message' => 'Product found! Data loaded from existing record.',
        ]);
    }

    /**
     * Get GRN preview number for selected company and branch.
     * Used for dynamic GRN number generation based on role and selection.
     */
    public function getGrnPreview(Request $request)
    {
        $request->validate([
            'company_id' => 'required|integer',
            'branch_id' => 'required|integer',
        ]);

        $user = Auth::user();
        
        // Get company and section information
        $company = \App\Models\Company::find($request->company_id);
        $section = \App\Models\Section::find($request->branch_id);
        
        if (!$company || !$section) {
            return response()->json(['error' => 'Invalid company or section'], 404);
        }

        // Check authorization based on user role
        if (!$this->userIsSuperAdmin($user)) {
            // Company Admin can only access their company
            if ($user->role_id === 2 && $company->company_code !== $user->company_code) {
                return response()->json(['error' => 'Unauthorized company access'], 403);
            }
            // Branch Admin can only access their company and section
            if ($user->role_id === 3 && 
                ($company->company_code !== $user->company_code || $section->section_code !== $user->section_code)) {
                return response()->json(['error' => 'Unauthorized section access'], 403);
            }
        }

        // Ensure section belongs to the selected company
        if ($section->company_code !== $company->company_code) {
            return response()->json(['error' => 'Section does not belong to the selected company'], 400);
        }

        // Generate next purchase number for this company/section combination
        $maxPurchaseNo = Purchase::where('company_code', $company->company_code)
            ->where('section_code', $section->section_code)
            ->max('PurchaseNo') ?? 0;
        $nextPurchaseNo = $maxPurchaseNo + 1;

        // Generate GRN preview format: C01BR01-000006
        // Extract numbers from company and section codes and format
        $companyNumber = preg_replace('/[^0-9]/', '', $company->company_code); // Extract "1" from "C1"
        $sectionNumber = preg_replace('/.*-BR0*([0-9]+)/', '$1', $section->section_code); // Extract "001" from "C1-BR001"
        
        $formattedCompany = 'C' . str_pad($companyNumber, 2, '0', STR_PAD_LEFT); // "C01"
        $formattedSection = 'BR' . str_pad($sectionNumber, 2, '0', STR_PAD_LEFT); // "BR01"
        
        $grnNumber = $formattedCompany . $formattedSection . '-' . sprintf('%06d', $nextPurchaseNo);

        return response()->json([
            'grn_number' => $grnNumber,
            'next_purchase_no' => $nextPurchaseNo,
            'company_code' => $company->company_code,
            'section_code' => $section->section_code,
        ]);
    }

    /**
     * Generate PDF for a single GRN (Purchase).
     */
    public function downloadPdf(Purchase $purchase)
    {
        try {
            // Load relationships
            $purchase->load(['supplier', 'details.product', 'company', 'section']);

            // Prepare data for PDF
            $data = [
                'reportTitle' => 'GRN Report',
                'purchase' => $purchase,
                'generated_at' => now()->format('d M Y, h:i A'),
                'generated_by' => Auth::user()->username,
            ];

            // Generate PDF using DomPDF
            $pdf = Pdf::loadView('reports.grn', $data);
            
            // Set paper size and orientation
            $pdf->setPaper('A4', 'portrait');

            // Generate filename with new GRN format
            $filename = $purchase->company_code . '-' . $purchase->section_code . '-' . sprintf('%06d', $purchase->PurchaseNo) . '-' . now()->format('Y-m-d') . '.pdf';

            // Return PDF download
            return $pdf->download($filename);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * Display printing section products from GRN purchase details.
     */
    public function printingSectionProducts(Request $request): Response
    {
        $user = Auth::user();

        $query = \App\Models\PurchaseDet::with(['purchase', 'purchase.supplier', 'purchase.company', 'purchase.section', 'product'])
            ->whereHas('purchase', function($q) use ($user) {
                $q->where('company_code', $user->company_code)
                  ->where('type', 'supplier'); // Only supplier purchases, not transfers
            })
            ->where('company_code', $user->company_code)
            // Filter for Printers: must have brand, model, and serial number
            ->whereNotNull('brand')->where('brand', '!=', '')
            ->whereNotNull('model')->where('model', '!=', '')
            ->whereNotNull('serial_number')->where('serial_number', '!=', '');

        // Apply role-based section filtering for security
        if (!$this->userIsSuperAdmin($user)) {
            if ($user->role_id === 3 || $user->role_id === 4) { // Branch Admin or Staff User
                $query->where('section_code', $user->section_code);
            }
            // Company Admin (role_id === 2) can see all sections in their company
        }

        // Filter by stock location type if specified
        if ($request->filled('stock_location')) {
            $query->where('stock_location_type', $request->stock_location);
        }

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('item_name', 'LIKE', "%{$search}%")
                  ->orWhere('brand', 'LIKE', "%{$search}%")
                  ->orWhere('model', 'LIKE', "%{$search}%")
                  ->orWhere('serial_number', 'LIKE', "%{$search}%")
                  ->orWhere('barcode', 'LIKE', "%{$search}%");
            });
        }

        // Filter by GRN date range
        if ($request->filled('date_from')) {
            $query->whereHas('purchase', function($q) use ($request) {
                $q->whereDate('GRNDate', '>=', $request->date_from);
            });
        }

        if ($request->filled('date_to')) {
            $query->whereHas('purchase', function($q) use ($request) {
                $q->whereDate('GRNDate', '<=', $request->date_to);
            });
        }

        $products = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Transform products for frontend
        $products->getCollection()->transform(function($product) {
            // Get product name from item_name or fallback to related product
            $productName = $product->item_name;
            if (!$productName && $product->product) {
                $productName = $product->product->ItmNm;
            }
            if (!$productName) {
                $productName = 'Unknown Product';
            }

            // Safely handle potentially null relationships
            $grnNo = 'N/A';
            $grnDate = 'N/A';
            $supplierName = 'N/A';
            
            if ($product->purchase) {
                $grnNo = $product->purchase->company_code . '-' . $product->purchase->section_code . '-' . sprintf('%06d', $product->purchase->PurchaseNo);
                $grnDate = $product->purchase->GRNDate ? $product->purchase->GRNDate->format('Y-m-d') : 'N/A';
                
                if ($product->purchase->supplier) {
                    $supplierName = $product->purchase->supplier->FstNm ?? 'N/A';
                }
            }

            return [
                'id' => $product->PerchaseDetKy,
                'product_name' => $productName,
                'brand' => $product->brand ?? '',
                'model' => $product->model ?? '',
                'serial_number' => $product->serial_number ?? '',
                'barcode' => $product->barcode ?? '',
                'qty' => (float) ($product->Qty ?? 0),
                'cost_price' => (float) ($product->CostPrice ?? 0),
                'retail_price' => (float) ($product->SalePrice ?? 0),
                'wholesale_price' => (float) ($product->WholePrice ?? 0),
                'extra_price' => (float) ($product->ExtraPrice ?? 0),
                'cc_price' => (float) ($product->CCPrice ?? 0),
                'grn_no' => $grnNo,
                'grn_date' => $grnDate,
                'supplier_name' => $supplierName,
                'batch_no' => $product->batch_no ?? '',
                'stock_location_type' => $product->stock_location_type ?? 'main_stock',
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : 'N/A',
            ];
        });

        return Inertia::render('pos/printing-section-products/index', [
            'products' => $products,
            'filters' => $request->only(['search', 'date_from', 'date_to', 'stock_location']),
        ]);
    }
}