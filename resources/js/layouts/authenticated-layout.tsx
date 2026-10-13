import React, { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export interface AuthenticatedLayoutProps {
  children: ReactNode;
  breadcrumbs?: Array<{ label?: string; title?: string; href?: string; url?: string }>;
  pageTitle?: string;
  pageActions?: ReactNode;
  backUrl?: string;
  [key: string]: any;
}

export default function AuthenticatedLayout({
  children,
  breadcrumbs = [],
  pageTitle,
  ...props
}: AuthenticatedLayoutProps) {
  const formattedBreadcrumbs = breadcrumbs.map(b => ({
    title: b.title || b.label || '',
    href: b.href || b.url || '#',
  }));

  return (
    <AppLayout breadcrumbs={formattedBreadcrumbs} {...props}>
      {pageTitle && <Head title={pageTitle} />}
      <div className="flex-1 p-4 md:p-6">
        {pageTitle && (
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{pageTitle}</h1>
          </div>
        )}
        {children}
      </div>
    </AppLayout>
  );
}
