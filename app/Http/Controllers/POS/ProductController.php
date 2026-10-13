<?php
namespace App\Http\Controllers\POS;

use App\Models\Product;
use App\Models\ItemPriceDet;
use App\Models\Address;
use App\Models\Company;
use App\Models\Section;
use App\Http\Controllers\PromotionalDiscountController;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Tighten\Ziggy\Ziggy;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Services\NumberGeneratorService;

class ProductController extends Controller
{
    /**
     * Get the authenticated user from available guards
     */
    private function getAuthenticatedUser()
    {
        if (Auth::guard('web')->check()) {
            return Auth::guard('web')->user();
        }
        if (Auth::guard('company')->check()) {
            return Auth::guard('company')->user();
        }
        return Auth::user();
    }

    /**
     * Check if user can manage products
     */
    private function canManageProducts(): bool
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) return false;

        return $user->hasPermission('products.create') || $user->hasPermission('products.edit');
    }
    
    /**
     * Check if user can access a specific product
     * Products are company-wide: all users in a company can access all company products
     */
    private function canAccessProduct(Product $product): bool
    {
        $user = $this->getAuthenticatedUser();

        if (!$user) {
            return false;
        }

        // Super admin can access all products
        if ($this->userIsSuperAdmin($user)) {
            return true;
        }

        // All users in a company can access company products
        return $product->company_code === $user->company_code;
    }

    /**
     * Check if user can delete/activate/deactivate products
     */
    private function canDeleteProduct(): bool
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) return false;
        
        return $user->hasPermission('products.delete');
    }

    /**
     * Helper: detect super admin
     */
    private function userIsSuperAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        if (isset($user->user_type) && $user->user_type === 'super_admin') {
            return true;
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

        if ($user->role) {
            $roleSlug = $user->role->slug ?? '';
            if (in_array($roleSlug, ['super_admin', 'superadmin', 'admin', 'administrator'])) {
                return true;
            }
        }

        if (isset($user->is_super_admin)) {
            return (bool) $user->is_super_admin;
        }

        return false;
    }

    /**
     * Helper: detect admin (either super admin or company admin)
     */
    private function userIsAdmin($user): bool
    {
        return $this->userIsSuperAdmin($user) || $this->userIsCompanyAdmin($user);
    }

    /**
     * Helper: detect company admin
     */
    private function userIsCompanyAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        if ($user instanceof Company) {
            return true;
        }

        if (isset($user->user_type) && $user->user_type === 'company_admin') {
            return true;
        }

        if (method_exists($user, 'isCompanyAdmin')) {
            return (bool) $user->isCompanyAdmin();
        }

        if (method_exists($user, 'hasRole')) {
            try {
                return (bool) $user->hasRole('company_admin');
            } catch (\Throwable $e) {
                // ignore and continue fallback checks
            }
        }

        if ($user->role) {
            $roleSlug = $user->role->slug ?? '';
            if (in_array($roleSlug, ['company_admin', 'companyadmin', 'manager'])) {
                return true;
            }
        }

        if (isset($user->is_company_admin)) {
            return (bool) $user->is_company_admin;
        }

        return false;
    }

    /**
     * Helper: detect branch admin
     */
    private function userIsBranchAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        if (isset($user->user_type) && ($user->user_type === 'branch_admin' || $user->user_type === 'section_admin')) {
            return true;
        }

        if (method_exists($user, 'isBranchAdmin')) {
            return (bool) $user->isBranchAdmin();
        }

        if (method_exists($user, 'hasRole')) {
            try {
                return (bool) $user->hasRole('branch_admin');
            } catch (\Throwable $e) {
                // ignore and continue fallback checks
            }
        }

        if ($user->role) {
            $roleSlug = $user->role->slug ?? '';
            if (in_array($roleSlug, ['branch_admin', 'branchadmin', 'supervisor'])) {
                return true;
            }
        }

        if (isset($user->is_branch_admin)) {
            return (bool) $user->is_branch_admin;
        }

        return false;
    }
        
    public function index(Request $request)
    {
        $query = Product::query();

        // Apply multi-tenancy filters based on user type and request parameters
        // Products are company-wide: all users in a company can see all company products
        $user = $this->getAuthenticatedUser();

        if (!$user) {
            abort(401, 'User not authenticated.');
        }

        if (!$user->hasPermission('products.view')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view products.');
        }
        
        // Get company and section filters from request or user context
        $companyCode = $request->query('company_code', $user->company_code ?? $user->company_code);
        $sectionCode = $request->query('section_code', $user->section_code ?? $user->section_code);
        
        // Join with reorder_levels to get section-specific reorder level (must be done before WHERE)
        if (!$this->userIsSuperAdmin($user) && $sectionCode) {
            $query->leftJoin('reorder_levels', function($join) use ($companyCode, $sectionCode) {
                $join->on('itemmaster.ItemCode', '=', 'reorder_levels.item_code')
                     ->where('reorder_levels.company_code', '=', $companyCode)
                     ->where('reorder_levels.section_code', '=', $sectionCode);
            })
            ->select('itemmaster.*', 'reorder_levels.reorder_level as section_reorder_level');
        } else {
            $query->select('itemmaster.*')
                  ->selectRaw('NULL as section_reorder_level');
        }
        
        if (!$this->userIsSuperAdmin($user)) {
            // All non-super-admin users see only their company's products
            $query->where('itemmaster.company_code', $companyCode);
        }
        // Super admin can see all products (no filter)
        
        // Handle search parameter
        if ($request->filled('search')) {
            $searchTerm = $request->get('search');
            $query->where(function($q) use ($searchTerm) {
                $q->where('itemmaster.ItmNm', 'like', '%' . $searchTerm . '%')
                  ->orWhere('itemmaster.ItemCode', 'like', '%' . $searchTerm . '%')
                  ->orWhere('itemmaster.BarCode', 'like', '%' . $searchTerm . '%');
            });
        }
        
        // Handle barcode parameter
        if ($request->filled('barcode')) {
            $barcodeTerm = $request->get('barcode');
            $query->where('itemmaster.BarCode', 'like', '%' . $barcodeTerm . '%');
        }
        
        // Handle status filter
        if ($request->filled('status')) {
            $status = $request->get('status');
            if ($status === 'active') {
                $query->where('itemmaster.fInAct', false); // false = active
            } elseif ($status === 'inactive') {
                $query->where('itemmaster.fInAct', true); // true = inactive
            }
        }
        
        $perPage = $request->input('per_page', 10);
        $items = $query->with(['brand:id,name'])->paginate($perPage)->withQueryString();
        
        // Get total count separately to ensure accuracy
        $totalQuery = Product::query();
        if (!$this->userIsSuperAdmin($user)) {
            $totalQuery->where('itemmaster.company_code', $companyCode);
        }
        $totalCount = $totalQuery->count();
        
        // Get categories for filter dropdown
        $categories = DB::table('code_masters')
            ->where('conkey', 'CAT')
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('company_code', $user->company_code)
            ->select('catkey as id', 'cname as name')
            ->orderBy('cname')
            ->get();
        
        return Inertia::render('pos/products/index', [ 
            'items' => $items,
            'totalProducts' => $totalCount,
            'categories' => $categories,
            'filters' => $request->only(['search', 'status', 'barcode', 'company_code', 'section_code', 'per_page']),
            'canDelete' => $this->canDeleteProduct(),
            'canManage' => $this->canManageProducts(),
            'ziggy' => array_merge((new Ziggy)->toArray(), ['location' => url()->current()]),
        ]);
    }

    public function show($id)
    {
        $item = Product::findOrFail($id);
        
        // Check if user can access this product
        $user = $this->getAuthenticatedUser();
        if (!$user) abort(401, 'User not authenticated.');

        if (!$user->hasPermission('products.view')) {
            return redirect()->back()->with('error', 'You are not allowed to view products.');
        }

        if (!$this->canAccessProduct($item)) {
            return redirect()->back()->with('error', 'You are not allowed to load this product.');
        }
        
        $user = $this->getAuthenticatedUser();

        if (!$user) {
            abort(401, 'User not authenticated.');
        }
        
        // Get suppliers for the company - show all suppliers for product viewing
        $suppliersQuery = Address::where('company_code', $user->company_code)
            ->whereIn('AdrTypKy', [4, 5]);
        
        // For show method, always show all company suppliers (no section filtering)
        // This ensures the product's assigned supplier is always visible
        
        $suppliers = $suppliersQuery->select('AdrKy', 'FstNm', 'LstNm', 'AdrCd', 'section_code')
            ->orderBy('FstNm')
            ->get()
            ->map(function ($supplier) {
                return [
                    'AdrKy' => $supplier->AdrKy,
                    'AccKy' => $supplier->AdrKy,
                    'full_name' => trim($supplier->FstNm . ' ' . $supplier->LstNm),
                    'FstNm' => $supplier->FstNm,
                    'id' => $supplier->AdrKy,
                    'name' => trim($supplier->FstNm . ' ' . $supplier->LstNm),
                    'section_code' => $supplier->section_code,
                ];
            });
        
        return Inertia::render('pos/products/show', [
            'item' => $item,
            'suppliers' => $suppliers,
            'canDelete' => $this->canDeleteProduct(),
            'canManage' => $this->canManageProducts(),
        ]);
    }

    public function create()
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) abort(401, 'User not authenticated.');

        // Check if user can create products
        if (!$user->hasPermission('products.create')) {
            return redirect()->back()->with('error', 'You are not allowed to create new products.');
        }

        /** @var \App\Models\User $user */
        $user = $this->getAuthenticatedUser();

        if (!$user) {
            abort(401, 'User not authenticated.');
        }

        // Get categories
        $categories = DB::table('code_masters')
            ->where('conkey', 'CAT')
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('company_code', $user->company_code)
            ->select('catkey as id', 'cname as name')
            ->orderBy('cname')
            ->get();

        // Get suppliers
        $suppliersQuery = DB::table('acc_mas')
            ->where('AccTyp', 'SUPPLIER')
            ->where('Status', 'A')
            ->where('company_code', $user->company_code);

        // Section admins can only see suppliers from their own section
        if ($this->userIsBranchAdmin($user)) {
            $suppliersQuery->where('section_code', $user->section_code);
        }

        $suppliers = $suppliersQuery->select('AccKy as id', 'AccNm as name')
            ->orderBy('AccNm')
            ->get();

        // Get units
        $units = DB::table('code_masters')
            ->where('conkey', 'UNT')
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('company_code', $user->company_code)
            ->select('id', 'cname as name')
            ->orderBy('cname')
            ->get();

        Log::info('Units being passed to create view:', [
            'count' => $units->count(),
            'units' => $units->toArray()
        ]);

        return Inertia::render('pos/products/create', [
            'categories' => $categories,
            'suppliers' => $suppliers,
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) abort(401, 'User not authenticated.');

        // Check if user can create products
        if (!$user->hasPermission('products.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create products.');
        }
        $validator = Validator::make($request->all(), [
            'fInAct' => 'nullable|boolean',
            'Status' => 'nullable|string|max:50',
            // company_code and section_code will be set automatically from authenticated user
            'company_code' => 'nullable|string|max:50',
            'section_code' => 'nullable|string|max:50',
            'ItmKy' => 'nullable|integer',
            'ItemCode' => 'required|string|max:50|unique:itemmaster,ItemCode',
            'BarCode' => 'nullable|string|max:100|unique:itemmaster,BarCode',
            'batch_no' => 'nullable|string|max:100',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'warranty' => 'nullable|string|max:100',
            'ItmNm' => 'required|string|max:100',
            'catkey' => 'nullable|string',
            'UnitKy' => 'nullable|integer|exists:code_masters,id',
            'CosPri' => 'nullable|numeric',
            'NCostPrice' => 'nullable|numeric',
            'ExtraPrice' => 'nullable|numeric',
            'WholePrice' => 'nullable|numeric',
            'ReOrdlLvl' => 'nullable|integer',
            'ScallItem' => 'nullable|boolean',
            'SupKey' => 'nullable|integer',
            'RtQty1' => 'nullable|integer',
            'RtDis1' => 'nullable|numeric',
            'RtQty2' => 'nullable|integer',
            'RtDis2' => 'nullable|numeric',
            'RtQty3' => 'nullable|integer',
            'RtDis3' => 'nullable|numeric',
            'RtQty4' => 'nullable|integer',
            'RtDis4' => 'nullable|numeric',
            'CCPrice' => 'nullable|numeric',
            'SlsPri' => 'nullable|numeric',
            'VATItem' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        // Get authenticated user
        $user = $this->getAuthenticatedUser();

        if (!$user) {
            abort(401, 'User not authenticated.');
        }

        $targetCompanyCode = $user->company_code;

        // Optional: Check package limits if packageDetails relationship exists
        // Commented out for now as the relationship doesn't exist yet
        // if ($targetCompanyCode) {
        //     $company = \App\Models\Company::where('company_code', $targetCompanyCode)->first();
        //     if ($company && method_exists($company, 'packageDetails') && $company->packageDetails) {
        //         $currentProducts = Product::where('company_code', $targetCompanyCode)->count();
        //         $maxProducts = $company->packageDetails->max_products;
        //         
        //         if ($currentProducts >= $maxProducts) {
        //              return redirect()->back()
        //                 ->withErrors(['error' => "You have reached the maximum number of products allowed for your package ({$maxProducts}). Please upgrade your package to add more products."])
        //                 ->withInput();
        //         }
        //     }
        // }

        try {
            DB::beginTransaction();

            $data = $validator->validated();

            // Products are company-wide: all sections can see company products
            // But we track which section created it for audit purposes
            $data['company_code'] = $user->company_code;
            $data['section_code'] = $data['section_code'] ?? $user->section_code;

            // If section_code is still null (e.g. company admin), find a default section
            if (empty($data['section_code'])) {
                $defaultSection = Section::where('company_code', $user->company_code)
                    ->orderBy('is_main_stock', 'desc') // Prefer main stock
                    ->orderBy('id', 'asc') // Then oldest
                    ->first();
                
                if ($defaultSection) {
                    $data['section_code'] = $defaultSection->section_code;
                } else {
                    // Fallback if absolutely no section exists (should not happen in prod)
                    throw new \Exception('No sections found for this company. Please create a section first.');
                }
            }

            // Generate barcode if not provided
            if (empty($data['BarCode'])) {
                $numberGenerator = app(NumberGeneratorService::class);
                $data['BarCode'] = $numberGenerator->generate('product_barcode', $data['company_code'], $data['section_code']);
            }

            // Mark as Insert (I)
            $data['Status'] = 'I';

            $product = Product::create($data);

            // Always save price details to item_price_det table when creating a product with Status 'I'
            $this->savePriceDetails($product, $data, 'I');

            DB::commit();

            // Generate barcode print batch for the new product
            $batch = $this->generateBarcodePrintBatch($product);

            // Redirect back to create page with success message
            return redirect()->back()->with('success', 'Item created successfully! Ready for next entry.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product creation error: ' . $e->getMessage());
            return redirect()->back()
                ->withErrors(['error' => 'Error occurred while creating item: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function savePriceDetails($product, $data, $status = null)
    {
        try {
            // Filter out product-specific fields that don't belong in item_price_det table
            $priceData = collect($data)->except([
                'brand', 'model', 'serial_number', 'warranty', 'batch_no',
                'ItmNm', 'catkey', 'category_name', 'UnitKy', 'Unit', 
                'SupKey', 'supplier_name', 'ReOrdlLvl', 'keep_price', 
                'selectedPriceHistoryId'
            ])->toArray();
            $user = $this->getAuthenticatedUser();
            
            // Allow section_code to be passed in data, otherwise fallback to item's section, user's section, or find default
            $sectionCode = $data['section_code'] ?? $product->section_code ?? $user->section_code;
            
            if (empty($sectionCode)) {
                $defaultSection = Section::where('company_code', $user->company_code)
                    ->orderBy('is_main_stock', 'desc')
                    ->first();
                $sectionCode = $defaultSection ? $defaultSection->section_code : null;
            }

            ItemPriceDet::create([
                'fInAct' => $priceData['fInAct'] ?? false,
                'Status' => $status ?? $priceData['Status'] ?? null,
                'CKey' => $priceData['CKey'] ?? 0,
                'ItmKy' => $product->ItmKy,
                'ItemCode' => $product->ItemCode,
                'company_code' => $user->company_code,
                'section_code' => $sectionCode,
                'CosPri' => $priceData['CosPri'] ?? null,
                'NCostPrice' => $priceData['NCostPrice'] ?? 0,
                'SlsPri' => $priceData['SlsPri'] ?? null,
                'WholePrice' => $priceData['WholePrice'] ?? null,
                'RtQty1' => $priceData['RtQty1'] ?? null,
                'RtDis1' => $priceData['RtDis1'] ?? null,
                'RtQty2' => $priceData['RtQty2'] ?? null,
                'RtDis2' => $priceData['RtDis2'] ?? null,
                'RtQty3' => $priceData['RtQty3'] ?? null,
                'RtDis3' => $priceData['RtDis3'] ?? null,
                'RtQty4' => $priceData['RtQty4'] ?? null,
                'RtDis4' => $priceData['RtDis4'] ?? null,
                'CCPrice' => $priceData['CCPrice'] ?? 0,
                'ExtraPrice' => $priceData['ExtraPrice'] ?? 0,
                'ChangedDate' => now(),
            ]);

            Log::info('Price details saved successfully for ItmKy: ' . $product->ItmKy . ' with Status: ' . ($status ?? $data['Status'] ?? 'null'));
        } catch (\Exception $e) {
            Log::error('Failed to save price details: ' . $e->getMessage());
            throw $e;
        }
    }

    public function edit($id)
    {
        $item = Product::findOrFail($id);

        $user = $this->getAuthenticatedUser();
        if (!$user) abort(401, 'User not authenticated.');

        // Check if user can access and edit this product
        if (!$this->canAccessProduct($item)) {
             return redirect()->back()->with('error', 'You are not allowed to access this product.');
        }

        if (!$user->hasPermission('products.edit')) {
            return redirect()->back()->with('error', 'You are not allowed to edit products.');
        }

        $user = $this->getAuthenticatedUser();

        if (!$user) {
            abort(401, 'User not authenticated.');
        }

        // Get categories
        $categories = DB::table('code_masters')
            ->where('conkey', 'CAT')
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('company_code', $user->company_code)
            ->select('catkey as id', 'cname as name')
            ->orderBy('cname')
            ->get();

        // Get suppliers
        $suppliersQuery = DB::table('acc_mas')
            ->where('AccTyp', 'SUPPLIER')
            ->where('Status', 'A')
            ->where('company_code', $user->company_code);

        // Section admins can only see suppliers from their own section
        if ($this->userIsBranchAdmin($user)) {
            // But always include the current product's supplier if it exists
            if ($item->SupKey) {
                $suppliersQuery->where(function($query) use ($user, $item) {
                    $query->where('section_code', $user->section_code)
                          ->orWhere('AccKy', $item->SupKey);
                });
            } else {
                $suppliersQuery->where('section_code', $user->section_code);
            }
        }

        $suppliers = $suppliersQuery->select('AccKy as id', 'AccNm as name')
            ->orderBy('AccNm')
            ->get();

        // Get units
        $units = DB::table('code_masters')
            ->where('conkey', 'UNT')
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('company_code', $user->company_code)
            ->select('id', 'cname as name')
            ->orderBy('cname')
            ->get();

        // Get price history for this item
        $priceHistory = DB::table('item_price_det')
            ->where('ItmKy', $item->ItmKy)
            ->orderBy('ChangedDate', 'desc')
            ->get();

        // Get branches for branch selection
        $branches = DB::table('sections')
            ->where('company_code', $user->company_code)
            ->where('is_active', true)
            ->select('id', 'section_code as branch_code', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('pos/products/create', [
            'product' => $item,
            'priceHistory' => $priceHistory,
            'branches' => $branches,
            'suppliers' => $suppliers,
            'categories' => $categories,
            'units' => $units,
            'userBranchCode' => $user->section_code ?? '',
            'canViewAllBranches' => $this->userIsSuperAdmin($user) || $this->userIsAdmin($user),
            'canManageReorderLevels' => $this->canManageProducts(),
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'search_term' => 'required|string'
        ]);

        $query = Product::query();
        
        // Products are company-wide: all users in a company can search all company products
        $user = Auth::user();
        if (!$this->userIsSuperAdmin($user)) {
            $companyCode = $request->query('company_code', $user->company_code ?? $user->company_code);
            $query->where('company_code', $companyCode);
        }

        $item = $query->where('fInAct', false) // Only active products
                      ->where(function($q) use ($request) {
                          $q->where('ItemCode', $request->search_term)
                            ->orWhere('ItmNm', 'like', '%' . $request->search_term . '%')
                            ->orWhere('BarCode', $request->search_term);
                      })->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found',
                'item' => null
            ], 200);
        }

        return response()->json([
            'success' => true,
            'item' => $item
        ]);
    }

    public function update(Request $request, $id)
    {
        $item = Product::findOrFail($id);
        
        $user = $this->getAuthenticatedUser();
        if (!$user) abort(401, 'User not authenticated.');
        
        // Check if user can access and update this product
        if (!$this->canAccessProduct($item)) {
             return redirect()->back()->with('error', 'You are not allowed to access this product.');
        }

        if (!$user->hasPermission('products.edit')) {
            return redirect()->back()->with('error', 'You are not allowed to edit products.');
        }

        $validator = Validator::make($request->all(), [
            'fInAct' => 'nullable|boolean',
            'Status' => 'nullable|string|max:50',
            'CKey' => 'nullable|integer',
            'company_code' => 'nullable|string|max:50',
            'section_code' => 'nullable|string|max:50',
            // company_code and section_code will be set automatically from authenticated user
            'ItemCode' => 'required|string|max:50|unique:itemmaster,ItemCode,' . $item->ItmKy . ',ItmKy',
            'BarCode' => 'nullable|string|max:100|unique:itemmaster,BarCode,' . $item->ItmKy . ',ItmKy',
            'batch_no' => 'nullable|string|max:100',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'ItmNm' => 'required|string|max:100',
            'catkey' => 'nullable|string|exists:code_masters,catkey',
            'ItmRefKy' => 'nullable|integer',
            'UnitKy' => 'nullable|integer|exists:code_masters,id',
            'CosPri' => 'nullable|numeric',
            'NCostPrice' => 'nullable|numeric',
            'ExtraPrice' => 'nullable|numeric',
            'WholePrice' => 'nullable|numeric',
            'ReOrdlLvl' => 'nullable|integer',
            'ScallItem' => 'nullable|boolean',
            'SupKey' => 'nullable|integer',
            'RtQty1' => 'nullable|integer',
            'RtDis1' => 'nullable|numeric',
            'RtQty2' => 'nullable|integer',
            'RtDis2' => 'nullable|numeric',
            'RtQty3' => 'nullable|integer',
            'RtDis3' => 'nullable|numeric',
            'RtQty4' => 'nullable|integer',
            'RtDis4' => 'nullable|numeric',
            'CCPrice' => 'nullable|numeric',
            'SlsPri' => 'nullable|numeric',
            'VATItem' => 'nullable|boolean',
            'keep_price' => 'nullable|boolean',
            'selectedPriceHistoryId' => 'nullable|integer|exists:item_price_det,ItemPriceKey',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            DB::beginTransaction();

            $data = $validator->validated();
            $keepPrice = $data['keep_price'] ?? false;
            $selectedPriceHistoryId = $data['selectedPriceHistoryId'] ?? null;
            unset($data['keep_price'], $data['selectedPriceHistoryId']);
            
            $user = $this->getAuthenticatedUser();

            if (!$user) {
                abort(401, 'User not authenticated.');
            }

            // Automatically set company_code and section_code from authenticated user
            $data['company_code'] = $user->company_code;
            $data['section_code'] = $data['section_code'] ?? $user->section_code;

            // If section_code is still null (e.g. company admin), find a default section
            if (empty($data['section_code'])) {
                // Try to use existing product's section code
                if (!empty($item->section_code)) {
                    $data['section_code'] = $item->section_code;
                } else {
                    $defaultSection = Section::where('company_code', $user->company_code)
                        ->orderBy('is_main_stock', 'desc')
                        ->orderBy('id', 'asc')
                        ->first();
                    
                    if ($defaultSection) {
                        $data['section_code'] = $defaultSection->section_code;
                    }
                }
            }
            
            $data['Status'] = 'U'; // 'U' for Update operation

            // Check if any price-related fields or discount fields have changed
            $priceFields = ['CosPri', 'NCostPrice', 'SlsPri', 'WholePrice', 'CCPrice', 'ExtraPrice'];
            $discountFields = ['RtQty1', 'RtDis1', 'RtQty2', 'RtDis2', 'RtQty3', 'RtDis3', 'RtQty4', 'RtDis4'];
            $priceOrDiscountChanged = false;
            
            // Check price fields
            foreach ($priceFields as $field) {
                if (isset($data[$field]) && $data[$field] != $item->$field) {
                    $priceOrDiscountChanged = true;
                    break;
                }
            }
            
            // Check discount fields if price fields haven't changed
            if (!$priceOrDiscountChanged) {
                foreach ($discountFields as $field) {
                    if (isset($data[$field]) && $data[$field] != $item->$field) {
                        $priceOrDiscountChanged = true;
                        break;
                    }
                }
            }

            // Always update the main product record
            $item->update($data);

            if ($priceOrDiscountChanged) {
                if ($selectedPriceHistoryId) {
                    // A specific price history record is selected for editing - update only that record
                    $selectedPriceRecord = ItemPriceDet::where('ItemPriceKey', $selectedPriceHistoryId)
                        ->where('ItmKy', $item->ItmKy)
                        ->first();
                    
                    if ($selectedPriceRecord) {
                        // Update the selected price history record and mark as updated
                        $selectedPriceRecord->update([
                            'Status' => 'U',
                            'batch_no' => $data['batch_no'] ?? $selectedPriceRecord->batch_no,
                            'brand' => $data['brand'] ?? $selectedPriceRecord->brand,
                            'model' => $data['model'] ?? $selectedPriceRecord->model,
                            'serial_number' => $data['serial_number'] ?? $selectedPriceRecord->serial_number,
                            'CosPri' => $data['CosPri'] ?? $selectedPriceRecord->CosPri,
                            'NCostPrice' => $data['NCostPrice'] ?? $selectedPriceRecord->NCostPrice,
                            'SlsPri' => $data['SlsPri'] ?? $selectedPriceRecord->SlsPri,
                            'WholePrice' => $data['WholePrice'] ?? $selectedPriceRecord->WholePrice,
                            'CCPrice' => $data['CCPrice'] ?? $selectedPriceRecord->CCPrice,
                            'ExtraPrice' => $data['ExtraPrice'] ?? $selectedPriceRecord->ExtraPrice,
                            'RtQty1' => $data['RtQty1'] ?? $selectedPriceRecord->RtQty1,
                            'RtDis1' => $data['RtDis1'] ?? $selectedPriceRecord->RtDis1,
                            'RtQty2' => $data['RtQty2'] ?? $selectedPriceRecord->RtQty2,
                            'RtDis2' => $data['RtDis2'] ?? $selectedPriceRecord->RtDis2,
                            'RtQty3' => $data['RtQty3'] ?? $selectedPriceRecord->RtQty3,
                            'RtDis3' => $data['RtDis3'] ?? $selectedPriceRecord->RtDis3,
                            'RtQty4' => $data['RtQty4'] ?? $selectedPriceRecord->RtQty4,
                            'RtDis4' => $data['RtDis4'] ?? $selectedPriceRecord->RtDis4,
                            'ChangedDate' => now(),
                        ]);
                        Log::info('Updated selected price history record for ItmKy: ' . $item->ItmKy . ' with ItemPriceKey: ' . $selectedPriceHistoryId . ' and Status: U');
                    } else {
                        // Selected record not found or doesn't belong to this item
                        Log::warning('Selected price history record not found or invalid for ItmKy: ' . $item->ItmKy . ' with ItemPriceKey: ' . $selectedPriceHistoryId);
                        return redirect()->back()
                            ->withErrors(['error' => 'Selected price record not found. Please try again.'])
                            ->withInput();
                    }
                } elseif ($keepPrice) {
                    // Keep price checked: Create NEW record in item_price_det with Status 'U' for history
                    $this->savePriceDetails($item, $data, 'U');
                    Log::info('Keep price checked - Created new price record for ItmKy: ' . $item->ItmKy . ' with Status: U');
                } else {
                    // Keep price NOT checked: Update the LATEST price record in item_price_det (if exists) with Status 'U'
                    $existingPriceRecord = ItemPriceDet::where('ItmKy', $item->ItmKy)
                        ->orderBy('ChangedDate', 'desc')
                        ->first();
                    
                    if ($existingPriceRecord) {
                        // Update the existing record and set Status to 'U'
                        $existingPriceRecord->update([
                            'Status' => 'U',
                            'batch_no' => $data['batch_no'] ?? $existingPriceRecord->batch_no,
                            'brand' => $data['brand'] ?? $existingPriceRecord->brand,
                            'model' => $data['model'] ?? $existingPriceRecord->model,
                            'serial_number' => $data['serial_number'] ?? $existingPriceRecord->serial_number,
                            'CosPri' => $data['CosPri'] ?? $existingPriceRecord->CosPri,
                            'NCostPrice' => $data['NCostPrice'] ?? $existingPriceRecord->NCostPrice,
                            'SlsPri' => $data['SlsPri'] ?? $existingPriceRecord->SlsPri,
                            'WholePrice' => $data['WholePrice'] ?? $existingPriceRecord->WholePrice,
                            'CCPrice' => $data['CCPrice'] ?? $existingPriceRecord->CCPrice,
                            'ExtraPrice' => $data['ExtraPrice'] ?? $existingPriceRecord->ExtraPrice,
                            'RtQty1' => $data['RtQty1'] ?? $existingPriceRecord->RtQty1,
                            'RtDis1' => $data['RtDis1'] ?? $existingPriceRecord->RtDis1,
                            'RtQty2' => $data['RtQty2'] ?? $existingPriceRecord->RtQty2,
                            'RtDis2' => $data['RtDis2'] ?? $existingPriceRecord->RtDis2,
                            'RtQty3' => $data['RtQty3'] ?? $existingPriceRecord->RtQty3,
                            'RtDis3' => $data['RtDis3'] ?? $existingPriceRecord->RtDis3,
                            'RtQty4' => $data['RtQty4'] ?? $existingPriceRecord->RtQty4,
                            'RtDis4' => $data['RtDis4'] ?? $existingPriceRecord->RtDis4,
                            'ChangedDate' => now(),
                        ]);
                        Log::info('Keep price NOT checked - Updated latest price record for ItmKy: ' . $item->ItmKy . ' with Status: U');
                    } else {
                        // No existing record, create one with Status 'U'
                        $this->savePriceDetails($item, $data, 'U');
                        Log::info('Keep price NOT checked - No existing record, created new one for ItmKy: ' . $item->ItmKy . ' with Status: U');
                    }
                }
            }

            DB::commit();

            // Redirect based on whether a specific price history was updated
            if ($selectedPriceHistoryId) {
                return redirect()->route('pos.products.edit', $item->ItmKy)->with('success', 'Price Updated Successfully.');
            } else {
                return redirect()->back()->with('success', 'Item Updated Successfully.');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product update error: ' . $e->getMessage());
            return redirect()->back()
                ->withErrors(['error' => 'Error occurred while updating item: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function destroy($id)
    {
        $item = Product::findOrFail($id);
        
        // Only Company Admin and Super Admin can delete products
        if (!$this->canDeleteProduct()) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete products.');
        }
        
        // Check if user can access this product
        if (!$this->canAccessProduct($item)) {
            return redirect()->back()->with('error', 'You are not allowed to access this product.');
        }
        
        try {
            DB::beginTransaction();

            // Delete related records first
            // Delete sales transaction items that reference this product
            DB::table('sales_transaction_items')->where('product_id', $item->ItmKy)->delete();
            
            // Delete wastage records that reference this product
            DB::table('wastage_dets')->where('product_id', $item->ItmKy)->delete();
            
            // Delete price details (will cascade automatically)
            // DB::table('item_price_det')->where('ItmKy', $item->ItmKy)->delete();
            
            // Delete the product
            $item->delete();

            DB::commit();

            return redirect()->back()->with('success', 'Item Deleted Successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Product deletion error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error occurred while deleting item: ' . $e->getMessage());
        }
    }

    public function getItemDetails($itemCode)
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) return response()->json(['error' => 'User not authenticated.'], 401);
        if (!$user->hasPermission('products.view')) return response()->json(['error' => 'Unauthorized'], 403);

        $companyCode = request()->query('company_code');
        
        $query = Product::where('ItemCode', $itemCode);
        
        // Products are company-wide: all users in a company can access all company products
        $user = $this->getAuthenticatedUser();
        if (!$this->userIsSuperAdmin($user)) {
            $companyCode = $companyCode ?: ($user->company_code ?? $user->company_code);
            $query->where('company_code', $companyCode);
        }
        
        $item = $query->leftJoin('code_masters', 'itemmaster.catkey', '=', 'code_masters.catkey')
            ->select(
                'itemmaster.*',
                'code_masters.cname as categoryName'
            )
            ->first();
        
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }
        
        return response()->json($item);
    }

    public function getItemCodesWithCategory()
    {
        try {
            $companyCode = request()->query('company_code');
            
            $query = DB::table('itemmaster as im')
                ->leftJoin('code_masters as cm', 'im.catkey', '=', 'cm.catkey')
                ->select(
                    'im.ItmKy as id',
                    'im.ItemCode as code',
                    'im.ItmNm as name',
                    'cm.cname as categoryName'
                )
                ->orderBy('im.ItmNm');

            // Apply multi-tenancy filters
            $user = $this->getAuthenticatedUser();
            if ($this->userIsSuperAdmin($user)) {
                // Super admin can see all products
            } elseif ($this->userIsCompanyAdmin($user)) {
                $query->where('im.company_code', $companyCode ?: ($user->company_code ?? $user->company_code));
            } else {
                $query->where('im.company_code', $companyCode ?: ($user->company_code ?? $user->company_code))
                      ->where('im.section_code', $user->section_code ?? $user->section_code);
            }
            
            $itemCodes = $query->orderBy('im.ItmNm')->get();

            return response()->json($itemCodes);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch item codes with category',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getItemNames()
    {
        try {
            $user = $this->getAuthenticatedUser();
            $query = Product::select(
                'ItmKy as id',
                'ItmNm as name',
                'ItemCode as code'
            );

            if (!$this->userIsSuperAdmin($user)) {
                $query->where('company_code', $user->company_code ?? $user->company_code);
            }

            $itemNames = $query->orderBy('ItmNm')
                               ->get();

            return response()->json($itemNames);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch item names',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // FIXED: Get suppliers where AdrTypKy = 4 (Local Supplier)


    public function getSuppliers(?Request $request = null)
    {
        try {
            $user = $this->getAuthenticatedUser();
            if (!$user) {
                return response()->json([
                    'error' => 'Authentication required',
                    'message' => 'You must be logged in to access this resource'
                ], 401);
            }

            $query = DB::table('acc_mas')
                ->where('AccTyp', 'SUPPLIER')
                ->where('Status', 'A');

            // Filter by company_code - all users need this
            if ($user->company_code) {
                $query->where('company_code', $user->company_code);
            }

            // Section admins can only see suppliers from their own section
            if ($this->userIsBranchAdmin($user)) {
                $query->where('section_code', $user->section_code);
            } elseif (!$this->userIsSuperAdmin($user) && !$this->userIsCompanyAdmin($user)) {
                // Other non-admin users also see only their section suppliers
                $query->where('section_code', $user->section_code);
            }
            
            // Allow filtering by section via request parameter for company/super admins
            if ($request && $request->query('section_code') && 
                ($this->userIsCompanyAdmin($user) || $this->userIsSuperAdmin($user))) {
                $query->where('section_code', $request->query('section_code'));
            }

            $suppliers = $query->select(
                    'AccKy as id',
                    'AccNm as name',
                    'AccKy'
                )
                ->orderBy('AccNm')
                ->get();

            return response()->json($suppliers);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch suppliers',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getCategories()
    {
        try {
            $user = $this->getAuthenticatedUser();
            $categories = DB::table('code_masters')
                ->where('conkey', 'CAT')
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->where('company_code', $user->company_code)
                ->where('section_code', $user->section_code)
                ->select('catkey as id', 'cname as name')
                ->orderBy('cname')
                ->get();
            
            return response()->json($categories);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch categories',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getUnits()
    {
        try {
            $user = $this->getAuthenticatedUser();

            if (!$user) {
                return response()->json(['error' => 'User not authenticated.'], 401);
            }

            $units = DB::table('code_masters')
                ->where('conkey', 'UNT') 
                ->where('is_active', true) 
                ->whereNull('deleted_at') 
                ->where('company_code', $user->company_code)
                ->select('id', 'cname as name', 'catkey')
                ->orderBy('cname')
                ->get();
            
            Log::info('Units fetched:', $units->toArray());
            
            return response()->json($units);
        } catch (\Exception $e) {
            Log::error('Failed to fetch units: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch units',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getBags()
    {
        try {
            $user = $this->getAuthenticatedUser();
            $bags = DB::table('code_masters')
                ->where('conkey', 'BAG')
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->where('company_code', $user->company_code)
                ->where('section_code', $user->section_code)
                ->select('id', 'cname as name', 'catkey')
                ->orderBy('cname')
                ->get();

            Log::info('Bags fetched:', $bags->toArray());

            return response()->json($bags);
        } catch (\Exception $e) {
            Log::error('Failed to fetch bags: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch bags',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getAllCategories()
    {
        try {
            $categories = DB::table('code_masters')
                ->where('conkey', 'CAT')
                ->select('catkey as id', 'cname as name', 'concode')
                ->orderBy('cname')
                ->get();
            
            return response()->json($categories);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch all categories',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function withCategory()
    {
        return $this->getItemCodesWithCategory();
    }

    public function getItemsForSelection(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error' => 'User not authenticated.'], 401);
        if (!$user->hasPermission('products.view')) return response()->json(['error' => 'Unauthorized'], 403);

        try {
            $search = $request->query('search');
            $supplier = $request->query('supplier');
            $companyCode = $request->query('company_code');

            $query = Product::where('fInAct', false) // Only active items
                ->when(true, function ($query) use ($companyCode) {
                    $user = Auth::user();
                    $companyCode = $companyCode ?: session('company_code') ?: ($user->company_code ?? $user->company_code);
                    if ($companyCode) {
                        return $query->where('itemmaster.company_code', $companyCode);
                    }
                    return $query;
                })
                ->leftJoin(DB::raw('(SELECT catkey, MIN(cname) as cname FROM code_masters WHERE conkey = "CAT" GROUP BY catkey) as category'), 'itemmaster.catkey', '=', 'category.catkey')
                ->leftJoin(DB::raw('(SELECT AccKy, MIN(AccNm) as AccNm FROM acc_mas GROUP BY AccKy) as supplier'), 'itemmaster.SupKey', '=', 'supplier.AccKy')
                ->select(
                    'itemmaster.ItmKy as id',
                    'itemmaster.ItemCode as ItemCode',
                    'itemmaster.ItmNm as ItmNm',
                    'itemmaster.SlsPri as SlsPri',
                    'itemmaster.ExtraPrice as ExtraPrice',
                    'itemmaster.QuntityDiscount as QuntityDiscount',
                    'itemmaster.BarCode as barcode',
                    'category.cname as category',
                    'supplier.AccNm as supplier'
                );

            // Apply supplier filter if provided
            if ($supplier && $supplier !== '0') {
                $query->where('itemmaster.SupKey', $supplier);
            }

            // Apply search filter if provided
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('itemmaster.ItmNm', 'LIKE', '%' . $search . '%')
                      ->orWhere('itemmaster.ItemCode', 'LIKE', '%' . $search . '%')
                      ->orWhere('itemmaster.BarCode', 'LIKE', '%' . $search . '%');
                });
            }

            $items = $query->orderBy('itemmaster.ItmNm')
                           ->get();

            return response()->json($items);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch items for selection',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Get price history for a product
    public function getPriceHistory($itemKey)
    {
        try {
            $priceHistory = ItemPriceDet::where('ItmKy', $itemKey)
                ->orderBy('ChangedDate', 'desc')
                ->get();
                
            return response()->json($priceHistory);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch price history',
                'message' => $e->getMessage()
            ], 500);
        }
    }


    public function getItemsForList(Request $request)
    {
        try {
            Log::info('getItemsForList: Starting query');

            $searchTerm = $request->query('search');
            $priceFilter = $request->query('price');
            $category = $request->query('category');
            $companyCode = $request->query('company_code');
            $sectionCode = $request->query('section_code');
            Log::info('getItemsForList: Search term: ' . ($searchTerm ?? 'none') . ', Price filter: ' . ($priceFilter ?? 'none') . ', Category: ' . ($category ?? 'none') . ', Section code: ' . ($sectionCode ?? 'none'));

            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'error' => 'Authentication required',
                    'message' => 'You must be logged in to access this resource'
                ], 401);
            }

            if (!$user->hasPermission('products.view')) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You do not have permission to view products'
                ], 403);
            }

            $query = Product::where('fInAct', false) // Only active items
                ->when(!$this->userIsSuperAdmin($user), function ($query) use ($companyCode, $user) {
                    $companyCode = $companyCode ?: ($user->company_code ?? $user->company_code);
                    return $query->where('itemmaster.company_code', $companyCode);
                })
                ->leftJoin(DB::raw('(SELECT catkey, MIN(cname) as cname FROM code_master WHERE conkey = "CAT" GROUP BY catkey) as category'), 'itemmaster.catkey', '=', 'category.catkey')
                ->leftJoin(DB::raw('(
                    SELECT
                        ItemKy,
                        company_code,
                        section_code,
                        SUM(COALESCE(Qty, 0) + COALESCE(FreeQty, 0)) as total_stock
                    FROM stock_in_hand
                    GROUP BY ItemKy, company_code, section_code
                ) as stock'), function($join) use ($sectionCode) {
                    $join->on('itemmaster.ItmKy', '=', 'stock.ItemKy')
                         ->where('stock.section_code', '=', $sectionCode ?: DB::raw('itemmaster.section_code'));
                })
                ->select(
                    'itemmaster.ItmKy as id',
                    'itemmaster.ItemCode as code',
                    'itemmaster.ItmNm as sinhala_name',
                    'itemmaster.ItmNm as name',
                    'itemmaster.SlsPri as price',
                    'itemmaster.BarCode as barcode',
                    'category.cname as category',
                    DB::raw('COALESCE(stock.total_stock, 0) as stock')
                );

            // Apply search filter if search term is provided
            if ($searchTerm) {
                $query->where(function($q) use ($searchTerm) {
                    $q->where('itemmaster.ItemCode', 'LIKE', '%' . $searchTerm . '%')
                      ->orWhere('itemmaster.ItmNm', 'LIKE', '%' . $searchTerm . '%')
                      ->orWhere('itemmaster.BarCode', 'LIKE', '%' . $searchTerm . '%')
                      ->orWhere('category.cname', 'LIKE', '%' . $searchTerm . '%');
                });
            }

            // Apply price filter if provided
            if ($priceFilter) {
                $query->where('itemmaster.SlsPri', 'LIKE', '%' . $priceFilter . '%');
            }

            // Apply category filter if provided
            if ($category && $category !== 'all') {
                $query->where('category.catkey', $category);
            }

            // Use pagination instead of limit/get to prevent loading all items
            $perPage = $request->input('per_page', 20);
            $items = $query->orderBy('itemmaster.ItmNm')
                          ->paginate($perPage);

            Log::info('getItemsForList: Query completed, items found: ' . $items->count());
            if ($searchTerm || $priceFilter || ($category && $category !== 'all') || $sectionCode) {
                Log::info('getItemsForList: Search results for "' . ($searchTerm ?? '') . '" with price "' . ($priceFilter ?? '') . '" and category "' . ($category ?? '') . '" and section "' . ($sectionCode ?? '') . '": ' . $items->count() . ' items');
            }

            return response()->json($items);
        } catch (\Exception $e) {
            Log::error('getItemsForList: Error - ' . $e->getMessage());
            Log::error('getItemsForList: File: ' . $e->getFile() . ', Line: ' . $e->getLine());
            return response()->json([
                'error' => 'Failed to fetch items for list',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Delete a specific price history record
    public function deletePriceHistory($priceHistoryId)
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) return response()->json(['error' => 'User not authenticated.'], 401);
        if (!$user->hasPermission('products.edit')) return response()->json(['error' => 'Unauthorized'], 403);

        try {
            $priceRecord = ItemPriceDet::findOrFail($priceHistoryId);
            $priceRecord->delete();
            
            Log::info('Price history record deleted: ' . $priceHistoryId);
            
            return response()->json([
                'success' => true,
                'message' => 'Price record deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete price history: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to delete price record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get item details with pricing and discount information
     */
    public function getItemWithDiscounts(Request $request)
    {
        $itemCode = $request->query('code');
        $priceType = $request->query('price_type', 'retail');
        $quantity = $request->query('quantity', 1);
        $companyCode = $request->query('company_code');
        $priceRecordId = $request->query('price_record_id'); // New parameter to select specific price record

        // First get the basic item info
        $baseItem = DB::table('itemmaster')
            ->where('itemmaster.ItemCode', $itemCode)
            ->where('itemmaster.fInAct', false)
            ->when(!$this->userIsSuperAdmin(Auth::user()), function ($query) use ($companyCode) {
                $user = Auth::user();
                $companyCode = $companyCode ?: ($user->company_code ?? $user->company_code);
                return $query->where('itemmaster.company_code', $companyCode);
            })
            ->select([
                'itemmaster.ItmKy',
                'itemmaster.ItemCode',
                'itemmaster.BarCode',
                'itemmaster.ItmNm',
                'itemmaster.catkey',
                'itemmaster.SlsPri as default_price',
                'itemmaster.DiscountQty',
                'itemmaster.QuntityDiscount'
            ])
            ->first();

        if (!$baseItem) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        // Get the specific price record or the latest one
        $priceRecord = null;
        if ($priceRecordId) {
            // Get specific price record by ItemPriceKey
            $priceRecord = DB::table('item_price_det')
                ->where('ItmKy', $baseItem->ItmKy)
                ->where('ItemPriceKey', $priceRecordId)
                ->first();
                
            if (!$priceRecord) {
                return response()->json(['error' => 'Specified price record not found'], 404);
            }
        }
        
        if (!$priceRecord) {
            // Get the latest price record if no specific one requested
            $priceRecord = DB::table('item_price_det')
                ->where('ItmKy', $baseItem->ItmKy)
                ->orderBy('ChangedDate', 'desc')
                ->first();
        }
        
        // If still no price record found, return error
        if (!$priceRecord) {
            return response()->json(['error' => 'No price record found for this item'], 404);
        }

        // Combine base item with price record data
        $item = (object) array_merge((array) $baseItem, [
            'retail_price' => $priceRecord->SlsPri ?? null,
            'WholePrice' => $priceRecord->WholePrice ?? null,
            'ExtraPrice' => $priceRecord->ExtraPrice ?? null,
            'CCPrice' => $priceRecord->CCPrice ?? null,
            'CosPri' => $priceRecord->CosPri ?? null,
            'RtQty1' => $priceRecord->RtQty1 ?? null,
            'RtDis1' => $priceRecord->RtDis1 ?? null,
            'RtQty2' => $priceRecord->RtQty2 ?? null,
            'RtDis2' => $priceRecord->RtDis2 ?? null,
            'RtQty3' => $priceRecord->RtQty3 ?? null,
            'RtDis3' => $priceRecord->RtDis3 ?? null,
            'RtQty4' => $priceRecord->RtQty4 ?? null,
            'RtDis4' => $priceRecord->RtDis4 ?? null,
            'price_record_discount_qty' => $priceRecord->DiscountQty ?? 0,
            'price_record_quantity_discount' => $priceRecord->QuntityDiscount ?? 0
        ]);

        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        // Determine base price based on price type, with proper fallbacks
        $basePrice = null;
        
        // First try to get price from the selected price record
        if ($priceRecord) {
            $basePrice = match($priceType) {
                'retail' => $priceRecord->SlsPri,
                'wholesale' => $priceRecord->WholePrice,
                'extra' => $priceRecord->ExtraPrice, 
                'credit' => $priceRecord->CCPrice,
                default => $priceRecord->SlsPri
            };
        }
        
        // If no price from record or price is null/zero, fallback to default from base item
        if (!$basePrice || $basePrice <= 0) {
            $basePrice = $item->default_price;
        }
        
        // Final safety check
        if (!$basePrice || $basePrice <= 0) {
            return response()->json(['error' => 'No valid price found for this item'], 404);
        }

        // Apply discounts with priority: Promotional discounts first, then quantity-based discounts
        $discountAmount = 0;
        $finalPrice = $basePrice;
        $discountType = 'none';
        $promotionalDiscountData = null;

        // First Priority: Check for promotional discounts using PromotionalDiscountController
        $promotionalDiscountController = new PromotionalDiscountController();
        $promotionalDiscountResult = $promotionalDiscountController->calculatePromotionalDiscount($itemCode, $basePrice, $quantity);

        if ($promotionalDiscountResult['has_discount']) {
            // Apply promotional discount (percentage-based)
            $discountAmount = $promotionalDiscountResult['discount_amount'];
            $finalPrice = $promotionalDiscountResult['final_price'];
            $discountType = 'promotional';
            $promotionalDiscountData = $promotionalDiscountResult['promotional_discount'];
        } else {
            // Second Priority: Apply quantity-based discount only if no promotional discount (uses selected price record's discount settings)
            $discountTiers = [
                ['qty' => $priceRecord->RtQty4 ?? $priceRecord->DiscountQty, 'discount' => $priceRecord->RtDis4 ?? $priceRecord->QuntityDiscount],
                ['qty' => $priceRecord->RtQty3, 'discount' => $priceRecord->RtDis3],
                ['qty' => $priceRecord->RtQty2, 'discount' => $priceRecord->RtDis2],
                ['qty' => $priceRecord->RtQty1, 'discount' => $priceRecord->RtDis1],
            ];

            // Check tiers from highest to lowest quantity
            foreach ($discountTiers as $tier) {
                if ($tier['qty'] !== null && $quantity >= $tier['qty'] && $tier['discount'] > 0) {
                    // Apply discount per item (not total discount spread across items)
                    $discountAmount = $tier['discount']; // Discount amount per item
                    $finalPrice = max(0, $basePrice - $discountAmount); // Final price per item after discount
                    $discountType = 'quantity';
                    break; // Apply first matching tier (highest qualifying tier)
                }
            }
        }

        // Calculate free items based on DiscountQty and QuntityDiscount from selected price record
        $freeItems = 0;
        $discountQty = $priceRecord->DiscountQty ?? 0;
        $quantityDiscount = $priceRecord->QuntityDiscount ?? 0;

        // Only apply free items if no promotional discount is active (to match the priority logic above)
        if (!$promotionalDiscountResult['has_discount'] && $discountQty > 0 && $quantityDiscount > 0 && $quantity >= $discountQty) {
            // Calculate how many sets of discount quantity the customer is buying
            $sets = floor($quantity / $discountQty);
            $freeItems = $sets * $quantityDiscount;
            
            // Note: Free items logic - we give free items but don't change the price
            // The price change to ExtraPrice should only happen in specific business logic scenarios
            // For now, we keep the calculated price and just provide free items information
        }

        // Debug logging for discount calculation
        Log::info('getItemWithDiscounts Debug', [
            'item_code' => $itemCode,
            'price_record_id' => $priceRecordId,
            'price_type' => $priceType,
            'quantity' => $quantity,
            'selected_record' => [
                'ItemPriceKey' => $priceRecord->ItemPriceKey,
                'SlsPri' => $priceRecord->SlsPri,
                'WholePrice' => $priceRecord->WholePrice,
                'ExtraPrice' => $priceRecord->ExtraPrice,
                'CCPrice' => $priceRecord->CCPrice,
                'RtQty1' => $priceRecord->RtQty1,
                'RtDis1' => $priceRecord->RtDis1,
                'DiscountQty' => $priceRecord->DiscountQty,
                'QuntityDiscount' => $priceRecord->QuntityDiscount,
            ],
            'calculation' => [
                'base_price' => $basePrice,
                'discount_amount' => $discountAmount,
                'final_price' => $finalPrice,
                'discount_type' => $discountType,
                'free_items' => $freeItems,
            ]
        ]);

        // Get all available price records with discount calculations
        $allPriceRecords = $this->getAllPriceRecordsWithDiscounts($baseItem->ItmKy, $quantity);

        return response()->json([
            'item' => [
                'id' => $item->ItmKy,
                'ItemCode' => $item->ItemCode,
                'BarCode' => $item->BarCode,
                'ItmNm' => $item->ItmNm,
                'category' => $item->catkey,
                'base_price' => $basePrice,
                'unit_price' => $basePrice, // For backward compatibility
                'final_price' => $finalPrice,
                'discount_amount' => $discountAmount, // This is per-item discount amount
                'cost_price' => $priceRecord->CosPri,
                'cc_price' => $priceRecord->CCPrice, // Credit card price
                'free_items' => $freeItems, // Number of free items for this quantity
                'selected_price_record' => [
                    'ItemPriceKey' => $priceRecord->ItemPriceKey,
                    'retail_price' => $priceRecord->SlsPri,
                    'wholesale_price' => $priceRecord->WholePrice,
                    'extra_price' => $priceRecord->ExtraPrice,
                    'credit_price' => $priceRecord->CCPrice,
                    'cost_price' => $priceRecord->CosPri,
                    'changed_date' => $priceRecord->ChangedDate,
                    'status' => $priceRecord->Status
                ],
                'all_prices' => $allPriceRecords, // All available price records with discounts
            ],
            'discount_info' => [
                'applied' => $discountAmount > 0,
                'type' => $discountType, // 'promotional', 'quantity', or 'none'
                'amount_per_item' => $discountAmount, // Per-item discount amount
                'total_discount' => $discountAmount * $quantity, // Total discount for the quantity
                'promotional_discount' => $promotionalDiscountData,
                'free_items_info' => [
                    'discount_qty' => $discountQty,
                    'quantity_discount' => $quantityDiscount,
                    'free_items' => $freeItems,
                ],
                'tiers' => [
                    'tier1' => ['qty' => $priceRecord->RtQty1, 'discount' => $priceRecord->RtDis1],
                    'tier2' => ['qty' => $priceRecord->RtQty2, 'discount' => $priceRecord->RtDis2],
                    'tier3' => ['qty' => $priceRecord->RtQty3, 'discount' => $priceRecord->RtDis3],
                    'tier4' => ['qty' => $priceRecord->RtQty4 ?? $discountQty, 'discount' => $priceRecord->RtDis4 ?? $quantityDiscount],
                ],
                'price_record_id' => $priceRecordId, // Include the selected price record ID
                'available_prices' => $this->getAvailablePricesForItem($baseItem->ItmKy) // Include all available price records
            ]
        ]);
    }

    /**
     * Get all available price records for an item
     */
    private function getAvailablePricesForItem($itemKey)
    {
        return DB::table('item_price_det')
            ->where('ItmKy', $itemKey)
            ->select([
                'ItemPriceKey',
                'SlsPri as retail_price',
                'WholePrice as wholesale_price',
                'ExtraPrice as extra_price',
                'CCPrice as credit_price',
                'ChangedDate',
                'Status'
            ])
            ->orderBy('ChangedDate', 'desc')
            ->get();
    }

    /**
     * Get all price records for an item with discount calculations
     */
    private function getAllPriceRecordsWithDiscounts($itemKey, $quantity)
    {
        $priceRecords = DB::table('item_price_det')
            ->where('ItmKy', $itemKey)
            ->select([
                'ItemPriceKey',
                'SlsPri',
                'WholePrice',
                'ExtraPrice',
                'CCPrice',
                'CosPri',
                'RtQty1', 'RtDis1', 'RtQty2', 'RtDis2', 'RtQty3', 'RtDis3', 'RtQty4', 'RtDis4',
                'DiscountQty', 'QuntityDiscount',
                'ChangedDate',
                'Status'
            ])
            ->orderBy('ChangedDate', 'desc')
            ->get();

        $processedRecords = [];
        
        foreach ($priceRecords as $record) {
            // Calculate discounts for each price type
            $processedRecord = [
                'ItemPriceKey' => $record->ItemPriceKey,
                'ChangedDate' => $record->ChangedDate,
                'Status' => $record->Status,
                'retail' => $this->calculatePriceWithDiscount($record->SlsPri, $record, $quantity),
                'wholesale' => $this->calculatePriceWithDiscount($record->WholePrice, $record, $quantity),
                'extra' => $this->calculatePriceWithDiscount($record->ExtraPrice, $record, $quantity),
                'credit' => $this->calculatePriceWithDiscount($record->CCPrice, $record, $quantity),
                'cost_price' => $record->CosPri,
            ];
            
            $processedRecords[] = $processedRecord;
        }

        return $processedRecords;
    }

    /**
     * Calculate final price with discount for a specific price and record
     */
    private function calculatePriceWithDiscount($basePrice, $record, $quantity)
    {
        if (!$basePrice || $basePrice <= 0) {
            return [
                'base_price' => $basePrice,
                'final_price' => $basePrice,
                'discount_amount' => 0,
                'discount_type' => 'none'
            ];
        }

        $discountAmount = 0;
        $discountType = 'none';

        // Apply quantity-based discount tiers
        $discountTiers = [
            ['qty' => $record->RtQty4 ?? $record->DiscountQty, 'discount' => $record->RtDis4 ?? $record->QuntityDiscount],
            ['qty' => $record->RtQty3, 'discount' => $record->RtDis3],
            ['qty' => $record->RtQty2, 'discount' => $record->RtDis2],
            ['qty' => $record->RtQty1, 'discount' => $record->RtDis1],
        ];

            // Check tiers from highest to lowest quantity
            foreach ($discountTiers as $tier) {
                if ($tier['qty'] !== null && $quantity >= $tier['qty'] && $tier['discount'] > 0) {
                    // Apply discount per item (not total discount spread across items)
                    $discountAmount = $tier['discount']; // Discount amount per item
                    $discountType = 'quantity';
                    break; // Apply first matching tier (highest qualifying tier)
                }
            }        $finalPrice = max(0, $basePrice - $discountAmount);

        return [
            'base_price' => $basePrice,
            'final_price' => $finalPrice,
            'discount_amount' => $discountAmount,
            'discount_type' => $discountType
        ];
    }

    /**
     * Generate barcode print batch for newly created product
     */
    private function generateBarcodePrintBatch($product)
    {
        try {
            $user = Auth::user();

            // Create barcode print batch
            $batch = \App\Models\BarcodePrintBatch::create([
                'user_id' => $user->id,
                'note' => 'Product creation: ' . $product->ItmNm,
            ]);

            // Add product to print batch
            \App\Models\BarcodePrintItem::create([
                'batch_id' => $batch->id,
                'item_code' => $product->ItemCode,
                'item_name' => $product->ItmNm,
                'category' => $product->catkey,
                'sales_price' => $product->SlsPri,
                'qty' => 1, // Default quantity for printing
            ]);

            return $batch;

        } catch (\Exception $e) {
            Log::error('Barcode print batch creation error: ' . $e->getMessage());
            // Don't fail the product creation if barcode batch creation fails
            return null;
        }
    }

    public function toggle($id)
    {
        try {
            $product = Product::findOrFail($id);
            
            // Check if user has permission to manage products
            if (!$this->canAccessProduct($product) || !$this->canManageProducts()) {
                return redirect()->back()->with('error', 'Unauthorized action.');
            }

            // Toggle the status
            $product->fInAct = !$product->fInAct;
            // Also update Status for audit tracking
            $product->Status = $product->fInAct ? 'D' : 'U'; // D for Deactivated/Deleted, U for Updated/Active
            $product->save();

            // Also update the latest price detail to reflect the status change if desired, 
            // but usually price details track price changes. 
            // However, we might want to log this status change in item_price_det too if it tracks overall history.
            // For now, let's keep it simple and just update the main product.

            $status = $product->fInAct ? 'inactive' : 'active';
            
            return redirect()->back()->with('success', "Product marked as {$status} successfully.");
            
        } catch (\Exception $e) {
            Log::error('Product toggle error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update product status.');
        }
    }
}