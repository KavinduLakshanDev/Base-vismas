import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    Building,
    Package,
    DollarSign,
    Save,
    X,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';

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
}

interface Props {
    purchase: Purchase;
}

export default function EditPurchase({ purchase }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        supplier_invoice_no: purchase.supplier_invoice_no || '',
        description: purchase.description || '',
        items: purchase.items.map(item => ({
            id: item.id,
            qty: item.qty,
            cost_price: item.cost_price,
            item_discount: item.item_discount,
            free_qty: item.free_qty,
            discount_rate: item.discount_rate,
        })),
    });

    const [editingRow, setEditingRow] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('POS System'), href: '/pos' },
        { title: t('Purchases (GRN)'), href: '/pos/purchases' },
        { title: purchase.purchase_no, href: `/pos/purchases/${purchase.id}` },
        { title: t('Edit'), href: '#' },
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

    const calculateItemAmount = (index: number) => {
        const item = data.items[index];
        const amount = (item.qty * item.cost_price) - item.item_discount;
        return amount > 0 ? amount : 0;
    };

    const calculateTotals = () => {
        const total_amount = data.items.reduce((sum, item) => {
            const itemAmount = (item.qty * item.cost_price);
            return sum + itemAmount;
        }, 0);

        const total_discount = data.items.reduce((sum, item) => sum + (item.item_discount || 0), 0);
        const total_payable = total_amount - total_discount;

        return { total_amount, total_discount, total_payable };
    };

    const totals = calculateTotals();

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        const val = parseFloat(value) || 0;

        // Update the changed field
        newItems[index] = { ...newItems[index], [field]: val };

        // Recalculate item_discount based on discount_rate
        const item = newItems[index];
        const qty = item.qty;
        const costPrice = item.cost_price;
        const discountRate = item.discount_rate;

        // Calculate item discount
        const itemDiscount = (costPrice * qty * discountRate) / 100;
        newItems[index].item_discount = itemDiscount;

        setData('items', newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/pos/purchases/${purchase.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Purchase ${purchase.purchase_no}`} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <Link
                                    href={`/pos/purchases/${purchase.id}`}
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{t('Edit Purchase')} - {purchase.purchase_no}</h1>
                                    <p className="text-xs text-white/80">{t('Update purchase details and pricing')}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue hover:bg-slate-100 transition-all duration-200 disabled:opacity-50"
                                >
                                    <Save className="mr-1.5 h-4 w-4" />
                                    {processing ? t('Saving...') : t('Save Changes')}
                                </button>
                                <Link
                                    href={`/pos/purchases/${purchase.id}`}
                                    className="inline-flex items-center rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-all duration-200"
                                >
                                    <X className="mr-1.5 h-4 w-4" />
                                    {t('Cancel')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="px-4 sm:px-0 space-y-6">
                        {/* Purchase Information - Read Only */}
                        <div className="bg-white rounded-lg shadow border border-slate-200">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-3">
                                <h2 className="text-lg font-semibold text-white">{t('Purchase Information (Read-Only)')}</h2>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Row 1 */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Purchase No')}
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1 bg-slate-50 px-3 py-2 rounded">
                                            {purchase.purchase_no}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Date')}
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1 bg-slate-50 px-3 py-2 rounded">
                                            {formatDate(purchase.date)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{t('Status')}</p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1 bg-slate-50 px-3 py-2 rounded">
                                            {purchase.status === 'A' ? t('Active') : purchase.status === 'P' ? t('Posted') : t('Inactive')}
                                        </p>
                                    </div>

                                    {/* Row 2 - Supplier Details */}
                                    <div className="md:col-span-3 border-t pt-4">
                                        <p className="text-sm font-medium text-gray-600">{t('Supplier')}</p>
                                        <p className="text-base font-semibold text-gray-900 mt-1 bg-slate-50 px-3 py-2 rounded">
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
                                        <p className="text-base font-semibold text-gray-900 mt-1 bg-slate-50 px-3 py-2 rounded">
                                            {purchase.company_code}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{t('Purchase Type')}</p>
                                        <p className="text-base font-semibold text-gray-900 mt-1 bg-slate-50 px-3 py-2 rounded">
                                            {purchase.purchase_type}
                                        </p>
                                    </div>
                                </div>

                                {/* Editable Fields */}
                                <div className="mt-6 pt-6 border-t space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">{t('Supplier Invoice No')}</label>
                                        <input
                                            type="text"
                                            value={data.supplier_invoice_no}
                                            onChange={(e) => setData('supplier_invoice_no', e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                            placeholder={t('Enter supplier invoice number')}
                                        />
                                        {errors.supplier_invoice_no && <span className="text-xs text-red-600">{errors.supplier_invoice_no}</span>}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">{t('Description')}</label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                            placeholder={t('Enter purchase description')}
                                            rows={3}
                                        />
                                        {errors.description && <span className="text-xs text-red-600">{errors.description}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Purchase Items - Editable */}
                        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-3">
                                <h2 className="text-lg font-semibold text-white flex items-center">
                                    <Package className="w-5 h-5 mr-2" />
                                    {t('Purchase Items')} - {t('Edit Pricing')}
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('Product Code')}</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('Product Name')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('Qty')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('Cost Price')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('Discount Rate (%)')}</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('Amount')}</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('Action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {purchase.items.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product_code}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{item.product_name}</td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    {editingRow === index ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.items[index]?.qty || item.qty}
                                                            onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-900 font-medium cursor-pointer hover:text-vismass-blue"
                                                            onClick={() => setEditingRow(index)}
                                                        >
                                                            {data.items[index]?.qty || item.qty}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    {editingRow === index ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.items[index]?.cost_price || item.cost_price}
                                                            onChange={(e) => handleItemChange(index, 'cost_price', e.target.value)}
                                                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-900 font-medium cursor-pointer hover:text-vismass-blue"
                                                            onClick={() => setEditingRow(index)}
                                                        >
                                                            {formatCurrency(data.items[index]?.cost_price || item.cost_price)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    {editingRow === index ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.items[index]?.discount_rate}
                                                            onChange={(e) => handleItemChange(index, 'discount_rate', e.target.value)}
                                                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue"
                                                        />
                                                    ) : (
                                                        <span className="text-red-600 font-medium cursor-pointer hover:text-red-800"
                                                            onClick={() => setEditingRow(index)}
                                                        >
                                                            {data.items[index]?.discount_rate > 0 ? `${data.items[index]?.discount_rate.toFixed(2)}%` : '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                                    {formatCurrency(calculateItemAmount(index))}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {editingRow === index ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingRow(null)}
                                                            className="text-green-600 hover:text-green-800 font-medium"
                                                        >
                                                            {t('Done')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingRow(index)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            {t('Edit')}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
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
                                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totals.total_amount)}</p>
                            </div>

                            {/* Discount Card */}
                            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                                <p className="text-sm font-medium text-gray-600 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-2 text-orange-500" />
                                    {t('Total Discount')}
                                </p>
                                <p className="text-2xl font-bold text-orange-600 mt-2">-{formatCurrency(totals.total_discount)}</p>
                            </div>

                            {/* Grand Total Card */}
                            <div className="bg-gradient-to-br from-vismass-blue to-vismass-grey rounded-lg shadow p-6 text-white">
                                <p className="text-sm font-medium text-white/80 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    {t('Grand Total')}
                                </p>
                                <p className="text-3xl font-bold mt-2">{formatCurrency(totals.total_payable)}</p>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3">
                            <Link
                                href={`/pos/purchases/${purchase.id}`}
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                            >
                                <X className="mr-2 h-4 w-4" />
                                {t('Cancel')}
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-lg bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-all duration-200 disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? t('Saving...') : t('Save Changes')}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </AppLayout>
    );
}
