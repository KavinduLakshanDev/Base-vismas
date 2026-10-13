import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { ScrollText, Search, Eye, Plus, Filter, X, Calendar, User, DollarSign, Pencil } from 'lucide-react';
import { PageProps, BreadcrumbItem } from '@/types';

interface Quotation {
    id: number;
    service_job_id: number;
    total_amount: string;
    notes: string | null;
    created_at: string;
    service_job: {
        id: number;
        job_number: string;
        customer_name: string;
        customer?: {
            CustNm: string;
        };
    };
    created_by: {
        first_name: string;
        last_name: string;
    } | null;
}

interface QuotationsIndexProps extends PageProps {
    quotations: {
        data: Quotation[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
}

export default function QuotationsIndex({ quotations, filters }: QuotationsIndexProps) {
    const [searchTerm, setSearchTerm] = React.useState(filters.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('Service Jobs'),
            href: '/service-jobs',
        },
        {
            title: t('Quotations'),
            href: '#',
        },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/quotations', { search: searchTerm }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        router.get('/quotations', {}, {
            preserveState: true,
            replace: true
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatCurrency = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `Rs ${numAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Quotations')} />
            
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <ScrollText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Quotations')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('View and manage all service quotations')}
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2 shadow-sm">
                                        <ScrollText className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Quotations')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {quotations.total}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-green-500 p-2 shadow-sm">
                                        <DollarSign className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('This Page')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {quotations.data.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <Calendar className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Page')} {quotations.current_page} / {quotations.last_page}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {quotations.per_page} {t('per page')}
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
                                            {t('Quotations List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View all generated quotations')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Filters */}
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                                    <form onSubmit={handleSearch} className="space-y-3 md:space-y-0 md:flex md:space-x-3">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder={t('Search by job number or customer name...')}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex space-x-2">
                                            <button
                                                type="submit"
                                                className="inline-flex items-center bg-gradient-to-r from-sky-600 to-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 font-medium"
                                            >
                                                <Search className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Search')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="inline-flex items-center bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                                            >
                                                <X className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Clear')}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Quotations Table */}
                                {quotations.data.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Job #')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Customer')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Total Amount')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Created Date')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Created By')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {quotations.data.map((quotation) => (
                                                    <tr key={quotation.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs font-medium text-gray-900">
                                                                <Link
                                                                    href={`/service-jobs/${quotation.service_job.id}`}
                                                                    className="text-sky-600 hover:text-sky-800 hover:underline"
                                                                >
                                                                    {quotation.service_job.job_number}
                                                                </Link>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center">
                                                                <User className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                                                <div className="text-xs font-medium text-gray-900">
                                                                    {quotation.service_job.customer_name ||
                                                                        quotation.service_job.customer?.CustNm ||
                                                                        'N/A'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900">
                                                            {formatCurrency(quotation.total_amount)}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs text-gray-900 flex items-center">
                                                                <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                                                                {formatDate(quotation.created_at)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs text-gray-900">
                                                                {quotation.created_by
                                                                    ? `${quotation.created_by.first_name} ${quotation.created_by.last_name}`
                                                                    : 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <Link
                                                                    href={`/quotations/${quotation.id}`}
                                                                    className="inline-flex items-center text-sky-600 hover:text-sky-800"
                                                                >
                                                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                                                    {t('View')}
                                                                </Link>
                                                                <Link
                                                                    href={`/quotations/${quotation.id}/edit`}
                                                                    className="inline-flex items-center text-amber-600 hover:text-amber-800"
                                                                >
                                                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                                                    {t('Edit')}
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="mx-auto h-10 w-10 text-gray-400 mb-3">
                                            <ScrollText className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No quotations found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {filters.search
                                                ? t('Try adjusting your search criteria')
                                                : t('Create quotations for service jobs to see them here')}
                                        </p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {quotations.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            {t('Showing')} {quotations.data.length} {t('of')} {quotations.total} {t('quotations')}
                                        </div>
                                        <div className="hidden sm:flex sm:items-center sm:justify-center">
                                            <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                                                {quotations.current_page > 1 && (
                                                    <button
                                                        onClick={() =>
                                                            router.get(`/quotations?page=${quotations.current_page - 1}`, {
                                                                search: searchTerm,
                                                            })
                                                        }
                                                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-xl mx-1"
                                                    >
                                                        {t('Previous')}
                                                    </button>
                                                )}
                                                
                                                <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium z-10 bg-sky-50 border-sky-500 text-sky-600 border rounded-xl mx-1">
                                                    {quotations.current_page}
                                                </span>

                                                {quotations.current_page < quotations.last_page && (
                                                    <button
                                                        onClick={() =>
                                                            router.get(`/quotations?page=${quotations.current_page + 1}`, {
                                                                search: searchTerm,
                                                            })
                                                        }
                                                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-xl mx-1"
                                                    >
                                                        {t('Next')}
                                                    </button>
                                                )}
                                            </nav>
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
                            <p className="text-xs text-gray-500">© VISMASS POS System • {t('Quotations Management')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
