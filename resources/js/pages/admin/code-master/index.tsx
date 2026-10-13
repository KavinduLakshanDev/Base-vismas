import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
    Code,
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
import { create, show, edit, toggle, destroy } from '@/routes/admin/code-master';

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
        title: t('Code Master'),
        href: '#',
    },
];

interface ControlMaster {
    id: number;
    concode: string;
    conkey: string;
    conname: string;
    is_active: boolean;
}

interface CodeMaster {
    id: number;
    conkey: string;
    concode: string;
    catkey: string;
    cname: string;
    company_code: string | null;
    section_code: string | null;
    is_active: boolean;
    created_at: string;
    controlMaster?: ControlMaster;
}

interface Props {
    codes: {
        data: CodeMaster[];
        links: any[];
        meta: any;
    };
    controls: ControlMaster[];
    filters: {
        search?: string;
        control_key?: string;
    };
}

export default function CodeMasterIndex({ codes, controls, filters }: Props) {
    const rawCodes = codes?.data || [];
    const totalCodesCount = codes?.meta?.total ?? rawCodes.length;
    const activeCodesCount = rawCodes.filter((c) => c.is_active).length;
    const inactiveCodesCount = rawCodes.filter((c) => !c.is_active).length;

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedControl, setSelectedControl] = useState(filters.control_key || '');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [codeToDelete, setCodeToDelete] = useState<CodeMaster | null>(null);

    const { delete: deleteCode, processing: deleteProcessing } = useForm({});

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/code-master',
            {
                search: searchTerm || undefined,
                control_key: selectedControl || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedControl('');
        setStatusFilter('all');
        router.get(
            '/admin/code-master',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (code: CodeMaster) => {
        setCodeToDelete(code);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (codeToDelete) {
            deleteCode(`/admin/code-master/${codeToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setCodeToDelete(null);
                },
            });
        }
    };

    const handleToggleStatus = (code: CodeMaster) => {
        router.post(toggle(code.id).url, {}, { preserveScroll: true });
    };

    const filteredCodes = rawCodes.filter((code) => {
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && code.is_active) ||
            (statusFilter === 'inactive' && !code.is_active);

        const matchesLocalSearch =
            searchTerm === '' ||
            code.cname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.catkey.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.conkey.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLocalControl =
            selectedControl === '' || code.conkey === selectedControl;

        return matchesStatus && matchesLocalSearch && matchesLocalControl;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="Code Master">
            <Head title={t('Code Master')} />

            <div className="flex-1 bg-slate-50">
                {/* Header Banner */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Code className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Code Master')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage codes and categories within controllers')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={create().url}
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('Create Code Master')}
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
                                        <Code className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Codes')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {totalCodesCount}
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
                                        <p className="text-xs font-medium text-gray-600">{t('Active Codes')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {activeCodesCount}
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
                                            {inactiveCodesCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <Database className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Controllers')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {controls.length}
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
                                            {t('Codes List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View and manage all system codes')}
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
                                                    placeholder={t('Search codes, names, or keys...')}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:w-56">
                                            <div className="relative">
                                                <Database className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <select
                                                    value={selectedControl}
                                                    onChange={(e) => setSelectedControl(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                >
                                                    <option value="">{t('All Controllers')}</option>
                                                    {controls.map((control) => (
                                                        <option key={control.id} value={control.conkey}>
                                                            {control.conname} ({control.conkey})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="md:w-40">
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
                                {filteredCodes.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Code')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Name')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Company')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Section')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Controller')}
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
                                                {filteredCodes.map((code) => (
                                                    <tr key={code.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-mono text-xs font-semibold text-vismass-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                    {code.catkey}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs font-medium text-gray-900">{code.cname}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                                                            {code.company_code || '-'}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                                                            {code.section_code || '-'}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="flex items-center space-x-1.5">
                                                                <Database className="h-3.5 w-3.5 text-slate-400" />
                                                                <div>
                                                                    <div className="text-xs font-medium text-gray-900">
                                                                        {code.controlMaster?.conname || 'Unknown Controller'}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 font-mono">
                                                                        {code.controlMaster?.conkey || code.conkey}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                                code.is_active
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {code.is_active ? t('Active') : t('Inactive')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                                            <div className="flex items-center space-x-3">
                                                                <Link
                                                                    href={show(code.id).url}
                                                                    className="inline-flex items-center text-sky-600 hover:text-sky-800"
                                                                >
                                                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                                                    {t('View')}
                                                                </Link>
                                                                <Link
                                                                    href={edit(code.id).url}
                                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                                                >
                                                                    <Edit2 className="mr-1 h-3.5 w-3.5" />
                                                                    {t('Edit')}
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleToggleStatus(code)}
                                                                    className={`inline-flex items-center ${
                                                                        code.is_active
                                                                            ? 'text-orange-600 hover:text-orange-800'
                                                                            : 'text-green-600 hover:text-green-800'
                                                                    }`}
                                                                    title={code.is_active ? t('Deactivate') : t('Activate')}
                                                                >
                                                                    {code.is_active ? (
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
                                                                    onClick={() => handleDelete(code)}
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
                                            <Code className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">
                                            {t('No codes found')}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Add your first code master to get started.')}
                                        </p>
                                        <Link
                                            href={create().url}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-vismass-blue hover:bg-vismass-blue/90"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Create Code Master')}
                                        </Link>
                                    </div>
                                )}

                                {/* Pagination */}
                                {codes.data.length > 0 && codes.links && codes.links.length > 3 && (
                                    <div className="border-t border-gray-200 mt-4 pt-3">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                            <div className="text-xs text-gray-500">
                                                {t('Showing')} {codes.meta?.from || 1} {t('to')} {codes.meta?.to || codes.data.length} {t('of')} {codes.meta?.total || codes.data.length} {t('results')}
                                            </div>
                                            <div className="flex space-x-1">
                                                {codes.links.map((link: any, idx: number) => (
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
            <AlertDialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl bg-white p-6 shadow-xl border border-slate-200">
                        <AlertDialog.Title className="text-lg font-bold text-gray-900 mb-2">
                            {t('Delete Code')}
                        </AlertDialog.Title>
                        <AlertDialog.Description className="text-sm text-gray-600 mb-6">
                            {t('Are you sure you want to delete')} &quot;{codeToDelete?.cname}&quot; ({codeToDelete?.catkey})?{' '}
                            {t('This action cannot be undone.')}
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
                                    disabled={deleteProcessing}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 shadow-sm"
                                >
                                    {deleteProcessing ? t('Deleting...') : t('Delete Code')}
                                </button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </AppLayout>
    );
}