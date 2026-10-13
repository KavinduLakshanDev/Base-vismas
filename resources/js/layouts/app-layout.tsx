import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { BrandProvider } from '@/contexts/brand-context';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    hideFooter?: boolean;
    footerModuleName?: string;
}

export default ({ children, breadcrumbs, hideFooter, footerModuleName, ...props }: AppLayoutProps) => (
    <BrandProvider>
        <AppLayoutTemplate
            breadcrumbs={breadcrumbs}
            hideFooter={hideFooter}
            footerModuleName={footerModuleName}
            {...props}
        >
            {children}
        </AppLayoutTemplate>
    </BrandProvider>
);

