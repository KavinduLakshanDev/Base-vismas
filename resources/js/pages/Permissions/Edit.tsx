import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { ArrowLeft, Edit2, Save, Shield, Key, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

declare function route(name: string, params?: any): string;

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
            onError: (errs) => {
                const errorMessages = Object.values(errs).flat();
                errorMessages.forEach((message) => {
                    toast.error(message as string);
                });
            },
        });
    };

    return (
        <AppLayout footerModuleName="Permissions Management">
            <Head title={`${t('Edit Permission')}: ${permission.name}`} />

            <div className="flex-1 bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href={route('permissions.index')}
                                    className="rounded-xl bg-white/20 p-3 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <Edit2 className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Edit Permission')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Modify permission:')} {permission.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0 mb-6">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-vismass-blue to-vismass-grey bg-clip-text text-transparent mb-2">
                            {t('Edit Permission')}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Update permission title, slug, and operational description')}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Permission Details */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Shield className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        {t('Permission Details')}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Shield className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Permission Name')} *
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            placeholder="e.g., Create Invoices"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Key className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Permission Slug')} *
                                        </Label>
                                        <Input
                                            id="slug"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            required
                                            className="font-mono border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            placeholder="e.g., invoices.create"
                                        />
                                        <InputError message={errors.slug} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="description" className="text-sm font-medium text-slate-700 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Description')}
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={3}
                                            className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            placeholder="Describe what this permission authorizes a user to do..."
                                        />
                                        <InputError message={errors.description} />
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                                <h4 className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center">
                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                    {t('System Information')}
                                </h4>
                                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                    <div>
                                        <span className="font-medium text-slate-600">{t('Created At')}:</span>
                                        <span className="ml-2 text-slate-800">
                                            {new Date(permission.created_at).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-600">{t('Last Updated')}:</span>
                                        <span className="ml-2 text-slate-800">
                                            {new Date(permission.updated_at).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end pt-6 border-t border-slate-200 space-x-3">
                                <Link
                                    href={route('permissions.index')}
                                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                                >
                                    {t('Cancel')}
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Updating Permission...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Save className="w-5 h-5" />
                                            <span>{t('Update Permission')}</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                </main>
            </div>
        </AppLayout>
    );
}