import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Check, X, Filter, Search, UserPlus, Users, Download, Tag, Eye, Pencil, XCircle, CheckCircle, User, Phone } from 'lucide-react';
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: t('Dashboard'),
        href: '/dashboard',
    },
    {
        title: t('Privilege User Management'),
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
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
    section?: {
        name: string;
        section_code: string;
    };
    company?: {
        name: string;
    };
}

interface Props {
    privilegeUsers: {
        data: PrivilegeUser[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        customer_code?: string;
        name?: string;
        privilege_level?: string;
        status?: string;
    };
    privilegeLevels: Array<{
        value: string;
        label: string;
    }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PrivilegeUserIndex({
    privilegeUsers,
    filters,
    privilegeLevels,
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [customerCodeFilter, setCustomerCodeFilter] = useState(
        filters.customer_code || '',
    );
    const [nameFilter, setNameFilter] = useState(filters.name || '');
    const [selectedPrivilegeLevel, setSelectedPrivilegeLevel] = useState(
        filters.privilege_level || '',
    );
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        router.get(
            '/admin/privilege-users',
            {
                search: searchTerm,
                customer_code: customerCodeFilter,
                name: nameFilter,
                privilege_level: selectedPrivilegeLevel,
                status: selectedStatus,
            },
            {
                preserveState: true,
            },
        );
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setCustomerCodeFilter('');
        setNameFilter('');
        setSelectedPrivilegeLevel('');
        setSelectedStatus('');
        router.get(
            '/admin/privilege-users',
            {},
            {
                preserveState: true,
            },
        );
    };

    const handleToggleStatus = (privilegeUser: PrivilegeUser) => {
        if (
            confirm(
                t('Are you sure you want to {{action}} this privilege user?', {
                    action: privilegeUser.is_active ? t('deactivate') : t('activate')
                })
            )
        ) {
            router.post(
                `/admin/privilege-users/${privilegeUser.id}/toggle`,
                {},
                {
                    preserveState: true,
                },
            );
        }
    };

    const handleDelete = (privilegeUser: PrivilegeUser) => {
        if (
            confirm(
                t('Are you sure you want to delete {{name}}? This action cannot be undone.', {
                    name: privilegeUser.privCusName
                })
            )
        ) {
            router.delete(`/admin/privilege-users/${privilegeUser.id}`, {
                preserveState: true,
            });
        }
    };

    const getFullName = (user: PrivilegeUser) => {
        return user.privCusName;
    };

    // Calculate statistics
    const activeUsers = privilegeUsers.data.filter(user => user.is_active).length;
    const inactiveUsers = privilegeUsers.data.filter(user => !user.is_active).length;
    const totalUsers = privilegeUsers.total;
    const cardHolders = privilegeUsers.data.filter(user => user.card_no).length;

    // Clear messages
    const clearError = () => {
        // Error message will auto clear
    };

    const clearSuccess = () => {
        // Success message will auto clear
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Privilege User Management')} />

            {/* Radiant Layout Structure with Blue and White Mix */}
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
                {/* Radiant Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,197,253,0.1),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(219,234,254,0.05),transparent_70%)]"></div>

                {/* Header Section with Radiant Glow */}
                <div className="relative bg-linear-to-r from-blue-600 via-blue-500 to-blue-600 shadow-2xl shadow-blue-500/25 border-b border-blue-400/20 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-blue-600/10"></div>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                   {/* Enhanced Back Button with Glow */}
                                <button
                                    onClick={() => window.history.back()}
                                    className="mr-2 rounded-xl bg-white/20 backdrop-blur-md p-3 hover:bg-white/30 transition-all duration-300 border border-white/40 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                                    title="Go Back"
                                >
                                    <svg className="h-5 w-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div className="rounded-2xl bg-linear-to-br from-white/20 to-blue-500/30 p-4 shadow-2xl shadow-blue-500/30 backdrop-blur-md border border-white/30">
                                    <Users className="h-8 w-8 text-white drop-shadow-lg" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                                        {t('Privilege User Management')}
                                    </h1>
                                    <p className="text-sm text-blue-100 drop-shadow-md">
                                        {t('Manage privileged customers and their details')}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 shadow-lg shadow-blue-500/20">
                                <span className="text-sm text-white font-semibold px-4 py-2 block drop-shadow-sm">
                                    {new Date().toLocaleDateString('en-GB', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Radiant Stats Cards */}
                        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 p-4 shadow-xl shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                                        <Users className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-300">{t('Total Users')}</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-800 transition-colors duration-300">{totalUsers}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-blue-400/10 group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-green-500 to-green-600 p-4 shadow-xl shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300">
                                        <CheckCircle className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-green-700 transition-colors duration-300">{t('Active Users')}</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-green-800 transition-colors duration-300">{activeUsers}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-green-400/10 group-hover:bg-green-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 p-4 shadow-xl shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300">
                                        <Tag className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition-colors duration-300">{t('Card Holders')}</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-800 transition-colors duration-300">{cardHolders}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-purple-400/10 group-hover:bg-purple-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 animate-pulse"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 p-4 shadow-xl shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
                                        <XCircle className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-orange-700 transition-colors duration-300">{t('Inactive Users')}</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-orange-800 transition-colors duration-300">{inactiveUsers}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-orange-400/10 group-hover:bg-orange-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 animate-pulse"></div>
                            </div>
                        </div>

                        {/* Radiant Main Content Card */}
                        <div className="relative rounded-3xl border border-blue-200/50 bg-linear-to-br from-white/80 via-blue-50/30 to-white/80 shadow-2xl shadow-blue-500/10 overflow-hidden backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5"></div>
                            <div className="relative bg-linear-to-r from-blue-600/90 via-blue-500/90 to-blue-600/90 px-8 py-6 shadow-lg">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-blue-600/20"></div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-bold text-white drop-shadow-lg">
                                            {t('Privilege Users Management')}
                                        </h3>
                                        <p className="text-blue-100 text-sm mt-1 drop-shadow-md">
                                            {t('Browse and manage privileged customers in the system')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-linear-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-500/30 backdrop-blur-sm border border-white/20">
                                            ✅ {t('Active')}: {activeUsers}
                                        </span>
                                        <Link href="/admin/privilege-users/create">
                                            <button className="inline-flex items-center rounded-2xl bg-linear-to-r from-blue-500 to-blue-600 backdrop-blur-md px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 border border-white/30 shadow-lg shadow-blue-500/20">
                                                <UserPlus className="mr-2 h-5 w-5 drop-shadow-sm" />
                                                {t('Add New User')}
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 relative z-10">
                                {/* Search and Filters */}
                                <div className="mb-6 rounded-2xl border border-blue-200/50 bg-linear-to-r from-blue-50/60 to-blue-50/60 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-sm">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <Search className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder={t('Search by name, customer code, or phone...')}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="block w-full rounded-xl border border-blue-200 bg-white py-3 pr-3 pl-10 text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none placeholder-gray-400 shadow-sm shadow-blue-500/10"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setShowFilters(!showFilters)}
                                                className="inline-flex items-center rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                                            >
                                                <Filter className="mr-2 h-4 w-4" />
                                                {t('Filters')}
                                            </button>
                                            <button
                                                onClick={handleSearch}
                                                className="inline-flex items-center rounded-xl border border-transparent bg-linear-to-r from-blue-600 to-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                                            >
                                                <Search className="mr-2 h-4 w-4" />
                                                {t('Search')}
                                            </button>
                                            <button
                                                onClick={handleResetFilters}
                                                className="inline-flex items-center rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                {t('Reset')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const params = new URLSearchParams();
                                                    if (searchTerm) params.append('search', searchTerm);
                                                    if (customerCodeFilter) params.append('customer_code', customerCodeFilter);
                                                    if (nameFilter) params.append('name', nameFilter);
                                                    if (selectedPrivilegeLevel) params.append('privilege_level', selectedPrivilegeLevel);
                                                    if (selectedStatus) params.append('status', selectedStatus);
                                                    window.location.href = `/admin/privilege-users-export?${params.toString()}`;
                                                }}
                                                className="inline-flex items-center rounded-xl border border-transparent bg-linear-to-r from-green-600 to-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                {t('Download PDF')}
                                            </button>
                                        </div>
                                    </div>

                                    {showFilters && (
                                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    {t('Customer Code')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customerCodeFilter}
                                                    onChange={(e) => setCustomerCodeFilter(e.target.value)}
                                                    placeholder={t('Enter customer code')}
                                                    className="block w-full rounded-xl border border-blue-200 bg-white px-3 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    {t('Name')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={nameFilter}
                                                    onChange={(e) => setNameFilter(e.target.value)}
                                                    placeholder={t('Enter customer name')}
                                                    className="block w-full rounded-xl border border-blue-200 bg-white px-3 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    {t('Privilege Level')}
                                                </label>
                                                <select
                                                    value={selectedPrivilegeLevel}
                                                    onChange={(e) => setSelectedPrivilegeLevel(e.target.value)}
                                                    className="block w-full rounded-xl border border-blue-200 bg-white px-3 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                >
                                                    <option value="">
                                                        {t('All Levels')}
                                                    </option>
                                                    {privilegeLevels.map((level) => (
                                                        <option key={level.value} value={level.value}>
                                                            {level.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    {t('Status')}
                                                </label>
                                                <select
                                                    value={selectedStatus}
                                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                                    className="block w-full rounded-xl border border-blue-200 bg-white px-3 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                                >
                                                    <option value="">
                                                        {t('All Status')}
                                                    </option>
                                                    <option value="active">
                                                        {t('Active')}
                                                    </option>
                                                    <option value="inactive">
                                                        {t('Inactive')}
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Table */}
                                <div className="rounded-2xl border border-blue-200/50 bg-white/60 backdrop-blur-sm shadow-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-blue-200/50">
                                            <thead className="bg-linear-to-r from-blue-600/90 to-blue-500/90 backdrop-blur-sm">
                                                <tr>
                                                    <th className="px-8 py-5 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Tag className="h-4 w-4" />
                                                            {t('Customer Code')}
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-5 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            {t('Name')}
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-5 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4" />
                                                            {t('Contact')}
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-5 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="h-4 w-4" />
                                                            {t('Status')}
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-5 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">
                                                        {t('Actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white/80 divide-y divide-blue-100/50">
                                                {privilegeUsers.data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-8 py-12 text-center">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <Users className="h-16 w-16 text-blue-300" />
                                                                <div>
                                                                    <p className="text-lg font-semibold text-gray-600">{t('No Privilege Users Found')}</p>
                                                                    <p className="text-sm text-gray-500">{t('No privilege users match your search criteria.')}</p>
                                                                </div>
                                                                <Link href="/admin/privilege-users/create">
                                                                    <button className="inline-flex items-center gap-3 rounded-2xl bg-linear-to-r from-blue-500 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-blue-500/30 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 border border-white/30 backdrop-blur-sm">
                                                                        <UserPlus className="h-6 w-6 drop-shadow-lg" />
                                                                        {t('Add New User')}
                                                                    </button>
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    privilegeUsers.data.map((user) => (
                                                        <tr key={user.id} className="group hover:bg-linear-to-r hover:from-blue-50/50 hover:to-white/80 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                                                            <td className="px-8 py-6 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-md shadow-blue-500/20">
                                                                            <Tag className="h-5 w-5 text-blue-600" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-bold text-gray-900">{user.customer_code}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 whitespace-nowrap">
                                                                <div className="text-sm font-semibold text-gray-900">{getFullName(user)}</div>
                                                                {user.gender && (
                                                                    <div className="text-sm text-gray-500">{user.gender === 'male' ? t('Male') : t('Female')}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6 whitespace-nowrap">
                                                                <div className="space-y-1">
                                                                    {user.NIC && (
                                                                        <div className="text-xs text-gray-600">{t('NIC')}: {user.NIC}</div>
                                                                    )}
                                                                    {user.phone && (
                                                                        <div className="text-xs text-gray-600">{t('Phone')}: {user.phone}</div>
                                                                    )}
                                                                    {user.card_no && (
                                                                        <div className="text-xs text-blue-600 font-medium">{t('Card')}: {user.card_no}</div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                                                                    user.is_active
                                                                        ? 'bg-green-100 text-green-800 border-green-200 shadow-green-500/20'
                                                                        : 'bg-red-100 text-red-800 border-red-200 shadow-red-500/20'
                                                                }`}>
                                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                        user.is_active ? 'bg-green-500' : 'bg-red-500'
                                                                    }`}></div>
                                                                    {user.is_active ? t('Active') : t('Inactive')}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 whitespace-nowrap">
                                                                <div className="flex items-center space-x-3">
                                                                    <Link
                                                                        href={`/admin/privilege-users/${user.id}`}
                                                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-200 hover:shadow-lg hover:shadow-blue-500/20"
                                                                    >
                                                                        <Eye className="w-3 h-3 mr-1" />
                                                                        {t('View')}
                                                                    </Link>
                                                                    <Link
                                                                        href={`/admin/privilege-users/${user.id}/edit`}
                                                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors border border-orange-200 hover:shadow-lg hover:shadow-orange-500/20"
                                                                    >
                                                                        <Pencil className="w-3 h-3 mr-1" />
                                                                        {t('Edit')}
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleToggleStatus(user)}
                                                                        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border hover:shadow-lg ${
                                                                            user.is_active
                                                                                ? 'text-red-700 bg-red-100 hover:bg-red-200 border-red-200 hover:shadow-red-500/20'
                                                                                : 'text-green-700 bg-green-100 hover:bg-green-200 border-green-200 hover:shadow-green-500/20'
                                                                        }`}
                                                                    >
                                                                        {user.is_active ? (
                                                                            <XCircle className="w-3 h-3 mr-1" />
                                                                        ) : (
                                                                            <Check className="w-3 h-3 mr-1" />
                                                                        )}
                                                                        {user.is_active ? t('Deactivate') : t('Activate')}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {privilegeUsers.last_page > 1 && (
                                        <div className="border-t border-blue-200/50 bg-linear-to-r from-blue-50/40 via-white/60 to-blue-50/40 px-6 py-4 shadow-inner backdrop-blur-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-blue-800 font-medium">
                                                    {t('Showing')} {' '}
                                                    {(privilegeUsers.current_page - 1) *
                                                        privilegeUsers.per_page +
                                                        1}{' '}
                                                    {t('to')}{' '}
                                                    {Math.min(
                                                        privilegeUsers.current_page *
                                                            privilegeUsers.per_page,
                                                        privilegeUsers.total,
                                                    )}{' '}
                                                    {t('of')}{' '}
                                                    {privilegeUsers.total}{' '}
                                                    {t('results')}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {privilegeUsers.current_page > 1 && (
                                                        <Link
                                                            href={`/admin/privilege-users?page=${privilegeUsers.current_page - 1}&search=${searchTerm}&privilege_level=${selectedPrivilegeLevel}&status=${selectedStatus}`}
                                                            className="relative inline-flex items-center rounded-l-xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                                                        >
                                                            {t('Previous')}
                                                        </Link>
                                                    )}
                                                    {privilegeUsers.current_page <
                                                        privilegeUsers.last_page && (
                                                        <Link
                                                            href={`/admin/privilege-users?page=${privilegeUsers.current_page + 1}&search=${searchTerm}&privilege_level=${selectedPrivilegeLevel}&status=${selectedStatus}`}
                                                            className="relative inline-flex items-center rounded-r-xl border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                                                        >
                                                            {t('Next')}
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Radiant Footer */}
                <footer className="mt-16 border-t border-blue-200/50 bg-linear-to-r from-white/80 via-blue-50/60 to-white/80 backdrop-blur-sm shadow-inner">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                            <p className="text-sm text-gray-700 font-medium drop-shadow-sm">© UNITEC POS System • {t('Privilege User Management')}</p>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200/30">
                                <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm animate-pulse"></div>
                                <p className="text-sm text-blue-800 font-semibold">v1.0.0 • {t('Professional POS Solution')}</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}