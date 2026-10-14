import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function getJobStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'done':
            return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        case 'in_progress':
        case 'processing':
            return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        case 'pending':
            return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        case 'failed':
        case 'cancelled':
            return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        default:
            return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
}
