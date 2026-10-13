import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building, CheckCircle, MapPin, Phone, Save, Truck, User, FileText, Mail, Edit, Globe } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import { update } from '@/routes/suppliers';

interface Supplier {
    AdrKy: number;
    FstNm: string;
    MidNm: string | null;
    LstNm: string | null;
    Address: string | null;
    Town: string | null;
    City: string | null;
    Country: string | null;
    CtPerson: string | null;
    TP1: string | null;
    Fax: string | null;
    Email: string | null;
    Website: string | null;
    VATNo: string | null;
    fVATRegistered: boolean;
}

interface Props {
    supplier: Supplier;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function SupplierEdit({ supplier, flash }: Props) {
    const { data, setData, put, processing, errors, reset } = useForm({
        FstNm: supplier.FstNm || '',
        MidNm: supplier.MidNm || '',
        LstNm: supplier.LstNm || '',
        Address: supplier.Address || '',
        Town: supplier.Town || '',
        City: supplier.City || '',
        Country: supplier.Country || '',
        CtPerson: supplier.CtPerson || '',
        TP1: supplier.TP1 || '',
        Fax: supplier.Fax || '',
        Email: supplier.Email || '',
        Website: supplier.Website || '',
        fVATRegistered: Boolean(supplier.fVATRegistered),
        VATNo: supplier.VATNo || '',
    });

    const [showVatField, setShowVatField] = useState(Boolean(supplier.fVATRegistered));

    useEffect(() => {
        setShowVatField(Boolean(supplier.fVATRegistered));
    }, [supplier.fVATRegistered]);

    const handleVatCheckboxChange = (checked: boolean) => {
        setData('fVATRegistered', checked);
        setShowVatField(checked);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(update.url(supplier.AdrKy));
    };

    const handleReset = () => {
        reset();
        setShowVatField(supplier.fVATRegistered || false);
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Suppliers', href: '/suppliers' },
        { title: 'Edit', href: `/suppliers/${supplier.AdrKy}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Supplier" />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <Link
                                    href={`/suppliers/${supplier.AdrKy}`}
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Edit className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        Edit Supplier
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {supplier.FstNm} {supplier.LstNm}
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

                            {/* Edit Form */}
                            <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Left Column - Company Information */}
                                <div className="space-y-6">
                                    {/* Company Information Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <Building className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <h2 className="text-xl font-semibold text-slate-800">Company Information</h2>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <Truck className="w-4 h-4 mr-2 text-vismass-blue" />
                                                Supplier Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.FstNm}
                                                onChange={(e) => setData('FstNm', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="Supplier or Company name"
                                                required
                                            />
                                            {errors.FstNm && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.FstNm}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    Middle Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.MidNm}
                                                    onChange={(e) => setData('MidNm', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Middle name"
                                                />
                                                {errors.MidNm && (
                                                    <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                        {errors.MidNm}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.LstNm}
                                                    onChange={(e) => setData('LstNm', e.target.value)}
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
                                    </div>

                                    {/* Address Information */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <MapPin className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <h2 className="text-xl font-semibold text-slate-800">Address Information</h2>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-vismass-blue" />
                                                Address
                                            </label>
                                            <textarea
                                                value={data.Address}
                                                onChange={(e) => setData('Address', e.target.value)}
                                                rows={3}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="Full address"
                                            />
                                            {errors.Address && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.Address}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Town</label>
                                                <input
                                                    type="text"
                                                    value={data.Town}
                                                    onChange={(e) => setData('Town', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="Town"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">City</label>
                                                <input
                                                    type="text"
                                                    value={data.City}
                                                    onChange={(e) => setData('City', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="City"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Country</label>
                                                <input
                                                    type="text"
                                                    value={data.Country}
                                                    onChange={(e) => setData('Country', e.target.value)}
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
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
                                            <h2 className="text-xl font-semibold text-slate-800">Contact Information</h2>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <User className="w-4 h-4 mr-2 text-vismass-blue" />
                                                Contact Person
                                            </label>
                                            <input
                                                type="text"
                                                value={data.CtPerson}
                                                onChange={(e) => setData('CtPerson', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="Contact person name"
                                            />
                                            {errors.CtPerson && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.CtPerson}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 flex items-center">
                                                    <Phone className="w-4 h-4 mr-2 text-vismass-blue" />
                                                    Phone Number
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
                                                    className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                    placeholder="+94 XX XXX XXXX or 07X XXX XXXX"
                                                />
                                                {errors.TP1 && (
                                                    <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                        {errors.TP1}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                                <Phone className="w-4 h-4 mr-2 text-vismass-blue" />
                                                Fax Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={data.Fax}
                                                onChange={(e) => setData('Fax', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
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
                                                <Mail className="w-4 h-4 mr-2 text-vismass-blue" />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={data.Email}
                                                onChange={(e) => setData('Email', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="supplier@example.com"
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
                                                Website
                                            </label>
                                            <input
                                                type="url"
                                                value={data.Website}
                                                onChange={(e) => setData('Website', e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                placeholder="https://www.example.com"
                                            />
                                            {errors.Website && (
                                                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                    {errors.Website}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* VAT Information */}
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <Building className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <h2 className="text-xl font-semibold text-slate-800">VAT Information</h2>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                <input
                                                    id="vat-registered"
                                                    type="checkbox"
                                                    checked={data.fVATRegistered}
                                                    onChange={(e) => handleVatCheckboxChange(e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-vismass-blue focus:ring-vismass-blue/20"
                                                />
                                                <label htmlFor="vat-registered" className="block text-sm font-semibold text-slate-800">
                                                    VAT Registered
                                                </label>
                                            </div>

                                            {showVatField && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-700 flex items-center">
                                                        <FileText className="w-4 h-4 mr-2 text-vismass-blue" />
                                                        VAT Number *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.VATNo}
                                                        onChange={(e) => setData('VATNo', e.target.value)}
                                                        className="block w-full rounded-xl border border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 px-4 py-3"
                                                        placeholder="Enter VAT number"
                                                        required={data.fVATRegistered}
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
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end pt-6 border-t border-slate-200">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center rounded-xl bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 font-semibold transition-all duration-200 shadow-lg"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Updating...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Save className="w-5 h-5" />
                                            <span>Update Supplier</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-slate-600">
                        <p className="text-sm">Keep your supplier information up to date • Manage your procurement network efficiently</p>
                    </div>
                </div>
            </main>
        </div>
        </AppLayout>
    );
}
