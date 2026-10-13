import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CreditCard, Save, RefreshCcw, Receipt } from 'lucide-react';
import BillRePrintModal from './BillRePrintModal';

interface PaymentTotalsSectionProps {
    data: any;
    setData: (key: string, value: any) => void;
    processing: boolean;
    autoPrintEnabled: boolean;
    setAutoPrintEnabled: (enabled: boolean) => void;
    setIsMobilePreviewOpen: (open: boolean) => void;
    printReceipt: () => void;
    handleSave: (e: React.FormEvent) => void;
    handlePaymentModeChange: (mode: string) => void;
    cashPaymentRef: React.RefObject<HTMLInputElement | null>;
    cardPaymentRef: React.RefObject<HTMLInputElement | null>;
}

const PaymentTotalsSection: React.FC<PaymentTotalsSectionProps> = ({
    data,
    setData,
    processing,
    autoPrintEnabled,
    setAutoPrintEnabled,
    setIsMobilePreviewOpen,
    printReceipt,
    handleSave,
    handlePaymentModeChange,
    cashPaymentRef,
    cardPaymentRef
}) => {
    // Check if customer is registered (not the default '0001' cash customer)
    const isRegisteredCustomer = data.customer_code && data.customer_code !== '0001';
    const [isBillRePrintModalOpen, setIsBillRePrintModalOpen] = useState(false);

    return (
        <div className="space-y-2 pt-4 border-t-2 border-blue-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Payment Inputs Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 flex items-center">
                            <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
                            Payment Mode
                        </Label>
                        <div className="flex flex-wrap gap-4 p-2 bg-white/50 backdrop-blur-sm rounded-lg border border-blue-200">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="payment_mode"
                                    value="cash"
                                    checked={data.payment_mode === 'cash'}
                                    onChange={() => handlePaymentModeChange('cash')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-400"
                                />
                                <span className="text-xs font-medium">Cash</span>
                            </label>
                            <label className={`flex items-center space-x-2 ${!isRegisteredCustomer ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input
                                    type="radio"
                                    name="payment_mode"
                                    value="credit"
                                    checked={data.payment_mode === 'credit'}
                                    onChange={() => isRegisteredCustomer && handlePaymentModeChange('credit')}
                                    disabled={!isRegisteredCustomer}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-400"
                                />
                                <span className="text-xs font-medium">Credit</span>
                                {!isRegisteredCustomer && (
                                    <span className="text-[10px] text-orange-600 font-normal">(Requires registered customer)</span>
                                )}
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="payment_mode"
                                    value="card"
                                    checked={data.payment_mode === 'card'}
                                    onChange={() => handlePaymentModeChange('card')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-400"
                                />
                                <span className="text-xs font-medium">Card</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="cash_payment" className="text-xs font-medium text-gray-700">Cash Payment</Label>
                            <Input
                                ref={cashPaymentRef}
                                id="cash_payment"
                                type="number"
                                value={data.cash_payment}
                                onChange={(e) => setData('cash_payment', Number(e.target.value))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSave(e as any);
                                    }
                                }}
                                className="h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="card_payment" className="text-xs font-medium text-gray-700">Credit Card</Label>
                            <Input
                                ref={cardPaymentRef}
                                id="card_payment"
                                type="number"
                                value={data.card_payment}
                                onChange={(e) => setData('card_payment', Number(e.target.value))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSave(e as any);
                                    }
                                }}
                                className="h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="discount_amount" className="text-xs font-medium text-gray-700">Discount Amount</Label>
                            <Input
                                id="discount_amount"
                                type="number"
                                value={data.discount_amount}
                                onChange={(e) => setData('discount_amount', Number(e.target.value))}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                className="h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 p-2 bg-blue-50/50 rounded-lg border border-blue-200">
                        <input
                            type="checkbox"
                            id="auto-print"
                            checked={autoPrintEnabled}
                            onChange={(e) => setAutoPrintEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-400"
                        />
                        <Label htmlFor="auto-print" className="text-xs cursor-pointer">
                            Auto-print receipt after saving
                        </Label>
                    </div>
                </div>

                {/* Order Summary Section */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2">Order Summary</h3>

                        {data.is_vat_invoice && (
                            <div className="flex justify-between text-[10px] text-green-600 font-bold bg-green-50 p-1 rounded mb-2">
                                <span>VAT Status:</span>
                                <span>VAT INVOICE</span>
                            </div>
                        )}

                        {!isRegisteredCustomer && (
                            <div className="flex justify-between text-[10px] text-orange-600 font-bold bg-orange-50 p-1 rounded mb-2">
                                <span>Payment Restriction:</span>
                                <span>Partial payments require registered customer</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Subtotal:</span>
                                <span className="font-medium">{Number(data.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Discount:</span>
                                <span className="font-medium text-red-600">-{Number(data.total_discount || 0).toFixed(2)}</span>
                            </div>
                            {data.is_vat_invoice && (
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>VAT ({data.vat_rate}%):</span>
                                    <span className="font-medium text-green-600">{Number(data.tax_amount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-blue-800 border-t border-blue-200 pt-2">
                                <span>Total:</span>
                                <span>{Number(data.total_amount).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-sm font-semibold text-blue-600">
                                <span>Balance:</span>
                                <span>{Number(data.balance_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 font-medium"
                            disabled={processing || data.items.length === 0}
                            onClick={handleSave}
                        >
                            {processing ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-sm">Processing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Save className="w-4 h-4" />
                                    <span className="text-sm">Save Sale (F11)</span>
                                </div>
                            )}
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <Button type="button" variant="outline" size="sm" className="text-[11px] h-9" onClick={() => setIsMobilePreviewOpen(true)}>
                                <RefreshCcw className="w-3 h-3 mr-1.5" />
                                Receipt
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="text-[11px] h-9">
                                <Receipt className="w-3 h-3 mr-1.5" />
                                Cheque
                            </Button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full text-sm"
                            onClick={() => setIsBillRePrintModalOpen(true)}
                        >
                            Bill Re Print
                        </Button>
                    </div>
                </div>
            </div>

            <BillRePrintModal
                isOpen={isBillRePrintModalOpen}
                onClose={() => setIsBillRePrintModalOpen(false)}
            />
        </div>
    );
};

export default PaymentTotalsSection;