// Purchases (GRN) Management - ServiceJobs-styled Index Page
import React, { useState, useEffect, useRef } from 'react';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Filter, Plus, Eye, Calendar, FileText, ShoppingCart } from 'lucide-react';
import Pagination, { PaginationLink, PaginationMeta } from '@/components/pagination';

interface Purchase {
    id: number;
    purchase_no: string;
    date: string;
    supplier_code: string;
    supplier_name: string;
    supplier_invoice_no?: string;
    grand_total: number;
    status: string;
    is_used: boolean;
    is_inactive: boolean;
    details_count: number;
    can_edit: boolean;
    can_delete: boolean;
}

interface Supplier {
    code: string;
    name: string;
}

interface Props {
    purchases: {
        data: Purchase[];
        links: PaginationLink[];
        meta: PaginationMeta;
        from?: number;
        to?: number;
        total?: number;
        current_page?: number;
        last_page?: number;
    };
    suppliers: Supplier[];
    filters: {
        search?: string;
        supplier?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        per_page?: string;
    };
    download_pdf?: boolean;
    purchase_id?: string;
}

export default function PurchasesIndex({ purchases, suppliers, filters, download_pdf, purchase_id }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [supplierFilter, setSupplierFilter] = useState(filters.supplier || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [itemsPerPage, setItemsPerPage] = useState(filters.per_page || '10');
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; purchase: Purchase | null }>({ show: false, purchase: null });

    // Debounced filtering
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(
                '/pos/purchases',
                {
                    search: search,
                    supplier: supplierFilter,
                    status: statusFilter,
                    date_from: dateFrom,
                    date_to: dateTo,
                    per_page: itemsPerPage,
                    page: 1, // Reset to first page on filter change
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [search, supplierFilter, statusFilter, dateFrom, dateTo, itemsPerPage]);

    useEffect(() => {
        if (download_pdf && purchase_id) {
            window.open(`/pos/purchases/${purchase_id}/download-pdf`, '_blank');
        }
    }, [download_pdf, purchase_id]);

    // Safe wrapper
    const safePurchases = {
        data: purchases.data || [],
        links: purchases.links || [],
        meta: purchases.meta || {
            from: purchases.from || 0,
            to: purchases.to || 0,
            total: purchases.total || 0,
            current_page: purchases.current_page || 1,
            last_page: purchases.last_page || 1,
        }
    };

    const totalPurchases = safePurchases.meta.total;
    const totalValue = safePurchases.data.reduce((s, p) => s + (Number(p.grand_total) || 0), 0); // Note: This checks only visible page. Total value might need backend calculation if it should be overall total.
    const activePurchases = safePurchases.data.filter(p => !p.is_inactive && p.status === 'A').length;
    const postedPurchases = safePurchases.data.filter(p => p.is_used).length;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('POS System'), href: '/pos' },
        { title: t('Purchases (GRN)'), href: '#' },
    ];

    const clearFilters = () => {
        setSearch('');
        setSupplierFilter('');
        setStatusFilter('');
        setDateFrom('');
        setDateTo('');
        setItemsPerPage('10');
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            A: 'bg-blue-100 text-blue-800',
            P: 'bg-green-100 text-green-800',
            I: 'bg-gray-100 text-gray-800',
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB');
    const formatCurrency = (n: number) => `Rs ${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleDelete = (purchase: Purchase) => setDeleteModal({ show: true, purchase });
    const confirmDelete = () => {
        if (deleteModal.purchase) {
            router.delete(`/pos/purchases/${deleteModal.purchase.id}`, {
                onSuccess: () => setDeleteModal({ show: false, purchase: null }),
                onError: () => setDeleteModal({ show: false, purchase: null }),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Purchases (GRN)')} />

            <div className="min-h-screen bg-slate-50">
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{t('Purchase Management (GRN)')}</h1>
                                    <p className="text-xs text-white/80">{t('Manage goods received notes and purchase orders')}</p>
                                </div>
                            </div>
                            <Link
                                href="/pos/purchases/create"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('Create New Purchase')}
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2 shadow-sm">
                                        <FileText className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Purchases')}</p>
                                        <p className="text-lg font-bold text-gray-900">{totalPurchases}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Value (Page)')}</p>
                                        <p className="text-lg font-bold text-gray-900">Rs. {totalValue.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M12 20v-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Active (Page)')}</p>
                                        <p className="text-lg font-bold text-gray-900">{activePurchases}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <ShoppingCart className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Posted (Page)')}</p>
                                        <p className="text-lg font-bold text-gray-900">{postedPurchases}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                    <div>
                                        <h3 className="text-base font-semibold text-white">{t('Purchases List')}</h3>
                                        <p className="text-white/80 text-xs mt-0.5">{t('Browse and manage purchases (GRN)')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                                    <form onSubmit={(e) => e.preventDefault()} className="space-y-3 md:space-y-0 md:flex md:space-x-3 items-end">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder={t('Search purchases...')}
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:w-48">
                                            <div className="relative">
                                                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <select
                                                    value={supplierFilter}
                                                    onChange={(e) => setSupplierFilter(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                >
                                                    <option value="">{t('All Suppliers')}</option>
                                                    {suppliers.map(s => (
                                                        <option key={s.code} value={s.code}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="w-full sm:w-auto">
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => setItemsPerPage(e.target.value)}
                                                className="w-full sm:w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20"
                                            >
                                                <option value="10">10 / {t('Page')}</option>
                                                <option value="25">25 / {t('Page')}</option>
                                                <option value="50">50 / {t('Page')}</option>
                                                <option value="100">100 / {t('Page')}</option>
                                            </select>
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="inline-flex items-center bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                                            >
                                                <Filter className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Clear')}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {safePurchases.data.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Purchase No')}</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Date')}</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Supplier')}</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Invoice')}</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Grand Total')}</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Status')}</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {safePurchases.data.map(purchase => (
                                                    <tr key={purchase.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900">{purchase.purchase_no}</td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-900">
                                                            <div className="flex items-center">
                                                                <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                                                                {formatDate(purchase.date)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-gray-900">
                                                            {purchase.supplier_name}
                                                            <div className="text-xs text-gray-500">{purchase.supplier_code}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-gray-900">{purchase.supplier_invoice_no || '-'}</td>
                                                        <td className="px-4 py-2.5 text-xs font-medium text-gray-900">{formatCurrency(Number(purchase.grand_total) || 0)}</td>
                                                        <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(purchase.status)}`}>
                                                                {purchase.is_inactive ? t('Inactive') : (purchase.is_used ? t('Posted') : (purchase.status === 'A' ? t('Active') : t('Inactive')))}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs font-medium">
                                                            <Link
                                                                href={`/pos/purchases/${purchase.id}`}
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
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="mx-auto h-10 w-10 text-gray-400 mb-3">
                                            <FileText className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No purchases found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Create your first purchase to get started')}
                                        </p>
                                        <Link
                                            href="/pos/purchases/create"
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Create Purchase')}
                                        </Link>
                                    </div>
                                )}

                                {(safePurchases.links || []).length > 0 && (
                                    <Pagination links={safePurchases.links} meta={safePurchases.meta} />
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="mt-6 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="text-xs text-gray-500">© VISMASS POS System • {t('Purchase Management (GRN)')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div>

            <ConfirmationModal isOpen={deleteModal.show} onClose={() => setDeleteModal({ show: false, purchase: null })} onConfirm={confirmDelete} title={t('Delete Purchase')} message={deleteModal.purchase ? `${t('Are you sure you want to delete purchase')} "${deleteModal.purchase.purchase_no}"? ${t('This action cannot be undone')}.` : ''} type="danger" confirmText={t('Delete')} cancelText={t('Cancel')} />
        </AppLayout>
    );
}