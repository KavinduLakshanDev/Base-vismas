import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Trash2,
    Printer,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('Wastage Management'),
        href: '#',
    },
];

interface WastageItem {
    id: number;
    product_name: string;
    category: string;
    quantity: number;
    unit: string;
    cost_price: number;
    batch_no?: string;
    serial_number?: string;
    warranty?: string;
    reason: string;
    notes?: string;
    section_name: string;
    wastage_date: string;
    recorded_by: string;
    recorded_at: string;
}

interface Props {
    wastages: {
        data: WastageItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function WastageIndex({ wastages, flash }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this wastage record?'))) {
            router.delete(`/wastages/${id}`, {
                preserveScroll: true,
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate totals
    const totalQuantity = wastages.data.reduce((sum, item) => sum + Number(item.quantity), 0);
    const totalValue = wastages.data.reduce((sum, item) => sum + (Number(item.cost_price) * Number(item.quantity)), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Wastage Management')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg no-print">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <Trash2 className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Wastage Management')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Track and manage product wastage records')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={handlePrint}
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow-lg hover:bg-slate-100 transition-all no-print"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    {t('Print')}
                                </Button>
                                <Link href="/wastages/create" className="no-print">
                                    <Button className="bg-white text-vismass-blue hover:bg-white/90 shadow-lg">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('Record Wastage')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div id="printable-wastage">
                        {flash?.success && (
                            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 no-print">
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                        )}

                        {flash?.error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 no-print">
                                <p className="text-sm font-medium text-red-800">{flash.error}</p>
                            </div>
                        )}

                        {/* Print Header */}
                        <div className="print-header" style={{ display: 'none' }}>
                            <div className="text-center mb-4">
                                <div className="text-3xl font-black" style={{ marginBottom: '5px' }}>
                                    <span style={{ color: '#00aeef' }}>VIS</span>
                                    <span style={{ color: '#737578' }}>MASS</span>
                                </div>
                                <div className="text-sm text-slate-600">Wastage Report</div>
                                <div className="text-xs text-slate-500">
                                    Generated on: {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <p className="text-xs font-medium text-slate-600">{t('Total Records')}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{wastages.total}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <p className="text-xs font-medium text-slate-600">{t('Total Quantity')}</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{totalQuantity.toFixed(2)}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <p className="text-xs font-medium text-slate-600">{t('Total Value')}</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{totalValue.toFixed(2)}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <p className="text-xs font-medium text-slate-600">{t('On This Date')}</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 no-print">
                            <input
                                type="text"
                                placeholder={t('Search by product name, category, or reason...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-vismass-blue focus:ring-1 focus:ring-vismass-blue text-sm"
                            />
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                                                Product
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                                                Batch / Serial
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                                                Section
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">
                                                Quantity
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">
                                                Total Cost
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                                                Reason
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase no-print">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {wastages.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center">
                                                    <p className="text-slate-500">{t('No wastage records found')}</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            wastages.data.map((wastage) => (
                                                <tr key={wastage.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                        <div>{wastage.product_name}</div>
                                                        <div className="text-xs text-slate-500">{wastage.category}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">
                                                        {wastage.batch_no && (
                                                            <div className="font-mono text-xs">{wastage.batch_no}</div>
                                                        )}
                                                        {wastage.serial_number && (
                                                            <div className="text-xs text-slate-500">SN: {wastage.serial_number}</div>
                                                        )}
                                                        {!wastage.batch_no && !wastage.serial_number && <span className="text-xs text-slate-400">-</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">
                                                        {wastage.section_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                                                        {Number(wastage.quantity).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                                                        {(wastage.quantity * wastage.cost_price).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">
                                                        {wastage.reason.charAt(0).toUpperCase() + wastage.reason.slice(1)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">
                                                        {new Date(wastage.recorded_at).toLocaleString('en-GB', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-center no-print">
                                                        <button
                                                            onClick={() => handleDelete(wastage.id)}
                                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                            title={t('Delete')}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Print Footer */}
                        <div className="print-footer" style={{ display: 'none' }}>
                            <span>Generated by Unitec Software Solution</span>
                            <span>
                                Printed on: {new Date().toLocaleString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                        margin-top: 0;
                    }
                    
                    @page :first {
                        margin-top: 10mm;
                    }
                    
                    body * {
                        visibility: hidden;
                    }
                    
                    #printable-wastage,
                    #printable-wastage * {
                        visibility: visible;
                    }
                    
                    #printable-wastage {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .print-header {
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                        display: block !important;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 9px;
                        page-break-inside: auto;
                        color: #000 !important;
                    }
                    
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    
                    thead {
                        display: table-header-group;
                    }
                    
                    th, td {
                        border: 1px solid #000;
                        padding: 3px;
                        color: #000 !important;
                    }
                    
                    th {
                        background-color: #e5e7eb !important;
                        font-weight: bold;
                        text-align: left;
                    }
                    
                    td:nth-child(4),
                    td:nth-child(5) {
                        text-align: right;
                    }
                    
                    .print-footer {
                        margin-top: 20px;
                        padding-top: 10px;
                        border-top: 1px solid #000;
                        font-size: 10px;
                        display: flex !important;
                        justify-content: space-between;
                        color: #000 !important;
                    }
                }
            `}</style>
        </AppLayout>
    );
}
