import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { SaleItem } from '../Create';

interface PrintersListTableProps {
    data: any;
    removePrinter: (index: number) => void;
}

const PrintersListTable: React.FC<PrintersListTableProps> = ({
    data,
    removePrinter
}) => {
    // Filter items to show only printers (items with serial_number, brand, and model)
    const printers = data.items.filter((item: SaleItem) =>
        item.serial_number && item.brand && item.model
    );

    const formatPrice = (price: number) => {
        return `Rs ${price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Printers List</h2>
                </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-lg border border-green-200 max-h-64 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-green-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-green-700 font-semibold">Serial Number</th>
                            <th className="px-4 py-2 text-green-700 font-semibold">Printer Name / Model</th>
                            <th className="px-4 py-2 text-green-700 font-semibold">Warranty</th>
                            <th className="px-4 py-2 text-green-700 font-semibold text-right">Price</th>
                            <th className="px-4 py-2 text-green-700 font-semibold text-right">Discount</th>
                            <th className="px-4 py-2 text-green-700 font-semibold text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-green-100">
                        {printers.map((printer: SaleItem, idx: number) => {
                            // Find the actual index in the original items array
                            const originalIndex = data.items.findIndex((item: SaleItem) =>
                                item.serial_number === printer.serial_number &&
                                item.brand === printer.brand &&
                                item.model === printer.model
                            );

                            const vatRate = Number(data.vat_rate) || 0;
                            const multiplier = 1 + (vatRate / 100);

                            // Price calculation similar to items
                            const shouldAddVat = data.is_vat_invoice && !printer.vat_inclusive;
                            const displayPrice = shouldAddVat ? printer.unit_price * multiplier : printer.unit_price;

                            return (
                                <tr key={idx} className="hover:bg-green-50/50">
                                    <td className="px-4 py-2 font-medium">{printer.serial_number}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{printer.item_name}</span>
                                            <span className="text-sm text-gray-600">{printer.brand} {printer.model}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">{printer.warranty || 'N/A'}</td>
                                    <td className="px-4 py-2 text-right font-semibold">{formatPrice(Number(displayPrice))}</td>
                                    <td className="px-4 py-2 text-right font-semibold">{formatPrice(Number(printer.discount_amount))}</td>
                                    <td className="px-4 py-2 text-center">
                                        <Button variant="ghost" size="icon" onClick={() => removePrinter(originalIndex)} className="h-8 w-8">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                        {printers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                                    No printers added yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PrintersListTable;