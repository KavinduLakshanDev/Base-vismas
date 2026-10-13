import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    Edit,
    FileText,
    Printer,
    Trash2,
    Calendar,
    Building,
    Package,
    DollarSign,
    AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/components/ui/confirmation-modal';

interface PurchaseItem {
    id: number;
    product_id: number;
    product_code: string;
    product_name: string;
    qty: number;
    cost_price: number;
    brand: string;
    model: string;
    serial_number: string;
    warranty: string;
    item_discount: number;
    amount: number;
    free_qty: number;
    discount_rate: number;
}

interface Purchase {
    id: number;
    purchase_no: string;
    date: string;
    supplier_code: string;
    supplier_name: string;
    supplier_invoice_no?: string;
    company_code: string;
    purchase_type: string;
    description?: string;
    total_amount: number;
    total_discount: number;
    total_payable: number;
    status: string;
    is_used: boolean;
    is_inactive: boolean;
    created_at: string;
    updated_at: string;
    items: PurchaseItem[];
    can_edit: boolean;
    can_delete: boolean;
}

interface Props {
    purchase: Purchase;
}

export default function ShowPurchase({ purchase }: Props) {
    const [deleteModal, setDeleteModal] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('POS System'), href: '/pos' },
        { title: t('Purchases (GRN)'), href: '/pos/purchases' },
        { title: purchase.purchase_no, href: '#' },
    ];

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return `Rs ${(amount || 0).toLocaleString('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            A: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Active' },
            P: { bg: 'bg-green-100', text: 'text-green-800', label: 'Posted' },
            I: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
        };
        return map[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    };

    const confirmDelete = () => {
        router.delete(`/pos/purchases/${purchase.id}`, {
            onSuccess: () => {
                router.visit('/pos/purchases');
            },
        });
    };

    const statusColor = getStatusColor(purchase.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Purchase ${purchase.purchase_no}`} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <Link
                                    href="/pos/purchases"
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{purchase.purchase_no}</h1>
                                    <p className="text-xs text-white/80">{t('Purchase Details & Items')}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => window.open(`/pos/purchases/${purchase.id}/download-pdf`, '_blank')}
                                    className="inline-flex items-center rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30 transition-all duration-200"
                                >
                                    <Download className="mr-1.5 h-4 w-4" />
                                    {t('Download PDF')}
                                </button>
                                {purchase.can_edit && (
                                    <Link
                                        href={`/pos/purchases/${purchase.id}/edit`}
                                        className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-vismass-blue hover:bg-slate-100 transition-all duration-200"
                                    >
                                        <Edit className="mr-1.5 h-4 w-4" />
                                        {t('Edit')}
                                    </Link>
                                )}
                                {purchase.can_delete && (
                                    <button
                                        onClick={() => setDeleteModal(true)}
                                        className="inline-flex items-center rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 transition-all duration-200"
                                    >
                                        <Trash2 className="mr-1.5 h-4 w-4" />
                                        {t('Delete')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0 space-y-6">
                        {/* Purchase Information */}
                        <div className="bg-white rounded-lg shadow border border-slate-200">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-3">
                                <h2 className="text-lg font-semibold text-white">{t('Purchase Information')}</h2>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Row 1 */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Purchase No')}
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1">{purchase.purchase_no}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Date')}
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1">{formatDate(purchase.date)}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{t('Status')}</p>
                                        <div className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${statusColor.bg} ${statusColor.text}`}>
                                            {statusColor.label}
                                        </div>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="md:col-span-3 border-t pt-4">
                                        <p className="text-sm font-medium text-gray-600">{t('Supplier')}</p>
                                        <p className="text-base font-semibold text-gray-900 mt-1">
                                            {purchase.supplier_name}
                                            {purchase.supplier_code && (
                                                <span className="text-sm text-gray-600 ml-2">({purchase.supplier_code})</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Row 3 */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <Building className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Company')}
                                        </p>
                                        <p className="text-base font-semibold text-gray-900 mt-1">{purchase.company_code}</p>
                                    </div>

                                    {purchase.supplier_invoice_no && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">{t('Supplier Invoice No')}</p>
                                            <p className="text-base font-semibold text-gray-900 mt-1">{purchase.supplier_invoice_no}</p>
                                        </div>
                                    )}
                                </div>

                                {purchase.description && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium text-gray-600">{t('Description')}</p>
                                        <p className="text-gray-700 mt-1">{purchase.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Purchase Items */}
                        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-3">
                                <h2 className="text-lg font-semibold text-white flex items-center">
                                    <Package className="w-5 h-5 mr-2" />
                                    {t('Purchase Items')}
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('Product Details')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">{t('Qty')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">{t('Cost Price')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">{t('Discount Rate (%)')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">{t('Amount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {purchase.items.map((item, index) => {
                                            const isPrinter = item.serial_number && item.brand;

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-600 align-top">{index + 1}</td>
                                                    <td className="px-4 py-3 align-top">
                                                        {isPrinter ? (
                                                            <div className="flex flex-col space-y-1">
                                                                <span className="text-sm font-bold text-gray-900">
                                                                    {item.brand} {item.model}
                                                                </span>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                                        S/N
                                                                    </span>
                                                                    <span className="text-xs font-mono text-gray-600 bg-slate-50 px-1.5 py-0.5 rounded">
                                                                        {item.serial_number}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col space-y-1">
                                                                <span className="text-sm font-bold text-gray-900">
                                                                    {item.product_name}
                                                                </span>
                                                                {item.product_code && (
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                                            Code:
                                                                        </span>
                                                                        <span className="text-xs text-gray-600">
                                                                            {item.product_code}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium align-top">
                                                        {item.qty}
                                                        {item.free_qty > 0 && (
                                                            <span className="block text-xs text-green-600 font-normal">
                                                                +{item.free_qty} free
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-900 align-top">{formatCurrency(item.cost_price)}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-red-600 font-medium align-top">
                                                        {item.discount_rate > 0 ? `${item.discount_rate.toFixed(2)}%` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-bold align-top">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Subtotal Card */}
                            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                                <p className="text-sm font-medium text-gray-600 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-2 text-vismass-blue" />
                                    {t('Gross Amount')}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(purchase.total_amount)}</p>
                            </div>

                            {/* Discount Card */}
                            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                                <p className="text-sm font-medium text-gray-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                                    {t('Total Discount')}
                                </p>
                                <p className="text-2xl font-bold text-orange-600 mt-2">-{formatCurrency(purchase.total_discount)}</p>
                            </div>

                            {/* Grand Total Card */}
                            <div className="bg-gradient-to-br from-vismass-blue to-vismass-grey rounded-lg shadow p-6 text-white">
                                <p className="text-sm font-medium text-white/80 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    {t('Grand Total')}
                                </p>
                                <p className="text-3xl font-bold mt-2">{formatCurrency(purchase.total_payable)}</p>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{t('Purchase Type')}</p>
                                    <p className="text-base font-semibold text-gray-900 mt-1">{purchase.purchase_type}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-600">{t('Items Count')}</p>
                                    <p className="text-base font-semibold text-gray-900 mt-1">{purchase.items.length}</p>
                                </div>

                                <div className="md:col-span-2">
                                    <p className="text-sm font-medium text-gray-600">{t('Posted')}</p>
                                    <div className="mt-1">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${purchase.is_used
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {purchase.is_used ? t('Yes') : t('No')}
                                        </span>
                                    </div>
                                </div>

                                <div className="md:col-span-2 pt-4 border-t">
                                    <p className="text-xs text-gray-500">
                                        {t('Created on')} {formatDate(purchase.created_at)} • {t('Last updated')} {formatDate(purchase.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <ConfirmationModal
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={confirmDelete}
                title={t('Delete Purchase')}
                message={`${t('Are you sure you want to delete purchase')} "${purchase.purchase_no}"? ${t('This action cannot be undone')}.`}
                type="danger"
                confirmText={t('Delete')}
                cancelText={t('Cancel')}
            />
        </AppLayout>
    );
}
