import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Printer, Plus, AlertTriangle, CheckCircle2, XCircle, Eye, Search, Filter, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { t } from '@/lib/i18n';

interface PrinterWastage {
    id: number;
    printer_name: string;
    serial_number: string;
    batch_no: string;
    brand: string;
    model: string;
    warranty: string;
    reason: string;
    recorded_by: string;
    recorded_at: string;
    status: string;
}

interface Props {
    wastages: {
        data: PrinterWastage[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function PrinterWastageIndex({ wastages }: Props) {
    const approvedCount = wastages.data.filter(w => w.status === 'approved').length;
    const pendingCount = wastages.data.filter(w => w.status === 'pending').length;
    const rejectedCount = wastages.data.filter(w => w.status === 'rejected').length;

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const breadcrumbs = [
        {
            title: t('Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('Printer Wastage'),
            href: '#',
        },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    const filteredWastages = wastages.data.filter(wastage => {
        const matchesSearch = search === '' || 
            wastage.printer_name.toLowerCase().includes(search.toLowerCase()) ||
            wastage.serial_number.toLowerCase().includes(search.toLowerCase()) ||
            wastage.batch_no.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || wastage.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this printer wastage record?')) {
            router.delete(`/printer-wastages/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Printer Wastage')} />

            <div className="min-h-screen bg-slate-50">
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
                                        {t('Printer Wastage')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage printer wastage and damaged items')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/printer-wastages/create"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('Record New Wastage')}
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
                                        <Printer className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Wastage')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {wastages.data.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-green-500 p-2 shadow-sm">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Approved')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {approvedCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-yellow-500 p-2 shadow-sm">
                                        <AlertTriangle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Pending')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {pendingCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-red-500 p-2 shadow-sm">
                                        <XCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Rejected')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {rejectedCount}
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
                                            {t('Printer Wastage Records')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View and manage all printer wastage records')}
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
                                                    placeholder={t('Search by printer name, serial number, or batch...')}
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="md:w-40">
                                            <div className="relative">
                                                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                >
                                                    <option value="all">{t('All Status')}</option>
                                                    <option value="pending">{t('Pending')}</option>
                                                    <option value="approved">{t('Approved')}</option>
                                                    <option value="rejected">{t('Rejected')}</option>
                                                </select>
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

                                {/* Printer Wastage Table */}
                                {filteredWastages.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Printer')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Serial Number')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Batch')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Brand/Model')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Date')}
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
                                                {filteredWastages.map((wastage) => (
                                                    <tr key={wastage.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs font-medium text-gray-900">{wastage.printer_name}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs text-gray-900">{wastage.serial_number}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs text-gray-900">{wastage.batch_no}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs text-gray-900">
                                                                {wastage.brand} {wastage.model}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs text-gray-900">{wastage.recorded_at}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                                                                wastage.status === 'approved'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : wastage.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {wastage.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                                            <button
                                                                onClick={() => handleDelete(wastage.id)}
                                                                className="inline-flex items-center text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                                {t('Delete')}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="mx-auto h-10 w-10 text-gray-400 mb-3">
                                            <Printer className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No printer wastage records found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Get started by recording a new printer wastage.')}
                                        </p>
                                        <Link
                                            href="/printer-wastages/create"
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Record Wastage')}
                                        </Link>
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
                            <p className="text-xs text-gray-500">© VISMASS POS System • {t('Printer Wastage Management')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
