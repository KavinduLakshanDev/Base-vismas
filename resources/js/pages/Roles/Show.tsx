import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ArrowLeft,
    Edit2,
    Shield,
    Building,
    Building2,
    Users,
    Key,
    Code,
    Calendar,
    FileText,
} from 'lucide-react';
import { t } from '@/lib/i18n';

declare function route(name: string, params?: any): string;

interface Permission {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    level: 'super_admin' | 'company_admin' | 'branch_admin' | 'user';
    company?: {
        id: number;
        name: string;
    };
    section?: {
        id: number;
        name: string;
    };
    is_system_role: boolean;
    created_at: string;
    updated_at: string;
    permissions: Permission[];
    users: User[];
}

interface Props {
    role: Role;
}

export default function Show({ role }: Props) {
    const formatLevel = (level: string) => {
        return level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const getLevelBadgeClass = (level: string) => {
        switch (level) {
            case 'super_admin':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'company_admin':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'branch_admin':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <AppLayout>
            <Head title={`${t('Role')}: ${role.name}`} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href={route('roles.index')}
                                    className="rounded-xl bg-white/20 p-3 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <Shield className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Role Details')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Details for')} {role.name}
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
                            {role.name}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Review access tier, capabilities, and assigned team members')}
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
                                    {t('Role Information')}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Shield className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Role Name')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-sm font-semibold text-slate-900">{role.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Key className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Role Slug')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span className="font-mono text-sm font-semibold text-vismass-blue">
                                            {role.slug}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Building className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Access Level')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLevelBadgeClass(role.level)}`}>
                                            {formatLevel(role.level)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Scope & Type')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2">
                                        <span className="text-sm font-medium text-slate-800">
                                            {role.company ? role.company.name : t('System Wide')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            role.is_system_role ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {role.is_system_role ? t('System') : t('Custom')}
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
                                            {role.description || (
                                                <span className="text-slate-400 italic">{t('No description provided')}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Permissions Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Key className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        {t('Assigned Permissions')} ({role.permissions.length})
                                    </h2>
                                </div>
                                <Link
                                    href={route('roles.edit', role.id)}
                                    className="text-xs font-medium text-vismass-blue hover:underline"
                                >
                                    {t('Modify Permissions')}
                                </Link>
                            </div>

                            {role.permissions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {role.permissions.map((permission) => (
                                        <div
                                            key={permission.id}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-900">
                                                    {permission.name}
                                                </span>
                                                <span className="font-mono text-xs text-vismass-blue bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                    {permission.slug}
                                                </span>
                                            </div>
                                            {permission.description && (
                                                <p className="text-xs text-slate-500 line-clamp-1">
                                                    {permission.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-500">
                                    <p className="text-xs">{t('No permissions assigned to this role.')}</p>
                                </div>
                            )}
                        </div>

                        {/* Assigned Users Section */}
                        {role.users && role.users.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Users className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        {t('Assigned Users')} ({role.users.length})
                                    </h2>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Username')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Full Name')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Email')}
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                    {t('Status')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {role.users.map((user) => (
                                                <tr key={user.id} className="hover:bg-sky-50/50">
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-900">
                                                        {user.username}
                                                    </td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-800">
                                                        {user.first_name} {user.last_name}
                                                    </td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-600">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {user.is_active ? t('Active') : t('Inactive')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Integration & Usage Tips */}
                        <div className="rounded-xl bg-slate-50 p-6 border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                                <Code className="w-4 h-4 mr-2 text-vismass-blue" />
                                {t('Framework Usage')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="text-slate-500 block mb-1 font-sans">{t('PHP Role Check')}:</span>
                                    <span className="text-vismass-blue font-semibold">{`$user->hasRole('${role.slug}')`}</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="text-slate-500 block mb-1 font-sans">{t('Route Middleware')}:</span>
                                    <span className="text-vismass-blue font-semibold">{`middleware('role:${role.slug}')`}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end pt-6 border-t border-slate-200 space-x-3">
                            <Link
                                href={route('roles.index')}
                                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                            >
                                {t('Back to List')}
                            </Link>
                            <Link
                                href={route('roles.edit', role.id)}
                                className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium inline-flex items-center space-x-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span>{t('Edit Role')}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-slate-600">
                        <p className="text-sm">VISMASS POS System • {t('Roles Management')} • v1.0.0</p>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}