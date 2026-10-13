import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Shield,
    Key,
    Database,
    CheckCircle2,
    Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';
import { t } from '@/lib/i18n';

declare function route(name: string, params?: any): string;

interface Permission {
    id: number;
    name: string;
    slug: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    permissions: {
        data: Permission[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from?: number;
        to?: number;
        links: any[];
    };
    success?: string;
    error?: string;
}

export default function Index({ permissions, success, error }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { hasPermission } = usePermission();

    React.useEffect(() => {
        if (success) toast.success(success);
        if (error) toast.error(error);
    }, [success, error]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('permissions.index'),
            { search: searchTerm || undefined },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        router.get(
            route('permissions.index'),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (permission: Permission) => {
        setPermissionToDelete(permission);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (permissionToDelete) {
            setIsDeleting(true);
            router.delete(route('permissions.destroy', permissionToDelete.id), {
                data: { force: true },
                onSuccess: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setPermissionToDelete(null);
                    toast.success('Permission deleted successfully');
                },
                onError: () => {
                    setIsDeleting(false);
                    toast.error('Failed to delete permission');
                },
            });
        }
    };

    const distinctModulesCount = new Set(
        permissions.data.map((p) => p.slug.split('.')[0] || p.slug.split('_')[0]),
    ).size;

    const filteredPermissions = permissions.data.filter((permission) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            permission.name.toLowerCase().includes(q) ||
            permission.slug.toLowerCase().includes(q) ||
            (permission.description && permission.description.toLowerCase().includes(q))
        );
    });

    return (
        <AppLayout footerModuleName="Permissions Management">
            <Head title={t('Permissions Management')} />

            <div className="flex-1 bg-slate-50">
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
                                        {t('Permissions')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage system permissions and access controls')}
                                    </p>
                                </div>
                            </div>
                            {hasPermission('permissions.create') && (
                                <Link
                                    href={route('permissions.create')}
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    {t('Add Permission')}
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
                                        <Shield className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Permissions')}</p>
                                        <p className="text-lg font-bold text-gray-900">{permissions.total}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <Key className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Modules')}</p>
                                        <p className="text-lg font-bold text-gray-900">{distinctModulesCount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Showing on Page')}</p>
                                        <p className="text-lg font-bold text-gray-900">{permissions.data.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <Database className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Pages')}</p>
                                        <p className="text-lg font-bold text-gray-900">{permissions.last_page}</p>
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
                                            {t('Permissions List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View and manage all system permissions')}
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
                                                    placeholder={t('Search by permission name, slug, or description...')}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
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
                                {filteredPermissions.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Name')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Slug')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Description')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Created')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredPermissions.map((permission) => (
                                                    <tr key={permission.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs font-semibold text-gray-900">
                                                                {permission.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="font-mono text-xs font-semibold text-vismass-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                {permission.slug}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs truncate">
                                                            {permission.description || (
                                                                <span className="text-gray-400 italic">{t('No description')}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                                                            {new Date(permission.created_at).toLocaleDateString('en-GB')}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-right">
                                                            <div className="flex items-center justify-end space-x-3">
                                                                <Link
                                                                    href={route('permissions.show', permission.id)}
                                                                    className="inline-flex items-center text-sky-600 hover:text-sky-800"
                                                                >
                                                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                                                    {t('View')}
                                                                </Link>
                                                                {hasPermission('permissions.edit') && (
                                                                    <Link
                                                                        href={route('permissions.edit', permission.id)}
                                                                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        <Edit2 className="mr-1 h-3.5 w-3.5" />
                                                                        {t('Edit')}
                                                                    </Link>
                                                                )}
                                                                {hasPermission('permissions.delete') && (
                                                                    <button
                                                                        onClick={() => handleDelete(permission)}
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
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No permissions found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Get started by creating a new system permission.')}
                                        </p>
                                        {hasPermission('permissions.create') && (
                                            <Link
                                                href={route('permissions.create')}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-vismass-blue hover:bg-vismass-blue/90"
                                            >
                                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Create Permission')}
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {/* Pagination */}
                                {permissions.last_page > 1 && (
                                    <div className="border-t border-gray-200 mt-4 pt-3">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                            <div className="text-xs text-gray-500">
                                                {t('Showing')} {permissions.from || 1} {t('to')} {permissions.to || permissions.data.length} {t('of')} {permissions.total} {t('results')}
                                            </div>
                                            <div className="flex space-x-1">
                                                {permissions.links.map((link, idx) => (
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

            </div>

            {/* Delete Confirmation Modal */}
            <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl bg-white p-6 shadow-xl border border-slate-200">
                        <AlertDialog.Title className="text-lg font-bold text-gray-900 mb-2">
                            {t('Delete Permission')}
                        </AlertDialog.Title>
                        <AlertDialog.Description className="text-sm text-gray-600 mb-6">
                            {t('Are you sure you want to delete')} &quot;{permissionToDelete?.name}&quot; ({permissionToDelete?.slug})?{' '}
                            {t('This action cannot be undone and will revoke access for all assigned roles.')}
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
                                    {isDeleting ? t('Deleting...') : t('Delete Permission')}
                                </button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </AppLayout>
    );
}