import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Eye, Filter, RotateCcw } from 'lucide-react';
import { PageProps } from '@/types';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SaleItemRecord {
    id: number;
    item_code: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    brand?: string;
    model?: string;
    serial_number?: string;
    invoice_no?: string;
    transaction_date?: string;
    customer_name?: string;
    section_code?: string;
    section_name?: string;
}

interface Section {
    section_code: string;
    name: string;
}

interface SaleItemsProps extends PageProps {
    records: SaleItemRecord[];
    company: any;
    sections: Section[];
}

export default function SaleItems({ records = [], company, sections = [] }: SaleItemsProps) {
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [selectedItemType, setSelectedItemType] = useState<string>('all');
    const [startDate, setStartDate] = useState<Date | undefined>(() => {
        const today = new Date();
        today.setDate(today.getDate() - 7);
        return today;
    });
    const [endDate, setEndDate] = useState<Date | undefined>(() => {
        const today = new Date();
        return today;
    });

    // Filter items based on section, item type, and date range
    const filteredRecords = useMemo(() => {
        const filtered = records.filter((record) => {
            const itemCodeLower = record.item_code?.toLowerCase() || '';
            const itemNameLower = record.item_name?.toLowerCase() || '';
            
            // Check if item has serial number, model, or brand
            const hasSerialNumber = record.serial_number && record.serial_number.trim() !== '' && record.serial_number !== '-';
            const hasModel = record.model && record.model.trim() !== '' && record.model !== '-';
            const hasBrand = record.brand && record.brand.trim() !== '' && record.brand !== '-';
            const hasProductDetails = hasSerialNumber || hasModel || hasBrand;
            
            // Filter by item type
            if (selectedItemType === 'printers') {
                // Show only items with serial_number, model, or brand (typically printers)
                if (!hasProductDetails) {
                    return false;
                }
            } else if (selectedItemType === 'stationaries') {
                // Show only items WITHOUT serial_number, model, or brand (stationary items)
                if (hasProductDetails) {
                    return false;
                }
            }
            // 'all' option shows both printers and stationaries (no filtering by product details)

            // Filter by section if selected
            if (selectedSection !== 'all' && record.section_code !== selectedSection) {
                return false;
            }

            // Filter by date range
            if (startDate && record.transaction_date) {
                const recordDate = new Date(record.transaction_date);
                const filterStartDate = new Date(startDate);
                filterStartDate.setHours(0, 0, 0, 0);
                if (recordDate < filterStartDate) {
                    return false;
                }
            }
            if (endDate && record.transaction_date) {
                const recordDate = new Date(record.transaction_date);
                const filterEndDate = new Date(endDate);
                filterEndDate.setHours(23, 59, 59, 999); // Include the entire end date
                if (recordDate > filterEndDate) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Sort by invoice number
        return filtered.sort((a, b) => {
            const invoiceA = a.invoice_no || '';
            const invoiceB = b.invoice_no || '';
            return invoiceA.localeCompare(invoiceB);
        });
    }, [records, selectedSection, selectedItemType, startDate, endDate]);

    const handlePrint = () => window.print();

    const handleResetFilters = () => {
        setSelectedSection('all');
        setSelectedItemType('all');
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        setStartDate(sevenDaysAgo);
        setEndDate(today);
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: t('Reports'), href: '/reports' }, { title: t('Sale Items'), href: '/reports/sale-items' }]}
        >
            <Head title={t('Sale Items Report')}>
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
                        
                        #printable-items,
                        #printable-items * {
                            visibility: visible;
                        }
                        
                        #printable-items {
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
                        
                        .print-report-title {
                            font-size: 18px;
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 15px;
                        }
                        
                        #printable-items > table {
                            display: table !important;
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 9px;
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
                            padding: 3px;
                            color: #000 !important;
                        }
                        
                        th {
                            background-color: #e5e7eb !important;
                            font-weight: bold;
                            text-align: left;
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
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{t('Sale Items Report')}</h1>
                                    <p className="text-xs text-white/80">{t('List of sold items with transaction details')}</p>
                                </div>
                            </div>
                            <Button onClick={handlePrint} className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200">
                                <Printer className="mr-1.5 h-4 w-4" />
                                {t('Print')}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div id="printable-items">
                        {/* Print Header - Only visible in print */}
                        <div className="print-header" style={{ display: 'none' }}>
                            <div className="mb-4 text-center">
                                <div className="text-center">
                                    <div className="text-3xl font-black" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00aeef' }}>VIS</span>
                                        <span style={{ color: '#737578' }}>MASS</span>
                                    </div>
                                    <div className="text-sm text-slate-600">Sale Items Report</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden no-print">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{t('Sale Items Report')}</h3>
                                        <p className="text-white/80 text-sm mt-1">{t('Transactions and sold item lines')}</p>
                                    </div>
                                    <div className="text-white/80 text-sm whitespace-nowrap">{t('Generated on')}: {new Date().toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Filters Card */}
                                <Card className="rounded-2xl border-slate-200 bg-white shadow-md mb-6">
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            {/* Item Type */}
                                            <div className="space-y-2">
                                                <Label htmlFor="item_type" className="text-sm font-medium text-gray-700">
                                                    {t('Item Type')}
                                                </Label>
                                                <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Filter by Sales Item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Items</SelectItem>
                                                        <SelectItem value="printers">Printers</SelectItem>
                                                        <SelectItem value="stationaries">Stationaries</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Section */}
                                            <div className="space-y-2">
                                                <Label htmlFor="section" className="text-sm font-medium text-gray-700">
                                                    {t('Section')}
                                                </Label>
                                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Section" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Sections</SelectItem>
                                                        {sections.map((section) => (
                                                            <SelectItem key={section.section_code} value={section.section_code}>
                                                                {section.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Date Range Filters */}
                                            <div className="space-y-2">
                                                <Label htmlFor="from_date" className="text-sm font-medium text-gray-700">
                                                    {t('From Date')}
                                                </Label>
                                                <DatePicker
                                                    date={startDate}
                                                    onDateChange={setStartDate}
                                                    placeholder="DD/MM/YYYY"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="to_date" className="text-sm font-medium text-gray-700">
                                                    {t('To Date')}
                                                </Label>
                                                <DatePicker
                                                    date={endDate}
                                                    onDateChange={setEndDate}
                                                    placeholder="DD/MM/YYYY"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                className="inline-flex items-center rounded-lg bg-vismass-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                {t('Apply')}
                                            </button>
                                            <button
                                                onClick={handleResetFilters}
                                                className="inline-flex items-center rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-slate-400"
                                            >
                                                {t('Reset')}
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Table */}
                                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Invoice</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Section</TableHead>
                                                <TableHead>Item Code</TableHead>
                                                <TableHead>Item Name</TableHead>
                                                <TableHead>Serial Number</TableHead>
                                                <TableHead>Brand</TableHead>
                                                <TableHead>Model</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Unit Price</TableHead>
                                                <TableHead className="text-right">Total Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRecords.map((r: SaleItemRecord) => (
                                                <TableRow key={r.id}>
                                                    <TableCell className="font-semibold">{r.invoice_no}</TableCell>
                                                    <TableCell>{r.transaction_date ? new Date(r.transaction_date).toLocaleDateString() : '-'}</TableCell>
                                                    <TableCell>{r.customer_name || '-'}</TableCell>
                                                    <TableCell>{r.section_name || r.section_code || '-'}</TableCell>
                                                    <TableCell>{r.item_code}</TableCell>
                                                    <TableCell>{r.item_name}</TableCell>
                                                    <TableCell>{r.serial_number || '-'}</TableCell>
                                                    <TableCell>{r.brand || '-'}</TableCell>
                                                    <TableCell>{r.model || '-'}</TableCell>
                                                    <TableCell className="text-right">{Number(r.quantity).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">{Number(r.unit_price).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">{(Number(r.quantity) * Number(r.unit_price)).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>

                        {/* Print Table - Only visible in print */}
                        <table style={{ display: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Section</th>
                                    <th>Item Code</th>
                                    <th>Item Name</th>
                                    <th>Serial Number</th>
                                    <th>Brand</th>
                                    <th>Model</th>
                                    <th style={{ textAlign: 'right' }}>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                                    <th style={{ textAlign: 'right' }}>Total Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((r: SaleItemRecord) => (
                                    <tr key={r.id}>
                                        <td>{r.invoice_no}</td>
                                        <td>{r.transaction_date ? new Date(r.transaction_date).toLocaleDateString() : '-'}</td>
                                        <td>{r.customer_name || '-'}</td>
                                        <td>{r.section_name || r.section_code || '-'}</td>
                                        <td>{r.item_code}</td>
                                        <td>{r.item_name}</td>
                                        <td>{r.serial_number || '-'}</td>
                                        <td>{r.brand || '-'}</td>
                                        <td>{r.model || '-'}</td>
                                        <td style={{ textAlign: 'right' }}>{Number(r.quantity).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{Number(r.unit_price).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>{(Number(r.quantity) * Number(r.unit_price)).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

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
                </main>
            </div>
        </AppLayout>
    );
}
