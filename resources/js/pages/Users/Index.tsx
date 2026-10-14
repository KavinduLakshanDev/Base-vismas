import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import axios from 'axios';
import {
    Building2,
    Eye,
    Edit,
    Layers,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users,
    UserX,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

// Interfaces
export interface Role {
    id: number;
    name: string;
    slug?: string;
    description?: string;
    level?: string;
    company_code?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Section {
    id: number;
    company_code: string;
    section_code: string;
    name: string;
    contact_person_name?: string;
    contact_person_number?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    section_type?: 'warehouse' | 'store' | 'office' | 'other';
    is_active?: boolean;
}

export interface Company {
    id: number;
    company_code: string;
    name: string;
    email?: string;
    is_active?: boolean;
    current_users_count?: number;
    package_details?: {
        max_users: number;
    };
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
    user_type: 'super_admin' | 'company_user';
    company_code?: string | null;
    section_code?: string | null;
    role_id: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    company?: Company;
    section?: Section;
    role?: Role;
}

interface PageProps {
    auth: {
        user: {
            id: number;
            user_type: string;
            company_code?: string | null;
            section_code?: string | null;
            role_id: number;
            company?: Company;
        };
    };
    users?: User[];
    roles?: Role[];
    sections?: Section[];
    companies?: Company[];
    [key: string]: any;
}

export default function UsersIndex({
    users: initialUsers = [],
    roles: initialRoles = [],
    sections: initialSections = [],
    companies: initialCompanies = [],
}: {
    users?: User[];
    roles?: Role[];
    sections?: Section[];
    companies?: Company[];
}) {
    const { props } = usePage<PageProps>();
    const authUser = props.auth?.user;

    const [usersList, setUsersList] = useState<User[]>(initialUsers);
    const [rolesList, setRolesList] = useState<Role[]>(initialRoles);
    const [sectionsList, setSectionsList] = useState<Section[]>(initialSections);
    const [companiesList, setCompaniesList] = useState<Company[]>(initialCompanies);
    const [loading, setLoading] = useState<boolean>(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('User Management'), href: '/users' },
    ];

    // Fetch on mount if initial data was empty
    useEffect(() => {
        if (!initialUsers || initialUsers.length === 0) {
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes, sectionsRes, companiesRes] = await Promise.allSettled([
                axios.get('/api/users'),
                axios.get('/api/user-roles'),
                axios.get('/api/sections'),
                axios.get('/api/companies'),
            ]);

            if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data);
            if (rolesRes.status === 'fulfilled') setRolesList(rolesRes.value.data);
            if (sectionsRes.status === 'fulfilled') setSectionsList(sectionsRes.value.data);
            if (companiesRes.status === 'fulfilled') setCompaniesList(companiesRes.value.data);
        } catch (error) {
            console.error('Failed to load user management data', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered users calculation
    const filteredUsers = useMemo(() => {
        return usersList.filter((user) => {
            // Search query
            const q = searchQuery.toLowerCase().trim();
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
            const matchesSearch =
                !q ||
                fullName.includes(q) ||
                (user.username && user.username.toLowerCase().includes(q)) ||
                (user.email && user.email.toLowerCase().includes(q)) ||
                (user.phone && user.phone.toLowerCase().includes(q));

            // Status filter
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && user.is_active) ||
                (statusFilter === 'inactive' && !user.is_active);

            // Company filter
            const matchesCompany =
                !selectedCompany || user.company_code === selectedCompany;

            // Section filter
            const matchesSection =
                !selectedSection || user.section_code === selectedSection;

            // Role filter
            const matchesRole =
                !selectedRole || user.role_id?.toString() === selectedRole;

            return matchesSearch && matchesStatus && matchesCompany && matchesSection && matchesRole;
        });
    }, [usersList, searchQuery, statusFilter, selectedCompany, selectedSection, selectedRole]);

    const activeCount = useMemo(() => usersList.filter((u) => u.is_active).length, [usersList]);
    const inactiveCount = useMemo(() => usersList.length - activeCount, [usersList, activeCount]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCompany('');
        setSelectedSection('');
        setSelectedRole('');
        setStatusFilter('all');
    };

    const hasActiveFilters =
        searchQuery !== '' ||
        selectedCompany !== '' ||
        selectedSection !== '' ||
        selectedRole !== '' ||
        statusFilter !== 'all';

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

    const handleToggleStatus = async (user: User) => {
        try {
            await axios.post(`/users/${user.id}/toggle`);
            setUsersList((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
            );
            toast.success(
                `${user.first_name || user.username} is now ${!user.is_active ? 'Active' : 'Inactive'}`
            );
        } catch (error) {
            try {
                // Fallback to update
                await axios.put(`/api/users/${user.id}`, {
                    ...user,
                    is_active: !user.is_active,
                });
                setUsersList((prev) =>
                    prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
                );
                toast.success('User status updated');
            } catch (err) {
                toast.error('Failed to update status');
            }
        }
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/api/users/${userToDelete.id}`);
            setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
            toast.success('User deleted successfully');
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="User Management">
            <Head title={t('User Management')} />

            <div className="flex-1 bg-slate-50 dark:bg-background">
                {/* Header Banner */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('User Management')}
                                    </h1>
                                    <p className="text-xs text-sky-100">
                                        {t('Manage system users, credentials, role assignments and access')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchData}
                                    disabled={loading}
                                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                                >
                                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                                    <span>{t('Refresh')}</span>
                                </Button>
                                <Link
                                    href="/users/create"
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    <span>{t('Create New User')}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* Stat Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {t('Total Users')}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {usersList.length}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-vismass-blue p-2.5 shadow-sm text-white">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                {t('Registered accounts across system')}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {t('Active Users')}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-600">
                                        {activeCount}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-emerald-500 p-2.5 shadow-sm text-white">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                {Math.round((activeCount / (usersList.length || 1)) * 100)}% {t('active rate')}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {t('Inactive Users')}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-rose-600">
                                        {inactiveCount}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-rose-500 p-2.5 shadow-sm text-white">
                                    <UserX className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                {t('Suspended or deactivated')}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {t('System Roles')}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-indigo-600">
                                        {rolesList.length}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-indigo-500 p-2.5 shadow-sm text-white">
                                    <Shield className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                {t('Configured permission tiers')}
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="mb-6 rounded-xl bg-white p-4 shadow-sm border border-slate-200">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search by name, username, email, phone...')}
                                    className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdowns */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Company Filter */}
                                {companiesList.length > 0 && (
                                    <select
                                        value={selectedCompany}
                                        onChange={(e) => {
                                            setSelectedCompany(e.target.value);
                                            setSelectedSection('');
                                        }}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-vismass-blue focus:ring-1 focus:ring-vismass-blue transition"
                                    >
                                        <option value="">{t('All Companies')}</option>
                                        {companiesList.map((c) => (
                                            <option key={c.id} value={c.company_code}>
                                                {c.name} ({c.company_code})
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Section Filter */}
                                {sectionsList.length > 0 && (
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-vismass-blue focus:ring-1 focus:ring-vismass-blue transition"
                                    >
                                        <option value="">{t('All Sections')}</option>
                                        {sectionsList
                                            .filter(
                                                (s) =>
                                                    !selectedCompany ||
                                                    s.company_code === selectedCompany
                                            )
                                            .map((s) => (
                                                <option key={s.id} value={s.section_code}>
                                                    {s.name} ({s.section_code})
                                                </option>
                                            ))}
                                    </select>
                                )}

                                {/* Role Filter */}
                                {rolesList.length > 0 && (
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-vismass-blue focus:ring-1 focus:ring-vismass-blue transition"
                                    >
                                        <option value="">{t('All Roles')}</option>
                                        {rolesList.map((r) => (
                                            <option key={r.id} value={r.id.toString()}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target.value as 'all' | 'active' | 'inactive'
                                        )
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-vismass-blue focus:ring-1 focus:ring-vismass-blue transition"
                                >
                                    <option value="all">{t('All Status')}</option>
                                    <option value="active">{t('Active Only')}</option>
                                    <option value="inactive">{t('Inactive Only')}</option>
                                </select>

                                {/* Reset Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        <span>{t('Clear')}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Users Data Table */}
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">
                                            {t('User')}
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            {t('Role')}
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            {t('Section & Company')}
                                        </th>
                                        <th scope="col" className="px-6 py-4">
                                            {t('Contact')}
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-center">
                                            {t('Status')}
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-right">
                                            {t('Actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="rounded-full bg-slate-100 p-3 text-slate-400 mb-3">
                                                        <Users className="h-8 w-8" />
                                                    </div>
                                                    <p className="text-base font-semibold text-slate-800">
                                                        {t('No users found')}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                                        {hasActiveFilters
                                                            ? t('Try adjusting your search query or clearing the active filters.')
                                                            : t('Get started by creating your first system user account.')}
                                                    </p>
                                                    {hasActiveFilters ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={clearFilters}
                                                            className="mt-4"
                                                        >
                                                            {t('Reset Filters')}
                                                        </Button>
                                                    ) : (
                                                        <Link
                                                            href="/users/create"
                                                            className="mt-4 inline-flex items-center rounded-lg bg-vismass-blue px-4 py-2 text-xs font-medium text-white shadow hover:bg-vismass-blue/90 transition"
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            {t('Create User')}
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="transition-colors hover:bg-slate-50/70"
                                            >
                                                {/* User Identity */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-vismass-blue text-sm font-bold text-white shadow-sm">
                                                            {getInitials(user.first_name, user.last_name)}
                                                        </div>
                                                        <div>
                                                            <Link
                                                                href={`/users/${user.id}`}
                                                                className="font-medium text-slate-900 hover:text-vismass-blue transition"
                                                            >
                                                                {user.first_name} {user.last_name}
                                                            </Link>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <span>@{user.username}</span>
                                                                <span>•</span>
                                                                <span className="truncate max-w-[180px]">{user.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeStyle(
                                                            user
                                                        )}`}
                                                    >
                                                        <Shield className="h-3 w-3" />
                                                        <span>
                                                            {user.role?.name ||
                                                                (user.user_type === 'super_admin'
                                                                    ? 'Super Admin'
                                                                    : 'Standard User')}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* Section & Company */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1 text-xs font-medium text-slate-800">
                                                            <Layers className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>
                                                                {user.section?.name ||
                                                                    user.section_code ||
                                                                    t('All Sections')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                                            <Building2 className="h-3 w-3 text-slate-400" />
                                                            <span>
                                                                {user.company?.name ||
                                                                    user.company_code ||
                                                                    'VISMASS'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contact */}
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-slate-700">
                                                        {user.phone ? (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3 text-slate-400" />
                                                                <span>{user.phone}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">
                                                                {t('No phone')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition cursor-pointer ${
                                                            user.is_active
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                user.is_active
                                                                    ? 'bg-emerald-500'
                                                                    : 'bg-slate-400'
                                                            }`}
                                                        />
                                                        <span>
                                                            {user.is_active ? t('Active') : t('Inactive')}
                                                        </span>
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <Link
                                                            href={`/users/${user.id}`}
                                                            title={t('View User')}
                                                            className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition"
                                                        >
                                                            <Eye className="mr-1 h-3.5 w-3.5" />
                                                                {t('View')}
                                                        </Link>
                                                        <Link
                                                            href={`/users/${user.id}/edit`}
                                                            title={t('Edit User')}
                                                            className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition"
                                                        >
                                                            <Edit className="mr-1 h-3.5 w-3.5" />
                                                                    {t('Edit')}
                                                        </Link>
                                                        {authUser?.id !== user.id && (
                                                            <button
                                                                onClick={() => handleDeleteClick(user)}
                                                                title={t('Delete User')}
                                                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer / Summary */}
                        {filteredUsers.length > 0 && (
                            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
                                <div>
                                    {t('Showing')} <span className="font-semibold text-slate-700">{filteredUsers.length}</span> {t('of')} <span className="font-semibold text-slate-700">{usersList.length}</span> {t('users')}
                                </div>
                                <div className="text-slate-400">
                                    {t('VISMASS POS User Directory')}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
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
                            {t('Are you sure you want to permanently delete')} <strong className="text-slate-900">{userToDelete?.first_name} {userToDelete?.last_name}</strong> (@{userToDelete?.username})? {t('Their authentication tokens and settings will be removed.')}
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
