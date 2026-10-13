import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, ServiceJob, Technician, ServiceJobStatus, ServiceJobItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    History as HistoryIcon,
    Wrench,
    User,
    Calendar,
    Filter,
    Plus,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { BreadcrumbItem } from '@/types';

interface HistoryPageProps extends PageProps {
    jobs: {
        data: (ServiceJob & {
            customer: { AccNm: string };
            technician: Technician;
            statusHistory: (ServiceJobStatus & { changedBy: { first_name: string; last_name: string } })[];
        })[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search: string;
    };
    technicians?: Technician[];
}

const JobHistory: React.FC<HistoryPageProps> = ({ jobs, filters, technicians = [] }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [searchMode, setSearchMode] = useState<'general' | 'customer' | 'technician' | 'serial'>('general');
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerResults, setCustomerResults] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
    const [serialQuery, setSerialQuery] = useState('');
    const [selectedJob, setSelectedJob] = useState<(ServiceJob & { items?: ServiceJobItem[]; statusHistory?: (ServiceJobStatus & { changedBy?: { first_name: string; last_name: string } })[] }) | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        if (searchMode === 'customer' && selectedCustomer) {
            router.get('/service-jobs/history', { customer_accky: selectedCustomer }, { preserveState: true });
            return;
        }

        if (searchMode === 'technician' && selectedTechnician) {
            router.get('/service-jobs/history', { technician_id: selectedTechnician }, { preserveState: true });
            return;
        }

        if (searchMode === 'serial' && serialQuery.trim() !== '') {
            router.get('/service-jobs/history', { serial: serialQuery.trim() }, { preserveState: true });
            return;
        }

        router.get('/service-jobs/history', { search: searchTerm }, { preserveState: true });
    };

    useEffect(() => {
        let active = true;
        if (searchMode === 'customer' && customerQuery.length >= 2) {
            fetch(`/service-jobs/search/customers?search=${encodeURIComponent(customerQuery)}`)
                .then(res => res.json())
                .then((data) => {
                    if (!active) return;
                    setCustomerResults(data || []);
                }).catch(() => setCustomerResults([]));
        } else {
            setCustomerResults([]);
        }
        return () => { active = false; };
    }, [customerQuery, searchMode]);

    const formatCurrency = (amount: string | number | null): string => {
        if (amount === null || amount === undefined) return 'Rs 0.00';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `Rs ${numAmount.toLocaleString('en-LK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'yyyy-MM-dd');
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Service Jobs'), href: '/service-jobs' },
        { title: t('Job History'), href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Service Job History')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <HistoryIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Service Job History')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Search and view all service jobs')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/service-jobs/create"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('Create New Job')}
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Search Card */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden mb-4">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                <h2 className="text-base font-semibold text-white">
                                    {t('Search & Filter')}
                                </h2>
                            </div>

                            <div className="p-4">
                                <form onSubmit={handleSearch} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        {/* Search Mode */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Search Mode')}</label>
                                            <select 
                                                value={searchMode} 
                                                onChange={e => setSearchMode(e.target.value as any)} 
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition bg-white"
                                            >
                                                <option value="general">{t('General')}</option>
                                                <option value="customer">{t('Customer')}</option>
                                                <option value="technician">{t('Technician')}</option>
                                                <option value="serial">{t('Serial')}</option>
                                            </select>
                                        </div>

                                        {/* General Search */}
                                        {searchMode === 'general' && (
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Search')}</label>
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        type="text"
                                                        value={searchTerm}
                                                        onChange={(e: any) => setSearchTerm(e.target.value)}
                                                        placeholder={t('Search by Job #, Serial #, Customer...')}
                                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition bg-white"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Customer Search */}
                                        {searchMode === 'customer' && (
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Customer')}</label>
                                                <div className="relative">
                                                    <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        type="text"
                                                        value={customerQuery}
                                                        onChange={(e: any) => { setCustomerQuery(e.target.value); setSelectedCustomer(null); }}
                                                        placeholder={t('Enter customer name or code')}
                                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition bg-white"
                                                    />
                                                    {customerResults.length > 0 && (
                                                        <div className="absolute z-10 bg-white border mt-1 w-full max-h-40 overflow-auto shadow-lg rounded-lg">
                                                            {customerResults.map(c => (
                                                                <div key={c.AccKy} className="p-3 hover:bg-slate-50 cursor-pointer text-gray-900 text-sm border-b border-gray-100 last:border-b-0" onClick={() => { setSelectedCustomer(c.AccKy); setCustomerQuery(c.AccNm); setCustomerResults([]); }}>
                                                                    <div className="font-medium">{c.AccNm}</div>
                                                                    <div className="text-xs text-gray-500 mt-0.5">{t('Code')}: {c.AccCd}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Technician Select */}
                                        {searchMode === 'technician' && (
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Technician')}</label>
                                                <select value={selectedTechnician ?? ''} onChange={e => setSelectedTechnician(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition bg-white">
                                                    <option value="">-- {t('Select Technician')} --</option>
                                                    {technicians.map(tn => (
                                                        <option key={tn.id} value={tn.id}>{tn.first_name} {tn.last_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Serial Search */}
                                        {searchMode === 'serial' && (
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Device Serial')}</label>
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        type="text"
                                                        value={serialQuery}
                                                        onChange={(e: any) => setSerialQuery(e.target.value)}
                                                        placeholder={t('Enter device serial')}
                                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition bg-white"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 font-medium inline-flex items-center"
                                        >
                                            <Search className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Search')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Results Card */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                <h2 className="text-base font-semibold text-white">
                                    {t('Service Jobs')}
                                </h2>
                                <p className="text-white/80 text-xs mt-0.5">
                                    {t('All service jobs in the system')}
                                </p>
                            </div>

                            <div className="p-4">
                                {jobs.data.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Job #')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Customer')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Device Serial')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Status')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Technician')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Completed')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Total')}
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sky-900 uppercase tracking-wider">
                                                        {t('Actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {jobs.data.map(job => (
                                                    <tr key={job.id} className="hover:bg-sky-50/50 transition-colors duration-150">
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <div className="text-xs font-medium text-gray-900">
                                                                <Link href={`/service-jobs/${job.id}`} className="text-sky-600 hover:text-sky-800">
                                                                    {job.job_number}
                                                                </Link>
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                                <Calendar className="mr-1 h-3 w-3" />
                                                                {formatDate(job.created_at)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center">
                                                                <User className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                                                <div>
                                                                    <div className="text-xs font-medium text-gray-900">
                                                                        {job.customer_name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-slate-500 font-mono">
                                                            {job.device_serial || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                                job.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                                job.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {t(job.status || 'pending')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-xs text-gray-900">
                                                                {job.technician ? (
                                                                    `${job.technician.first_name}`
                                                                ) : <span className="text-slate-400">N/A</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs text-gray-900">
                                                            {formatDate(job.actual_completion_date)}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-900">
                                                            {formatCurrency(job.total_amount)}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedJob(job);
                                                                    setShowDetails(true);
                                                                }}
                                                                className="inline-flex items-center text-sky-600 hover:text-sky-800"
                                                            >
                                                                <Wrench className="mr-1 h-3.5 w-3.5" />
                                                                {t('View')}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="mx-auto h-10 w-10 text-gray-400 mb-3">
                                            <HistoryIcon className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xs font-medium text-gray-900 mb-1.5">{t('No service jobs found')}</h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('Try adjusting your search criteria or create a new service job.')}
                                        </p>
                                        <Link
                                            href="/service-jobs/create"
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Create Service Job')}
                                        </Link>
                                    </div>
                                )}

                                {/* Pagination */}
                                {jobs.links.length > 3 && (
                                    <div className="mt-4 flex items-center justify-center">
                                        <nav className="flex items-center space-x-1" aria-label="Pagination">
                                            {jobs.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${
                                                        link.active
                                                            ? 'z-10 bg-sky-50 border border-sky-500 text-sky-600'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-6 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="text-xs text-gray-500">© VISMASS POS System • {t('Service Job History')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Job Details Modal */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <Wrench className="w-5 h-5 text-sky-600" />
                            <span>{t('Service Job Details')}</span>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedJob && (
                        <div className="space-y-6">
                            {/* Job Header */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Job Number')}</label>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">{selectedJob.job_number}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Status')}</label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                                            selectedJob.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                            selectedJob.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {t(selectedJob.status || 'pending')}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Total Amount')}</label>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">{formatCurrency(selectedJob.total_amount)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Information */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center space-x-2">
                                        <User className="w-4 h-4" />
                                        <span>{t('Customer Information')}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Name')}</label>
                                        <p className="text-gray-900 mt-1">{selectedJob.customer_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Phone')}</label>
                                        <p className="text-gray-900 mt-1">{selectedJob.customer_phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Email')}</label>
                                        <p className="text-gray-900 mt-1">{selectedJob.customer_email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Address')}</label>
                                        <p className="text-gray-900 mt-1">{selectedJob.customer_address || 'N/A'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Device Information */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center space-x-2">
                                        <Wrench className="w-4 h-4" />
                                        <span>{t('Device Information')}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Brand')}</label>
                                        <p className="text-gray-900 mt-1">{selectedJob.device_brand || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">{t('Model')}</label>
                                        <p className="text-gray-900 mt-1">{selectedJob.device_model || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-medium text-gray-600">{t('Serial Number')}</label>
                                        <p className="text-gray-900 font-mono mt-1">{selectedJob.device_serial || 'N/A'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Service Items */}
                            {selectedJob.items && selectedJob.items.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm flex items-center space-x-2">
                                            <Wrench className="w-4 h-4" />
                                            <span>{t('Service Items')}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">{t('Item')}</TableHead>
                                                    <TableHead className="text-xs">{t('Quantity')}</TableHead>
                                                    <TableHead className="text-xs">{t('Unit Price')}</TableHead>
                                                    <TableHead className="text-xs">{t('Total')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedJob.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="text-xs">{item.item_name || 'N/A'}</TableCell>
                                                        <TableCell className="text-xs">{item.quantity}</TableCell>
                                                        <TableCell className="text-xs">{formatCurrency(item.unit_price)}</TableCell>
                                                        <TableCell className="text-xs">{formatCurrency(item.total_price)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default JobHistory;
