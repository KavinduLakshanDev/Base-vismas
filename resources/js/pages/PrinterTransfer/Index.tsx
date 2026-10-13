import { Head, Link } from '@inertiajs/react';
import { ArrowRightLeft, Plus, Truck, Calendar, Package, TrendingUp } from 'lucide-react';
import { t } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

declare function route(name: string, params?: any): string;

interface StockTransfer {
    id: number;
    from_section_code: string;
    to_section_code: string;
    item_id: number;
    quantity: number;
    cost_price: number;
    transfer_date: string;
    notes: string;
    company_code: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    batch_no?: string;
    warranty?: string;
    fromSection: {
        name: string;
        section_code: string;
    } | null;
    toSection: {
        name: string;
        section_code: string;
    } | null;
    item: {
        ItemCode: string;
        ItmNm: string;
    };
}

interface IndexProps {
    stockTransfers: {
        data: StockTransfer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ stockTransfers }: IndexProps) {
    // Filter to show only transfers with item_id = 0
    const invalidTransfers = stockTransfers.data.filter(transfer => transfer.item_id === 0);
    
    const totalTransfers = invalidTransfers.length;
    const totalQuantity = invalidTransfers.reduce((sum, transfer) => sum + (Number(transfer.quantity) || 0), 0);
    const totalValue = invalidTransfers.reduce((sum, transfer) => sum + ((Number(transfer.quantity) || 0) * (Number(transfer.cost_price) || 0)), 0);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('Printer Transfers'),
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Printer Transfers')} />
            
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Truck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Printer Transfers')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage printer transfers between sections')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/printer-transfers/create"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('New Printer Transfer')}
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
                                        <ArrowRightLeft className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Transfers')}</p>
                                        <p className="text-lg font-bold text-gray-900">{totalTransfers}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-green-500 p-2 shadow-sm">
                                        <Package className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Quantity')}</p>
                                        <p className="text-lg font-bold text-gray-900">{totalQuantity.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-purple-500 p-2 shadow-sm">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Value')}</p>
                                        <p className="text-lg font-bold text-gray-900">Rs. {totalValue.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <Calendar className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Recent Transfers')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {invalidTransfers.filter(t => {
                                                const transferDate = new Date(t.transfer_date);
                                                const weekAgo = new Date();
                                                weekAgo.setDate(weekAgo.getDate() - 7);
                                                return transferDate >= weekAgo;
                                            }).length}
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
                                            {t('Printer Transfer History')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('Browse and manage printer transfers')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Transfer List */}
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Date')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('From Section')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('To Section')}
                                                </th>  
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Brand')}
                                                </th>
                                                {/* <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Model')}
                                                </th> */}
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Serial Number')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Warranty')}
                                                </th>
                                                {/* <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Quantity')}
                                                </th> */}
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Total Value')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {invalidTransfers.map((transfer) => (
                                                <tr
                                                    key={transfer.id}
                                                    className="hover:bg-sky-50/50 transition-colors duration-150"
                                                >
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {new Date(transfer.transfer_date).toLocaleDateString()}
                                                            </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="text-xs text-gray-900">
                                                        <div className="font-medium">{transfer.fromSection?.name || transfer.from_section_code}</div>
                                                        <div className="text-xs text-gray-500">{transfer.from_section_code}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="text-xs text-gray-900">
                                                        <div className="font-medium">{transfer.toSection?.name || transfer.to_section_code}</div>
                                                        <div className="text-xs text-gray-500">{transfer.to_section_code}</div>
                                                    </div>
                                                </td>
                                                    {/* <td className="px-4 py-2.5">
                                                                <div className="flex items-center">
                                                                    <div className="h-8 w-8 shrink-0">
                                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-100">
                                                                            <Package className="h-4 w-4 text-sky-600" />
                                                                        </div>
                                                                    </div>
                                                                   
                                                                </div>
                                                    </td> */}
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs text-gray-900">
                                                        {transfer.brand ||  '-' } 
                                                         <div className="text-xs text-gray-500">{transfer.model || '-'}</div>
                                                    </span>
                                                </td>
                                                {/* <td className="px-4 py-2.5">
                                                    <span className="text-xs text-gray-900">
                                                        {transfer.model || '-'}
                                                    </span>
                                                </td> */}
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs text-gray-900">
                                                        {transfer.serial_number || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs text-gray-900">
                                                        {transfer.warranty || '-'}
                                                    </span>
                                                </td>
                                                    {/* <td className="px-4 py-2.5 text-right">
                                                        <span className="text-xs font-medium text-gray-900">
                                                            {Number(transfer.quantity) || 0}
                                                        </span>
                                                    </td> */}
                                                <td className="px-4 py-2.5 text-right">
                                                    <span className="text-xs font-semibold text-gray-900">
                                                        Rs. {((Number(transfer.quantity) || 0) * (Number(transfer.cost_price) || 0)).toFixed(2)}
                                                    </span>
                                                </td>
                                                </tr>
                                            ))}
                                            {invalidTransfers.length === 0 && (
                                                <tr>
                                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                                        <ArrowRightLeft className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">
                                                            {t('No transfers found')}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">
                                                            {t('Get started by creating your first printer transfer')}
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {stockTransfers.data.length > 0 && (
                                    <div className="mt-4 border-t border-gray-200 px-4 py-3 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-700">
                                                {t('Showing')} {((stockTransfers.current_page - 1) * stockTransfers.per_page) + 1} {t('to')} {Math.min(stockTransfers.current_page * stockTransfers.per_page, stockTransfers.total)} {t('of')} {stockTransfers.total} {t('results')}
                                            </div>
                                            <div className="flex space-x-1">
                                                {/* Pagination links would go here */}
                                            </div>
                                        </div>
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
                            <p className="text-xs text-gray-500">© Distribution System • {t('Printer Transfer Management')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}