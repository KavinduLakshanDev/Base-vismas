import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// Declare route function (available globally via Ziggy)
declare function route(name: string, params?: any): string;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { ArrowLeft, Save, Search, Users, Shield, Key, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

interface Company {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
}

interface FormData {
    name: string;
    slug: string;
    description: string;
    level: 'super_admin' | 'company_admin' | 'branch_admin' | 'user';
    company_id: string;
    section_id: string;
    is_system_role: boolean;
    permissions: number[];
}

interface Props {
    permissions: Permission[];
    companies: Company[];
    sections: Section[];
    stats?: {
        totalRoles: number;
        systemRoles: number;
        customRoles: number;
        totalPermissions: number;
    };
}

export default function Create({ permissions, companies, sections, stats }: Props) {
    const [permissionSearch, setPermissionSearch] = useState('');
    const [selectedAll, setSelectedAll] = useState(false);

    // Calculate stats if not provided
    const defaultStats = {
        totalRoles: stats?.totalRoles || 0,
        systemRoles: stats?.systemRoles || 0,
        customRoles: stats?.customRoles || 0,
        totalPermissions: permissions.length,
    };

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        name: '',
        slug: '',
        description: '',
        level: 'user',
        company_id: '',
        section_id: '',
        is_system_role: false,
        permissions: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('roles.store'), {
            onSuccess: () => {
                reset();
                toast.success('Role created successfully');
            },
            onError: (errors) => {
                const errorMessages = Object.values(errors).flat();
                errorMessages.forEach(message => {
                    toast.error(message as string);
                });
            }
        });
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .trim();
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setData('name', name);
        
        // Auto-generate slug if it's empty or was auto-generated
        if (!data.slug || data.slug === generateSlug(data.name)) {
            setData('slug', generateSlug(name));
        }
    };

    const handlePermissionToggle = (permissionId: number) => {
        const newPermissions = data.permissions.includes(permissionId)
            ? data.permissions.filter(id => id !== permissionId)
            : [...data.permissions, permissionId];
        
        setData('permissions', newPermissions);
        
        // Update select all state
        setSelectedAll(newPermissions.length === filteredPermissions.length);
    };

    const handleSelectAll = () => {
        if (selectedAll) {
            setData('permissions', []);
            setSelectedAll(false);
        } else {
            setData('permissions', filteredPermissions.map(p => p.id));
            setSelectedAll(true);
        }
    };

    const filteredPermissions = permissions.filter(permission =>
        permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        permission.slug.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        (permission.description && permission.description.toLowerCase().includes(permissionSearch.toLowerCase()))
    );

    React.useEffect(() => {
        setSelectedAll(data.permissions.length === filteredPermissions.length && filteredPermissions.length > 0);
    }, [data.permissions, filteredPermissions]);

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
                <Head title="Create Role" />

                {/* Header */}
                <header className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-3 shadow-lg">
                                    <Shield className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Role Management
                                    </h1>
                                    <p className="text-sm text-sky-200">
                                        Create new roles and assign permissions
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
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
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
                                        <p className="text-2xl font-bold text-gray-900">{defaultStats.totalRoles}</p>
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
                                        <p className="text-2xl font-bold text-red-600">{defaultStats.systemRoles}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <Building2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Custom Roles</p>
                                        <p className="text-2xl font-bold text-green-600">{defaultStats.customRoles}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <Key className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                                        <p className="text-2xl font-bold text-purple-600">{defaultStats.totalPermissions}</p>
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
                                            Create New Role
                                        </h3>
                                        <p className="text-sky-200 text-sm mt-1">
                                            Define role details and assign appropriate permissions
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Link
                                            href={route('roles.index')}
                                            className="inline-flex items-center rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back to Roles
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Role Details */}
                                        <Card className="border-sky-100 shadow-sm">
                                            <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                                                <CardTitle className="flex items-center text-sky-900">
                                                    <Shield className="mr-2 h-5 w-5" />
                                                    Role Details
                                                </CardTitle>
                                                <CardDescription>
                                                    Basic information about the role
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4 p-6">
                                                {/* Name */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                                        Role Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        type="text"
                                                        value={data.name}
                                                        onChange={handleNameChange}
                                                        placeholder="e.g., Store Manager"
                                                        disabled={processing}
                                                        className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 ${errors.name ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors.name && (
                                                        <p className="text-sm text-red-600">{errors.name}</p>
                                                    )}
                                                </div>

                                                {/* Slug */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="slug" className="text-sm font-medium text-gray-700">Role Slug</Label>
                                                    <Input
                                                        id="slug"
                                                        type="text"
                                                        value={data.slug}
                                                        onChange={(e) => setData('slug', e.target.value)}
                                                        placeholder="e.g., store_manager"
                                                        disabled={processing}
                                                        className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 ${errors.slug ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors.slug && (
                                                        <p className="text-sm text-red-600">{errors.slug}</p>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={data.description}
                                                        onChange={(e) => setData('description', e.target.value)}
                                                        placeholder="Describe the role responsibilities..."
                                                        rows={3}
                                                        disabled={processing}
                                                        className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 ${errors.description ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors.description && (
                                                        <p className="text-sm text-red-600">{errors.description}</p>
                                                    )}
                                                </div>

                                                {/* Level */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="level" className="text-sm font-medium text-gray-700">
                                                        Access Level <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Select
                                                        value={data.level}
                                                        onValueChange={(value: typeof data.level) => setData('level', value)}
                                                        disabled={processing}
                                                    >
                                                        <SelectTrigger className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 ${errors.level ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select access level" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">User</SelectItem>
                                                            <SelectItem value="branch_admin">Branch Admin</SelectItem>
                                                            <SelectItem value="company_admin">Company Admin</SelectItem>
                                                            <SelectItem value="super_admin">Super Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.level && (
                                                        <p className="text-sm text-red-600">{errors.level}</p>
                                                    )}
                                                </div>

                                                {/* Company */}
                                                {companies.length > 0 && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="company_id" className="text-sm font-medium text-gray-700">Company</Label>
                                                        <Select
                                                            value={data.company_id}
                                                            onValueChange={(value) => {
                                                                setData('company_id', value === 'none' ? '' : value);
                                                                setData('section_id', ''); // Reset section when company changes
                                                            }}
                                                            disabled={processing}
                                                        >
                                                            <SelectTrigger className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 ${errors.company_id ? 'border-red-500' : ''}`}>
                                                                <SelectValue placeholder="Select company (optional)" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No Company (System Wide)</SelectItem>
                                                                {companies.map((company) => (
                                                                    <SelectItem key={company.id} value={company.id.toString()}>
                                                                        {company.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.company_id && (
                                                            <p className="text-sm text-red-600">{errors.company_id}</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Section */}
                                                {sections.length > 0 && data.company_id && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="section_id" className="text-sm font-medium text-gray-700">Section</Label>
                                                        <Select
                                                            value={data.section_id}
                                                            onValueChange={(value) => setData('section_id', value === 'none' ? '' : value)}
                                                            disabled={processing}
                                                        >
                                                            <SelectTrigger className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 ${errors.section_id ? 'border-red-500' : ''}`}>
                                                                <SelectValue placeholder="Select section (optional)" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No Section (Company Wide)</SelectItem>
                                                                {sections.map((section) => (
                                                                    <SelectItem key={section.id} value={section.id.toString()}>
                                                                        {section.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.section_id && (
                                                            <p className="text-sm text-red-600">{errors.section_id}</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* System Role */}
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <Checkbox
                                                        id="is_system_role"
                                                        checked={data.is_system_role}
                                                        onCheckedChange={(checked) => setData('is_system_role', !!checked)}
                                                        disabled={processing}
                                                        className="border-sky-300 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                                                    />
                                                    <Label
                                                        htmlFor="is_system_role"
                                                        className="text-sm font-normal text-gray-700"
                                                    >
                                                        System role (cannot be deleted by regular users)
                                                    </Label>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Permissions */}
                                        <Card className="border-sky-100 shadow-sm">
                                            <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="flex items-center text-sky-900">
                                                            <Key className="mr-2 h-5 w-5" />
                                                            Permissions
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Select permissions for this role
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-sky-100 text-sky-800 border-sky-200">
                                                        {data.permissions.length} selected
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4 p-6">
                                                {/* Search */}
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 h-4 w-4 text-sky-500" />
                                                    <Input
                                                        placeholder="Search permissions..."
                                                        value={permissionSearch}
                                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                                        className="pl-10 border-sky-200 focus:border-sky-400 focus:ring-sky-400"
                                                    />
                                                </div>

                                                {/* Select All */}
                                                <div className="flex items-center space-x-2 py-2 border-b border-sky-100">
                                                    <Checkbox
                                                        id="select_all"
                                                        checked={selectedAll}
                                                        onCheckedChange={handleSelectAll}
                                                        disabled={processing || filteredPermissions.length === 0}
                                                        className="border-sky-300 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                                                    />
                                                    <Label htmlFor="select_all" className="font-medium text-gray-700">
                                                        Select All ({filteredPermissions.length} permissions)
                                                    </Label>
                                                </div>

                                                {/* Permissions List */}
                                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                                    {filteredPermissions.length > 0 ? (
                                                        filteredPermissions.map((permission) => (
                                                            <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-lg border border-sky-100 bg-gradient-to-r from-white to-sky-50/30 hover:from-sky-50/50 hover:to-sky-100/30 transition-colors">
                                                                <Checkbox
                                                                    id={`permission_${permission.id}`}
                                                                    checked={data.permissions.includes(permission.id)}
                                                                    onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                                    disabled={processing}
                                                                    className="border-sky-300 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600 mt-0.5"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <Label
                                                                        htmlFor={`permission_${permission.id}`}
                                                                        className="font-medium cursor-pointer text-gray-900"
                                                                    >
                                                                        {permission.name}
                                                                    </Label>
                                                                    <div className="mt-1">
                                                                        <Badge variant="outline" className="text-xs border-sky-200 text-sky-700">
                                                                            {permission.slug}
                                                                        </Badge>
                                                                    </div>
                                                                    {permission.description && (
                                                                        <p className="text-sm text-gray-600 mt-1">
                                                                            {permission.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8 text-gray-500">
                                                            <Key className="mx-auto mb-4 h-12 w-12 opacity-50 text-sky-400" />
                                                            <p className="text-sm">
                                                                {permissionSearch ? 'No permissions match your search' : 'No permissions available'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {errors.permissions && (
                                                    <p className="text-sm text-red-600">{errors.permissions}</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Actions */}
                                    <Card className="border-sky-100 shadow-sm">
                                        <CardContent className="pt-6 bg-gradient-to-r from-sky-50 to-blue-50 border-t border-sky-100">
                                            <div className="flex gap-3 justify-end">
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="min-w-[140px] bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-md"
                                                >
                                                    {processing ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            Create Role
                                                        </>
                                                    )}
                                                </Button>
                                                <Link href={route('roles.index')}>
                                                    <Button variant="outline" disabled={processing} className="border-sky-200 hover:bg-sky-50">
                                                        Cancel
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-12 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                            <p className="text-xs text-gray-600">© UNITEC POS System • Role Management</p>
                            <p className="text-xs text-gray-500">v1.0.0 • Professional Access Control</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}