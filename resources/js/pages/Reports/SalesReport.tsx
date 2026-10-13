import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { Head, router } from '@inertiajs/react';
import {
    DollarSign,
    Download,
    Eye,
    FileText,
    Loader,
    RotateCcw,
    TrendingUp,
    Receipt,
    CreditCard,
    ArrowLeft,
    Filter,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Company {
    name: string;
    branch: string;
    code: string;
    branch_code: string;
}

interface Transaction {
    invoice_no: string;
    total_amount: number;
    cash_payment: number;
    voucher_amount: number;
    credit_card_amount: number;
    points_redeemed: number;
    transaction_date: string;
}

interface DailySummary {
    date: string;
    start_invoice: string;
    end_invoice: string;
    total_amount: number;
    total_cash: number;
    total_credit: number;
    total_card: number;
    total_points: number;
    transaction_count: number;
    transactions?: Transaction[];
}

interface SalesData {
    daily_summaries: DailySummary[];
    total_amount: number;
    total_cash: number;
    total_credit: number;
    total_card: number;
    total_points: number;
    transaction_count: number;
}

interface Props {
    company: Company;
    filters: {
        report_type?: 'daily' | 'monthly';
        from_date?: string;
        to_date?: string;
        item_type?: 'all' | 'printer' | 'stationary';
    };
    salesData?: SalesData;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales Report', href: '/reports/sales' },
];

export default function SalesReport({
    company,
    filters,
    salesData,
}: Props) {
    const [reportType, setReportType] = useState<'daily' | 'monthly'>(
        filters.report_type || 'daily',
    );
    const [fromDate, setFromDate] = useState<Date | undefined>(() => {
        return (
            filters.from_date
                ? new Date(filters.from_date)
                : (() => {
                    const today = new Date();
                    today.setDate(today.getDate() - 7);
                    return today;
                })()
        );
    });
    const [toDate, setToDate] = useState<Date | undefined>(() => {
        return (
            filters.to_date
                ? new Date(filters.to_date)
                : (() => {
                    const today = new Date();
                    return today;
                })()
        );
    });
    const [isLoading, setIsLoading] = useState(false);
    const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [itemType, setItemType] = useState<'all' | 'printer' | 'stationary'>(
        filters.item_type || 'all',
    );

    useEffect(() => {
        if (filters.report_type) {
            setReportType(filters.report_type);
        }
    }, [filters.report_type]);

    useEffect(() => {
        if (filters.from_date) {
            setFromDate(new Date(filters.from_date));
        }
    }, [filters.from_date]);

    useEffect(() => {
        if (filters.to_date) {
            setToDate(new Date(filters.to_date));
        }
    }, [filters.to_date]);

    useEffect(() => {
        if (filters.item_type) {
            setItemType(filters.item_type);
        }
    }, [filters.item_type]);

    const handleApplyFilters = () => {
        setIsLoading(true);
        setHasAppliedFilters(true);

        const params = new URLSearchParams();
        params.append('report_type', reportType);
        params.append('item_type', itemType);

        if (!fromDate || !toDate) {
            alert('Please select both From Date and To Date.');
            setIsLoading(false);
            return;
        }

        if (fromDate > toDate) {
            alert('From Date cannot be after To Date.');
            setIsLoading(false);
            return;
        }

        params.append('from_date', fromDate.toISOString().split('T')[0]);
        params.append('to_date', toDate.toISOString().split('T')[0]);

        const finalUrl = `/reports/sales?${params.toString()}`;

        router.get(
            finalUrl,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
                onError: (errors) => {
                    console.error('Error fetching sales data:', errors);
                    setIsLoading(false);
                },
            },
        );
    };

    const handleDownloadPDF = async () => {
        try {
            if (!salesData) {
                alert('No sales data available for PDF generation. Please generate a report first.');
                return;
            }

            const params = new URLSearchParams({
                report_type: reportType,
                item_type: itemType,
                ...(fromDate && { from_date: fromDate.toISOString().split('T')[0] }),
                ...(toDate && { to_date: toDate.toISOString().split('T')[0] }),
            });

            const pdfUrl = `/reports/sales/pdf?${params.toString()}`;

            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `sales-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    const handleResetFilters = () => {
        setIsLoading(true);
        setReportType('daily');
        setItemType('all');
        setFromDate(() => {
            const today = new Date();
            today.setDate(today.getDate() - 7);
            return today;
        });
        setToDate(() => {
            const today = new Date();
            return today;
        });
        setHasAppliedFilters(false);

        router.get(
            '/reports/sales',
            {},
            {
                preserveState: false,
                preserveScroll: false,
                onFinish: () => setIsLoading(false),
                onError: () => setIsLoading(false),
            },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string | number | null | undefined) => {
        if (!dateString) return '';

        let date: Date;

        if (typeof dateString === 'number') {
            date = new Date(dateString);
            if (isNaN(date.getTime())) {
                date = new Date(dateString * 1000);
            }
        } else if (typeof dateString === 'string') {
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(dateString);
            } else {
                date = new Date(dateString);
            }
        } else {
            return String(dateString);
        }

        if (isNaN(date.getTime())) {
            return String(dateString);
        }

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getReportTitle = () => {
        if (reportType === 'daily') {
            return `Daily Sales Report - ${formatDate(fromDate?.toISOString().split('T')[0])} to ${formatDate(toDate?.toISOString().split('T')[0])}`;
        } else {
            return `Monthly Sales Report - ${formatDate(fromDate?.toISOString().split('T')[0])} to ${formatDate(toDate?.toISOString().split('T')[0])}`;
        }
    };

    const generatePDFHTML = () => {
        const formatCurrencyForPDF = (
            amount: number | string | null | undefined,
        ) => {
            const numAmount =
                typeof amount === 'string' ? parseFloat(amount) : amount || 0;
            if (isNaN(numAmount)) return '0.00';
            return numAmount.toFixed(2);
        };

        let tableContent = '';

        if (reportType === 'daily' && salesData) {
            const allTransactions =
                salesData.daily_summaries?.flatMap(
                    (summary) => summary.transactions || [],
                ) || [];

            const allRows = allTransactions.map(
                (transaction, index) => ({
                    date:
                        index === 0
                            ? formatDate(transaction.transaction_date)
                            : '',
                    transaction,
                }),
            );

            tableContent = `
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Date</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Invoice No</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Total Amount (Rs)</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Cash (Rs)</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Credit (Rs)</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Card (Rs)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allRows
                    .map(
                        (row) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${row.date}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${row.transaction.invoice_no}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrencyForPDF(row.transaction.total_amount)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrencyForPDF(row.transaction.cash_payment)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrencyForPDF(row.transaction.voucher_amount)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrencyForPDF(row.transaction.credit_card_amount)}</td>
                            </tr>
                        `,
                    )
                    .join('')}
                        <tr class="total-row">
                            <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #e8f5e8; font-weight: bold;"></td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #e8f5e8; font-weight: bold;">Total</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; background-color: #e8f5e8; font-weight: bold;">Rs. ${formatCurrencyForPDF(salesData.total_amount)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; background-color: #e8f5e8; font-weight: bold;">Rs. ${formatCurrencyForPDF(salesData.total_cash)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; background-color: #e8f5e8; font-weight: bold;">Rs. ${formatCurrencyForPDF(salesData.total_credit)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; background-color: #e8f5e8; font-weight: bold;">Rs. ${formatCurrencyForPDF(salesData.total_card)}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        } else if (reportType === 'monthly' && salesData) {
            tableContent = `
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Date</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Start Invoice</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">End Invoice</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Total Amount (Rs)</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Cash (Rs)</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Credit (Rs)</th>
                            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: center;">Card (Rs)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${salesData.daily_summaries
                    ?.map(
                        (summary) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${formatDate(summary.date)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${summary.start_invoice}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${summary.end_invoice}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">Rs. ${formatCurrencyForPDF(summary.total_amount)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">Rs. ${formatCurrencyForPDF(summary.total_cash)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">Rs. ${formatCurrencyForPDF(summary.total_credit)}</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">Rs. ${formatCurrencyForPDF(summary.total_card)}</td>
                            </tr>
                        `,
                    )
                    .join('')}
                        <tr class="total-row">
                            <td colspan="3" style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #e8f5e8; font-weight: bold;">Total</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; background-color: #e8f5e8; font-weight: bold;">Rs. ${formatCurrencyForPDF(salesData.total_amount)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; background-color: #e8f5e8; font-weight: bold;">Rs. ${formatCurrencyForPDF(salesData.total_cash)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; background-color: #e8f5e8; font-weight: bold;">Rs. ${formatCurrencyForPDF(salesData.total_credit)}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right; background-color: #e8f5e8; font-weight: bold;">Rs. ${formatCurrencyForPDF(salesData.total_card)}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        return `
            <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; background-color: #fff; padding: 20px; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${getReportTitle()}</div>
                    <div>${company.name} - ${company.branch}</div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px;">
                    <div>
                        <strong>Company:</strong> ${company.name}<br />
                        <strong>Branch:</strong> ${company.branch}<br />
                        <strong>Code:</strong> ${company.code}
                    </div>
                    <div style="text-align: right;">
                        <strong>Branch Code:</strong> ${company.branch_code}<br />
                        <strong>Report Type:</strong> ${reportType === 'daily' ? 'Daily' : 'Monthly'}<br />
                        <strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}
                    </div>
                </div>

                ${tableContent}

                <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 11px;">
                    <div style="border: 1px solid #000; padding: 10px; text-align: center; flex: 1; margin: 0 5px;">
                        <strong>Total Amount (Rs)</strong><br />
                        Rs. ${formatCurrencyForPDF(salesData?.total_amount)}
                    </div>
                    <div style="border: 1px solid #000; padding: 10px; text-align: center; flex: 1; margin: 0 5px;">
                        <strong>Total Cash (Rs)</strong><br />
                        Rs. ${formatCurrencyForPDF(salesData?.total_cash)}
                    </div>
                    <div style="border: 1px solid #000; padding: 10px; text-align: center; flex: 1; margin: 0 5px;">
                        <strong>Transaction Count </strong><br />
                        ${salesData?.transaction_count || 0}
                    </div>
                </div>

                <div style="margin-top: 30px; font-size: 10px; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
                    <p>Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString()}</p>
                    <p>This is a computer-generated report.</p>
                </div>
            </div>
        `;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Sales Report - POS System')} />

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
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{t('Sales Report')}</h1>
                                    <p className="text-xs text-white/80">{t('Comprehensive sales analytics and summaries')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Report Filters Card */}
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-md mb-6">
                            <CardHeader className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white rounded-t-2xl">
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    {t('Report Filters')}
                                </CardTitle>
                                <CardDescription className="text-slate-100">{t('Configure your sales report parameters')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    {/* Report Type */}
                                    <div className="md:flex-2 space-y-2">
                                        <Label htmlFor="report_type" className="text-sm font-medium text-gray-700">
                                            {t('Report Type')}
                                        </Label>
                                        <Select
                                            value={reportType}
                                            onValueChange={(value: 'daily' | 'monthly') => {
                                                setReportType(value);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('Select report type')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">
                                                    {t('Daily Sales Report')}
                                                </SelectItem>
                                                <SelectItem value="monthly">
                                                    {t('Monthly Sales Report')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Item Type */}
                                    <div className="md:flex-2 space-y-2">
                                        <Label htmlFor="item_type" className="text-sm font-medium text-gray-700">
                                            {t('Item Type')}
                                        </Label>
                                        <Select
                                            value={itemType}
                                            onValueChange={(value: 'all' | 'printer' | 'stationary') => {
                                                setItemType(value);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('Select item type')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    {t('All Items')}
                                                </SelectItem>
                                                <SelectItem value="printer">
                                                    {t('Printer')}
                                                </SelectItem>
                                                <SelectItem value="stationary">
                                                    {t('Stationary Item')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Date Range Filters */}
                                    <div className="md:flex-1 space-y-2">
                                        <Label htmlFor="from_date" className="text-sm font-medium text-gray-700">
                                            {t('From Date')} *
                                        </Label>
                                        <DatePicker
                                            date={fromDate}
                                            onDateChange={setFromDate}
                                            placeholder="DD/MM/YYYY"
                                        />
                                    </div>
                                    <div className="md:flex-1 space-y-2">
                                        <Label htmlFor="to_date" className="text-sm font-medium text-gray-700">
                                            {t('To Date')} *
                                        </Label>
                                        <DatePicker
                                            date={toDate}
                                            onDateChange={setToDate}
                                            placeholder="DD/MM/YYYY"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleApplyFilters}
                                        disabled={isLoading}
                                        className="inline-flex items-center rounded-lg bg-vismass-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                    >
                                        {isLoading ? (
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Eye className="mr-2 h-4 w-4" />
                                        )}
                                        {isLoading ? t('Loading...') : t('Apply')}
                                    </button>
                                    {salesData && (
                                        <>
                                            <button
                                                onClick={() => setShowPreview(true)}
                                                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                            >
                                                <FileText className="mr-2 h-4 w-4" />
                                                {t('Preview')}
                                            </button>
                                            <button
                                                onClick={handleDownloadPDF}
                                                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                {t('PDF')}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-slate-400"
                                    >
                                        {t('Reset')}
                                    </button>
                                </div>

                                {/* Loading Overlay */}
                                {isLoading && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Loader className="h-6 w-6 animate-spin text-sky-600" />
                                            <span className="text-sm font-medium text-sky-600">
                                                {t('Loading sales data...')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Report Summary */}
                        {salesData && (
                            <>
                                {/* Stats Cards */}
                                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                        <div className="flex items-center">
                                            <div className="rounded-lg bg-green-600 p-2">
                                                <Receipt className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="ml-2 flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-600 truncate">Transactions</p>
                                                <p className="text-sm font-bold text-gray-900 truncate">{salesData.transaction_count || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                        <div className="flex items-center">
                                            <div className="rounded-lg bg-vismass-blue p-2">
                                                <DollarSign className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="ml-2 flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-600 truncate">Total Sales</p>
                                                <p className="text-sm font-bold text-gray-900 truncate">{formatCurrency(salesData.total_amount)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                        <div className="flex items-center">
                                            <div className="rounded-lg bg-purple-600 p-2">
                                                <CreditCard className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="ml-2 flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-600 truncate">Cash</p>
                                                <p className="text-sm font-bold text-gray-900 truncate">{formatCurrency(salesData.total_cash)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                                        <div className="flex items-center">
                                            <div className="rounded-lg bg-orange-600 p-2">
                                                <TrendingUp className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="ml-2 flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-600 truncate">Other</p>
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {formatCurrency(
                                                        (salesData.total_credit || 0) +
                                                        (salesData.total_card || 0)
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sales Data Table */}
                                <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
                                    <CardHeader className="bg-gradient-to-r from-vismass-blue to-vismass-grey text-white rounded-t-2xl">
                                        <CardTitle>{t('Sales Transactions')}</CardTitle>
                                        <CardDescription className="text-slate-100">{getReportTitle()}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="p-6">
                                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                                {reportType === 'daily' ? (
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                            <tr>
                                                                <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Date')}
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Invoice No')}
                                                                </th>
                                                                <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Total Amount (Rs)')}
                                                                </th>
                                                                <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Cash (Rs)')}
                                                                </th>
                                                                <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Credit (Rs)')}
                                                                </th>
                                                                <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Card (Rs)')}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {salesData.daily_summaries?.map((summary: DailySummary) => (
                                                                <React.Fragment key={summary.date}>
                                                                    {summary.transactions?.map((transaction, index) => (
                                                                        <tr key={`${summary.date}-${index}`} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                                                {index === 0 ? formatDate(summary.date) : ''}
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                                                {transaction.invoice_no}
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                                                                                {formatCurrency(transaction.total_amount)}
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                                                {formatCurrency(transaction.cash_payment)}
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                                                {formatCurrency(transaction.voucher_amount)}
                                                                            </td>
                                                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                                                {formatCurrency(transaction.credit_card_amount)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {/* Daily Total Row */}
                                                                    <tr className="bg-green-50 border-y-2 border-green-500 font-semibold">
                                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-700 font-bold">
                                                                            Daily Total
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-green-700 font-bold">
                                                                            {summary.transaction_count} Invoices
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-green-700 font-bold">
                                                                            {formatCurrency(summary.total_amount)}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-green-700 font-bold">
                                                                            {formatCurrency(summary.total_cash)}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-green-700 font-bold">
                                                                            {formatCurrency(summary.total_credit)}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-green-700 font-bold">
                                                                            {formatCurrency(summary.total_card)}
                                                                        </td>
                                                                    </tr>
                                                                </React.Fragment>
                                                            ))}
                                                            {/* Grand Total Row */}
                                                            <tr className="bg-green-50 border-y-2 border-green-500 font-bold">
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm"></td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-black font-bold uppercase">
                                                                    GRAND TOTAL
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-black font-bold">
                                                                    {formatCurrency(salesData.total_amount)}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-black font-bold">
                                                                    {formatCurrency(salesData.total_cash)}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-black font-bold">
                                                                    {formatCurrency(salesData.total_credit)}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-black font-bold">
                                                                    {formatCurrency(salesData.total_card)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                            <tr>
                                                                <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Date')}
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Invoice Range')}
                                                                </th>
                                                                <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Total Amount')}
                                                                </th>
                                                                <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Cash')}
                                                                </th>
                                                                <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Credit')}
                                                                </th>
                                                                <th className="px-6 py-4 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                                    {t('Card')}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {salesData.daily_summaries?.map((summary, index) => (
                                                                <tr key={index} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                                        {formatDate(summary.date)}
                                                                    </td>
                                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                                        {summary.start_invoice} - {summary.end_invoice}
                                                                    </td>
                                                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                                                                        {formatCurrency(summary.total_amount)}
                                                                    </td>
                                                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                                        {formatCurrency(summary.total_cash)}
                                                                    </td>
                                                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                                        {formatCurrency(summary.total_credit)}
                                                                    </td>
                                                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                                        {formatCurrency(summary.total_card)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}

                                                {(!salesData || !salesData.daily_summaries?.length) && (
                                                    <div className="text-center py-12">
                                                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                                            <TrendingUp className="h-12 w-12" />
                                                        </div>
                                                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                                                            {t('No sales data found')}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {t('No sales transactions found for the selected criteria.')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Summary Table */}
                                <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                                    <table className="w-full">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-center text-sm font-bold text-black border-r border-gray-200">
                                                    Transactions
                                                </th>
                                                <th className="px-4 py-3 text-center text-sm font-bold text-black border-r border-gray-200">
                                                    Total Sales (Rs)
                                                </th>
                                                <th className="px-4 py-3 text-center text-sm font-bold text-black border-r border-gray-200">
                                                    Cash (Rs)
                                                </th>
                                                <th className="px-4 py-3 text-center text-sm font-bold text-black border-r border-gray-200">
                                                    Credit (Rs)
                                                </th>
                                                <th className="px-4 py-3 text-center text-sm font-bold text-black">
                                                    Card (Rs)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            <tr>
                                                <td className="px-4 py-4 text-center text-lg font-bold text-green-700 border-r border-gray-200">
                                                    {salesData.transaction_count}
                                                </td>
                                                <td className="px-4 py-4 text-center text-lg font-bold text-green-700 border-r border-gray-200">
                                                    {formatCurrency(salesData.total_amount)}
                                                </td>
                                                <td className="px-4 py-4 text-center text-lg font-bold text-green-700 border-r border-gray-200">
                                                    {formatCurrency(salesData.total_cash)}
                                                </td>
                                                <td className="px-4 py-4 text-center text-lg font-bold text-green-700 border-r border-gray-200">
                                                    {formatCurrency(salesData.total_credit)}
                                                </td>
                                                <td className="px-4 py-4 text-center text-lg font-bold text-green-700">
                                                    {formatCurrency(salesData.total_card)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* No Data State */}
                        {!salesData && hasAppliedFilters && (
                            <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
                                <CardContent className="p-12 text-center">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                                        {t('No Sales Data Found')}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {t('No sales data was found for the selected filters. Try selecting different filters.')}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Initial State */}
                        {!salesData && !hasAppliedFilters && (
                            <Card className="rounded-2xl border-slate-200 bg-white shadow-md">
                                <CardContent className="p-12 text-center">
                                    <TrendingUp className="mx-auto h-12 w-12 text-sky-400" />
                                    <h3 className="mt-4 text-lg font-medium text-sky-900">
                                        {t('Ready to Generate Sales Report')}
                                    </h3>
                                    <p className="mt-2 text-sm text-sky-600">
                                        {t('Please select filters and click "Apply" to load sales data.')}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-12 border-t border-slate-200 bg-gradient-to-r from-white to-slate-50 py-6 no-print">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-sm text-gray-600">© 2024 Unitec Software Solution. All rights reserved.</p>
                    </div>
                </footer>

                {/* Print Preview Modal */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Print Preview - {getReportTitle()}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            {salesData && (
                                <div
                                    className="bg-white border rounded-lg p-6 shadow-sm"
                                    dangerouslySetInnerHTML={{
                                        __html: generatePDFHTML()
                                    }}
                                />
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowPreview(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
