import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Check,
    CheckCircle,
    CreditCard,
    MapPin,
    RefreshCw,
    Search,
    User,
    X,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import axios from 'axios';
import { DatePicker } from '@/components/ui/date-picker';

interface AddressDetails {
    address?: string;
    city?: string;
    phone?: string;
}

interface Customer {
    AccKy: number;
    AccCd: string;
    AccNm: string;
    address_details?: AddressDetails;
}

interface Cheque {
    AccTrnKy: number;
    ChqueNo: string;
    BankNm: string;
    BranchNm: string;
    Amt: number;
    RBDT: string;
    customer: Customer;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'POS', href: '/pos' },
    { title: 'Cheque Return', href: '/pos/cheque-return' },
];

export default function ChequeReturnIndex() {
    const searchData = useForm({
        cheque_no: '',
        bank_name: '',
        branch_name: '',
    });

    const returnData = useForm({
        cheque_id: null as number | null,
        return_reason: '',
        return_date: '',
    });

    const [searchResults, setSearchResults] = useState<Cheque[]>([]);
    const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);

    const clearError = () => setError(null);
    const clearSuccess = () => setSuccess(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setError(null);
        setSearchMessage(null);
        setSearchResults([]);
        setSelectedCheque(null);

        try {
            const response = await axios.post('/pos/cheque-return/search', searchData.data);
            if (response.data.success) {
                setSearchResults(response.data.cheques);
                setSearchMessage(response.data.message);
            } else {
                setError(response.data.message || 'Search failed');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to search cheques. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectCheque = (cheque: Cheque) => {
        setSelectedCheque(cheque);
        returnData.setData('cheque_id', cheque.AccTrnKy);
        setError(null);
    };

    const formatDateForSubmission = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleReturnCheque = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCheque || !returnData.data.cheque_id) {
            setError('Please select a cheque to return');
            return;
        }

        if (!returnDate) {
            setError('Please select a return date');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post('/pos/cheque-return/process', {
                ...returnData.data,
                return_date: formatDateForSubmission(returnDate),
            });

            if (response.data.success) {
                setSuccess(
                    `Cheque returned successfully! Return # ${response.data.return_number}. Amount: Rs.${Number(response.data.return_amount).toFixed(2)}`
                );
                // Clear selection and search results
                setSelectedCheque(null);
                setSearchResults([]);
                returnData.reset();
                searchData.reset();
                setReturnDate(undefined);
            } else {
                setError(response.data.message || 'Failed to process return');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'An error occurred while processing the return.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNewReturn = () => {
        searchData.reset();
        returnData.reset();
        setSearchResults([]);
        setSelectedCheque(null);
        setError(null);
        setSuccess(null);
        setSearchMessage(null);
        setReturnDate(undefined);
    };

    const handleBackToPOS = () => {
        router.visit('/pos/dashboard'); // Assuming there's a POS dashboard or main POS page
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Cheque Return')} />

            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
                {/* Header - Promotional Discount style */}
                <header className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 shadow-lg no-print">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                {/* Back Button */}
                                <button
                                    onClick={() => window.history.back()}
                                    className="mr-2 rounded-lg bg-white/20 backdrop-blur-sm p-2 hover:bg-white/30 transition-all duration-200 border border-white/30"
                                    title={t('Go Back')}
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </button>
                                <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-3 shadow-lg">
                                    <RefreshCw className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {t('Cheque Return Management')}
                                    </h1>
                                    <p className="text-sm text-sky-200">
                                        {t('Search and process returned cheques')}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                                <span className="text-sm text-white font-medium">
                                    {new Date().toLocaleDateString('en-GB', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <CreditCard className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">{t('Cheques Found')}</p>
                                        <p className="text-2xl font-bold text-gray-900">{searchResults.length}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <AlertTriangle className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">{t('Selected Cheque')}</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {selectedCheque ? '1' : '0'}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <User className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">{t('Customers')}</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {Array.from(new Set(searchResults.map(c => c.customer.AccKy))).length}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-sky-50 p-6 shadow-md transition-all duration-300 hover:shadow-xl border border-sky-100">
                                <div className="flex items-center">
                                    <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow">
                                        <RefreshCw className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">{t('Total Amount')}</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            Rs.{Math.abs(searchResults.reduce((sum, cheque) => sum + cheque.Amt, 0)).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-sky-200/20"></div>
                            </div>
                        </div>

                        {/* Enhanced Notifications */}
                        <div className="mb-6">
                            {error && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <h3 className="text-sm font-medium text-red-800">
                                                {t('Error')}
                                            </h3>
                                            <div className="mt-1 text-sm text-red-700">
                                                {error}
                                            </div>
                                        </div>
                                        <div className="ml-auto pl-3">
                                            <button
                                                onClick={clearError}
                                                className="inline-flex rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="mb-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <Check className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <h3 className="text-sm font-medium text-green-800">
                                                {t('Success')}
                                            </h3>
                                            <div className="mt-1 text-sm text-green-700">
                                                {success}
                                            </div>
                                        </div>
                                        <div className="ml-auto pl-3">
                                            <button
                                                onClick={clearSuccess}
                                                className="inline-flex rounded-lg bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {searchMessage && !error && (
                                <div className="mb-4 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-sky-400" />
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <div className="mt-1 text-sm text-sky-700">
                                                {searchMessage}
                                            </div>
                                        </div>
                                        <div className="ml-auto pl-3">
                                            <button
                                                onClick={clearError}
                                                className="inline-flex rounded-lg bg-sky-50 p-1.5 text-sky-500 hover:bg-sky-100 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Content Card */}
                        <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 px-6 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {t('Cheque Return Management System')}
                                        </h3>
                                        <p className="text-sky-200 text-sm mt-1">
                                            {t('Search and process returned cheques efficiently')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleNewReturn}
                                            className="inline-flex items-center rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30 hover:shadow-lg border border-white/30"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            {t('New Return')}
                                        </button>
                                        {/* 
                                        <button
                                            onClick={handleBackToPOS}
                                            className="inline-flex items-center rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30 hover:shadow-lg border border-white/30"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            {t('Back to POS')}
                                        </button>
                                        */}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column - Search */}
                                    <div className="space-y-6">
                                        {/* Search Form */}
                                        <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-6">
                                            <div className="mb-4 flex items-center gap-2">
                                                <div className="rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 p-2 shadow">
                                                    <Search className="h-5 w-5 text-white" />
                                                </div>
                                                <h2 className="text-lg font-semibold text-sky-900">
                                                    {t('Search Cheque')}
                                                </h2>
                                            </div>

                                            <form onSubmit={handleSearch} className="space-y-4">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        {t('Cheque Number')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={searchData.data.cheque_no}
                                                        onChange={(e) => searchData.setData('cheque_no', e.target.value)}
                                                        placeholder={t('Enter cheque number')}
                                                        className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        {t('Bank Name')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={searchData.data.bank_name}
                                                        onChange={(e) => searchData.setData('bank_name', e.target.value)}
                                                        placeholder={t('Enter bank name')}
                                                        className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        {t('Branch Name')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={searchData.data.branch_name}
                                                        onChange={(e) => searchData.setData('branch_name', e.target.value)}
                                                        placeholder={t('Enter branch name (optional)')}
                                                        className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSearching}
                                                    className="inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-sky-700 hover:to-blue-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isSearching ? (
                                                        <>
                                                            <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            {t('Searching...')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Search className="mr-2 h-4 w-4" />
                                                            {t('Search Cheque')}
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </div>

                                        {/* Search Results */}
                                        {searchResults.length > 0 && (
                                            <div className="rounded-xl border border-sky-200 bg-white p-6 shadow-sm">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h2 className="text-lg font-semibold text-sky-900">
                                                        {t('Valid Cheques Found')}
                                                    </h2>
                                                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-2.5 py-0.5 text-xs font-medium text-white">
                                                        {searchResults.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    {searchResults.map((cheque) => (
                                                        <div
                                                            key={cheque.AccTrnKy}
                                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedCheque?.AccTrnKy === cheque.AccTrnKy
                                                                ? 'border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50 shadow-sm'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                            onClick={() => handleSelectCheque(cheque)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center space-x-2">
                                                                        <CreditCard className="h-4 w-4 text-sky-600" />
                                                                        <span className="font-medium">{cheque.ChqueNo}</span>
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">
                                                                        {cheque.BankNm} - {cheque.BranchNm}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">
                                                                        {t('Customer')}: {cheque.customer.AccNm}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-lg text-green-600">
                                                                        Rs.{Math.abs(cheque.Amt).toFixed(2)}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">
                                                                        {new Date(cheque.RBDT).toLocaleDateString('en-GB')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {selectedCheque?.AccTrnKy === cheque.AccTrnKy && (
                                                                <div className="mt-2 pt-2 border-t border-sky-200">
                                                                    <div className="flex items-center text-sm text-green-600">
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        {t('Selected for return')}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column - Return Processing */}
                                    <div className="space-y-6">
                                        {/* Selected Cheque Details */}
                                        {selectedCheque && (
                                            <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-6">
                                                <div className="mb-4 flex items-center gap-2">
                                                    <div className="rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 p-2 shadow">
                                                        <CreditCard className="h-5 w-5 text-white" />
                                                    </div>
                                                    <h2 className="text-lg font-semibold text-sky-900">
                                                        {t('Selected Cheque Details')}
                                                    </h2>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-500">{t('Cheque Number')}</label>
                                                            <div className="text-lg font-semibold text-sky-900">{selectedCheque.ChqueNo}</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-500">{t('Amount')}</label>
                                                            <div className="text-lg font-semibold text-green-600">
                                                                Rs.{Math.abs(selectedCheque.Amt).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-500">{t('Bank')}</label>
                                                            <div>{selectedCheque.BankNm}</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-500">{t('Branch')}</label>
                                                            <div>{selectedCheque.BranchNm}</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-500">{t('Customer')}</label>
                                                        <div className="flex items-center space-x-2">
                                                            <User className="h-4 w-4 text-gray-400" />
                                                            <span className="font-medium">{selectedCheque.customer.AccNm}</span>
                                                            <span className="text-gray-500">({selectedCheque.customer.AccCd})</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-500">{t('Cheque Date')}</label>
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar className="h-4 w-4 text-gray-400" />
                                                            <span>{new Date(selectedCheque.RBDT).toLocaleDateString('en-GB')}</span>
                                                        </div>
                                                    </div>

                                                    {selectedCheque.customer.address_details && (
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-500">{t('Customer Address')}</label>
                                                            <div className="text-sm">
                                                                <div className="flex items-start space-x-2">
                                                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                                                    <div>
                                                                        <div>{selectedCheque.customer.address_details.address}</div>
                                                                        <div className="text-gray-600">{selectedCheque.customer.address_details.city}</div>
                                                                        <div className="text-gray-600">{selectedCheque.customer.address_details.phone}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Return Form */}
                                        {selectedCheque && (
                                            <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-red-50 to-pink-50 p-6">
                                                <div className="mb-4 flex items-center gap-2">
                                                    <div className="rounded-lg bg-gradient-to-br from-red-500 to-pink-600 p-2 shadow">
                                                        <AlertTriangle className="h-5 w-5 text-white" />
                                                    </div>
                                                    <h2 className="text-lg font-semibold text-red-900">
                                                        {t('Process Return')}
                                                    </h2>
                                                </div>

                                                <form onSubmit={handleReturnCheque} className="space-y-4">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            {t('Return Date')} <span className="text-red-500">*</span>
                                                        </label>
                                                        <DatePicker
                                                            date={returnDate}
                                                            onDateChange={setReturnDate}
                                                            placeholder={t('Select return date')}
                                                            className="w-full rounded-xl border-gray-300 shadow-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            {t('Return Reason')} <span className="text-red-500">*</span>
                                                        </label>
                                                        <textarea
                                                            value={returnData.data.return_reason}
                                                            onChange={(e) => returnData.setData('return_reason', e.target.value)}
                                                            placeholder={t('Enter reason for cheque return')}
                                                            rows={3}
                                                            className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-sky-500 focus:ring-sky-500 focus:outline-none"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Warning Alert */}
                                                    <div className="rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
                                                        <div className="flex">
                                                            <div className="flex-shrink-0">
                                                                <AlertTriangle className="h-5 w-5 text-red-400" />
                                                            </div>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-medium text-red-800">
                                                                    {t('Important Notice')}
                                                                </p>
                                                                <p className="mt-1 text-sm text-red-700">
                                                                    {t("This action will increase the customer's outstanding balance by")} <strong>Rs.{Math.abs(selectedCheque.Amt).toFixed(2)}</strong>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={isProcessing}
                                                        className="inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-red-600 to-pink-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:from-red-700 hover:to-pink-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isProcessing ? (
                                                            <>
                                                                <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                {t('Processing Return...')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                                {t('Process Cheque Return')}
                                                            </>
                                                        )}
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-12 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                            <p className="text-xs text-gray-600">© UNITEC POS System • Cheque Return Management</p>
                            <p className="text-xs text-gray-500">v1.0.0 • Professional POS Solution</p>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}
