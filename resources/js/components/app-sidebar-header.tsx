import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Building2, RefreshCw } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<SharedData>().props;
    const isSuperAdmin = auth?.user?.user_type === 'super_admin';
    const activeCompany = (auth as any)?.active_company;

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {isSuperAdmin && (
                <div className="flex items-center gap-2">
                    <Link
                        href="/select-company"
                        className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1 text-xs font-medium text-blue-700 shadow-2xs transition-all hover:bg-blue-100"
                        title="Click to switch company"
                    >
                        <Building2 className="size-3.5 text-blue-600" />
                        <span>{activeCompany?.name || activeCompany?.company_code || 'Select Company'}</span>
                        <RefreshCw className="ml-1 size-3 text-blue-500" />
                    </Link>
                </div>
            )}
        </header>
    );
}
