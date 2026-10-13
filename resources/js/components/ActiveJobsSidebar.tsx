import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { getJobStatusColor } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from 'axios';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface JobItem {
    id: number;
    status: string;
    product: { product_name: string; type: string } | null;
}

interface Job {
    id: number;
    job_no: string;
    client: { name: string } | null;
    guest_name: string | null;
    delivery_date: string;
    total_amount: number;
    items: JobItem[];
}

export function ActiveJobsSidebar() {
    const { t } = useTranslation();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActiveJobs = useCallback(async (silent = false) => {
        try {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const response = await axios.get('/jobs/active-pool');
            setJobs(response.data.jobs || []);
        } catch (error) {
            console.error('Failed to fetch active jobs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveJobs();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchActiveJobs(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchActiveJobs]);

    const isUrgent = (deliveryDate: string): boolean => {
        const now = new Date();
        // Build local-time midnight for today and tomorrow (avoids UTC parse issues)
        const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // Parse "2026-07-30" or "2026-07-30T..." as local date parts
        const datePart = deliveryDate.split('T')[0];
        const [y, m, d] = datePart.split('-').map(Number);
        const deliveryLocal = new Date(y, m - 1, d);

        return (
            deliveryLocal.getTime() === todayLocal.getTime() ||
            deliveryLocal.getTime() === tomorrowLocal.getTime()
        );
    };

    const isOverdue = (deliveryDate: string): boolean => {
        const now = new Date();
        const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const datePart = deliveryDate.split('T')[0];
        const [y, m, d] = datePart.split('-').map(Number);
        const deliveryLocal = new Date(y, m - 1, d);

        return deliveryLocal.getTime() < todayLocal.getTime();
    };


    return (
        <div className="w-full h-full flex flex-col bg-background">
            <style>{`
                @keyframes urgentBlink {
                    0%, 100% { 
                        background-color: rgba(239, 68, 68, 0.15); 
                        box-shadow: inset 4px 0 0 0 rgb(239, 68, 68); 
                    }
                    50% { 
                        background-color: rgba(239, 68, 68, 0.02); 
                        box-shadow: inset 4px 0 0 0 rgba(239, 68, 68, 0.3); 
                    }
                }
                .urgent-blink {
                    animation: urgentBlink 1s ease-in-out infinite;
                }
            `}</style>
            <div className="p-4 border-b font-semibold text-lg flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    {t('Active Pool Jobs')}
                    {jobs.length > 0 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
                            {jobs.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => fetchActiveJobs(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                    title={t('Refresh')}
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ScrollArea className="flex-1">
                        {jobs.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8 px-4">
                                {t('No active jobs found.')}
                            </div>
                        ) : (
                            <div className="border rounded-md mx-3 mb-8 bg-card">
                                <ScrollArea className="w-full">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">{t('Job Info')}</TableHead>
                                                <TableHead className="text-xs">{t('Services')}</TableHead>
                                                <TableHead className="text-right text-xs">{t('Amount')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {jobs.map((job) => {
                                                const urgent = isUrgent(job.delivery_date);
                                                const overdue = isOverdue(job.delivery_date);
                                                return (
                                                    <TableRow 
                                                        key={job.id}
                                                        className={
                                                            overdue ? 'bg-red-100/50 dark:bg-red-900/30 urgent-blink border-l-4 border-l-red-600' : 
                                                            urgent ? 'bg-red-50/50 dark:bg-red-950/20 urgent-blink border-l-2 border-l-red-500' : ''
                                                        }
                                                    >
                                                        <TableCell className="py-2 align-top">
                                                            <div className="flex items-center gap-1">
                                                                <Link href={`/jobs/${job.id}`} className="font-semibold text-[11px] whitespace-nowrap hover:underline hover:text-primary transition-colors block">
                                                                    {job.job_no}
                                                                </Link>
                                                                {overdue && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3 leading-none">{t('Overdue')}</Badge>}
                                                            </div>
                                                            <div className={`text-[10px] whitespace-nowrap mb-1 ${(urgent || overdue) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                                                {new Date(job.delivery_date).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-[10px] font-medium max-w-[100px] truncate text-muted-foreground" title={job.client ? job.client.name : job.guest_name || ''}>
                                                                {job.client ? job.client.name : job.guest_name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2 align-top">
                                                            {job.items && job.items.filter(i => i.product?.type === 'Service').length > 0 ? (
                                                                <div className="space-y-1.5">
                                                                    {job.items.filter(i => i.product?.type === 'Service').map((item) => (
                                                                        <div key={item.id} className="flex flex-col gap-0.5">
                                                                            <span className="truncate text-[10px] max-w-[110px]" title={item.product?.product_name || t('Unknown Service')}>
                                                                                {item.product?.product_name || t('Unknown Service')}
                                                                            </span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={`w-fit text-[9px] px-1 py-0 leading-none ${getJobStatusColor(item.status)}`}
                                                                            >
                                                                                {t(item.status || 'Pending')}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-2 pr-2 text-right align-top">
                                                            <div className="font-medium text-[11px] mb-2 whitespace-nowrap">
                                                                {Number(job.total_amount).toFixed(2)}
                                                            </div>
                                                            <Link href={`/jobs/${job.id}`}>
                                                                <Button size="sm" variant="secondary" className="h-5 px-2 text-[9px] w-full">
                                                                    {t('View')}
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        )}
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}

