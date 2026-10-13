import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, Code, Database, Edit2, Eye, Tag } from 'lucide-react';

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
}

export default function ShowCodeMaster({ code }: Props) {
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
            title: t('View Code'),
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${code.cname} - ${t('Code Master')}`} />

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
                                    <Eye className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Code Details')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Details for')} {code.cname}
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
                            {code.cname}
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {t('Review configuration, controller association, and code details')}
                        </p>
                    </div>

                    {/* Card Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-8">
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

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Database className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Control Master')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {code.controlMaster?.conname || t('Unknown Controller')}
                                        </p>
                                        <p className="text-xs font-mono text-vismass-blue mt-0.5">
                                            {code.controlMaster?.conkey || code.conkey}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Tag className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Code Name')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-sm font-semibold text-slate-900">{code.cname}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <Code className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Code Key')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span className="font-mono text-sm font-semibold text-vismass-blue">
                                            {code.catkey}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-vismass-blue" />
                                        {t('Status')}
                                    </label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            code.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {code.is_active ? t('Active') : t('Inactive')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Box */}
                        <div className="rounded-xl bg-slate-50 p-6 border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-vismass-blue" />
                                {t('System Information')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-slate-500">{t('Parent Key')}:</span>
                                    <span className="ml-2 font-mono font-medium text-slate-800">{code.conkey}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-slate-500">{t('Created At')}:</span>
                                    <span className="ml-2 text-slate-800">
                                        {new Date(code.created_at).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-6 border-t border-slate-200 space-x-3">
                            <Link
                                href="/admin/code-master"
                                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                            >
                                {t('Back to List')}
                            </Link>
                            <Link
                                href={`/admin/code-master/${code.id}/edit`}
                                className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium inline-flex items-center space-x-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span>{t('Edit Code Master')}</span>
                            </Link>
                        </div>
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