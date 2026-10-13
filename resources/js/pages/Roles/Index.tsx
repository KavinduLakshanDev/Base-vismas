import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// Declare route function (available globally via Ziggy)
declare function route(name: string, params?: any): string;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Eye, Shield, Building, Users, RefreshCw, CheckCircle, TrendingUp, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';

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
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const { hasPermission } = usePermission();

    const { auth } = usePage().props as any;
    const currentUserType = auth?.user?.user_type;

    React.useEffect(() => {
        if (success) {
            toast.success(success);
        }
        if (error) {
            toast.error(error);
        }
    }, [success, error]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('roles.index'), {
            search: searchTerm || undefined,
            level: levelFilter || undefined
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleLevelChange = (value: string) => {
        const level = value === 'all' ? '' : value;
        setLevelFilter(level);
        router.get(route('roles.index'), {
            search: searchTerm || undefined,
            level: level || undefined
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (role: Role) => {
        setIsDeleting(role.id);
        router.delete(route('roles.destroy', role.id), {
            data: { force: true },
            onSuccess: () => {
                setIsDeleting(null);
                toast.success('Role deleted successfully');
            },
            onError: () => {
                setIsDeleting(null);
                toast.error('Failed to delete role');
            }
        });
    };

    const handleRefresh = () => {
        router.reload();
    };

    const getLevelBadgeVariant = (level: string) => {
        switch (level) {
            case 'super_admin':
                return 'destructive';
            case 'company_admin':
                return 'default';
            case 'branch_admin':
                return 'secondary';
            case 'user':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const formatLevel = (level: string) => {
        return level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'super_admin':
                return <Shield className="h-4 w-4" />;
            case 'company_admin':
                return <Building className="h-4 w-4" />;
            case 'branch_admin':
                return <Users className="h-4 w-4" />;
            case 'user':
                return <Users className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    return (
        <AppLayout>
            <Head title="Roles Management" />

            {/* Enhanced Layout Structure */}
            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 shadow-lg">
                    <div className="mx-auto max-w-7xl px-6 py-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {/* Back Button */}
                                <button
                                    onClick={() => window.history.back()}
                                    className="mr-2 rounded-lg bg-white/20 backdrop-blur-sm p-2 hover:bg-white/30 transition-all duration-200 border border-white/30"
                                    title="Go Back"
                                >
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-3 shadow-lg">
                                    <Shield className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Roles Management
                                    </h1>
                                    <p className="text-sm text-sky-200">
                                        Manage user roles and their permissions
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                                <span className="text-sm text-white font-medium">
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

                {/* Main Content */}
                <div className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Roles</p>
                                        <p className="text-2xl font-bold text-gray-900">{roles.total}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <Shield className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">System Roles</p>
                                        <p className="text-2xl font-bold text-gray-900">{roles.data.filter(role => role.is_system_role).length}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <TrendingUp className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Custom Roles</p>
                                        <p className="text-2xl font-bold text-gray-900">{roles.data.filter(role => !role.is_system_role).length}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Active Roles</p>
                                        <p className="text-2xl font-bold text-gray-900">{roles.data.filter(role => role.permissions && role.permissions.length > 0).length}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>
                        </div>

                        {/* Main Content Card */}
                        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Roles Management System
                                        </h3>
                                        <p className="text-sky-200 text-sm mt-1">
                                            Browse and manage user roles and permissions
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleRefresh}
                                            className="inline-flex items-center rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30 hover:shadow-lg border border-white/30"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Refresh
                                        </button>
                                        {hasPermission('roles.create') && (
                                            <Link
                                                href={route('roles.create')}
                                                className="inline-flex items-center rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30 hover:shadow-lg border border-white/30"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                New Role
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Flash Messages */}
                            <div className="px-6 pt-6">
                                {success && (
                                    <div className="mb-6 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                                        <div className="flex">
                                            <div className="shrink-0">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-green-800">
                                                    {success}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {error && (
                                    <div className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
                                        <div className="flex">
                                            <div className="shrink-0">
                                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-red-800">
                                                    {error}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="p-6">
                                {/* Search Section */}
                                <div className="mb-6 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-4">
                                    <h4 className="mb-3 text-sm font-semibold text-sky-900">Search and Filter Roles</h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                        <div className="md:col-span-2">
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-sky-400" />
                                                <Input
                                                    placeholder="Search by role name, description..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-12 border-sky-200 focus:border-sky-400 focus:ring-sky-200 bg-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-1">
                                            <Select value={levelFilter || 'all'} onValueChange={handleLevelChange}>
                                                <SelectTrigger className="border-sky-200 focus:border-sky-400 focus:ring-sky-200 bg-white">
                                                    <SelectValue placeholder="Filter by level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Levels</SelectItem>
                                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                                    <SelectItem value="company_admin">Company Admin</SelectItem>
                                                    <SelectItem value="branch_admin">Branch Admin</SelectItem>
                                                    <SelectItem value="user">User</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <Button
                                                onClick={() => {
                                                    router.get(route('roles.index'), {
                                                        search: searchTerm || undefined,
                                                        level: levelFilter || undefined
                                                    }, {
                                                        preserveState: true,
                                                        replace: true,
                                                    });
                                                }}
                                                className="inline-flex items-center rounded-xl border border-transparent bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-sky-700 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-sky-200 hover:shadow-xl hover:shadow-sky-300"
                                            >
                                                <Search className="mr-2 h-4 w-4" />
                                                Search
                                            </Button>
                                            {(searchTerm || levelFilter) && (
                                                <Button
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setLevelFilter('');
                                                        router.get(route('roles.index'));
                                                    }}
                                                    variant="outline"
                                                    className="border-sky-300 text-sky-700 hover:bg-sky-50"
                                                >
                                                    Clear
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Roles Table */}
                                <div className="rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden">
                                    <div className="max-h-[600px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gradient-to-r from-sky-600 to-blue-600 text-white sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-bold">Role Name</th>
                                                    <th className="px-4 py-3 text-left font-bold">Level</th>
                                                    <th className="px-4 py-3 text-left font-bold">Scope</th>
                                                    <th className="px-4 py-3 text-left font-bold">Type</th>
                                                    <th className="px-4 py-3 text-left font-bold">Permissions</th>
                                                    <th className="px-4 py-3 text-left font-bold">Description</th>
                                                    <th className="px-4 py-3 text-left font-bold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {roles.data.map((role) => (
                                                    <tr
                                                        key={role.id}
                                                        className="transition-colors hover:bg-gradient-to-r from-sky-50 to-blue-50 group"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {getLevelIcon(role.level)}
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {role.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${role.level === 'super_admin'
                                                                    ? 'bg-gradient-to-r from-red-100 to-pink-200 text-red-800 border border-red-200'
                                                                    : role.level === 'company_admin'
                                                                        ? 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border border-blue-200'
                                                                        : role.level === 'branch_admin'
                                                                            ? 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-200'
                                                                            : 'bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border border-gray-200'
                                                                }`}>
                                                                {formatLevel(role.level)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {role.company ? (
                                                                <div className="text-sm">
                                                                    <div className="font-medium text-gray-900">
                                                                        {role.company.name}
                                                                    </div>
                                                                    {role.section && (
                                                                        <div className="text-gray-500">
                                                                            {role.section.name}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Badge variant="outline" className="text-xs">
                                                                    System Wide
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${role.is_system_role
                                                                    ? 'bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800 border border-purple-200'
                                                                    : 'bg-gradient-to-r from-orange-100 to-amber-200 text-orange-800 border border-orange-200'
                                                                }`}>
                                                                {role.is_system_role ? 'System' : 'Custom'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="space-y-1 max-w-xs">
                                                                {role.permissions && role.permissions.length > 0 ? (
                                                                    <>
                                                                        <div className="flex flex-wrap gap-1 mb-1">
                                                                            {role.permissions.slice(0, 2).map((permission) => (
                                                                                <Badge key={permission.id} variant="outline" className="text-xs truncate">
                                                                                    {permission.name}
                                                                                </Badge>
                                                                            ))}
                                                                            {role.permissions.length > 2 && (
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    +{role.permissions.length - 2} more
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''} total
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-center">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            No permissions
                                                                        </Badge>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            Click edit to assign
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {role.description ? (
                                                                <span className="text-sm text-gray-900">
                                                                    {role.description}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground italic text-sm">
                                                                    No description
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {hasPermission('roles.view') && (
                                                                    <Link
                                                                        href={route('roles.show', role.id)}
                                                                        className="rounded-lg bg-gradient-to-r from-sky-100 to-blue-100 px-3 py-2 text-sky-700 hover:from-sky-200 hover:to-blue-200 transition-all duration-200 border border-sky-200 flex items-center gap-1 group"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                        <span className="text-xs font-semibold">View</span>
                                                                    </Link>
                                                                )}
                                                                {hasPermission('roles.edit') && (
                                                                    <Link
                                                                        href={route('roles.edit', role.id)}
                                                                        className="rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-2 text-blue-700 hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 border border-blue-200 flex items-center gap-1 group"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                        <span className="text-xs font-semibold">Edit</span>
                                                                    </Link>
                                                                )}
                                                                {(hasPermission('roles.delete') && (!role.is_system_role || (role.is_system_role && currentUserType === 'super_admin' && role.slug !== 'super_admin'))) && (
                                                                    <button
                                                                        disabled={isDeleting === role.id}
                                                                        onClick={() => {
                                                                            if (window.confirm(`Are you sure you want to delete "${role.name}"? This action cannot be undone and may affect users who have this role assigned.`)) {
                                                                                handleDelete(role);
                                                                            }
                                                                        }}
                                                                        className="rounded-lg bg-gradient-to-r from-red-100 to-pink-100 px-3 py-2 text-red-700 hover:from-red-200 hover:to-pink-200 transition-all duration-200 border border-red-200 flex items-center gap-1 group disabled:opacity-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        <span className="text-xs font-semibold">
                                                                            {isDeleting === role.id ? 'Deleting...' : 'Delete'}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* No Data Message */}
                                    {roles.data.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Shield className="mx-auto mb-4 h-16 w-16 text-gray-400 opacity-30" />
                                            <h3 className="text-lg font-semibold text-gray-500 mb-2">
                                                No roles found
                                            </h3>
                                            <p className="text-sm text-gray-400 mb-6">
                                                {searchTerm || levelFilter
                                                    ? 'Try adjusting your search or filter criteria'
                                                    : 'Get started by creating your first role'}
                                            </p>
                                            {!searchTerm && !levelFilter && hasPermission('roles.create') && (
                                                <Link
                                                    href={route('roles.create')}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:from-sky-700 hover:to-blue-700 transition-all duration-200"
                                                >
                                                    <Plus className="h-5 w-5" />
                                                    Create First Role
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border-t border-sky-100 bg-sky-50/30 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-sky-700">
                                                    Showing <span className="font-semibold">{((roles.current_page - 1) * roles.per_page) + 1}</span> to{' '}
                                                    <span className="font-semibold">{Math.min(roles.current_page * roles.per_page, roles.total)}</span> of{' '}
                                                    <span className="font-semibold">{roles.total}</span> roles
                                                </div>

                                                {/* Pagination */}
                                                {roles.last_page > 1 && (
                                                    <div className="flex gap-1">
                                                        {roles.links.map((link, index) => (
                                                            <Link
                                                                key={index}
                                                                href={link.url || '#'}
                                                                className={`rounded px-3 py-1.5 text-sm ${link.active
                                                                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white'
                                                                        : link.url
                                                                            ? 'text-sky-600 hover:bg-sky-50 border border-sky-200'
                                                                            : 'cursor-not-allowed text-gray-400'
                                                                    }`}
                                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                            <p className="text-xs text-gray-600">© UNITEC POS System • Roles Management</p>
                            <p className="text-xs text-gray-500">v1.0.0 • Professional POS Solution</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}