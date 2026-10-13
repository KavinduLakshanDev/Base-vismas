import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Code, Database, Edit2, Save, Tag } from 'lucide-react';
import { FormEventHandler } from 'react';

interface ControlMaster {
    id: number;
    concode: string;
    conkey: string;
    conname: string;
    is_active: boolean;
}

interface CodeMaster {
    id: number;
    conkey: string;
    concode: string;
    catkey: string;
    cname: string;
    is_active: boolean;
    created_at: string;
    controlMaster?: ControlMaster;
}

interface Props {
    code: CodeMaster;
    controls: ControlMaster[];
}

export default function EditCodeMaster({ code, controls }: Props) {
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
            title: t('Edit Code'),
            href: '#',
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        conkey: code.conkey,
        cname: code.cname,
        is_active: code.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/admin/code-master/${code.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} footerModuleName="Code Master">
            <Head title={`Edit ${code.cname} - ${t('Code Master')}`} />

            <div className="flex-1 bg-slate-50">
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
                                    <Edit2 className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Edit Code Master')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Update code:')} {code.cname}
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
                            {t('Edit Code Master')}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Update controller, code description, and status for')} <span className="font-semibold text-vismass-blue">{code.cname}</span>
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
                                                <SelectValue placeholder={t('Select control master')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {controls
                                                    .filter((c) => c.is_active)
                                                    .map((control) => (
                                                        <SelectItem key={control.id} value={control.conkey}>
                                                            {control.conname} ({control.conkey})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.conkey} />
                                    </div>

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
                                        {t('Active Code')} <span className="text-xs text-slate-500 font-normal ml-1">({t('Active codes appear in selection menus')})</span>
                                    </Label>
                                </div>
                            </div>

                            {/* Code Information Metadata */}
                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                                <h4 className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    {t('Code Information')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-slate-600">{t('Code Key')}:</span>
                                        <span className="ml-2 font-mono font-semibold text-vismass-blue">{code.catkey}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-600">{t('Created At')}:</span>
                                        <span className="ml-2 text-slate-800">
                                            {new Date(code.created_at).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-600">{t('Current Controller')}:</span>
                                        <span className="ml-2 text-slate-800">
                                            {code.controlMaster?.conname || t('Unknown')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-600">{t('Control Key')}:</span>
                                        <span className="ml-2 font-mono text-slate-800">
                                            {code.controlMaster?.conkey || code.conkey}
                                        </span>
                                    </div>
                                </div>
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
                                    disabled={processing}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Updating Code...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Save className="w-5 h-5" />
                                            <span>{t('Update Code Master')}</span>
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