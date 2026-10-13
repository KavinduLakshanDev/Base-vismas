import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

// Declare route function (available globally via Ziggy)
declare function route(name: string, params?: any): string;
import { Plus, Search, Edit, Trash2, Eye, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';

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
        links: any[];
    };
    success?: string;
    error?: string;
}

export default function Index({ permissions, success, error }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const { hasPermission } = usePermission();

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
        router.get(route('permissions.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (permission: Permission) => {
        setIsDeleting(permission.id);
        router.delete(route('permissions.destroy', permission.id), {
            data: { force: true },
            onSuccess: () => {
                setIsDeleting(null);
                toast.success('Permission deleted successfully');
            },
            onError: () => {
                setIsDeleting(null);
                toast.error('Failed to delete permission');
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Permissions Management" />

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
                                        Permissions Management
                                    </h1>
                                    <p className="text-sm text-sky-200">
                                        Manage system permissions and access controls
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                {hasPermission('permissions.create') && (
                                    <Link href={route('permissions.create')}>
                                        <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Permission
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">

                        {/* Search */}
                        <div className="mb-6 rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow">
                                        <Search className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Search Permissions
                                    </h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <Input
                                        placeholder="Search permissions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="submit">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* Permissions Table */}
                        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow">
                                            <Shield className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">
                                            All Permissions
                                        </h3>
                                    </div>
                                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                                        {permissions.total} total permissions
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-6">
                                {permissions.data.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Slug</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Created</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {permissions.data.map((permission) => (
                                                    <TableRow key={permission.id}>
                                                        <TableCell className="font-medium">
                                                            {permission.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {permission.slug}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {permission.description || (
                                                                <span className="text-muted-foreground italic">
                                                                    No description
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(permission.created_at).toLocaleDateString('en-GB')}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Link href={route('permissions.show', permission.id)}>
                                                                    <Button variant="ghost" size="sm">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                {hasPermission('permissions.edit') && (
                                                                    <Link href={route('permissions.edit', permission.id)}>
                                                                        <Button variant="ghost" size="sm">
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                                {hasPermission('permissions.delete') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={isDeleting === permission.id}
                                                                        onClick={() => {
                                                                            if (window.confirm(`Are you sure you want to delete "${permission.name}"? This action cannot be undone.`)) {
                                                                                handleDelete(permission);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination */}
                                        {permissions.last_page > 1 && (
                                            <div className="mt-6 flex items-center justify-center space-x-2">
                                                {permissions.links.map((link, index) => (
                                                    <Button
                                                        key={index}
                                                        variant={link.active ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => {
                                                            if (link.url) {
                                                                router.get(link.url);
                                                            }
                                                        }}
                                                        disabled={!link.url}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">No permissions found</p>
                                        {hasPermission('permissions.create') && (
                                            <Link href={route('permissions.create')}>
                                                <Button>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Create First Permission
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main >
            </div >
        </AppLayout >
    );
}