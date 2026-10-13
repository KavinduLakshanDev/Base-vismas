import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Shield,
    Building,
    Users,
    CheckCircle2,
    TrendingUp,
    Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';
import { t } from '@/lib/i18n';

declare function route(name: string, params?: any): string;

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
    permissions: Array<{
        id: number;
        name: string;
    }>;
    created_at: string;
}

interface Props {
    roles: {
        data: Role[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from?: number;
        to?: number;
        links: any[];
    };
    filters: {
        search?: string;
        level?: string;
    };
    success?: string;
    error?: string;
}

export default function Index({ roles, filters, success, error }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [levelFilter, setLevelFilter] = useState(filters.level || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { hasPermission } = usePermission();

    const { auth } = usePage().props as any;
    const currentUserType = auth?.user?.user_type;

    React.useEffect(() => {
        if (success) toast.success(success);
        if (error) toast.error(error);
    }, [success, error]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('roles.index'),
            {
                search: searchTerm || undefined,
                level: levelFilter || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleLevelChange = (value: string) => {
        const level = value === 'all' ? '' : value;
        setLevelFilter(level);
        router.get(
            route('roles.index'),
            {
                search: searchTerm || undefined,
                level: level || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setLevelFilter('');
        router.get(
            route('roles.index'),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (role: Role) => {
        setRoleToDelete(role);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (roleToDelete) {
            setIsDeleting(true);
            router.delete(route('roles.destroy', roleToDelete.id), {
                data: { force: true },
                onSuccess: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setRoleToDelete(null);
                    toast.success('Role deleted successfully');
                },
                onError: () => {
                    setIsDeleting(false);
                    toast.error('Failed to delete role');
                },
            });
        }
    };

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
            <Head title={t('Roles Management')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header Banner */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Shield className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Roles Management')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage user roles and their assigned permissions')}
                                    </p>
                                </div>
                            </div>
                            {hasPermission('roles.create') && (
                                <Link
                                    href={route('roles.create')}
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    {t('New Role')}
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2 shadow-sm">
                                        <Users className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Roles')}</p>
                                        <p className="text-lg font-bold text-gray-900">{roles.total}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <Shield className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('System Roles')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {roles.data.filter((r) => r.is_system_role).length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Custom Roles')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {roles.data.filter((r) => !r.is_system_role).length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Active Roles')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {roles.data.filter((r) => r.permissions && r.permissions.length > 0).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Card */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                    <div>
                                        <h3 className="text-base font-semibold text-white">
                                            {t('Roles List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('Browse and manage user roles and permissions')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Filters */}
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                                    <form onSubmit={handleSearch} className="space-y-3 md:space-y-0 md:flex md:space-x-3">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder={t('Search by role name, description, or slug...')}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:w-52">
                                            <div className="relative">
                                                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <select
                                                    value={levelFilter || 'all'}
                                                    onChange={(e) => handleLevelChange(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                >
                                                    <option value="all">{t('All Levels')}</option>
                                                    <option value="super_admin">{t('Super Admin')}</option>
                                                    <option value="company_admin">{t('Company Admin')}</option>
                                                    <option value="branch_admin">{t('Branch Admin')}</option>
                                                    <option value="user">{t('User')}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                type="submit"
                                                className="inline-flex items-center bg-vismass-blue text-white px-4 py-2 text-sm rounded-lg hover:bg-vismass-blue/90 transition-all duration-200 font-medium shadow-sm"
                                            >
                                                <Search className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Search')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="inline-flex items-center bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                                            >
                                                <Filter className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Clear')}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Table */}
                                {roles.data.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Role Name')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Level')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Scope')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Type')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Permissions')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Description')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {roles.data.map((role) => (
                                                    <tr key={role.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <Shield className="h-4 w-4 text-vismass-blue" />
                                                                <span className="text-xs font-semibold text-gray-900">
                                                                    {role.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLevelBadgeClass(role.level)}`}>
                                                                {formatLevel(role.level)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-600">
                                                            {role.company ? (
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{role.company.name}</div>
                                                                    {role.section && (
                                                                        <div className="text-xs text-gray-500">{role.section.name}</div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-500 font-medium">{t('System Wide')}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                role.is_system_role
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : 'bg-orange-100 text-orange-800'
                                                            }`}>
                                                                {role.is_system_role ? t('System') : t('Custom')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs">
                                                            {role.permissions && role.permissions.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {role.permissions.slice(0, 2).map((perm) => (
                                                                        <span
                                                                            key={perm.id}
                                                                            className="bg-slate-100 text-slate-700 text-xs px-1.5 py-0.5 rounded border border-slate-200"
                                                                        >
                                                                            {perm.name}
                                                                        </span>
                                                                    ))}
                                                                    {role.permissions.length > 2 && (
                                                                        <span className="text-xs font-medium text-slate-500">
                                                                            +{role.permissions.length - 2} {t('more')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">{t('No permissions')}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs truncate">
                                                            {role.description || (
                                                                <span className="text-gray-400 italic">{t('No description')}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-right">
                                                            <div className="flex items-center justify-end space-x-3">
                                                                {hasPermission('roles.view') && (
                                                                    <Link
                                                                        href={route('roles.show', role.id)}
                                                                        className="inline-flex items-center text-sky-600 hover:text-sky-800"
                                                                    >
                                                                        <Eye className="mr-1 h-3.5 w-3.5" />
                                                                        {t('View')}
                                                                    </Link>
                                                                )}
                                                                {hasPermission('roles.edit') && (
                                                                    <Link
                                                                        href={route('roles.edit', role.id)}
                                                                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        <Edit2 className="mr-1 h-3.5 w-3.5" />
                                                                        {t('Edit')}
                                                                    </Link>
                                                                )}
                                                                {hasPermission('roles.delete') &&
                                                                    (!role.is_system_role ||
                                                                        (role.is_system_role &&
                                                                            currentUserType === 'super_admin' &&
                                                                            role.slug !== 'super_admin')) && (
                                                                        <button
                                                                            onClick={() => handleDelete(role)}
                                                                            className="inline-flex items-center text-red-600 hover:text-red-800"
                                                                        >
                                                                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                                            {t('Delete')}
                                                                        </button>
                                                                    )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="mx-auto h-10 w-10 text-gray-400 mb-3">
                                            <Shield className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No roles found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Get started by creating a new user role.')}
                                        </p>
                                        {hasPermission('roles.create') && (
                                            <Link
                                                href={route('roles.create')}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-vismass-blue hover:bg-vismass-blue/90"
                                            >
                                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Create Role')}
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {/* Pagination */}
                                {roles.last_page > 1 && (
                                    <div className="border-t border-gray-200 mt-4 pt-3">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                            <div className="text-xs text-gray-500">
                                                {t('Showing')} {roles.from || 1} {t('to')} {roles.to || roles.data.length} {t('of')} {roles.total} {t('results')}
                                            </div>
                                            <div className="flex space-x-1">
                                                {roles.links.map((link, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => link.url && router.visit(link.url)}
                                                        disabled={!link.url}
                                                        className={`rounded px-2.5 py-1 text-xs font-medium ${
                                                            link.active
                                                                ? 'bg-vismass-blue text-white'
                                                                : link.url
                                                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-6 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="text-xs text-gray-500">
                                © VISMASS POS System • {t('Roles Management')} • v1.0.0
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Delete Confirmation Modal */}
            <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl bg-white p-6 shadow-xl border border-slate-200">
                        <AlertDialog.Title className="text-lg font-bold text-gray-900 mb-2">
                            {t('Delete Role')}
                        </AlertDialog.Title>
                        <AlertDialog.Description className="text-sm text-gray-600 mb-6">
                            {t('Are you sure you want to delete')} &quot;{roleToDelete?.name}&quot;?{' '}
                            {t('This action cannot be undone and may affect users who currently hold this role.')}
                        </AlertDialog.Description>
                        <div className="flex justify-end space-x-3">
                            <AlertDialog.Cancel asChild>
                                <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    {t('Cancel')}
                                </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 shadow-sm"
                                >
                                    {isDeleting ? t('Deleting...') : t('Delete Role')}
                                </button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </AppLayout>
    );
}