import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    MapPin,
    PencilIcon,
    RotateCcw,
    Save,
    User,
} from 'lucide-react';
import { useState } from 'react';
// import { AlertCircle, Check, X } from 'lucide-react';

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
        title: t('Edit Privilege User'),
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
}

interface PrivilegeUserFormData {
    section_code: number;
    privCusName: string;
    NIC: string;
    address: string;
    town: string;
    city: string;
    country: string;
    phone: string;
    gender: 'male' | 'female' | '';
    card_no: string;
    regdate: string;
    finAct: boolean;
    is_active: boolean;
}

interface Props {
    privilegeUser: PrivilegeUser;
    sections?: Array<{
        value: number;
        label: string;
    }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PrivilegeUserEdit({
    privilegeUser,
    sections = [],
    flash,
}: Props) {
    const [validationErrors, setValidationErrors] = useState<{
        [key: string]: string;
    }>({});

    const { data, setData, put, processing, reset } =
        useForm<PrivilegeUserFormData>({
            section_code: privilegeUser.section_code,
            privCusName: privilegeUser.privCusName,
            NIC: privilegeUser.NIC || '',
            address: privilegeUser.address,
            town: privilegeUser.town || '',
            city: privilegeUser.city,
            country: privilegeUser.country,
            phone: privilegeUser.phone || '',
            gender: privilegeUser.gender || '',
            card_no: privilegeUser.card_no || '',
            regdate: privilegeUser.regdate.split('T')[0],
            finAct: privilegeUser.finAct,
            is_active: privilegeUser.is_active,
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/admin/privilege-users/${privilegeUser.id}`, {
            onSuccess: () => {
                // Handle success
            },
            onError: (errors) => {
                setValidationErrors(errors);
            },
        });
    };

    // Clear messages
    const clearError = () => {
        setValidationErrors({});
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Edit Privilege User')} />

            {/* Radiant Background */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-blue-600/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-6 max-w-5xl mx-auto">
                    {/* Navigation */}
                    <div className="mb-6">
                        <Link
                            href={`/admin/privilege-users/${privilegeUser.id}`}
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Privilege User Details</span>
                        </Link>
                    </div>

                    {/* Enhanced Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/25">
                            <PencilIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            {t('Edit Privilege User')}
                        </h1>
                        <p className="text-blue-600/80 text-lg">
                            {t('Update information for')} <span className="font-semibold text-blue-700">{data.privCusName}</span>
                        </p>
                    </div>

                    {/* Form Container with Radiant Effects */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Customer Info Banner */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">{data.privCusName}</h3>
                                            <p className="text-blue-600">{t('Customer Code')}: {privilegeUser.customer_code}</p>
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                                        data.is_active
                                            ? 'border border-green-200 bg-green-50 text-green-800'
                                            : 'border border-red-200 bg-red-50 text-red-800'
                                    }`}>
                                        {data.is_active ? t('Active') : t('Inactive')}
                                    </div>
                                </div>
                            </div>

                            {/* Basic Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{t('Basic Information')}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            {t('Section')} <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            value={data.section_code || ''}
                                            onChange={(e) =>
                                                setData(
                                                    'section_code',
                                                    e.target.value
                                                        ? parseInt(e.target.value)
                                                        : 0,
                                                )
                                            }
                                            className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                            required
                                        >
                                            <option key="select-section" value="">
                                                {t('Select Section')}
                                            </option>
                                            {sections.map((section) => (
                                                <option
                                                    key={section.value}
                                                    value={section.value}
                                                >
                                                    {section.label}
                                                </option>
                                            ))}
                                        </select>
                                        {validationErrors.section_code && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.section_code}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <User className="w-4 h-4 mr-2 text-blue-500" />
                                            {t('Customer Name')} <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.privCusName}
                                            onChange={(e) =>
                                                setData('privCusName', e.target.value)
                                            }
                                            className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                            required
                                            placeholder={t('Enter customer name')}
                                        />
                                        {validationErrors.privCusName && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.privCusName}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
                                            {t('NIC Number')}
                                        </label>
                                        <input
                                            type="text"
                                            value={data.NIC}
                                            onChange={(e) =>
                                                setData('NIC', e.target.value)
                                            }
                                            className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                            placeholder={t('Enter NIC number')}
                                        />
                                        {validationErrors.NIC && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.NIC}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <User className="w-4 h-4 mr-2 text-blue-500" />
                                            {t('Gender')}
                                        </label>
                                        <select
                                            value={data.gender}
                                            onChange={(e) =>
                                                setData(
                                                    'gender',
                                                    e.target.value as
                                                        | 'male'
                                                        | 'female'
                                                        | '',
                                                )
                                            }
                                            className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                        >
                                            <option key="select-gender" value="">
                                                {t('Select Gender')}
                                            </option>
                                            <option key="male" value="male">
                                                {t('Male')}
                                            </option>
                                            <option key="female" value="female">
                                                {t('Female')}
                                            </option>
                                        </select>
                                        {validationErrors.gender && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.gender}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {t('Phone Number')}
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData('phone', e.target.value)
                                            }
                                            className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                            pattern="[0-9]{10}"
                                            maxLength={10}
                                            placeholder="0712345678"
                                        />
                                        {validationErrors.phone && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
                                            {t('Card Number')}
                                        </label>
                                        <input
                                            type="text"
                                            value={data.card_no}
                                            onChange={(e) =>
                                                setData('card_no', e.target.value)
                                            }
                                            className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                            pattern="[0-9]*"
                                            inputMode="numeric"
                                            placeholder="123456789"
                                        />
                                        {validationErrors.card_no && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.card_no}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{t('Address Information')}</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            {t('Address')} <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.address}
                                            onChange={(e) =>
                                                setData('address', e.target.value)
                                            }
                                            className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                            required
                                            placeholder={t('Enter full address')}
                                        />
                                        {validationErrors.address && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {validationErrors.address}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('Town')}</label>
                                            <input
                                                type="text"
                                                value={data.town}
                                                onChange={(e) =>
                                                    setData('town', e.target.value)
                                                }
                                                className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                placeholder={t('Enter town')}
                                            />
                                            {validationErrors.town && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {validationErrors.town}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('City')} <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={data.city}
                                                onChange={(e) =>
                                                    setData('city', e.target.value)
                                                }
                                                className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                required
                                                placeholder={t('Enter city')}
                                            />
                                            {validationErrors.city && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {validationErrors.city}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('Country')} <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={data.country}
                                                onChange={(e) =>
                                                    setData('country', e.target.value)
                                                }
                                                className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                required
                                                placeholder={t('Enter country')}
                                            />
                                            {validationErrors.country && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {validationErrors.country}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {t('Registration Date')} <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={data.regdate}
                                                onChange={(e) =>
                                                    setData('regdate', e.target.value)
                                                }
                                                className="block w-full rounded-xl border border-blue-200 bg-white/50 backdrop-blur-sm px-3 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                required
                                            />
                                            {validationErrors.regdate && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {validationErrors.regdate}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <CreditCard className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{t('Additional Information')}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex items-center space-x-3 p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
                                        <input
                                            type="checkbox"
                                            checked={data.finAct}
                                            onChange={(e) =>
                                                setData('finAct', e.target.checked)
                                            }
                                            className="h-5 w-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 transition-all duration-300"
                                            id="finAct"
                                        />
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="finAct">
                                                {t('Financially Active')}
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">{t('Enable financial transactions')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-green-50/50 rounded-xl border border-green-200/50">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) =>
                                                setData('is_active', e.target.checked)
                                            }
                                            className="h-5 w-5 rounded border-green-300 text-green-600 focus:ring-green-500 transition-all duration-300"
                                            id="is_active"
                                        />
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="is_active">
                                                {t('Active Status')}
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">{t('User can access the system')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center p-4 bg-purple-50/50 rounded-xl border border-purple-200/50">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">{sections.length}</div>
                                            <div className="text-sm text-purple-700 font-medium">{t('Available Sections')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-6 border-t border-blue-200/50">
                                <div className="flex space-x-4">
                                    <Link
                                        href="/admin/privilege-users"
                                        className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow-sm hover:bg-gray-50/80 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        {t('Cancel')}
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>{t('Updating...')}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <Save className="w-5 h-5" />
                                                <span>{t('Update Privilege User')}</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-blue-600/60">
                        <p className="text-sm">{t('Keep customer information up to date • Manage privileged customers efficiently')}</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}