import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Printer,
    Filter,
    Calendar,
    DollarSign,
    Users,
    CreditCard,
    TrendingUp,
    BarChart3,
    ArrowLeft
} from 'lucide-react';

interface CollectionReportProps {
    payments: Array<{
        id: number;
        customer_id: number;
        customer_code: string;
        amount: number;
        date: string;
        method: string;
        reference?: string;
        notes?: string;
        customer: {
            AdrKy: number;
            FstNm: string;
            LstNm: string;
            AdrCd: string;
        };
    }>;
    customers: Array<{
        AdrKy: number;
        FstNm: string;
        LstNm: string;
        AdrCd: string;
    }>;
    paymentMethods: string[];
    filters: {
        start_date: string;
        end_date: string;
        customer_id?: string;
        payment_method?: string;
    };
    summary: {
        total_amount: number;
        total_payments: number;
        average_payment: number;
        payment_methods: {
            cash: number;
            cheque: number;
            bank: number;
            card: number;
            credit: number;
        };
        top_customers: Array<{
            name: string;
            code: string;
            total: number;
            count: number;
        }>;
    };
}

const PAYMENT_METHOD_COLORS = {
    cash: '#10B981',
    cheque: '#3B82F6',
    bank: '#8B5CF6',
    card: '#F59E0B',
    credit: '#EF4444'
};

export default function CollectionReport({
    payments,
    customers,
    paymentMethods,
    filters,
    summary,
}: CollectionReportProps) {
    const [localFilters, setLocalFilters] = useState({
        start_date: filters.start_date || new Date().toISOString().split('T')[0].replace(/\d{2}$/, '01'),
        end_date: filters.end_date || new Date().toISOString().split('T')[0],
        customer_id: filters.customer_id || 'all',
        payment_method: filters.payment_method || 'all',
    });

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        const sanitizedFilters = { ...localFilters };
        if (sanitizedFilters.customer_id === 'all') sanitizedFilters.customer_id = '';
        if (sanitizedFilters.payment_method === 'all') sanitizedFilters.payment_method = '';

        router.get('/reports/collection-report', sanitizedFilters, {
            preserveState: true,
            replace: true
        });
    };

    const resetFilters = () => {
        const defaultFilters = {
            start_date: new Date().toISOString().split('T')[0].replace(/\d{2}$/, '01'),
            end_date: new Date().toISOString().split('T')[0],
            customer_id: 'all',
            payment_method: 'all',
        };
        setLocalFilters(defaultFilters);

        const resetQuery = { ...defaultFilters, customer_id: '', payment_method: '' };
        router.get('/reports/collection-report', resetQuery, {
            preserveState: true,
            replace: true
        });
    };

    const formatCurrency = (amount: number) => {
        return `Rs ${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const filteredData = payments.filter(p => {
        if (localFilters.customer_id !== 'all' && p.customer_id.toString() !== localFilters.customer_id) return false;
        if (localFilters.payment_method !== 'all' && p.method !== localFilters.payment_method) return false;
        return true;
    });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Reports', href: '/reports' },
                { title: 'Collection Report', href: '/reports/collection-report' }
            ]}
        >
            <Head title="Collection Report">
                <style>{`
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 10mm;
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
                        
                        #printable-collection,
                        #printable-collection * {
                            visibility: visible;
                        }
                        
                        #printable-collection {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: auto !important;
                            overflow: visible !important;
                        }
                        
                        .no-print {
                            display: none !important;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 10px;
                        }
                        
                        th, td {
                            border: 1px solid #000;
                            padding: 4px;
                            text-align: left;
                        }
                        
                        th {
                            background-color: #f0f0f0;
                            font-weight: bold;
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
                                    <h1 className="text-xl font-bold text-white">Collection Report</h1>
                                    <p className="text-xs text-white/80">Payment analytics and summaries</p>
                                </div>
                            </div>

                            <button onClick={() => window.print()} className="no-print inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200">
                                <Printer className="mr-1.5 h-4 w-4" />
                                Print
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-green-600 p-2">
                                        <DollarSign className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">Total Collections</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{formatCurrency(summary.total_amount)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2">
                                        <CreditCard className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">Total Payments</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{summary.total_payments}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-purple-600 p-2">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">Average</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{formatCurrency(summary.average_payment)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-600 p-2">
                                        <Users className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">Customers</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{summary.top_customers.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-indigo-600 p-2">
                                        <Calendar className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">Period</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{localFilters.start_date.slice(5)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters Card */}
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-md mb-6">
                            <CardHeader className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white rounded-t-2xl">
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filters
                                </CardTitle>
                                <CardDescription className="text-slate-100">Customize report parameters</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                                        <Input
                                            type="date"
                                            value={localFilters.start_date}
                                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                            className="border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">End Date</Label>
                                        <Input
                                            type="date"
                                            value={localFilters.end_date}
                                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                            className="border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Customer</Label>
                                        <Select value={localFilters.customer_id} onValueChange={(v) => handleFilterChange('customer_id', v)}>
                                            <SelectTrigger className="border-slate-200">
                                                <SelectValue placeholder="All Customers" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Customers</SelectItem>
                                                {customers.map((c) => (
                                                    <SelectItem key={c.AdrKy} value={c.AdrKy.toString()}>
                                                        {c.AdrCd} - {c.FstNm} {c.LstNm}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                                        <Select value={localFilters.payment_method} onValueChange={(v) => handleFilterChange('payment_method', v)}>
                                            <SelectTrigger className="border-slate-200">
                                                <SelectValue placeholder="All Methods" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Methods</SelectItem>
                                                {paymentMethods.map((m) => (
                                                    <SelectItem key={m} value={m}>
                                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                                    </SelectItem>
                                                ))}
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
                                        Apply
                                    </button>
                                    <button
                                        onClick={resetFilters}
                                        className="inline-flex items-center rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-slate-400"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Print Table - Hidden */}
                        <div id="printable-collection" className="hidden">
                            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>UNITEC SOFTWARE SOLUTION</h1>
                                <h2 style={{ fontSize: '14px', marginBottom: '2px' }}>Collection Report</h2>
                                <p style={{ fontSize: '10px' }}>From: {localFilters.start_date} To: {localFilters.end_date}</p>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((p, i) => (
                                        <tr key={i}>
                                            <td>{new Date(p.date).toLocaleDateString('en-GB')}</td>
                                            <td>{p.customer.FstNm} {p.customer.LstNm}</td>
                                            <td>{formatCurrency(p.amount)}</td>
                                            <td>{p.method}</td>
                                            <td>{p.reference || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #000', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                <div>Generated by Unitec Software Solution</div>
                                <div>{new Date().toLocaleString('en-GB')}</div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
                            <CardHeader className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white rounded-t-2xl">
                                <CardTitle>Recent Collections</CardTitle>
                                <CardDescription className="text-slate-100">Latest payment transactions</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                                                <TableHead className="font-bold text-gray-700">Date</TableHead>
                                                <TableHead className="font-bold text-gray-700">Customer</TableHead>
                                                <TableHead className="font-bold text-gray-700">Amount</TableHead>
                                                <TableHead className="font-bold text-gray-700">Method</TableHead>
                                                <TableHead className="font-bold text-gray-700">Reference</TableHead>
                                                <TableHead className="font-bold text-gray-700">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.slice(0, 20).map((p, i) => (
                                                <TableRow key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <TableCell className="text-sm">{new Date(p.date).toLocaleDateString('en-GB')}</TableCell>
                                                    <TableCell className="text-sm font-medium">{p.customer.FstNm} {p.customer.LstNm}</TableCell>
                                                    <TableCell className="text-sm font-bold text-green-600">{formatCurrency(p.amount)}</TableCell>
                                                    <TableCell className="text-sm"><Badge variant="outline">{p.method}</Badge></TableCell>
                                                    <TableCell className="text-sm text-gray-600">{p.reference || '-'}</TableCell>
                                                    <TableCell className="text-sm"><Badge className="bg-green-600">Completed</Badge></TableCell>
                                                </TableRow>
                                            ))}
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
                        <p className="text-center text-sm text-gray-600">© 2024 Unitec Software Solution. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
