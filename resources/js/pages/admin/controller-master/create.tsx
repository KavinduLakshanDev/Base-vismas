import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { index } from '@/routes/admin/controller-master';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Database, Plus, ArrowLeft, Code } from 'lucide-react';
import { FormEvent, useEffect } from 'react';

export default function CreateControllerMaster() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('Admin'),
            href: '#',
        },
        {
            title: t('Controller Master'),
            href: index().url,
        },
        {
            title: t('Create'),
            href: '#',
        },
    ];

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        conkey: '',
        conname: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(index().url, {
            onSuccess: () => reset(),
        });
    };

    useEffect(() => {
        if (data.conkey && errors.conkey) clearErrors('conkey');
        if (data.conname && errors.conname) clearErrors('conname');
    }, [data.conkey, data.conname]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create Controller Master')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href={index().url}
                                    className="rounded-xl bg-white/20 p-3 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <Plus className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Create Controller Master')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Add a new controller key to your system')}
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
                            {t('Create Controller Master')}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Define new controller keys to categorize codes across companies and sections')}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <form onSubmit={submit} className="space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Database className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        {t('Controller Details')}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="conkey" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Database className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Control Key')} *
                                        </Label>
                                        <Input
                                            id="conkey"
                                            value={data.conkey}
                                            onChange={(e) => setData('conkey', e.target.value.toUpperCase())}
                                            required
                                            className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            placeholder="e.g., UNIT, CATEGORY, BRAND"
                                            maxLength={50}
                                        />
                                        <InputError message={errors.conkey} />
                                        <p className="text-xs text-slate-500">
                                            {t('A unique uppercase identifier for this controller.')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="conname" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Code className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Control Name')} *
                                        </Label>
                                        <Input
                                            id="conname"
                                            value={data.conname}
                                            onChange={(e) => setData('conname', e.target.value)}
                                            required
                                            className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            placeholder="e.g., Measurement Units, Categories"
                                            maxLength={100}
                                        />
                                        <InputError message={errors.conname} />
                                        <p className="text-xs text-slate-500">
                                            {t('A human-readable descriptive name displayed across the system.')}
                                        </p>
                                    </div>
                                </div>

                                {data.conkey && (
                                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                                        <h4 className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                            {t('Auto-generated Information')}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                            <div>
                                                <span className="font-medium text-slate-600">{t('Key Pattern')}:</span>
                                                <span className="ml-2 font-mono font-semibold text-vismass-blue">
                                                    {data.conkey}_001, {data.conkey}_002
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-600">{t('Default Status')}:</span>
                                                <span className="ml-2 font-medium text-emerald-600">{t('Active by default')}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end pt-6 border-t border-slate-200 space-x-3">
                                <Link
                                    href={index().url}
                                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                                >
                                    {t('Cancel')}
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing || !data.conkey || !data.conname}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Creating Controller...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Plus className="w-5 h-5" />
                                            <span>{t('Create Controller')}</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-slate-600">
                        <p className="text-sm">VISMASS POS System • {t('Controller Master')} • v1.0.0</p>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}