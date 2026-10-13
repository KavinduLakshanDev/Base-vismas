import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ArrowLeft, Edit2, Shield, Key, FileText, Calendar, Users, Building } from 'lucide-react';
import { t } from '@/lib/i18n';

declare function route(name: string, params?: any): string;

interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    level: string;
    company?: {
        id: number;
        name: string;
    };
    section?: {
        id: number;
        name: string;
    };
    is_system_role: boolean;
}

interface Permission {
    id: number;
    name: string;
    slug: string;
    description?: string;
    created_at: string;
    updated_at: string;
    roles?: Role[];
}

interface Props {
    permission: Permission;
}

export default function Show({ permission }: Props) {
    const roles = permission.roles || [];

    const formatLevel = (level: string) => {
        return level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <AppLayout>
            <Head title={`${t('Permission')}: ${permission.name}`} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href={route('permissions.index')}
                                    className="rounded-xl bg-white/20 p-3 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <Shield className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Permission Details')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Details for')} {permission.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0 mb-6">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-vismass-blue to-vismass-grey bg-clip-text text-transparent mb-2">
                            {permission.name}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Review permission properties, security slug, and role memberships')}
                        </p>
                    </div>

                    {/* Card Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-8">
                        {/* Basic Information */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                    <Shield className="w-5 h-5 text-vismass-blue" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-800">
                                    {t('Basic Information')}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Shield className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Permission Name')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-sm font-semibold text-slate-900">{permission.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Key className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Permission Slug')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span className="font-mono text-sm font-semibold text-vismass-blue">
                                            {permission.slug}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <FileText className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Description')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-sm text-slate-700">
                                            {permission.description || (
                                                <span className="text-slate-400 italic">{t('No description provided')}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Metadata */}
                        <div className="rounded-xl bg-slate-50 p-6 border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-vismass-blue" />
                                {t('System Information')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-slate-500">{t('Created At')}:</span>
                                    <span className="ml-2 text-slate-800">
                                        {new Date(permission.created_at).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-slate-500">{t('Last Updated')}:</span>
                                    <span className="ml-2 text-slate-800">
                                        {new Date(permission.updated_at).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Roles Section */}
                        {roles.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Users className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        {t('Assigned Roles')} ({roles.length})
                                    </h2>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Role Name')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Slug')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Level')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Type')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {roles.map((role) => (
                                                <tr key={role.id} className="hover:bg-sky-50/50">
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-900">
                                                        {role.name}
                                                    </td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-mono text-vismass-blue">
                                                        {role.slug}
                                                    </td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-700">
                                                        {formatLevel(role.level)}
                                                    </td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            role.is_system_role
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-slate-100 text-slate-800'
                                                        }`}>
                                                            {role.is_system_role ? t('System') : t('Custom')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end pt-6 border-t border-slate-200 space-x-3">
                            <Link
                                href={route('permissions.index')}
                                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                            >
                                {t('Back to List')}
                            </Link>
                            <Link
                                href={route('permissions.edit', permission.id)}
                                className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium inline-flex items-center space-x-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span>{t('Edit Permission')}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-slate-600">
                        <p className="text-sm">VISMASS POS System • {t('Permissions Management')} • v1.0.0</p>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}