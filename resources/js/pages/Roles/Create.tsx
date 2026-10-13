import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Search, Shield, Key, Building2, Building } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

declare function route(name: string, params?: any): string;

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

export default function Create({ permissions, companies, sections }: Props) {
    const [permissionSearch, setPermissionSearch] = useState('');
    const [selectedAll, setSelectedAll] = useState(false);

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
            onError: (errs) => {
                const errorMessages = Object.values(errs).flat();
                errorMessages.forEach((message) => {
                    toast.error(message as string);
                });
            },
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

        if (!data.slug || data.slug === generateSlug(data.name)) {
            setData('slug', generateSlug(name));
        }
    };

    const handlePermissionToggle = (permissionId: number) => {
        const newPermissions = data.permissions.includes(permissionId)
            ? data.permissions.filter((id) => id !== permissionId)
            : [...data.permissions, permissionId];

        setData('permissions', newPermissions);
        setSelectedAll(newPermissions.length === filteredPermissions.length);
    };

    const handleSelectAll = () => {
        if (selectedAll) {
            setData('permissions', []);
            setSelectedAll(false);
        } else {
            setData('permissions', filteredPermissions.map((p) => p.id));
            setSelectedAll(true);
        }
    };

    const filteredPermissions = permissions.filter(
        (permission) =>
            permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
            permission.slug.toLowerCase().includes(permissionSearch.toLowerCase()) ||
            (permission.description &&
                permission.description.toLowerCase().includes(permissionSearch.toLowerCase())),
    );

    React.useEffect(() => {
        setSelectedAll(
            data.permissions.length === filteredPermissions.length &&
                filteredPermissions.length > 0,
        );
    }, [data.permissions, filteredPermissions]);

    return (
        <AppLayout footerModuleName="Roles Management">
            <Head title={t('Create Role')} />

            <div className="flex-1 bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href={route('roles.index')}
                                    className="rounded-xl bg-white/20 p-3 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <Plus className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Create Role')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Define new roles and configure permissions')}
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
                            {t('Create New Role')}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Configure access tier, scope, and specific system capabilities')}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: Role Details */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                            <Shield className="w-5 h-5 text-vismass-blue" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800">
                                            {t('Role Details')}
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center">
                                                <Shield className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Role Name')} *
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={handleNameChange}
                                                required
                                                className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                                placeholder="e.g., Store Manager, Cashier"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="slug" className="text-sm font-medium text-slate-700 flex items-center">
                                                <Key className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Role Slug')} *
                                            </Label>
                                            <Input
                                                id="slug"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value)}
                                                required
                                                className="font-mono border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                                placeholder="e.g., store_manager"
                                            />
                                            <InputError message={errors.slug} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="level" className="text-sm font-medium text-slate-700 flex items-center">
                                                <Building className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Access Level')} *
                                            </Label>
                                            <Select
                                                value={data.level}
                                                onValueChange={(value: typeof data.level) => setData('level', value)}
                                            >
                                                <SelectTrigger className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20">
                                                    <SelectValue placeholder="Select access level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">{t('User')}</SelectItem>
                                                    <SelectItem value="branch_admin">{t('Branch Admin')}</SelectItem>
                                                    <SelectItem value="company_admin">{t('Company Admin')}</SelectItem>
                                                    <SelectItem value="super_admin">{t('Super Admin')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.level} />
                                        </div>

                                        {companies.length > 0 && (
                                            <div className="space-y-2">
                                                <Label htmlFor="company_id" className="text-sm font-medium text-slate-700 flex items-center">
                                                    <Building2 className="w-4 h-4 mr-2 text-vismass-blue" />
                                                    {t('Company Scope')}
                                                </Label>
                                                <Select
                                                    value={data.company_id}
                                                    onValueChange={(value) => {
                                                        setData('company_id', value === 'none' ? '' : value);
                                                        setData('section_id', '');
                                                    }}
                                                >
                                                    <SelectTrigger className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20">
                                                        <SelectValue placeholder={t('Select company (optional)')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">{t('System Wide (All Companies)')}</SelectItem>
                                                        {companies.map((c) => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.company_id} />
                                            </div>
                                        )}

                                        {sections.length > 0 && data.company_id && (
                                            <div className="space-y-2">
                                                <Label htmlFor="section_id" className="text-sm font-medium text-slate-700">
                                                    {t('Section / Branch Scope')}
                                                </Label>
                                                <Select
                                                    value={data.section_id}
                                                    onValueChange={(value) => setData('section_id', value === 'none' ? '' : value)}
                                                >
                                                    <SelectTrigger className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20">
                                                        <SelectValue placeholder={t('Select section (optional)')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">{t('Entire Company')}</SelectItem>
                                                        {sections.map((s) => (
                                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                                {s.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.section_id} />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                                                {t('Description')}
                                            </Label>
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                rows={3}
                                                className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                                placeholder="Describe the scope and responsibilities of this role..."
                                            />
                                            <InputError message={errors.description} />
                                        </div>

                                        <div className="flex items-center space-x-3 pt-2">
                                            <Checkbox
                                                id="is_system_role"
                                                checked={data.is_system_role}
                                                onCheckedChange={(checked) => setData('is_system_role', !!checked)}
                                                className="border-slate-300 data-[state=checked]:bg-vismass-blue data-[state=checked]:border-vismass-blue"
                                            />
                                            <Label htmlFor="is_system_role" className="text-sm font-medium text-slate-700 cursor-pointer">
                                                {t('System role')} <span className="text-xs text-slate-500 font-normal">({t('Protected against deletion by regular administrators')})</span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Permissions Selector */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                                <Key className="w-5 h-5 text-vismass-blue" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-slate-800">
                                                    {t('Permissions')}
                                                </h2>
                                                <p className="text-xs text-slate-500">
                                                    {t('Select permissions assigned to this role')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="bg-blue-50 text-vismass-blue text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                                            {data.permissions.length} {t('selected')}
                                        </span>
                                    </div>

                                    {/* Permission Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder={t('Search permissions...')}
                                            value={permissionSearch}
                                            onChange={(e) => setPermissionSearch(e.target.value)}
                                            className="pl-9 border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20 text-sm"
                                        />
                                    </div>

                                    {/* Select All Bar */}
                                    <div className="flex items-center space-x-2 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <Checkbox
                                            id="select_all"
                                            checked={selectedAll}
                                            onCheckedChange={handleSelectAll}
                                            disabled={processing || filteredPermissions.length === 0}
                                            className="border-slate-300 data-[state=checked]:bg-vismass-blue data-[state=checked]:border-vismass-blue"
                                        />
                                        <Label htmlFor="select_all" className="text-xs font-medium text-slate-700 cursor-pointer">
                                            {t('Select All')} ({filteredPermissions.length} {t('permissions')})
                                        </Label>
                                    </div>

                                    {/* Permissions List */}
                                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                                        {filteredPermissions.length > 0 ? (
                                            filteredPermissions.map((permission) => (
                                                <div
                                                    key={permission.id}
                                                    onClick={() => handlePermissionToggle(permission.id)}
                                                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                                        data.permissions.includes(permission.id)
                                                            ? 'border-vismass-blue/40 bg-blue-50/40 shadow-xs'
                                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <Checkbox
                                                        id={`permission_${permission.id}`}
                                                        checked={data.permissions.includes(permission.id)}
                                                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                        className="mt-0.5 border-slate-300 data-[state=checked]:bg-vismass-blue data-[state=checked]:border-vismass-blue"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-semibold text-slate-900">
                                                                {permission.name}
                                                            </span>
                                                            <span className="font-mono text-xs text-slate-500">
                                                                {permission.slug}
                                                            </span>
                                                        </div>
                                                        {permission.description && (
                                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                                {permission.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">
                                                <Key className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                                <p className="text-xs">{t('No permissions match your search')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end pt-6 border-t border-slate-200 space-x-3">
                                <Link
                                    href={route('roles.index')}
                                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                                >
                                    {t('Cancel')}
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing || !data.name || !data.slug}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Creating Role...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Plus className="w-5 h-5" />
                                            <span>{t('Create Role')}</span>
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