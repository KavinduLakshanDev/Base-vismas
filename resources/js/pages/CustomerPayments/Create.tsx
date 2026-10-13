import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CreditCard, Receipt, ArrowLeft } from 'lucide-react';
import CustomerPaymentForm from './PaymentForm';

interface Customer {
  AdrKy: number;
  FstNm: string;
  LstNm: string;
  AdrCd: string;
  AccKy: number;
}

export default function CustomerPaymentCreate({ customers, payments }: { customers: Customer[], payments: any }) {
    const { flash } = usePage().props as any;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Customer Payments'), href: '/customer-payments' },
        { title: t('Create Payment'), href: '/customer-payments/create' }
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-slate-50">
                <Head title={t('Create Customer Payment')} />

                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <CreditCard className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Create Customer Payment')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Record and process customer payment transactions')}
                                    </p>
                                </div>
                            </div>
                            <a
                                href="/customer-payments"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                {t('Back to List')}
                            </a>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Success Message */}
                        {flash?.success && (
                            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 shadow-sm">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-emerald-100 p-2 mr-3">
                                        <Receipt className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-900 font-semibold text-sm">{t('Success')}</h4>
                                        <p className="text-emerald-700 text-xs">{flash.success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Container */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-lg bg-white/20 p-1.5 shadow">
                                        <Receipt className="w-4 h-4 text-white" />
                                    </div>
                                    <h2 className="text-base font-semibold text-white">{t('Payment Details')}</h2>
                                </div>
                            </div>

                            <div className="p-4">
                                <CustomerPaymentForm customers={customers} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AppSidebarLayout>
    );
}

