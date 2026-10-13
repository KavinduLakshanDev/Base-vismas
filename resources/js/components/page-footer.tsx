import { t } from '@/lib/i18n';
import React from 'react';

export interface PageFooterProps {
    className?: string;
    moduleName?: string;
}

export function PageFooter({ className = '', moduleName }: PageFooterProps) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={`mt-auto border-t border-sky-200/80 dark:border-border bg-gradient-to-r from-white via-sky-50/60 to-white dark:from-background dark:via-card dark:to-background py-3 px-4 sm:px-6 lg:px-8 text-center transition-colors ${className}`}>
            <div className="mx-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-muted-foreground font-medium">
                <span>© {currentYear} VISMASS POS System</span>
                <span className="hidden sm:inline text-sky-300 dark:text-muted-foreground">•</span>
                <span>{moduleName ? t(moduleName) : t('All rights reserved')}</span>
                <span className="hidden sm:inline text-sky-300 dark:text-muted-foreground">•</span>
                <span className="inline-flex items-center rounded-full bg-sky-100/80 dark:bg-muted px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-slate-200">v1.0.0</span>
            </div>
        </footer>
    );
}

export default PageFooter;
