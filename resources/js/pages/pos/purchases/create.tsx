// import { Button } from '@/components/ui/button';
// import { Calendar } from '../../../components/ui/calendar';
// import { Card, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from '../../../components/ui/popover';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarIcon, FileText, MapPin, Plus, Save, Search, Trash2, PackagePlus } from 'lucide-react';
import React, { useEffect, useMemo, useState, useRef } from 'react';

// Component imports
import PurchaseHeader from '@/components/pos/purchases/PurchaseHeader';
import StockLocationSelector from '@/components/pos/purchases/StockLocationSelector';
import CompanyBranchSelector from '@/components/pos/purchases/CompanyBranchSelector';
import GrnDetails from '@/components/pos/purchases/GrnDetails';
import SupplierSelector from '@/components/pos/purchases/SupplierSelector';
import ItemsTable from '@/components/pos/purchases/ItemsTable';
import PurchaseTotals from '@/components/pos/purchases/PurchaseTotals';
import ItemSelectionModal from '@/components/pos/purchases/ItemSelectionModal';
import ItemDetailsModal from '@/components/pos/purchases/ItemDetailsModal';

// Date formatting utilities for DD/MM/YYYY display
const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const parseDateFromDisplay = (displayDate: string): string => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const dateToDisplay = (date: Date | undefined) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const displayToDate = (displayDate: string): Date | undefined => {
    if (!displayDate) return undefined;
    const parts = displayDate.split('/');
    if (parts.length !== 3) return undefined;
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day);
};

interface Supplier {
    id: number;
    code: string;
    name: string;
    contact?: string;
    email?: string;
    address?: string;
    acc_ky?: number;
    section_code?: string;
}

interface PurchaseType {
    code: string;
    name: string;
    description?: string;
}

interface Product {
    id: number;
    code: string;
    name: string;
    english_name?: string;
    barcode?: string;
    category_id?: string;
    category_name?: string;
    cost_price: number;
    normal_cost: number;
    retail_price: number;
    wholesale_price: number;
    extra_price: number;
    cc_price: number;
    current_stock: number;
    free_stock: number;
    brand?: string;
    model?: string;
    serial_number?: string;
}

interface Category {
    id: string;
    code: string;
    name: string;
}

interface Company {
    id: number;
    company_code: string;
    name: string;
}

interface Branch {
    id: number;
    company_code: string;
    section_code: string;
    name: string;
    is_main_stock: boolean;
}

interface UserContext {
    company_id: number | null;
    branch_id: number | null;
    is_super_admin: boolean;
    is_company_admin: boolean;
    is_branch_admin: boolean;
    is_staff_user: boolean;
}

interface PurchaseItem {
    product_id: number;
    product_code: string;
    product_name: string;
    qty: number;
    cost_price: number;
    normal_cost: number;
    new_cost_price: number;
    discount_rate: number;
    free_qty: number;
    retail_price: number;
    wholesale_price: number;
    extra_price: number;
    cc_price: number;
    item_discount: number;
    amount: number;
    brand: string;
    model: string;
    serial_number: string;
    warranty: string;
    barcode?: string;
    category?: string;
    remark?: string;
    cus_discount_rate?: number;
}

interface Brand {
    id: number;
    name: string;
    category_id?: number;
    category_code?: string;
    models: string[];
}

interface CreateProps {
    suppliers: Supplier[];
    purchaseTypes: PurchaseType[];
    products: Product[];
    categories: Category[];
    companies: Company[];
    branches: Branch[];
    nextPurchaseNo: number;
    userRole: number;
    userContext: UserContext;
    user: {
        company_code: string;
        branch_code: string;
    };
    type: string;
    existingBrands?: Brand[];
    existingModels?: string[];
}

export default function PurchaseCreate({
    suppliers,
    purchaseTypes,
    products,
    categories,
    companies,
    branches,
    nextPurchaseNo,
    userRole,
    userContext,
    user,
    type,
    existingBrands = [],
    existingModels = [],
}: CreateProps) {
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
        null,
    );
    const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>(
        {},
    );
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(
        null,
    );
    const [modalItem, setModalItem] = useState<PurchaseItem | null>(null);
    const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL_CATEGORIES');
    const [mainStockCategory, setMainStockCategory] = useState<string>('');
    const [mainStockBrand, setMainStockBrand] = useState<string>('');
    const [mainStockItemName, setMainStockItemName] = useState<string>('');
    const [additionalDiscount, setAdditionalDiscount] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [currentProducts, setCurrentProducts] = useState<Product[]>(products);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [openRowIndex, setOpenRowIndex] = useState<number | null>(null);
    const [stockLocationType, setStockLocationType] = useState<'main_stock' | 'printing_section'>('printing_section');

    // Auto-select company based on user profile
    useEffect(() => {
        if (!selectedCompany && companies.length > 0) {
            // Priority 1: Use user context company_id directly if available (most reliable)
            if (userContext && userContext.company_id) {
                console.log('✓ Auto-selecting company from user context ID:', userContext.company_id);
                setSelectedCompany(userContext.company_id);
                setData("company_id", userContext.company_id);
                return;
            }

            // Priority 2: Use user.company_code
            if (user.company_code) {
                const userCompany = companies.find(c => c.company_code === user.company_code);
                console.log('Searching for company with code:', user.company_code, 'Found:', userCompany);
                if (userCompany) {
                    console.log('✓ Auto-selecting company from user profile code:', userCompany.name);
                    setSelectedCompany(userCompany.id);
                    setData("company_id", userCompany.id);
                    return;
                }
            }

            // Fallback: If only one company exists, select it
            if (companies.length === 1) {
                const companyToSelect = companies[0].id;
                console.log('✓ Auto-selecting single available company:', companyToSelect);
                setSelectedCompany(companyToSelect);
                setData("company_id", companyToSelect);
            }
        }
    }, [companies, selectedCompany, user.company_code, userContext]);

    // Auto-select branch based on user profile
    // DISABLED: Stock Location Type logic takes precedence
    /*
    useEffect(() => {
        console.log('=== Branch Auto-select Debug ===');
        console.log('selectedCompany:', selectedCompany);
        console.log('selectedBranch:', selectedBranch);
        console.log('branches:', branches);
        console.log('userContext:', userContext);
        console.log('user.branch_code:', user.branch_code);
        
        if (!selectedCompany) {
            console.log('⚠ Waiting for company selection');
            return; // Wait for company selection
        }
        if (selectedBranch) {
            console.log('⚠ Branch already selected:', selectedBranch);
            return; // Already selected
        }

        // Get available branches for the selected company
        const availableBranches = branches.filter(branch => {
            const selectedCompanyData = companies.find(c => c.id === selectedCompany);
            return selectedCompanyData && branch.company_code === selectedCompanyData.company_code;
        });
        console.log('Available branches for selected company:', availableBranches);

        if (availableBranches.length > 0) {
            // Priority 1: Use user context branch_id directly if available
            if (userContext && userContext.branch_id) {
                console.log('✓ Auto-selecting branch from user context ID:', userContext.branch_id);
                setSelectedBranch(userContext.branch_id);
                setData("branch_id", userContext.branch_id);
                return;
            }

            // Priority 2: Match user's assigned branch code (section_code)
            if (user.branch_code) {
                console.log('Searching for branch with section_code:', user.branch_code);
                const userBranch = availableBranches.find(b => {
                    console.log('Comparing:', b.section_code, 'with', user.branch_code);
                    return b.section_code === user.branch_code;
                });
                console.log('Found branch:', userBranch);
                if (userBranch) {
                    console.log('✓ Auto-selecting branch from user profile code:', userBranch.name);
                    setSelectedBranch(userBranch.id);
                    setData("branch_id", userBranch.id);
                    return;
                }
            }

            // Priority 3: If only one branch exists, select it
            if (availableBranches.length === 1) {
                console.log('✓ Auto-selecting single available branch:', availableBranches[0].name);
                setSelectedBranch(availableBranches[0].id);
                setData("branch_id", availableBranches[0].id);
            }
        } else {
            console.log('⚠ No available branches found for selected company');
        }
    }, [selectedCompany, branches, companies, user.branch_code, selectedBranch, userContext]);
    */

    // Update form data when company/branch selection changes
    useEffect(() => {
        setData('company_id', selectedCompany);
    }, [selectedCompany]);

    useEffect(() => {
        setData('branch_id', selectedBranch);
    }, [selectedBranch]);

    // Fetch products with branch-specific stock when branch changes
    useEffect(() => {
        if (selectedCompany && selectedBranch) {
            fetchProductsByBranch(selectedCompany, selectedBranch);
        }
    }, [selectedCompany, selectedBranch, userContext]);

    const fetchProductsByBranch = async (__companyId: number, branchId: number) => {
        setLoadingProducts(true);
        // Use user's company ID if available, otherwise the passed companyId
        const activeCompanyId = userContext?.company_id || __companyId;

        try {
            const response = await fetch(`/pos/api/purchases/products-by-branch?company_id=${activeCompanyId}&branch_id=${branchId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentProducts(data.products);
                console.log('Updated products with branch-specific stock:', data.products.length, 'products loaded');
            } else {
                console.error('Failed to fetch products by branch');
                // Fallback to original products
                setCurrentProducts(products);
            }
        } catch (error) {
            console.error('Error fetching products by branch:', error);
            // Fallback to original products
            setCurrentProducts(products);
        } finally {
            setLoadingProducts(false);
        }
    };

    const { data, setData, post, processing, errors } = useForm<{
        type: string;
        supplier_code: string;
        company_id: number | null;
        branch_id: number | null;
        from_section: string;
        to_section: string;
        grn_date: string;
        purchase_type: string;
        supplier_invoice_no: string;
        description: string;
        items: {
            product_id: number;
            product_name?: string;
            qty: number;
            cost_price: number;
            normal_cost: number;
            new_cost_price: number;
            discount_rate: number;
            free_qty: number;
            retail_price: number;
            wholesale_price: number;
            extra_price: number;
            cc_price: number;
            brand: string;
            model: string;
            serial_number: string;
            warranty: string;
            cus_discount_rate?: number;
        }[];
        total_amount: number;
        total_discount: number;
        total_payable: number;
        stock_location_type: 'main_stock' | 'printing_section';
    }>({
        type: type || 'supplier',
        supplier_code: '',
        company_id: null,
        branch_id: null,
        from_section: '',
        to_section: '',
        grn_date: (() => {
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        })(),
        purchase_type: 'TAX001', // Default to Tax Purchase
        supplier_invoice_no: '',
        description: '',
        items: [],
        total_amount: 0,
        total_discount: 0,
        total_payable: 0,
        stock_location_type: 'printing_section',
    });

    // Update section based on selected stock location type
    useEffect(() => {
        let targetBranch: Branch | undefined;

        if (stockLocationType === 'main_stock') {
            // Find branch marked as main stock
            targetBranch = branches.find(b => b.is_main_stock);

            // Fallback for main stock by code if flag not set
            if (!targetBranch) {
                targetBranch = branches.find(b => b.section_code === 'VIS-SEC-003');
            }
        } else if (stockLocationType === 'printing_section') {
            // Find branch marked as main stock
            targetBranch = branches.find(b => b.is_main_stock);

            // Fallback for main stock by code if flag not set
            if (!targetBranch) {
                targetBranch = branches.find(b => b.section_code === 'VIS-SEC-003');
            }
        }

        // Final fallback - if still no branch found but we have branches, take the first one
        if (!targetBranch && branches.length > 0) {
            targetBranch = branches[0];
        }

        if (targetBranch) {
            setData('from_section', targetBranch.section_code);

            // Select the branch if different
            if (selectedBranch !== targetBranch.id) {
                setSelectedBranch(targetBranch.id);
            }
        } else {
            // If no matching branch found, reset selectedBranch
            // This will trigger the validation error on submit if not resolved
            setSelectedBranch(null);
        }
    }, [stockLocationType, branches]);

    const grnNo = useMemo(() => {
        if (!user.company_code || !user.branch_code) {
            return `GRN-${String(nextPurchaseNo).padStart(6, '0')}`;
        }

        // Extract numbers from company and branch codes and format like C01BR01TAX-000006
        const companyNumber = user.company_code.replace(/[^0-9]/g, '') || '1'; // Extract "1" from "C1"
        const branchMatch = user.branch_code.match(/.*-BR0*([0-9]+)/) || user.branch_code.match(/BR0*([0-9]+)/) || user.branch_code.match(/([0-9]+)/);
        const branchNumber = branchMatch ? branchMatch[1] : '1'; // Extract "001" from "C1-BR001" or fallback

        const formattedCompany = 'C' + companyNumber.padStart(2, '0'); // "C01"
        const formattedBranch = 'BR' + branchNumber.padStart(2, '0'); // "BR01"

        const purchaseType = data.purchase_type === 'TAX001' ? 'TAX' : 'NON';
        return `${formattedCompany}${formattedBranch}${purchaseType}-${String(nextPurchaseNo).padStart(6, '0')}`;
    }, [data.purchase_type, nextPurchaseNo, user.company_code, user.branch_code]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Purchases (GRN)'), href: '/pos/purchases' },
        { title: t('New GRN Entry'), href: '#' },
    ];

    // Get available branches for selected company
    const availableBranches = useMemo(() => {
        if (!selectedCompany) return [];

        const selectedCompanyData = companies.find(c => c.id === selectedCompany);
        if (!selectedCompanyData) return [];

        return branches.filter(branch => branch.company_code === selectedCompanyData.company_code);
    }, [selectedCompany, companies, branches]);

    // Get suppliers (showing all suppliers for all sections)
    const filteredSuppliers = useMemo(() => {
        return suppliers;
    }, [suppliers]);

    // Filter brands based on selected category for printing section
    const filteredBrands = useMemo(() => {
        if (!mainStockCategory) {
            return existingBrands; // Return all brands if no category selected
        }

        // Filter brands that belong to the selected category (by category code like CAT002)
        const brandsInCategory = existingBrands.filter(brand =>
            brand.category_code === mainStockCategory
        );

        return brandsInCategory;
    }, [mainStockCategory, existingBrands]);

    // Clear brand selection if it's not in the filtered brands
    useEffect(() => {
        if (mainStockBrand && !filteredBrands.some(b => b.name === mainStockBrand)) {
            setMainStockBrand('');
        }
    }, [mainStockCategory, filteredBrands, mainStockBrand]);

    // Calculate totals whenever items or additional discount change
    useEffect(() => {
        const grossAmount = items.reduce((sum, item) => sum + (item.qty * item.cost_price), 0);
        const itemDiscountsTotal = items.reduce(
            (sum, item) => sum + item.item_discount,
            0,
        );
        const totalDiscount = itemDiscountsTotal + additionalDiscount;
        const totalPayable = grossAmount - totalDiscount;

        setData((data) => ({
            ...data,
            items: items.map((item) => ({
                product_id: item.product_id,
                product_name: item.product_name || '', // Include product_name for new items
                qty: item.qty,
                cost_price: item.cost_price,
                normal_cost: item.normal_cost,
                new_cost_price: item.new_cost_price,
                discount_rate: item.discount_rate,
                free_qty: item.free_qty,
                retail_price: item.retail_price,
                wholesale_price: item.wholesale_price,
                extra_price: item.extra_price,
                cc_price: item.cc_price,
                brand: item.brand || '',
                model: item.model || '',
                serial_number: item.serial_number || '',
                warranty: item.warranty || '',
                category: item.category || '',
                cus_discount_rate: item.cus_discount_rate,
            })),
            total_amount: grossAmount,
            total_discount: totalDiscount,
            total_payable: totalPayable,
        }));
    }, [items, additionalDiscount]);

    const handleSupplierChange = (suppCode: string) => {
        const supplier = filteredSuppliers.find((s) => s.code === suppCode);
        setSelectedSupplier(supplier || null);
        setData('supplier_code', suppCode);
    };

    const openItemModal = (index: number, productId: number) => {
        // Check if we're editing an existing item or creating a new one
        const existingItem = items[index];

        if (existingItem) {
            // Editing existing item - use its data including brand, model, serial_number
            setModalItem({ ...existingItem });
            setEditingItemIndex(index);
            setIsItemModalOpen(true);
        } else {
            // Creating new item from product
            const product = currentProducts.find((p) => p.id === productId);
            if (product) {
                const itemData: PurchaseItem = {
                    product_id: product.id,
                    product_code: product.code,
                    product_name: product.name,
                    qty: 1,
                    cost_price: product.cost_price,
                    normal_cost: product.normal_cost,
                    new_cost_price: product.cost_price,
                    discount_rate: 0,
                    free_qty: 0,
                    retail_price: product.retail_price,
                    wholesale_price: product.wholesale_price,
                    extra_price: product.extra_price,
                    cc_price: product.cc_price,
                    item_discount: 0,
                    amount: product.cost_price * 1, // qty * cost_price
                    brand: product.brand || '',
                    model: product.model || '',
                    serial_number: product.serial_number || '',
                    warranty: '',
                    cus_discount_rate: 0,
                };
                setModalItem(itemData);
                setEditingItemIndex(index);
                setIsItemModalOpen(true);
            }
        }
    };

    const confirmAddItem = () => {
        if (modalItem) {
            // Validate Main Stock required fields
            if (stockLocationType === 'main_stock') {
                // Only require Category, Brand, and Item Name for new items (product_id === 0)
                if (modalItem.product_id === 0 && (!mainStockCategory || !mainStockBrand || !mainStockItemName)) {
                    alert('Please fill in Category, Brand, and Item Name');
                    return;
                }
                if (modalItem.qty <= 0 || modalItem.cost_price <= 0 || modalItem.retail_price <= 0) {
                    alert('Please fill in Quantity, Cost Price, and Sales Price for Main Stock items');
                    return;
                }
                // Only require Serial Number for new items (product_id === 0)
                if (modalItem.product_id === 0 && !modalItem.serial_number) {
                    alert('Please fill in Serial Number for Main Stock items');
                    return;
                }

                // Update modal item with main stock specific data only for new items
                if (modalItem.product_id === 0) {
                    modalItem.product_name = mainStockItemName;
                    modalItem.brand = mainStockBrand;
                    modalItem.category = mainStockCategory;
                    modalItem.product_code = `MS-${mainStockCategory}-${Date.now()}`;
                }
            }

            // Validate Printing Section required fields
            if (stockLocationType === 'printing_section') {
                // Only require Category, Brand, and Item Name for new items (product_id === 0)
                if (modalItem.product_id === 0 && (!mainStockCategory || !mainStockBrand || !mainStockItemName)) {
                    alert('Please fill in Category, Brand, and Item Name');
                    return;
                }
                if (modalItem.qty <= 0 || modalItem.cost_price <= 0 || modalItem.retail_price <= 0) {
                    alert('Please fill in Quantity, Cost Price, and Sales Price for Printing Section items');
                    return;
                }
                // Only require Serial Number for new items (product_id === 0)
                if (modalItem.product_id === 0 && !modalItem.serial_number) {
                    alert('Please fill in Serial Number for Printing Section items');
                    return;
                }

                // Update modal item with printing section specific data only for new items
                if (modalItem.product_id === 0) {
                    modalItem.product_name = mainStockItemName;
                    modalItem.brand = mainStockBrand;
                    modalItem.category = mainStockCategory;
                    modalItem.product_code = `PS-${mainStockCategory}-${Date.now()}`;
                }
            }

            // Calculate amount and item_discount before adding/updating
            const itemDiscount = (modalItem.cost_price * modalItem.qty * modalItem.discount_rate) / 100;
            modalItem.item_discount = itemDiscount;
            modalItem.amount = modalItem.cost_price * modalItem.qty - itemDiscount;

            // Calculate new_cost_price with discount applied
            const totalQty = modalItem.qty + modalItem.free_qty;
            const discountedCost = modalItem.cost_price - (modalItem.cost_price * modalItem.discount_rate / 100);
            modalItem.new_cost_price = totalQty > 0 ? (discountedCost * modalItem.qty) / totalQty : discountedCost;

            if (editingItemIndex !== null) {
                // Editing existing item
                const updatedItems = [...items];
                updatedItems[editingItemIndex] = modalItem;
                setItems(updatedItems);
            } else {
                // Adding new item from modal
                setItems([...items, modalItem]);
            }
        }
        setIsItemModalOpen(false);
        setModalItem(null);
        setEditingItemIndex(null);

        // Keep form data for repeat entries in both stock types
        // Only clear serial number in the next modal by resetting it in the new item
        // Don't clear mainStockCategory, mainStockBrand, mainStockItemName to enable repeat entries
    };

    const cancelAddItem = () => {
        setIsItemModalOpen(false);
        setModalItem(null);
        setEditingItemIndex(null);

        // Only clear form data if no items have been added yet
        if (items.length === 0) {
            setMainStockCategory('');
            setMainStockBrand('');
            setMainStockItemName('');
        }
    };

    const addItem = () => {
        // Create empty modal item for new entry
        const newItem: PurchaseItem = {
            product_id: 0,
            product_code: '',
            product_name: '',
            qty: 1,
            cost_price: 0,
            normal_cost: 0,
            new_cost_price: 0,
            discount_rate: 0,
            free_qty: 0,
            retail_price: 0,
            wholesale_price: 0,
            extra_price: 0,
            cc_price: 0,
            item_discount: 0,
            amount: 0,
            brand: '',
            model: '',
            serial_number: '',
            warranty: '',
            category: mainStockCategory,
            remark: '',
            cus_discount_rate: 0,
        };

        // For main stock, if we have previous data, pre-fill the modal with the same details
        // but clear only the serial number for next entry
        if (stockLocationType === 'main_stock' && items.length > 0 && mainStockCategory && mainStockBrand && mainStockItemName) {
            const lastItem = items[items.length - 1];
            newItem.qty = lastItem.qty;
            newItem.cost_price = lastItem.cost_price;
            newItem.normal_cost = lastItem.normal_cost;
            newItem.new_cost_price = lastItem.new_cost_price;
            newItem.discount_rate = lastItem.discount_rate;
            newItem.free_qty = lastItem.free_qty;
            newItem.retail_price = lastItem.retail_price;
            newItem.wholesale_price = lastItem.wholesale_price;
            newItem.extra_price = lastItem.extra_price;
            newItem.cc_price = lastItem.cc_price;
            newItem.brand = lastItem.brand;
            newItem.model = lastItem.model;
            newItem.warranty = lastItem.warranty;
            newItem.barcode = lastItem.barcode;
            newItem.remark = lastItem.remark || '';
            // Calculate item_discount and amount based on the last item's values
            newItem.item_discount = (lastItem.cost_price * lastItem.qty * lastItem.discount_rate) / 100;
            newItem.amount = lastItem.cost_price * lastItem.qty - newItem.item_discount;
            newItem.cus_discount_rate = lastItem.cus_discount_rate;
            // Keep serial_number empty for new entry
            newItem.serial_number = '';
        }

        // For printing section, if we have previous data, pre-fill the modal with the same details
        // but clear only the serial number for next entry
        if (stockLocationType === 'printing_section' && items.length > 0 && mainStockCategory && mainStockBrand && mainStockItemName) {
            const lastItem = items[items.length - 1];
            newItem.qty = lastItem.qty;
            newItem.cost_price = lastItem.cost_price;
            newItem.retail_price = lastItem.retail_price;
            newItem.discount_rate = lastItem.discount_rate;
            newItem.model = lastItem.model;
            newItem.warranty = lastItem.warranty;
            newItem.barcode = lastItem.barcode;
            newItem.category = lastItem.category;
            newItem.category = lastItem.category;
            newItem.remark = lastItem.remark || '';
            newItem.cus_discount_rate = lastItem.cus_discount_rate;
            // Calculate amount for printing section
            newItem.amount = lastItem.cost_price * lastItem.qty;
            // Keep serial_number empty for new entry
            newItem.serial_number = '';
        }

        setModalItem(newItem);
        setEditingItemIndex(null);
        setItemSearchQuery('');
        setSelectedCategory('ALL_CATEGORIES');

        // Reset form fields only if this is the very first item for the respective stock type
        if (items.length === 0) {
            setMainStockCategory('');
            setMainStockBrand('');
            setMainStockItemName('');
        }

        setIsItemModalOpen(true);
    };

    // Filter products based on search query and category
    useEffect(() => {
        if (itemSearchQuery.trim() === '' && selectedCategory === 'ALL_CATEGORIES') {
            setFilteredProducts([]); // Show empty when no search and all categories
        } else {
            let filtered = currentProducts;

            // Apply search filter
            if (itemSearchQuery.trim() !== '') {
                const searchLower = itemSearchQuery.toLowerCase();
                filtered = filtered.filter((product) =>
                    product.code.toLowerCase().includes(searchLower) ||
                    product.name.toLowerCase().includes(searchLower) ||
                    (product.english_name && product.english_name.toLowerCase().includes(searchLower)) ||
                    (product.barcode && product.barcode.toLowerCase().includes(searchLower))
                );
            }

            // Apply category filter
            if (selectedCategory !== 'ALL_CATEGORIES') {
                filtered = filtered.filter((product) =>
                    product.category_id === selectedCategory
                );
            }

            // Limit to 50 results for performance
            setFilteredProducts(filtered.slice(0, 50));
        }
        setSelectedItemIndex(-1); // Reset selection when search changes
    }, [currentProducts, itemSearchQuery, selectedCategory]);

    // Keyboard navigation for item selection
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isItemSelectionModalOpen || filteredProducts.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedItemIndex(prev =>
                    prev < filteredProducts.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedItemIndex(prev =>
                    prev > 0 ? prev - 1 : filteredProducts.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedItemIndex >= 0 && selectedItemIndex < filteredProducts.length) {
                    selectItem(filteredProducts[selectedItemIndex]);
                }
                break;
            case 'Escape':
                setIsItemSelectionModalOpen(false);
                break;
        }
    };

    const selectItem = (product: Product) => {
        const newItem: PurchaseItem = {
            product_id: product.id,
            product_code: product.code,
            product_name: product.name,
            qty: 1,
            cost_price: product.cost_price,
            normal_cost: product.normal_cost,
            new_cost_price: product.cost_price,
            discount_rate: 0,
            free_qty: 0,
            retail_price: product.retail_price,
            wholesale_price: product.wholesale_price,
            extra_price: product.extra_price,
            cc_price: product.cc_price,
            item_discount: 0,
            amount: product.cost_price * 1, // qty * cost_price
            brand: product.brand || '',
            model: product.model || '',
            serial_number: product.serial_number || '',
            warranty: '',
            category: product.category_name,
            cus_discount_rate: 0,
        };
        setModalItem(newItem);
        setIsItemSelectionModalOpen(false);
        setIsItemModalOpen(true);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
        setOpenRowIndex(null);
    };

    const updateItem = (
        index: number,
        field: keyof PurchaseItem,
        value: string | number,
    ) => {
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        // If product changed, update all product fields
        if (field === 'product_id') {
            const product = currentProducts.find((p) => p.id === value);
            if (product) {
                updatedItems[index].product_code = product.code;
                updatedItems[index].product_name = product.name;
                updatedItems[index].cost_price = product.cost_price;
                updatedItems[index].normal_cost = product.normal_cost;
                updatedItems[index].new_cost_price = product.cost_price; // Initialize with cost_price
                updatedItems[index].retail_price = product.retail_price;
                updatedItems[index].wholesale_price = product.wholesale_price;
                updatedItems[index].extra_price = product.extra_price;
                updatedItems[index].cc_price = product.cc_price;
            }
        }

        // Recalculate discount and amount
        const item = updatedItems[index];
        const itemDiscount =
            (item.cost_price * item.qty * item.discount_rate) / 100;
        const amount = item.cost_price * item.qty - itemDiscount;

        updatedItems[index].item_discount = itemDiscount;
        updatedItems[index].amount = amount;

        // Recalculate new_cost_price if relevant fields changed
        if (['qty', 'free_qty', 'cost_price', 'discount_rate'].includes(field)) {
            const totalQty = item.qty + item.free_qty;
            const discountedCost = item.cost_price - (item.cost_price * item.discount_rate / 100);
            updatedItems[index].new_cost_price =
                totalQty > 0 ? (discountedCost * item.qty) / totalQty : discountedCost;
        }

        setItems(updatedItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (submitted) return; // Prevent double submission

        setSubmitted(true);

        // Validate company and branch selection
        if (!selectedCompany) {
            alert(t('Please select a company'));
            setSubmitted(false);
            return;
        }

        if (!selectedBranch) {
            alert(t('Please select a branch'));
            setSubmitted(false);
            return;
        }

        // Filter out empty items
        // For both main_stock and printing_section, product_id can be 0 (allows creating new items)
        const validItems = items.filter((item) => {
            if (stockLocationType === 'main_stock' || stockLocationType === 'printing_section') return true;
            return item.product_id > 0;
        });

        // Check if there are any valid items
        if (validItems.length === 0) {
            alert(t('Please add at least one item to the GRN'));
            setSubmitted(false); // Reset if validation fails
            return;
        }

        // Temporarily update data with only valid items for submission
        const formData = {
            ...data,
            items: validItems.map((item) => ({
                product_id: item.product_id,
                product_name: item.product_name,
                qty: item.qty,
                cost_price: item.cost_price,
                normal_cost: item.normal_cost,
                new_cost_price: item.new_cost_price,
                discount_rate: item.discount_rate,
                free_qty: item.free_qty,
                retail_price: item.retail_price,
                wholesale_price: item.wholesale_price,
                extra_price: item.extra_price,
                cc_price: item.cc_price,
                brand: item.brand,
                model: item.model,
                serial_number: item.serial_number,
                warranty: item.warranty,
                barcode: item.barcode,
                remark: item.remark,
                cus_discount_rate: item.cus_discount_rate,
            })),
        };

        // Submit with valid items only
        router.post('/pos/purchases', formData, {
            onSuccess: () => {
                router.visit('/pos/purchases');
            },
            onError: () => {
                setSubmitted(false); // Reset on error
            },
        });
    };

    // Global keyboard shortcuts handler
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Handle F2 key for adding items
            if (e.key === 'F2') {
                e.preventDefault();
                addItem();
                return;
            }

            // Handle Ctrl+A (or Cmd+A on Mac) for adding items
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                addItem();
                return;
            }

            // Handle F3 key in item details modal to confirm adding item
            if (e.key === 'F3' && isItemModalOpen) {
                e.preventDefault();
                confirmAddItem();
                return;
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [isItemModalOpen]);

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('New GRN Entry')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <Link
                                    href="/pos/purchases"
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <PackagePlus className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('New GRN Entry')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Create a new Goods Received Note (GRN)')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                            {/* Purchase Header */}
                            <GrnDetails
                                grnNo={grnNo}
                                grnDate={data.grn_date}
                                onDateChange={(date: string) => setData('grn_date', date)}
                                datePickerOpen={datePickerOpen}
                                onDatePickerToggle={setDatePickerOpen}
                                errors={errors}
                            />

                            {/* Company, Branch, and Supplier Selectors */}
                            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                                <CompanyBranchSelector
                                    companies={companies}
                                    selectedCompany={selectedCompany}
                                    onCompanyChange={setSelectedCompany}
                                    branches={availableBranches}
                                    selectedBranch={selectedBranch}
                                    onBranchChange={setSelectedBranch}
                                    userContext={userContext}
                                />
                                <SupplierSelector
                                    suppliers={filteredSuppliers}
                                    selectedSupplier={selectedSupplier}
                                    onSupplierChange={handleSupplierChange}
                                    supplierCode={data.supplier_code}
                                    supplierInvoiceNo={data.supplier_invoice_no}
                                    description={data.description}
                                    onInvoiceNoChange={(value) => setData('supplier_invoice_no', value)}
                                    onDescriptionChange={(value) => setData('description', value)}
                                    errors={{ supplier_code: errors.supplier_code }}
                                />
                            </div>

                            {/* Stock Location Selector */}
                            <div className="mt-6">
                                <StockLocationSelector
                                    stockLocationType={stockLocationType}
                                    onStockLocationChange={setStockLocationType}
                                />
                            </div>

                            {/* Items Table */}
                            <div className="mt-6">
                                <ItemsTable
                                    items={items}
                                    onAddItem={addItem}
                                    onEditItem={(item: PurchaseItem, index: number) => openItemModal(index, item.product_id)}
                                    onRemoveItem={removeItem}
                                    stockLocationType={stockLocationType}
                                    openRowIndex={openRowIndex}
                                    onRowOpenChange={setOpenRowIndex}
                                    currentProducts={currentProducts}
                                    searchTerms={searchTerms}
                                    onProductChange={() => {}}
                                    onSearchTermChange={() => {}}
                                    errors={errors}
                                />
                            </div>

                            {/* Totals Section */}
                            <div className="mt-6">
                                <PurchaseTotals
                                    items={items}
                                    totalAmount={data.total_amount}
                                    totalDiscount={data.total_discount}
                                    totalPayable={data.total_payable}
                                    additionalDiscount={additionalDiscount}
                                    onAdditionalDiscountChange={setAdditionalDiscount}
                                    processing={processing}
                                    submitted={submitted}
                                />
                            </div>

                            {/* Description */}
                            <div className="mt-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    {t('Description')}
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-vismass-blue focus:ring-vismass-blue sm:text-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4">
                            <Link
                                href="/pos/purchases"
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
                            >
                                {t('Cancel')}
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || submitted}
                                className="inline-flex items-center rounded-lg border border-transparent bg-vismass-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-vismass-blue/90 focus:outline-none focus:ring-2 focus:ring-vismass-blue focus:ring-offset-2 disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? t('Saving...') : t('Save GRN')}
                            </button>
                        </div>
                    </form>
                </main>
            </div>

            {/* Item Details Modal */}
            {isItemModalOpen && modalItem && (
                <ItemDetailsModal
                    isOpen={isItemModalOpen}
                    onClose={cancelAddItem}
                    stockLocationType={stockLocationType}
                    modalItem={modalItem}
                    editingItemIndex={editingItemIndex}
                    items={items}
                    categories={categories}
                    existingBrands={existingBrands}
                    mainStockCategory={mainStockCategory}
                    mainStockBrand={mainStockBrand}
                    mainStockItemName={mainStockItemName}
                    onMainStockCategoryChange={setMainStockCategory}
                    onMainStockBrandChange={setMainStockBrand}
                    onMainStockItemNameChange={setMainStockItemName}
                    onModalItemChange={setModalItem}
                    onConfirm={confirmAddItem}
                    onCancel={cancelAddItem}
                    itemSearchQuery={itemSearchQuery}
                    onItemSearchChange={setItemSearchQuery}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    filteredProducts={filteredProducts}
                    onSelectProduct={selectItem}
                    currentProducts={currentProducts}
                />
            )}

            {/* Item Selection Modal */}
            {isItemSelectionModalOpen && (
                <ItemSelectionModal
                    isOpen={isItemSelectionModalOpen}
                    onClose={() => setIsItemSelectionModalOpen(false)}
                    filteredProducts={filteredProducts}
                    itemSearchQuery={itemSearchQuery}
                    selectedCategory={selectedCategory}
                    categories={categories}
                    selectedItemIndex={selectedItemIndex}
                    onSearchChange={setItemSearchQuery}
                    onCategoryChange={setSelectedCategory}
                    onClearFilters={() => {
                        setItemSearchQuery('');
                        setSelectedCategory('ALL_CATEGORIES');
                    }}
                    onSelectItem={selectItem}
                />
            )}
        </AppSidebarLayout>
    );
}