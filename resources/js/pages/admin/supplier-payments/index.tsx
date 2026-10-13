import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, CreditCard, DollarSign, Receipt, CheckCircle, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Supplier {
    AdrKy: number;
    AdrCd: string;
    FstNm: string;
    LstNm: string;
    TP1: string;
    Address: string;
}

interface PaymentData {
    supplier_id: number;
    payment_method: string;
    paid_amount: number;
    payment_date: string;
    notes?: string;
    cheque_no?: string;
    cheque_bank_name?: string;
    cheque_branch?: string;
    cheque_date?: string;
    cheque_account_no?: string;
    bank_name?: string;
    bank_reference_no?: string;
    bank_branch?: string;
    bank_deposit_date?: string;
    bank_account_no?: string;
    transfer_reference_no?: string;
    transfer_transaction_id?: string;
    transfer_bank_name?: string;
    transfer_branch?: string;
    transfer_date?: string;
}

export default function SupplierPaymentsIndex() {
    const { flash } = usePage().props as any;
    const [searchTerm, setSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [supplierBalance, setSupplierBalance] = useState(0);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<PaymentData>({
        supplier_id: 0,
        payment_method: '',
        paid_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
        cheque_no: '',
        cheque_bank_name: '',
        cheque_branch: '',
        cheque_date: '',
        cheque_account_no: '',
        bank_name: '',
        bank_reference_no: '',
        bank_branch: '',
        bank_deposit_date: '',
        bank_account_no: '',
        transfer_reference_no: '',
        transfer_transaction_id: '',
        transfer_bank_name: '',
        transfer_branch: '',
        transfer_date: '',
    });

    // Search suppliers with debounce
    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (searchTerm.length >= 2) {
            const timeout = setTimeout(() => {
                searchSuppliers(searchTerm);
            }, 300);
            setSearchTimeout(timeout);
        } else {
            setSuppliers([]);
        }

        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTerm]);

    const searchSuppliers = async (query: string) => {
        try {
            const response = await fetch(`/admin/supplier-payments/search-suppliers?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Error searching suppliers:', error);
        }
    };

    const selectSupplier = async (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setData('supplier_id', supplier.AdrKy);
        setSearchTerm(`${supplier.FstNm} ${supplier.LstNm}`);

        try {
            const response = await fetch(`/admin/supplier-details?supplier_id=${supplier.AdrKy}`);
            
            if (!response.ok) {
                console.error('Failed to fetch supplier details:', response.status, response.statusText);
                return;
            }
            
            const data = await response.json();
            console.log('Supplier details response:', data);
            console.log('Current balance:', data.current_balance);
            
            setSupplierBalance(data.current_balance || 0);
            setSuppliers([]);
        } catch (error) {
            console.error('Error fetching supplier details:', error);
        }
    };

    const handlePaymentMethodChange = (method: string) => {
        setData('payment_method', method);
        // Reset all payment-specific fields
        setData({
            ...data,
            payment_method: method,
            notes: '',
            cheque_no: '',
            cheque_bank_name: '',
            cheque_branch: '',
            cheque_date: '',
            cheque_account_no: '',
            bank_name: '',
            bank_reference_no: '',
            bank_branch: '',
            bank_deposit_date: '',
            bank_account_no: '',
            transfer_reference_no: '',
            transfer_transaction_id: '',
            transfer_bank_name: '',
            transfer_branch: '',
            transfer_date: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/admin/supplier-payments', {
            onSuccess: () => {
                reset();
                setShowPaymentForm(false);
                setSelectedSupplier(null);
                setSearchTerm('');
            },
        });
    };

    // Open receipt when payment is successful
    useEffect(() => {
        if (flash?.success && flash?.payment_id) {
            window.open(`/admin/supplier-payments/${flash.payment_id}/receipt`, '_blank');
        }
    }, [flash]);

    const resetForm = () => {
        setSelectedSupplier(null);
        setSupplierBalance(0);
        setRecentPayments([]);
        setShowPaymentForm(false);
        setSearchTerm('');
        reset();
    };

    return (
        <AppLayout>
            <Head title="Supplier Payments" />

            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-8 bg-gradient-to-r from-vismass-blue to-vismass-grey rounded-2xl p-6 shadow-lg">
                    <h1 className="text-xl font-bold text-white">Supplier Payment Management</h1>
                    <p className="text-xs text-white/80 mt-2">Record and manage supplier payments</p>
                </div>

                {/* Success Message */}
                {flash?.success && (
                    <Alert className="mb-6 bg-[#00aeef]/10 border-vismass-blue">
                        <CheckCircle className="h-4 w-4 text-vismass-blue" />
                        <AlertDescription className="text-vismass-blue">
                            {flash.success}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error Message */}
                {flash?.error && (
                    <Alert className="mb-6 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {flash.error}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Supplier Selection */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Search className="w-5 h-5 mr-2" />
                                    Select Supplier
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="supplier-search">Search Supplier</Label>
                                    <Input
                                        id="supplier-search"
                                        type="text"
                                        placeholder="Search by name, code, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Supplier search results */}
                                {suppliers.length > 0 && (
                                    <div className="border rounded-md max-h-48 overflow-y-auto">
                                        {suppliers.map((supplier) => (
                                            <div
                                                key={supplier.AdrKy}
                                                className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                                                onClick={() => selectSupplier(supplier)}
                                            >
                                                <div className="font-medium">{supplier.FstNm} {supplier.LstNm}</div>
                                                <div className="text-sm text-gray-600">{supplier.AdrCd}</div>
                                                <div className="text-sm text-gray-500">{supplier.TP1}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Selected supplier info */}
                                {selectedSupplier && (
                                    <div className="p-4 bg-gradient-to-br from-[#00aeef]/10 to-[#737578]/10 rounded-xl border-2 border-vismass-blue shadow-md">
                                        <h3 className="font-semibold text-vismass-blue text-lg">
                                            {selectedSupplier.FstNm} {selectedSupplier.LstNm}
                                        </h3>
                                        <p className="text-sm text-vismass-grey">Code: {selectedSupplier.AdrCd}</p>
                                        <p className="text-sm text-vismass-grey">Phone: {selectedSupplier.TP1}</p>
                                        <div className="mt-3 flex items-center justify-between bg-white rounded-lg p-2">
                                            <span className="text-sm font-medium text-vismass-grey">Outstanding Balance:</span>
                                            <Badge variant={supplierBalance < 0 ? "destructive" : "secondary"} className="text-sm font-bold">
                                                Rs. {Math.abs(supplierBalance).toFixed(2)}
                                            </Badge>
                                        </div>
                                    </div>
                                )}


                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    {selectedSupplier 
                                        ? `Record Payment for ${selectedSupplier.FstNm} ${selectedSupplier.LstNm}`
                                        : 'Record Payment'
                                    }
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!selectedSupplier && (
                                    <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                                        <div className="flex items-start space-x-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-amber-900">Supplier Required</h4>
                                                <p className="text-sm text-amber-700 mt-1">
                                                    Please select a supplier from the left panel before recording a payment.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Payment Method Selection */}
                                        <div>
                                            <Label className="text-base font-medium">Payment Method</Label>
                                            <div className="grid grid-cols-3 gap-4 mt-2">
                                                {[
                                                    { value: 'Cash', label: 'Cash', icon: DollarSign },
                                                    { value: 'Cheque', label: 'Cheque', icon: Receipt },
                                                    { value: 'Bank', label: 'Bank Deposit', icon: CreditCard },
                                                    { value: 'Online Transfer', label: 'Online Transfer', icon: CreditCard },
                                                ].map(({ value, label, icon: Icon }) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => handlePaymentMethodChange(value)}
                                                        className={`p-4 border-2 rounded-xl text-center transition-all shadow-md ${
                                                            data.payment_method === value
                                                                ? 'border-vismass-blue bg-gradient-to-br from-[#00aeef]/20 to-[#00aeef]/10 text-vismass-blue shadow-lg scale-105'
                                                                : 'border-gray-200 hover:border-vismass-blue/50 hover:shadow-lg'
                                                        }`}
                                                    >
                                                        <Icon className={`w-6 h-6 mx-auto mb-2 ${data.payment_method === value ? 'text-vismass-blue' : ''}`} />
                                                        <div className="text-sm font-medium">{label}</div>
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.payment_method && (
                                                <p className="text-red-500 text-sm mt-1">{errors.payment_method}</p>
                                            )}
                                        </div>

                                        {/* Common Fields */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="paid_amount" className="font-semibold text-vismass-grey">Amount (Rs.)</Label>
                                                <Input
                                                    id="paid_amount"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.paid_amount}
                                                    onChange={(e) => setData('paid_amount', parseFloat(e.target.value) || 0)}
                                                    className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                    required
                                                />
                                                {errors.paid_amount && <p className="text-red-500 text-sm mt-1">{errors.paid_amount}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="payment_date" className="font-semibold text-vismass-grey">Payment Date</Label>
                                                <Input
                                                    id="payment_date"
                                                    type="date"
                                                    value={data.payment_date}
                                                    onChange={(e) => setData('payment_date', e.target.value)}
                                                    className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                    required
                                                />
                                                {errors.payment_date && <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>}
                                            </div>
                                        </div>

                                        {/* Cash Payment Fields */}
                                        {data.payment_method === 'Cash' && (
                                            <div className="p-4 bg-gradient-to-br from-[#00aeef]/5 to-transparent rounded-xl border border-vismass-blue/30">
                                                <Label htmlFor="notes" className="font-semibold text-vismass-grey">Description (Optional)</Label>
                                                <Textarea
                                                    id="notes"
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                    placeholder="Enter payment description..."
                                                    className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                    rows={3}
                                                />
                                                {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
                                            </div>
                                        )}

                                        {/* Cheque Payment Fields */}
                                        {data.payment_method === 'Cheque' && (
                                            <div className="space-y-4 p-4 bg-gradient-to-br from-[#00aeef]/5 to-transparent rounded-xl border border-vismass-blue/30">
                                                <h3 className="text-lg font-bold text-vismass-blue mb-4">Cheque Details</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="cheque_no" className="font-semibold text-vismass-grey">Cheque Number</Label>
                                                        <Input
                                                            id="cheque_no"
                                                            type="text"
                                                            value={data.cheque_no}
                                                            onChange={(e) => setData('cheque_no', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.cheque_no && <p className="text-red-500 text-sm mt-1">{errors.cheque_no}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="cheque_date" className="font-semibold text-vismass-grey">Cheque Date</Label>
                                                        <Input
                                                            id="cheque_date"
                                                            type="date"
                                                            value={data.cheque_date}
                                                            onChange={(e) => setData('cheque_date', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.cheque_date && <p className="text-red-500 text-sm mt-1">{errors.cheque_date}</p>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="cheque_bank_name" className="font-semibold text-vismass-grey">Bank Name</Label>
                                                        <Input
                                                            id="cheque_bank_name"
                                                            type="text"
                                                            value={data.cheque_bank_name}
                                                            onChange={(e) => setData('cheque_bank_name', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.cheque_bank_name && <p className="text-red-500 text-sm mt-1">{errors.cheque_bank_name}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="cheque_account_no" className="font-semibold text-vismass-grey">Account Number</Label>
                                                        <Input
                                                            id="cheque_account_no"
                                                            type="text"
                                                            value={data.cheque_account_no}
                                                            onChange={(e) => setData('cheque_account_no', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.cheque_account_no && <p className="text-red-500 text-sm mt-1">{errors.cheque_account_no}</p>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="cheque_branch" className="font-semibold text-vismass-grey">Branch (Optional)</Label>
                                                    <Input
                                                        id="cheque_branch"
                                                        type="text"
                                                        value={data.cheque_branch}
                                                        onChange={(e) => setData('cheque_branch', e.target.value)}
                                                        className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                    />
                                                    {errors.cheque_branch && <p className="text-red-500 text-sm mt-1">{errors.cheque_branch}</p>}
                                                </div>
                                                <div>
                                                    <Label htmlFor="notes" className="font-semibold text-vismass-grey">Description (Optional)</Label>
                                                    <Textarea
                                                        id="notes"
                                                        value={data.notes}
                                                        onChange={(e) => setData('notes', e.target.value)}
                                                        placeholder="Enter payment description..."
                                                        className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                        rows={3}
                                                    />
                                                    {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Bank Deposit Fields */}
                                        {data.payment_method === 'Bank' && (
                                            <div className="space-y-4 p-4 bg-gradient-to-br from-[#00aeef]/5 to-transparent rounded-xl border border-vismass-blue/30">
                                                <h3 className="text-lg font-bold text-vismass-blue mb-4">Bank Deposit Details</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="bank_name" className="font-semibold text-vismass-grey">Bank Name</Label>
                                                        <Input
                                                            id="bank_name"
                                                            type="text"
                                                            value={data.bank_name}
                                                            onChange={(e) => setData('bank_name', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.bank_name && <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="bank_reference_no" className="font-semibold text-vismass-grey">Reference No</Label>
                                                        <Input
                                                            id="bank_reference_no"
                                                            type="text"
                                                            value={data.bank_reference_no}
                                                            onChange={(e) => setData('bank_reference_no', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.bank_reference_no && <p className="text-red-500 text-sm mt-1">{errors.bank_reference_no}</p>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="bank_deposit_date" className="font-semibold text-vismass-grey">Deposit Date</Label>
                                                        <Input
                                                            id="bank_deposit_date"
                                                            type="date"
                                                            value={data.bank_deposit_date}
                                                            onChange={(e) => setData('bank_deposit_date', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.bank_deposit_date && <p className="text-red-500 text-sm mt-1">{errors.bank_deposit_date}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="bank_branch" className="font-semibold text-vismass-grey">Branch</Label>
                                                        <Input
                                                            id="bank_branch"
                                                            type="text"
                                                            value={data.bank_branch}
                                                            onChange={(e) => setData('bank_branch', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                        />
                                                        {errors.bank_branch && <p className="text-red-500 text-sm mt-1">{errors.bank_branch}</p>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="bank_account_no" className="font-semibold text-vismass-grey">Account Number (Optional)</Label>
                                                    <Input
                                                        id="bank_account_no"
                                                        type="text"
                                                        value={data.bank_account_no}
                                                        onChange={(e) => setData('bank_account_no', e.target.value)}
                                                        className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                    />
                                                    {errors.bank_account_no && <p className="text-red-500 text-sm mt-1">{errors.bank_account_no}</p>}
                                                </div>
                                                <div>
                                                    <Label htmlFor="notes" className="font-semibold text-vismass-grey">Description (Optional)</Label>
                                                    <Textarea
                                                        id="notes"
                                                        value={data.notes}
                                                        onChange={(e) => setData('notes', e.target.value)}
                                                        placeholder="Enter payment description..."
                                                        className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                        rows={3}
                                                    />
                                                    {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Online Transfer Fields */}
                                        {data.payment_method === 'Online Transfer' && (
                                            <div className="space-y-4 p-4 bg-gradient-to-br from-[#00aeef]/5 to-transparent rounded-xl border border-vismass-blue/30">
                                                <h3 className="text-lg font-bold text-vismass-blue mb-4">Online Transfer Details</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="transfer_reference_no" className="font-semibold text-vismass-grey">Reference Number</Label>
                                                        <Input
                                                            id="transfer_reference_no"
                                                            type="text"
                                                            value={data.transfer_reference_no}
                                                            onChange={(e) => setData('transfer_reference_no', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.transfer_reference_no && <p className="text-red-500 text-sm mt-1">{errors.transfer_reference_no}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="transfer_transaction_id" className="font-semibold text-vismass-grey">Transaction ID</Label>
                                                        <Input
                                                            id="transfer_transaction_id"
                                                            type="text"
                                                            value={data.transfer_transaction_id}
                                                            onChange={(e) => setData('transfer_transaction_id', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.transfer_transaction_id && <p className="text-red-500 text-sm mt-1">{errors.transfer_transaction_id}</p>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="transfer_date" className="font-semibold text-vismass-grey">Transfer Date</Label>
                                                        <Input
                                                            id="transfer_date"
                                                            type="date"
                                                            value={data.transfer_date}
                                                            onChange={(e) => setData('transfer_date', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.transfer_date && <p className="text-red-500 text-sm mt-1">{errors.transfer_date}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="transfer_bank_name" className="font-semibold text-vismass-grey">Bank Name</Label>
                                                        <Input
                                                            id="transfer_bank_name"
                                                            type="text"
                                                            value={data.transfer_bank_name}
                                                            onChange={(e) => setData('transfer_bank_name', e.target.value)}
                                                            className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                            required
                                                        />
                                                        {errors.transfer_bank_name && <p className="text-red-500 text-sm mt-1">{errors.transfer_bank_name}</p>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="transfer_branch" className="font-semibold text-vismass-grey">Branch (Optional)</Label>
                                                    <Input
                                                        id="transfer_branch"
                                                        type="text"
                                                        value={data.transfer_branch}
                                                        onChange={(e) => setData('transfer_branch', e.target.value)}
                                                        className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                    />
                                                    {errors.transfer_branch && <p className="text-red-500 text-sm mt-1">{errors.transfer_branch}</p>}
                                                </div>
                                                <div>
                                                    <Label htmlFor="notes" className="font-semibold text-vismass-grey">Description (Optional)</Label>
                                                    <Textarea
                                                        id="notes"
                                                        value={data.notes}
                                                        onChange={(e) => setData('notes', e.target.value)}
                                                        placeholder="Enter payment description..."
                                                        className="mt-1 border-2 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 rounded-xl"
                                                        rows={3}
                                                    />
                                                    {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Form Actions */}
                                        <div className="flex justify-end space-x-4 pt-6 border-t-2 border-vismass-blue/20">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={resetForm}
                                                disabled={processing}
                                                className="border-2 border-vismass-grey hover:bg-vismass-grey/10 text-vismass-grey font-semibold px-6 rounded-xl"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing || !data.payment_method || !selectedSupplier}
                                                className="bg-gradient-to-r from-vismass-blue to-vismass-grey hover:from-vismass-blue/90 hover:to-vismass-grey/90 text-white font-bold px-8 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? 'Recording...' : 'Record Payment'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
