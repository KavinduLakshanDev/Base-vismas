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
    Filter,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users,
    UserX,
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
    const isSuperAdmin = authUser?.user_type === 'super_admin' || (authUser as any)?.role?.level === 'super_admin' || authUser?.role_id === 1;

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
        { title: t('Users'), href: '#' },
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

    const getInitials = (first: string, last: string) => {
        return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';
    };

    const getRoleBadgeStyle = (user: User) => {
        if (user.user_type === 'super_admin' || user.role_id === 1) {
            return 'bg-purple-100 text-purple-800';
        }
        if (user.role_id === 2 || user.role?.level === 'company_admin') {
            return 'bg-blue-100 text-blue-800';
        }
        if (user.role_id === 5) {
            return 'bg-amber-100 text-amber-800';
        }
        if (user.role_id === 7) {
            return 'bg-emerald-100 text-emerald-800';
        }
        return 'bg-slate-100 text-slate-800';
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await axios.post(`/users/${user.id}/toggle`);
            setUsersList((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
            );
            toast.success(
                `${user.first_name || user.username} is now ${!user.is_active ? t('Active') : t('Inactive')}`
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
                toast.success(t('User status updated'));
            } catch (err) {
                toast.error(t('Failed to update status'));
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
            toast.success(t('User deleted successfully'));
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('Failed to delete user'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="User Management">
            <Head title={t('Users')} />

            <div className="flex-1 bg-slate-50 dark:bg-background">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Users')}
                                    </h1>
                                    <p className="text-xs text-white/80">
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
                                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                                    <span>{t('Refresh')}</span>
                                </Button>
                                <Link
                                    href="/users/create"
                                    className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    {t('Create New User')}
                                </Link>
                            </div>
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
                                        <p className="text-xs font-medium text-gray-600">{t('Total Users')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {usersList.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <UserCheck className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Active Users')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {activeCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <UserX className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Inactive Users')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {inactiveCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <Shield className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('System Roles')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {rolesList.length}
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
                                            {t('Users List')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('View and manage all system users')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Filters */}
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                                    <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder={t('Search by name, username, email, phone...')}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                />
                                            </div>
                                        </div>

                                        {companiesList.length > 0 && (
                                            <div className="w-full md:w-44">
                                                <div className="relative">
                                                    <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <select
                                                        value={selectedCompany}
                                                        onChange={(e) => {
                                                            setSelectedCompany(e.target.value);
                                                            setSelectedSection('');
                                                        }}
                                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                    >
                                                        <option value="">{t('All Companies')}</option>
                                                        {companiesList.map((c) => (
                                                            <option key={c.id} value={c.company_code}>
                                                                {c.name} ({c.company_code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {sectionsList.length > 0 && (
                                            <div className="w-full md:w-44">
                                                <div className="relative">
                                                    <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <select
                                                        value={selectedSection}
                                                        onChange={(e) => setSelectedSection(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
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
                                                </div>
                                            </div>
                                        )}

                                        {rolesList.length > 0 && (
                                            <div className="w-full md:w-40">
                                                <div className="relative">
                                                    <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <select
                                                        value={selectedRole}
                                                        onChange={(e) => setSelectedRole(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                    >
                                                        <option value="">{t('All Roles')}</option>
                                                        {rolesList
                                                            .filter((r) => isSuperAdmin || (r.slug !== 'super_admin' && r.level !== 'super_admin' && r.name.toLowerCase() !== 'super admin'))
                                                            .map((r) => (
                                                                <option key={r.id} value={r.id.toString()}>
                                                                    {r.name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div className="w-full md:w-36">
                                            <div className="relative">
                                                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) =>
                                                        setStatusFilter(
                                                            e.target.value as 'all' | 'active' | 'inactive'
                                                        )
                                                    }
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
                                                type="button"
                                                onClick={clearFilters}
                                                className="inline-flex items-center bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium cursor-pointer"
                                            >
                                                <Filter className="mr-1.5 h-3.5 w-3.5" />
                                                {t('Clear')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Users Table */}
                                {filteredUsers.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('User')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Role')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Section')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Contact')}
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
                                                {filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        {/* User Identity */}
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-vismass-blue text-xs font-bold text-white shadow-sm">
                                                                    {getInitials(user.first_name, user.last_name)}
                                                                </div>
                                                                <div>
                                                                    <Link
                                                                        href={`/users/${user.id}`}
                                                                        className="text-xs font-medium text-gray-900 hover:text-vismass-blue transition"
                                                                    >
                                                                        {user.first_name} {user.last_name}
                                                                    </Link>
                                                                    <div className="flex items-center space-x-1.5 text-[11px] text-gray-500">
                                                                        <span>@{user.username}</span>
                                                                        <span>•</span>
                                                                        <span className="truncate max-w-[160px]">{user.email}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Role */}
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeStyle(user)}`}>
                                                                {user.role?.name || (user.user_type === 'super_admin' ? 'Super Admin' : 'Standard User')}
                                                            </span>
                                                        </td>

                                                        {/* Section & Company */}
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs font-medium text-gray-900">
                                                                {user.section?.name || user.section_code || t('All Sections')}
                                                            </div>
                                                            {user.company && (
                                                                <div className="text-[11px] text-gray-500 flex items-center mt-0.5">
                                                                    <Building2 className="mr-1 h-3 w-3" />
                                                                    {user.company.name}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Contact */}
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            {user.phone ? (
                                                                <div className="text-xs text-gray-900 flex items-center">
                                                                    <Phone className="mr-1 h-3 w-3 text-gray-400" />
                                                                    {user.phone}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">-</span>
                                                            )}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStatus(user)}
                                                                className={`px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer transition ${
                                                                    user.is_active
                                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                }`}
                                                                title={user.is_active ? t('Click to deactivate') : t('Click to activate')}
                                                            >
                                                                {user.is_active ? t('Active') : t('Inactive')}
                                                            </button>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                                            <div className="flex items-center space-x-3">
                                                                <Link
                                                                    href={`/users/${user.id}`}
                                                                    className="inline-flex items-center text-sky-600 hover:text-sky-800 transition-colors"
                                                                    title={t('View User')}
                                                                >
                                                                    <Eye className="mr-1 h-3.5 w-3.5" />
                                                                    {t('View')}
                                                                </Link>
                                                                <Link
                                                                    href={`/users/${user.id}/edit`}
                                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                                    title={t('Edit User')}
                                                                >
                                                                    <Edit className="mr-1 h-3.5 w-3.5" />
                                                                    {t('Edit')}
                                                                </Link>
                                                                {authUser?.id !== user.id && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteClick(user)}
                                                                        className="inline-flex items-center text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                                                                        title={t('Delete User')}
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
                                            <Users className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No users found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Get started by creating a new user.')}
                                        </p>
                                        <Link
                                            href="/users/create"
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Create User')}
                                        </Link>
                                    </div>
                                )}

                                {/* Footer summary */}
                                {filteredUsers.length > 0 && (
                                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500 mt-4 rounded-b-lg">
                                        <div>
                                            {t('Showing')} <span className="font-semibold text-slate-700">{filteredUsers.length}</span> {t('of')} <span className="font-semibold text-slate-700">{usersList.length}</span> {t('users')}
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
