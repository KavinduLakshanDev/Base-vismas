// Printing Section Products - Index Page
import { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import {
    Calendar,
    Package,
    Search,
    Printer,
    DollarSign,
    Building2,
    FileText,
    X,
    Filter
} from 'lucide-react';
import Pagination, { PaginationLink, PaginationMeta } from '@/components/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('POS System'),
        href: '/pos',
    },
    {
        title: t('Printing Section Products'),
        href: '#',
    },
];

interface Product {
    id: number;
    product_name: string;
    brand: string;
    model: string;
    serial_number: string;
    barcode: string;
    qty: number;
    cost_price: number;
    retail_price: number;
    wholesale_price: number;
    extra_price: number;
    cc_price: number;
    grn_no: string;
    grn_date: string;
    supplier_name: string;
    batch_no: string;
    created_at: string;
}

interface Section {
    id: number;
    name: string;
    section_code: string;
}

interface ProductsData extends PaginationMeta {
    data: Product[];
    links: PaginationLink[];
}

interface Props {
    products: ProductsData;
    sections: Section[];
    filters: {
        search?: string;
        stock_location?: string;
    };
}


export default function PrintingSectionProductsIndex({ products, sections = [], filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [stockLocation, setStockLocation] = useState(filters.stock_location || 'all');
    const isFirstRender = useRef(true);

    // Safe wrapper for products data
    const safeProducts = {
        data: Array.isArray(products?.data) ? products.data : [],
        links: Array.isArray(products?.links) ? products.links : [],
        meta: products,
    };

    // Auto-search effect
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(
                '/pos/printing-section-products',
                {
                    search: searchTerm,
                    stock_location: stockLocation === 'all' ? '' : stockLocation,
                },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, stockLocation]);

    // Calculate statistics
    const totalProducts = safeProducts.data.length;
    const totalValue = safeProducts.data.reduce((sum, product) => sum + (product.cost_price * product.qty), 0);
    const uniqueBrands = new Set(safeProducts.data.map(p => p.brand).filter(b => b)).size;
    const uniqueSuppliers = new Set(safeProducts.data.map(p => p.supplier_name).filter(s => s !== 'N/A')).size;



    const clearFilters = () => {
        setSearchTerm('');
        setStockLocation('all');
        router.get('/pos/printing-section-products', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const formatPrice = (price: number) => {
        return `Rs ${price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="min-h-screen bg-slate-50">
                    <Head title={t('Printing Section Products')} />

                    {/* Header */}
                    <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-lg bg-white/20 p-2 shadow">
                                        <Printer className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-white">
                                            {t('Printing Section Products')}
                                        </h1>
                                        <p className="text-xs text-white/80">
                                            {t('View all products from GRN entries in printing section')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
                        <div className="px-4 sm:px-0">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                    <div className="flex items-center">
                                        <div className="rounded-lg bg-vismass-blue p-2 shadow-sm">
                                            <Package className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs font-medium text-gray-600">{t('Total Products')}</p>
                                            <p className="text-lg font-bold text-gray-900">{totalProducts}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                    <div className="flex items-center">
                                        <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                            <DollarSign className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs font-medium text-gray-600">{t('Total Value')}</p>
                                            <p className="text-lg font-bold text-gray-900">{formatPrice(totalValue)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                    <div className="flex items-center">
                                        <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                            <Building2 className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs font-medium text-gray-600">{t('Unique Brands')}</p>
                                            <p className="text-lg font-bold text-gray-900">{uniqueBrands}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                    <div className="flex items-center">
                                        <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                            <FileText className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs font-medium text-gray-600">{t('Suppliers')}</p>
                                            <p className="text-lg font-bold text-gray-900">{uniqueSuppliers}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Card */}
                            <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden">
                                <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">
                                                {t('Printing Section Product List')}
                                            </h3>
                                            <p className="text-white/80 text-xs mt-0.5">
                                                {t('Products from GRN entries in printing section')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    {/* Filters */}
                                    <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        {t('Search')}
                                                    </label>
                                                    <Input
                                                        type="text"
                                                        placeholder={t('Product name, brand, model...')}
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full text-sm py-2"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        {t('Stock Location')}
                                                    </label>
                                                    <Select
                                                        value={stockLocation}
                                                        onValueChange={setStockLocation}
                                                    >
                                                        <SelectTrigger className="w-full text-sm py-2">
                                                            <SelectValue placeholder={t('Select a location')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">{t('All Sections')}</SelectItem>
                                                            {sections.map((section) => (
                                                                <SelectItem key={section.id} value={section.section_code}>
                                                                    {section.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-end gap-2">

                                                    <button
                                                        onClick={clearFilters}
                                                        className="inline-flex items-center bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                                                    >
                                                        <Filter className="mr-1.5 h-3.5 w-3.5" />
                                                        {t('Clear')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Products Table */}
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                            {t('Product Details')}
                                                        </th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                            {t('Pricing')}
                                                        </th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                            {t('GRN Info')}
                                                        </th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                            {t('Supplier')}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {safeProducts.data.map((product) => (
                                                        <tr key={product.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-8 w-8">
                                                                        <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                                                                            <Package className="h-3.5 w-3.5 text-sky-600" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-2.5">
                                                                        <div className="text-xs font-medium text-gray-900">
                                                                            {product.product_name || 'Unknown Product'}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {product.brand && <span>{t('Brand')}: {product.brand}</span>}
                                                                            {product.brand && product.model && <span> • </span>}
                                                                            {product.model && <span>{t('Model')}: {product.model}</span>}
                                                                        </div>
                                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                                            {product.serial_number && <span>{t('SN')}: {product.serial_number}</span>}
                                                                            {product.barcode && <span> • {t('Barcode')}: {product.barcode}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <div className="text-xs text-gray-900">
                                                                    <div>{t('Qty')}: {product.qty}</div>
                                                                    <div>{t('Cost')}: {formatPrice(product.cost_price)}</div>
                                                                    <div>{t('Retail')}: {formatPrice(product.retail_price)}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <div className="text-xs text-gray-900">
                                                                    <div className="font-medium">{product.grn_no}</div>
                                                                    <div className="text-gray-500 flex items-center mt-0.5">
                                                                        <Calendar className="h-3 w-3 mr-1" />
                                                                        {product.grn_date}
                                                                    </div>
                                                                    {product.batch_no && (
                                                                        <div className="text-gray-500">
                                                                            {t('Batch')}: {product.batch_no}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-xs text-gray-500">
                                                                {product.supplier_name}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        <Pagination links={safeProducts.links} meta={safeProducts.meta} />

                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="mt-6 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                            <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                                <p className="text-xs text-gray-500">© VISMASS POS System • {t('Printing Section Products')} • v1.0.0</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </AppLayout>
        </>
    );
}