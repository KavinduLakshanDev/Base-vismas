import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    MapPin,
    Phone,
    Save,
    User,
    TrendingUp,
    Edit,
    Globe,
    Mail,
    CheckCircle
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
        title: t('Edit Customer'),
        href: '#',
    },
];

interface CustomerFormData {
    Title: string;
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
    Website: string;
    CurBal: string;
    CrLmt: string;
    fVATRegistered: boolean;
    VATNo: string;
    Status: string;
}

interface Customer {
    AdrKy: number;
    company_code?: string;
    Title: string;
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
    Website: string;
    CurBal: number;
    CrLmt: number;
    fVATRegistered: boolean;
    VATNo: string;
    Status: string;
}

interface Props {
    customer: Customer;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function EditCustomer({ customer, flash }: Props) {
    const [formData, setFormData] = useState<CustomerFormData>({
        Title: customer.Title || '',
        FstNm: customer.FstNm || '',
        MidNm: customer.MidNm || '',
        LstNm: customer.LstNm || '',
        CtPerson: customer.CtPerson || '',
        Address: customer.Address || '',
        Town: customer.Town || '',
        City: customer.City || '',
        Country: customer.Country || '',
        TP1: customer.TP1 || '',
        Fax: customer.Fax || '',
        Email: customer.Email || '',
        Website: customer.Website || '',
        CurBal: customer.CurBal?.toString() || '0.00',
        CrLmt: customer.CrLmt?.toString() || '0.00',
        fVATRegistered: customer.fVATRegistered || false,
        VATNo: customer.VATNo || '',
        Status: customer.Status || 'A',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showVatField, setShowVatField] = useState(customer.fVATRegistered || false);

    const handleInputChange = (field: keyof CustomerFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleVatCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, fVATRegistered: checked }));
        setShowVatField(checked);
        if (!checked) {
            setFormData(prev => ({ ...prev, VATNo: '' }));
        }
    };

    const handleSubmit = () => {
        const normalizedCurBal = String(
            parseFloat(String(formData.CurBal).replace(/,/g, '')) || 0,
        );
        const normalizedCrLmt = String(
            parseFloat(String(formData.CrLmt).replace(/,/g, '')) || 0,
        );

        const payload = {
            ...formData,
            CurBal: normalizedCurBal,
            CrLmt: normalizedCrLmt,
        };

        router.put(`/admin/customers/${customer.AdrKy}`, payload, {
            onSuccess: () => {
                // Success handled by redirect in controller
            },
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFormData({
            FstNm: customer.FstNm || '',
            MidNm: customer.MidNm || '',
            LstNm: customer.LstNm || '',
            Title: customer.Title || '',
            CtPerson: customer.CtPerson || '',
            Address: customer.Address || '',
            Town: customer.Town || '',
            City: customer.City || '',
            Country: customer.Country || '',
            TP1: customer.TP1 || '',
            Fax: customer.Fax || '',
            Email: customer.Email || '',
            Website: customer.Website || '',
            CurBal: customer.CurBal?.toString() || '0.00',
            CrLmt: customer.CrLmt?.toString() || '0.00',
            fVATRegistered: customer.fVATRegistered || false,
            VATNo: customer.VATNo || '',
            Status: customer.Status || 'A',
        });
        setErrors({});
        setShowVatField(customer.fVATRegistered || false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit Customer')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <Link
                                    href={`/admin/customers/${customer.AdrKy}`}
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Edit className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Edit Customer')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {customer.FstNm} {customer.LstNm}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">

                        {/* Form Container */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
                                {/* Personal Information Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <User className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">{t('Personal Information')}</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <User className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Title')}
                                            </label>
                                            <select
                                                value={formData.Title || ''}
                                                onChange={(e) => handleInputChange('Title', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                            >
                                                <option value="">{t('Select Title')}</option>
                                                <option value="Mr">{t('Mr')}</option>
                                                <option value="Mrs">{t('Mrs')}</option>
                                                <option value="Ms">{t('Ms')}</option>
                                                <option value="Dr">{t('Dr')}</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <User className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('First Name')} *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.FstNm}
                                                onChange={(e) => handleInputChange('FstNm', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="First name"
                                                required
                                            />
                                            {errors.FstNm && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.FstNm}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">{t('Middle Name')}</label>
                                            <input
                                                type="text"
                                                value={formData.MidNm}
                                                onChange={(e) => handleInputChange('MidNm', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="Middle name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">{t('Last Name')}</label>
                                            <input
                                                type="text"
                                                value={formData.LstNm}
                                                onChange={(e) => handleInputChange('LstNm', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="Last name"
                                            />
                                            {errors.LstNm && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.LstNm}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 flex items-center">
                                            <User className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Contact Person Name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.CtPerson}
                                            onChange={(e) => handleInputChange('CtPerson', e.target.value)}
                                            className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                            placeholder="Contact person name"
                                        />
                                    </div> */}
                                </div>

                                {/* Contact Information Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <Phone className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">{t('Contact Information')}</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <Phone className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Phone')} *
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.TP1}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Allow + at start, then digits only, max 12 chars with + or 10 without
                                                    if (value.startsWith('+')) {
                                                        const cleaned = '+' + value.slice(1).replace(/\D/g, '');
                                                        if (cleaned.length <= 13) handleInputChange('TP1', cleaned);
                                                    } else {
                                                        const cleaned = value.replace(/\D/g, '');
                                                        if (cleaned.length <= 10) handleInputChange('TP1', cleaned);
                                                    }
                                                }}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
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
                                                {t('Fax')}
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.Fax}
                                                onChange={(e) => handleInputChange('Fax', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="e.g., +94 712 345 678"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <Mail className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Email')}
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.Email}
                                                onChange={(e) => handleInputChange('Email', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="customer@example.com"
                                            />
                                            {errors.Email && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.Email}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <Globe className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Website')}
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.Website}
                                                onChange={(e) => handleInputChange('Website', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="https://www.example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <MapPin className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">{t('Address Information')}</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Street Address')} *
                                            </label>
                                            <textarea
                                                value={formData.Address}
                                                onChange={(e) => handleInputChange('Address', e.target.value)}
                                                rows={3}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="Full address"
                                                required
                                            />
                                            {errors.Address && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.Address}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">{t('Town')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.Town}
                                                    onChange={(e) => handleInputChange('Town', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Town"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">{t('City')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.City}
                                                    onChange={(e) => handleInputChange('City', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="City"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">{t('Country')}</label>
                                                <input
                                                    type="text"
                                                    value={formData.Country}
                                                    onChange={(e) => handleInputChange('Country', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Country"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Information Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <CreditCard className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">{t('Financial Information')}</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Current Balance')}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.CurBal}
                                                onChange={(e) => handleInputChange('CurBal', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <CreditCard className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Credit Limit')}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.CrLmt}
                                                onChange={(e) => handleInputChange('CrLmt', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* VAT Information */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4 border border-blue-200">
                                            <input
                                                id="vat-registered"
                                                type="checkbox"
                                                checked={formData.fVATRegistered}
                                                onChange={(e) => handleVatCheckboxChange(e.target.checked)}
                                                className="h-4 w-4 rounded border-blue-300 text-vismass-blue focus:ring-vismass-blue/20"
                                            />
                                            <label htmlFor="vat-registered" className="block text-sm font-semibold text-blue-800">
                                                {t('VAT Registered')}
                                            </label>
                                        </div>

                                        {showVatField && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center">
                                                    <CreditCard className="w-4 h-4 mr-2 text-vismass-blue" />
                                                    {t('VAT Number')} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.VATNo}
                                                    onChange={(e) => handleInputChange('VATNo', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Enter VAT number"
                                                    required={formData.fVATRegistered}
                                                />
                                                {errors.VATNo && (
                                                    <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                        {errors.VATNo}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">{t('Status')}</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 bg-green-50 rounded-xl p-4 border border-green-200">
                                            <input
                                                id="status-active"
                                                type="radio"
                                                name="status"
                                                value="A"
                                                checked={formData.Status === 'A'}
                                                onChange={(e) => handleInputChange('Status', e.target.value)}
                                                className="h-4 w-4 border-green-300 text-green-600 focus:ring-green-200"
                                            />
                                            <label htmlFor="status-active" className="block text-sm font-semibold text-green-800">
                                                ✓ {t('Active')}
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4 border border-red-200">
                                            <input
                                                id="status-inactive"
                                                type="radio"
                                                name="status"
                                                value="I"
                                                checked={formData.Status === 'I'}
                                                onChange={(e) => handleInputChange('Status', e.target.value)}
                                                className="h-4 w-4 border-red-300 text-red-600 focus:ring-red-200"
                                            />
                                            <label htmlFor="status-inactive" className="block text-sm font-semibold text-red-800">
                                                ✗ {t('Inactive')}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-6 border-t border-slate-200">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center rounded-xl bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 font-semibold transition-all duration-200 shadow-lg"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {t('Update Customer')}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-8 text-slate-600">
                            <p className="text-sm">{t('Keep your customer information up to date • Manage your customer relationships efficiently')}</p>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
