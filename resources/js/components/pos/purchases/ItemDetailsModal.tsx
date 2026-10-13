import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as Dialog from '@radix-ui/react-dialog';
import { t } from '@/lib/i18n';
import { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';

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
    name: string;
}

interface Brand {
    id: number;
    name: string;
    category_id?: number;
    category_code?: string;
    models: string[];
}

interface ItemDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockLocationType: 'main_stock' | 'printing_section';
    modalItem: PurchaseItem | null;
    editingItemIndex: number | null;
    items: PurchaseItem[];
    categories: Category[];
    existingBrands: Brand[];
    mainStockCategory: string;
    mainStockBrand: string;
    mainStockItemName: string;
    onMainStockCategoryChange: (value: string) => void;
    onMainStockBrandChange: (value: string) => void;
    onMainStockItemNameChange: (value: string) => void;
    onModalItemChange: (item: PurchaseItem) => void;
    onConfirm: () => void;
    onCancel: () => void;
    itemSearchQuery: string;
    onItemSearchChange: (query: string) => void;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    filteredProducts: Product[];
    onSelectProduct: (product: Product) => void;
    currentProducts: Product[];
}

export default function ItemDetailsModal({
    isOpen,
    onClose,
    stockLocationType,
    modalItem,
    editingItemIndex,
    items,
    categories,
    existingBrands,
    mainStockCategory,
    mainStockBrand,
    mainStockItemName,
    onMainStockCategoryChange,
    onMainStockBrandChange,
    onMainStockItemNameChange,
    onModalItemChange,
    onConfirm,
    onCancel,
    itemSearchQuery,
    onItemSearchChange,
    selectedCategory,
    onCategoryChange,
    filteredProducts,
    onSelectProduct,
    currentProducts,
}: ItemDetailsModalProps) {
    const [barcodeSearching, setBarcodeSearching] = useState(false);
    const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [barcodeMessage, setBarcodeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [activeValue, setActiveValue] = useState<string>('');

    // Reset model when brand changes
    useEffect(() => {
        if (modalItem && mainStockBrand) {
            const modelsForBrand = getModelsForSelectedBrand();
            if (modalItem.model && !modelsForBrand.includes(modalItem.model)) {
                onModalItemChange({ ...modalItem, model: '' });
            }
        }
    }, [mainStockBrand]);

    if (!modalItem) return null;

    // Get models for the selected brand
    const getModelsForSelectedBrand = () => {
        if (!mainStockBrand) return [];
        const selectedBrand = existingBrands.find(brand => brand.name === mainStockBrand);
        return selectedBrand?.models || [];
    };

    const availableModels = getModelsForSelectedBrand();

    // Function to search product by barcode
    const searchByBarcode = async (barcode: string) => {
        if (!barcode || barcode.trim() === '') {
            setBarcodeMessage(null);
            return;
        }

        setBarcodeSearching(true);
        setBarcodeMessage({ type: 'info', text: 'Searching for product...' });

        try {
            // Get company_id from the page context (you'll need to pass this as prop)
            const urlParams = new URLSearchParams(window.location.search);
            const companyElement = document.querySelector('[data-company-id]');
            const companyId = companyElement?.getAttribute('data-company-id') || '1';

            const response = await fetch(`/pos/api/purchases/search-barcode?barcode=${encodeURIComponent(barcode)}&company_id=${companyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();

                if (data.found) {
                    // Product exists - populate form with existing data
                    const product = data.product;

                    console.log('🔍 Barcode Search Results:', {
                        category_id: product.category_id,
                        brand: product.brand,
                        model: product.model,
                        name: product.name
                    });

                    // Prepare values
                    const categoryIdStr = product.category_id ? String(product.category_id) : '';
                    const brandStr = product.brand || '';
                    const modelStr = product.model || '';
                    const nameStr = product.name || '';

                    console.log('📝 Prepared values:', {
                        categoryIdStr,
                        brandStr,
                        modelStr,
                        nameStr,
                        currentMainStockCategory: mainStockCategory,
                        currentMainStockBrand: mainStockBrand
                    });

                    // Verify category exists in the list
                    const categoryExists = categoryIdStr && categories.some(cat => String(cat.id) === categoryIdStr);
                    console.log('✅ Category exists:', categoryExists, 'Available categories:', categories.map(c => c.id));

                    // Update modal item first with all data
                    onModalItemChange({
                        ...modalItem,
                        product_id: product.id,
                        product_code: product.code,
                        product_name: product.name,
                        barcode: product.barcode,
                        cost_price: product.cost_price,
                        normal_cost: product.normal_cost,
                        retail_price: product.retail_price,
                        wholesale_price: product.wholesale_price,
                        extra_price: product.extra_price,
                        cc_price: product.cc_price,
                        brand: brandStr,
                        model: modelStr,
                        warranty: product.warranty || '',
                        category: categoryIdStr,
                    });

                    // Then update form fields with a small delay to ensure state is ready
                    setTimeout(() => {
                        if (categoryExists) {
                            console.log('🎯 Setting category:', categoryIdStr);
                            onMainStockCategoryChange(categoryIdStr);
                        }
                        if (brandStr) {
                            console.log('🎯 Setting brand:', brandStr);
                            onMainStockBrandChange(brandStr);
                        }
                        if (nameStr) {
                            console.log('🎯 Setting item name:', nameStr);
                            onMainStockItemNameChange(nameStr);
                        }
                    }, 100);

                    setBarcodeMessage({ type: 'success', text: data.message });
                } else {
                    // Product not found - allow creating new
                    setBarcodeMessage({ type: 'info', text: data.message });
                }
            } else {
                setBarcodeMessage({ type: 'error', text: 'Failed to search barcode. Please try again.' });
            }
        } catch (error) {
            console.error('Barcode search error:', error);
            setBarcodeMessage({ type: 'error', text: 'Error searching barcode. Please check your connection.' });
        } finally {
            setBarcodeSearching(false);
        }
    };

    // Handle barcode change with debounced search
    const handleBarcodeChange = (barcode: string) => {
        onModalItemChange({ ...modalItem, barcode });
        setBarcodeMessage(null);

        // Clear existing timeout
        if (barcodeTimeoutRef.current) {
            clearTimeout(barcodeTimeoutRef.current);
        }

        // Set new timeout for auto-search
        if (barcode && barcode.trim() !== '') {
            barcodeTimeoutRef.current = setTimeout(() => {
                searchByBarcode(barcode);
            }, 800); // 800ms delay to allow for typing/scanning
        }
    };

    // Handle barcode blur - trigger search
    const handleBarcodeBlur = () => {
        if (modalItem.barcode) {
            searchByBarcode(modalItem.barcode);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white shadow-xl">
                    <div className="p-6">
                        <Dialog.Title className="mb-4 text-xl font-bold text-gray-900">
                            {stockLocationType === 'main_stock' ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                                    <span>
                                        Main Stock Item
                                        {items.length > 0 && mainStockCategory && mainStockBrand && mainStockItemName
                                            ? ` - Adding #${items.length + 1}`
                                            : modalItem?.product_name ? ` - ${modalItem.product_name}` : ''
                                        }
                                    </span>
                                    {items.length > 0 && mainStockCategory && mainStockBrand && mainStockItemName && (
                                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                            Repeat Entry
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                    <span>
                                        Printing Item
                                        {items.length > 0 && mainStockCategory && mainStockBrand && mainStockItemName
                                            ? ` - Adding #${items.length + 1}`
                                            : modalItem?.product_name ? ` - ${modalItem.product_name}` : ''
                                        }
                                    </span>
                                    {items.length > 0 && mainStockCategory && mainStockBrand && mainStockItemName && (
                                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                            Repeat Entry
                                        </span>
                                    )}
                                </div>
                            )}
                        </Dialog.Title>

                        <Dialog.Description className="mb-6 text-sm text-gray-600">
                            {stockLocationType === 'main_stock'
                                ? items.length > 0 && mainStockCategory && mainStockBrand && mainStockItemName
                                    ? t('Adding another item with same details. Only change the serial number if needed.')
                                    : t('Select a product and enter quantity and pricing details.')
                                : items.length > 0 && mainStockCategory && mainStockBrand && mainStockItemName
                                    ? t('Adding another item with same details. Only change the serial number if needed.')
                                    : t('Enter item details for Printing Section inventory.')}
                        </Dialog.Description>

                        <div className="space-y-6">
                            {/* Printing Item Form */}
                            {stockLocationType === 'printing_section' ? (
                                <div className="space-y-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl shadow-md">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                        <h4 className="font-bold text-lg text-amber-900">Printing Item Details</h4>
                                    </div>

                                    {/* Item Details Section */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        {/* Serial Number */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Serial Number </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter serial number"
                                                value={modalItem.serial_number}
                                                onChange={(e) => onModalItemChange({ ...modalItem, serial_number: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Category Selection */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">
                                                Category
                                                {mainStockCategory && <span className="text-xs text-blue-600 ml-2">(ID: {mainStockCategory})</span>}
                                            </Label>
                                            <Select key={`category-${mainStockCategory || 'empty'}`} value={mainStockCategory} onValueChange={onMainStockCategoryChange}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            {category.name} (ID: {category.id})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Brand Selection */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Brand </Label>
                                            <Select key={`brand-${mainStockBrand || 'empty'}`} value={mainStockBrand} onValueChange={onMainStockBrandChange}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select/Enter Brand" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {existingBrands.length === 0 ? (
                                                        <div className="px-2 py-1 text-sm text-gray-500">
                                                            {mainStockCategory ? 'No brands available for selected category' : 'Select a category first'}
                                                        </div>
                                                    ) : (
                                                        existingBrands.map((brand) => (
                                                            <SelectItem key={brand.id} value={brand.name}>
                                                                {brand.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Item Name */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Item Name </Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter item name"
                                                value={mainStockItemName}
                                                onChange={(e) => onMainStockItemNameChange(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">
                                                Model
                                                {availableModels.length > 0 && (
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({availableModels.length} available)
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                type="text"
                                                list="model-suggestions"
                                                placeholder={mainStockBrand ? "Type or select model" : "Select brand first"}
                                                value={modalItem.model}
                                                onChange={(e) => onModalItemChange({ ...modalItem, model: e.target.value })}
                                                disabled={!mainStockBrand}
                                                className="mt-1"
                                            />
                                            {availableModels.length > 0 && (
                                                <datalist id="model-suggestions">
                                                    {availableModels.map((model) => (
                                                        <option key={model} value={model} />
                                                    ))}
                                                </datalist>
                                            )}
                                            {mainStockBrand && availableModels.length === 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    No existing models. Type to create new.
                                                </p>
                                            )}
                                        </div>

                                        {/* Warranty */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Warranty (Months)</Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter warranty period"
                                                value={modalItem.warranty}
                                                onChange={(e) => onModalItemChange({ ...modalItem, warranty: e.target.value })}
                                                onBlur={(e) => {
                                                    // Automatically append "Months" if user types just a number
                                                    const val = e.target.value.trim();
                                                    if (/^\d+$/.test(val)) {
                                                        onModalItemChange({ ...modalItem, warranty: `${val} Months` });
                                                    }
                                                }}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Pricing Section */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        {/* Cost Price */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Cost Price </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={modalItem.cost_price}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onChange={(e) => {
                                                    const newCostPrice = parseFloat(e.target.value) || 0;
                                                    onModalItemChange({
                                                        ...modalItem,
                                                        cost_price: newCostPrice,
                                                        amount: newCostPrice * modalItem.qty,
                                                    });
                                                }}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Sales Price */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Sales Price </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={modalItem.retail_price}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onChange={(e) => onModalItemChange({ ...modalItem, retail_price: parseFloat(e.target.value) || 0 })}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Cus Discount Rate */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Cus Discount Rate (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={modalItem.cus_discount_rate || ''}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onChange={(e) => onModalItemChange({ ...modalItem, cus_discount_rate: parseFloat(e.target.value) || 0 })}
                                                className="mt-1"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Discount and Free Quantity and Remark Section */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        {/* Discount Rate */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Discount Rate (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={modalItem.discount_rate}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onChange={(e) => {
                                                    const newDiscountRate = parseFloat(e.target.value) || 0;
                                                    const itemDiscount = (modalItem.cost_price * modalItem.qty * newDiscountRate) / 100;
                                                    // Calculate discounted cost first, then average if there are free quantities
                                                    const totalQty = modalItem.qty + modalItem.free_qty;
                                                    const discountedCost = modalItem.cost_price - (modalItem.cost_price * newDiscountRate / 100);
                                                    const newCostPrice = totalQty > 0 ? (discountedCost * modalItem.qty) / totalQty : discountedCost;
                                                    onModalItemChange({
                                                        ...modalItem,
                                                        discount_rate: newDiscountRate,
                                                        item_discount: itemDiscount,
                                                        amount: modalItem.cost_price * modalItem.qty - itemDiscount,
                                                        new_cost_price: newCostPrice,
                                                    });
                                                }}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Free Quantity */}
                                        {/* <div>
                                            <Label className="text-sm font-medium text-gray-700">
                                                Free Quantity
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={modalItem.free_qty}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onChange={(e) => {
                                                    const newFreeQty = parseFloat(e.target.value) || 0;
                                                    const totalQty = modalItem.qty + newFreeQty;

                                                    const discountedCost = modalItem.cost_price - (modalItem.cost_price * modalItem.discount_rate / 100);
                                                    const newCostPrice = totalQty > 0 ? (discountedCost * modalItem.qty) / totalQty : discountedCost;

                                                    onModalItemChange({
                                                        ...modalItem,
                                                        free_qty: newFreeQty,
                                                        new_cost_price: newCostPrice,
                                                    });
                                                }}
                                                className="mt-1"
                                            />
                                        </div> */}

                                        {/* Remark */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">Remark</Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter remark (optional)"
                                                value={modalItem.remark || ''}
                                                onChange={(e) => onModalItemChange({ ...modalItem, remark: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <>
                                    {/* Main Stock - Product Search Section - Only show if no product selected */}
                                    {modalItem.product_id === 0 && (
                                        <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                                            <Label className="text-base font-semibold mb-3 block">Search & Select Product</Label>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex-1">
                                                    <Input
                                                        type="text"
                                                        placeholder={t('Search by product code, name, or barcode...')}
                                                        value={itemSearchQuery}
                                                        onChange={(e) => onItemSearchChange(e.target.value)}
                                                        className="w-full text-base p-3"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                                        {t('Category')}:
                                                    </Label>
                                                    <Select
                                                        value={selectedCategory}
                                                        onValueChange={onCategoryChange}
                                                    >
                                                        <SelectTrigger className="w-40">
                                                            <SelectValue placeholder={t('All')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ALL_CATEGORIES">All Categories</SelectItem>
                                                            {categories.map((category) => (
                                                                <SelectItem key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Product List */}
                                            <div className="max-h-60 overflow-y-auto">
                                                {filteredProducts.length === 0 ? (
                                                    <div className="text-center py-4 text-gray-500 text-sm">
                                                        {itemSearchQuery.trim() === '' ? 'Start typing to search for products...' : 'No products found'}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {filteredProducts.map((product) => (
                                                            <div
                                                                key={product.id}
                                                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                                                                onClick={() => onSelectProduct(product)}
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-gray-900 text-sm">
                                                                        {product.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600">
                                                                        Code: {product.code} {product.barcode && `| Barcode: ${product.barcode}`}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Stock: {product.current_stock} | Cost: Rs. {Math.round(product.cost_price)}
                                                                    </div>
                                                                </div>
                                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                                    Select
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Item Info - Only show if product selected */}
                            {modalItem.product_id > 0 && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Item Code
                                        </Label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {modalItem.product_code}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Item Name
                                        </Label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {modalItem.product_name}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Current Stock
                                        </Label>
                                        <p className="text-lg font-semibold text-blue-600">
                                            {(() => {
                                                const product = currentProducts.find(
                                                    (p) => p.id === modalItem.product_id,
                                                );
                                                return product ? Math.round(product.current_stock) : '0';
                                            })()}
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Editable Fields - Only show if product selected */}
                            {modalItem.product_id > 0 && (
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Quantity
                                        </Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={activeField === 'qty' ? activeValue : modalItem.qty}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('qty');
                                                setActiveValue(modalItem.qty.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                const newQty = parseFloat(val) || 0;
                                                const totalQty = newQty + modalItem.free_qty;

                                                // Calculate calculations with newQty
                                                const itemDiscount = (modalItem.cost_price * newQty * modalItem.discount_rate) / 100;
                                                const discountedCost = modalItem.cost_price - (modalItem.cost_price * modalItem.discount_rate / 100);
                                                const newCostPrice = totalQty > 0 ? (discountedCost * newQty) / totalQty : discountedCost;

                                                onModalItemChange({
                                                    ...modalItem,
                                                    qty: newQty,
                                                    item_discount: itemDiscount,
                                                    amount: modalItem.cost_price * newQty - itemDiscount,
                                                    new_cost_price: newCostPrice,
                                                });
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'F3') {
                                                    e.preventDefault();
                                                    onConfirm();
                                                }
                                            }}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Cost Price
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={activeField === 'cost_price' ? activeValue : modalItem.cost_price.toFixed(2)}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('cost_price');
                                                setActiveValue(modalItem.cost_price.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                const newCostPrice = parseFloat(val) || 0;
                                                const totalQty = modalItem.qty + modalItem.free_qty;

                                                const itemDiscount = (newCostPrice * modalItem.qty * modalItem.discount_rate) / 100;
                                                const discountedCost = newCostPrice - (newCostPrice * modalItem.discount_rate / 100);
                                                const calculatedNewCostPrice = totalQty > 0 ? (discountedCost * modalItem.qty) / totalQty : discountedCost;

                                                onModalItemChange({
                                                    ...modalItem,
                                                    cost_price: newCostPrice,
                                                    item_discount: itemDiscount,
                                                    amount: newCostPrice * modalItem.qty - itemDiscount,
                                                    new_cost_price: calculatedNewCostPrice,
                                                });
                                            }}
                                            className="mt-1 text-right"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            New Cost Price
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={activeField === 'new_cost_price' ? activeValue : modalItem.new_cost_price.toFixed(2)}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('new_cost_price');
                                                setActiveValue(modalItem.new_cost_price.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                onModalItemChange({
                                                    ...modalItem,
                                                    new_cost_price: parseFloat(val) || 0,
                                                });
                                            }}
                                            className="mt-1 text-right"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Discount Rate (%)
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={activeField === 'discount_rate' ? activeValue : modalItem.discount_rate}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('discount_rate');
                                                setActiveValue(modalItem.discount_rate.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                const newDiscountRate = parseFloat(val) || 0;

                                                const itemDiscount = (modalItem.cost_price * modalItem.qty * newDiscountRate) / 100;
                                                const totalQty = modalItem.qty + modalItem.free_qty;
                                                const discountedCost = modalItem.cost_price - (modalItem.cost_price * newDiscountRate / 100);
                                                const newCostPrice = totalQty > 0 ? (discountedCost * modalItem.qty) / totalQty : discountedCost;

                                                onModalItemChange({
                                                    ...modalItem,
                                                    discount_rate: newDiscountRate,
                                                    item_discount: itemDiscount,
                                                    amount: modalItem.cost_price * modalItem.qty - itemDiscount,
                                                    new_cost_price: newCostPrice,
                                                });
                                            }}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Cus Discount Rate (%)
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={activeField === 'cus_discount_rate' ? activeValue : (modalItem.cus_discount_rate ?? '')}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('cus_discount_rate');
                                                setActiveValue(modalItem.cus_discount_rate?.toString() || '');
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                onModalItemChange({
                                                    ...modalItem,
                                                    cus_discount_rate: parseFloat(val) || 0
                                                });
                                            }}
                                            className="mt-1"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Free Quantity
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={activeField === 'free_qty' ? activeValue : modalItem.free_qty}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('free_qty');
                                                setActiveValue(modalItem.free_qty.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                const newFreeQty = parseFloat(val) || 0;
                                                const totalQty = modalItem.qty + newFreeQty;

                                                const discountedCost = modalItem.cost_price - (modalItem.cost_price * modalItem.discount_rate / 100);
                                                const newCostPrice = totalQty > 0 ? (discountedCost * modalItem.qty) / totalQty : discountedCost;

                                                onModalItemChange({
                                                    ...modalItem,
                                                    free_qty: newFreeQty,
                                                    new_cost_price: newCostPrice,
                                                });
                                            }}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Retail Price
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={activeField === 'retail_price' ? activeValue : modalItem.retail_price.toFixed(2)}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('retail_price');
                                                setActiveValue(modalItem.retail_price.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                onModalItemChange({
                                                    ...modalItem,
                                                    retail_price: parseFloat(val) || 0,
                                                });
                                            }}
                                            className="mt-1 text-right"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Wholesale Price
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={activeField === 'wholesale_price' ? activeValue : modalItem.wholesale_price.toFixed(2)}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('wholesale_price');
                                                setActiveValue(modalItem.wholesale_price.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                onModalItemChange({
                                                    ...modalItem,
                                                    wholesale_price: parseFloat(val) || 0,
                                                });
                                            }}
                                            className="mt-1 text-right"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Extra Price
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={activeField === 'extra_price' ? activeValue : modalItem.extra_price.toFixed(2)}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('extra_price');
                                                setActiveValue(modalItem.extra_price.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                onModalItemChange({
                                                    ...modalItem,
                                                    extra_price: parseFloat(val) || 0,
                                                });
                                            }}
                                            className="mt-1 text-right"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            CC Price
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={activeField === 'cc_price' ? activeValue : modalItem.cc_price.toFixed(2)}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onFocus={(e) => {
                                                setActiveField('cc_price');
                                                setActiveValue(modalItem.cc_price.toString());
                                                e.target.select();
                                            }}
                                            onBlur={() => setActiveField(null)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setActiveValue(val);
                                                onModalItemChange({
                                                    ...modalItem,
                                                    cc_price: parseFloat(val) || 0,
                                                });
                                            }}
                                            className="mt-1 text-right"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Brand, Model, Serial Number for Printing Section - Only show if product selected */}
                            {stockLocationType === 'printing_section' && modalItem.product_id > 0 && (
                                <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-2 border-indigo-300 rounded-xl shadow-md">
                                    <h4 className="text-base font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Product Details
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {/* Brand */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">
                                                Brand
                                            </Label>
                                            <Input
                                                value={modalItem.brand || ''}
                                                readOnly
                                                className="mt-1 bg-gray-50 text-gray-600 cursor-not-allowed"
                                                placeholder="Auto-filled from product registration"
                                            />
                                        </div>

                                        {/* Model */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">
                                                Model
                                            </Label>
                                            <Input
                                                value={modalItem.model || ''}
                                                readOnly
                                                className="mt-1 bg-gray-50 text-gray-600 cursor-not-allowed"
                                                placeholder="Auto-filled from product registration"
                                            />
                                        </div>

                                        {/* Serial Number */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700">
                                                Serial Number
                                            </Label>
                                            <Input
                                                value={modalItem.serial_number || ''}
                                                readOnly
                                                className="mt-1 bg-gray-50 text-gray-600 cursor-not-allowed"
                                                placeholder="Auto-filled from product registration"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Calculations - Show for Printing Section */}
                            {stockLocationType === 'printing_section' && (
                                <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Item Discount
                                        </Label>
                                        <p className="text-lg font-semibold text-red-600">
                                            Rs {modalItem.item_discount.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                            Total Amount
                                        </Label>
                                        <p className="text-lg font-semibold text-green-600">
                                            Rs {modalItem.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 border-t pt-4">
                                <Button variant="outline" onClick={onCancel}>
                                    Cancel
                                </Button>
                                <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
                                    {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}