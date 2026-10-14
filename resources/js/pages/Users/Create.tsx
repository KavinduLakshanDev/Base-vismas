import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    Building2,
    CheckCircle,
    Eye,
    EyeOff,
    Key,
    Layers,
    Lock,
    Mail,
    Phone,
    Plus,
    Shield,
    User,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { type Company, type Role, type Section } from './Index';

interface CreateUserProps {
    roles?: Role[];
    sections?: Section[];
    companies?: Company[];
}

export default function UsersCreate({
    roles: initialRoles = [],
    sections: initialSections = [],
    companies: initialCompanies = [],
}: CreateUserProps) {
    const { auth } = usePage<any>().props;
    const authUser = auth?.user;
    const isSuperAdmin = authUser?.user_type === 'super_admin' || authUser?.role_id === 1;
    const activeCompany = (auth as any)?.active_company || (authUser as any)?.company;
    const activeCompanyCode = activeCompany?.company_code || authUser?.company_code || '';

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        first_name: '',
        last_name: '',
        phone: '',
        company_code: activeCompanyCode,
        section_code: authUser?.section_code || '',
        role_id: '',
        is_active: true,
    });

    const [rolesList, setRolesList] = useState<Role[]>(initialRoles);
    const [sectionsList, setSectionsList] = useState<Section[]>(initialSections);
    const [companiesList, setCompaniesList] = useState<Company[]>(initialCompanies);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // If lists were not preloaded via Inertia, fetch via API
    React.useEffect(() => {
        if (!initialRoles || initialRoles.length === 0) {
            axios.get('/api/user-roles').then((res) => setRolesList(res.data)).catch(() => {});
        }
        if (!initialSections || initialSections.length === 0) {
            axios.get('/api/sections').then((res) => setSectionsList(res.data)).catch(() => {});
        }
        if (isSuperAdmin && (!initialCompanies || initialCompanies.length === 0)) {
            axios.get('/api/companies').then((res) => setCompaniesList(res.data)).catch(() => {});
        }
    }, [isSuperAdmin]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('User Management'), href: '/users' },
        { title: t('Create User'), href: '/users/create' },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.first_name || !formData.last_name || !formData.username || !formData.email || !formData.role_id) {
            toast.error(t('Please fill in all required fields.'));
            setLoading(false);
            return;
        }

        if (!formData.password || formData.password.length < 8) {
            toast.error(t('Password must be at least 8 characters long.'));
            setLoading(false);
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            toast.error(t('Passwords do not match.'));
            setLoading(false);
            return;
        }

        if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
            toast.error(t('Phone number must be exactly 10 digits.'));
            setLoading(false);
            return;
        }

        const payload = {
            ...formData,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            username: formData.username.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            role_id: parseInt(formData.role_id),
            section_code: formData.section_code || null,
            company_code: formData.company_code || null,
        };

        try {
            router.post('/users', payload, {
                onSuccess: () => {
                    toast.success(t('User created successfully!'));
                },
                onError: (errors) => {
                    const firstErr = Object.values(errors)[0];
                    if (firstErr) toast.error(String(firstErr));
                    else toast.error(t('Failed to create user.'));
                    setLoading(false);
                },
            });
        } catch (error) {
            // Fallback via API
            try {
                await axios.post('/api/users', payload);
                toast.success(t('User created successfully!'));
                router.visit('/users');
            } catch (err: any) {
                toast.error(err.response?.data?.message || t('Failed to create user.'));
                setLoading(false);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="User Management">
            <Head title={t('Create User')} />

            <div className="flex-1 bg-slate-50">
                {/* Header Banner */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/users"
                                    className="rounded-xl bg-white/20 p-2.5 hover:bg-white/30 text-white transition-all duration-200"
                                    title={t('Back to Users')}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Create New User')}
                                    </h1>
                                    <p className="text-sm text-sky-100">
                                        {t('Add a new user account with credentials, role and section permissions')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Form Body */}
                <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                            {/* Section 1: Basic Information */}
                            <div>
                                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                                    <User className="h-5 w-5 text-vismass-blue" />
                                    <h2 className="text-base font-semibold text-slate-800">
                                        {t('Personal & Account Information')}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('First Name')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            required
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. John"
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Last Name')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            required
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Silva"
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Username')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            required
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="e.g. jsilva"
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Email Address')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="e.g. john@vismass.com"
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Phone Number')} (10 digits)
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 0771234567"
                                            maxLength={10}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Security & Password */}
                            <div>
                                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                                    <Lock className="h-5 w-5 text-vismass-blue" />
                                    <h2 className="text-base font-semibold text-slate-800">
                                        {t('Security & Authentication')}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Password')} <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                required
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Min. 8 characters"
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Confirm Password')} <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="password_confirmation"
                                                required
                                                value={formData.password_confirmation}
                                                onChange={handleInputChange}
                                                placeholder="Repeat password"
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Organization & Role */}
                            <div>
                                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                                    <Shield className="h-5 w-5 text-vismass-blue" />
                                    <h2 className="text-base font-semibold text-slate-800">
                                        {t('Organization & Role Assignment')}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Company Scope (Active Company) */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Assigned Company')}
                                        </label>
                                        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-800">
                                            <Building2 className="h-4 w-4 text-vismass-blue" />
                                            <span className="font-medium">
                                                {activeCompany?.name || activeCompany?.company_code || activeCompanyCode || 'Default'}
                                            </span>
                                            {activeCompanyCode && (
                                                <span className="ml-auto rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                                    {activeCompanyCode}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Section')}
                                        </label>
                                        <select
                                            name="section_code"
                                            value={formData.section_code}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                        >
                                            <option value="">{t('All / Unassigned')}</option>
                                            {sectionsList
                                                .filter(
                                                    (s) =>
                                                        !formData.company_code ||
                                                        s.company_code === formData.company_code
                                                )
                                                .map((s) => (
                                                    <option key={s.id} value={s.section_code}>
                                                        {s.name} ({s.section_code})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            {t('Assigned Role')} <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="role_id"
                                            required
                                            value={formData.role_id}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition"
                                        >
                                            <option value="">{t('Select Role')}</option>
                                            {rolesList.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-center pt-6">
                                        <label className="relative flex cursor-pointer items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 rounded border-slate-300 text-vismass-blue focus:ring-vismass-blue"
                                            />
                                            <span className="text-sm font-medium text-slate-700">
                                                {t('Account is active and permitted to login')}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-6">
                                <Link
                                    href="/users"
                                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    {t('Cancel')}
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-6 py-2.5 rounded-xl shadow-lg transition"
                                >
                                    {loading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>{t('Creating User...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-1.5">
                                            <Plus className="w-4 h-4" />
                                            <span>{t('Create User')}</span>
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
