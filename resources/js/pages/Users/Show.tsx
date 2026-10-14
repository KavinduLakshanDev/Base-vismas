import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import axios from 'axios';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Edit2,
    Key,
    Layers,
    Mail,
    MapPin,
    Pen,
    Phone,
    Shield,
    Trash2,
    UserCheck,
    Users,
    UserX,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { type User } from './Index';

interface ShowUserProps {
    user: User;
}

export default function UsersShow({ user: initialUser }: ShowUserProps) {
    const { auth } = usePage<any>().props;
    const authUser = auth?.user;
    const [user, setUser] = useState<User>(initialUser);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('User Management'), href: '/users' },
        { title: `${user.first_name} ${user.last_name}`, href: `/users/${user.id}` },
    ];

    const getInitials = (first: string, last: string) => {
        return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';
    };

    const getRoleBadgeStyle = (user: User) => {
        if (user.user_type === 'super_admin' || user.role_id === 1) {
            return 'bg-purple-100 text-purple-800 border-purple-200';
        }
        if (user.role_id === 2 || user.role?.level === 'company_admin') {
            return 'bg-blue-100 text-blue-800 border-blue-200';
        }
        if (user.role_id === 5) {
            return 'bg-amber-100 text-amber-800 border-amber-200';
        }
        if (user.role_id === 7) {
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        }
        return 'bg-slate-100 text-slate-800 border-slate-200';
    };

    const handleToggleStatus = async () => {
        try {
            await axios.post(`/users/${user.id}/toggle`);
            setUser((prev) => ({ ...prev, is_active: !prev.is_active }));
            toast.success(
                `${user.first_name || user.username} is now ${!user.is_active ? 'Active' : 'Inactive'}`
            );
        } catch (error) {
            try {
                await axios.put(`/api/users/${user.id}`, {
                    ...user,
                    is_active: !user.is_active,
                });
                setUser((prev) => ({ ...prev, is_active: !prev.is_active }));
                toast.success('User status updated');
            } catch (err) {
                toast.error('Failed to update status');
            }
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await axios.delete(`/api/users/${user.id}`);
            toast.success('User deleted successfully');
            router.visit('/users');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
            setIsDeleting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="User Management">
            <Head title={`${user.first_name} ${user.last_name} - ${t('User Details')}`} />

            <div className="flex-1 bg-slate-50">
                {/* Header Banner */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/users"
                                    className="rounded-xl bg-white/20 p-2.5 hover:bg-white/30 text-white transition-all duration-200"
                                    title={t('Back to Users')}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {user.first_name} {user.last_name}
                                    </h1>
                                    <p className="text-sm text-sky-100">
                                        @{user.username} • {user.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Link
                                    href={`/users/${user.id}/edit`}
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                                >
                                    <Pen className="mr-1.5 h-4 w-4" />
                                    <span>{t('Edit User')}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Details */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Top Identity Card */}
                    <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center space-x-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-vismass-blue text-2xl font-bold text-white shadow-md">
                                    {getInitials(user.first_name, user.last_name)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {user.first_name} {user.last_name}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeStyle(
                                                user
                                            )}`}
                                        >
                                            <Shield className="h-3 w-3" />
                                            <span>{user.role?.name || (user.user_type === 'super_admin' ? 'Super Admin' : 'Standard User')}</span>
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                user.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    user.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                                }`}
                                            />
                                            <span>{user.is_active ? t('Active') : t('Inactive')}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleToggleStatus}
                                    className="text-xs"
                                >
                                    {user.is_active ? (
                                        <div className="flex items-center text-amber-700">
                                            <UserX className="h-4 w-4 mr-1" />
                                            <span>{t('Deactivate Account')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-emerald-700">
                                            <UserCheck className="h-4 w-4 mr-1" />
                                            <span>{t('Activate Account')}</span>
                                        </div>
                                    )}
                                </Button>
                                {authUser?.id !== user.id && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        <span>{t('Delete')}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1: Account Information */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                                <div className="rounded-lg bg-sky-50 p-2 text-vismass-blue">
                                    <Users className="h-4 w-4" />
                                </div>
                                <h3 className="font-semibold text-slate-800">
                                    {t('Account Details')}
                                </h3>
                            </div>
                            <dl className="space-y-3 text-xs">
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Username')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-slate-900">
                                        @{user.username}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Email Address')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-slate-900 flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{user.email}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Phone Number')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-slate-900 flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{user.phone || t('Not specified')}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Account Type')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-slate-900 capitalize">
                                        {user.user_type?.replace(/_/g, ' ') || 'User'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Card 2: Role & Permissions */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <h3 className="font-semibold text-slate-800">
                                    {t('Role & Permissions')}
                                </h3>
                            </div>
                            <dl className="space-y-3 text-xs">
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Role Name')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-slate-900">
                                        {user.role?.name || (user.user_type === 'super_admin' ? 'Super Admin' : 'Unassigned')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Access Level')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-slate-900 capitalize">
                                        {user.role?.level?.replace(/_/g, ' ') || (user.user_type === 'super_admin' ? 'Super Admin' : 'Section')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Role Description')}
                                    </dt>
                                    <dd className="mt-0.5 text-xs text-slate-600">
                                        {user.role?.description || t('Standard user role permissions apply.')}
                                    </dd>
                                </div>
                                {user.role && (
                                    <div className="pt-2">
                                        <Link
                                            href={`/roles/${user.role.id}`}
                                            className="text-xs font-semibold text-vismass-blue hover:underline inline-flex items-center gap-1"
                                        >
                                            <span>{t('View Role Permissions')}</span>
                                            <span>→</span>
                                        </Link>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Card 3: Organization & Assignment */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <h3 className="font-semibold text-slate-800">
                                    {t('Organization Assignment')}
                                </h3>
                            </div>
                            <dl className="space-y-3 text-xs">
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Company')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-slate-900">
                                        {user.company?.name || user.company_code || 'VISMASS Group'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Section')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-slate-900 flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{user.section?.name || user.section_code || t('All Sections')}</span>
                                    </dd>
                                </div>
                                {user.section?.section_type && (
                                    <div>
                                        <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                            {t('Section Type')}
                                        </dt>
                                        <dd className="mt-0.5 text-sm font-medium text-slate-900 capitalize">
                                            {user.section.section_type}
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                        {t('Member Since')}
                                    </dt>
                                    <dd className="mt-0.5 text-xs text-slate-600 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        <span>
                                            {user.created_at
                                                ? new Date(user.created_at).toLocaleDateString('en-GB', {
                                                      year: 'numeric',
                                                      month: 'long',
                                                      day: 'numeric',
                                                  })
                                                : '—'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </main>
            </div>

            {/* Delete Modal */}
            <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-full bg-rose-100 p-2.5 text-rose-600">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <div>
                                <AlertDialog.Title className="text-lg font-bold text-slate-900">
                                    {t('Delete User Account')}
                                </AlertDialog.Title>
                                <AlertDialog.Description className="text-xs text-slate-500">
                                    {t('This action cannot be undone.')}
                                </AlertDialog.Description>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-6">
                            {t('Are you sure you want to permanently delete')} <strong className="text-slate-900">{user.first_name} {user.last_name}</strong> (@{user.username})?
                        </p>

                        <div className="flex justify-end gap-2">
                            <AlertDialog.Cancel asChild>
                                <Button variant="outline" size="sm" disabled={isDeleting}>
                                    {t('Cancel')}
                                </Button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="bg-rose-600 hover:bg-rose-700"
                                >
                                    {isDeleting ? t('Deleting...') : t('Delete User')}
                                </Button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </AppLayout>
    );
}
