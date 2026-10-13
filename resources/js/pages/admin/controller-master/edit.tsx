import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { index, show } from '@/routes/admin/controller-master';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Code, Database, Edit2, Save, CheckCircle2 } from 'lucide-react';
import { FormEventHandler } from 'react';

interface ControlMaster {
    id: number;
    concode: string;
    conkey: string;
    conname: string;
    is_active: boolean;
    company_code?: string;
    section_code?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    control: ControlMaster;
}

export default function EditControllerMaster({ control }: Props) {
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
            title: t('Edit Controller'),
            href: '#',
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        conkey: control.conkey,
        conname: control.conname,
        is_active: control.is_active,
    });

    const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        put(`/admin/controller-master/${control.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="Controller Master">
            <Head title={`${t('Edit')} ${control.conname} - ${t('Controller Master')}`} />

            <div className="flex-1 bg-slate-50">
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
                                    <Edit2 className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Edit Controller Master')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Update controller:')} {control.conname}
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
                            {t('Edit Controller')}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Update control key, descriptive name, and active status for')} <span className="font-semibold text-vismass-blue">{control.conname}</span>
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Controller Details */}
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
                                            placeholder="e.g., UNIT, CATEGORY"
                                            maxLength={50}
                                        />
                                        <InputError message={errors.conkey} />
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
                                            placeholder="e.g., Units, Categories"
                                            maxLength={100}
                                        />
                                        <InputError message={errors.conname} />
                                    </div>
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <CheckCircle2 className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        {t('Status')}
                                    </h2>
                                </div>

                                <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-vismass-blue focus:ring-vismass-blue"
                                    />
                                    <Label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                                        {t('Active Controller')} <span className="text-xs text-slate-500 font-normal ml-1">({t('Active controllers are available for code masters')})</span>
                                    </Label>
                                </div>
                            </div>

                            {/* Controller Metadata */}
                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                                <h4 className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    {t('Controller Information')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-slate-600">{t('Control Code')}:</span>
                                        <span className="ml-2 font-mono font-semibold text-slate-800">{control.concode}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-600">{t('Created At')}:</span>
                                        <span className="ml-2 text-slate-800">{new Date(control.created_at).toLocaleDateString('en-GB')}</span>
                                    </div>
                                </div>
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
                                    disabled={processing}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Updating Controller...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Save className="w-5 h-5" />
                                            <span>{t('Update Controller')}</span>
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