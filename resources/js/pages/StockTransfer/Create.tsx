import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { Calendar, Loader, Truck, Package, Plus, Trash2, Building2, User, MapPin, Download, ArrowLeft, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import Swal from 'sweetalert2';

// Reusing date utilities from StockInHand.tsx
const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const parseDateFromDisplay = (displayDate: string) => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return displayDate;
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

interface Section {
    id: number;
    section_code: string;
    name: string;
    is_main_stock: boolean;
}

interface Item {
    ItmKy: string;
    ItemCode: string;
    ItmNm: string;
    cost_price: number;
}

interface TransferItem {
    item_id: string;
    quantity: string;
    stock_id?: string;
    batch_no?: string;
}

interface StockBatch {
    id: number;
    batch_no: string;
    cost_price: number;
    quantity: number;
    date: string;
}

interface Props {
    sections?: Section[];
    items?: Item[];
}

export default function Create({ sections = [], items = [] }: Props) {
    // Remove duplicate items based on ItmKy
    const uniqueItems = (items || []).filter((item, index, self) =>
        self.findIndex(i => i.ItmKy === item.ItmKy) === index
    );

    const { data, setData, post, processing, errors } = useForm<{
        from_section_code: string;
        to_section_code: string;
        items: TransferItem[];
        transfer_date: string;
        notes: string;
        company_code: string;
    }>({
        from_section_code: '',
        to_section_code: '',
        items: [],
        transfer_date: new Date().toISOString().split('T')[0], // Default to today
        notes: '',
        company_code: '', // Will be set from session or user
    });

    // Filter sections to include only: Service, Import Buying and Selling, Main Stock, Delivery, Printing
    const filteredSections = (sections || []).filter(s => {
        const name = s.name.toLowerCase();
        return name.includes('service') ||
            name.includes('import buying') ||
            name.includes('delivery') ||
            name.includes('printing') ||
            name.includes('main stock') ||
            s.is_main_stock;
    });

    // From section options - exclude the one selected in TO
    const availableFromSections = (filteredSections || []).filter(section =>
        !data.to_section_code || section.section_code.trim() !== data.to_section_code.trim()
    );

    // To section options - exclude the one selected in FROM
    const availableToSections = (filteredSections || []).filter(section =>
        !data.from_section_code || section.section_code.trim() !== data.from_section_code.trim()
    );

    // Set default from section to main stock if available
    useEffect(() => {
        if (filteredSections.length > 0 && !data.from_section_code) {
            const mainStock = filteredSections.find(s => s.is_main_stock);
            if (mainStock) {
                setData('from_section_code', mainStock.section_code);
            } else if (filteredSections[0]) {
                setData('from_section_code', filteredSections[0].section_code);
            }
        }
    }, [filteredSections]);

    // Ensure to_section_code is cleared if it matches from_section_code
    useEffect(() => {
        if (data.from_section_code && data.to_section_code === data.from_section_code) {
            setData('to_section_code', '');
        }
    }, [data.from_section_code, data.to_section_code]);

    const [transferDateDisplay, setTransferDateDisplay] = useState(
        formatDateForDisplay(data.transfer_date),
    );

    const [stocks, setStocks] = useState<{ [key: number]: number | null }>({});

    // Current Item State
    const [currentItem, setCurrentItem] = useState<TransferItem>({ item_id: '', quantity: '', stock_id: '' });
    const [currentStock, setCurrentStock] = useState<number | null>(null);
    const [currentBatches, setCurrentBatches] = useState<StockBatch[]>([]);
    const [currentStockLoading, setCurrentStockLoading] = useState(false);
    const [currentQuantityError, setCurrentQuantityError] = useState('');

    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Fetch stock for the CURRENT item being edited
    const fetchCurrentProductStock = async (itemId: string, sectionCode: string) => {
        if (!itemId || !sectionCode) {
            setCurrentStock(null);
            setCurrentBatches([]);
            return;
        }

        setCurrentStockLoading(true);
        try {
            const response = await fetch(`/stock-transfers/get-product-stock?item_id=${itemId}&section_code=${sectionCode}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const dataResponse = await response.json();
                setCurrentStock(dataResponse.stock);
                setCurrentBatches(dataResponse.batches || []);

                // If only one batch exists, auto-select it
                if (dataResponse.batches && dataResponse.batches.length === 1) {
                    const singleBatch = dataResponse.batches[0];
                    setCurrentItem(prev => ({ ...prev, stock_id: singleBatch.id.toString() }));
                }
            } else {
                setCurrentStock(null);
                setCurrentBatches([]);
            }
        } catch (error) {
            console.error('Error fetching stock:', error);
            setCurrentStock(null);
            setCurrentBatches([]);
        } finally {
            setCurrentStockLoading(false);
        }
    };

    // Validate quantity for the CURRENT item
    const validateCurrentQuantity = (quantity: string) => {
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            setCurrentQuantityError('');
            return;
        }

        let availableLimit = 0;
        let limitType = 'total';

        if (currentItem.stock_id && currentBatches.length > 0) {
            const selectedBatch = currentBatches.find(b => b.id.toString() === currentItem.stock_id);
            if (selectedBatch) {
                availableLimit = selectedBatch.quantity;
                limitType = 'batch';
            }
        } else {
            availableLimit = currentStock !== null ? currentStock! : 0;
        }

        if (qty > availableLimit) {
            const errorMsg = limitType === 'batch'
                ? `Cannot transfer more than batch stock (${availableLimit.toFixed(2)})`
                : `Cannot transfer more than available stock (${availableLimit.toFixed(2)})`;
            setCurrentQuantityError(errorMsg);
        } else {
            setCurrentQuantityError('');
        }
    };

    // Effect: Fetch stock when current item or from_section changes
    useEffect(() => {
        if (currentItem.item_id && data.from_section_code) {
            fetchCurrentProductStock(currentItem.item_id, data.from_section_code);
        } else {
            setCurrentStock(null);
            setCurrentBatches([]);
            setCurrentItem(prev => ({ ...prev, stock_id: '' }));
        }
    }, [currentItem.item_id, data.from_section_code]);

    // Effect: Validate quantity when quantity or batches/stock changes
    useEffect(() => {
        if (currentItem.quantity) {
            validateCurrentQuantity(currentItem.quantity);
        } else {
            setCurrentQuantityError('');
        }
    }, [currentItem.quantity, currentItem.stock_id, currentStock]);

    const updateCurrentItem = (field: keyof TransferItem, value: string) => {
        setCurrentItem(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItem = () => {
        if (!currentItem.item_id) return;

        const qty = parseFloat(currentItem.quantity);
        if (isNaN(qty) || qty <= 0) return;

        if (currentQuantityError) return;

        // Force batch selection if batches exist
        if (currentBatches.length > 0 && !currentItem.stock_id) {
            Swal.fire({
                title: t('Missing Batch Selection'),
                text: t('Please select a batch for this item.'),
                icon: 'warning',
                confirmButtonColor: '#3B82F6',
            });
            return;
        }

        // Create item with batch info
        const selectedBatch = currentBatches.find(b => b.id.toString() === currentItem.stock_id);
        const itemToAdd = {
            ...currentItem,
            batch_no: selectedBatch?.batch_no || 'N/A'
        };

        // Add to main list
        const newItemsList = [...data.items, itemToAdd];
        setData('items', newItemsList);

        // Save stock snapshot for summary
        setStocks(prev => ({ ...prev, [newItemsList.length - 1]: currentStock }));

        // Reset
        setCurrentItem({ item_id: '', quantity: '', stock_id: '' });
        setCurrentQuantityError('');

        // Focus back to Item Select
        setTimeout(() => {
            const itemTrigger = document.getElementById('item-select-trigger');
            if (itemTrigger) itemTrigger.focus();
        }, 100);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);

        // Rebuild stocks map
        setStocks(prev => {
            const newStocks: { [key: number]: number | null } = {};
            let newIndex = 0;
            for (let i = 0; i < data.items.length; i++) {
                if (i !== index) {
                    newStocks[newIndex] = prev[i] || null;
                    newIndex++;
                }
            }
            return newStocks;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validItems = data.items.filter(i => i.item_id && parseFloat(i.quantity) > 0);

        if (validItems.length === 0) {
            Swal.fire({
                title: t('No Items'),
                text: t('Please add at least one item to the transfer list.'),
                icon: 'warning',
                confirmButtonColor: '#3B82F6',
            });
            return;
        }

        const result = await Swal.fire({
            title: t('Are you sure you want to complete this transfer?'),
            text: t('This will seal the confirmation.'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('Yes, complete transfer'),
            cancelButtonText: t('Cancel'),
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
        });

        if (result.isConfirmed) {
            post('/stock-transfers', {
                onSuccess: (page: any) => {
                    const props = page?.props || {};
                    const flash = props.flash || {};

                    // Reset form
                    setData({
                        from_section_code: data.from_section_code,
                        to_section_code: '',
                        items: [],
                        transfer_date: new Date().toISOString().split('T')[0],
                        notes: '',
                        company_code: '',
                    });
                    setStocks({});
                    setCurrentBatches([]);

                    if (flash.transfer_id) {
                        const downloadUrl = `/stock-transfers/${flash.transfer_id}/download-pdf`;

                        // Method 1: Auto-download via iframe (most robust for files)
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = downloadUrl;
                        document.body.appendChild(iframe);

                        // Cleanup iframe after a delay
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                        }, 5000);

                        // Method 2: Show success with manual fallback
                        Swal.fire({
                            title: t('Transfer Successful'),
                            text: t('Stock has been transferred and the report is downloading.'),
                            icon: 'success',
                            confirmButtonColor: '#3B82F6',
                            confirmButtonText: t('OK'),
                            footer: `<a href="${downloadUrl}" target="_blank" style="color: #3B82F6; text-decoration: underline;">${t('Click here if download did not start')}</a>`
                        });
                    } else if (!flash.success) {
                        // Fallback success message
                        Swal.fire(t('Success'), t('Stock transferred successfully'), 'success');
                    }
                },
                onError: (errors) => {
                    console.error('Transfer failed', errors);
                    Swal.fire(t('Error'), t('Failed to transfer stock. Please check the form.'), 'error');
                }
            });
        }
    };

    const handleDownloadPdf = async () => {
        const validItems = data.items.filter(item => item.item_id && parseFloat(item.quantity) > 0);
        if (validItems.length === 0) {
            alert(t('Please add at least one item to the transfer'));
            return;
        }

        setDownloadingPdf(true);
        try {
            const response = await fetch('/stock-transfers/download-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    from_section_code: data.from_section_code,
                    to_section_code: data.to_section_code,
                    items: validItems,
                    transfer_date: data.transfer_date,
                    notes: data.notes,
                }),
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate PDF');
            }

            if (response.status === 419) {
                alert(t('Your session has expired. The page will reload.'));
                window.location.reload();
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to download PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stock-transfer-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            // Type assertion for error object to access message safely
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(t('Failed to download PDF') + ': ' + errorMessage);
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Stock Transfers', href: '/stock-transfers' },
            { title: 'Create Stock Transfer', href: '/stock-transfers/create' }
        ]}>
            <Head title={t('Stock Transfer')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <Link
                                    href="/stock-transfers"
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Truck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Create Stock Transfer')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        Transfer stock between sections in your distribution network
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        {/* Action Buttons */}
                        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData({
                                            from_section_code: '',
                                            to_section_code: '',
                                            items: [],
                                            transfer_date: new Date().toISOString().split('T')[0],
                                            notes: '',
                                            company_code: '',
                                        });
                                        setStocks({});
                                        setCurrentBatches([]);
                                        setCurrentItem({ item_id: '', quantity: '', stock_id: '' });
                                        setTransferDateDisplay(formatDateForDisplay(new Date().toISOString().split('T')[0]));
                                    }}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none transition-colors"
                                >
                                    <X className="w-4 h-4 inline mr-2" />
                                    {t('Clear Form')}
                                </button>
                            </div>
                        </div>

                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                            {/* Transfer Sections */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Building2 className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">{t('Transfer Sections')}</h2>
                                </div>

                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="from_section_code" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Building2 className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('From Section')} *
                                        </Label>
                                        <Select
                                            value={data.from_section_code}
                                            onValueChange={(value) => setData('from_section_code', value)}
                                        >
                                            <SelectTrigger className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20">
                                                <SelectValue placeholder={t('Select from section')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableFromSections.map((section) => (
                                                    <SelectItem key={section.id} value={section.section_code}>
                                                        {section.name} {section.is_main_stock ? '(Main Stock)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.from_section_code && <p className="text-sm text-red-600">{errors.from_section_code}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="to_section_code" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Building2 className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('To Section')} *
                                        </Label>
                                        <Select
                                            value={data.to_section_code}
                                            onValueChange={(value) => setData('to_section_code', value)}
                                        >
                                            <SelectTrigger className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20">
                                                <SelectValue placeholder={t('Select to section')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableToSections.map((section) => (
                                                    <SelectItem key={section.id} value={section.section_code}>
                                                        {section.name} {section.is_main_stock ? '(Main Stock)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.to_section_code && <p className="text-sm text-red-600">{errors.to_section_code}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Items to Transfer Section (Single Item Add Form) */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <Package className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">{t('Add Item to Transfer')}</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Optional help text */}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm relative">
                                    {/* Item Selection */}
                                    <div className="space-y-2 md:col-span-1">
                                        <Label className="text-sm font-medium text-slate-700">
                                            {t('Item Name')}
                                        </Label>
                                        <Select
                                            value={currentItem.item_id}
                                            onValueChange={(value) => updateCurrentItem('item_id', value)}
                                        >
                                            <SelectTrigger
                                                id="item-select-trigger"
                                                className="w-full border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            >
                                                <SelectValue placeholder={t('Select item')} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {uniqueItems.map((itemOption) => (
                                                    <SelectItem key={itemOption.ItmKy} value={itemOption.ItmKy.toString()}>
                                                        {itemOption.ItemCode} - {itemOption.ItmNm}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Batch Selection */}
                                    <div className="space-y-2 md:col-span-1">
                                        <Label className="text-sm font-medium text-slate-700">
                                            {t('Source Batch')}
                                        </Label>
                                        <Select
                                            value={currentItem.stock_id || ''}
                                            onValueChange={(value) => updateCurrentItem('stock_id', value)}
                                            disabled={!currentItem.item_id || !currentBatches || currentBatches.length === 0}
                                        >
                                            <SelectTrigger
                                                className="w-full border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                <SelectValue placeholder={
                                                    currentStockLoading
                                                        ? t('Loading batches...')
                                                        : (!currentBatches || currentBatches.length === 0)
                                                            ? t('No Batches Available')
                                                            : t('Select Batch')
                                                } />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(currentBatches || [])
                                                    .filter(batch => {
                                                        // Filter out batches that are already in the list for this item
                                                        return !data.items.some(
                                                            addedItem => addedItem.item_id === currentItem.item_id && addedItem.stock_id === batch.id.toString()
                                                        );
                                                    })
                                                    .map((batch) => (
                                                        <SelectItem key={batch.id} value={batch.id.toString()}>
                                                            <div className="flex flex-col text-xs">
                                                                <span className="font-medium text-slate-900">
                                                                    {batch.batch_no || 'No Batch No'} • {batch.date ? formatDateForDisplay(batch.date) : 'N/A'}
                                                                </span>
                                                                <span className="text-slate-500">
                                                                    Qty: <span className="font-semibold text-green-600">{batch.quantity.toFixed(2)}</span> • Cost: {batch.cost_price.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {/* Stock Availability Helpers */}
                                        {currentItem.stock_id && (
                                            <div className="text-xs text-slate-500 flex justify-between px-1">
                                                <span>{t('Available:')}</span>
                                                <span className="font-semibold text-vismass-blue">
                                                    {currentBatches.find(b => b.id.toString() === currentItem.stock_id)?.quantity.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                        )}
                                        {!currentItem.stock_id && currentStock !== null && (
                                            <div className="text-xs text-slate-500 flex justify-between px-1">
                                                <span>{t('Total Stock:')}</span>
                                                <span className="font-semibold text-vismass-blue">
                                                    {currentStock.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity and Add Button */}
                                    <div className="space-y-2 md:col-span-1">
                                        <Label className="text-sm font-medium text-slate-700">
                                            {t('Quantity')}
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="w-full">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={currentItem.quantity}
                                                    onChange={(e) => updateCurrentItem('quantity', e.target.value)}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddItem();
                                                        }
                                                    }}
                                                    placeholder="e.g., 6"
                                                    className={`border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 ${currentQuantityError ? 'border-red-500 focus:border-red-500' : ''}`}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={handleAddItem}
                                                disabled={
                                                    !currentItem.item_id ||
                                                    !currentItem.quantity ||
                                                    currentQuantityError !== '' ||
                                                    (currentBatches.length > 0 && !currentItem.stock_id)
                                                }
                                                className="bg-vismass-blue hover:bg-vismass-blue/90 text-white shadow-sm whitespace-nowrap"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                {t('Add')}
                                            </Button>
                                        </div>
                                        {currentQuantityError && <p className="text-sm text-red-600 mt-1">{currentQuantityError}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Transfer Summary Table (The "Cart") */}
                            {data.items.some(item => item.item_id) && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <Package className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">{t('Transfer Summary')}</h2>
                                    </div>
                                    <div className="overflow-x-auto bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-4">
                                        <table className="w-full border-collapse border border-slate-300 bg-white rounded-lg shadow-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                                        {t('Item Name')}
                                                    </th>
                                                    <th className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                                        {t('Batch No')}
                                                    </th>
                                                    <th className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                                        {t('Current Stock')}
                                                    </th>
                                                    <th className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                                        {t('Quantity')}
                                                    </th>
                                                    <th className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                                        {t('Cost Price (Rs.)')}
                                                    </th>
                                                    <th className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                                        {t('Total (Rs.)')}
                                                    </th>
                                                    <th className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 w-20">
                                                        {t('Action')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.items
                                                    .map((item, index) => {
                                                        const selectedItem = uniqueItems.find(i => i.ItmKy.toString() === item.item_id);
                                                        const quantity = parseFloat(item.quantity) || 0;
                                                        const costPrice = selectedItem?.cost_price ? Number(selectedItem.cost_price) : 0;
                                                        const total = quantity * costPrice;
                                                        const currentStockVal = stocks[index];

                                                        return (
                                                            <tr key={index} className="hover:bg-slate-50">
                                                                <td className="border border-slate-300 px-4 py-3 text-sm text-slate-900">
                                                                    {selectedItem ? `${selectedItem.ItemCode} - ${selectedItem.ItmNm}` : ''}
                                                                </td>
                                                                <td className="border border-slate-300 px-4 py-3 text-center text-sm text-slate-900">
                                                                    {item.batch_no || '-'}
                                                                </td>
                                                                <td className="border border-slate-300 px-4 py-3 text-center text-sm text-slate-900">
                                                                    {currentStockVal !== null && currentStockVal !== undefined ? currentStockVal.toFixed(2) : '-'}
                                                                </td>
                                                                <td className="border border-slate-300 px-4 py-3 text-center text-sm text-slate-900">
                                                                    {quantity.toFixed(2)}
                                                                </td>
                                                                <td className="border border-slate-300 px-4 py-3 text-right text-sm text-slate-900">
                                                                    {costPrice.toFixed(2)}
                                                                </td>
                                                                <td className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                                                    {total.toFixed(2)}
                                                                </td>
                                                                <td className="border border-slate-300 px-4 py-3 text-center">
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => removeItem(index)}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                {/* Grand Total Row */}
                                                <tr className="bg-vismass-blue/10 border-t-2 border-vismass-blue/20">
                                                    <td colSpan={5} className="border border-slate-300 px-4 py-3 text-right text-sm font-bold text-vismass-blue">
                                                        {t('Grand Total')}
                                                    </td>
                                                    <td className="border border-slate-300 px-4 py-3 text-right text-sm font-bold text-vismass-blue">
                                                        Rs. {data.items
                                                            .reduce((sum, item) => {
                                                                const selectedItem = uniqueItems.find(i => i.ItmKy.toString() === item.item_id);
                                                                const quantity = parseFloat(item.quantity) || 0;
                                                                const costPrice = selectedItem?.cost_price ? Number(selectedItem.cost_price) : 0;
                                                                return sum + (quantity * costPrice);
                                                            }, 0)
                                                            .toFixed(2)}
                                                    </td>
                                                    <td className="border border-slate-300 px-4 py-3"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* PDF Download Section - Prominent */}
                            {data.items.some(item => item.item_id && parseFloat(item.quantity) > 0) && data.from_section_code && data.to_section_code && (
                                <div className="mt-8 mb-8">
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-3 bg-amber-100 rounded-full">
                                                    <Download className="w-6 h-6 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-amber-800">{t('Preview Draft Report')}</h3>
                                                    <p className="text-sm text-amber-700">{t('Preview the transfer details before saving. The official report with Transaction No. will be generated upon completion.')}</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={handleDownloadPdf}
                                                disabled={downloadingPdf}
                                                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 font-medium"
                                            >
                                                {downloadingPdf ? (
                                                    <div className="flex items-center space-x-2">
                                                        <Loader className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        <span>{t('Generating Preview...')}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <Download className="w-5 h-5" />
                                                        <span>{t('Preview Draft')}</span>
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Transfer Details Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Calendar className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">{t('Transfer Details')}</h2>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="transfer_date" className="text-sm font-medium text-slate-700 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-vismass-blue" />
                                        {t('Transfer Date')} *
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="transfer_date"
                                            type="text"
                                            value={transferDateDisplay}
                                            onChange={(e) => {
                                                setTransferDateDisplay(e.target.value);
                                                setData('transfer_date', parseDateFromDisplay(e.target.value));
                                            }}
                                            className="pl-10 border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            placeholder="DD/MM/YYYY"
                                        />
                                    </div>
                                    {errors.transfer_date && <p className="text-sm text-red-600">{errors.transfer_date}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-sm font-medium text-slate-700 flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-vismass-blue" />
                                        {t('Notes (Optional)')}
                                    </Label>
                                    <Input
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder={t('Additional notes')}
                                        className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                    />
                                </div>
                            </div>
                            {/* Submit Button */}
                            <div className="flex justify-end pt-6 border-t border-slate-200">
                                <Button
                                    type="submit"
                                    disabled={processing || data.items.length === 0}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Transferring...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Truck className="w-5 h-5" />
                                            <span>{t('Transfer Stock')}</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-slate-600">
                        <p className="text-sm">Manage your inventory • Transfer stock efficiently</p>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}