import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building, Plus, MapPin, Phone, Mail, CheckCircle, XCircle, Eye, Edit, Search, Filter, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

export default function SectionIndex({ sections }: { sections: any[] }) {
    const { flash } = usePage<any>().props;

    const activeSections = sections.filter(section => section.is_active).length;
    const inactiveSections = sections.filter(section => !section.is_active).length;
    const warehouseCount = sections.filter(section => section.section_type === 'warehouse').length;
    const storeCount = sections.filter(section => section.section_type === 'store').length;

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [typeFilter, setTypeFilter] = useState('');

    const breadcrumbs = [
        {
            title: t('Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('Sections'),
            href: '#',
        },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('active');
        setTypeFilter('');
    };

    const [togglingId, setTogglingId] = useState<number | null>(null);

    const handleToggle = (section: any) => {
        if (togglingId === section.id) return;
        setTogglingId(section.id);
        router.post(
            `/sections/${section.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (!flash?.success) {
                        toast.success(
                            section.is_active
                                ? t('Section deactivated successfully')
                                : t('Section activated successfully'),
                        );
                    }
                },
                onError: () => {
                    toast.error(t('Failed to update section status'));
                },
                onFinish: () => {
                    setTogglingId(null);
                },
            },
        );
    };

    const filteredSections = sections.filter(section => {
        const matchesSearch = search === '' || 
            section.name.toLowerCase().includes(search.toLowerCase()) ||
            section.section_code.toLowerCase().includes(search.toLowerCase()) ||
            (section.address && section.address.toLowerCase().includes(search.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && section.is_active) || 
            (statusFilter === 'inactive' && !section.is_active);
        
        const matchesType = typeFilter === '' || section.section_type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="Section Management">
            <Head title={t('Sections')} />

            <div className="flex-1 bg-slate-50 dark:bg-background">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Building className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Sections')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage warehouse and store locations')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/sections/create"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('Create New Section')}
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
                                        <Building className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Sections')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {sections.length}
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
                                            {activeSections}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <MapPin className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Warehouses')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {warehouseCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <Phone className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Stores')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {storeCount}
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
                                            {t('Sections List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View and manage all sections')}
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
                                                    placeholder={t('Search by name, code, or address...')}
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
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
                                                    <option value="active">{t('Active')}</option>
                                                    <option value="all">{t('All Status')}</option>
                                                    <option value="inactive">{t('Inactive')}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="md:w-40">
                                            <div className="relative">
                                                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <select
                                                    value={typeFilter}
                                                    onChange={(e) => setTypeFilter(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                >
                                                    <option value="">{t('All Types')}</option>
                                                    <option value="warehouse">{t('Warehouse')}</option>
                                                    <option value="store">{t('Store')}</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="flex space-x-2">
                                            {/* <button
                                                type="submit"
                                                className="inline-flex items-center bg-gradient-to-r from-sky-600 to-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 font-medium"
                                            >
                                                <Search className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Search')}
                                            </button> */}
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

                                {/* Sections Table */}
                                {filteredSections.length > 0 ? (
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
                                                        {t('Type')}
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
                                                {filteredSections.map((section) => (
                                                    <tr key={section.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs font-medium text-gray-900">{section.section_code}</div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs font-medium text-gray-900">{section.name}</div>
                                                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                                <MapPin className="mr-1 h-3 w-3" />
                                                                {section.address || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                                                                section.section_type === 'warehouse'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-purple-100 text-purple-800'
                                                            }`}>
                                                                {section.section_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                disabled={togglingId === section.id}
                                                                onClick={() => handleToggle(section)}
                                                                className={`px-2 py-0.5 text-xs font-medium rounded-full transition ${
                                                                    togglingId === section.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                                                                } ${
                                                                    section.is_active
                                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                }`}
                                                                title={section.is_active ? t('Click to deactivate') : t('Click to activate')}
                                                            >
                                                                {togglingId === section.id ? (
                                                                    <span className="flex items-center">
                                                                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                                                        {t('Updating...')}
                                                                    </span>
                                                                ) : section.is_active ? (
                                                                    t('Active')
                                                                ) : (
                                                                    t('Inactive')
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                                            <div className="flex items-center space-x-3">
                                                                <Link
                                                                    href={`/sections/${section.id}`}
                                                                    className="inline-flex items-center text-sky-600 hover:text-sky-800 transition-colors"
                                                                    title={t('View Section')}
                                                                >
                                                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                                                    {t('View')}
                                                                </Link>
                                                                <Link
                                                                    href={`/sections/${section.id}/edit`}
                                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                                    title={t('Edit Section')}
                                                                >
                                                                    <Edit className="mr-1 h-3.5 w-3.5" />
                                                                    {t('Edit')}
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    disabled={togglingId === section.id}
                                                                    onClick={() => handleToggle(section)}
                                                                    className={`inline-flex items-center transition-colors ${
                                                                        togglingId === section.id
                                                                            ? 'opacity-50 cursor-wait text-gray-400'
                                                                            : section.is_active
                                                                                ? 'cursor-pointer text-amber-600 hover:text-amber-800'
                                                                                : 'cursor-pointer text-emerald-600 hover:text-emerald-800'
                                                                    }`}
                                                                    title={section.is_active ? t('Deactivate Section') : t('Activate Section')}
                                                                >
                                                                    {togglingId === section.id ? (
                                                                        <>
                                                                            <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                                                                            {section.is_active ? t('Deactivating...') : t('Activating...')}
                                                                        </>
                                                                    ) : section.is_active ? (
                                                                        <>
                                                                            <XCircle className="mr-1 h-3.5 w-3.5" />
                                                                            {t('Deactivate')}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                                                            {t('Activate')}
                                                                        </>
                                                                    )}
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
                                            <Building className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No sections found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Get started by creating a new section.')}
                                        </p>
                                        <Link
                                            href="/sections/create"
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Create Section')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
