import { Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';

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
    cus_discount_rate?: number;
}

interface ItemsTableProps {
    stockLocationType: 'main_stock' | 'printing_section';
    items: PurchaseItem[];
    currentProducts: Product[];
    searchTerms: { [key: number]: string };
    openRowIndex: number | null;
    onAddItem: () => void;
    onEditItem: (item: PurchaseItem, index: number) => void;
    onRemoveItem: (index: number) => void;
    onProductChange: (index: number, productId: number) => void;
    onSearchTermChange: (index: number, term: string) => void;
    onRowOpenChange: (index: number | null) => void;
    errors: any;
}

export default function ItemsTable({
    stockLocationType,
    items,
    currentProducts,
    searchTerms,
    openRowIndex,
    onAddItem,
    onEditItem,
    onRemoveItem,
    onProductChange,
    onSearchTermChange,
    onRowOpenChange,
    errors,
}: ItemsTableProps) {
    return (
        <div className="mb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 shadow-sm mb-6">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Purchase Items
                </h4>

                {/* Add Item Button */}
                <Button
                    type="button"
                    variant="default"
                    size="lg"
                    onClick={onAddItem}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-4 text-lg font-semibold rounded-xl min-w-[200px]"
                >
                    <Plus className="mr-3 h-6 w-6" />
                    {t('Add Item')}
                    <span className="ml-2 text-xs opacity-75">(F2 / Ctrl+A)</span>
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-sky-600 to-blue-600 text-white sticky top-0">
                            <tr>
                                {stockLocationType === 'printing_section' ? (
                                    <>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Item Name')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Brand')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Model')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Serial No')}</th>
                                        {/* <th className="px-2 py-2 text-right text-xs font-bold tracking-wider text-white uppercase">{t('Qty')}</th> */}
                                        <th className="px-2 py-2 text-right text-xs font-bold tracking-wider text-white uppercase">{t('Cost Price')}</th>
                                        <th className="px-2 py-2 text-right text-xs font-bold tracking-wider text-white uppercase">{t('Sales Price')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Warranty')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Discount Rate')}</th>

                                    </>
                                ) : (
                                    <>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Item code')}</th>
                                        {/* <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('C Stock')}</th> */}
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Cost Price')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Nml Cost')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('NCost')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Qty')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Dis%')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Cus Dis%')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Free Qty')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Retail Price')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Wh Price')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('Ext Price')}</th>
                                        <th className="px-2 py-2 text-left text-xs font-bold tracking-wider text-white uppercase">{t('CC Price')}</th>
                                    </>
                                )}
                                <th className="px-2 py-2 text-right text-xs font-bold tracking-wider text-white uppercase">{t('Total Amount (Rs)')}</th>
                                <th className="px-2 py-2 text-center text-xs font-bold tracking-wider text-white uppercase">{t('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={stockLocationType === 'printing_section' ? 10 : 15} className="px-4 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Plus className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-sm font-medium">No items added yet</p>
                                            <p className="text-xs text-gray-400">Click "Add Item" to start adding purchase items</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        {stockLocationType === 'printing_section' ? (
                                            <>
                                                {/* Printing Section Columns */}
                                                <td className="px-4 py-4 text-left cursor-pointer hover:bg-amber-50" onClick={() => onEditItem(item, index)}>
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {item.product_name}
                                                    </div>
                                                    <div className="text-xs text-green-600 font-medium">
                                                        {t('Printing Section Item')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-left">
                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                        {item.brand}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-left">
                                                    {item.model || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-left">
                                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                        {item.serial_number}
                                                    </span>
                                                </td>
                                                {/* <td className="px-4 py-4 text-right font-semibold">
                                                    {item.qty}
                                                </td> */}
                                                <td className="px-4 py-4 text-right">
                                                    {item.cost_price.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {item.retail_price.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 text-left">
                                                    {item.warranty || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-left">
                                                    {Math.round(item.discount_rate)}%
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {/* Main Stock Columns */}
                                                <td className="px-4 py-4 text-right w-96">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Select
                                                                value={item.product_id.toString()}
                                                                onValueChange={(value) => {
                                                                    const productId = parseInt(value);
                                                                    if (productId > 0) {
                                                                        onProductChange(index, productId);
                                                                    }
                                                                    onSearchTermChange(index, '');
                                                                }}
                                                                onOpenChange={(open) => {
                                                                    onRowOpenChange(open ? index : null);
                                                                    if (!open) {
                                                                        onSearchTermChange(index, '');
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 w-[200px] text-xs text-right">
                                                                    <SelectValue placeholder={t('Select item')} className="text-right">
                                                                        {(() => {
                                                                            const selectedProduct = currentProducts.find(p => p.id === item.product_id);
                                                                            return selectedProduct ? selectedProduct.code : 'Select item';
                                                                        })()}
                                                                    </SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-[300px]">
                                                                    {openRowIndex === index && (
                                                                        <>
                                                                            <div className="sticky top-0 z-10 border-b bg-white p-2">
                                                                                <div className="relative">
                                                                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder={t('Search item code, name, or barcode...')}
                                                                                        className="w-full rounded-md border py-2 pr-3 pl-9 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                                                        value={searchTerms[index] || ''}
                                                                                        onChange={(e) => onSearchTermChange(index, e.target.value)}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        onKeyDown={(e) => e.stopPropagation()}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="max-h-[200px] overflow-y-auto">
                                                                                {(() => {
                                                                                    const search = (searchTerms[index] || '').toLowerCase();
                                                                                    const filteredProducts = currentProducts.filter(p => {
                                                                                        if (!search) return true;
                                                                                        const codeMatch = p.code.toLowerCase().includes(search);
                                                                                        const nameMatch = p.name.toLowerCase().includes(search);
                                                                                        const barcodeMatch = p.barcode && p.barcode.toLowerCase().includes(search);
                                                                                        return codeMatch || nameMatch || barcodeMatch;
                                                                                    });

                                                                                    if (filteredProducts.length === 0) {
                                                                                        return (
                                                                                            <div className="p-4 text-center text-xs text-gray-500">
                                                                                                {currentProducts.length === 0 ? 'No products available' : 'No items found'}
                                                                                            </div>
                                                                                        );
                                                                                    }

                                                                                    return filteredProducts.map(product => (
                                                                                        <SelectItem key={product.id} value={product.id.toString()} className="cursor-pointer">
                                                                                            <div className="py-1">
                                                                                                <div className="text-sm font-medium">{product.code}</div>
                                                                                                <div className="text-xs text-gray-500">
                                                                                                    {product.name}
                                                                                                    {product.barcode && ` | Barcode: ${product.barcode}`}
                                                                                                </div>
                                                                                            </div>
                                                                                        </SelectItem>
                                                                                    ));
                                                                                })()}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {(() => {
                                                                const selectedProduct = currentProducts.find(p => p.id === item.product_id);
                                                                return selectedProduct ? `${selectedProduct.code} - ${selectedProduct.name}` : '';
                                                            })()}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Current Stock */}
                                                {/* <td className="px-4 py-4">
                                                    {(() => {
                                                        const selectedProduct = currentProducts.find(p => p.id === item.product_id);
                                                        if (selectedProduct) {
                                                            const totalStock = selectedProduct.current_stock + selectedProduct.free_stock;
                                                            return (
                                                                <div className="space-y-1">
                                                                    <div className="text-xs font-medium text-blue-600">
                                                                        {Math.round(totalStock)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return <span className="text-xs text-gray-400">0.00</span>;
                                                    })()}
                                                </td> */}

                                                {/* Cost Price */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly step="0.01" value={item.cost_price.toFixed(2)} className="h-10 w-24 text-sm font-medium text-right" />
                                                </td>

                                                {/* Normal Cost */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly step="0.01" value={item.normal_cost.toFixed(2)} className="h-10 w-24 text-sm font-medium text-right" />
                                                </td>

                                                {/* New Cost */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly step="0.01" value={item.new_cost_price.toFixed(2)} className="h-10 w-24 text-sm font-medium text-right" />
                                                </td>

                                                {/* Quantity */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly step="1" value={item.qty} className="h-10 w-20 text-sm font-medium text-right" />
                                                </td>

                                                {/* Discount % */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly value={Math.round(item.discount_rate)} className="h-10 w-16 text-sm text-right" />
                                                </td>

                                                {/* Cus Discount % */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly value={Math.round(item.cus_discount_rate || 0)} className="h-10 w-16 text-sm text-right" />
                                                </td>

                                                {/* Free Qty */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly value={item.free_qty} className="h-10 w-16 text-sm text-right" />
                                                </td>

                                                {/* Retail Price */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly value={item.retail_price.toFixed(2)} className="h-10 w-24 text-sm text-right" />
                                                </td>

                                                {/* Wholesale Price */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly value={item.wholesale_price.toFixed(2)} className="h-10 w-24 text-sm text-right" />
                                                </td>

                                                {/* Extra Price */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly value={item.extra_price.toFixed(2)} className="h-10 w-24 text-sm text-right" />
                                                </td>

                                                {/* CC Price */}
                                                <td className="px-4 py-4 text-right">
                                                    <Input type="number" readOnly value={item.cc_price.toFixed(2)} className="h-10 w-24 text-sm text-right" />
                                                </td>
                                            </>
                                        )}

                                        {/* Shared Columns (Amount & Actions) */}
                                        {/* Amount */}
                                        <td className="px-4 py-4 text-right">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-green-600">
                                                    {item.amount.toFixed(2)}
                                                </div>
                                                {item.item_discount > 0 && (
                                                    <div className="text-xs text-red-600">
                                                        Discount: {item.item_discount.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-4 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRemoveItem(index)}
                                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {errors.items && (
                <p className="mb-4 text-sm text-red-600">
                    {errors.items}
                </p>
            )}
        </div>
    );
}