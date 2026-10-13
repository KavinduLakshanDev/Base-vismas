import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// Declare route function (available globally via Ziggy)
declare function route(name: string, params?: any): string;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Shield, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    slug: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

interface FormData {
    name: string;
    slug: string;
    description: string;
}

interface Props {
    permission: Permission;
}

export default function Edit({ permission }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        name: permission.name,
        slug: permission.slug,
        description: permission.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('permissions.update', permission.id), {
            onSuccess: () => {
                toast.success('Permission updated successfully');
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

        // Auto-generate slug if it matches the current generated slug pattern
        if (data.slug === generateSlug(data.name)) {
            setData('slug', generateSlug(name));
        }
    };

    return (
        <AppLayout>
            <Head title={`Edit Permission: ${permission.name}`} />

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
                                        Edit Permission
                                    </h1>
                                    <p className="text-sm text-sky-200">
                                        Modify the permission details
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

                        {/* Current Permission Info */}
                        <div className="mb-6 rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow">
                                        <Info className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Current Permission: {permission.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-sm text-muted-foreground">
                                    Created on {new Date(permission.created_at).toLocaleDateString('en-GB')},
                                    last updated {new Date(permission.updated_at).toLocaleDateString('en-GB')}
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow">
                                        <Shield className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Permission Details
                                    </h3>
                                </div>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Permission Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={handleNameChange}
                                            placeholder="e.g., View Users"
                                            disabled={processing}
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            A human-readable name for the permission
                                        </p>
                                    </div>

                                    {/* Slug */}
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">
                                            Permission Slug
                                        </Label>
                                        <Input
                                            id="slug"
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            placeholder="e.g., view_users"
                                            disabled={processing}
                                            className={errors.slug ? 'border-destructive' : ''}
                                        />
                                        {errors.slug && (
                                            <p className="text-sm text-destructive">{errors.slug}</p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            A unique identifier for the permission
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="e.g., Allows user to view the list of all users in the system"
                                            rows={3}
                                            disabled={processing}
                                            className={errors.description ? 'border-destructive' : ''}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-destructive">{errors.description}</p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Optional description explaining what this permission allows
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="min-w-[120px]"
                                        >
                                            {processing ? (
                                                <>
                                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Update Permission
                                                </>
                                            )}
                                        </Button>
                                        <Link href={route('permissions.show', permission.id)}>
                                            <Button variant="outline" disabled={processing}>
                                                View Permission
                                            </Button>
                                        </Link>
                                        <Link href={route('permissions.index')}>
                                            <Button variant="outline" disabled={processing}>
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Help Card */}
                        <div className="mt-6 rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow">
                                        <AlertTriangle className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Important Notes
                                    </h3>
                                </div>
                            </div>

                            <div className="p-6 space-y-3">
                                <div>
                                    <h4 className="font-medium mb-1">Changing Slugs</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Be careful when changing permission slugs as they may be referenced in code.
                                        Make sure to update any hardcoded references.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Permission Usage</h4>
                                    <p className="text-sm text-muted-foreground">
                                        This permission may be assigned to roles. Changes will affect all users
                                        with roles that include this permission.
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