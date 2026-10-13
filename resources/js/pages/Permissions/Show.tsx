import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// Declare route function (available globally via Ziggy)
declare function route(name: string, params?: any): string;
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { ArrowLeft, Edit, Users, Shield, Info, Code } from 'lucide-react';

interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    level: string;
    company?: {
        id: number;
        name: string;
    };
    section?: {
        id: number;
        name: string;
    };
    is_system_role: boolean;
}

interface Permission {
    id: number;
    name: string;
    slug: string;
    description?: string;
    created_at: string;
    updated_at: string;
    roles: Role[];
}

interface Props {
    permission: Permission;
}

export default function Show({ permission }: Props) {
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

    return (
        <AppLayout>
            <Head title={`Permission: ${permission.name}`} />

            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
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
                                        Permission Details
                                    </h1>
                                    <p className="text-sm text-sky-200">
                                        View permission information and assigned roles
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Link
                                    href={route('permissions.index')}
                                    className="inline-flex items-center rounded bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Permissions
                                </Link>
                                <Link href={route('permissions.edit', permission.id)}>
                                    <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Permission
                                    </Button>
                                </Link>
                                <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                                    <span className="text-sm text-white font-medium">
                                        {permission.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">

                        {/* Permission Details */}
                        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow">
                                            <Shield className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {permission.name}
                                        </h3>
                                    </div>
                                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                                        {permission.slug}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-base text-muted-foreground mb-6">
                                    {permission.description || 'No description provided'}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Permission ID</h4>
                                        <p className="text-sm">{permission.id}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Slug</h4>
                                        <p className="text-sm font-mono">{permission.slug}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Created</h4>
                                        <p className="text-sm">{new Date(permission.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Last Updated</h4>
                                        <p className="text-sm">{new Date(permission.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Roles */}
                        <div className="mt-6 rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow">
                                            <Users className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Assigned Roles
                                        </h3>
                                    </div>
                                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                                        {permission.roles.length} role{permission.roles.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-6">
                                {permission.roles.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Role Name</TableHead>
                                                <TableHead>Level</TableHead>
                                                <TableHead>Scope</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Description</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {permission.roles.map((role) => (
                                                <TableRow key={role.id}>
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={route('roles.show', role.id)}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {role.name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getLevelBadgeVariant(role.level)}>
                                                            {formatLevel(role.level)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {role.company ? (
                                                            <div className="text-sm">
                                                                <div>{role.company.name}</div>
                                                                {role.section && (
                                                                    <div className="text-muted-foreground">
                                                                        {role.section.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline">System Wide</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {role.is_system_role ? (
                                                            <Badge variant="destructive">System</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Custom</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {role.description || (
                                                            <span className="text-muted-foreground italic">
                                                                No description
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">
                                            This permission is not assigned to any roles yet
                                        </p>
                                        <Link href={route('roles.create')}>
                                            <Button variant="outline">
                                                Create Role with this Permission
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Usage Information */}
                        <div className="mt-6 rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow">
                                        <Code className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Usage Information
                                    </h3>
                                </div>
                            </div>

                            <div className="p-6 space-y-3">
                                <div>
                                    <h4 className="font-medium mb-1">Code Usage</h4>
                                    <p className="text-sm text-muted-foreground">
                                        To check this permission in your code, use:
                                        <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
                                            {`$user->hasPermission('${permission.slug}')`}
                                        </code>
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Middleware Usage</h4>
                                    <p className="text-sm text-muted-foreground">
                                        To protect routes with this permission:
                                        <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
                                            {`Route::middleware('permission:${permission.slug}')`}
                                        </code>
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Impact</h4>
                                    <p className="text-sm text-muted-foreground">
                                        This permission affects {permission.roles.length} role{permission.roles.length !== 1 ? 's' : ''}
                                        and all users assigned to those roles.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}