import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import FlashMessages from '@/components/flash-messages';
import { PageFooter } from '@/components/page-footer';
import { Toaster } from '@/components/ui/sonner';
import { BrandProvider } from '@/contexts/brand-context';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    hideFooter?: boolean;
    footerModuleName?: string;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    hideFooter = false,
    footerModuleName,
}: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <BrandProvider>
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent variant="sidebar" className="overflow-x-hidden flex min-h-svh flex-col">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    <FlashMessages />
                    <div className="flex-1 flex flex-col">
                        {children}
                    </div>
                    {!hideFooter && <PageFooter moduleName={footerModuleName} />}
                </AppContent>
                <Toaster position="top-right" />
            </AppShell>
        </BrandProvider>
    );
}