import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { t } from '@/lib/i18n';
import { Plus, Eye, Search, Receipt, DollarSign, CheckCircle, Clock, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination, { PaginationLink, PaginationMeta } from '@/components/pagination';

interface Sale {
    id: number;
    invoice_no: string;
    transaction_date: string;
    customer_name: string;
    total_amount: string | number;
    status: string;
}

interface SalesData extends PaginationMeta {
    data: Sale[];
    links: PaginationLink[];
}

interface Props {
    sales: SalesData;
    filters?: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

const Index: React.FC<Props> = ({ sales, filters = {} }) => {
    const [searchTerm, setSearchTerm] = React.useState(filters.search || '');
    const isFirstRender = React.useRef(true);

    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(
                '/sales',
                { search: searchTerm },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const completedSales = sales.data.filter(sale => sale.status === 'completed').length;
    const pendingSales = sales.data.filter(sale => sale.status === 'pending').length;
    const totalRevenue = sales.data.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

    // Use server-filtered data
    const filteredSales = sales.data;

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Sales'), href: '#' },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-slate-50">
                <Head title={t('Sales')} />

                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Receipt className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Sales')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Track and manage sales transactions')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/sales/create"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('Create New Sale')}
                            </Link>
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
                                        <Receipt className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Sales')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {sales.data.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Completed')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {completedSales}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <Clock className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Pending')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {pendingSales}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Filtered')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {filteredSales.length}
                                        </p>
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
                                            {t('Sales List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View and manage all sales transactions')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Filters */}
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder={t('Search by invoice or customer...')}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="inline-flex items-center bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                                        >
                                            <Filter className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Clear')}
                                        </button>
                                    </div>
                                </div>

                                {/* Sales Table */}
                                {filteredSales.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Invoice No')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Date')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Customer')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Total')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Status')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredSales.map((sale) => (
                                                    <tr key={sale.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs font-medium text-gray-900">
                                                                {sale.invoice_no}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs text-gray-900">
                                                                {new Date(sale.transaction_date).toLocaleDateString('en-GB')}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs font-medium text-gray-900">
                                                                {sale.customer_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900">
                                                            Rs. {Number(sale.total_amount).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sale.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : sale.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                                            <Link
                                                                href={`/sales/${sale.id}`}
                                                                className="inline-flex items-center text-sky-600 hover:text-sky-800"
                                                            >
                                                                <Eye className="mr-1 h-3.5 w-3.5" />
                                                                {t('View')}
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <Pagination links={sales.links} meta={sales} />
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="mx-auto h-10 w-10 text-gray-400 mb-3">
                                            <Receipt className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No sales found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {searchTerm ? t('Try adjusting your search criteria') : t('Get started by creating a new sale.')}
                                        </p>
                                        {!searchTerm && (
                                            <Link
                                                href="/sales/create"
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                            >
                                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Create Sale')}
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-6 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="text-xs text-gray-500">© VISMASS POS System • {t('Sales Management')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div >
        </AppSidebarLayout >
    );
};

export default Index;
