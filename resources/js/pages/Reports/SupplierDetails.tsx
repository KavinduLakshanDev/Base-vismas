import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageProps, Address, Company } from '@/types';
import { Printer, Building, X, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SupplierDetailsProps extends PageProps {
    suppliers: Address[];
    company: Company;
}

export default function SupplierDetails({ auth, suppliers, company }: SupplierDetailsProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter suppliers based on search term
    const filteredSuppliers = useMemo(() => {
        if (!searchTerm.trim()) return suppliers;
        
        const search = searchTerm.toLowerCase();
        return suppliers.filter(supplier => {
            const supplierId = supplier.AdrCd?.toLowerCase() || '';
            const supplierName = `${supplier.FstNm || ''} ${supplier.LstNm || ''}`.toLowerCase();
            return supplierId.includes(search) || supplierName.includes(search);
        });
    }, [suppliers, searchTerm]);

    const clearFilters = () => {
        setSearchTerm('');
        router.get('/reports/supplier-details', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Reports',
                    href: '/reports',
                },
                {
                    title: 'Supplier Details',
                    href: '/reports/supplier-details',
                },
            ]}
        >
            <Head title={t('Supplier Details')}>
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
                        
                        #printable-suppliers,
                        #printable-suppliers * {
                            visibility: visible;
                        }
                        
                        #printable-suppliers {
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
                        
                        #printable-suppliers > table {
                            display: table !important;
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
                        
                        th:nth-child(1), td:nth-child(1) {
                            width: 15%;
                            font-weight: bold;
                        }
                        
                        th:nth-child(2), td:nth-child(2) {
                            width: 25%;
                            font-weight: bold;
                        }
                        
                        th:nth-child(3), td:nth-child(3) {
                            width: 20%;
                        }
                        
                        th:nth-child(4), td:nth-child(4) {
                            width: 15%;
                        }
                        
                        th:nth-child(5), td:nth-child(5) {
                            width: 15%;
                        }
                        
                        th:nth-child(6), td:nth-child(6) {
                            width: 10%;
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
                                    <Building className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{t('Supplier Details')}</h1>
                                    <p className="text-xs text-white/80">
                                        {t('Comprehensive supplier details report')}
                                    </p>
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
                    <div id="printable-suppliers">
                        {/* Print Header - Only visible in print */}
                        <div className="print-header" style={{ display: 'none' }}>
                            <div className="mb-4 text-center">
                                <div className="text-center">
                                    <div className="text-3xl font-black" style={{ marginBottom: '5px' }}>
                                        <span style={{ color: '#00aeef' }}>VIS</span>
                                        <span style={{ color: '#737578' }}>MASS</span>
                                    </div>
                                    <div className="text-sm text-slate-600">Supplier Details Report</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden no-print">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-6 py-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{t('Supplier Details Report')}</h3>
                                        <p className="text-white/80 text-sm mt-1">{t('View and search supplier information')}</p>
                                    </div>
                                    <div className="text-white/80 text-sm">{t('Generated on')}: {new Date().toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Filters */}
                                <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200 no-print">
                                    {/* Search */}
                                    <div className="mb-4">
                                        <Label htmlFor="search">{t('Search by Supplier ID or Name')}</Label>
                                        <div className="relative mt-2">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="search"
                                                type="text"
                                                placeholder={t('Enter Supplier ID or Name...')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="bg-white pl-10 pr-10"
                                            />
                                            {searchTerm && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title={t('Clear')}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Supplier ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Address</TableHead>
                                                <TableHead>Created Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSuppliers.map((supplier: Address) => (
                                                <TableRow key={supplier.AdrKy}>
                                                    <TableCell className="font-semibold">{supplier.AdrCd}</TableCell>
                                                    <TableCell>{`${supplier.FstNm} ${supplier.LstNm}`}</TableCell>
                                                    <TableCell>{supplier.Email}</TableCell>
                                                    <TableCell>{supplier.TP1}</TableCell>
                                                    <TableCell>{`${supplier.Address || ''}, ${supplier.Town || ''}, ${supplier.City || ''}`}</TableCell>
                                                    <TableCell>{supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : '-'}</TableCell>
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
                                    <th>Supplier ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    <th>Created Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSuppliers.map((supplier: Address) => (
                                    <tr key={supplier.AdrKy}>
                                        <td>{supplier.AdrCd}</td>
                                        <td>{`${supplier.FstNm} ${supplier.LstNm}`}</td>
                                        <td>{supplier.Email}</td>
                                        <td>{supplier.TP1}</td>
                                        <td>{`${supplier.Address || ''}, ${supplier.Town || ''}, ${supplier.City || ''}`}</td>
                                        <td>{supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : '-'}</td>
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
