import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
    Database,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    PowerOff,
    Power,
    Tag,
    Eye,
    Edit2,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { t } from '@/lib/i18n';
import { create, index, destroy, show, edit, toggle } from '@/routes/admin/controller-master';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('Admin'),
        href: '#',
    },
    {
        title: t('Controller Master'),
        href: '#',
    },
];

interface ControlMaster {
    id: number;
    concode: string;
    conkey: string;
    conname: string;
    is_active: boolean;
    company_code?: string;
    section_code?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    controls: {
        data: ControlMaster[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        search?: string;
    };
}

export default function ControllerMasterIndex({ controls, filters }: Props) {
    const rawControls = controls?.data || [];
    const activeCount = rawControls.filter((c) => c.is_active).length;
    const inactiveCount = rawControls.filter((c) => !c.is_active).length;
    const uniqueKeysCount = new Set(rawControls.map((c) => c.conkey)).size;

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [controlToDelete, setControlToDelete] = useState<ControlMaster | null>(null);

    const { delete: deleteForm, processing } = useForm({});

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            index().url,
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        router.get(
            index().url,
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (control: ControlMaster) => {
        setControlToDelete(control);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (controlToDelete) {
            deleteForm(destroy(controlToDelete.id).url, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setControlToDelete(null);
                },
            });
        }
    };

    const toggleStatus = (control: ControlMaster) => {
        router.post(
            toggle(control.id).url,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const filteredControls = rawControls.filter((control) => {
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && control.is_active) ||
            (statusFilter === 'inactive' && !control.is_active);

        const matchesLocalSearch =
            search === '' ||
            control.conname.toLowerCase().includes(search.toLowerCase()) ||
            control.conkey.toLowerCase().includes(search.toLowerCase()) ||
            control.concode.toLowerCase().includes(search.toLowerCase());

        return matchesStatus && matchesLocalSearch;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="Controller Master">
            <Head title={t('Controller Master')} />

            <div className="flex-1 bg-slate-50">
                {/* Header Banner */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Database className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Controller Master')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage system controller keys and masters')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={create().url}
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('Add Controller')}
                            </Link>
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
                                        <Database className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Controllers')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {controls?.total ?? rawControls.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Active')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {activeCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <PowerOff className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Inactive')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {inactiveCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <Tag className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Unique Keys')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {uniqueKeysCount}
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
                                            {t('Controllers List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View and manage all controller masters')}
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
                                                    placeholder={t('Search by code, key, or name...')}
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:w-48">
                                            <div className="relative">
                                                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                >
                                                    <option value="all">{t('All Status')}</option>
                                                    <option value="active">{t('Active')}</option>
                                                    <option value="inactive">{t('Inactive')}</option>
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
                                {filteredControls.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Code')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Key')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Name')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Status')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredControls.map((control) => (
                                                    <tr key={control.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs font-medium text-gray-900">{control.concode}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="font-mono text-xs font-semibold text-vismass-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                {control.conkey}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs font-medium text-gray-900">{control.conname}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                                control.is_active
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {control.is_active ? t('Active') : t('Inactive')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                                            <div className="flex items-center space-x-3">
                                                                <Link
                                                                    href={show(control.id).url}
                                                                    className="inline-flex items-center text-sky-600 hover:text-sky-800"
                                                                >
                                                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                                                    {t('View')}
                                                                </Link>
                                                                <Link
                                                                    href={edit(control.id).url}
                                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                                                >
                                                                    <Edit2 className="mr-1 h-3.5 w-3.5" />
                                                                    {t('Edit')}
                                                                </Link>
                                                                <button
                                                                    onClick={() => toggleStatus(control)}
                                                                    className={`inline-flex items-center ${
                                                                        control.is_active
                                                                            ? 'text-orange-600 hover:text-orange-800'
                                                                            : 'text-green-600 hover:text-green-800'
                                                                    }`}
                                                                    title={control.is_active ? t('Deactivate') : t('Activate')}
                                                                >
                                                                    {control.is_active ? (
                                                                        <>
                                                                            <PowerOff className="mr-1 h-3.5 w-3.5" />
                                                                            {t('Disable')}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Power className="mr-1 h-3.5 w-3.5" />
                                                                            {t('Enable')}
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(control)}
                                                                    className="inline-flex items-center text-red-600 hover:text-red-800"
                                                                >
                                                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                                    {t('Delete')}
                                                                </button>
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
                                            <Database className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">
                                            {t('No controllers found')}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Get started by creating a new controller master.')}
                                        </p>
                                        <Link
                                            href={create().url}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-vismass-blue hover:bg-vismass-blue/90"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Create Controller')}
                                        </Link>
                                    </div>
                                )}

                                {/* Pagination */}
                                {controls?.last_page > 1 && (
                                    <div className="border-t border-gray-200 mt-4 pt-3">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                            <div className="text-xs text-gray-500">
                                                {t('Showing')} {controls.from} {t('to')} {controls.to} {t('of')} {controls.total} {t('results')}
                                            </div>
                                            <div className="flex space-x-1">
                                                {controls.links.map((link, idx) => (
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
                            {t('Delete Controller Master')}
                        </AlertDialog.Title>
                        <AlertDialog.Description className="text-sm text-gray-600 mb-6">
                            {t('Are you sure you want to delete')} &quot;{controlToDelete?.conname}&quot; ({controlToDelete?.conkey})?{' '}
                            {t('This action cannot be undone and may affect associated codes.')}
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
                                    disabled={processing}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 shadow-sm"
                                >
                                    {processing ? t('Deleting...') : t('Delete Controller')}
                                </button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </AppLayout>
    );
}