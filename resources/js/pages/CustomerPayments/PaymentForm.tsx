import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    User,
    DollarSign,
    Calendar,
    FileText,
    Building2,
    Wallet,
    Info,
    CheckCircle2,
    Save,
    Wrench,
    AlertCircle,
    Receipt,
    X
} from 'lucide-react';

interface Props {
    customers?: { AdrKy: number; FstNm: string; LstNm: string; AdrCd: string; AccKy: number }[];
    customer?: { AccKy?: number; AccCd?: string; AccNm?: string } | null;
    onSuccess?: () => void;
}

interface ServiceJob {
    id: number;
    job_number: string;
    device_model: string;
    device_brand: string;
    device_serial?: string;
    // backend totals
    total_parts_cost?: number | string;
    total_service_charge?: number | string;
    total_amount?: number | string;
    // backend payments
    advanced_payment?: number | string;
    paid_amount?: number | string;
    balance_amount: number;
    items?: Array<{
        item_type: 'part' | 'service_charge';
        item_name: string;
        quantity: number;
        unit_price: number;
    }>;
}

type Method = 'cash' | 'cheque' | 'card' | 'credit' | 'bank';

type Totals = {
    partsTotal: number;
    serviceTotal: number;
    subtotal: number;
    advancedPayment: number;
    paidAmount: number;
    netTotal: number;
    balance: number;
};

export default function CustomerPaymentForm({ customers, customer, onSuccess }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        AccKy: customer?.AccKy?.toString() || '',
        customer_code: customer?.AccCd || '',
        customer_name: customer?.AccNm || '',
        amount: '',
        service_job_id: '',
        sales_transaction_id: '',
        method: 'cash' as Method,
        TrnDt: new Date().toISOString().split('T')[0],
        ChqueNo: '',
        BankNm: '',
        ChqueBranch: '',
        BankBranch: '',
        ChqueDt: new Date().toISOString().split('T')[0],
        CardLast4: '',
        CardAuthCode: '',
        Reference: '',
        notes: '',
    });

    const [pendingServiceJobs, setPendingServiceJobs] = useState<ServiceJob[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [selectedJob, setSelectedJob] = useState<ServiceJob | null>(null);

    const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

    const [accountBalance, setAccountBalance] = useState<number>(0);

    // Fetch jobs and invoices on mount if AccKy is pre-filled from customer prop
    useEffect(() => {
        if (data.AccKy) {
            fetchPendingServiceJobs(data.AccKy);
            fetchPendingInvoices(data.AccKy);
        }
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Enhanced validation for precision
        if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
            alert('Please enter a valid positive amount greater than zero.');
            return;
        }

        if (!data.AccKy) {
            alert('Please select a customer.');
            return;
        }

        // Confirmation dialog for precision
        const confirmMessage = `Confirm payment of Rs ${Number(data.amount).toFixed(2)} for customer ${data.customer_name}?`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        post('/admin/customer-payments', {
            onSuccess: (page: any) => {
                // Small delay to ensure database transaction is complete, then refresh lists
                setTimeout(() => {
                    if (data.AccKy) {
                        fetchPendingServiceJobs(data.AccKy);
                        fetchPendingInvoices(data.AccKy);
                    }
                }, 500);

                // Open Payment Receipt
                const paymentId = page.props.flash?.payment_id;
                if (paymentId) {
                    window.open(`/admin/customer-payments/${paymentId}/receipt`, '_blank');
                }

                // Auto-generate bill if job was selected (Legacy/Backup)
                if (selectedJob && !paymentId) {
                    const params = new URLSearchParams({
                        payment_method: data.method,
                        amount: data.amount,
                        ...(data.method === 'cheque' && { cheque_no: data.ChqueNo }),
                        ...(data.method === 'bank' && { reference: data.Reference }),
                    });
                    window.open(`/service-jobs/${selectedJob.id}/invoice?${params.toString()}`, '_blank');
                }

                alert('Payment successful!');

                setSelectedJob(null);
                setSelectedInvoice(null);
                reset('amount', 'ChqueNo', 'BankNm', 'ChqueBranch', 'ChqueDt', 'BankBranch', 'CardLast4', 'CardAuthCode', 'Reference', 'notes', 'service_job_id', 'sales_transaction_id');
                onSuccess && onSuccess();
            },
            onError: (errors) => {
                alert('Payment failed! Please try again.');
                console.error('Payment error:', errors);
            },
        });
    };

    const fetchPendingServiceJobs = async (customerId: string | number) => {
        if (!customerId || customerId === '') {
            setPendingServiceJobs([]);
            return;
        }

        setLoadingJobs(true);
        try {
            const response = await fetch(`/admin/customer-payments/pending-service-jobs?customer_id=${encodeURIComponent(customerId.toString())}`);
            if (response.ok) {
                const data = await response.json();
                setPendingServiceJobs(data.jobs || []);
                setAccountBalance(data.account_balance || 0);
            } else {
                console.error('Failed to fetch pending service jobs:', response.status);
                setPendingServiceJobs([]);
                setAccountBalance(0);
            }
        } catch (error) {
            console.error('Error fetching pending service jobs:', error);
            setPendingServiceJobs([]);
            setAccountBalance(0);
        } finally {
            setLoadingJobs(false);
        }
    };

    const fetchPendingInvoices = async (customerId: string | number) => {
        if (!customerId || customerId === '') {
            setPendingInvoices([]);
            return;
        }

        setLoadingInvoices(true);
        try {
            const response = await fetch(`/admin/customer-payments/pending-invoices?customer_id=${encodeURIComponent(customerId.toString())}`);
            if (response.ok) {
                const invoices = await response.json();
                setPendingInvoices(invoices);
            } else {
                console.error('Failed to fetch pending invoices:', response.status);
                setPendingInvoices([]);
            }
        } catch (error) {
            console.error('Error fetching pending invoices:', error);
            setPendingInvoices([]);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const formatCurrency = (amount: number): string => {
        return `Rs ${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const computeJobTotals = (job: ServiceJob): Totals => {
        // Prefer backend pre-calculated totals for consistency, fallback to manual sum
        const partsTotal = job.total_parts_cost != null ? parseFloat(job.total_parts_cost.toString()) : 0;
        const serviceTotal = job.total_service_charge != null ? parseFloat(job.total_service_charge.toString()) : 0;
        const subtotal = job.total_amount != null ? parseFloat(job.total_amount.toString()) : (partsTotal + serviceTotal);

        const advancedPayment = job.advanced_payment ? parseFloat(job.advanced_payment.toString()) : 0;
        const paidAmount = job.paid_amount ? parseFloat(job.paid_amount.toString()) : 0;
        const netTotal = subtotal - advancedPayment;
        // Use balance_amount from backend
        const balance = job.balance_amount != null ? parseFloat(job.balance_amount.toString()) : 0;

        return { partsTotal, serviceTotal, subtotal, advancedPayment, paidAmount, netTotal, balance };
    };

    // Auto-update amount when a job is selected (if user wants this behavior, but let's keep it safe or provided via button)
    // Re-interpreting: "customer wa select karahama eyage payment details enna oona service job eke payment summary walin"
    // Maybe show the total outstanding for ALL jobs?
    const aggregateTotals: Totals = pendingServiceJobs.reduce((acc, job) => {
        const t = computeJobTotals(job);
        return {
            partsTotal: acc.partsTotal + t.partsTotal,
            serviceTotal: acc.serviceTotal + t.serviceTotal,
            subtotal: acc.subtotal + t.subtotal,
            advancedPayment: acc.advancedPayment + t.advancedPayment,
            paidAmount: acc.paidAmount + t.paidAmount,
            netTotal: acc.netTotal + t.netTotal,
            balance: acc.balance + t.balance,
        };
    }, { partsTotal: 0, serviceTotal: 0, subtotal: 0, advancedPayment: 0, paidAmount: 0, netTotal: 0, balance: 0 });

    // Add invoice balances to aggregate
    const invoiceBalance = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount || 0), 0);
    aggregateTotals.balance += invoiceBalance;

    const selectedTotals: Totals | null = selectedJob ? computeJobTotals(selectedJob) : null;
    const totalsForDisplay: Totals = selectedJob ? selectedTotals! : (selectedInvoice ? { ...aggregateTotals, balance: parseFloat(selectedInvoice.balance_amount) } : { ...aggregateTotals, balance: aggregateTotals.balance > 0 ? aggregateTotals.balance : accountBalance });

    return (
        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">

            {/* -------------------- LEFT COLUMN: CONTEXT (Span 5) -------------------- */}
            <div className="lg:col-span-5 space-y-6 flex flex-col h-full">

                {/* Customer Selection Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
                        <div className="bg-indigo-100 p-1.5 rounded-lg">
                            <User className="h-4 w-4 text-indigo-700" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Customer Details</h3>
                    </div>

                    <div className="p-5 space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Select Customer</label>
                            {customers ? (
                                <div className="relative">
                                    <select
                                        value={data.AccKy}
                                        onChange={(e) => {
                                            const selected = customers.find(c => c.AdrKy.toString() === e.target.value);
                                            setData(d => ({
                                                ...d,
                                                AccKy: e.target.value,
                                                customer_name: selected ? `${selected.FstNm} ${selected.LstNm}` : '',
                                                customer_code: selected?.AdrCd || ''
                                            }));
                                            setSelectedJob(null);
                                            setSelectedInvoice(null);
                                            fetchPendingServiceJobs(e.target.value);
                                            fetchPendingInvoices(e.target.value);
                                        }}
                                        className="w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all cursor-pointer hover:border-indigo-300"
                                    >
                                        <option value="">-- Choose a Customer --</option>
                                        {customers.map((c) => (
                                            <option key={c.AdrKy} value={c.AdrKy}>
                                                {c.AdrCd} - {c.FstNm} {c.LstNm}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <Input value={data.customer_name} readOnly className="bg-gray-50 border-gray-200" />
                            )}
                            {errors.AccKy && <div className="text-red-500 text-xs mt-1 animate-pulse">{errors.AccKy}</div>}
                        </div>

                        {/* Total Outstanding Card - Highlighted with Breakdown */}
                        {data.AccKy && (
                            <div className={`p-4 rounded-xl border transition-all duration-300 ${totalsForDisplay.balance > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-wider ${totalsForDisplay.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {selectedJob ? `Payment Summary: ${selectedJob.job_number}` : 'Aggregate Payment Summary'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            {selectedJob ? 'Details for the selected service job' : `Customer's total for ${pendingServiceJobs.length} pending jobs`}
                                        </p>
                                    </div>
                                    <AlertCircle className={`h-5 w-5 ${totalsForDisplay.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Parts Total:</span>
                                        <span className="font-bold text-slate-700">{formatCurrency(totalsForDisplay.partsTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Service Charges:</span>
                                        <span className="font-bold text-slate-700">{formatCurrency(totalsForDisplay.serviceTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-slate-500 font-medium whitespace-nowrap">Advanced Payment:</span>
                                        <span className="font-bold text-rose-600">{formatCurrency(-totalsForDisplay.advancedPayment)}</span>
                                    </div>

                                    <div className="border-t border-slate-200/50 pt-2 flex justify-between text-xs">
                                        <span className="text-slate-700 font-bold">Grand Total:</span>
                                        <span className="font-extrabold text-indigo-700">{formatCurrency(totalsForDisplay.netTotal)}</span>
                                    </div>

                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Paid Amount:</span>
                                        <span className="font-bold text-emerald-600">{formatCurrency(totalsForDisplay.paidAmount)}</span>
                                    </div>

                                    <div className="flex justify-between text-xs border-b border-slate-200/50 pb-2">
                                        <span className="text-slate-500 font-medium">Total Paid (incl. Advance):</span>
                                        <span className="font-bold text-emerald-600 font-mono italic">{formatCurrency(totalsForDisplay.advancedPayment + totalsForDisplay.paidAmount)}</span>
                                    </div>

                                    <div className="flex justify-between items-end pt-1">
                                        <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Outstanding Balance:</span>
                                        <div className="text-right">
                                            <div className={`text-2xl font-black tracking-tight ${totalsForDisplay.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                {loadingJobs ? (
                                                    <span className="text-sm text-slate-400 animate-pulse font-normal">Calculating...</span>
                                                ) : (
                                                    formatCurrency(totalsForDisplay.balance)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {pendingServiceJobs.length > 0 && !selectedJob && (
                                    <button
                                        onClick={() => {
                                            pendingServiceJobs.forEach(job => {
                                                window.open(`/service-jobs/${job.id}/invoice`, '_blank');
                                            });
                                        }}
                                        className="mt-4 w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-all duration-200 shadow-sm border border-indigo-200 uppercase tracking-widest"
                                        title="Print All Bills"
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Print All Bills
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending Jobs List Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col max-h-[500px] overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 text-sm flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                            Pending Jobs
                        </h3>
                        {loadingJobs && <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
                        {!data.AccKy ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <User className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm">Select a customer above.</p>
                            </div>
                        ) : pendingServiceJobs.length === 0 && !loadingJobs ? (
                            <div className="flex flex-col items-center justify-center h-48 text-emerald-600 p-4 text-center">
                                <div className="bg-emerald-100 p-3 rounded-full mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                </div>
                                <p className="text-sm font-medium text-slate-700">All caught up!</p>
                                <p className="text-xs text-slate-500 mt-1">No pending payments for this customer.</p>
                            </div>
                        ) : (
                            pendingServiceJobs.map(j => {
                                const totals = computeJobTotals(j as ServiceJob);
                                const isSelected = selectedJob?.id === j.id;
                                return (
                                    <div
                                        key={j.id}
                                        onClick={() => {
                                            setSelectedJob(j as ServiceJob);
                                            setData(d => ({
                                                ...d,
                                                service_job_id: (j as any).id.toString(),
                                                amount: totals.balance > 0 ? Number(totals.balance).toFixed(2) : ''
                                            }));
                                        }}
                                        className={`group p-3 rounded-lg border cursor-pointer transition-all duration-200 relative overflow-hidden ${isSelected
                                            ? 'border-indigo-500 bg-white shadow-md ring-1 ring-indigo-500 transform scale-[1.02]'
                                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                                            }`}
                                    >
                                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                                        <div className="flex items-center justify-between pl-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800">{j.job_number}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">{j.device_model || j.device_brand}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-rose-600">{formatCurrency(totals.balance)}</div>
                                                <div className="text-[10px] text-slate-400">Due Amount</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {pendingServiceJobs.length > 0 && (
                        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-center">
                            <Info className="h-3 w-3 mr-1" /> Tap a job to quick-fill
                        </div>
                    )}
                </div>

                {/* Pending Invoices List Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col max-h-[500px] overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 text-sm flex items-center">
                            <Receipt className="h-4 w-4 mr-2 text-blue-600" />
                            Pending Invoices (Credit)
                        </h3>
                        {loadingInvoices && <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
                        {!data.AccKy ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <User className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm">Select a customer above.</p>
                            </div>
                        ) : pendingInvoices.length === 0 && !loadingInvoices ? (
                            <div className="flex flex-col items-center justify-center h-48 text-emerald-600 p-4 text-center">
                                <div className="bg-emerald-100 p-3 rounded-full mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                </div>
                                <p className="text-sm font-medium text-slate-700">No pending invoices!</p>
                            </div>
                        ) : (
                            pendingInvoices.map(inv => {
                                const isSelected = selectedInvoice?.id === inv.id;
                                return (
                                    <div
                                        key={inv.id}
                                        onClick={() => {
                                            setSelectedInvoice(inv);
                                            setSelectedJob(null);
                                            setData(d => ({
                                                ...d,
                                                sales_transaction_id: inv.id.toString(),
                                                service_job_id: '',
                                                amount: inv.balance_amount > 0 ? Number(inv.balance_amount).toFixed(2) : ''
                                            }));
                                        }}
                                        className={`group p-3 rounded-lg border cursor-pointer transition-all duration-200 relative overflow-hidden ${isSelected
                                            ? 'border-blue-500 bg-white shadow-md ring-1 ring-blue-500 transform scale-[1.02]'
                                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                            }`}
                                    >
                                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                        <div className="flex items-center justify-between pl-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800">{inv.invoice_no}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">{new Date(inv.transaction_date).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-rose-600">{formatCurrency(parseFloat(inv.balance_amount))}</div>
                                                <div className="text-[10px] text-slate-400">Due Amount</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {pendingInvoices.length > 0 && (
                        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-center">
                            <Info className="h-3 w-3 mr-1" /> Tap an invoice to quick-fill
                        </div>
                    )}
                </div>
            </div>

            {/* -------------------- RIGHT COLUMN: PAYMENT ACTIONS (Span 7) -------------------- */}
            <div className="lg:col-span-7 space-y-6">

                {/* Main Payment Form Card */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                    <div className="p-6 pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                <Wallet className="mr-2 h-6 w-6 text-indigo-600" />
                                Record Payment
                            </h2>
                        </div>
                        <p className="text-slate-500 text-sm">Fill in the details below to complete the transaction.</p>
                    </div>

                    <div className="px-6 py-4 space-y-6">

                        {/* Selected Context Header */}
                        <div className={`transition-all duration-300 overflow-hidden ${(selectedJob || selectedInvoice) ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0'}`}>
                            {selectedJob && selectedTotals && (
                                <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm relative group">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedJob(null); setData(d => ({ ...d, service_job_id: '' })); }}
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Deselect Job"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="flex items-start space-x-4">
                                        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-indigo-100">
                                            <Wrench className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Applying Payment To</div>
                                            <h4 className="font-bold text-indigo-900 text-lg leading-none">{selectedJob.job_number}</h4>
                                            <p className="text-sm text-slate-600 mt-1">{selectedJob.device_model || selectedJob.device_brand}</p>
                                        </div>
                                    </div>
                                    <div className="text-right pr-6 md:pr-10 border-l border-indigo-100 pl-6 md:pl-10 flex flex-col items-end space-y-2">
                                        <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
                                        <p className="text-2xl font-bold text-indigo-700">{formatCurrency(selectedTotals.balance)}</p>
                                        <a
                                            href={`/service-jobs/${selectedJob.id}/invoice`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors duration-200 shadow-sm"
                                            title="Print Bill"
                                        >
                                            <FileText className="h-3 w-3 mr-1" />
                                            Print Bill
                                        </a>
                                    </div>
                                </div>
                            )}

                            {selectedInvoice && (
                                <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm relative group">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedInvoice(null); setData(d => ({ ...d, sales_transaction_id: '' })); }}
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Deselect Invoice"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="flex items-start space-x-4">
                                        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-blue-100">
                                            <Receipt className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Applying Payment To</div>
                                            <h4 className="font-bold text-blue-900 text-lg leading-none">Invoice: {selectedInvoice.invoice_no}</h4>
                                            <p className="text-sm text-slate-600 mt-1">Date: {new Date(selectedInvoice.transaction_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right pr-6 md:pr-10 border-l border-blue-100 pl-6 md:pl-10 flex flex-col items-end space-y-2">
                                        <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
                                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(parseFloat(selectedInvoice.balance_amount))}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Primary Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center">
                                    <DollarSign className="mr-2 h-4 w-4 text-emerald-600" />
                                    Payment Amount
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold group-focus-within:text-emerald-600">Rs.</span>
                                    <Input
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        placeholder="0.00"
                                        type="number"
                                        step="0.01"
                                        className="pl-10 h-11 text-lg font-semibold border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>
                                {errors.amount && <div className="text-red-500 text-xs mt-1">{errors.amount}</div>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center">
                                    <Calendar className="mr-2 h-4 w-4 text-indigo-600" />
                                    Transaction Date
                                </label>
                                <Input
                                    type="date"
                                    value={data.TrnDt}
                                    onChange={(e) => setData('TrnDt', e.target.value)}
                                    className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {errors.TrnDt && <div className="text-red-500 text-xs mt-1">{errors.TrnDt}</div>}
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-slate-100 my-2"></div>

                        {/* Payment Method */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700 mb-3 block uppercase tracking-wider">Payment Mode</label>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Custom visual radio buttons */}
                                {(['cash', 'cheque', 'bank'] as Method[]).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setData('method', m)}
                                        className={`relative group flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-300 ${data.method === m
                                            ? 'border-sky-600 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 scale-105'
                                            : 'border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700'
                                            }`}
                                    >
                                        {data.method === m && (
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-white/20 rounded-full p-1 backdrop-blur-sm">
                                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                                </div>
                                            </div>
                                        )}

                                        {m === 'cash' && <Wallet className={`h-8 w-8 mb-3 transition-transform duration-300 ${data.method === m ? 'text-white scale-110' : 'text-slate-400 group-hover:text-sky-600 group-hover:scale-110'}`} />}
                                        {m === 'cheque' && <FileText className={`h-8 w-8 mb-3 transition-transform duration-300 ${data.method === m ? 'text-white scale-110' : 'text-slate-400 group-hover:text-sky-600 group-hover:scale-110'}`} />}
                                        {m === 'bank' && <Building2 className={`h-8 w-8 mb-3 transition-transform duration-300 ${data.method === m ? 'text-white scale-110' : 'text-slate-400 group-hover:text-sky-600 group-hover:scale-110'}`} />}

                                        <span className={`text-sm font-bold capitalize tracking-wide ${data.method === m ? 'text-white' : 'text-slate-600 group-hover:text-sky-700'}`}>{m}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Fields Container */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 animate-in fade-in zoom-in-95 duration-200">

                            {data.method === 'cash' && (
                                <div className="text-center py-4 text-slate-500 flex flex-col items-center justify-center">
                                    <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                                        <Wallet className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <p className="text-sm">Cash payment selected.</p>
                                    <p className="text-xs mt-1">Ensure the physical cash is collected.</p>
                                </div>
                            )}

                            {data.method === 'cheque' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Cheque Number</label>
                                        <Input value={data.ChqueNo} onChange={e => setData('ChqueNo', e.target.value)} placeholder="xxxxxx" className="bg-white" />
                                        {errors.ChqueNo && <div className="text-red-500 text-xs">{errors.ChqueNo}</div>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Cheque Date</label>
                                        <Input type="date" value={data.ChqueDt} onChange={e => setData('ChqueDt', e.target.value)} className="bg-white" />
                                        {errors.ChqueDt && <div className="text-red-500 text-xs">{errors.ChqueDt}</div>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Bank Name</label>
                                        <Input value={data.BankNm} onChange={e => setData('BankNm', e.target.value)} placeholder="Bank" className="bg-white" />
                                        {errors.BankNm && <div className="text-red-500 text-xs">{errors.BankNm}</div>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Branch</label>
                                        <Input value={data.ChqueBranch} onChange={e => setData('ChqueBranch', e.target.value)} placeholder="Branch" className="bg-white" />
                                        {errors.ChqueBranch && <div className="text-red-500 text-xs">{errors.ChqueBranch}</div>}
                                    </div>
                                </div>
                            )}

                            {data.method === 'bank' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Bank Name</label>
                                        <Input value={data.BankNm} onChange={e => setData('BankNm', e.target.value)} placeholder="Bank" className="bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Branch</label>
                                        <Input value={data.BankBranch} onChange={e => setData('BankBranch', e.target.value)} placeholder="Branch" className="bg-white" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Reference / Transfer ID</label>
                                        <Input value={data.Reference} onChange={e => setData('Reference', e.target.value)} placeholder="Ref #" className="bg-white" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                <FileText className="mr-2 h-4 w-4 text-slate-400" />
                                Notes (Optional)
                            </label>
                            <Input
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Add any remarks about this payment..."
                                className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-3 backdrop-blur-sm">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { reset(); setSelectedJob(null); }}
                            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        >
                            Reset Form
                        </Button>
                        <Button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] h-11 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                            disabled={processing}
                        >
                            {processing ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Confirm Payment
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
