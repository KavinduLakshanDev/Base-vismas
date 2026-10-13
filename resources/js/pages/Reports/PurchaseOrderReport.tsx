import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Printer,
    Filter,
    Calendar,
    CheckCircle,
    Clock,
    ShoppingCart,
    BarChart3,
    ArrowLeft,
} from 'lucide-react';

interface Company {
    name: string;
    branch: string;
    code: string;
    branch_code: string;
}

interface PurchaseOrder {
    id: string;
    order_number: string;
    order_date: string;
    supplier_name: string;
    branch_name: string;
    total_items: number;
    total_quantity: number;
    total_value: number;
    received_value: number;
    status: string;
}

interface Totals {
    orders_count: number;
    total_value: number;
    received_value: number;
    total_items: number;
}

interface Supplier {
    value: string;
    label: string;
}

interface Props {
    company: Company;
    filters: {
        from_date?: string;
        to_date?: string;
        supplier_id?: string;
        status?: string;
    };
    reportData?: PurchaseOrder[];
    totals?: Totals;
    suppliers: Supplier[];
}

export default function PurchaseOrderReport({
    company,
    filters,
    reportData = [],
    totals = { orders_count: 0, total_value: 0, received_value: 0, total_items: 0 },
    suppliers = [],
}: Props) {
    const [localFilters, setLocalFilters] = useState({
        from_date: filters.from_date || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        to_date: filters.to_date || new Date().toISOString().split('T')[0],
        supplier_id: filters.supplier_id || 'all',
        status: filters.status || 'all',
    });

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        const sanitizedFilters: Record<string, string> = { ...localFilters };
        if (sanitizedFilters.supplier_id === 'all') sanitizedFilters.supplier_id = '';
        if (sanitizedFilters.status === 'all') sanitizedFilters.status = '';

        router.get('/reports/purchase-orders', sanitizedFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const defaultFilters = {
            from_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
            to_date: new Date().toISOString().split('T')[0],
            supplier_id: 'all',
            status: 'all',
        };
        setLocalFilters(defaultFilters);

        const resetQuery = { ...defaultFilters, supplier_id: '', status: '' };
        router.get('/reports/purchase-orders', resetQuery, {
            preserveState: true,
            replace: true,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Reports', href: '/reports' },
                { title: 'Purchase Orders', href: '/reports/purchase-orders' },
            ]}
        >
            <Head title={t('Purchase Orders Report')}>
                <style>{`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 10mm;
                            margin-top: 0;
                        }
                        
                        @page :first {
                            margin-top: 10mm;
                        }
                        
                        body, html {
                            height: auto !important;
                            overflow: visible !important;
                        }
                        
                        body * {
                            visibility: hidden;
                        }
                        
                        /* Reset all parent containers to allow multi-page flow */
                        body,
                        body > div,
                        body > div > div,
                        [data-slot="sidebar-wrapper"],
                        [data-slot="sidebar-inset"],
                        main,
                        .min-h-screen,
                        .min-h-svh {
                            position: static !important;
                            overflow: visible !important;
                            height: auto !important;
                            min-height: 0 !important;
                            max-height: none !important;
                            display: block !important;
                        }
                        
                        #printable-purchase-orders,
                        #printable-purchase-orders * {
                            visibility: visible;
                        }
                        
                        #printable-purchase-orders {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background: white;
                            height: auto !important;
                            overflow: visible !important;
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
                        
                        #printable-purchase-orders > table {
                            display: table !important;
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 8px;
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
                            color: #000 !important;
                        }
                        
                        /* Column Width Priorities */
                        th:nth-child(1), td:nth-child(1) { /* Order # */
                            width: 10%;
                            font-weight: bold;
                        }
                        
                        th:nth-child(2), td:nth-child(2) { /* Date */
                            width: 10%;
                        }
                        
                        th:nth-child(3), td:nth-child(3) { /* Supplier */
                            width: 18%;
                            font-weight: bold;
                        }
                        
                        th:nth-child(4), td:nth-child(4) { /* Branch */
                            width: 12%;
                        }
                        
                        th:nth-child(5), td:nth-child(5) { /* Items */
                            width: 7%;
                            text-align: right;
                        }
                        
                        th:nth-child(6), td:nth-child(6) { /* Total Qty */
                            width: 8%;
                            text-align: right;
                        }
                        
                        th:nth-child(7), td:nth-child(7) { /* Total Value */
                            width: 12%;
                            text-align: right;
                        }
                        
                        th:nth-child(8), td:nth-child(8) { /* Received Value */
                            width: 12%;
                            text-align: right;
                        }
                        
                        th:nth-child(9), td:nth-child(9) { /* Status */
                            width: 11%;
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
            </Head>

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow no-print">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => window.history.back()}
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all"
                                    title="Go Back"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </button>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{t('Purchase Orders Report')}</h1>
                                    <p className="text-xs text-white/80">{t('Track purchase orders, supplier performance, and incoming stock')}</p>
                                </div>
                            </div>

                            <button onClick={() => window.print()} className="no-print inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200">
                                <Printer className="mr-1.5 h-4 w-4" />
                                {t('Print')}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-blue-600 p-2">
                                        <ShoppingCart className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Total Orders')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{totals.orders_count}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-green-600 p-2">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Total Value')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{formatCurrency(totals.total_value)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-600 p-2">
                                        <Clock className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Received Value')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{formatCurrency(totals.received_value)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-purple-600 p-2">
                                        <Calendar className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Total Items')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{totals.total_items}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters Card */}
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-md mb-6">
                            <CardHeader className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white rounded-t-2xl">
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    {t('Filters')}
                                </CardTitle>
                                <CardDescription className="text-slate-100">{t('Customize report parameters')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">{t('From Date')}</Label>
                                        <Input
                                            type="date"
                                            value={localFilters.from_date}
                                            onChange={(e) => handleFilterChange('from_date', e.target.value)}
                                            className="border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">{t('To Date')}</Label>
                                        <Input
                                            type="date"
                                            value={localFilters.to_date}
                                            onChange={(e) => handleFilterChange('to_date', e.target.value)}
                                            className="border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">{t('Supplier')}</Label>
                                        <Select value={localFilters.supplier_id} onValueChange={(v) => handleFilterChange('supplier_id', v)}>
                                            <SelectTrigger className="border-slate-200">
                                                <SelectValue placeholder="All Suppliers" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Suppliers</SelectItem>
                                                {suppliers.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">{t('Status')}</Label>
                                        <Select value={localFilters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                                            <SelectTrigger className="border-slate-200">
                                                <SelectValue placeholder="All Statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="A">Completed</SelectItem>
                                                <SelectItem value="P">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={applyFilters}
                                        className="inline-flex items-center rounded-lg bg-vismass-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                    >
                                        <Filter className="mr-2 h-4 w-4" />
                                        {t('Apply')}
                                    </button>
                                    <button
                                        onClick={resetFilters}
                                        className="inline-flex items-center rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-slate-400"
                                    >
                                        {t('Reset')}
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        <div id="printable-purchase-orders">
                            {/* Print Header - Only visible in print */}
                            <div className="print-header" style={{ display: 'none' }}>
                                <div className="mb-4 text-center">
                                    <div className="text-center">
                                        <div className="text-3xl font-black" style={{ marginBottom: '5px' }}>
                                            <span style={{ color: '#00aeef' }}>VIS</span>
                                            <span style={{ color: '#737578' }}>MASS</span>
                                        </div>
                                        <div className="text-sm text-slate-600">Purchase Orders Report</div>
                                        <div style={{ fontSize: '10px', marginTop: '4px' }}>From: {localFilters.from_date} &nbsp; To: {localFilters.to_date}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Print Table - Only visible in print */}
                            <table style={{ display: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Date</th>
                                        <th>Supplier</th>
                                        <th>Branch</th>
                                        <th>Items</th>
                                        <th>Total Qty</th>
                                        <th>Total Value</th>
                                        <th>Received Value</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item, i) => (
                                        <tr key={i}>
                                            <td>{item.order_number}</td>
                                            <td>{formatDate(item.order_date)}</td>
                                            <td>{item.supplier_name}</td>
                                            <td>{item.branch_name}</td>
                                            <td>{item.total_items}</td>
                                            <td>{item.total_quantity}</td>
                                            <td>{formatCurrency(item.total_value)}</td>
                                            <td>{formatCurrency(item.received_value)}</td>
                                            <td>{item.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Print Footer - Only visible in print */}
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

                        {/* Data Table */}
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
                            <CardHeader className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white rounded-t-2xl">
                                <CardTitle>{t('Purchase Orders')}</CardTitle>
                                <CardDescription className="text-slate-100">
                                    {reportData.length > 0
                                        ? `${t('Showing')} ${reportData.length} ${t('records')}`
                                        : t('No records found')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                                                <TableHead className="font-bold text-gray-700">{t('Order #')}</TableHead>
                                                <TableHead className="font-bold text-gray-700">{t('Date')}</TableHead>
                                                <TableHead className="font-bold text-gray-700">{t('Supplier')}</TableHead>
                                                <TableHead className="font-bold text-gray-700">{t('Branch')}</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-right">{t('Items')}</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-right">{t('Total Qty')}</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-right">{t('Total Value')}</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-right">{t('Received Value')}</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-center">{t('Status')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.length > 0 ? (
                                                reportData.map((item, index) => (
                                                    <TableRow key={item.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <TableCell className="text-sm font-medium text-vismass-blue">{item.order_number}</TableCell>
                                                        <TableCell className="text-sm">{formatDate(item.order_date)}</TableCell>
                                                        <TableCell className="text-sm">{item.supplier_name}</TableCell>
                                                        <TableCell className="text-sm">{item.branch_name}</TableCell>
                                                        <TableCell className="text-sm text-right">{item.total_items}</TableCell>
                                                        <TableCell className="text-sm text-right">{item.total_quantity}</TableCell>
                                                        <TableCell className="text-sm text-right font-bold text-green-600">{formatCurrency(item.total_value)}</TableCell>
                                                        <TableCell className="text-sm text-right">{formatCurrency(item.received_value)}</TableCell>
                                                        <TableCell className="text-sm text-center">{getStatusBadge(item.status)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="h-24 text-center text-slate-500">
                                                        {t('No purchase orders found for the selected criteria.')}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-12 border-t border-slate-200 bg-gradient-to-r from-white to-slate-50 py-6 no-print">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-sm text-gray-600">&copy; 2024 Unitec Software Solution. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
