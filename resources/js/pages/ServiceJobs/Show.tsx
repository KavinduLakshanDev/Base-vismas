// resources/js/Pages/ServiceJobs/Show.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { BreadcrumbItem, ServiceJob, ServiceJobItem, ServiceJobStatus, Technician, ServiceCharge, PageProps, CustomerPayment } from '@/types';
import { 
    Wrench, 
    User, 
    Smartphone, 
    Calendar, 
    DollarSign, 
    Package,
    Plus,
    Edit,
    Eye,
    Save,
    X,
    CheckCircle,
    Clock,
    AlertCircle,
    ArrowLeft,
    FileText,
    CreditCard,
    History,
    Tag,
    Barcode,
    Search,
    Receipt,
    ChevronUp,
    ChevronDown,
    Printer
} from 'lucide-react';

interface ItemMaster {
    ItmKy: string;
    ItemCode: string;
    ItmNm: string;
    SlsPri: string | number;
    Unit: string;
    BarCode: string;
    serial_number?: string;
    brand?: string;
    model?: string;
    source: 'itemmaster' | 'purchase_det';
    purchase_det_ky?: string;
    vat_inclusive?: boolean;
}

interface QuotationItem {
    id?: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    item_type: 'part' | 'service_charge';
}

interface ShowProps extends PageProps {
    job: ServiceJob & {
        items?: ServiceJobItem[];
        statusHistory?: (ServiceJobStatus & { changedBy?: { first_name: string; last_name: string } })[];
        technician?: Technician;
        customer?: {
            AccKy: string;
            AccNm: string;
            addresses?: Array<{
                AdrKy: number;
                Address: string;
                City?: string;
                Town?: string;
                Country?: string;
                TP1?: string;
                TP2?: string;
                TP3?: string;
                Email?: string;
                CtPerson?: string;
            }>;
        };
        createdBy?: { first_name: string; last_name: string };
        payments?: CustomerPayment[];
    };
    technicians: Technician[];
    serviceCharges: ServiceCharge[];
}

const Show: React.FC<ShowProps> = ({ job, technicians, serviceCharges, auth }) => {
    const [addingItem, setAddingItem] = useState(false);
    const [newItem, setNewItem] = useState({
        item_type: 'part' as const,
        item_name: '',
        quantity: 1,
        unit_price: 0,
        description: '',
        vat_inclusive: false,
        source: '' as 'itemmaster' | 'purchase_det' | '',
    });
    
    const [addingPayment, setAddingPayment] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [showAdvancedPayment, setShowAdvancedPayment] = useState(true);

    // Item search states
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [itemSearchResults, setItemSearchResults] = useState<ItemMaster[]>([]);
    const [showItemSearch, setShowItemSearch] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [itemSearchTimeout, setItemSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    
    const itemSearchRef = useRef<HTMLDivElement>(null);

    const { data: statusData, setData: setStatusData, post: updateStatus } = useForm({
        status: job.status,
        notes: job.technician_notes || '',
        assigned_technician_id: job.assigned_technician_id || '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('Service Jobs'),
            href: '/service-jobs',
        },
        {
            title: `${job.job_number}`,
            href: '#',
        },
    ];

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            assigned: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-purple-100 text-purple-800',
            waiting_for_parts: 'bg-orange-100 text-orange-800',
            quotation_received: 'bg-indigo-100 text-indigo-800',
            quotation_approved: 'bg-cyan-100 text-cyan-800',
            completed: 'bg-green-100 text-green-800',
            delivered: 'bg-teal-100 text-teal-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pending',
            assigned: 'Assigned',
            in_progress: 'In Progress',
            waiting_for_parts: 'Waiting for Parts',
            quotation_received: 'Quotation Generated',
            quotation_approved: 'Quotation Approved',
            completed: 'Completed',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
        };
        return labels[status] || status.replace('_', ' ');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return CheckCircle;
            case 'in_progress': return Clock;
            case 'pending': return AlertCircle;
            default: return Clock;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatCurrency = (amount: string | number): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `Rs ${numAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const calculateTotals = () => {
        const partsTotal = (job.items || [])
            .filter(item => item.item_type === 'part')
            .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        
        const serviceTotal = (job.items || [])
            .filter(item => item.item_type === 'service_charge')
            .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        
        const subtotal = partsTotal + serviceTotal;
        const advancedPayment = parseFloat(job.advanced_payment?.toString() || '0');
        const paidAmount = parseFloat(job.paid_amount?.toString() || '0');
        const netTotal = subtotal - advancedPayment;
        const balance = job.balance_amount !== null ? parseFloat(job.balance_amount.toString()) : netTotal - paidAmount;
        
        return { partsTotal, serviceTotal, subtotal, advancedPayment, paidAmount, netTotal, balance };
    };

    // Search items from itemmaster table
    const searchItems = async (searchTerm: string) => {
        if (searchTerm.length <= 1) {
            setItemSearchResults([]);
            setShowItemSearch(false);
            return;
        }

        setIsSearching(true);

        try {
            const primaryUrl = `/service-jobs/search/items?search=${encodeURIComponent(searchTerm)}`;
            const resp = await fetch(primaryUrl);

            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }

            const results: ItemMaster[] = await resp.json();
            setItemSearchResults(results);
            setShowItemSearch(results.length > 0);
        } catch (primaryError) {
            console.error('Item search error:', primaryError);
            setItemSearchResults([]);
            setShowItemSearch(false);
        } finally {
            setIsSearching(false);
        }
    };

    const handleItemSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        setNewItem({...newItem, item_name: value});
        setItemSearchQuery(value);
        
        // Clear existing timeout
        if (itemSearchTimeout) {
            clearTimeout(itemSearchTimeout);
        }
        
        // Set new timeout for debounced search
        const timeout = setTimeout(() => {
            if (value.trim().length > 1 && newItem.item_type === 'part') {
                searchItems(value);
            } else {
                setItemSearchResults([]);
                setShowItemSearch(false);
            }
        }, 500);
        
        setItemSearchTimeout(timeout);
    };

    const selectItem = (item: ItemMaster) => {
        // Parse the sales price safely
        let unitPrice = 0;
        if (typeof item.SlsPri === 'string') {
            unitPrice = parseFloat(item.SlsPri);
        } else if (typeof item.SlsPri === 'number') {
            unitPrice = item.SlsPri;
        }
        
        // Build item description with source info
        let description = '';
        if (item.source === 'purchase_det') {
            const parts = [];
            if (item.serial_number) parts.push(`SN: ${item.serial_number}`);
            if (item.brand) parts.push(`Brand: ${item.brand}`);
            if (item.model) parts.push(`Model: ${item.model}`);
            description = parts.join(' | ');
        }
        
        setNewItem({
            ...newItem,
            item_type: 'part',
            item_name: item.ItmNm || item.ItemCode,
            unit_price: unitPrice,
            description: description,
            vat_inclusive: item.vat_inclusive || false,
            source: item.source,
        });
        
        setItemSearchQuery(item.ItmNm || item.ItemCode);
        setShowItemSearch(false);
        setItemSearchResults([]);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('item_type', newItem.item_type);
        formData.append('item_name', newItem.item_name);
        formData.append('quantity', newItem.quantity.toString());
        formData.append('unit_price', newItem.unit_price.toString());
        if (newItem.description) {
            formData.append('description', newItem.description);
        }
        formData.append('vat_inclusive', newItem.vat_inclusive ? '1' : '0');
        if (newItem.source) {
            formData.append('source', newItem.source);
        }
        
        await router.post(`/service-jobs/${job.id}/add-item`, formData, {
            forceFormData: true
        });
        
        setAddingItem(false);
        setNewItem({
            item_type: 'part',
            item_name: '',
            quantity: 1,
            unit_price: 0,
            description: '',
            vat_inclusive: false,
            source: '',
        });
        // Reset search states
        setItemSearchQuery('');
        setItemSearchResults([]);
        setShowItemSearch(false);
        setIsSearching(false);
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Use the dedicated customer payment creation endpoint
        router.post('/admin/customer-payments', {
            AccKy: job.AccKy,
            amount: parseFloat(paymentAmount),
            service_job_id: job.id,
            TrnDt: new Date().toISOString().split('T')[0],
            method: 'cash', // Default method, can be changed if needed
            notes: `Payment for Job ID ${job.job_number}`,
        }, {
            onSuccess: () => {
                setAddingPayment(false);
                setPaymentAmount('');
                // Inertia should automatically reload the job data with the updated balance
            }
        });
    };

    const handleStatusUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateStatus(`/service-jobs/${job.id}/update-status`, {
            forceFormData: false,
            preserveScroll: true,
            onSuccess: () => {
                // Reload the current page to show updated status
                router.reload({ only: ['job', 'statusHistory'] });
            }
        });
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showItemSearch && itemSearchRef.current && 
                !itemSearchRef.current.contains(e.target as Node)) {
                setShowItemSearch(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showItemSearch]);

    // If the show page was opened with ?print=1, auto-open the printable receipt
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('print') === '1') {
                const receiptUrl = `/service-jobs/${job.id}/receipt`;
                const win = window.open(receiptUrl, '_blank');
                if (win) win.focus();
            }
        } catch (err) {
            console.error('Auto-open receipt failed:', err);
        }
    }, []);

    // If a new job was just created and requested an estimate, open estimate create page
    useEffect(() => {
        try {
            if (sessionStorage.getItem('openEstimateAfterCreate') === 'true') {
                sessionStorage.removeItem('openEstimateAfterCreate');
                // leave prefill in sessionStorage as `estimatePrefill`
                const url = `/estimates/create?service_job_id=${job.id}`;
                const win = window.open(url, '_blank');
                if (win) win.focus();
            }
        } catch (err) {
            console.error('Auto-open estimate failed:', err);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showItemSearch && itemSearchRef.current && 
                !itemSearchRef.current.contains(e.target as Node)) {
                setShowItemSearch(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showItemSearch]);

    const totals = calculateTotals();
    const StatusIcon = getStatusIcon(job.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('Service Job')}: ${job.job_number}`} />
            
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow-lg">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => window.history.back()}
                                    className="mr-2 rounded-lg bg-white/20 backdrop-blur-sm p-2 hover:bg-white/30 transition-all duration-200 border border-white/30"
                                    title={t('Go Back')}
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </button>
                                <div className="rounded-xl bg-white/20 p-3 shadow-lg">
                                    <Wrench className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Service Job')}: {job.job_number}
                                    </h1>
                                    {job.invoice_number && (
                                        <p className="text-sm font-medium text-white/90">
                                            {t('Invoice No')}: {job.invoice_number}
                                        </p>
                                    )}
                                    <p className="text-sm text-white/80">
                                        {t('View and manage service job details')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                                    <StatusIcon className="mr-1 h-4 w-4" />
                                    {t(getStatusLabel(job.status))}
                                </span>
                                <button
                                    onClick={() => window.open(`/service-jobs/${job.id}/quotations/create`, '_blank')}
                                    className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-vismass-blue transition-all hover:bg-slate-100 hover:shadow-lg"
                                >
                                    <Tag className="mr-2 h-4 w-4" />
                                    {t('Create Quotation')}
                                </button>
                                <button
                                    onClick={() => window.open(`/service-jobs/${job.id}/invoice`, '_blank')}
                                    className="inline-flex items-center rounded-xl bg-vismass-blue px-4 py-2 text-sm font-medium text-white transition-all hover:bg-vismass-blue/90 hover:shadow-lg"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {t('Print Invoice')}
                                </button>
                                <button
                                    onClick={() => window.open(`/service-jobs/${job.id}/receipt`, '_blank')}
                                    className="inline-flex items-center rounded-xl bg-vismass-grey px-4 py-2 text-sm font-medium text-white transition-all hover:bg-vismass-grey/90 hover:shadow-lg"
                                >
                                    <Receipt className="mr-2 h-4 w-4" />
                                    {t('Print Receipt')}
                                </button>
                               
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2 shadow">
                                        <Package className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Parts Total')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {formatCurrency(totals.partsTotal)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-green-600 p-2 shadow">
                                        <Wrench className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Service Charges')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {formatCurrency(totals.serviceTotal)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2 shadow">
                                        <CreditCard className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Advanced Payment')}</p>
                                        <p className="text-sm font-bold text-red-600 truncate">
                                            {formatCurrency(-totals.advancedPayment)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-emerald-600 p-2 shadow">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Net Total')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {formatCurrency(totals.netTotal)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-600 p-2 shadow">
                                        <AlertCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-2 flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-600 truncate">{t('Balance')}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {formatCurrency(totals.netTotal - parseFloat(job.paid_amount?.toString() || '0'))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Main Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Customer Information Card */}
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <User className="mr-2 h-4 w-4 text-white" />
                                                <h3 className="text-base font-semibold text-white">
                                                    {t('Customer Information')}
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => window.open(`/service-jobs/${job.id}/receipt`, '_blank')}
                                                className="text-white hover:text-white/80 text-xs font-medium flex items-center transition-colors"
                                            >
                                                <Receipt className="mr-1 h-3 w-3" />
                                                {t('Print Job Receipt')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Customer Name')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium">
                                                    {job.customer?.AccNm || job.customer_name || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Phone Number')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium flex items-center">
                                                    <Smartphone className="mr-1 h-3 w-3 text-gray-400" />
                                                    {job.customer?.addresses?.[0]?.TP1 || job.customer?.addresses?.[0]?.TP2 || job.customer_phone || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Email Address')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium">
                                                    {job.customer?.addresses?.[0]?.Email || job.customer_email || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Address')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium">
                                                    {job.customer?.addresses?.[0]?.Address || job.customer_address || '-'}
                                                </p>
                                            </div>
                                            {job.AccKy && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                                        {t('Customer Code')}
                                                    </label>
                                                    <p className="text-sm text-gray-900 font-medium">{job.AccKy}</p>
                                                </div>
                                            )}
                                            {job.invoice_number && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                                        {t('Invoice Number')}
                                                    </label>
                                                    <p className="text-sm text-gray-900 font-medium">{job.invoice_number}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Device Information Card */}
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Smartphone className="mr-2 h-4 w-4 text-white" />
                                                <h3 className="text-base font-semibold text-white">
                                                    {t('Device Information')}
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => window.open(`/service-jobs/${job.id}/receipt`, '_blank')}
                                                className="text-white hover:text-white/80 text-xs font-medium flex items-center transition-colors"
                                            >
                                                <Receipt className="mr-1 h-3 w-3" />
                                                {t('Print Job Receipt')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Device Name')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium">{(job.device_brand || '-') + ' ' + (job.device_model || job.device_name || '-')}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Device Model')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium">{job.device_model || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Brand')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium">{job.device_brand || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Serial Number')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium">{job.device_serial || '-'}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-gray-500 mb-2">
                                                {t('Problem Description')}
                                            </label>
                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                                <p className="text-sm text-gray-900 whitespace-pre-line">{job.problem_description}</p>
                                            </div>
                                        </div>
                                        
                                    </div>
                                </div>

                                {/* Parts & Charges Card */}
                                {/* <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Package className="mr-2 h-4 w-4 text-white" />
                                                <h3 className="text-base font-semibold text-white">
                                                    {t('Parts & Service Charges')}
                                                </h3>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(`/service-jobs/${job.id}/invoice`, '_blank')}
                                                    className="inline-flex items-center text-white hover:text-white/80 text-xs font-medium"
                                                >
                                                    <FileText className="mr-1 h-3 w-3" />
                                                    {t('Generate Bill')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setAddingItem(true)}
                                                    className="inline-flex items-center text-white hover:text-white/80 text-xs font-medium"
                                                >
                                                    <Plus className="mr-1 h-3 w-3" />
                                                    {t('Add Item')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4">
                                        {addingItem && (
                                            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                <h4 className="font-medium text-sm text-gray-700 mb-3">{t('Add New Item')}</h4>
                                                <form onSubmit={handleAddItem} className="space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                {t('Item Type')}
                                                            </label>
                                                            <select
                                                                value={newItem.item_type}
                                                                onChange={e => {
                                                                    const newType = e.target.value as any;
                                                                    setNewItem({...newItem, item_type: newType});
                                                                    // Reset search states when changing type
                                                                    if (newType !== 'part') {
                                                                        setItemSearchQuery('');
                                                                        setItemSearchResults([]);
                                                                        setShowItemSearch(false);
                                                                        setIsSearching(false);
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition text-sm"
                                                            >
                                                                <option value="part">{t('Part')}</option>
                                                                <option value="service_charge">{t('Service Charge')}</option>
                                                                <option value="other">{t('Other')}</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('Item Name')} *
                                                            </label>
                                                            <div 
                                                                ref={itemSearchRef}
                                                                className="relative"
                                                            >
                                                                <input
                                                                    type="text"
                                                                    value={itemSearchQuery || newItem.item_name}
                                                                    onChange={handleItemSearchChange}
                                                                    onFocus={() => {
                                                                        if (newItem.item_type === 'part') {
                                                                            setShowItemSearch(true);
                                                                        }
                                                                    }}
                                                                    placeholder={
                                                                        newItem.item_type === 'part' 
                                                                            ? t("Search item by name, code or barcode...") 
                                                                            : newItem.item_type === 'service_charge' 
                                                                            ? t("Service charge name") 
                                                                            : t("Enter item name")
                                                                    }
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                                    required
                                                                />
                                                                {isSearching && (
                                                                    <div className="absolute right-3 top-2">
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vismass-blue"></div>
                                                                    </div>
                                                                )}
                                                                {(showItemSearch || isSearching) && newItem.item_type === 'part' && (
                                                                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                                        {isSearching ? (
                                                                            <div className="px-4 py-3 text-center text-gray-500">
                                                                                <div className="flex items-center justify-center">
                                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vismass-blue mr-2"></div>
                                                                                    {t('Searching items...')}
                                                                                </div>
                                                                            </div>
                                                                        ) : itemSearchResults.length > 0 ? (
                                                                            itemSearchResults.map((result, idx) => (
                                                                                <div
                                                                                    key={`${result.source}-${result.ItmKy || result.purchase_det_ky || idx}`}
                                                                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-gray-100"
                                                                                    onClick={() => selectItem(result)}
                                                                                >
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="font-medium text-gray-900">
                                                                                            {result.ItmNm || result.ItemCode}
                                                                                        </div>
                                                                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                                                                            result.source === 'itemmaster' 
                                                                                                ? 'bg-blue-100 text-blue-700' 
                                                                                                : 'bg-purple-100 text-purple-700'
                                                                                        }`}>
                                                                                            {result.source === 'itemmaster' ? t('Stock') : t('Purchase')}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2">
                                                                                        <span>
                                                                                            {result.source === 'itemmaster' ? t('Code') : t('S/N')}: {result.ItemCode}
                                                                                        </span>
                                                                                        {result.BarCode && (
                                                                                            <span>
                                                                                                {t('Barcode')}: {result.BarCode}
                                                                                            </span>
                                                                                        )}
                                                                                        {result.brand && (
                                                                                            <span>
                                                                                                {t('Brand')}: {result.brand}
                                                                                            </span>
                                                                                        )}
                                                                                        {result.model && (
                                                                                            <span>
                                                                                                {t('Model')}: {result.model}
                                                                                            </span>
                                                                                        )}
                                                                                        <span className="text-vismass-blue font-semibold">
                                                                                            {t('Price')}: {t('LKR')} {
                                                                                                typeof result.SlsPri === 'string' 
                                                                                                    ? parseFloat(result.SlsPri).toFixed(2) 
                                                                                                    : result.SlsPri.toFixed(2)
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <div className="px-4 py-3 text-center text-gray-500">
                                                                                {t('No items found')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('Quantity')}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={newItem.quantity}
                                                                onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                                                                step="0.0001"
                                                                min="0.0001"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('Unit Price')} (Rs)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={newItem.unit_price}
                                                                onChange={e => setNewItem({...newItem, unit_price: parseFloat(e.target.value)})}
                                                                step="0.01"
                                                                min="0"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            {t('Description')}
                                                        </label>
                                                        <textarea
                                                            value={newItem.description}
                                                            onChange={e => setNewItem({...newItem, description: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div className="flex justify-end space-x-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setAddingItem(false)}
                                                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                                                        >
                                                            {t('Cancel')}
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-4 py-2 bg-gradient-to-r from-vismass-blue to-vismass-grey text-white rounded-xl hover:shadow-lg transition-all duration-200"
                                                        >
                                                            {t('Add Item')}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                        
                                        {(job.items || []).length > 0 ? (
                                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                                <table className="min-w-full divide-y divide-slate-200">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-900 uppercase">
                                                                {t('Type')}
                                                            </th>
                                                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-900 uppercase">
                                                                {t('Item Name')}
                                                            </th>
                                                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-900 uppercase">
                                                                {t('Qty')}
                                                            </th>
                                                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-900 uppercase">
                                                                {t('Unit Price')}
                                                            </th>
                                                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-900 uppercase">
                                                                {t('Total')}
                                                            </th>
                                                            <th className="px-2 py-1.5 text-left text-xs font-semibold text-slate-900 uppercase">
                                                                {t('Actions')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-slate-200">
                                                        {(job.items || []).map((item) => (
                                                            <tr key={item.id} className="hover:bg-slate-50">
                                                                <td className="px-2 py-1.5">
                                                                    <span className={`px-1.5 py-0.5 text-xs rounded ${item.item_type === 'part' ? 'bg-vismass-blue/10 text-vismass-blue font-medium' : 'bg-vismass-grey/10 text-vismass-grey font-medium'}`}>
                                                                        {item.item_type === 'part' ? t('Part') : t('Service')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-1.5">
                                                                    <div className="text-xs font-medium text-gray-900">{item.item_name}</div>
                                                                    {item.description && (
                                                                        <div className="text-gray-500 text-xs mt-0.5">{item.description}</div>
                                                                    )}
                                                                </td>
                                                                <td className="px-2 py-1.5 text-xs">{item.quantity}</td>
                                                                <td className="px-2 py-1.5 text-xs">{formatCurrency(item.unit_price)}</td>
                                                                <td className="px-2 py-1.5 text-xs font-medium">
                                                                    {formatCurrency(item.quantity * item.unit_price)}
                                                                </td>
                                                                <td className="px-2 py-1.5">
                                                                    <button
                                                                        onClick={() => router.delete(`/service-jobs/${job.id}/items/${item.id}`)}
                                                                        className="text-red-600 hover:text-red-800 flex items-center text-xs"
                                                                    >
                                                                        <X className="mr-1 h-3 w-3" />
                                                                        {t('Remove')}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-slate-50">
                                                        <tr>
                                                            <td colSpan={4} className="px-2 py-1.5 text-right text-xs font-medium text-slate-900">
                                                                {t('Total')}:
                                                            </td>
                                                            <td className="px-2 py-1.5 text-xs font-bold text-vismass-blue">
                                                                {formatCurrency(totals.netTotal)}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                                <p className="text-gray-500">{t('No items added yet.')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div> */}
                            </div>

                            {/* Right Column - Status, Payment, Timeline */}
                            <div className="space-y-6">
                                {/* Status Update Card */}
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-2.5">
                                        <div className="flex items-center">
                                            <Clock className="mr-2 h-4 w-4 text-white" />
                                            <h3 className="text-base font-semibold text-white">
                                                {t('Update Status')}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <form onSubmit={handleStatusUpdate} className="space-y-3">
                                            {/* <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    {t('Assign Technician')}
                                                </label>
                                                <select
                                                    value={statusData.assigned_technician_id}
                                                    onChange={e => setStatusData('assigned_technician_id', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition text-sm"
                                                >
                                                    <option value="">{t('Select Technician')}</option>
                                                    {technicians.map(tech => (
                                                        <option key={tech.id} value={tech.id}>
                                                            {tech.first_name} {tech.last_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div> */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    {t('Status')}
                                                </label>
                                                <select
                                                    value={statusData.status}
                                                    onChange={e => setStatusData('status', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition text-sm"
                                                >
                                                    <option value="pending">{t('Pending')}</option>
                                                    <option value="quotation_received">{t('Quotation Generated')}</option>
                                                    <option value="quotation_approved">{t('Quotation Approved')}</option>
                                                    <option value="assigned">{t('Assigned')}</option>
                                                    <option value="in_progress">{t('In Progress')}</option>
                                                    <option value="waiting_for_parts">{t('Waiting for Parts')}</option>
                                                    <option value="completed">{t('Completed')}</option>
                                                    <option value="delivered">{t('Delivered')}</option>
                                                    <option value="cancelled">{t('Cancelled')}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    {t('Technician Notes')}
                                                </label>
                                                <textarea
                                                    value={statusData.notes}
                                                    onChange={e => setStatusData('notes', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition text-sm"
                                                    rows={3}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={statusData.status === job.status && statusData.assigned_technician_id == job.assigned_technician_id}
                                                className={`w-full px-3 py-2 rounded-xl transition font-medium text-sm ${
                                                    statusData.status === job.status && statusData.assigned_technician_id == job.assigned_technician_id
                                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-vismass-blue to-vismass-grey text-white hover:shadow-lg'
                                                }`}
                                            >
                                                <Save className="inline mr-2 h-3 w-3" />
                                                {statusData.status === job.status && statusData.assigned_technician_id == job.assigned_technician_id
                                                    ? t('No Changes')
                                                    : t('Update Status')
                                                }
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Payment Summary Card */}
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <CreditCard className="mr-2 h-4 w-4 text-white" />
                                                <h3 className="text-base font-semibold text-white">
                                                    {t('Payment Summary')}
                                                </h3>
                                            </div>
                                            {!addingPayment && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAddingPayment(true)}
                                                    className="text-white hover:text-white/80 text-xs font-medium transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="space-y-1.5 mb-3 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">{t('Parts Total')}:</span>
                                                <span className="font-medium text-gray-900">{formatCurrency(totals.partsTotal)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">{t('Service Charges')}:</span>
                                                <span className="font-medium text-gray-900">{formatCurrency(totals.serviceTotal)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-600">{t('Advanced Payment')}:</span>
                                                    <button
                                                        onClick={() => setShowAdvancedPayment(!showAdvancedPayment)}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
                                                        title={showAdvancedPayment ? t('Hide Advanced Payment') : t('Show Advanced Payment')}
                                                    >
                                                        {showAdvancedPayment ? (
                                                            <ChevronUp className="h-3 w-3" />
                                                        ) : (
                                                            <ChevronDown className="h-3 w-3" />
                                                        )}
                                                    </button>
                                                </div>
                                                {showAdvancedPayment && (
                                                    <span className="font-medium text-red-600 text-xs">{formatCurrency(-parseFloat(job.advanced_payment?.toString() || '0'))}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center border-t border-slate-100 pt-1.5">
                                                <span className="text-gray-800 font-semibold text-xs">{t('Grand Total')}:</span>
                                                <span className="font-bold text-vismass-blue text-xs">{formatCurrency(totals.netTotal)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-600">{t('Paid Amount')}:</span>
                                                <span className="font-medium text-emerald-600">{formatCurrency(job.paid_amount)}</span>
                                            </div>
                                            {showAdvancedPayment && (
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-600">{t('Total Paid (Including Advance)')}:</span>
                                                    <span className="font-medium text-emerald-600">{formatCurrency((parseFloat(job.advanced_payment?.toString() || '0')) + (parseFloat(job.paid_amount?.toString() || '0')))}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center border-t-2 border-slate-200 pt-1.5 bg-slate-50 -mx-4 px-4 py-2 rounded-b-xl">
                                                <span className="text-gray-800 font-bold text-xs">{t('Outstanding Balance')}:</span>
                                                <span className={`font-bold text-sm ${totals.netTotal - parseFloat(job.paid_amount?.toString() || '0') > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {formatCurrency(totals.netTotal - parseFloat(job.paid_amount?.toString() || '0'))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Payment History */}
                                        {job.payments && job.payments.length > 0 && (
                                            <div className="mt-3">
                                                <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                                    <Receipt className="mr-1 h-3 w-3" />
                                                    {t('Payment History')}
                                                </h4>
                                                <div className="space-y-1.5">
                                                    {job.payments.map((payment: CustomerPayment) => (
                                                        <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs font-medium text-gray-900">
                                                                        {formatCurrency(payment.amount)}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        ({payment.method})
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    {formatDate(payment.date)}
                                                                    {payment.notes && (
                                                                        <span className="ml-2 italic">"{payment.notes}"</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                #{payment.id}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {addingPayment && (
                                            <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <h4 className="font-medium text-emerald-900 mb-2">{t('Record Payment')}</h4>
                                                <form onSubmit={handleAddPayment} className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-emerald-800 mb-1">
                                                            {t('Payment Amount')} (Rs)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={paymentAmount}
                                                            onChange={e => setPaymentAmount(e.target.value)}
                                                            step="0.01"
                                                            min="0.01"
                                                            max={totals.netTotal - parseFloat(job.paid_amount?.toString() || '0')}
                                                            className="w-full px-3 py-2 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-vismass-blue focus:border-vismass-blue transition"
                                                            placeholder={t('Enter payment amount')}
                                                        />
                                                        <p className="text-xs text-emerald-600 mt-1">
                                                            {t('Maximum amount')}: {formatCurrency(totals.netTotal - parseFloat(job.paid_amount?.toString() || '0'))}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAddingPayment(false);
                                                                setPaymentAmount('');
                                                            }}
                                                            className="px-3 py-2 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100/50 transition"
                                                        >
                                                            {t('Cancel')}
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > (totals.netTotal - parseFloat(job.paid_amount?.toString() || '0'))}
                                                            className="px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                                        >
                                                            {t('Record Payment')}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status History Card */}
                                {/* <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                        <div className="flex items-center">
                                            <History className="mr-2 h-4 w-4 text-white" />
                                            <h3 className="text-lg font-semibold text-white">
                                                {t('Status History')}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="space-y-3">
                                            {(job.statusHistory || []).map((history, index) => (
                                                <div key={index} className="border-l-2 border-vismass-blue/30 pl-2 pb-3 last:pb-0">
                                                    <div className="flex justify-between items-start">
                                                        <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${getStatusColor(history.status)}`}>
                                                            {t(history.status.replace('_', ' '))}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(history.created_at)}
                                                        </span>
                                                    </div>
                                                    {history.notes && (
                                                        <p className="text-xs text-gray-600 mt-1 italic">"{history.notes}"</p>
                                                    )}
                                                    {history.changedBy && (
                                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center">
                                                            <User className="h-2.5 w-2.5 mr-1" />
                                                            {t('By')}: {history.changedBy.first_name} {history.changedBy.last_name}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div> */}

                                {/* Dates Information Card */}
                                <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-2.5">
                                        <div className="flex items-center">
                                            <Calendar className="mr-2 h-3 w-3 text-white" />
                                            <h3 className="text-base font-semibold text-white">
                                                {t('Dates')}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    {t('Received Date')}
                                                </label>
                                                <p className="text-sm text-gray-900 font-medium">{formatDate(job.received_date)}</p>
                                            </div>
                                            {job.estimated_completion_date && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                                        {t('Estimated Completion')}
                                                    </label>
                                                    <p className="text-sm text-gray-900 font-medium">{formatDate(job.estimated_completion_date)}</p>
                                                </div>
                                            )}
                                            {job.actual_completion_date && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                                        {t('Actual Completion')}
                                                    </label>
                                                    <p className="text-sm text-vismass-blue font-bold">{formatDate(job.actual_completion_date)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-12 border-t border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 text-slate-400">
                            <p className="text-xs font-medium">VISMASS Sri Lanka - Yakkala • {t('Service Management')}</p>
                            <p className="text-xs">v1.0.1 • {t('Professional Service Solution')}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
};

export default Show;