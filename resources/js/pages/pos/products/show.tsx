import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    Package,
    CheckCircle,
    DollarSign,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SupplierOption {
    AdrKy: number;
    AccKy: any;
    full_name: any;
    FstNm: any;
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('Product Management'),
        href: '/pos/products',
    },
    {
        title: t('Product Details'),
        href: '#',
    },
];

interface Product {
    ItmKy: number;
    ItemCode: string;
    BarCode?: string;
    ItmNm: string;
    EnglishName?: string;
    CosPri?: number;
    SlsPri?: number;
    ReOrdlLvl?: number;
    Status?: string;
    VATItem?: boolean;
    fInAct?: boolean;
    catkey?: string;
    SupKey?: number;
    UnitKy?: number;
    NCostPrice?: number;
    ExtraPrice?: number;
    WholePrice?: number;
    ScallItem?: boolean;
    CCPrice?: number;
}

interface Props {
    item: Product;
    suppliers?: SupplierOption[];
    canDelete: boolean;
    canManage: boolean;
}

export default function ProductShow({ item, suppliers = [], canDelete, canManage }: Props) {
    const [branchReorderLevel, setBranchReorderLevel] = useState<number | null>(
        null,
    );
    const [hasReorderLevel, setHasReorderLevel] = useState(false);
    const [loading, setLoading] = useState(true);
    const [barcodeQuantity, setBarcodeQuantity] = useState(1);

    // Fetch branch-specific reorder level
    useEffect(() => {
        const fetchReorderLevel = async () => {
            try {
                // const response = await fetch(
                //     `/pos/api/reorder-level/${item.ItemCode}`,
                //     {
                //         headers: {
                //             Accept: 'application/json',
                //             'X-Requested-With': 'XMLHttpRequest',
                //         },
                //         credentials: 'include',
                //     },
                // );

                // if (response.ok) {
                //     const data = await response.json();
                //     setBranchReorderLevel(data.reorder_level || null);
                //     setHasReorderLevel(data.has_reorder_level || false);
                // }
            } catch (error) {
                console.error('Error fetching reorder level:', error);
            } finally {
                setLoading(false);
            }
        };

        // fetchReorderLevel(); // API route not implemented
    }, [item.ItemCode]);

    const formatPrice = (price?: number) => {
        if (!price) return 'N/A';
        return `Rs ${price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date?: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-GB');
    };

    const formatCurrency = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `Rs ${numAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-slate-50">
                <Head title={`${t('Product Details')} - ${item.ItmNm}`} />

                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Package className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Product Details')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {item.ItmNm} ({item.ItemCode})
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/pos/products/${item.ItmKy}/edit`}
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue transition-all hover:bg-slate-100"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t('Edit Product')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2 shadow">
                                        <Package className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Status')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {!item.fInAct ? t('Active') : t('Inactive')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-green-600 p-2 shadow">
                                        <DollarSign className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Sale Price')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {item.SlsPri ? formatCurrency(item.SlsPri) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-600 p-2 shadow">
                                        <DollarSign className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Cost Price')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {item.CosPri ? formatCurrency(item.CosPri) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-purple-600 p-2 shadow">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('VAT Item')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {item.VATItem ? t('Yes') : t('No')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-indigo-600 p-2 shadow">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Scale Item')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {item.ScallItem ? t('Yes') : t('No')}
                                        </p>
                                    </div>
                                </div>
                            </div> */}
                        </div>

                        {/* Main Content Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4">
                                <h3 className="text-lg font-semibold text-white">
                                    {t('Product Information')}
                                </h3>
                                <p className="text-white/80 text-sm mt-1">
                                    {t('Detailed product specifications and pricing')}
                                </p>
                            </div>

                            <div className="p-6">
                                {/* Product Details Grid */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    {/* Left Side - Basic Information */}
                                    <div>
                                        <h4 className="mb-4 text-sm font-bold text-slate-900 uppercase">{t('Basic Information')}</h4>
                                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-gray-600 font-medium">{t('Product Name')}:</span>
                                                <span className="text-sm font-semibold text-gray-900 text-right flex-1 ml-4">{item.ItmNm}</span>
                                            </div>

                                            {item.EnglishName && (
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600 font-medium">{t('English Name')}:</span>
                                                    <span className="text-sm font-semibold text-gray-900 text-right flex-1 ml-4">{item.EnglishName}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-gray-600 font-medium">{t('Item Code')}:</span>
                                                <span className="text-sm font-semibold text-gray-900 text-right flex-1 ml-4">{item.ItemCode}</span>
                                            </div>

                                            {item.BarCode && (
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600 font-medium">{t('Barcode')}:</span>
                                                    <span className="text-sm font-semibold text-gray-900 text-right flex-1 ml-4">{item.BarCode}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-gray-600 font-medium">{t('Status')}:</span>
                                                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${!item.fInAct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {!item.fInAct ? t('Active') : t('Inactive')}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-gray-600 font-medium">{t('VAT Item')}:</span>
                                                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${item.VATItem ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item.VATItem ? t('Yes') : t('No')}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-gray-600 font-medium">{t('Scale Item')}:</span>
                                                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${item.ScallItem ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item.ScallItem ? t('Yes') : t('No')}
                                                </span>
                                            </div>

                                            {item.SupKey && (
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600 font-medium">{t('Supplier')}:</span>
                                                    <span className="text-sm font-semibold text-gray-900 text-right flex-1 ml-4">
                                                        {suppliers.find(s => s.AdrKy === item.SupKey)?.full_name || 'Unknown'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side - Pricing */}
                                    <div>
                                        <h4 className="mb-4 text-sm font-bold text-slate-900 uppercase">{t('Pricing Information')}</h4>
                                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-gray-600 font-medium">{t('Cost Price')}:</span>
                                                <span className="text-sm font-bold text-orange-600">{formatPrice(item.CosPri)}</span>
                                            </div>

                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-gray-600 font-medium">{t('Sale Price')}:</span>
                                                <span className="text-sm font-bold text-green-600">{formatPrice(item.SlsPri)}</span>
                                            </div>

                                            {item.NCostPrice && (
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600 font-medium">{t('Net Cost Price')}:</span>
                                                    <span className="text-sm font-bold text-gray-900">{formatPrice(item.NCostPrice)}</span>
                                                </div>
                                            )}

                                            {item.ExtraPrice && (
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600 font-medium">{t('Extra Price')}:</span>
                                                    <span className="text-sm font-bold text-gray-900">{formatPrice(item.ExtraPrice)}</span>
                                                </div>
                                            )}

                                            {item.WholePrice && (
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600 font-medium">{t('Wholesale Price')}:</span>
                                                    <span className="text-sm font-bold text-gray-900">{formatPrice(item.WholePrice)}</span>
                                                </div>
                                            )}

                                            {item.CCPrice && (
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600 font-medium">{t('Card Price')}:</span>
                                                    <span className="text-sm font-bold text-gray-900">{formatPrice(item.CCPrice)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-gray-600 font-medium">{t('Reorder Level')}:</span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {loading ? 'Loading...' : (hasReorderLevel ? branchReorderLevel : 'Not Set')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-12 border-t border-slate-200 bg-gradient-to-r from-white to-slate-50 no-print">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                            <p className="text-xs text-gray-600">© UNITEC POS System • {t('Product Management')}</p>
                            <p className="text-xs text-gray-500">v1.0.0 • {t('Professional POS Solution')}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}