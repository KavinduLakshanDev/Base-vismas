import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { Printer, ArrowLeft, ScrollText, Calendar, User, DollarSign, Package, FileText } from 'lucide-react';
import { router } from '@inertiajs/react';
import { PageProps, BreadcrumbItem } from '@/types';

interface QuotationItem {
    item_name: string;
    quantity: number;
    unit_price: number;
    item_type: string;
}

interface ViewQuotationProps extends PageProps {
    quotation: {
        id: number;
        service_job_id: number;
        total_amount: string;
        notes: string | null;
        items: QuotationItem[];
        created_at: string;
        service_job: {
            id: number;
            job_number: string;
            customer_name: string;
            customer_phone: string;
            device_type: string;
            device_brand: string;
            device_model: string;
            device_serial: string;
        };
        created_by: {
            first_name: string;
            last_name: string;
        } | null;
    };
    company: any;
}

export default function ViewQuotation({ quotation, company }: ViewQuotationProps) {
    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        router.visit('/quotations');
    };

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
            href: '/quotations',
        },
        {
            title: quotation.service_job.job_number,
            href: '#',
        },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatCurrency = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `Rs ${numAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('Quotation')} - ${quotation.service_job.job_number}`}>
                <style>{`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 15mm;
                        }
                        
                        body * {
                            visibility: hidden;
                        }
                        
                        #printable-quotation,
                        #printable-quotation * {
                            visibility: visible;
                        }
                        
                        #printable-quotation {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background: white;
                        }
                        
                        .no-print {
                            display: none !important;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        
                        th, td {
                            border: 1px solid #000;
                            padding: 8px;
                            text-align: left;
                        }
                        
                        th {
                            background-color: #f3f4f6;
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
                                    onClick={handleBack}
                                    className="mr-1 rounded-lg bg-white/20 backdrop-blur-sm p-2 hover:bg-white/30 transition-all duration-200 border border-white/30"
                                    title={t('Go Back')}
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </button>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <ScrollText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Quotation')}: {quotation.service_job.job_number}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('View and print service quotation')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue transition-all hover:bg-slate-100 hover:shadow-md"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    {t('Print Quotation')}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4 no-print">
                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2 shadow">
                                        <ScrollText className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Quotation ID')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            #{quotation.id}
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
                                        <p className="text-xs font-medium text-gray-600">{t('Total Amount')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {formatCurrency(quotation.total_amount)}
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
                                        <p className="text-xs font-medium text-gray-600">{t('Created Date')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {formatDate(quotation.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <Package className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Items')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {quotation.items.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Printable Quotation Content */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden">
                            <div id="printable-quotation" className="bg-white p-8">
                                {/* Company Header */}
                                <div className="mb-8 text-center border-b-2 pb-6">
                                    <h1 className="text-3xl font-bold text-vismass-blue">
                                        {company?.company_name || 'VISMASS'}
                                    </h1>
                                    {company?.address && <p className="text-sm text-slate-600 mt-1">{company.address}</p>}
                                    {company?.phone && <p className="text-sm text-slate-600">Tel: {company.phone}</p>}
                                    {company?.email && <p className="text-sm text-slate-600">Email: {company.email}</p>}
                                </div>

                                <h2 className="text-2xl font-bold text-center mb-6 text-vismass-blue">SERVICE QUOTATION</h2>

                                {/* Job & Customer Details */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-600">{t('Job Number')}:</p>
                                        <p className="text-lg font-bold">{quotation.service_job.job_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-600">{t('Date')}:</p>
                                        <p className="text-lg">{formatDate(quotation.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-600">{t('Customer Name')}:</p>
                                        <p className="text-lg">{quotation.service_job.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-600">{t('Phone')}:</p>
                                        <p className="text-lg">{quotation.service_job.customer_phone}</p>
                                    </div>
                                </div>

                                {/* Device Details */}
                                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <h3 className="font-semibold mb-2 text-slate-700 flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />
                                        {t('Device Information')}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {/* <div>
                                            <span className="font-semibold">{t('Type')}:</span> {quotation.service_job.device_type || 'N/A'}
                                        </div> */}
                                        <div>
                                            <span className="font-semibold">{t('Brand')}:</span> {quotation.service_job.device_brand || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">{t('Model')}:</span> {quotation.service_job.device_model || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-semibold">{t('Serial')}:</span> {quotation.service_job.device_serial || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3 text-slate-700">{t('Quotation Items')}</h3>
                                    <div className="overflow-hidden rounded-lg border border-slate-300">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                    <th className="border border-slate-300 p-2 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">#</th>
                                                    <th className="border border-slate-300 p-2 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Item Description')}</th>
                                                    <th className="border border-slate-300 p-2 text-center text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Type')}</th>
                                                    <th className="border border-slate-300 p-2 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Qty')}</th>
                                                    <th className="border border-slate-300 p-2 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Unit Price')} (Rs.)</th>
                                                    <th className="border border-slate-300 p-2 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">{t('Amount')} (Rs.)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {quotation.items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-sky-50/50">
                                                        <td className="border border-slate-300 p-2">{index + 1}</td>
                                                        <td className="border border-slate-300 p-2">{item.item_name}</td>
                                                        <td className="border border-slate-300 p-2 text-center text-xs">
                                                            {item.item_type === 'part' && t('Part')}
                                                            {item.item_type === 'service_charge' && t('Service')}
                                                            {item.item_type === 'other' && t('Other')}
                                                        </td>
                                                        <td className="border border-slate-300 p-2 text-right">{item.quantity}</td>
                                                        <td className="border border-slate-300 p-2 text-right">
                                                            {parseFloat(item.unit_price.toString()).toLocaleString('en-LK', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="border border-slate-300 p-2 text-right font-semibold">
                                                            {(item.quantity * parseFloat(item.unit_price.toString())).toLocaleString(
                                                                'en-LK',
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                }
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gradient-to-r from-sky-50 to-blue-50 font-bold">
                                                    <td colSpan={5} className="border border-slate-300 p-2 text-right text-sky-900">
                                                        {t('Total Amount')}:
                                                    </td>
                                                    <td className="border border-slate-300 p-2 text-right text-lg text-vismass-blue">
                                                        Rs. {parseFloat(quotation.total_amount).toLocaleString('en-LK', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Notes */}
                                {quotation.notes && (
                                    <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <h3 className="font-semibold mb-2 text-slate-700">{t('Notes')}:</h3>
                                        <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
                                    </div>
                                )}

                                {/* Terms & Conditions */}
                                <div className="mt-8 text-xs text-slate-600 border-t pt-4">
                                    <h4 className="font-semibold mb-2">{t('Terms & Conditions')}:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>{t('This quotation is valid for 30 days from the date of issue.')}</li>
                                        <li>{t('Prices are subject to change without prior notice.')}</li>
                                        <li>{t('Payment terms: As agreed upon acceptance of quotation.')}</li>
                                        <li>{t('Warranty terms apply as per manufacturer specifications.')}</li>
                                    </ul>
                                </div>

                                {/* Footer */}
                                <div className="mt-12 pt-6 border-t-2 flex justify-between items-end">
                                    <div>
                                        <p className="text-sm text-slate-600">{t('Prepared by')}:</p>
                                        <p className="font-semibold">
                                            {quotation.created_by
                                                ? `${quotation.created_by.first_name} ${quotation.created_by.last_name}`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-600">{t('Customer Signature')}:</p>
                                        <div className="mt-2 border-b border-slate-400 w-48"></div>
                                        <p className="text-xs text-slate-500 mt-1">{t('Date')}: _______________</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-6 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50 no-print">
                    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="text-xs text-gray-500">© VISMASS POS System • {t('Quotation Management')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
