import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    PackageX,
    Search,
    X,
    Plus,
    Trash2,
    Save,
    RotateCcw,
    Calendar,
    Building2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('Supplier Returns'),
        href: '/supplier-returns',
    },
    {
        title: t('New Return'),
        href: '#',
    },
];

interface Section {
    id: number;
    name: string;
    section_code: string;
}

interface Supplier {
    id: number;
    code: string;
    name: string;
    phone: string;
}

interface Item {
    ItemPriceKey: string;
    ItmKy: string;
    ItemCode: string;
    ItmNm: string;
    batch_no: string;
    CosPri: number;
    stock_quantity: number;
}

interface Printer {
    PerchaseDetKy: string;
    iTimKy: string;
    item_name: string;
    serial_number: string;
    batch_no: string;
    brand: string;
    model: string;
    warranty: string;
    CosPri: number;
    stock_quantity: number;
}

interface ReturnItem {
    key: string;
    item_master_key?: string;
    batch_no?: string;
    quantity: string;
    return_value: string;
}

interface FormData {
    return_type: 'item' | 'printer';
    items: ReturnItem[];
    supplier_code: string;
    supplier_id: string;
    reason: string;
    return_date: string;
    notes: string;
    status: string;
    section_id: string;
}

interface Props {
    sections: Section[];
    userSection?: Section | null;
}

export default function SupplierReturnCreate({ sections, userSection }: Props) {
    const { data, setData, processing, errors, reset } = useForm<FormData>({
        return_type: 'item',
        items: [{ key: '', quantity: '1', return_value: '0' }],
        supplier_code: '',
        supplier_id: '',
        reason: '',
        return_date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'pending',
        section_id: userSection ? userSection.id.toString() : '',
    });

    const [supplierSearch, setSupplierSearch] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [supplierLoading, setSupplierLoading] = useState(false);

    const [itemSearchTerms, setItemSearchTerms] = useState<{ [key: number]: string }>({});
    const [itemSearchResults, setItemSearchResults] = useState<{ [key: number]: (Item | Printer)[] }>({});
    const [itemShowDropdowns, setItemShowDropdowns] = useState<{ [key: number]: boolean }>({});
    const [selectedItems, setSelectedItems] = useState<{ [key: number]: Item | Printer | null }>({});
    const [itemSearchLoading, setItemSearchLoading] = useState<{ [key: number]: boolean }>({});

    const supplierSearchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
    const itemSearchTimeoutRefs = useRef<{ [key: number]: NodeJS.Timeout }>({});

    // Search suppliers
    const handleSupplierSearch = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 1) {
            setSuppliers([]);
            setShowSupplierDropdown(false);
            return;
        }

        setSupplierLoading(true);
        setShowSupplierDropdown(true);
        try {
            const response = await fetch(`/supplier-returns/search-suppliers?term=${encodeURIComponent(searchTerm)}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (response.ok) {
                const results = await response.json();
                setSuppliers(results);
                if (results.length > 0) {
                    setShowSupplierDropdown(true);
                }
            }
        } catch (error) {
            console.error('Error searching suppliers:', error);
        } finally {
            setSupplierLoading(false);
        }
    };

    const handleSupplierSearchChange = (value: string) => {
        setSupplierSearch(value);
        setShowSupplierDropdown(true);

        if (supplierSearchTimeout.current) {
            clearTimeout(supplierSearchTimeout.current);
        }

        supplierSearchTimeout.current = setTimeout(() => {
            handleSupplierSearch(value);
        }, 300);
    };

    const selectSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setData('supplier_code', supplier.code);
        setData('supplier_id', supplier.id.toString());
        setSupplierSearch(`${supplier.name} (${supplier.code})`);
        setShowSupplierDropdown(false);
        
        // Reset all item search results when supplier changes
        setItemSearchTerms({});
        setItemSearchResults({});
        setSelectedItems({});
        setItemShowDropdowns({});
    };

    // Search items/printers
    const handleItemSearch = async (searchTerm: string, index: number) => {
        if (!data.supplier_id) {
            alert(t('Please select a supplier first'));
            return;
        }

        if (!data.section_id) {
            alert(t('Please select a section first'));
            return;
        }

        setItemSearchLoading(prev => ({ ...prev, [index]: true }));
        try {
            const endpoint = data.return_type === 'item' ? 'search-items' : 'search-printers';
            const response = await fetch(
                `/supplier-returns/${endpoint}?term=${encodeURIComponent(searchTerm)}&supplier_id=${data.supplier_id}&section_id=${data.section_id}`,
                { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
            );

            if (response.ok) {
                const results = await response.json();
                setItemSearchResults(prev => ({ ...prev, [index]: results }));
                // Automatically show dropdown when results arrive
                if (results.length > 0) {
                    setItemShowDropdowns(prev => ({ ...prev, [index]: true }));
                }
            }
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setItemSearchLoading(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleItemSearchChange = (value: string, index: number) => {
        setItemSearchTerms(prev => ({ ...prev, [index]: value }));
        setItemShowDropdowns(prev => ({ ...prev, [index]: true }));

        if (itemSearchTimeoutRefs.current[index]) {
            clearTimeout(itemSearchTimeoutRefs.current[index]);
        }

        itemSearchTimeoutRefs.current[index] = setTimeout(() => {
            handleItemSearch(value, index);
        }, 300);
    };

    const selectItem = (item: Item | Printer, index: number) => {
        setSelectedItems(prev => ({ ...prev, [index]: item }));

        const key = 'ItemPriceKey' in item ? item.ItemPriceKey : item.PerchaseDetKy;
        const itemMasterKey = 'ItmKy' in item ? item.ItmKy : undefined;
        const batchNo = item.batch_no || '';
        const price = item.CosPri || 0;

        const newItems = [...data.items];
        newItems[index] = {
            ...newItems[index],
            key: key,
            item_master_key: itemMasterKey,
            batch_no: batchNo,
            return_value: price.toString(),
        };
        setData('items', newItems);

        const displayText = 'ItemCode' in item
            ? `${item.ItemCode} - ${item.ItmNm}${batchNo ? ' [' + batchNo + ']' : ''}`
            : `${item.serial_number} - ${item.item_name}`;

        setItemSearchTerms(prev => ({ ...prev, [index]: displayText }));
        setItemShowDropdowns(prev => ({ ...prev, [index]: false }));
    };

    const clearItemSelection = (index: number) => {
        setSelectedItems(prev => ({ ...prev, [index]: null }));
        updateItem(index, 'key', '');
        setItemSearchTerms(prev => ({ ...prev, [index]: '' }));
        setItemSearchResults(prev => ({ ...prev, [index]: [] }));
    };

    const addItem = () => {
        setData('items', [...data.items, { key: '', quantity: '1', return_value: '0' }]);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems.length > 0 ? newItems : [{ key: '', quantity: '1', return_value: '0' }]);

        setItemSearchTerms(prev => {
            const newTerms = { ...prev };
            delete newTerms[index];
            return newTerms;
        });
        setItemSearchResults(prev => {
            const newResults = { ...prev };
            delete newResults[index];
            return newResults;
        });
        setSelectedItems(prev => {
            const newSelected = { ...prev };
            delete newSelected[index];
            return newSelected;
        });
        setItemShowDropdowns(prev => {
            const newShow = { ...prev };
            delete newShow[index];
            return newShow;
        });
    };

    const updateItem = (index: number, field: keyof ReturnItem, value: string) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.search-dropdown-container')) {
                setShowSupplierDropdown(false);
                setItemShowDropdowns({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Submitting data:', JSON.stringify(data, null, 2));
        console.log('Errors before submit:', errors);

        router.post('/supplier-returns', data as any, {
            onSuccess: () => {
                console.log('Success! Redirecting...');
                reset();
                router.visit('/supplier-returns');
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
                alert('Please check the form for errors: ' + JSON.stringify(errors));
            },
            onFinish: () => {
                console.log('Request finished');
            },
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        reset();
        setSupplierSearch('');
        setSuppliers([]);
        setSelectedSupplier(null);
        setItemSearchTerms({});
        setItemSearchResults({});
        setSelectedItems({});
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('New Supplier Return')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/supplier-returns"
                                    className="rounded-xl bg-white/20 p-3 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <PackageX className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('New Supplier Return')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Return items or printers to supplier')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Quick Stats */}
                <div className="px-4 sm:px-0 mb-6">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <p className="text-xs text-slate-600">{t('Total Items')}</p>
                            <p className="text-lg font-semibold text-slate-800">{data.items.length}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <p className="text-xs text-slate-600">{t('Return Type')}</p>
                            <p className="text-lg font-semibold text-slate-800">{data.return_type === 'item' ? t('Item') : t('Printer')}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <p className="text-xs text-slate-600">{t('Total Value')}</p>
                            <p className="text-lg font-semibold text-slate-800">
                                Rs {data.items.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <p className="text-xs text-slate-600">{t('Supplier')}</p>
                            <p className="text-lg font-semibold text-slate-800">{selectedSupplier ? selectedSupplier.name : t('Not Selected')}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Validation Errors Display */}
                            {Object.keys(errors).length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <X className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                {t('There were errors with your submission')}
                                            </h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {Object.entries(errors).map(([key, value]) => (
                                                        <li key={key}>{value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center">
                                    <Building2 className="w-4 h-4 mr-2 text-vismass-blue" />
                                    {t('Section')} *
                                </label>
                                <select
                                    value={data.section_id}
                                    onChange={(e) => setData('section_id', e.target.value)}
                                    className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                    required
                                >
                                    <option value="">{t('Select Section')}</option>
                                    {sections
                                        .filter((section) => 
                                            !section.name.toLowerCase().includes('delivery') && 
                                            !section.name.toLowerCase().includes('printing')
                                        )
                                        .map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.name}
                                            </option>
                                        ))}
                                </select>
                                {errors.section_id && (
                                    <div className="mt-2 text-sm text-red-600">{errors.section_id}</div>
                                )}
                            </div>

                            {/* Return Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    {t('Return Type')} *
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="item"
                                            checked={data.return_type === 'item'}
                                            onChange={(e) => {
                                                setData('return_type', e.target.value as 'item');
                                                setData('items', [{ key: '', quantity: '1', return_value: '0' }]);
                                                setSelectedItems({});
                                                setItemSearchTerms({});
                                            }}
                                            className="mr-2"
                                        />
                                        {t('Item')}
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="printer"
                                            checked={data.return_type === 'printer'}
                                            onChange={(e) => {
                                                setData('return_type', e.target.value as 'printer');
                                                setData('items', [{ key: '', quantity: '1', return_value: '0' }]);
                                                setSelectedItems({});
                                                setItemSearchTerms({});
                                            }}
                                            className="mr-2"
                                        />
                                        {t('Printer')}
                                    </label>
                                </div>
                            </div>

                            {/* Supplier Search */}
                            <div className="space-y-2 relative search-dropdown-container">
                                <label className="text-sm font-medium text-slate-700">
                                    {t('Supplier')} *
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={supplierSearch}
                                        onChange={(e) => handleSupplierSearchChange(e.target.value)}
                                        onFocus={() => {
                                            if (supplierSearch.length >= 1 && suppliers.length > 0) {
                                                setShowSupplierDropdown(true);
                                            }
                                        }}
                                        className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 pl-10 pr-10"
                                        placeholder={t('Type to search supplier...')}
                                        required={!data.supplier_code}
                                    />
                                    {selectedSupplier && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedSupplier(null);
                                                setData('supplier_code', '');
                                                setData('supplier_id', '');
                                                setSupplierSearch('');
                                                // Reset item searches
                                                setItemSearchTerms({});
                                                setItemSearchResults({});
                                                setSelectedItems({});
                                                setItemShowDropdowns({});
                                            }}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {showSupplierDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                        {supplierLoading ? (
                                            <div className="p-3 text-center text-sm text-slate-500">
                                                {t('Searching...')}
                                            </div>
                                        ) : suppliers.length === 0 ? (
                                            <div className="p-3 text-center text-sm text-slate-500">
                                                {t('No suppliers found')}
                                            </div>
                                        ) : (
                                            suppliers.map((supplier) => (
                                                <button
                                                    key={supplier.id}
                                                    type="button"
                                                    onClick={() => selectSupplier(supplier)}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                                >
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {supplier.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {supplier.code} {supplier.phone && `• ${supplier.phone}`}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                                {errors.supplier_code && (
                                    <div className="mt-2 text-sm text-red-600">{errors.supplier_code}</div>
                                )}
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-slate-800">
                                        {data.return_type === 'printer' ? t('Printers to Return') : t('Items to Return')}
                                    </h2>
                                    <Button type="button" onClick={addItem} size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        {t('Add Item')}
                                    </Button>
                                </div>

                                {data.items.map((item, index) => {
                                    const selectedItem = selectedItems[index];

                                    return (
                                        <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-slate-700">
                                                    {t('Item')} #{index + 1}
                                                </h3>
                                                {data.items.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        {t('Remove')}
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Item Search */}
                                            <div className="space-y-1.5 relative search-dropdown-container">
                                                <label className="text-xs font-medium text-slate-700">
                                                    {data.return_type === 'printer' ? t('Select Printer') : t('Select Item')} *
                                                </label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={itemSearchTerms[index] || ''}
                                                        onChange={(e) => handleItemSearchChange(e.target.value, index)}
                                                        onFocus={() => {
                                                            // Trigger search on focus to show all supplier items
                                                            if (data.supplier_id && data.section_id) {
                                                                if (itemSearchResults[index]?.length > 0) {
                                                                    setItemShowDropdowns(prev => ({ ...prev, [index]: true }));
                                                                } else {
                                                                    // Fetch items from supplier even with empty search
                                                                    handleItemSearch(itemSearchTerms[index] || '', index);
                                                                }
                                                            }
                                                        }}
                                                        className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 pl-10 pr-10"
                                                        placeholder={t('Search by item code or name...')}
                                                        required={!item.key}
                                                        disabled={!data.supplier_id || !data.section_id}
                                                    />
                                                    {selectedItems[index] && (
                                                        <button
                                                            type="button"
                                                            onClick={() => clearItemSelection(index)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {itemShowDropdowns[index] && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                                        {itemSearchLoading[index] ? (
                                                            <div className="p-3 text-center text-sm text-slate-500">
                                                                {t('Searching...')}
                                                            </div>
                                                        ) : itemSearchResults[index] && itemSearchResults[index].length > 0 ? (
                                                            itemSearchResults[index].map((resultItem: any) => (
                                                                <button
                                                                    key={resultItem.ItemPriceKey || resultItem.PerchaseDetKy}
                                                                    type="button"
                                                                    onClick={() => selectItem(resultItem, index)}
                                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                                                >
                                                                    <div className="text-sm font-medium text-slate-900">
                                                                        {'ItemCode' in resultItem
                                                                            ? `${resultItem.ItemCode} - ${resultItem.ItmNm}${resultItem.batch_no ? ' [' + resultItem.batch_no + ']' : ''}`
                                                                            : `${resultItem.serial_number} - ${resultItem.item_name}`}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {t('Stock')}: {resultItem.stock_quantity} | {t('Cost')}: Rs. {resultItem.CosPri}
                                                                        {'brand' in resultItem && ` | ${resultItem.brand} ${resultItem.model}`}
                                                                        {resultItem.batch_no && 'ItemCode' in resultItem && ` | Batch: ${resultItem.batch_no}`}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-center text-sm text-slate-500">
                                                                {t('No items found')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {selectedItem && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-slate-700">
                                                                {t('Quantity')} *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                max={('stock_quantity' in selectedItem) ? selectedItem.stock_quantity : undefined}
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                                className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-slate-700">
                                                                {t('Return Value')} *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.return_value}
                                                                onChange={(e) => updateItem(index, 'return_value', e.target.value)}
                                                                className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                        <div className="text-xs text-orange-700">
                                                            <div><span className="font-medium">{t('Stock Available')}:</span> {('stock_quantity' in selectedItem) ? selectedItem.stock_quantity : 0}</div>
                                                            <div><span className="font-medium">{t('Cost Price')}:</span> Rs. {selectedItem.CosPri}</div>
                                                            {selectedItem.batch_no && (
                                                                <div><span className="font-medium">{t('Batch No')}:</span> {selectedItem.batch_no}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Return Details */}
                            <div className="space-y-4 pt-6 border-t border-slate-200">
                                <h2 className="text-lg font-semibold text-slate-800">{t('Return Details')}</h2>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Return Date')} *
                                        </label>
                                        <input
                                            type="date"
                                            value={data.return_date}
                                            onChange={(e) => setData('return_date', e.target.value)}
                                            className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            required
                                        />
                                        {errors.return_date && (
                                            <div className="mt-2 text-sm text-red-600">{errors.return_date}</div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            {t('Status')} *
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            required
                                        >
                                            <option value="pending">{t('Pending')}</option>
                                            <option value="approved">{t('Approved')}</option>
                                            <option value="rejected">{t('Rejected')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t('Reason for Return')} *
                                    </label>
                                    <select
                                        value={data.reason}
                                        onChange={(e) => setData('reason', e.target.value)}
                                        className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                        required
                                    >
                                        <option value="">{t('Select Reason')}</option>
                                        <option value="damaged">{t('Damaged/Defective')}</option>
                                        <option value="wrong_item">{t('Wrong Item Received')}</option>
                                        <option value="quality_issue">{t('Quality Issue')}</option>
                                        <option value="expired">{t('Expired')}</option>
                                        <option value="other">{t('Other')}</option>
                                    </select>
                                    {errors.reason && (
                                        <div className="mt-2 text-sm text-red-600">{errors.reason}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t('Additional Notes')}
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="block w-full rounded-lg border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                        placeholder={t('Enter any additional details...')}
                                    />
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end pt-6 border-t border-slate-200 space-x-3">
                                <Button
                                    type="button"
                                    onClick={handleReset}
                                    variant="outline"
                                    size="default"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    {t('Reset')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    size="default"
                                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Processing...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Save className="w-4 h-4" />
                                            <span>{t('Record Return')}</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
