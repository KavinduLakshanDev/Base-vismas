import { Head, Link, router } from '@inertiajs/react';
import { Building2, LogIn, Power } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';

interface Company {
    id: number;
    company_code: string;
    name: string;
    email?: string;
    is_active?: boolean;
}

interface SelectCompanyProps {
    companies: Company[];
    currentCompanyCode?: string;
}

export default function SelectCompany({ companies, currentCompanyCode }: SelectCompanyProps) {
    const [loadingCode, setLoadingCode] = useState<string | null>(null);

    const handleSelect = (companyCode: string) => {
        setLoadingCode(companyCode);
        router.post(
            '/select-company',
            { company_code: companyCode },
            {
                onFinish: () => setLoadingCode(null),
            }
        );
    };

    const handleToggle = (companyId: number) => {
        router.post(`/companies/${companyId}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const getPrefix = (code: string) => {
        if (!code) return 'CO';
        const clean = code.replace(/[^a-zA-Z]/g, '');
        return clean.slice(0, 3).toUpperCase() || code.slice(0, 3).toUpperCase();
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/70 p-4 font-sans text-neutral-900 antialiased">
            <Head title="Select Company" />

            <div className="w-full max-w-md">
                {/* Header Icon */}
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg shadow-blue-500/25">
                    <Building2 className="size-7" />
                </div>

                {/* Header Texts */}
                <div className="mt-4 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Select Company</h1>
                    <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">
                        You are logged in as <span className="font-semibold text-neutral-800">Super Admin</span>.
                        <br />
                        Choose which company to manage.
                    </p>
                </div>

                {/* Companies List */}
                <div className="mt-8 flex flex-col gap-3.5">
                    {companies.map((company) => {
                        const isActive = company.is_active !== false;
                        const isCurrent = currentCompanyCode === company.company_code;
                        const prefix = getPrefix(company.company_code);
                        const isLoading = loadingCode === company.company_code;

                        return (
                            <div
                                key={company.id}
                                className={cn(
                                    "group relative flex items-center justify-between rounded-2xl border bg-white p-3.5 transition-all duration-200",
                                    isActive
                                        ? "border-neutral-200/80 shadow-xs hover:border-blue-300 hover:shadow-md cursor-pointer"
                                        : "border-neutral-200/60 bg-neutral-50/50 opacity-75",
                                    isCurrent && isActive && "ring-2 ring-blue-500/30 border-blue-500"
                                )}
                                onClick={() => {
                                    if (isActive && !isLoading) {
                                        handleSelect(company.company_code);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3.5">
                                    {/* Company Avatar Badge */}
                                    <div
                                        className={cn(
                                            "flex size-12 items-center justify-center rounded-xl text-xs font-bold uppercase tracking-wider",
                                            isActive
                                                ? "bg-blue-100 text-blue-600"
                                                : "bg-neutral-100 text-neutral-400"
                                        )}
                                    >
                                        {prefix}
                                    </div>

                                    {/* Company Info */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-neutral-900">
                                                {company.name}
                                            </span>
                                            {!isActive && (
                                                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                                    DISABLED
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 font-mono text-xs text-neutral-400 tracking-wide">
                                            {company.company_code}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div
                                    className="flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        disabled={!isActive || isLoading}
                                        onClick={() => handleSelect(company.company_code)}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                                            isActive
                                                ? "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                : "text-neutral-300 cursor-not-allowed"
                                        )}
                                    >
                                        <LogIn className="size-4" />
                                        <span>{isLoading ? 'Entering...' : 'Enter'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        title={isActive ? "Disable company" : "Activate company"}
                                        onClick={() => handleToggle(company.id)}
                                        className={cn(
                                            "rounded-lg p-1.5 transition-colors",
                                            isActive
                                                ? "text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600"
                                                : "text-red-500 hover:bg-red-50"
                                        )}
                                    >
                                        <Power className="size-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {companies.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                            No companies found.
                        </div>
                    )}
                </div>

                {/* Logout Option */}
                <div className="mt-8 text-center">
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        Sign out of Super Admin
                    </Link>
                </div>
            </div>
        </div>
    );
}
