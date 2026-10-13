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
import { Head, router } from '@inertiajs/react';
import { Calendar, FileText, Loader, RotateCcw, Search, Printer } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import AppSidebarLayout from '../../layouts/app/app-sidebar-layout';
import { BreadcrumbItem } from '@/types';

interface Category {
    catkey: string;
    cname: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
}

interface Item {
    id: number;
    code: string;
    name: string;
}

interface Company {
    name: string;
    section: string;
    code: string;
    section_code: string;
}

interface StockMovement {
    date: string;
    description: string;
    in_qty: number;
    out_qty: number;
    balance: number;
    reference: string;
}

interface ItemStockMovements {
    item_code: string;
    item_name: string;
    batch_no?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    category_name: string;
    cost_price: number;
    wholesale_price: number;
    movements: StockMovement[];
    running_balance: number;
    current_stock: number;
    first_received_date?: string | null;
    last_received_date?: string | null;
}

interface PrinterDetail {
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    label: string;
}

interface CategoryGroup {
    category_name: string;
    items: ItemStockMovements[];
    total_cost_value: number;
    total_wholesale_value: number;
}

interface Props {
    categories: Category[];
    suppliers: Supplier[];
    sections: Section[];
    items: Item[];
    printerDetails: PrinterDetail[];
    company: Company;
    filters: {
        category?: string;
        as_at_date?: string;
        item_code?: string;
        supplier?: string;
        section?: string;
        brand?: string;
        model?: string;
        serial_number?: string;
    };
    groupedStock?: CategoryGroup[];
    overallTotalCostValue?: number;
    overallTotalWholesaleValue?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },

    {
        title: 'Stock In Hand',
        href: '/reports/stock-in-hand',
    },
];

export default function StockInHand({
    categories = [],
    suppliers = [],
    sections = [],
    items = [],
    printerDetails = [],
    company,
    filters,
    groupedStock = [],
    overallTotalCostValue = 0,
    overallTotalWholesaleValue = 0,
}: Props) {
    const [category, setCategory] = useState(filters.category || 'all');
    const [asAtDate, setAsAtDate] = useState<Date | undefined>(() => {
        return filters.as_at_date
            ? new Date(filters.as_at_date)
            : (() => {
                const today = new Date();
                return today;
            })();
    });
    const [itemCode, setItemCode] = useState(filters.item_code || 'all');
    const [supplier, setSupplier] = useState(filters.supplier || 'all');
    const [section, setSection] = useState(() => {
        const userSection = sections.find(s => s.id.toString() === filters.section);
        if (userSection) return userSection.id.toString();

        const defaultSection = sections.find(s => s.name === company.section);
        return defaultSection ? defaultSection.id.toString() : '';
    });
    const [brand, setBrand] = useState(filters.brand || '');
    const [model, setModel] = useState(filters.model || '');
    const [serialNumber, setSerialNumber] = useState(filters.serial_number || '');
    const [isLoading, setIsLoading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };
    const [hasAppliedFilters, setHasAppliedFilters] = useState(true);
    const [searchItem, setSearchItem] = useState('');
    const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
    const [searchPrinter, setSearchPrinter] = useState('');
    const [printerDropdownOpen, setPrinterDropdownOpen] = useState(false);

    useEffect(() => {
        console.log('User section:', company.section);
    }, [company.section]);

    const filteredItems = useMemo(() => {
        const search = searchItem.toLowerCase();
        return items.filter((item) =>
            item.code.toLowerCase().includes(search) ||
            item.name.toLowerCase().includes(search)
        ).slice(0, 50);
    }, [items, searchItem]);

    const filteredPrinters = useMemo(() => {
        const search = searchPrinter.toLowerCase();
        if (!search) return printerDetails.slice(0, 50);

        return printerDetails.filter((printer) =>
            printer.label.toLowerCase().includes(search)
        ).slice(0, 50);
    }, [printerDetails, searchPrinter]);

    // Calculate overall sums
    const overallSumCostValue = groupedStock.reduce(
        (sum, cat) =>
            sum +
            cat.items.reduce(
                (s, item) => s + item.cost_price * item.current_stock,
                0,
            ),
        0,
    );
    const overallSumWholesaleValue = groupedStock.reduce(
        (sum, cat) =>
            sum +
            cat.items.reduce(
                (s, item) => s + item.wholesale_price * item.current_stock,
                0,
            ),
        0,
    );

    // Manual filter application
    const handleApplyFilters = () => {
        if (category && asAtDate) {
            setIsLoading(true);
            setHasAppliedFilters(true);
            const params = new URLSearchParams();
            params.append('category', category === 'all' ? '' : category);
            params.append('as_at_date', asAtDate.toISOString().split('T')[0]);
            if (itemCode && itemCode !== 'all')
                params.append('item_code', itemCode);
            if (supplier && supplier !== 'all')
                params.append('supplier', supplier);
            if (section) params.append('section', section);
            if (brand) params.append('brand', brand);
            if (model) params.append('model', model);
            if (serialNumber) params.append('serial_number', serialNumber);

            router.get(
                `/reports/stock-in-hand?${params.toString()}`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsLoading(false),
                    onError: () => setIsLoading(false),
                },
            );
        }
    };

    const handleResetFilters = () => {
        setIsLoading(true);
        setCategory('all');
        setAsAtDate(() => {
            const today = new Date();
            return today;
        });
        setItemCode('all');
        setSupplier('all');
        const userSection = sections.find(s => s.name === company.section);
        setSection(userSection ? userSection.id.toString() : '');
        setBrand('');
        setModel('');
        setSerialNumber('');
        setSearchPrinter('');
        setHasAppliedFilters(false);
        // Navigate to the base URL without filters
        router.get(
            '/reports/stock-in-hand',
            {},
            {
                preserveState: false,
                preserveScroll: false,
                onFinish: () => setIsLoading(false),
                onError: () => setIsLoading(false),
            },
        );
    };

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Stock In Hand Report')}>
                <style>{`
                    @media print {
                        @page {
                            size: landscape;
                            margin: 10mm;
                            margin-top: 0;
                        }
                        
                        @page :first {
                            margin-top: 10mm;
                        }
                        
                        body, html {
                            height: auto !important;
                            overflow: visible !important;
                        }
                        
                        body * {
                            visibility: hidden;
                        }
                        
                        /* Reset all parent containers to allow multi-page flow */
                        body,
                        body > div,
                        body > div > div,
                        [data-slot="sidebar-wrapper"],
                        [data-slot="sidebar-inset"],
                        main,
                        .min-h-screen,
                        .min-h-svh {
                            position: static !important;
                            overflow: visible !important;
                            height: auto !important;
                            min-height: 0 !important;
                            max-height: none !important;
                            display: block !important;
                        }
                        
                        #printable-report,
                        #printable-report * {
                            visibility: visible;
                        }
                        
                        #printable-report {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background: white;
                            height: auto !important;
                            overflow: visible !important;
                        }
                        
                        .no-print {
                            display: none !important;
                        }
                        
                        .print-header {
                            margin-bottom: 20px;
                            border-bottom: 2px solid #000;
                            padding-bottom: 10px;
                            display: block !important;
                        }
                        
                        .print-company-name {
                            font-size: 24px;
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 5px;
                        }
                        
                        .print-report-title {
                            font-size: 18px;
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 10px;
                        }
                        
                        .print-info-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 12px;
                            margin-bottom: 3px;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 10px;
                            page-break-inside: auto;
                            color: #000 !important;
                        }
                        
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                        
                        thead {
                            display: table-header-group;
                        }
                        
                        tfoot {
                            display: table-footer-group;
                        }
                        
                        th, td {
                            border: 1px solid #000;
                            padding: 4px;
                            color: #000 !important;
                        }
                        
                        th {
                            background-color: #e5e7eb !important;
                            font-weight: bold;
                            text-align: left;
                            color: #000 !important;
                        }
                        
                        .category-header {
                            background-color: #dbeafe !important;
                            font-weight: bold;
                            padding: 8px 4px;
                            color: #000 !important;
                        }
                        
                        .category-total {
                            background-color: #f3f4f6 !important;
                            font-weight: bold;
                            color: #000 !important;
                        }
                        
                        .overall-total {
                            background-color: #d1d5db !important;
                            font-weight: bold;
                            font-size: 11px;
                            color: #000 !important;
                        }
                        
                        .print-footer {
                            margin-top: 20px;
                            padding-top: 10px;
                            border-top: 1px solid #000;
                            font-size: 10px;
                            display: flex !important;
                            justify-content: space-between;
                            color: #000 !important;
                        }
                    }
                `}</style>
            </Head>

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow no-print">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => window.history.back()}
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                    title={t('Go Back')}
                                >
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Stock In Hand Report')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('View and analyze current stock levels')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handlePrint}
                                disabled={isLoading || !groupedStock || groupedStock.length === 0}
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                {t('Print Report')}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">

                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden no-print">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {t('Report Filters')}
                                        </h3>
                                        <p className="text-white/80 text-sm mt-1">
                                            {t('Configure filters to generate stock reports')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {isLoading && (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader className="h-6 w-6 animate-spin mr-2 text-vismass-blue" />
                                        <span className="text-gray-600">{t('Loading stock data...')}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {/* Section Filter */}
                                    <div className="space-y-2">
                                        <Label htmlFor="section">{t('Section')}</Label>
                                        <Select
                                            value={section}
                                            onValueChange={(value) => {
                                                setSection(value);
                                            }}
                                        >
                                            <SelectTrigger className="border-slate-300 bg-white focus:border-vismass-blue focus:ring-vismass-blue">
                                                <SelectValue placeholder={t('Select section')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sections.map((sec) => (
                                                    <SelectItem key={sec.id} value={sec.id.toString()}>
                                                        {sec.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Category Filter */}
                                    <div className="space-y-2">
                                        <Label htmlFor="category">{t('Category')}</Label>
                                        <Select
                                            value={category}
                                            onValueChange={(value) => {
                                                setCategory(value);
                                            }}
                                        >
                                            <SelectTrigger className="border-slate-300 bg-white focus:border-vismass-blue focus:ring-vismass-blue">
                                                <SelectValue placeholder={t('Select category')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Categories')}</SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.catkey} value={cat.catkey}>
                                                        {cat.cname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Item Code Filter */}
                                    <div className="space-y-2">
                                        <Label htmlFor="item_code">{t('Item Code (Optional)')}</Label>
                                        <Select
                                            value={itemCode}
                                            onValueChange={(value) => {
                                                setItemCode(value);
                                                setSearchItem('');
                                                setItemDropdownOpen(false);
                                            }}
                                            open={itemDropdownOpen}
                                            onOpenChange={setItemDropdownOpen}
                                        >
                                            <SelectTrigger className="border-slate-300 bg-white focus:border-vismass-blue focus:ring-vismass-blue">
                                                <SelectValue placeholder={t('Select item code')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <div className="relative">
                                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                                        <input
                                                            type="text"
                                                            placeholder={t('Search code or name...')}
                                                            className="w-full rounded-md border py-2 pr-3 pl-9 text-sm"
                                                            value={searchItem}
                                                            onChange={(e) => setSearchItem(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    <SelectItem value="all">{t('All Items')}</SelectItem>
                                                    {filteredItems.length > 0 ? (
                                                        filteredItems.map((item, index) => (
                                                            <SelectItem key={`${item.code}-${index}`} value={item.code}>
                                                                {item.code} - {item.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="px-2 py-3 text-center text-sm text-gray-500">
                                                            {t('No items found')}
                                                        </div>
                                                    )}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Supplier Filter */}
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier">{t('Supplier (Optional)')}</Label>
                                        <Select
                                            value={supplier}
                                            onValueChange={(value) => {
                                                setSupplier(value);
                                            }}
                                        >
                                            <SelectTrigger className="border-slate-300 bg-white focus:border-vismass-blue focus:ring-vismass-blue">
                                                <SelectValue placeholder={t('Select supplier')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Suppliers')}</SelectItem>
                                                {suppliers.map((sup) => (
                                                    <SelectItem key={sup.id} value={sup.id.toString()}>
                                                        {sup.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* As at Date */}
                                    <div className="space-y-2">
                                        <Label htmlFor="as_at_date">{t('As at Date')}</Label>
                                        <div className="flex items-center">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            <Input
                                                type="date"
                                                value={asAtDate ? asAtDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => setAsAtDate(e.target.value ? new Date(e.target.value) : undefined)}
                                                className="border-slate-300 bg-white focus:border-vismass-blue focus:ring-vismass-blue"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        onClick={handleApplyFilters}
                                        disabled={isLoading || !asAtDate}
                                        className="bg-gradient-to-r from-vismass-blue to-vismass-grey hover:from-vismass-blue/90 hover:to-vismass-grey/90 text-white border-0"
                                    >
                                        {isLoading ? (
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <FileText className="mr-2 h-4 w-4" />
                                        )}
                                        {isLoading ? t('Loading...') : t('Apply Filters')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleResetFilters}
                                        disabled={isLoading}
                                        className="border-slate-300 hover:bg-slate-50"
                                    >
                                        {isLoading ? (
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                        )}
                                        {isLoading ? t('Resetting...') : t('Reset Filters')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Stock In Hand Section */}
                        {isLoading ? (
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {t('Stock In Hand Report')}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center p-12">
                                    <div className="text-center">
                                        <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-vismass-blue" />
                                        <h3 className="text-lg font-medium text-gray-900">{t('Loading Stock Data')}</h3>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {t('Please wait while we fetch the latest stock data...')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : hasAppliedFilters && groupedStock && groupedStock.length > 0 ? (
                            <div id="printable-report">
                                {/* Print Header - Only visible in print */}
                                <div className="print-header" style={{ display: 'none' }}>
                                    <div className="mb-4 text-center">
                                        <div className="text-center">
                                            <div className="text-3xl font-black" style={{ marginBottom: '5px' }}>
                                                <span style={{ color: '#00aeef' }}>VIS</span>
                                                <span style={{ color: '#737578' }}>MASS</span>
                                            </div>
                                            <div className="text-sm text-slate-600">Stock In Hand Report</div>
                                        </div>
                                    </div>
                                    <div className="print-report-title">STOCK IN HAND REPORT</div>
                                    <div className="print-info-row">
                                        <span><strong>Section:</strong> {sections.find(s => s.id.toString() === section)?.name || 'All Sections'}</span>
                                        <span><strong>Report Date:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="print-info-row">
                                        <span><strong>Category:</strong> {category === 'all' ? 'All Categories' : categories.find(c => c.catkey === category)?.cname || category}</span>
                                        <span><strong>As At Date:</strong> {asAtDate?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    {itemCode && itemCode !== 'all' && (
                                        <div className="print-info-row">
                                            <span><strong>Item Code:</strong> {itemCode}</span>
                                            <span></span>
                                        </div>
                                    )}
                                    {supplier && supplier !== 'all' && (
                                        <div className="print-info-row">
                                            <span><strong>Supplier:</strong> {suppliers.find(s => s.id.toString() === supplier)?.name || supplier}</span>
                                            <span></span>
                                        </div>
                                    )}
                                    {brand && (
                                        <div className="print-info-row">
                                            <span><strong>Brand:</strong> {brand}</span>
                                            <span></span>
                                        </div>
                                    )}
                                    {model && (
                                        <div className="print-info-row">
                                            <span><strong>Model:</strong> {model}</span>
                                            <span></span>
                                        </div>
                                    )}
                                    {serialNumber && (
                                        <div className="print-info-row">
                                            <span><strong>Serial Number:</strong> {serialNumber}</span>
                                            <span></span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4 no-print">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    {t('Stock In Hand Report')}
                                                </h3>
                                                <p className="text-white/80 text-sm mt-1">
                                                    {t('Detailed stock information by category')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {groupedStock.map((categoryGroup, categoryIndex) => (
                                            <div key={categoryIndex} className="mb-8 last:mb-0">
                                                <h3 className="text-lg font-semibold mb-4">
                                                    {categoryGroup.category_name} ({categoryGroup.items.length} {t('items')})
                                                </h3>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm border border-slate-300">
                                                        <thead className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left font-bold border-b border-slate-300">{t('NO')}</th>
                                                                <th className="px-4 py-3 text-left font-bold border-b border-slate-300">{t('Item Code')}</th>
                                                                <th className="px-4 py-3 text-left font-bold border-b border-slate-300">{t('Item Name')}</th>
                                                                <th className="px-4 py-3 text-left font-bold border-b border-slate-300">{t('Batch No')}</th>
                                                                <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Stock')}</th>
                                                                <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Cost Price')} (RS)</th>
                                                                <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Wholesale Price')} (RS)</th>
                                                                <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Cost Value')} (RS)</th>
                                                                <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Wholesale Value')} (RS)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {categoryGroup.items.map((item, itemIndex) => (
                                                                <tr key={itemIndex} className="hover:bg-slate-50">
                                                                    <td className="px-4 py-3 text-left border-b border-slate-200">{itemIndex + 1}</td>
                                                                    <td className="px-4 py-3 text-left font-medium border-b border-slate-200">{item.item_code}</td>
                                                                    <td className="px-4 py-3 text-left border-b border-slate-200">{item.item_name}</td>
                                                                    <td className="px-4 py-3 text-left border-b border-slate-200">
                                                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${item.batch_no === 'N/A'
                                                                                ? 'bg-gray-100 text-gray-600'
                                                                                : 'bg-blue-100 text-blue-700'
                                                                            }`}>
                                                                            {item.batch_no || 'N/A'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right font-bold border-b border-slate-200">
                                                                        {Number(item.current_stock).toFixed(2)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right border-b border-slate-200">
                                                                        {Number(item.cost_price).toFixed(2)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right border-b border-slate-200">
                                                                        {Number(item.wholesale_price).toFixed(2)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right border-b border-slate-200">
                                                                        {Number(item.cost_price * item.current_stock).toFixed(2)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right border-b border-slate-200">
                                                                        {Number(item.wholesale_price * item.current_stock).toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {/* Category Totals */}
                                                            {/* Category Totals */}
                                                            {(() => {
                                                                const catSumCostValue = categoryGroup.items.reduce((s, item) => s + item.cost_price * item.current_stock, 0);
                                                                const catSumWholesaleValue = categoryGroup.items.reduce((s, item) => s + item.wholesale_price * item.current_stock, 0);
                                                                return (
                                                                    <tr className="bg-slate-100 font-bold">
                                                                        <td className="px-4 py-3 text-right border-b border-slate-300" colSpan={7}>
                                                                            {t('Total for')} {categoryGroup.category_name}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right border-b border-slate-300">{Number(catSumCostValue).toFixed(2)}</td>
                                                                        <td className="px-4 py-3 text-right border-b border-slate-300">{Number(catSumWholesaleValue).toFixed(2)}</td>
                                                                    </tr>
                                                                );
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Overall Totals */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm border border-slate-300">
                                                <thead className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white">
                                                    <tr>
                                                        {/* <th className="px-4 py-3 text-left font-bold border-b border-slate-300">{t('NO')}</th>
                                            <th className="px-4 py-3 text-left font-bold border-b border-slate-300">{t('Item Code')}</th>
                                            <th className="px-4 py-3 text-left font-bold border-b border-slate-300">{t('Item Name')}</th>
                                            <th className="px-4 py-3 text-left font-bold border-b border-slate-300">{t('Batch No')}</th>
                                            <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Stock')}</th>
                                            <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Cost Price')} (RS)</th>
                                            <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Wholesale Price')} (RS)</th>
                                            <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Cost Value')} (RS)</th>
                                            <th className="px-4 py-3 text-right font-bold border-b border-slate-300">{t('Wholesale Value')} (RS)</th> */}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* <tr className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white font-bold">
                                            <td className="px-4 py-3 text-left border-b border-slate-300" colSpan={7}>
                                                {t('Overall Total')}
                                            </td>
                                            <td className="px-4 py-3 text-right border-b border-slate-300">{Number(overallSumCostValue).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right border-b border-slate-300">{Number(overallSumWholesaleValue).toFixed(2)}</td>
                                        </tr> */}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Print Footer - Only visible in print */}
                                    <div className="print-footer" style={{ display: 'none' }}>
                                        <span>Generated by Unitec Software Solution</span>
                                        <span>Printed on: {new Date().toLocaleString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                </div>
                            </div>
                        ) : hasAppliedFilters ? (
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="text-center p-8">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">{t('No Stock Data Found')}</h3>
                                    <p className="text-sm text-slate-600 mt-2">
                                        {t('No stock data was found for the selected filters. Try selecting different filters.')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="text-center p-8">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">{t('Ready to Load Stock Data')}</h3>
                                    <p className="text-sm text-slate-600 mt-2">
                                        {t('Please select filters and click "Apply Filters" to load stock data.')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AppSidebarLayout>
    );
}
