import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Building,
    CreditCard,
    MapPin,
    Phone,
    Save,
    User,
    UserPlus,
    CheckCircle,
    FileText,
    Wrench,
    ArrowLeft
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('Customer Management'),
        href: '/admin/customers',
    },
    {
        title: t('Register Customer'),
        href: '#',
    },
];

interface CustomerFormData {
    FstNm: string;
    MidNm: string;
    LstNm: string;
    CtPerson: string;
    Address: string;
    Town: string;
    City: string;
    Country: string;
    TP1: string;
    Fax: string;
    Email: string;
    fVATRegistered: boolean;
    VATNo: string;
    CurBal: string;
    CrLmt: string;
    Status: string;
    IDNo: string;
    Title: string;
    Website: string;
}

interface Props {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CustomerCreate({ flash }: Props) {
    const [showVatField, setShowVatField] = useState(false);

    const { data, setData, processing, errors, reset } =
        useForm<CustomerFormData>({
            FstNm: '',
            MidNm: '',
            LstNm: '',
            CtPerson: '',
            Address: '',
            Town: '',
            City: '',
            Country: 'Sri Lanka',
            TP1: '',
            Fax: '',
            Email: '',
            fVATRegistered: false,
            VATNo: '',
            CurBal: '',
            CrLmt: '',
            Status: 'A',
            IDNo: '',
            Title: 'Mr',
            Website: '',
        });

    const handleVatCheckboxChange = (checked: boolean) => {
        setData('fVATRegistered', checked);
        setShowVatField(checked);
        if (!checked) {
            setData('VATNo', '');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Get the submit button that was clicked
        const target = e.target as HTMLFormElement;
        const submitButton = target.querySelector('button[type="submit"]:focus') as HTMLButtonElement;
        const action = submitButton?.value || 'register';

        const normalizedCurBal = String(
            parseFloat(String(data.CurBal).replace(/,/g, '')) || 0,
        );
        const normalizedCrLmt = String(
            parseFloat(String(data.CrLmt).replace(/,/g, '')) || 0,
        );

        const payload = {
            ...data,
            CurBal: normalizedCurBal,
            CrLmt: normalizedCrLmt,
            action: action, // Add the action to the payload
        };

        router.post('/admin/customers', payload, {
            onSuccess: (page: any) => {
                try {
                    const params = new URLSearchParams(window.location.search);
                    const returnTo = params.get('return_to');

                    // The controller now reliably sends created_customer in the flash props
                    const createdCustomerData = page?.props?.flash?.created_customer;

                    if (returnTo && createdCustomerData) {
                        const customerDetails = {
                            AccKy: createdCustomerData.AccKy || '',
                            customer_name: createdCustomerData.full_name || `${data.FstNm} ${data.LstNm}`.trim(),
                            customer_phone: createdCustomerData.TP1 || data.TP1,
                            customer_email: createdCustomerData.EMail || data.Email,
                            customer_address: createdCustomerData.Address || data.Address,
                        };
                        
                        sessionStorage.setItem('reServiceData', JSON.stringify(customerDetails));
                        window.location.href = returnTo;
                        return; // Stop further execution
                    }

                    // Handle the new action for going to service form
                    if (action === 'register_and_go_to_service' && createdCustomerData) {
                        // Don't set sessionStorage here - the controller handles the redirect with flash data
                        // Just let the controller redirect with flash data
                        return;
                    }
                } catch (err) {
                    console.error('Return flow after customer creation failed:', err);
                }

                // Default behavior if not returning or if data is missing
                reset();
                setShowVatField(false);
            },
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        reset();
        setShowVatField(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Customer Registration')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <Link
                                    href="/admin/customers"
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <UserPlus className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Register New Customer')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Create a new customer account in the system')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        {/* Success/Error Messages */}
                        {flash?.success && (
                            <div className="mb-6 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                                <div className="flex">
                                    <div className="shrink-0">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    </div>
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
                                    <div className="shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800">
                                            {flash.error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Left Column - Personal Information */}
                                <div className="space-y-6">
                                    {/* Personal Information Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <User className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <h2 className="text-xl font-semibold text-slate-800">{t('Personal Information')}</h2>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-vismass-blue" />
                                                    {t('Title')}
                                                </label>
                                                <select
                                                    value={data.Title}
                                                    onChange={(e) => setData('Title', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    required
                                                >
                                                    <option value="Mr">Mr</option>
                                                    <option value="Ms">Ms</option>
                                                    <option value="Mrs">Mrs</option>
                                                    <option value="Miss">Miss</option>
                                                    <option value="Mx">Mx</option>
                                                    <option value="Dr">Dr</option>
                                                    <option value="Prof">Prof</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center">
                                                    <FileText className="w-4 h-4 mr-2 text-vismass-blue" />
                                                    {t('NIC Number')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.IDNo}
                                                    onChange={(e) => setData('IDNo', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="NIC Number"
                                                />
                                                {errors.IDNo && (
                                                    <div className="mt-2 text-sm text-red-600">
                                                        {errors.IDNo}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    {t('First Name')} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.FstNm}
                                                    onChange={(e) => setData('FstNm', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="First name"
                                                    required
                                                />
                                                {errors.FstNm && (
                                                    <div className="mt-2 text-sm text-red-600">
                                                        {errors.FstNm}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    {t('Middle Name')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.MidNm}
                                                    onChange={(e) => setData('MidNm', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Middle name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    {t('Last Name')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.LstNm}
                                                    onChange={(e) => setData('LstNm', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Last name"
                                                />
                                                {errors.LstNm && (
                                                    <div className="mt-2 text-sm text-red-600">
                                                        {errors.LstNm}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Information */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <MapPin className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <h2 className="text-xl font-semibold text-slate-800">{t('Address Information')}</h2>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Address')}
                                            </label>
                                            <textarea
                                                value={data.Address}
                                                onChange={(e) => setData('Address', e.target.value)}
                                                rows={3}
                                                className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="Enter full address"
                                                required
                                            />
                                            {errors.Address && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.Address}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">{t('Town')}</label>
                                                <input
                                                    type="text"
                                                    value={data.Town}
                                                    onChange={(e) => setData('Town', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Town"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">{t('City')}</label>
                                                <input
                                                    type="text"
                                                    value={data.City}
                                                    onChange={(e) => setData('City', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="City"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">{t('Country')}</label>
                                                <input
                                                    type="text"
                                                    value={data.Country}
                                                    onChange={(e) => setData('Country', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Country"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Contact & Financial Information */}
                                <div className="space-y-6">
                                    {/* Contact Information */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <Phone className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <h2 className="text-xl font-semibold text-slate-800">{t('Contact Information')}</h2>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <Phone className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Phone Number')}
                                            </label>
                                            <input
                                                type="tel"
                                                value={data.TP1}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Allow + at start, then digits only, max 12 chars with + or 10 without
                                                    if (value.startsWith('+')) {
                                                        const cleaned = '+' + value.slice(1).replace(/\D/g, '');
                                                        if (cleaned.length <= 13) setData('TP1', cleaned);
                                                    } else {
                                                        const cleaned = value.replace(/\D/g, '');
                                                        if (cleaned.length <= 10) setData('TP1', cleaned);
                                                    }
                                                }}
                                                className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="+94 XX XXX XXXX or 07X XXX XXXX"
                                                required
                                            />
                                            {errors.TP1 && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.TP1}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <Phone className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Fax Number')}
                                            </label>
                                            <input
                                                type="tel"
                                                value={data.Fax}
                                                onChange={(e) => setData('Fax', e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="Fax number"
                                            />
                                            {errors.Fax && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.Fax}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Email Address')}
                                            </label>
                                            <input
                                                type="email"
                                                value={data.Email}
                                                onChange={(e) => setData('Email', e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="email@example.com"
                                            />
                                            {errors.Email && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.Email}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Website')}
                                            </label>
                                            <input
                                                type="url"
                                                value={data.Website}
                                                onChange={(e) => setData('Website', e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="https://www.example.com"
                                            />
                                        </div>
                                    </div>

                                    {/* VAT Information */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <Building className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <h2 className="text-xl font-semibold text-slate-800">{t('VAT Information')}</h2>
                                        </div>

                                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <input
                                                id="vat-registered"
                                                type="checkbox"
                                                checked={data.fVATRegistered}
                                                onChange={(e) => handleVatCheckboxChange(e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-vismass-blue focus:ring-vismass-blue/20"
                                            />
                                            <label htmlFor="vat-registered" className="block text-sm font-semibold text-slate-800">
                                                {t('VAT Registered')}
                                            </label>
                                        </div>

                                        {showVatField && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center">
                                                    <FileText className="w-4 h-4 mr-2 text-vismass-blue" />
                                                    {t('VAT Number')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.VATNo}
                                                    onChange={(e) => setData('VATNo', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Enter VAT number"
                                                />
                                                {errors.VATNo && (
                                                    <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                        {errors.VATNo}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Financial Information */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <CreditCard className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <h2 className="text-xl font-semibold text-slate-800">{t('Credit & Financial Information')}</h2>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <CreditCard className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Current Balance (Rs.)')}
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={data.CurBal}
                                                onChange={(e) => setData('CurBal', e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="0.00"
                                            />
                                            {errors.CurBal && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.CurBal}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <CreditCard className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Credit Limit (Rs.)')}
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={data.CrLmt}
                                                onChange={(e) => setData('CrLmt', e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="0.00"
                                            />
                                            {errors.CrLmt && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.CrLmt}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end pt-6 border-t border-slate-200 space-x-4">
                                <Button
                                    type="submit"
                                    name="action"
                                    value="register_and_go_to_service"
                                    disabled={processing}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 rounded-xl shadow-sm transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Processing...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Wrench className="w-5 h-5" />
                                            <span>{t('Register and Go to Service Form')}</span>
                                        </div>
                                    )}
                                </Button>
                                <Button
                                    type="submit"
                                    name="action"
                                    value="register"
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-sm transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Registering...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Save className="w-5 h-5" />
                                            <span>{t('Register Customer')}</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}