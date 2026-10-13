import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    CheckCircle,
    MapPin,
    PencilIcon,
    Phone,
    User,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('Privilege User Management'),
        href: '/admin/privilege-users',
    },
    {
        title: t('Privilege User Details'),
        href: '#',
    },
];

interface PrivilegeUser {
    id: number;
    company_code: number;
    section_code: number;
    customer_code: string;
    privCusName: string;
    NIC: string | null;
    address: string;
    town: string | null;
    city: string;
    country: string;
    phone: string | null;
    gender: 'male' | 'female' | null;
    card_no: string | null;
    regdate: string;
    ent_user: string | null;
    finAct: boolean;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    company?: {
        name: string;
        company_code: string;
    };
    section?: {
        name: string;
        section_code: string;
    };
}

interface Props {
    privilegeUser: PrivilegeUser;
}

export default function PrivilegeUserShow({ privilegeUser }: Props) {
    const getFullName = () => {
        return privilegeUser.privCusName;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Privilege User Details')} />

            {/* Radiant Background */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-blue-600/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-6 max-w-4xl mx-auto">
                    {/* Navigation */}
                    <div className="mb-6">
                        <Link
                            href="/admin/privilege-users"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Privilege Users</span>
                        </Link>
                    </div>

                    {/* Enhanced Header */}
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${privilegeUser.is_active ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-full mb-4 shadow-lg shadow-blue-500/25`}>
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            {privilegeUser.privCusName}
                        </h1>
                        <div className="flex items-center justify-center space-x-4 text-blue-600/80">
                            <span className="text-lg font-medium">{privilegeUser.customer_code}</span>
                            <span className="text-blue-400">•</span>
                            <span className={`text-lg font-medium ${privilegeUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                {privilegeUser.is_active ? t('Active') : t('Inactive')}
                            </span>
                        </div>
                    </div>

                    {/* Main Content Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Information Card */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{t('Basic Information')}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <User className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">{t('Full Name')}</p>
                                                <p className="font-medium text-gray-800">{getFullName()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Building className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">{t('Customer Code')}</p>
                                                <p className="font-medium text-gray-800">{privilegeUser.customer_code}</p>
                                            </div>
                                        </div>
                                        {privilegeUser.NIC && (
                                            <div className="flex items-center space-x-3">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500">{t('NIC Number')}</p>
                                                    <p className="font-medium text-gray-800">{privilegeUser.NIC}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {privilegeUser.gender && (
                                            <div className="flex items-center space-x-3">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500">{t('Gender')}</p>
                                                    <p className="font-medium text-gray-800">
                                                        {privilegeUser.gender === 'male' ? t('Male') : t('Female')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 rounded-full ${privilegeUser.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="text-sm text-gray-500">{t('Status')}</p>
                                                <p className={`font-medium ${privilegeUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                    {privilegeUser.is_active ? t('Active') : t('Inactive')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 rounded-full ${privilegeUser.finAct ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <p className="text-sm text-gray-500">{t('Financial Status')}</p>
                                                <p className={`font-medium ${privilegeUser.finAct ? 'text-green-600' : 'text-red-600'}`}>
                                                    {privilegeUser.finAct ? t('Active') : t('Inactive')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{t('Contact Information')}</h2>
                                </div>

                                <div className="space-y-4">
                                    {privilegeUser.phone && (
                                        <div className="flex items-center space-x-3">
                                            <Phone className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">{t('Phone')}</p>
                                                <a href={`tel:${privilegeUser.phone}`} className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                                    {privilegeUser.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {privilegeUser.card_no && (
                                        <div className="flex items-center space-x-3">
                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">{t('Card Number')}</p>
                                                <p className="font-medium text-gray-800">{privilegeUser.card_no}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                        <div>
                                            <p className="text-sm text-gray-500">{t('Registration Date')}</p>
                                            <p className="font-medium text-gray-800">{formatDate(privilegeUser.regdate)}</p>
                                        </div>
                                    </div>

                                    {privilegeUser.ent_user && (
                                        <div className="flex items-center space-x-3">
                                            <User className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">{t('Entered By')}</p>
                                                <p className="font-medium text-gray-800">{privilegeUser.ent_user}</p>
                                            </div>
                                        </div>
                                    )}

                                    {(!privilegeUser.phone && !privilegeUser.card_no) && (
                                        <p className="text-gray-500 text-sm italic">{t('No additional contact information')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{t('Address Information')}</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <MapPin className="w-4 h-4 text-blue-500 mt-1" />
                                        <div>
                                            <p className="text-sm text-gray-500">{t('Street Address')}</p>
                                            <p className="font-medium text-gray-800">{privilegeUser.address}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-7">
                                        {privilegeUser.town && (
                                            <div>
                                                <p className="text-sm text-gray-500">{t('Town')}</p>
                                                <p className="font-medium text-gray-800">{privilegeUser.town}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-gray-500">{t('City')}</p>
                                            <p className="font-medium text-gray-800">{privilegeUser.city}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{t('Country')}</p>
                                            <p className="font-medium text-gray-800">{privilegeUser.country}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {privilegeUser.notes && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-800">{t('Notes')}</h2>
                                    </div>

                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {privilegeUser.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Contact Information Sidebar */}
                        <div className="space-y-6">
                            {/* Organization Information */}
                            {(privilegeUser.company || privilegeUser.section) && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Building className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-800">{t('Organization')}</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {privilegeUser.company && (
                                            <div className="flex items-center space-x-3">
                                                <Building className="w-4 h-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500">{t('Company')}</p>
                                                    <p className="font-medium text-gray-800">
                                                        {privilegeUser.company.company_code} - {privilegeUser.company.name}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {privilegeUser.section && (
                                            <div className="flex items-center space-x-3">
                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500">{t('Section')}</p>
                                                    <p className="font-medium text-gray-800">
                                                        {privilegeUser.section.section_code} - {privilegeUser.section.name}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{t('Timestamps')}</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                        <div>
                                            <p className="text-sm text-gray-500">{t('Created')}</p>
                                            <p className="font-medium text-gray-800">{formatDate(privilegeUser.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                        <div>
                                            <p className="text-sm text-gray-500">{t('Last Updated')}</p>
                                            <p className="font-medium text-gray-800">{formatDate(privilegeUser.updated_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('Actions')}</h2>
                                <div className="space-y-3">
                                    <Link
                                        href={`/admin/privilege-users/${privilegeUser.id}/edit`}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 font-medium inline-flex items-center justify-center space-x-2"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        <span>{t('Edit Privilege User')}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-12 text-blue-600/60">
                        <p className="text-sm">{t('Privilege user details • Customer management system')}</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}