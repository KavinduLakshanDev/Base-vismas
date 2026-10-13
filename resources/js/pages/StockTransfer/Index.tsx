import { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import Pagination, { PaginationLink, PaginationMeta } from '@/components/pagination';
import { ArrowRightLeft, Plus, Truck, Calendar, Package, TrendingUp, Eye, Edit, Download, Search } from 'lucide-react';
import { t } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StockTransfer {
    id: number;
    transfer_number?: string;
    from_section_code: string;
    to_section_code: string;
    item_id: number;
    quantity: number;
    cost_price: number;
    transfer_date: string;
    notes: string;
    company_code: string;
    batch_no?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    warranty?: string;
    fromSection: {
        name: string;
        section_code: string;
    } | null;
    toSection: {
        name: string;
        section_code: string;
    } | null;
    item: {
        ItemCode: string;
        ItmNm: string;
    };
}

interface StockTransfersData extends PaginationMeta {
    data: StockTransfer[];
    links: PaginationLink[];
}

interface IndexProps {
    stockTransfers: StockTransfersData;
    filters: {
        search?: string;
    };
}

export default function Index({ stockTransfers, filters }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const isFirstRender = useRef(true);
    const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Auto-search effect
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            router.get(
                '/stock-transfers',
                { search: searchTerm },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('Stock Transfers'),
            href: '#',
        },
    ];

    // Use backend filtered data directly
    const validTransfers = stockTransfers.data;

    // Group transfers by transfer_number
    const groupedTransfers = validTransfers.reduce((acc, transfer) => {
        const key = transfer.transfer_number || `transfer-${transfer.id}`;
        if (!acc[key]) {
            acc[key] = {
                transfer_number: transfer.transfer_number,
                transfer_date: transfer.transfer_date,
                fromSection: transfer.fromSection,
                toSection: transfer.toSection,
                from_section_code: transfer.from_section_code,
                to_section_code: transfer.to_section_code,
                notes: transfer.notes,
                items: [],
                totalQuantity: 0,
                totalValue: 0,
            };
        }
        acc[key].items.push(transfer);
        acc[key].totalQuantity += Number(transfer.quantity) || 0;
        acc[key].totalValue += (Number(transfer.quantity) || 0) * (Number(transfer.cost_price) || 0);
        return acc;
    }, {} as Record<string, {
        transfer_number?: string;
        transfer_date: string;
        fromSection: any;
        toSection: any;
        from_section_code: string;
        to_section_code: string;
        notes: string;
        items: StockTransfer[];
        totalQuantity: number;
        totalValue: number;
    }>);

    const transferGroups = Object.values(groupedTransfers);

    const totalTransfers = transferGroups.length;
    const totalQuantity = transferGroups.reduce((sum, group) => sum + group.totalQuantity, 0);
    const totalValue = transferGroups.reduce((sum, group) => sum + group.totalValue, 0);

    const handleDownloadPdf = async (transferId: number) => {
        try {
            const response = await fetch(`/stock-transfers/${transferId}/download-pdf`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download PDF');
            }

            // Create a blob and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stock-transfer-${transferId}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert(t('Failed to download PDF'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Stock Transfers')} />

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-white/20 p-2 shadow">
                                    <Truck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {t('Stock Transfers')}
                                    </h1>
                                    <p className="text-xs text-white/80">
                                        {t('Manage stock transfers between sections')}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/stock-transfers/create"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t('New Transfer')}
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue p-2 shadow-sm">
                                        <ArrowRightLeft className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Transfers')}</p>
                                        <p className="text-lg font-bold text-gray-900">{totalTransfers}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-orange-500 p-2 shadow-sm">
                                        <Package className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Quantity')}</p>
                                        <p className="text-lg font-bold text-gray-900">{totalQuantity.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-grey p-2 shadow-sm">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Total Value')}</p>
                                        <p className="text-lg font-bold text-gray-900">Rs. {totalValue.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-200">
                                <div className="flex items-center">
                                    <div className="rounded-lg bg-vismass-blue/60 p-2 shadow-sm">
                                        <Calendar className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-600">{t('Recent Transfers')}</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {transferGroups.filter(t => {
                                                const transferDate = new Date(t.transfer_date);
                                                const weekAgo = new Date();
                                                weekAgo.setDate(weekAgo.getDate() - 7);
                                                return transferDate >= weekAgo;
                                            }).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Card */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow overflow-hidden">
                            <div className="bg-gradient-to-r from-vismass-blue to-vismass-grey px-4 py-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                    <div>
                                        <h3 className="text-base font-semibold text-white">
                                            {t('Transfer History')}
                                        </h3>
                                        <p className="text-white/80 text-xs mt-0.5">
                                            {t('Browse and manage stock transfers')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                {/* Search Filter */}
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                                    <div className="max-w-sm">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            {t('Search')}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                placeholder={t('Transfer #, Notes, Item...')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full text-sm py-2 pl-9"
                                            />
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                {/* Transfer List */}
                                {/* Transfer List */}
                                <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('Transfer Number')}</TableHead>
                                                <TableHead>{t('From Section')}</TableHead>
                                                <TableHead>{t('To Section')}</TableHead>
                                                <TableHead className="text-right">{t('Total Value')}</TableHead>
                                                <TableHead className="text-right">{t('Action')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transferGroups.length > 0 ? (
                                                transferGroups.map((group) => (
                                                    <TableRow key={group.transfer_number || group.items[0].id}>
                                                        <TableCell className="font-medium">
                                                            {group.transfer_number || 'N/A'}
                                                            <div className="text-xs text-muted-foreground">
                                                                {new Date(group.transfer_date).toLocaleDateString()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span>{group.fromSection?.name || group.from_section_code}</span>
                                                                <span className="text-xs text-muted-foreground">{group.from_section_code}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span>{group.toSection?.name || group.to_section_code}</span>
                                                                <span className="text-xs text-muted-foreground">{group.to_section_code}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex flex-col">
                                                                <span>Rs. {group.totalValue.toFixed(2)}</span>
                                                                <span className="text-xs text-muted-foreground">{group.totalQuantity.toFixed(2)} units</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedTransfer(group);
                                                                    setIsViewModalOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                {t('View')}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                            <ArrowRightLeft className="h-8 w-8 mb-2 opacity-20" />
                                                            <p>{t('No transfers found')}</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <Pagination links={stockTransfers.links} meta={stockTransfers} />
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-6 border-t border-sky-200 bg-gradient-to-r from-white to-sky-50">
                    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <p className="text-xs text-gray-500">© VISMASS POS System • {t('Stock Transfer Management')} • v1.0.0</p>
                        </div>
                    </div>
                </footer>
            </div>

            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('Transfer Details')} - #{selectedTransfer?.transfer_number || 'N/A'}</DialogTitle>
                        <DialogDescription>
                            {selectedTransfer && (
                                <span>{new Date(selectedTransfer.transfer_date).toLocaleDateString()} • {selectedTransfer.items.length} item{selectedTransfer.items.length > 1 ? 's' : ''}</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTransfer && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <Button onClick={() => handleDownloadPdf(selectedTransfer.items[0].id)} className="bg-vismass-blue text-white hover:bg-vismass-blue/90">
                                    <Download className="mr-2 h-4 w-4" />
                                    {t('Download PDF')}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg bg-slate-50">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('From Section')}</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedTransfer.fromSection?.name || selectedTransfer.from_section_code}</p>
                                    <p className="text-xs text-gray-500">{selectedTransfer.from_section_code}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('To Section')}</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedTransfer.toSection?.name || selectedTransfer.to_section_code}</p>
                                    <p className="text-xs text-gray-500">{selectedTransfer.to_section_code}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Total Value')}</p>
                                    <p className="text-sm font-medium text-gray-900">Rs. {selectedTransfer.totalValue.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">{selectedTransfer.totalQuantity.toFixed(2)} units</p>
                                </div>
                            </div>

                            {selectedTransfer.notes && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Notes')}</p>
                                    <p className="text-sm text-gray-900 p-2 bg-slate-50 rounded border">{selectedTransfer.notes}</p>
                                </div>
                            )}

                            <div>
                                <h5 className="text-sm font-medium text-gray-900 mb-2">{t('Items Transferred')}</h5>
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>{t('Item')}</TableHead>
                                                <TableHead>{t('Batch')}</TableHead>
                                                <TableHead className="text-right">{t('Quantity')}</TableHead>
                                                <TableHead className="text-right">{t('Unit Cost')}</TableHead>
                                                <TableHead className="text-right">{t('Total')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedTransfer.items.map((item: any) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center">
                                                            <div className="ml-2">
                                                                <div className="text-sm text-gray-900">
                                                                    {item.item?.ItmNm}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {item.item?.ItemCode}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{item.batch_no || 'N/A'}</TableCell>
                                                    <TableCell className="text-right">{Number(item.quantity) || 0}</TableCell>
                                                    <TableCell className="text-right">Rs. {Number(item.cost_price).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">Rs. {((Number(item.quantity) || 0) * (Number(item.cost_price) || 0)).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}