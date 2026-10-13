import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Code, Database, Plus, Tag } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface ControlMaster {
    id: number;
    concode: string;
    conkey: string;
    conname: string;
    is_active: boolean;
}

interface Props {
    controls: ControlMaster[];
}

export default function CreateCodeMaster({ controls }: Props) {
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
            title: t('Code Master'),
            href: '/admin/code-master',
        },
        {
            title: t('Create'),
            href: '#',
        },
    ];

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        conkey: '',
        cname: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/code-master', {
            onSuccess: () => {
                reset();
            },
        });
    };

    useEffect(() => {
        if (data.conkey && errors.conkey) clearErrors('conkey');
        if (data.cname && errors.cname) clearErrors('cname');
    }, [data.conkey, data.cname]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Create Code Master')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/admin/code-master"
                                    className="rounded-xl bg-white/20 p-3 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <Plus className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Create Code Master')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Add a new code master entry to your system')}
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
                            {t('Create Code Master')}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Define category codes and operational labels linked to a controller')}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Basic Information */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Code className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        {t('Basic Information')}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Controller Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="conkey" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Database className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Control Master')} *
                                        </Label>
                                        <Select
                                            value={data.conkey}
                                            onValueChange={(value) => setData('conkey', value)}
                                        >
                                            <SelectTrigger className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20">
                                                <SelectValue placeholder={t('Select a Control Master')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {controls.map((control) => (
                                                    <SelectItem key={control.id} value={control.conkey}>
                                                        {control.conname} ({control.conkey})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.conkey} />
                                        <p className="text-xs text-slate-500">
                                            {t('Select the parent controller for this code (e.g., UNIT, CATEGORY)')}
                                        </p>
                                    </div>

                                    {/* Code Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="cname" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Tag className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Code Name')} *
                                        </Label>
                                        <Input
                                            id="cname"
                                            value={data.cname}
                                            onChange={(e) => setData('cname', e.target.value)}
                                            required
                                            className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            placeholder="e.g., Electronics, Rice & Grains"
                                            maxLength={100}
                                        />
                                        <InputError message={errors.cname} />
                                        <p className="text-xs text-slate-500">
                                            {t('Descriptive label displayed across pos, invoices, and reports')}
                                        </p>
                                    </div>
                                </div>

                                {/* Auto-generated Information */}
                                {data.conkey && (
                                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                                        <h4 className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                            {t('Auto-generated Information')}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                            <div>
                                                <span className="font-medium text-slate-600">{t('Code Pattern')}:</span>
                                                <span className="ml-2 font-mono font-semibold text-vismass-blue">
                                                    {data.conkey}001, {data.conkey}002, etc.
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
                                    href="/admin/code-master"
                                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                                >
                                    {t('Cancel')}
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing || !data.conkey || !data.cname}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Creating Code...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Plus className="w-5 h-5" />
                                            <span>{t('Create Code Master')}</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-slate-600">
                        <p className="text-sm">VISMASS POS System • {t('Code Master')} • v1.0.0</p>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}