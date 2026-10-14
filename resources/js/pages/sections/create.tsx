import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Building2, Plus, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

interface Props {
    suggestedCode?: string;
    activeCompanyCode?: string;
}

export default function CreateSection({ suggestedCode = '' }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        section_code: suggestedCode,
        name: '',
        section_type: 'other',
    });

    const [isGenerating, setIsGenerating] = useState(false);

    const handleRegenerateCode = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/sections/generate-code');
            const result = await response.json();
            if (result.section_code) {
                setData('section_code', result.section_code);
                toast.success(t('New unique section code generated'));
            }
        } catch (error) {
            toast.error(t('Failed to generate section code'));
        } finally {
            setIsGenerating(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/sections');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Sections'), href: '/sections' },
                { title: t('Create Section'), href: '/sections/create' }
            ]}
            footerModuleName="Section Management"
        >
            <Head title={t('Create Section')} />

            <div className="flex-1 bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/sections"
                                    className="rounded-xl bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <div className="rounded-xl bg-white/20 p-2 shadow-lg">
                                    <Plus className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Create New Section')}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {t('Add a new section to your distribution network')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Basic Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-vismass-blue/10 rounded-lg">
                                        <Building2 className="w-5 h-5 text-vismass-blue" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-800">{t('Basic Information')}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="section_code" className="text-sm font-medium text-slate-700 flex items-center">
                                                <Building2 className="w-4 h-4 mr-2 text-vismass-blue" />
                                                {t('Section Code')} *
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={handleRegenerateCode}
                                                disabled={isGenerating}
                                                className="text-xs text-vismass-blue hover:text-sky-700 font-medium inline-flex items-center space-x-1 cursor-pointer transition disabled:opacity-50"
                                                title={t('Generate a new unique section code')}
                                            >
                                                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                                                <span>{t('Generate New')}</span>
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="section_code"
                                                value={data.section_code}
                                                readOnly
                                                required
                                                className="border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed font-mono tracking-wider pr-20 select-all"
                                                placeholder="e.g., VIS-SEC-001"
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <Sparkles className="w-3 h-3 text-emerald-500" />
                                                    <span>{t('Auto')}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {t('Automatically generated to prevent duplicate codes across the system.')}
                                        </p>
                                        <InputError message={errors.section_code} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Building2 className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Section Name')} *
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20"
                                            placeholder="e.g., Main Warehouse, Downtown Store"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="section_type" className="text-sm font-medium text-slate-700 flex items-center">
                                            <Building2 className="w-4 h-4 mr-2 text-vismass-blue" />
                                            {t('Section Type')}
                                        </Label>
                                        <Select
                                            value={data.section_type}
                                            onValueChange={(value) => setData('section_type', value)}
                                        >
                                            <SelectTrigger className="border-slate-200 focus:border-vismass-blue focus:ring-vismass-blue/20">
                                                <SelectValue placeholder={t('Select section type')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="warehouse">🏭 {t('Warehouse')}</SelectItem>
                                                <SelectItem value="store">🏪 {t('Store')}</SelectItem>
                                                <SelectItem value="office">🏢 {t('Office')}</SelectItem>
                                                <SelectItem value="other">📍 {t('Other')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.section_type} />
                                    </div>
                                </div>
                            </div>

                            {/* Submit and Cancel Buttons */}
                            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    className="px-6 py-2.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                    <Link href="/sections">{t('Cancel')}</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-vismass-blue hover:bg-vismass-blue/90 text-white px-8 py-2.5 rounded-xl shadow-lg transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('Creating Section...')}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Plus className="w-5 h-5" />
                                            <span>{t('Create Section')}</span>
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
