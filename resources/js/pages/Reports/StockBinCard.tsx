import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageProps, Company } from '@/types';
import { Printer, Search, RotateCcw, FileText, Package, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DatePicker } from '@/components/ui/date-picker';

interface Item {
    ItmKy: string;
    ItemCode: string;
    ItmNm: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    section_code?: string;
}

interface Transaction {
    id: number;
    date: string;
    description: string;
    reference: string;
    received: number;
    issued: number;
    balance: number;
}

interface StockBinCardProps extends PageProps {
    items: Item[];
    company: Company;
    sections: Array<{
        id: number;
        section_code: string;
        name: string;
    }>;
    transactions?: Transaction[];
    selectedItem?: Item;
    fromDate?: string;
    toDate?: string;
    openingBalance?: number;
    closingBalance?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Reports',
        href: '/reports',
    },
    {
        title: 'Stock Bin Card',
        href: '/reports/stock-bin-card',
    },
];

export default function StockBinCard({
    auth,
    items = [],
    company,
    sections = [],
    transactions = [],
    selectedItem,
    fromDate = '',
    toDate = '',
    openingBalance = 0,
    closingBalance = 0,
}: StockBinCardProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [itemId, setItemId] = useState(selectedItem?.ItemCode || '');
    const [sectionCode, setSectionCode] = useState('all');
    const [startDate, setStartDate] = useState<Date | undefined>(() => {
        return (
            fromDate
                ? new Date(fromDate)
                : (() => {
                    const today = new Date();
                    today.setDate(today.getDate() - 7);
                    return today;
                })()
        );
    });
    const [endDate, setEndDate] = useState<Date | undefined>(() => {
        return (
            toDate
                ? new Date(toDate)
                : (() => {
                    const today = new Date();
                    return today;
                })()
        );
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const effectiveOpeningBalance = startDate && new Date(startDate) > new Date(today) ? closingBalance : openingBalance;

    const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;
        return (!from || transactionDate >= from) && (!to || transactionDate <= to);
    });

    const totalReceived = filteredTransactions.reduce((sum, t) => sum + (t.received || 0), 0);
    const totalIssued = filteredTransactions.reduce((sum, t) => sum + (t.issued || 0), 0);
    const calculatedClosingBalance = effectiveOpeningBalance + totalReceived - totalIssued;

    const handleApplyFilters = () => {
        if (!itemId) {
            alert('Please select an item');
            return;
        }

        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('item_code', itemId);
        if (sectionCode && sectionCode !== 'all') params.append('section_code', sectionCode);
        if (startDate) params.append('from_date', startDate.toISOString().split('T')[0]);
        if (endDate) params.append('to_date', endDate.toISOString().split('T')[0]);

        router.get(
            `/reports/stock-bin-card?${params.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
                onError: () => setIsLoading(false),
            }
        );
    };

    const handleResetFilters = () => {
        setItemId('');
        setSectionCode('all');
        setStartDate(undefined);
        setEndDate(undefined);
        setSearchTerm('');
        router.get('/reports/stock-bin-card', {}, {
            preserveState: false,
            preserveScroll: false,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredItems = items.filter((item) => {
        const matchesSection = sectionCode === 'all' || item.section_code === sectionCode;
        return matchesSection;
    });

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
        >
            <Head title={t('Stock Bin Card')}>
                <style>{`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 10mm;
                            margin-top: 0;
                        }
                        
                        @page :first {
                            margin-top: 10mm;
                        }
                        
                        body, html {
                            height: auto !important;
                            overflow: visible !important;
                        }
                        
                        body * {
                            visibility: hidden;
                        }
                        
                        /* Reset all parent containers to allow multi-page flow */
                        body,
                        body > div,
                        body > div > div,
                        [data-slot="sidebar-wrapper"],
                        [data-slot="sidebar-inset"],
                        main,
                        .min-h-screen,
                        .min-h-svh {
                            position: static !important;
                            overflow: visible !important;
                            height: auto !important;
                            min-height: 0 !important;
                            max-height: none !important;
                            display: block !important;
                        }
                        
                        #printable-card,
                        #printable-card * {
                            visibility: visible;
                        }
                        
                        #printable-card {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background: white;
                            height: auto !important;
                            overflow: visible !important;
                        }
                        
                        .no-print {
                            display: none !important;
                        }
                        
                        .print-header {
                            margin-bottom: 20px;
                            border-bottom: 2px solid #000;
                            padding-bottom: 10px;
                            display: block !important;
                        }
                        
                        .print-company-name {
                            font-size: 24px;
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 5px;
                        }
                        
                        .print-report-title {
                            font-size: 18px;
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 15px;
                        }
                        
                        .print-item-info {
                            margin-bottom: 15px;
                        }
                        
                        .print-info-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 12px;
                            margin-bottom: 3px;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 10px;
                            page-break-inside: auto;
                            color: #000 !important;
                        }
                        
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                        
                        thead {
                            display: table-header-group;
                        }
                        
                        th, td {
                            border: 1px solid #000;
                            padding: 4px;
                            color: #000 !important;
                        }
                        
                        th {
                            background-color: #e5e7eb !important;
                            font-weight: bold;
                            text-align: left;
                            color: #000 !important;
                        }
                        
                        .balance-row {
                            background-color: #f3f4f6 !important;
                            font-weight: bold;
                            color: #000 !important;
                        }
                        
                        .print-footer {
                            margin-top: 20px;
                            padding-top: 10px;
                            border-top: 1px solid #000;
                            font-size: 10px;
                            display: flex !important;
                            justify-content: space-between;
                            color: #000 !important;
                        }
                    }
                `}</style>
            </Head>

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow no-print">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => window.history.back()}
                                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-all duration-200"
                                    title={t('Go Back')}
                                >
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Stock Bin Card')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('View item stock movements and balance')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handlePrint}
                                disabled={!selectedItem}
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                {t('Print Card')}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden no-print mb-6">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {t('Stock Card Filters')}
                                        </h3>
                                        <p className="text-white/80 text-sm mt-1">
                                            {t('Select item and date range')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {/* Section Filter */}
                                    <div className="space-y-2">
                                        <Label htmlFor="section">{t('Section')}</Label>
                                        <Select
                                            value={sectionCode}
                                            onValueChange={(value) => {
                                                setSectionCode(value);
                                            }}
                                        >
                                            <SelectTrigger className="border-slate-300 bg-white focus:border-vismass-blue focus:ring-vismass-blue">
                                                <SelectValue placeholder={t('All Sections')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Sections')}</SelectItem>
                                                {sections.map((sec) => (
                                                    <SelectItem key={sec.id} value={sec.section_code}>
                                                        {sec.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Item Search & Selection - Combobox */}
                                    <div className="space-y-2 lg:col-span-2">
                                        <Label>{t('Search & Select Item')} *</Label>
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className="w-full justify-between border-slate-300 bg-white focus:border-vismass-blue focus:ring-vismass-blue"
                                                >
                                                    {itemId
                                                        ? (() => {
                                                            const selected = items.find((item) => item.ItemCode === itemId);
                                                            return selected ? `${selected.ItemCode} - ${selected.ItmNm}` : t('Select item');
                                                        })()
                                                        : t('Search and select item...')}
                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput 
                                                        placeholder={t('Search by name, code, brand, model...')} 
                                                        className="h-9"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>{t('No item found.')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {filteredItems.slice(0, 50).map((item) => (
                                                                <CommandItem
                                                                    key={item.ItemCode}
                                                                    value={`${item.ItemCode} ${item.ItmNm} ${item.brand || ''} ${item.model || ''} ${item.serial_number || ''}`}
                                                                    onSelect={() => {
                                                                        setItemId(item.ItemCode);
                                                                        setOpen(false);
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <div className="font-medium">
                                                                            {item.ItemCode} - {item.ItmNm}
                                                                        </div>
                                                                        {(item.brand || item.model) && (
                                                                            <div className="text-xs text-slate-500">
                                                                                {item.brand && `${item.brand}`}
                                                                                {item.brand && item.model && ' • '}
                                                                                {item.model && `${item.model}`}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto h-4 w-4",
                                                                            itemId === item.ItemCode ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Date Range */}
                                    <div className="space-y-2">
                                        <Label htmlFor="from-date">{t('From Date')}</Label>
                                        <DatePicker
                                            date={startDate}
                                            onDateChange={setStartDate}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="to-date">{t('To Date')}</Label>
                                        <DatePicker
                                            date={endDate}
                                            onDateChange={setEndDate}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        onClick={handleApplyFilters}
                                        disabled={isLoading || !itemId}
                                        className="bg-vismass-blue hover:bg-vismass-blue/90 text-white gap-2"
                                    >
                                        <Search className="h-4 w-4" />
                                        {t('Generate Card')}
                                    </Button>
                                    <Button
                                        onClick={handleResetFilters}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        {t('Reset')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Stock Bin Card Display */}
                        {selectedItem && startDate && endDate && (
                            <div id="printable-card">
                                {/* Print Header - Only visible in print */}
                                <div className="print-header" style={{ display: 'none' }}>
                                    <div className="mb-4 text-center">
                                        <div className="text-center">
                                            <div className="text-3xl font-black" style={{ marginBottom: '5px' }}>
                                                <span style={{ color: '#00aeef' }}>VIS</span>
                                                <span style={{ color: '#737578' }}>MASS</span>
                                            </div>
                                            <div className="text-sm text-slate-600">Stock Bin Card</div>
                                        </div>
                                    </div>
                                    
                                    <div className="print-item-info" style={{ border: '1px solid #000', padding: '10px', marginBottom: '10px' }}>
                                        <div key="item-code" className="print-info-row">
                                            <span><strong>Item Code:</strong> {selectedItem.ItemCode}</span>
                                            <span><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</span>
                                        </div>
                                        <div key="item-name" className="print-info-row">
                                            <span><strong>Item Name:</strong> {selectedItem.ItmNm}</span>
                                            <span></span>
                                        </div>
                                        {selectedItem.brand && (
                                            <div key="item-brand" className="print-info-row">
                                                <span><strong>Brand:</strong> {selectedItem.brand}</span>
                                                <span></span>
                                            </div>
                                        )}
                                        {selectedItem.model && (
                                            <div key="item-model" className="print-info-row">
                                                <span><strong>Model:</strong> {selectedItem.model}</span>
                                                <span></span>
                                            </div>
                                        )}
                                        {selectedItem.serial_number && (
                                            <div key="item-serial" className="print-info-row">
                                                <span><strong>Serial Number:</strong> {selectedItem.serial_number}</span>
                                                <span></span>
                                            </div>
                                        )}
                                        {startDate && endDate && (
                                            <div key="item-period" className="print-info-row">
                                                <span><strong>Period:</strong> {startDate.toLocaleDateString('en-GB')} to {endDate.toLocaleDateString('en-GB')}</span>
                                                <span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4 no-print">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    {t('Stock Bin Card')} - {selectedItem.ItmNm}
                                                </h3>
                                                <p className="text-white/80 text-sm mt-1">
                                                    {t('Item Code')}: {selectedItem.ItemCode}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Item Details Card - Screen Only */}
                                    <div className="p-6 bg-slate-50 border-b border-slate-200 no-print">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {selectedItem.brand && (
                                                <div>
                                                    <p className="text-sm text-slate-600">{t('Brand')}</p>
                                                    <p key="brand" className="font-medium">{selectedItem.brand}</p>
                                                </div>
                                            )}
                                            {selectedItem.model && (
                                                <div>
                                                    <p className="text-sm text-slate-600">{t('Model')}</p>
                                                    <p key="model" className="font-medium">{selectedItem.model}</p>
                                                </div>
                                            )}
                                            {selectedItem.serial_number && (
                                                <div>
                                                    <p className="text-sm text-slate-600">{t('Serial Number')}</p>
                                                    <p key="serial" className="font-medium">{selectedItem.serial_number}</p>
                                                </div>
                                            )}
                                        </div>
                                        {startDate && endDate && (
                                            <div className="mt-4">
                                                <p className="text-sm text-slate-600">{t('Period')}</p>
                                                <p className="font-medium">
                                                    {startDate.toLocaleDateString('en-GB')} to {endDate.toLocaleDateString('en-GB')}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="font-bold">{t('Date')}</TableHead>
                                                        <TableHead className="font-bold">{t('Description')}</TableHead>
                                                        <TableHead className="font-bold">{t('Reference')}</TableHead>
                                                        <TableHead className="font-bold text-right">{t('Received')}</TableHead>
                                                        <TableHead className="font-bold text-right">{t('Issued')}</TableHead>
                                                        <TableHead className="font-bold text-right">{t('Balance')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {/* Opening Balance */}
                                                    <TableRow className="bg-slate-100 font-semibold">
                                                        <TableCell colSpan={3}>{t('Opening Balance')}</TableCell>
                                                        <TableCell className="text-right">-</TableCell>
                                                        <TableCell className="text-right">-</TableCell>
                                                        <TableCell className="text-right">
                                                            {Number(effectiveOpeningBalance).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Transactions */}
                                                    {filteredTransactions.length > 0 ? (
                                                        filteredTransactions.map((transaction) => (
                                                            <TableRow key={transaction.id}>
                                                                <TableCell>
                                                                    {new Date(transaction.date).toLocaleDateString('en-GB')}
                                                                </TableCell>
                                                                <TableCell>{transaction.description}</TableCell>
                                                                <TableCell>{transaction.reference}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {transaction.received > 0 ? Number(transaction.received).toFixed(2) : '-'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {transaction.issued > 0 ? Number(transaction.issued).toFixed(2) : '-'}
                                                                </TableCell>
                                                                <TableCell className="text-right font-medium">
                                                                    {Number(transaction.balance).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center py-8">
                                                                <div className="flex flex-col items-center">
                                                                    <Package className="h-10 w-10 text-slate-400 mb-2" />
                                                                    <p className="text-sm font-medium text-slate-900">{t('No Transactions Found')}</p>
                                                                    <p className="text-xs text-slate-600 mt-1">
                                                                        {t('No stock movements available for the selected period')}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}

                                                    {/* Closing Balance */}
                                                    <TableRow className="bg-slate-200 font-bold">
                                                        <TableCell colSpan={3}>{t('Closing Balance')}</TableCell>
                                                        <TableCell className="text-right">
                                                            {Number(totalReceived).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {Number(totalIssued).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {Number(calculatedClosingBalance).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Print Footer - Only visible in print */}
                                    <div className="print-footer" style={{ display: 'none' }}>
                                        <span>Generated by Unitec Software Solution</span>
                                        <span>
                                            Printed on: {new Date().toLocaleString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Item Selected State */}
                        {!(selectedItem && startDate && endDate) && (
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="text-center p-12">
                                    <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Package className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">{t('Select Item and Date Range')}</h3>
                                    <p className="text-sm text-slate-600 mt-2">
                                        {t('Please select an item and date range to view the stock bin card')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
