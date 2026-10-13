import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Building2, MapPin, Phone, User, Edit, ArrowLeft, Calendar, Tag, Mail, Globe, CheckCircle, Truck, FileText } from 'lucide-react';

interface Company {
    company_code: string;
    company_name: string;
}

interface Section {
    section_code: string;
    name: string;
}

interface Supplier {
    AdrKy: number;
    company_code: string;
    section_code: string;
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
    Status: string | null;
    created_at: string;
    updated_at: string;
    company?: Company;
    section?: Section;
}

interface Props {
    supplier: Supplier;
}

export default function SupplierShow({ supplier }: Props) {

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const fullName = `${supplier.FstNm} ${supplier.MidNm || ''} ${supplier.LstNm || ''}`.trim();

    return (
        <AppLayout breadcrumbs={[
            { title: 'Suppliers', href: '/suppliers' },
            { title: fullName, href: `/suppliers/${supplier.AdrKy}` }
        ]}>
            <Head title="Suppliers - Distribution System" />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <Link
                                    href="/suppliers"
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Truck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {fullName}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        Supplier Details
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/suppliers/${supplier.AdrKy}/edit`}
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Edit className="mr-1.5 h-4 w-4" />
                                Edit Supplier
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">

                    {/* Main Content Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Information Card */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Building2 className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">Basic Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Tag className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Supplier ID</p>
                                                <p className="font-medium text-slate-800">#{supplier.AdrKy}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <User className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Full Name</p>
                                                <p className="font-medium text-slate-800">{fullName}</p>
                                            </div>
                                        </div>
                                        {supplier.CtPerson && (
                                            <div className="flex items-center space-x-3">
                                                <User className="w-4 h-4 text-vismass-blue" />
                                                <div>
                                                    <p className="text-sm text-slate-500">Contact Person</p>
                                                    <p className="font-medium text-slate-800">{supplier.CtPerson}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Created</p>
                                                <p className="font-medium text-slate-800">{formatDate(supplier.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Last Updated</p>
                                                <p className="font-medium text-slate-800">{formatDate(supplier.updated_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 rounded-full ${supplier.Status === '1' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="text-sm text-slate-500">Status</p>
                                                <p className={`font-medium ${supplier.Status === '1' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {supplier.Status === '1' ? 'Active' : 'Inactive'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            {(supplier.Address || supplier.Town || supplier.City || supplier.Country) && (
                                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <MapPin className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">Address Information</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {supplier.Address && (
                                            <div className="flex items-start space-x-3">
                                                <MapPin className="w-4 h-4 text-vismass-blue mt-1" />
                                                <div>
                                                    <p className="text-sm text-slate-500">Street Address</p>
                                                    <p className="font-medium text-slate-800 whitespace-pre-line">{supplier.Address}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-7">
                                            {supplier.Town && (
                                                <div>
                                                    <p className="text-sm text-slate-500">Town</p>
                                                    <p className="font-medium text-slate-800">{supplier.Town}</p>
                                                </div>
                                            )}
                                            {supplier.City && (
                                                <div>
                                                    <p className="text-sm text-slate-500">City</p>
                                                    <p className="font-medium text-slate-800">{supplier.City}</p>
                                                </div>
                                            )}
                                            {supplier.Country && (
                                                <div>
                                                    <p className="text-sm text-slate-500">Country</p>
                                                    <p className="font-medium text-slate-800">{supplier.Country}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Company & Branch Information */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Building2 className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">Company & Branch Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Building2 className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Company</p>
                                                <p className="font-medium text-slate-800">{supplier.company?.company_name || supplier.company_code || 'Not assigned'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Tag className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Company Code</p>
                                                <p className="font-medium text-slate-800">{supplier.company_code}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Building2 className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Branch/Section</p>
                                                <p className="font-medium text-slate-800">{supplier.section?.name || supplier.section_code || 'Not assigned'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Tag className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Section Code</p>
                                                <p className="font-medium text-slate-800">{supplier.section_code}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* VAT Information */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">VAT Information</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-3">
                                            <CheckCircle className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">VAT Registration Status</p>
                                                <p className={`font-medium ${Number(supplier.fVATRegistered) ? 'text-green-600' : 'text-gray-600'}`}>
                                                    {Number(supplier.fVATRegistered) ? 'Registered' : 'Not Registered'}
                                                </p>
                                            </div>
                                        </div>
                                        {!!Number(supplier.fVATRegistered) && supplier.VATNo && (
                                            <div className="flex items-center space-x-3">
                                                <Tag className="w-4 h-4 text-vismass-blue" />
                                                <div>
                                                    <p className="text-sm text-slate-500">VAT Number</p>
                                                    <p className="font-medium text-slate-800">{supplier.VATNo}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information Sidebar */}
                        <div className="space-y-6">
                            {/* Contact Card */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Phone className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">Contact Information</h2>
                                </div>

                                <div className="space-y-4">
                                    {supplier.TP1 && (
                                        <div className="flex items-center space-x-3">
                                            <Phone className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Primary Phone</p>
                                                <a href={`tel:${supplier.TP1}`} className="font-medium text-vismass-blue hover:text-vismass-blue/80 transition-colors">
                                                    {supplier.TP1}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {supplier.Fax && (
                                        <div className="flex items-center space-x-3">
                                            <FileText className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Fax</p>
                                                <p className="font-medium text-slate-800">{supplier.Fax}</p>
                                            </div>
                                        </div>
                                    )}

                                    {supplier.Email && (
                                        <div className="flex items-center space-x-3">
                                            <Mail className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Email</p>
                                                <a href={`mailto:${supplier.Email}`} className="font-medium text-vismass-blue hover:text-vismass-blue/80 transition-colors break-all">
                                                    {supplier.Email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {supplier.Website && (
                                        <div className="flex items-center space-x-3">
                                            <Globe className="w-4 h-4 text-vismass-blue" />
                                            <div>
                                                <p className="text-sm text-slate-500">Website</p>
                                                <a href={supplier.Website} target="_blank" rel="noopener noreferrer" className="font-medium text-vismass-blue hover:text-vismass-blue/80 transition-colors break-all">
                                                    {supplier.Website}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {(!supplier.TP1 && !supplier.Fax && !supplier.Email && !supplier.Website) && (
                                        <p className="text-slate-500 text-sm italic">No contact information available</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions Card */}
                            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                                <h2 className="text-xl font-semibold text-slate-800 mb-4">Actions</h2>
                                <div className="space-y-3">
                                    <Link
                                        href={`/suppliers/${supplier.AdrKy}/edit`}
                                        className="w-full bg-vismass-blue hover:bg-vismass-blue/90 text-white px-4 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium inline-flex items-center justify-center space-x-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Supplier</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-12 text-slate-600">
                        <p className="text-sm">Supplier details • Part of your distribution network</p>
                    </div>
                </div>
                </main>
            </div>
        </AppLayout>
    );
}