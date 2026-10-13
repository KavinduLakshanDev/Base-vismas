<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Str;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // User & Access Management
            ['name' => 'View Users', 'slug' => 'users.view', 'description' => 'Can view users'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'description' => 'Can create new users'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'description' => 'Can edit existing users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'description' => 'Can delete users'],
            
            // Roles & Permissions
            ['name' => 'View Roles', 'slug' => 'roles.view', 'description' => 'Can view roles'],
            ['name' => 'Create Roles', 'slug' => 'roles.create', 'description' => 'Can create new roles'],
            ['name' => 'Edit Roles', 'slug' => 'roles.edit', 'description' => 'Can edit existing roles'],
            ['name' => 'Delete Roles', 'slug' => 'roles.delete', 'description' => 'Can delete roles'],

            // Permissions Management
            ['name' => 'View Permissions', 'slug' => 'permissions.view', 'description' => 'Can view permissions'],
            ['name' => 'Create Permissions', 'slug' => 'permissions.create', 'description' => 'Can create new permissions'],
            ['name' => 'Edit Permissions', 'slug' => 'permissions.edit', 'description' => 'Can edit existing permissions'],
            ['name' => 'Delete Permissions', 'slug' => 'permissions.delete', 'description' => 'Can delete permissions'],

            // Company & System Settings
            ['name' => 'Manage Company Profile', 'slug' => 'company.profile', 'description' => 'Can manage company profile'],
            ['name' => 'Manage Sections', 'slug' => 'sections.manage', 'description' => 'Can manage sections'],
            ['name' => 'Manage VAT Rates', 'slug' => 'vat_rates.manage', 'description' => 'Can manage VAT rates'],
            ['name' => 'Manage Controller Master', 'slug' => 'admin.controller_master', 'description' => 'Can manage controller master settings'],
            ['name' => 'Manage Code Master', 'slug' => 'admin.code_master', 'description' => 'Can manage code master settings'],
            ['name' => 'View Settings', 'slug' => 'settings.view', 'description' => 'Can view system settings'],
            ['name' => 'Edit Settings', 'slug' => 'settings.edit', 'description' => 'Can modify system settings'],

            // Product Management
            ['name' => 'View Products', 'slug' => 'products.view', 'description' => 'Can view products'],
            ['name' => 'Create Products', 'slug' => 'products.create', 'description' => 'Can create new products'],
            ['name' => 'Edit Products', 'slug' => 'products.edit', 'description' => 'Can edit existing products'],
            ['name' => 'Delete Products', 'slug' => 'products.delete', 'description' => 'Can delete products'],
            ['name' => 'View Categories', 'slug' => 'categories.view', 'description' => 'Can view product categories'],
            ['name' => 'Manage Categories', 'slug' => 'categories.manage', 'description' => 'Can manage product categories'],
            ['name' => 'View Brands', 'slug' => 'brands.view', 'description' => 'Can view product brands'],
            ['name' => 'Manage Brands', 'slug' => 'brands.manage', 'description' => 'Can manage product brands'],
            ['name' => 'View Models', 'slug' => 'models.view', 'description' => 'Can view product models'],
            ['name' => 'Manage Models', 'slug' => 'models.manage', 'description' => 'Can manage product models'],
            ['name' => 'View Units', 'slug' => 'units.view', 'description' => 'Can view product units'],
            ['name' => 'Manage Units', 'slug' => 'units.manage', 'description' => 'Can manage product units'],

            // Stock & Inventory
            ['name' => 'View Stock', 'slug' => 'stock.view', 'description' => 'Can view stock levels'],
            ['name' => 'Adjust Stock', 'slug' => 'stock.adjust', 'description' => 'Can adjust stock levels manually'],
            ['name' => 'Transfer Stock', 'slug' => 'stock.transfer', 'description' => 'Can transfer stock between locations'],
            ['name' => 'View Wastage', 'slug' => 'wastage.view', 'description' => 'Can view wastage records'],
            ['name' => 'Create Wastage', 'slug' => 'wastage.create', 'description' => 'Can create wastage records'],

            // Sales, POS & Payments
            ['name' => 'View Sales', 'slug' => 'sales.view', 'description' => 'Can view sales history'],
            ['name' => 'Create Sales', 'slug' => 'sales.create', 'description' => 'Can create new sales'],
            ['name' => 'Edit Sales', 'slug' => 'sales.edit', 'description' => 'Can edit existing sales'],
            ['name' => 'Delete Sales', 'slug' => 'sales.delete', 'description' => 'Can delete sales/void transactions'],
            ['name' => 'Access POS', 'slug' => 'pos.access', 'description' => 'Can access the Point of Sale system'],
            ['name' => 'Process Returns', 'slug' => 'sales.returns', 'description' => 'Can process sales returns'],
            ['name' => 'Process Cheque Returns', 'slug' => 'cheque_returns.process', 'description' => 'Can process cheque returns'],
            ['name' => 'Create Cheque Returns', 'slug' => 'cheque_returns.create', 'description' => 'Can create cheque return records'],
            ['name' => 'View Cheque Returns', 'slug' => 'cheque_returns.view', 'description' => 'Can view cheque returns'],
            ['name' => 'Create Customer Payments', 'slug' => 'customer_payments.create', 'description' => 'Can record customer payments'],
            ['name' => 'View Customer Payments', 'slug' => 'customer_payments.view', 'description' => 'Can view customer payment history'],

            // Quotations
            ['name' => 'View Quotations', 'slug' => 'quotations.view', 'description' => 'Can view quotations'],
            ['name' => 'Create Quotations', 'slug' => 'quotations.create', 'description' => 'Can create new quotations'],
            ['name' => 'Edit Quotations', 'slug' => 'quotations.edit', 'description' => 'Can edit existing quotations'],

            // Purchases & Suppliers
            ['name' => 'View Purchases', 'slug' => 'purchases.view', 'description' => 'Can view purchase history'],
            ['name' => 'Create Purchases', 'slug' => 'purchases.create', 'description' => 'Can create new purchases'],
            ['name' => 'Edit Purchases', 'slug' => 'purchases.edit', 'description' => 'Can edit existing purchases'],
            ['name' => 'Delete Purchases', 'slug' => 'purchases.delete', 'description' => 'Can delete purchases'],
            ['name' => 'Create GRN', 'slug' => 'grn.create', 'description' => 'Can create Goods Received Notes'],
             ['name' => 'Create Supplier Payments', 'slug' => 'supplier_payments.create', 'description' => 'Can record supplier payments'],
            ['name' => 'View Supplier Payments', 'slug' => 'supplier_payments.view', 'description' => 'Can view supplier payment history'],
            ['name' => 'Create Supplier Returns', 'slug' => 'supplier_returns.create', 'description' => 'Can create supplier returns'],

            // Customers & Loyalty
            ['name' => 'View Customers', 'slug' => 'customers.view', 'description' => 'Can view customers'],
            ['name' => 'Create Customers', 'slug' => 'customers.create', 'description' => 'Can create new customers'],
            ['name' => 'Edit Customers', 'slug' => 'customers.edit', 'description' => 'Can edit existing customers'],
            ['name' => 'Delete Customers', 'slug' => 'customers.delete', 'description' => 'Can delete customers'],
             ['name' => 'Manage Privilege Users', 'slug' => 'privilege_users.manage', 'description' => 'Can manage privilege users and cards'],
            ['name' => 'Manage Privilege Points', 'slug' => 'privilege_points.manage', 'description' => 'Can manage privilege points generation and redemption'],

            // Suppliers
            ['name' => 'View Suppliers', 'slug' => 'suppliers.view', 'description' => 'Can view suppliers'],
            ['name' => 'Create Suppliers', 'slug' => 'suppliers.create', 'description' => 'Can create new suppliers'],
            ['name' => 'Edit Suppliers', 'slug' => 'suppliers.edit', 'description' => 'Can edit existing suppliers'],
            ['name' => 'Delete Suppliers', 'slug' => 'suppliers.delete', 'description' => 'Can delete suppliers'],

            // Service Jobs
            ['name' => 'View Service Jobs', 'slug' => 'service_jobs.view', 'description' => 'Can view service jobs'],
            ['name' => 'Create Service Jobs', 'slug' => 'service_jobs.create', 'description' => 'Can create new service jobs'],
            ['name' => 'Edit Service Jobs', 'slug' => 'service_jobs.edit', 'description' => 'Can edit/update service jobs'],
            ['name' => 'Delete Service Jobs', 'slug' => 'service_jobs.delete', 'description' => 'Can delete service jobs'],
            ['name' => 'Assign Service Jobs', 'slug' => 'service_jobs.assign', 'description' => 'Can assign service jobs to technicians'],

            // Deliveries (Malibo)
            ['name' => 'View Deliveries', 'slug' => 'deliveries.view', 'description' => 'Can view deliveries'],
            ['name' => 'Create Deliveries', 'slug' => 'deliveries.create', 'description' => 'Can create new deliveries'],
            ['name' => 'Edit Deliveries', 'slug' => 'deliveries.edit', 'description' => 'Can edit existing deliveries'],
            ['name' => 'Delete Deliveries', 'slug' => 'deliveries.delete', 'description' => 'Can delete deliveries'],


            // Printing Operations
            ['name' => 'View Printer Stock', 'slug' => 'printing.stock.view', 'description' => 'Can view printer stock'],
            ['name' => 'View Printer Transfers', 'slug' => 'printing.transfers.view', 'description' => 'Can view printer transfers'],
            ['name' => 'Create Printer Transfers', 'slug' => 'printing.transfers.create', 'description' => 'Can create printer transfers'],
            ['name' => 'Approve Printer Transfers', 'slug' => 'printing.transfers.approve', 'description' => 'Can approve printer transfers'],
            ['name' => 'Reject Printer Transfers', 'slug' => 'printing.transfers.reject', 'description' => 'Can reject printer transfers'],

            // Reports
            ['name' => 'View Sales Reports', 'slug' => 'reports.sales', 'description' => 'Can view sales reports'],
            ['name' => 'View Stock Reports', 'slug' => 'reports.stock', 'description' => 'Can view stock reports'],
            ['name' => 'View Stock In Hand', 'slug' => 'reports.stock_in_hand', 'description' => 'Can view stock in hand report'],
            ['name' => 'View Bin Card', 'slug' => 'reports.bin_card', 'description' => 'Can view stock bin card'],
            ['name' => 'View Financial Reports', 'slug' => 'reports.financial', 'description' => 'Can view financial reports'],
            ['name' => 'View Collection Report', 'slug' => 'reports.collection', 'description' => 'Can view collection reports'],
            ['name' => 'View Wastage Report', 'slug' => 'reports.wastage', 'description' => 'Can view wastage reports'],
            ['name' => 'View Customer History', 'slug' => 'reports.customer_history', 'description' => 'Can view customer ledgers and details'],
            ['name' => 'View Supplier History', 'slug' => 'reports.supplier_history', 'description' => 'Can view supplier ledgers and details'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                [
                    'name' => $permission['name'],
                    'description' => $permission['description'],
                    'uuid' => (string) Str::uuid(),
                ]
            );
        }

        // Assign Permissions to Roles
        $this->assignCashierPermissions();
        $this->assignTechnicianPermissions();
    }

    private function assignCashierPermissions()
    {
        $role = Role::where('slug', 'cashier')->first();
        if ($role) {
            $permissions = Permission::whereIn('slug', [
                'pos.access',
                'sales.create',
                'sales.view',
                'sales.returns',
                'customers.create',
                'customers.view',
                'products.view',
                'stock.view',
                'customer_payments.create',
                'customer_payments.view',
                'cheque_returns.create',
                'cheque_returns.view',
                'cheque_returns.view',
                'quotations.view',
                // 'quotations.create', // Removed as per request
                'service_jobs.create',
                'service_jobs.view',
                // Master Data Views
                'categories.view',
                'brands.view',
                'models.view',
                'units.view',
                // Reports
                'reports.sales',
                'reports.stock',
                'reports.stock_in_hand',
                'reports.bin_card',
                'reports.financial',
                'reports.collection',
                'reports.wastage',
                'reports.customer_history',
                'reports.supplier_history',
            ])->get();
            
            $role->permissions()->sync($permissions->pluck('id'));
        }
    }

    private function assignTechnicianPermissions()
    {
        $role = Role::where('slug', 'technician')->first();
        if ($role) {
            $permissions = Permission::whereIn('slug', [
                'service_jobs.view',
                'service_jobs.edit', // Technicians update job status
                'service_jobs.assign', // Technicians can assign jobs to themselves
                'quotations.view', // Technicians can view quotations
                'quotations.create', // Technicians can create quotations
                'products.view',     // View parts
                'stock.view',        // Check stock for parts
                // Printing permissions for technicians who might handle printers
                'printing.stock.view',
                'printing.transfers.view',
            ])->get();

            $role->permissions()->syncWithoutDetaching($permissions->pluck('id'));
        }
    }
}
