import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Printer, Filter, Search, X, Package, Eye } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface Category {
    catkey: string;
    cname: string;
}

interface Section {
    value: string;
    label: string;
}

interface Company {
    name: string;
    section: string;
    code: string;
    section_code: string;
    primary_color?: string;
    secondary_color?: string;
}

interface Item {
    ItmKy: string;
    ItemCode: string;
    ItmNm: string;
    category_name: string;
    supplier_name: string;
    unit_name: string;
    CosPri: number;
    SlsPri: number;
    WholePrice: number;
    source_section?: string;
    Qty?: number;
    PurchaseKey?: string;
    batch_no?: string;
    BarCode?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
}

interface ItemListProps extends PageProps {
    items: Item[];
    categories: Category[];
    sections: Section[];
    company: Company;
    filters: {
        category: string;
        section: string;
        search?: string;
    };
    error?: string;
    debug_error?: string;
}

export default function ItemList({ auth, items, categories, sections, company, filters, error, debug_error }: ItemListProps) {
    const [selectedCategory, setSelectedCategory] = useState(filters.category);
    const [selectedSection, setSelectedSection] = useState(filters.section);
    const [search, setSearch] = useState(filters.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('Item List Report'),
            href: '#',
        },
    ];

    const handleFilterChange = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/item-list', {
            category: selectedCategory,
            section: selectedSection,
            search
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSelectedCategory('all');
        setSelectedSection('all');
        setSearch('');
        router.get('/reports/item-list', {}, { preserveState: true, replace: true });
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '-';
        return `Rs ${numAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Item List Report">
                <style>{`
                    @media print {
                        @page {
                            size: A4 portrait;
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
                        
                        #printable-items,
                        #printable-items * {
                            visibility: visible;
                        }
                        
                        #printable-items {
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
                        
                        #printable-items > table {
                            display: table !important;
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 7px;
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
                        
                        th, td {
                            border: 1px solid #000;
                            padding: 2px;
                            color: #000 !important;
                        }
                        
                        th {
                            background-color: #e5e7eb !important;
                            font-weight: bold;
                            text-align: left;
                            color: #000 !important;
                        }
                        
                        /* Column Width Priorities */
                        th:nth-child(1), td:nth-child(1) { /* Item Code */
                            width: 12%;
                            font-weight: bold;
                        }
                        
                        th:nth-child(2), td:nth-child(2) { /* Item Name */
                            width: 25%;
                            font-weight: bold;
                        }
                        
                        th:nth-child(3), td:nth-child(3) { /* Category */
                            width: 10%;
                        }
                        
                        th:nth-child(4), td:nth-child(4) { /* Supplier */
                            width: 10%;
                        }
                        
                        th:nth-child(5), td:nth-child(5) { /* Unit */
                            width: 6%;
                        }
                        
                        th:nth-child(6), td:nth-child(6),
                        th:nth-child(7), td:nth-child(7) { /* Prices */
                            width: 9%;
                            text-align: right;
                        }
                        
                        th:nth-child(8), td:nth-child(8) { /* Quantity */
                            width: 6%;
                            text-align: right;
                        }
                        
                        th:nth-child(9), td:nth-child(9),
                        th:nth-child(10), td:nth-child(10) { /* Barcode, Brand */
                            width: 11%;
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
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Package className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Item List Report')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Comprehensive list of all items')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200 no-print"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                {t('Print Report')}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        <div id="printable-items">
                            {/* Print Header - Only visible in print */}
                            <div className="print-header" style={{ display: 'none' }}>
                                <div className="mb-4 text-center">
                                    <div className="text-center">
                                        <div className="text-3xl font-black" style={{ marginBottom: '5px' }}>
                                            <span style={{ color: '#00aeef' }}>VIS</span>
                                            <span style={{ color: '#737578' }}>MASS</span>
                                        </div>
                                        <div className="text-sm text-slate-600">Item List Report</div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Card */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden no-print">
                                <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{t('Items List')}</h3>
                                            <p className="text-white/80 text-sm mt-1">{t('Comprehensive list of all items')}</p>
                                        </div>
                                        <div className="text-white/80 text-sm">{t('Generated on')}: {new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Filters */}
                                    <Card className="rounded-2xl border-slate-200 bg-white shadow-md mb-6 no-print">
                                        <CardContent className="p-6">
                                            <form onSubmit={handleFilterChange} className="space-y-4">
                                                <div className="w-full">
                                                    <Label htmlFor="search-filter" className="text-sm font-medium text-gray-700">
                                                        {t('Search')}
                                                    </Label>
                                                    <div className="relative mt-2">
                                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                        <input
                                                            id="search-filter"
                                                            type="text"
                                                            placeholder={t('Search by item code, name...')}
                                                            value={search}
                                                            onChange={(e) => setSearch(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="section-filter" className="text-sm font-medium text-gray-700">
                                                            {t('Section')}
                                                        </Label>
                                                        <div className="relative">
                                                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <select
                                                                id="section-filter"
                                                                value={selectedSection}
                                                                onChange={(e) => setSelectedSection(e.target.value)}
                                                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition appearance-none"
                                                            >
                                                                {sections.map((section) => (
                                                                    <option key={section.value} value={section.value}>
                                                                        {section.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                                                            {t('Category')}
                                                        </Label>
                                                        <div className="relative">
                                                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <select
                                                                id="category-filter"
                                                                value={selectedCategory}
                                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition appearance-none"
                                                            >
                                                                <option value="all">{t('All Categories')}</option>
                                                                {categories.map((category) => (
                                                                    <option key={category.catkey} value={category.catkey}>
                                                                        {category.cname}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center rounded-lg bg-vismass-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {t('Apply')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={clearFilters}
                                                        className="inline-flex items-center rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-slate-400"
                                                    >
                                                        {t('Reset')}
                                                    </button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>

                                    {error && (
                                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                            <p className="text-red-800">{error}</p>
                                            {debug_error && (
                                                <p className="text-red-600 text-sm mt-2">Debug: {debug_error}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Items Table */}
                                    <div id="print-area">
                                        <div className="text-center mb-4 hidden print:block">
                                            <h1 className="text-2xl font-bold">{company.name}</h1>
                                            <h2 className="text-xl font-semibold">Item List Report</h2>
                                            <p className="text-sm">Generated on: {new Date().toLocaleDateString()}</p>
                                        </div>
                                        {items.length > 0 ? (
                                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                        <tr>
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">Item Code</th>
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">Item Name</th>
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">Category</th>
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">Supplier</th>
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">Unit</th>
                                                            <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">Sale Price</th>
                                                            <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">Whole Price</th>
                                                            <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">Quantity</th>
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">Barcode</th>
                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">Brand</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {items.map((item) => (
                                                            <tr key={item.ItmKy} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.ItemCode}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.ItmNm}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.category_name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.supplier_name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.unit_name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(item.SlsPri)}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(item.WholePrice)}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{item.Qty ?? '-'}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.BarCode ?? '-'}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.brand ?? '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                                    <Package className="h-12 w-12" />
                                                </div>
                                                <h3 className="text-sm font-medium text-gray-900 mb-2">{t('No items found')}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {t('Try adjusting your search or filter criteria.')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Print Table - Only visible in print */}
                            <table style={{ display: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>Item Code</th>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th>Supplier</th>
                                        <th>Unit</th>
                                        <th>Sale Price</th>
                                        <th>Whole Price</th>
                                        <th>Quantity</th>
                                        <th>Barcode</th>
                                        <th>Brand</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item: Item) => (
                                        <tr key={item.ItmKy}>
                                            <td>{item.ItemCode}</td>
                                            <td>{item.ItmNm}</td>
                                            <td>{item.category_name}</td>
                                            <td>{item.supplier_name}</td>
                                            <td>{item.unit_name}</td>
                                            <td>{formatCurrency(item.SlsPri)}</td>
                                            <td>{formatCurrency(item.WholePrice)}</td>
                                            <td>{item.Qty ?? '-'}</td>
                                            <td>{item.BarCode ?? '-'}</td>
                                            <td>{item.brand ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Print Footer - Only visible in print */}
                            <div className="print-footer" style={{ display: 'none' }}>
                                <span>Generated by Unitec Software Solution</span>
                                <span>
                                    Printed on: {new Date().toLocaleString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-12 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50 no-print">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                            <p className="text-xs text-gray-600">© UNITEC POS System • {t('Inventory Management')}</p>
                            <p className="text-xs text-gray-500">v1.0.0 • {t('Comprehensive Item Reporting')}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}