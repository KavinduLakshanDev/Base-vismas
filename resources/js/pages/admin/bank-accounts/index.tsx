import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle,
    Edit,
    Eye,
    Filter,
    Plus,
    Search,
    Trash2,
    Building2,
    CreditCard,
    XCircle,
    RefreshCw,
    CheckCircle2,
    UserPlus,
    Building,
    MapPin,
    FileText,
    ArrowLeft,
    Save
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { t } from '@/lib/i18n';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('Admin'),
        href: '#',
    },
    {
        title: t('Bank Account Management'),
        href: '#',
    },
];

interface BankAccount {
    id: number;
    account_name: string;
    account_number: string;
    bank_name: string;
    branch_name: string;
    account_type: string;
    opening_balance: number;
    current_balance: number;
    currency: string;
    status: string;
    company_code: string;
    section_code: string;
    created_at: string;
    creator?: {
        name: string;
    };
    company?: {
        company_name: string;
    };
    section?: {
        name: string;
    };
}

interface Filters {
    search?: string;
    status?: string;
}

interface Props {
    bankAccounts: {
        data: BankAccount[];
        links: any[];
        meta: any;
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
        first_page_url?: string;
        last_page_url?: string;
        prev_page_url?: string;
        next_page_url?: string;
    };
    filters: Filters;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function BankAccountIndex({ bankAccounts, filters, flash }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bankAccountToDelete, setBankAccountToDelete] = useState<BankAccount | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get(
                '/admin/bank-accounts',
                {
                    search: searchTerm,
                    status: selectedStatus,
                    page: 1, // Reset to page 1 on filter change
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                },
            );
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedStatus]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('');
    };

    // Calculate stats
    const totalAccounts = bankAccounts.data.length;
    const activeAccounts = bankAccounts.data.filter(account => account.status === 'active').length;
    const inactiveAccounts = bankAccounts.data.filter(account => account.status === 'inactive').length;
    const closedAccounts = bankAccounts.data.filter(account => account.status === 'closed').length;

    const handleDelete = (bankAccount: BankAccount) => {
        setBankAccountToDelete(bankAccount);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!bankAccountToDelete) return;

        setDeleteProcessing(true);
        router.delete(`/admin/bank-accounts/${bankAccountToDelete.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setBankAccountToDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                setDeleteProcessing(false);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('Active')}
                    </span>
                );
            case 'inactive':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('Inactive')}
                    </span>
                );
            case 'closed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('Closed')}
                    </span>
                );
            default:
                return null;
        }
    };

    const getAccountTypeBadge = (type: string) => {
        const colors = {
            savings: 'bg-blue-100 text-blue-800',
            current: 'bg-purple-100 text-purple-800',
            checking: 'bg-indigo-100 text-indigo-800',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
                {t(type.charAt(0).toUpperCase() + type.slice(1))}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Bank Account Management')} />
            
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Bank Account Management')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage your organization\'s bank accounts')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/admin/bank-accounts/create"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('Add Bank Account')}
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
                                        <Building2 className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Accounts')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {totalAccounts}
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
                                        <p className="text-xs font-medium text-gray-600">{t('Active')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {activeAccounts}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-yellow-500 p-2 shadow-sm">
                                        <RefreshCw className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Inactive')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {inactiveAccounts}
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
                                        <p className="text-xs font-medium text-gray-600">{t('Closed')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {closedAccounts}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flash Messages */}
                        {flash?.success && (
                            <div className="mb-6 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                                <div className="flex">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-800">
                                            {flash.success}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {flash?.error && (
                            <div className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
                                <div className="flex">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800">
                                            {flash.error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content Card */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                    <div>
                                        <h3 className="text-base font-semibold text-white">
                                            {t('Bank Accounts List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View and manage all bank accounts')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Filters */}
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <Filter className="w-5 h-5 text-slate-400" />
                                        <h3 className="text-lg font-medium text-slate-800">{t('Filters')}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Search */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder={t('Search bank accounts...')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-vismass-blue/20 focus:border-vismass-blue"
                                            />
                                        </div>

                                        {/* Status Filter */}
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-vismass-blue/20 focus:border-vismass-blue"
                                        >
                                            <option value="">{t('All Statuses')}</option>
                                            <option value="active">{t('Active')}</option>
                                            <option value="inactive">{t('Inactive')}</option>
                                            <option value="closed">{t('Closed')}</option>
                                        </select>
                                    </div>

                                    {(searchTerm || selectedStatus) && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={clearFilters}
                                                className="text-sm text-slate-600 hover:text-slate-800 underline"
                                            >
                                                {t('Clear filters')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Bank Accounts Table */}
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        {t('Account Details')}
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        {t('Bank & Branch')}
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        {t('Type & Balance')}
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        {t('Status')}
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                        {t('Actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {bankAccounts.data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center">
                                                            <Building2 className="mx-auto h-12 w-12 text-slate-400" />
                                                            <h3 className="mt-2 text-sm font-medium text-slate-900">{t('No bank accounts')}</h3>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                {t('Get started by creating a new bank account.')}
                                                            </p>
                                                            <div className="mt-6">
                                                                <Link
                                                                    href="/admin/bank-accounts/create"
                                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-vismass-blue hover:bg-vismass-blue/90"
                                                                >
                                                                    <Plus className="mr-2 h-5 w-5" />
                                                                    {t('Add Bank Account')}
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    bankAccounts.data.map((bankAccount) => (
                                                        <tr key={bankAccount.id} className="hover:bg-slate-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        <div className="h-10 w-10 rounded-lg bg-vismass-blue/10 flex items-center justify-center">
                                                                            <CreditCard className="h-5 w-5 text-vismass-blue" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-slate-900">
                                                                            {bankAccount.account_name}
                                                                        </div>
                                                                        <div className="text-sm text-slate-500">
                                                                            {bankAccount.account_number}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-slate-900">{bankAccount.bank_name}</div>
                                                                <div className="text-sm text-slate-500">{bankAccount.branch_name}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-slate-900">
                                                                    {getAccountTypeBadge(bankAccount.account_type)}
                                                                </div>
                                                                <div className="text-sm text-slate-500">
                                                                    Rs {bankAccount.current_balance?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {getStatusBadge(bankAccount.status)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex items-center space-x-2">
                                                                    <Link
                                                                        href={`/admin/bank-accounts/${bankAccount.id}`}
                                                                        className="text-vismass-blue hover:text-vismass-blue/80"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                    <Link
                                                                        href={`/admin/bank-accounts/${bankAccount.id}/edit`}
                                                                        className="text-slate-600 hover:text-slate-800"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDelete(bankAccount)}
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>

                                    {/* Pagination */}
                                    {bankAccounts.meta && bankAccounts.meta.last_page > 1 && (
                                        <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-slate-700">
                                                    {t('Showing')} {bankAccounts.meta.from} {t('to')} {bankAccounts.meta.to} {t('of')} {bankAccounts.meta.total} {t('results')}
                                                </div>
                                                <div className="flex space-x-1">
                                                    {bankAccounts.links.map((link, index) => (
                                                        <Link
                                                            key={index}
                                                            href={link.url || '#'}
                                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl ${
                                                                link.active
                                                                    ? 'bg-vismass-blue text-white'
                                                                    : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-6 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="text-xs text-gray-500">© VISMASS POS System • {t('Bank Account Management')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && bankAccountToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <Trash2 className="w-6 h-6 text-red-500 mr-3" />
                            <h3 className="text-lg font-medium text-slate-900">
                                {t('Delete Bank Account')}
                            </h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">
                            {t('Are you sure you want to delete')} "{bankAccountToDelete.account_name}"? {t('This action cannot be undone.')}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                            >
                                {t('Cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteProcessing}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteProcessing ? t('Deleting...') : t('Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}