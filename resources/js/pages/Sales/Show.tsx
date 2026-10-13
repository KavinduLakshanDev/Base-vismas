import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaleItem {
    id: number;
    item_code: string;
    item_name: string;
    unit_price: string | number;
    our_price: string | number;
    quantity: string | number;
    line_total: string | number;
}

interface Sale {
    id: number;
    invoice_no: string;
    transaction_date: string;
    customer_name: string;
    customer_code: string;
    total_amount: string | number;
    subtotal: string | number;
    discount_amount: string | number;
    tax_amount: string | number;
    payment_details: any;
    status: string;
    items: SaleItem[];
}

const Show: React.FC<{ sale: Sale }> = ({ sale }) => {
    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Sales'), href: '/sales' },
        { title: sale.invoice_no, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('Invoice')} ${sale.invoice_no}`} />
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/sales">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('Back to List')}
                        </Button>
                    </Link>
                    <Button onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        {t('Print Invoice')}
                    </Button>
                </div>

                <div className="bg-card rounded-lg border p-8 space-y-8 print:border-0 print:p-0">
                    <div className="flex justify-between">
                        <div>
                            <h2 className="text-3xl font-bold uppercase">{t('Invoice')}</h2>
                            <p className="text-muted-foreground">{sale.invoice_no}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">{t('Date')}: {sale.transaction_date}</p>
                            <p>{t('Status')}: <span className="uppercase">{t(sale.status)}</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-muted-foreground uppercase text-xs mb-2">{t('Customer')}</h3>
                            <p className="font-bold">{sale.customer_name}</p>
                            <p>{sale.customer_code}</p>
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="py-2">{t('Item')}</th>
                                <th className="py-2 text-right">{t('Price')}</th>
                                <th className="py-2 text-center">{t('Qty')}</th>
                                <th className="py-2 text-right">{t('Total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sale.items.map(item => (
                                <tr key={item.id}>
                                    <td className="py-3">
                                        <div className="font-medium">{item.item_name}</div>
                                        <div className="text-xs text-muted-foreground">{item.item_code}</div>
                                    </td>
                                    <td className="py-3 text-right">{Number(item.unit_price).toFixed(2)}</td>
                                    <td className="py-3 text-center">{item.quantity}</td>
                                    <td className="py-3 text-right">{Number(item.line_total).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t font-bold">
                                <td colSpan={3} className="py-4 text-right uppercase text-xs">{t('Subtotal')}</td>
                                <td className="py-4 text-right">{Number(sale.subtotal).toFixed(2)}</td>
                            </tr>
                            {Number(sale.discount_amount) > 0 && (
                                <tr className="text-destructive font-bold">
                                    <td colSpan={3} className="py-1 text-right uppercase text-xs">{t('Discount')}</td>
                                    <td className="py-1 text-right">-{Number(sale.discount_amount).toFixed(2)}</td>
                                </tr>
                            )}
                            <tr className="border-t text-xl font-black">
                                <td colSpan={3} className="py-4 text-right uppercase">{t('Total')}</td>
                                <td className="py-4 text-right underline underline-offset-4">{Number(sale.total_amount).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
};

export default Show;
