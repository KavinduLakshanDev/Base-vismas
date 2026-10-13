import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import {
    Package,
    User,
    Calendar,
    DollarSign,
    Plus,
    Search,
    X,
    Save,
    Trash2,
    Barcode,
    RefreshCcw,
    ShoppingCart,
    CreditCard,
    Receipt,
    Pencil,
    Crown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import PrivilegeAccessModal from './components/PrivilegeAccessModal';
import BatchSelectionModal from './components/BatchSelectionModal';
import SaleInformationForm from './components/SaleInformationForm';
import PriceTypeSelector from './components/PriceTypeSelector';
import EntryModeToggle from './components/EntryModeToggle';
import ItemEntryForm from './components/ItemEntryForm';
import PrinterEntryForm from './components/PrinterEntryForm';
import ItemsListTable from './components/ItemsListTable';
import PrintersListTable from './components/PrintersListTable';
import PaymentTotalsSection from './components/PaymentTotalsSection';

export interface SaleItem {
    item_code: string;
    item_name: string;
    unit_price: number;
    our_price: number;
    cost_price: number;
    quantity: number;
    free_quantity: number;
    total: number;
    discount_amount?: number;
    stock?: number;
    retail_price: number;
    wholesale_price: number;
    extra_price: number;
    card_price?: number;
    batch_no?: string | null;
    itm_ky?: number;
    serial_number?: string;
    brand?: string;
    model?: string;
    warranty?: string;
    barcode?: string;
    category?: string;
    unit?: string;
    vat_inclusive?: boolean;
    // Quantity-based discount tiers
    tier1_qty?: number | null;
    tier1_discount?: number | null;
    tier2_qty?: number | null;
    tier2_discount?: number | null;
    tier3_qty?: number | null;
    tier3_discount?: number | null;
    tier4_qty?: number | null;
    tier4_discount?: number | null;
}

interface Customer {
    code: string;
    name: string;
    is_vat_registered?: boolean;
    vat_no?: string;
}

export interface ItemMaster {
    item_code: string;
    item_name: string;
    unit_price: number;
    cost_price: number;
    retail_price: number;
    wholesale_price: number;
    extra_price: number;
    card_price?: number;
    stock: number;
    barcode: string;
    batch_no?: string | null;
    itm_ky?: number;
    serial_number?: string;
    brand?: string;
    model?: string;
    warranty?: string;
    category?: string;
    unit?: string;
    vat_inclusive?: boolean;
    // Quantity-based discount tiers
    tiers?: {
        tier1?: { qty: number | null; discount: number | null };
        tier2?: { qty: number | null; discount: number | null };
        tier3?: { qty: number | null; discount: number | null };
        tier4?: { qty: number | null; discount: number | null };
    };
}

const QuickReceiptPreview = ({ data, companyInfo, selectedCustomer, cashierName }: any) => {
    const vatRate = Number(data.vat_rate) || 0;
    const vatMultiplier = 1 + (vatRate / 100);
    const dateStr = new Date().toLocaleString();

    return (
        <div className="bg-white border rounded-lg shadow-inner p-4 font-mono text-[11px] leading-tight text-black max-w-[300px] mx-auto overflow-hidden">
            <div className="text-center mb-4">
                <img
                    src="https://www.vismass.lk/wp-content/uploads/2023/12/vismass.png"
                    alt="Logo"
                    className="h-16 mx-auto mb-2 object-contain"
                />
                <h2 className="text-xl font-bold uppercase">{companyInfo.name}</h2>
                <p className="text-[10px] mb-1">{companyInfo.address}</p>
                <div className="h-2"></div>
                <p>Tel: {companyInfo.phone}</p>
                <div className="h-2"></div>
                <div className="text-left font-bold text-sm uppercase">
                    SALES RECEIPT
                </div>
            </div>

            <div className="mb-4 space-y-2">
                <div className="flex justify-between">
                    <span className="font-normal">Date:</span>
                    <span className="font-normal">{dateStr}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-normal">Invoice No:</span>
                    <span className="font-normal">{data.invoice_no}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-normal">Cashier:</span>
                    <span className="font-normal">{cashierName || 'Admin'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-normal">Customer:</span>
                    <span className="font-normal">{data.customer_name || 'Walk-in Customer'}</span>
                </div>
            </div>

            <table className="w-full mb-4">
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="text-left font-bold pb-1 text-[10px]">Item</th>
                        <th className="text-right font-bold pb-1 text-[10px]">Qty</th>
                        <th className="text-right font-bold pb-1 text-[10px]">Price</th>
                        <th className="text-right font-bold pb-1 text-[10px]">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item: any, idx: number) => (
                        <React.Fragment key={idx}>
                            <tr>
                                <td colSpan={4} className="pt-1">
                                    {item.item_name.substring(0, 30)}
                                    {item.batch_no && <span className="text-[9px] block">Batch: {item.batch_no}</span>}
                                </td>
                            </tr>
                            {item.warranty && (
                                <tr>
                                    <td colSpan={4} className="text-[9px] text-gray-600 pl-1">
                                        Warranty: {item.warranty}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td></td>
                                <td className="text-right">{item.quantity}</td>
                                <td className="text-right">{(item.unit_price * vatMultiplier).toFixed(2)}</td>
                                <td className="text-right">{(item.total * vatMultiplier).toFixed(2)}</td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                    <span className="font-normal uppercase">SUBTOTAL:</span>
                    <span className="font-normal">{Number(data.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-normal uppercase">DISCOUNT:</span>
                    <span className="font-normal">-{(Number(data.discount_amount || 0)).toFixed(2)}</span>
                </div>
                {data.is_vat_invoice && (
                    <div className="flex justify-between">
                        <span className="font-normal uppercase">VAT ({vatRate}%):</span>
                        <span className="font-normal">{Number(data.tax_amount).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="font-bold uppercase">TOTAL:</span>
                    <span className="font-bold text-sm">{Number(data.total_amount).toFixed(2)}</span>
                </div>
            </div>

            <div className="space-y-2 mb-4 uppercase">
                <div className="flex justify-between">
                    <span>Pay Mode:</span>
                    <span>{data.payment_mode}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cash Paid:</span>
                    <span>{(Number(data.cash_payment) || Number(data.total_amount)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Balance:</span>
                    <span>{Number(data.balance_amount).toFixed(2)}</span>
                </div>
            </div>

            {data.is_vat_invoice && (
                <div className="mt-2 text-[10px] space-y-1 pt-2 uppercase border-t border-dashed border-black">
                    <div className="flex justify-between">
                        <span>VAT Rate:</span>
                        <span>{vatRate}%</span>
                    </div>
                    {companyInfo.vat_no && (
                        <div className="flex justify-between">
                            <span>Company VAT:</span>
                            <span>{companyInfo.vat_no}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Customer VAT:</span>
                        <span>{selectedCustomer?.vat_no || ''}</span>
                    </div>
                </div>
            )}

            <div className="text-center mt-4 text-[10px]">
                Thank you for your business!<br />
                *** Powered by UNITEC ***
            </div>
        </div>
    );
};


interface VatRateInfo {
    vat_rate: number;
    vat_no: string;
}

const Create: React.FC<{ nextInvoiceNo: string; currentDate: string }> = ({ nextInvoiceNo, currentDate }) => {
    const { auth } = usePage<any>().props;
    const { data, setData, post, processing, errors } = useForm({
        invoice_no: nextInvoiceNo,
        transaction_date: currentDate,
        customer_code: '0001',
        customer_name: 'cash',
        customer_vat_no: '',
        is_vat_invoice: false,
        vat_rate: 0,
        price_type: 'retail',
        items: [] as SaleItem[],
        payment_mode: 'cash',
        subtotal: 0,
        discount_amount: 0,
        total_discount: 0,
        tax_amount: 0,
        total_amount: 0,
        cash_payment: '',
        card_payment: '',
        balance_amount: '',
    });

    const [itemInput, setItemInput] = useState({
        code: '',
        name: '',
        price: 0,
        quantity: 1,
        barcode: '',
        serial_number: ''
    });

    const [batchInput, setBatchInput] = useState('');

    const [selectedItem, setSelectedItem] = useState<ItemMaster | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isPrivilegeModalOpen, setIsPrivilegeModalOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isCustomerCreateDialogOpen, setIsCustomerCreateDialogOpen] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [items, setItems] = useState<ItemMaster[]>([]);
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Batch Selection Logic
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchCandidates, setBatchCandidates] = useState<ItemMaster[]>([]);

    // Printer states
    const [entryMode, setEntryMode] = useState<'item' | 'printer'>('item');
    const [printerSearch, setPrinterSearch] = useState('');
    const [printers, setPrinters] = useState<any[]>([]);
    const [isPrinterDialogOpen, setIsPrinterDialogOpen] = useState(false);

    const [editingQuantity, setEditingQuantity] = useState<{ index: number; quantity: number } | null>(null);
    const [editingDiscount, setEditingDiscount] = useState<{ index: number; discount: number } | null>(null);

    const [customerForm, setCustomerForm] = useState({
        name: '',
        phone: '',
        email: '',
        is_vat_registered: false,
        vat_no: ''
    });
    const [customerFormErrors, setCustomerFormErrors] = useState<{ [key: string]: string }>({});
    const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [companyVatInfo, setCompanyVatInfo] = useState<VatRateInfo | null>(null);
    const [companyInfo, setCompanyInfo] = useState({
        name: 'VISMASS PVT LTD',
        address: '32, Ground Floor, Yakkala Park, Kandy Road, Yakkala.',
        phone: '0332234300',
        vat_no: ''
    });
    const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCardPriceConfirmation, setShowCardPriceConfirmation] = useState(false);

    const itemCodeRef = useRef<HTMLInputElement>(null);
    const quantityRef = useRef<HTMLInputElement>(null);
    const plusButtonRef = useRef<HTMLButtonElement>(null);
    const cashPaymentRef = useRef<HTMLInputElement>(null);
    const cardPaymentRef = useRef<HTMLInputElement>(null);

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(() => {
                // Fullscreen request failed
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    setIsFullscreen(false);
                }).catch(() => {
                    // Exit fullscreen failed
                });
                
            }
        }
    };

    const [allVatRates, setAllVatRates] = useState<any[]>([]);

    // Fetch VAT & Company Info
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch VAT Info
                const vatsRes = await axios.get('/company/vat-rates');
                setAllVatRates(vatsRes.data);

                // Set initial active rate based on current transaction date (defaults to today)
                const currentTransactionDate = data.transaction_date || new Date().toISOString().split('T')[0];
                const activeRate = vatsRes.data.find((r: any) => {
                    // Check if date falls within range
                    const effDate = r.effective_date.split('T')[0]; // assuming ISO string or YYYY-MM-DD
                    const endDate = r.end_date ? r.end_date.split('T')[0] : null;

                    return currentTransactionDate >= effDate && (!endDate || currentTransactionDate <= endDate);
                });

                // If multiple matches (unlikely given how we sort/filter, but let's safe guard to pick most recent effective),
                // we should probably sort the list first or trust find to pick first if sorted.
                // The controller returns sorted by effective_date desc. So first match is the correct one.

                if (activeRate) {
                    setCompanyVatInfo({
                        vat_rate: activeRate.vat_rate,
                        vat_no: activeRate.vat_no
                    });
                    setData(prev => ({ ...prev, vat_rate: activeRate.vat_rate }));
                    setCompanyInfo(prev => ({ ...prev, vat_no: activeRate.vat_no }));
                }

                // Fetch Company Info
                try {
                    const companyRes = await axios.get('/api/company-data'); // Just in case we add it
                    if (companyRes.data) {
                        setCompanyInfo({
                            name: companyRes.data.company_name || companyRes.data.name,
                            address: companyRes.data.address,
                            phone: companyRes.data.phone,
                            vat_no: activeRate?.vat_no || companyRes.data.vat_no || ''
                        });
                    }
                } catch (e) { /* ignore */ }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        fetchInitialData();
    }, []);

    // Update VAT rate when transaction date changes
    useEffect(() => {
        if (allVatRates.length > 0 && data.transaction_date) {
            const currentTransactionDate = data.transaction_date;

            // Controller returns orderBy('effective_date', 'desc')
            const applicableRate = allVatRates.find((r: any) => {
                const effDate = new Date(r.effective_date).toISOString().split('T')[0];
                const endDate = r.end_date ? new Date(r.end_date).toISOString().split('T')[0] : null;

                return currentTransactionDate >= effDate && (!endDate || currentTransactionDate <= endDate);
            });

            if (applicableRate) {
                setData(prev => ({
                    ...prev,
                    vat_rate: applicableRate.vat_rate
                }));
                // Also update company VAT info for display if needed
                setCompanyVatInfo({
                    vat_rate: applicableRate.vat_rate,
                    vat_no: applicableRate.vat_no
                });
            }
        }
    }, [data.transaction_date, allVatRates]);

    // Focus item code field on component mount
    useEffect(() => {
        if (itemCodeRef.current) {
            itemCodeRef.current.focus();
        }
    }, []);

    const resetForm = useCallback(() => {
        // Reset form data
        setData({
            invoice_no: nextInvoiceNo,
            transaction_date: currentDate,
            customer_code: '0001',
            customer_name: 'cash',
            customer_vat_no: '',
            is_vat_invoice: false,
            vat_rate: 0,
            price_type: 'retail',
            items: [],
            payment_mode: 'cash',
            subtotal: 0,
            discount_amount: 0,
            total_discount: 0,
            tax_amount: 0,
            total_amount: 0,
            cash_payment: '',
            card_payment: '',
            balance_amount: '',
        });

        // Reset component states
        setItemInput({ code: '', name: '', price: 0, quantity: 1, barcode: '', serial_number: '' });
        setBatchInput('');
        setSelectedItem(null);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setCustomers([]);
        setItemSearch('');
        setItems([]);
        setPrinterSearch('');
        setPrinters([]);
        setEditingQuantity(null);
        setEditingDiscount(null);
        setCompanyVatInfo(null);
        setBatchCandidates([]);
        setEntryMode('item');

        // Reset fullscreen if active
        if (isFullscreen) {
            toggleFullscreen();
        }

        // Refresh the page to get new invoice number and current date
        window.location.reload();
    }, [nextInvoiceNo, currentDate, isFullscreen]);

    // Focus item code field after reset
    const focusItemCode = () => {
        setTimeout(() => {
            if (itemCodeRef.current) {
                itemCodeRef.current.focus();
            }
        }, 100); // Small delay to ensure DOM is ready
    };

    // Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                setData('price_type', 'retail');
            } else if (e.key === 'F2') {
                e.preventDefault();
                setData('price_type', 'wholesale');
            } else if (e.key === 'F3') {
                e.preventDefault();
                setData('price_type', 'extra');
            } else if (e.key === 'F7' || (e.ctrlKey && e.key === 's')) {
                e.preventDefault();
                // handleSave();
            } else if (e.key === 'F10') {
                e.preventDefault();
                if (window.confirm('Are you sure you want to reset the entire form? This will clear all entered data.')) {
                    resetForm();
                }
            } else if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            } else if (e.key === '+') {
                e.preventDefault();
                if (showCardPriceConfirmation) {
                    // If card confirmation dialog is showing, focus card payment
                    cardPaymentRef.current?.focus();
                } else if (data.payment_mode === 'cash' || data.payment_mode === 'credit') {
                    cashPaymentRef.current?.focus();
                } else if (data.payment_mode === 'card') {
                    cardPaymentRef.current?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data.price_type, data.payment_mode, showCardPriceConfirmation, resetForm]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [data.items, data.cash_payment, data.card_payment, data.discount_amount, data.is_vat_invoice, data.vat_rate]);

    // Update item price when price type or payment mode changes
    useEffect(() => {
        if (selectedItem) {
            const price = getCurrentPrice(selectedItem);
            setItemInput(prev => ({
                ...prev,
                price: price
            }));
        }
    }, [data.price_type, data.payment_mode, selectedItem]);

    // Update all items in table when price type or payment mode changes - REMOVED per user request
    // The user wants price type changes to ONLY affect the item currently being entered (in ItemEntryForm).
    // Once an item is added to the list, its price should remain fixed unless manually edited or if payment mode changes (if desired, though user said "no need to change the prices in the Item").
    // However, we might still want to update if PAYMENT MODE changes to CARD if card prices are different?
    // The user specifically said "after added this to the Item List table no need to change the prices in the Item".
    // So we completely remove this auto-update effect.
    /*
    useEffect(() => {
        if (data.items.length > 0) {
            const updatedItems = data.items.map(item => {
                const newPrice = getCurrentPrice(item);
                return {
                    ...item,
                    unit_price: newPrice,
                    our_price: newPrice,
                    total: newPrice * item.quantity
                };
            });
            setData('items', updatedItems);
        }
    }, [data.price_type, data.payment_mode]);
    */

    // Clear forms when switching modes
    useEffect(() => {
        if (entryMode === 'printer') {
            resetItemInput();
        } else if (entryMode === 'item') {
            setPrinterSearch('');
            setPrinters([]);
        }
    }, [entryMode]);

    const calculateTotals = () => {
        const vatRate = Number(data.vat_rate) || 0;
        const manualDiscount = Number(data.discount_amount) || 0;
        const vatRateDecimal = vatRate / 100;

        let itemsNetTotal = 0;
        let vatInclusiveTotal = 0;
        let vatExclusiveTotal = 0;
        let itemLevelDiscounts = 0;

        // Separate VAT-inclusive and VAT-exclusive items and sum item-level discounts
        data.items.forEach(item => {
            // Add item-level discount to total
            itemLevelDiscounts += Number(item.discount_amount || 0);
            
            if (item.vat_inclusive && data.is_vat_invoice) {
                // Price already includes VAT - will extract net amount
                vatInclusiveTotal += item.total;
            } else {
                // Price excludes VAT
                vatExclusiveTotal += item.total;
            }
        });

        // Total discount = item-level discounts + manual discount
        const totalDiscount = itemLevelDiscounts + manualDiscount;

        // Calculate net amounts
        // For VAT-inclusive items: Reverse calculation
        // Subtotal = Total / (1 + VAT_rate)
        // Example: 58000 / 1.18 = 49152.54
        const netFromInclusive = vatInclusiveTotal / (1 + vatRateDecimal);
        const netFromExclusive = vatExclusiveTotal;
        itemsNetTotal = netFromInclusive + netFromExclusive;

        // Apply manual discount to net total (item discounts already applied in item.total)
        const netAfterDiscount = itemsNetTotal - manualDiscount;

        // Calculate VAT and final total
        let tax_amount = 0;
        let total = 0;

        if (data.is_vat_invoice) {
            // VAT from inclusive items: subtotal * VAT_rate
            // Example: 49152.54 × 0.18 = 8847.46
            const vatFromInclusive = netFromInclusive * vatRateDecimal;
            // VAT to be added on exclusive items
            const vatFromExclusive = (netFromExclusive - (manualDiscount * (netFromExclusive / (itemsNetTotal || 1)))) * vatRateDecimal;

            tax_amount = vatFromInclusive + vatFromExclusive;
            // Total = vatInclusiveTotal (unchanged) + vatExclusiveTotal + VAT on exclusive - manual discount
            total = vatInclusiveTotal + vatExclusiveTotal + vatFromExclusive - manualDiscount;
        } else {
            // No VAT invoice - use original totals
            total = vatInclusiveTotal + vatExclusiveTotal - manualDiscount;
        }

        const paid = Number(data.cash_payment) + Number(data.card_payment);

        setData(prev => ({
            ...prev,
            subtotal: itemsNetTotal,
            tax_amount: tax_amount,
            total_amount: total,
            balance_amount: String(paid - total),
            total_discount: totalDiscount  // Add total discount to data
        }));
    };

    const getCurrentPrice = (item: any) => {
        // Prioritize explicit price types
        if (data.price_type === 'retail') return item.retail_price;
        if (data.price_type === 'wholesale') return item.wholesale_price;
        if (data.price_type === 'extra') return item.extra_price;
        if (data.price_type === 'card' || (data.payment_mode === 'card' && data.price_type === 'card')) {
            return item.card_price || item.retail_price;
        }

        // For VAT inclusive items, price is usually fixed to retail (MRP)
        if (item.vat_inclusive) {
            return item.retail_price;
        }

        // Default to retail price
        return item.retail_price;
    };

    const handlePrivilegeCustomerSelect = (customer: any) => {
        setData(prev => ({
            ...prev,
            customer_code: customer.customer_code,
            customer_name: customer.name,
            price_type: 'wholesale'
        }));

        setSelectedCustomer({
            code: customer.customer_code,
            name: customer.name,
            is_vat_registered: false,
            vat_no: ''
        });

        // Try to fetch more details if available in local DB
        fetchCustomerByCode(customer.customer_code);

        // Close the modal
        setIsPrivilegeModalOpen(false);
    };

    const fetchCustomerByCode = async (code: string) => {
        if (!code || code === '0001') return; // Skip for default/empty
        try {
            const res = await axios.get(`/sales/search/customers?query=${code}&type=customer`);
            if (res.data.length > 0) {
                const c = res.data[0];
                setData(prev => ({
                    ...prev,
                    customer_code: c.code,
                    customer_name: c.name,
                    customer_vat_no: c.vat_no || '',
                    is_vat_invoice: !!c.is_vat_registered,
                    vat_rate: c.is_vat_registered ? (companyVatInfo?.vat_rate || prev.vat_rate) : prev.vat_rate
                }));
                setSelectedCustomer(c);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const searchItems = async (query: string) => {
        if (!query) {
            setItems([]);
            setIsDropdownOpen(false);
            return;
        }
        try {
            const res = await axios.get(`/sales/search/items?query=${query}`);
            if (res.data.length > 0) {
                setItems(res.data);
                setIsDropdownOpen(true);
            } else {
                setItems([]);
                setIsDropdownOpen(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Item Selection from dropdown
    const selectItem = (item: ItemMaster) => {
        setSelectedItem(item);
        const price = getCurrentPrice(item);
        setItemInput({
            ...itemInput,
            code: item.item_code,
            name: item.item_name,
            price: price,
            barcode: item.barcode,
            serial_number: item.serial_number || ''
        });
        setItems([]);
        setIsItemDialogOpen(false);
    };

    // Handle payment mode changes with confirmation for card payment
    const handlePaymentModeChange = (newMode: string) => {
        if (newMode === 'card' && data.items.length > 0) {
            setShowCardPriceConfirmation(true);
        } else {
            setData('payment_mode', newMode);
        }
    };

    // Apply card prices to all items
    const applyCardPrices = () => {
        setData('payment_mode', 'card');
        setShowCardPriceConfirmation(false);
    };

    // Cancel card price application
    const cancelCardPrices = () => {
        setShowCardPriceConfirmation(false);
    };

    const searchItemByBatch = async (batch: string) => {
        if (!batch) return;
        try {
            const res = await axios.get(`/sales/search/items?query=${batch}`);
            if (res.data.length > 0) {
                // Find item with matching batch_no
                const item = res.data.find((i: any) => i.batch_no === batch && i.stock > 0);
                if (item) {
                    setSelectedItem(item);
                    const price = getCurrentPrice(item);
                    setItemInput({
                        ...itemInput,
                        code: item.item_code,
                        name: item.item_name,
                        price: price,
                        barcode: item.barcode,
                        serial_number: item.serial_number || ''
                    });
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const searchItemsForDialog = async (query: string) => {
        // This function seems unused or redundant with our new searchItems logic.
        // Alternative search function for dialog usage
        if (!query) {
            setItems([]);
            return;
        }
        try {
            const res = await axios.get(`/sales/search/items?query=${query}`);
            setItems(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const searchPrinters = async (query: string) => {
        if (!query) {
            setPrinters([]);
            return;
        }
        try {
            console.log('Searching for printers with query:', query);
            const res = await axios.get(`/sales/search/printers?query=${query}`);
            console.log('Printer search response:', res.data);

            if (res.data.length === 0) {
                // No printers found
                setPrinters([]);
                setIsPrinterDialogOpen(true); // Show dialog with no results message
            } else if (res.data.length === 1 && entryMode === 'printer' && !isPrinterDialogOpen) {
                // Single result - auto-add for direct entry
                const printer = res.data[0];
                console.log('Auto-adding single printer:', printer);
                addPrinter(printer);
            } else {
                // Multiple results - show selection dialog
                setPrinters(res.data);
                setIsPrinterDialogOpen(true);
            }
        } catch (err) {
            console.error('Error searching printers:', err);
            // Show user-friendly error message
            alert('Error searching for printers. Please try again.');
        }
    };

    const addPrinter = (printer: any) => {
        // Check if this exact serial number is already added
        const existingPrinterWithSameSerial = data.items.findIndex(
            item => item.serial_number && item.serial_number === printer.serial_number
        );

        if (existingPrinterWithSameSerial !== -1) {
            toast.error('Duplicate Printer Detected', {
                description: `Printer with serial number ${printer.serial_number} is already added to this sale.`,
            });
            setPrinterSearch('');
            setPrinters([]);
            setIsPrinterDialogOpen(false);
            return;
        }

        // Add printer to the sale
        const price = getCurrentPrice(printer);

        // Apply customer discount if available
        let discountAmount = 0;
        if (printer.cus_discount_rate && printer.cus_discount_rate > 0) {
            discountAmount = (price * printer.cus_discount_rate) / 100;
        }

        const tiers = printer.tiers || {};

        const newItem: SaleItem = {
            item_code: printer.item_code,
            item_name: printer.item_name,
            unit_price: price,
            our_price: price,
            cost_price: printer.cost_price,
            quantity: 1,
            free_quantity: 0,
            total: price - discountAmount,
            discount_amount: discountAmount,
            stock: printer.stock,
            retail_price: printer.retail_price,
            wholesale_price: printer.wholesale_price,
            extra_price: printer.extra_price,
            card_price: printer.card_price,
            batch_no: printer.batch_no,
            itm_ky: printer.itm_ky,
            serial_number: printer.serial_number,
            brand: printer.brand,
            model: printer.model,
            warranty: printer.warranty,
            barcode: printer.barcode,
            category: printer.category,
            unit: printer.unit,
            vat_inclusive: printer.vat_inclusive || false,
            // Store tier information for future quantity changes
            tier1_qty: tiers.tier1?.qty,
            tier1_discount: tiers.tier1?.discount,
            tier2_qty: tiers.tier2?.qty,
            tier2_discount: tiers.tier2?.discount,
            tier3_qty: tiers.tier3?.qty,
            tier3_discount: tiers.tier3?.discount,
            tier4_qty: tiers.tier4?.qty,
            tier4_discount: tiers.tier4?.discount,
        };

        setData('items', [...data.items, newItem]);
        setPrinterSearch('');
        setPrinters([]);
        setIsPrinterDialogOpen(false);
    };

    const addItem = () => {
        if (!itemInput.code || !selectedItem) return;

        // Check if item is out of stock completely
        if (selectedItem.stock <= 0) {
            toast.error('Item Out of Stock', {
                description: `This item (${selectedItem.item_name}) has no available stock.`
            });
            return;
        }

        // Check against input quantity vs stock for new addition
        if (itemInput.quantity > selectedItem.stock) {
            toast.error('Insufficient Stock', {
                description: `Only ${selectedItem.stock} items available. You entered ${itemInput.quantity}.`
            });
            return;
        }

        // Check if item already exists by item_code and batch_no
        const existingIndex = data.items.findIndex(item => item.item_code === itemInput.code && item.batch_no === selectedItem.batch_no);

        if (existingIndex >= 0) {
            // Check if adding more quantity exceeds stock
            const currentQuantity = data.items[existingIndex].quantity;
            const newQuantity = currentQuantity + itemInput.quantity;

            if (newQuantity > selectedItem.stock) {
                toast.error('Insufficient Stock', {
                    description: `Only ${selectedItem.stock} items available across this batch. Your cart already has ${currentQuantity}.`
                });
                return;
            }

            // Use updateQuantity to properly recalculate discount
            updateQuantity(existingIndex, newQuantity);
        } else {
            // Calculate initial discount based on quantity
            const quantity = itemInput.quantity;
            let discountAmount = 0;
            const tiers = selectedItem.tiers || {};
            const tierArray = [
                { qty: tiers.tier4?.qty, discount: tiers.tier4?.discount },
                { qty: tiers.tier3?.qty, discount: tiers.tier3?.discount },
                { qty: tiers.tier2?.qty, discount: tiers.tier2?.discount },
                { qty: tiers.tier1?.qty, discount: tiers.tier1?.discount },
            ];

            for (const tier of tierArray) {
                if (tier.qty !== null && tier.qty !== undefined &&
                    quantity >= tier.qty &&
                    tier.discount !== null && tier.discount !== undefined &&
                    tier.discount > 0) {
                    discountAmount = tier.discount * quantity;
                    break;
                }
            }

            // Add new item
            const newItem: SaleItem = {
                item_code: itemInput.code,
                item_name: itemInput.name,
                unit_price: itemInput.price,
                our_price: itemInput.price,
                cost_price: selectedItem.cost_price,
                quantity: itemInput.quantity,
                free_quantity: 0,
                total: (itemInput.price * itemInput.quantity) - discountAmount,
                discount_amount: discountAmount,
                stock: selectedItem.stock,
                retail_price: selectedItem.retail_price,
                wholesale_price: selectedItem.wholesale_price,
                extra_price: selectedItem.extra_price,
                card_price: selectedItem.card_price,
                batch_no: selectedItem.batch_no,
                itm_ky: selectedItem.itm_ky,
                serial_number: itemInput.serial_number,
                barcode: selectedItem.barcode,
                brand: selectedItem.brand,
                model: selectedItem.model,
                category: selectedItem.category,
                unit: selectedItem.unit,
                vat_inclusive: selectedItem.vat_inclusive || false,
                // Store tier information for future quantity changes
                tier1_qty: tiers.tier1?.qty,
                tier1_discount: tiers.tier1?.discount,
                tier2_qty: tiers.tier2?.qty,
                tier2_discount: tiers.tier2?.discount,
                tier3_qty: tiers.tier3?.qty,
                tier3_discount: tiers.tier3?.discount,
                tier4_qty: tiers.tier4?.qty,
                tier4_discount: tiers.tier4?.discount,
            };
            setData('items', [...data.items, newItem]);
        }
        resetItemInput();
    };

    const addItemByBatch = () => {
        if (!batchInput || !selectedItem) return;

        // Check if item is out of stock completely
        if (selectedItem.stock <= 0) {
            toast.error('Item Out of Stock', {
                description: `This item (${selectedItem.item_name}) has no available stock.`
            });
            return;
        }

        const existingIndex = data.items.findIndex(item => item.item_code === selectedItem.item_code);
        if (existingIndex >= 0) {
            // Check if adding more quantity exceeds stock
            const newQuantity = data.items[existingIndex].quantity + 1;

            if (newQuantity > selectedItem.stock) {
                toast.error('Insufficient Stock', {
                    description: `Only ${selectedItem.stock} items available across this batch. Your cart already has ${data.items[existingIndex].quantity}.`
                });
                return;
            }

            // Use updateQuantity to properly recalculate discount
            updateQuantity(existingIndex, newQuantity);
        } else {
            // Check if initial quantity (1) exceeds stock
            if (1 > selectedItem.stock) {
                toast.error('Insufficient Stock', {
                    description: `Only ${selectedItem.stock} items available.`
                });
                return;
            }

            // Add new
            const price = getCurrentPrice(selectedItem);
            const tiers = selectedItem.tiers || {};
            const newItem: SaleItem = {
                item_code: selectedItem.item_code,
                item_name: selectedItem.item_name,
                unit_price: price,
                our_price: price,
                cost_price: selectedItem.cost_price,
                quantity: 1,
                free_quantity: 0,
                total: price,
                discount_amount: 0,
                stock: selectedItem.stock,
                retail_price: selectedItem.retail_price,
                wholesale_price: selectedItem.wholesale_price,
                extra_price: selectedItem.extra_price,
                card_price: selectedItem.card_price,
                batch_no: selectedItem.batch_no,
                itm_ky: selectedItem.itm_ky,
                serial_number: selectedItem.serial_number,
                vat_inclusive: selectedItem.vat_inclusive || false,
                // Store tier information
                tier1_qty: tiers.tier1?.qty,
                tier1_discount: tiers.tier1?.discount,
                tier2_qty: tiers.tier2?.qty,
                tier2_discount: tiers.tier2?.discount,
                tier3_qty: tiers.tier3?.qty,
                tier3_discount: tiers.tier3?.discount,
                tier4_qty: tiers.tier4?.qty,
                tier4_discount: tiers.tier4?.discount,
            };
            setData('items', [...data.items, newItem]);
        }
        setBatchInput('');
        setSelectedItem(null);
    };

    const resetItemInput = useCallback(() => {
        setItemInput({ code: '', name: '', price: 0, quantity: 1, barcode: '', serial_number: '' });
        setBatchInput('');
        setSelectedItem(null);
        setItemSearch('');
        setItems([]);
        itemCodeRef.current?.focus();
    }, []);

    const removeItem = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const removePrinter = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const startEditingQuantity = (index: number) => {
        setEditingQuantity({ index, quantity: data.items[index].quantity });
    };

    const updateQuantity = (index: number, newQuantity: number) => {
        if (newQuantity <= 0) return;

        const newItems = [...data.items];
        const item = newItems[index];

        // Check stock availability if stock information exists
        if (item.stock !== undefined && newQuantity > item.stock) {
            toast.error('Insufficient Stock', {
                description: `Cannot update quantity to ${newQuantity}. Only ${item.stock} items available.`
            });
            return;
        }

        // Calculate quantity-based discount
        let discountAmount = 0;
        const tiers = [
            { qty: item.tier4_qty, discount: item.tier4_discount },
            { qty: item.tier3_qty, discount: item.tier3_discount },
            { qty: item.tier2_qty, discount: item.tier2_discount },
            { qty: item.tier1_qty, discount: item.tier1_discount },
        ];

        // Check tiers from highest to lowest quantity
        for (const tier of tiers) {
            if (tier.qty !== null && tier.qty !== undefined &&
                newQuantity >= tier.qty &&
                tier.discount !== null && tier.discount !== undefined &&
                tier.discount > 0) {
                discountAmount = tier.discount * newQuantity; // Total discount for all items
                break;
            }
        }

        newItems[index] = {
            ...newItems[index],
            quantity: newQuantity,
            discount_amount: discountAmount,
            total: (newQuantity * newItems[index].unit_price) - discountAmount
        };
        setData('items', newItems);
        setEditingQuantity(null);
    };

    const cancelEditingQuantity = () => {
        setEditingQuantity(null);
    };

    const startEditingDiscount = (index: number) => {
        setEditingDiscount({ index, discount: data.items[index].discount_amount || 0 });
    };

    const updateDiscount = (index: number, newDiscount: number) => {
        if (newDiscount < 0) return;

        const newItems = [...data.items];
        newItems[index] = {
            ...newItems[index],
            discount_amount: newDiscount,
            total: (newItems[index].quantity * newItems[index].unit_price) - newDiscount
        };
        setData('items', newItems);
        setEditingDiscount(null);
    };

    const cancelEditingDiscount = () => {
        setEditingDiscount(null);
    };

    const createCustomer = async () => {
        if (!customerForm.name.trim()) {
            setCustomerFormErrors({ name: 'Name is required' });
            return;
        }

        setIsCreatingCustomer(true);
        setCustomerFormErrors({});

        // Split name into first and last name
        const nameParts = customerForm.name.trim().split(' ');
        const FstNm = nameParts[0];
        const LstNm = nameParts.slice(1).join(' ') || FstNm; // If no last name, use first name as last name too

        try {
            const response = await axios.post('/customers', {
                FstNm: FstNm,
                LstNm: LstNm,
                Email: customerForm.email || null,
                TP1: customerForm.phone || null,
                fVATRegistered: customerForm.is_vat_registered,
                VATNo: customerForm.vat_no || null
            });

            // Update the selected customer
            const newCust = response.data.customer;
            setData(prev => ({
                ...prev,
                customer_code: newCust.AdrCd,
                customer_name: (newCust.FstNm + ' ' + (newCust.LstNm || '')).trim(),
                customer_vat_no: newCust.VATNo || '',
                is_vat_invoice: !!newCust.fVATRegistered
            }));

            setSelectedCustomer({
                code: newCust.AdrCd,
                name: (newCust.FstNm + ' ' + (newCust.LstNm || '')).trim(),
                is_vat_registered: !!newCust.fVATRegistered,
                vat_no: newCust.VATNo
            });

            // Close dialog and reset form
            setIsCustomerCreateDialogOpen(false);
            setCustomerForm({ name: '', phone: '', email: '', is_vat_registered: false, vat_no: '' });
        } catch (error: any) {
            if (error.response?.data?.errors) {
                // Map backend field names to frontend field names
                const mappedErrors: { [key: string]: string } = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    const errorMessage = error.response.data.errors[key][0] || 'Invalid input';
                    if (key === 'FstNm' || key === 'LstNm') {
                        mappedErrors.name = errorMessage;
                    } else if (key === 'Email') {
                        mappedErrors.email = errorMessage;
                    } else if (key === 'TP1') {
                        mappedErrors.phone = errorMessage;
                    } else {
                        mappedErrors[key] = errorMessage;
                    }
                });
                setCustomerFormErrors(mappedErrors);
            } else {
                setCustomerFormErrors({ general: 'Failed to create customer' });
            }
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    const printReceipt = async (saleData?: any) => {
        try {
            const dataToSend = saleData || {
                invoice_no: data.invoice_no,
                transaction_date: data.transaction_date,
                customer_code: data.customer_code,
                customer_name: data.customer_name,
                customer_vat_no: selectedCustomer?.vat_no || '',
                is_vat_invoice: data.is_vat_invoice,
                vat_rate: data.vat_rate,
                price_type: data.price_type,
                items: data.items,
                subtotal: data.subtotal,
                discount_amount: data.discount_amount,
                tax_amount: data.tax_amount,
                total_amount: data.total_amount,
                payment_mode: data.payment_mode,
                cash_payment: data.cash_payment,
                card_payment: data.card_payment,
                balance_amount: data.balance_amount
            };

            const response = await axios.post('/sales/preview-receipt', dataToSend, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Create hidden iframe for printing
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);

            iframe.onload = () => {
                iframe.contentWindow?.print();
                // Clean up after printing
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    window.URL.revokeObjectURL(url);
                }, 1000);
            };
        } catch (error) {
            console.error('Error printing receipt:', error);
            alert('Error printing receipt');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Use axios to prevent Inertia navigation
            const response = await axios.post('/sales', data);

            // Show success toast notification
            toast.success('Sale completed successfully!', {
                description: `Invoice #${data.invoice_no} has been saved.`,
                duration: 3000,
            });

            // Auto-open invoice in new window (this will auto-print due to onload="window.print()" in the blade)
            if (response.data.sale_id) {
                const invoiceUrl = `/sales/${response.data.sale_id}/invoice`;
                window.open(invoiceUrl, '_blank');
            }

            // Reset all form data to initial state
            setData({
                invoice_no: nextInvoiceNo,
                transaction_date: currentDate,
                customer_code: '0001',
                customer_name: 'cash',
                customer_vat_no: '',
                is_vat_invoice: false,
                vat_rate: 0,
                price_type: 'retail',
                items: [],
                payment_mode: 'cash',
                subtotal: 0,
                discount_amount: 0,
                total_discount: 0,
                tax_amount: 0,
                total_amount: 0,
                cash_payment: '',
                card_payment: '',
                balance_amount: '',
            });

            // Reset component states
            setItemInput({ code: '', name: '', price: 0, quantity: 1, barcode: '', serial_number: '' });
            setBatchInput('');
            setSelectedItem(null);
            setSelectedCustomer(null);
            setCustomerSearch('');
            setCustomers([]);
            setItemSearch('');
            setItems([]);
            setPrinterSearch('');
            setPrinters([]);
            setEditingQuantity(null);
            setEditingDiscount(null);
            setCompanyVatInfo(null);
            setBatchCandidates([]);

            // Reset entry mode to item
            setEntryMode('item');

            // Refresh the page to get new invoice number and current date
            window.location.reload();
        } catch (error: any) {
            console.error('Error saving sale:', error);
            // Handle validation errors or other errors
            if (error.response?.data?.errors) {
                console.error('Validation errors:', error.response.data.errors);
                // Extract specific error message for items if available
                const itemsError = error.response.data.errors.items;
                const specificError = Array.isArray(itemsError) ? itemsError[0] : itemsError;

                toast.error(specificError || 'Validation error occurred', {
                    description: specificError ? 'Stock mismatch or invalid data.' : 'Please check the form and try again.',
                    duration: 5000,
                });
            } else if (error.response?.data?.message) {
                toast.error('Error saving sale', {
                    description: error.response.data.message,
                    duration: 5000,
                });
            } else {
                toast.error('Error saving sale', {
                    description: 'Please try again or contact support.',
                });
            }
        }
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Sales'), href: '/sales' },
        { title: t('New Sale'), href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Sales Form')} />

            {/* Radiant Background */}
            <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-y-auto">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-blue-600/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-4 max-w-7xl mx-auto">
                    {/* Form Container with Radiant Effects */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Sale Information Section */}
                            <SaleInformationForm
                                data={data}
                                setData={setData}
                                fetchCustomerByCode={fetchCustomerByCode}
                                setIsCustomerDialogOpen={setIsCustomerDialogOpen}
                                setIsPrivilegeModalOpen={setIsPrivilegeModalOpen}
                            />

                            {/* Price Type and Entry Mode Section */}
                            <div className="space-y-5">
                                {entryMode !== 'printer' && (
                                    <PriceTypeSelector
                                        priceType={data.price_type}
                                        setPriceType={(value) => setData('price_type', value)}
                                    />
                                )}
                                <EntryModeToggle
                                    entryMode={entryMode}
                                    setEntryMode={setEntryMode}
                                />

                                {entryMode === 'item' ? (
                                    <>
                                        {/* Item Entry Form */}
                                        <ItemEntryForm
                                            itemInput={itemInput}
                                            setItemInput={setItemInput}
                                            itemCodeRef={itemCodeRef}
                                            quantityRef={quantityRef}
                                            plusButtonRef={plusButtonRef}
                                            selectedItem={selectedItem}
                                            items={items}
                                            isDropdownOpen={isDropdownOpen}
                                            setIsDropdownOpen={setIsDropdownOpen}
                                            searchItems={searchItems}
                                            setIsItemDialogOpen={setIsItemDialogOpen}
                                            selectItem={selectItem}
                                            setBatchCandidates={setBatchCandidates}
                                            setIsBatchModalOpen={setIsBatchModalOpen}
                                            addItem={addItem}
                                            resetItemInput={resetItemInput}
                                        />

                                        {/* Items List Section */}
                                        <ItemsListTable
                                            data={data}
                                            selectedItem={selectedItem}
                                            editingQuantity={editingQuantity}
                                            setEditingQuantity={setEditingQuantity}
                                            startEditingQuantity={startEditingQuantity}
                                            updateQuantity={updateQuantity}
                                            cancelEditingQuantity={cancelEditingQuantity}
                                            editingDiscount={editingDiscount}
                                            setEditingDiscount={setEditingDiscount}
                                            startEditingDiscount={startEditingDiscount}
                                            updateDiscount={updateDiscount}
                                            cancelEditingDiscount={cancelEditingDiscount}
                                            removeItem={removeItem}
                                        />
                                    </>
                                ) : (
                                    <>
                                        {/* Printer Entry Form */}
                                        <PrinterEntryForm
                                            printerSearch={printerSearch}
                                            setPrinterSearch={setPrinterSearch}
                                            searchPrinters={searchPrinters}
                                            setIsPrinterDialogOpen={setIsPrinterDialogOpen}
                                        />

                                        {/* Printers List Section */}
                                        <PrintersListTable
                                            data={data}
                                            removePrinter={removePrinter}
                                        />
                                    </>
                                )}
                            </div>

                            {/* Payment & Totals Section */}
                            <PaymentTotalsSection
                                data={data}
                                setData={setData}
                                processing={processing}
                                autoPrintEnabled={autoPrintEnabled}
                                setAutoPrintEnabled={setAutoPrintEnabled}
                                setIsMobilePreviewOpen={setIsMobilePreviewOpen}
                                printReceipt={printReceipt}
                                handleSave={handleSave}
                                handlePaymentModeChange={handlePaymentModeChange}
                                cashPaymentRef={cashPaymentRef}
                                cardPaymentRef={cardPaymentRef}
                            />
                        </form>
                        {/* Footer */}
                        {/* <div className="text-center mt-4 text-blue-600/60">
                            <p className="text-sm">Process sales efficiently • Manage transactions seamlessly</p>
                        </div> */}
                    </div>
                </div>
            </div>
            {/* Customer Search Dialog */}
            <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Search Customer')}</DialogTitle>
                        <DialogDescription>{t('Search and select a customer')}</DialogDescription>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setIsCustomerDialogOpen(false);
                                setIsCustomerCreateDialogOpen(true);
                            }}
                            className="mt-2"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('Create New Customer')}
                        </Button>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder={t('Type name or code...')}
                            value={customerSearch}
                            onChange={e => {
                                setCustomerSearch(e.target.value);
                                axios.get(`/sales/search/customers?query=${e.target.value}&type=customer`).then(res => setCustomers(res.data));
                            }}
                        />
                        <div className="max-h-60 overflow-y-auto divide-y border rounded">
                            {customers.map((c, idx) => (
                                <div
                                    key={c.code || `cust-${idx}`}
                                    className="p-3 hover:bg-muted cursor-pointer flex justify-between"
                                    onClick={() => {
                                        setData(prev => ({
                                            ...prev,
                                            customer_code: c.code,
                                            customer_name: c.name,
                                            customer_vat_no: c.vat_no || '',
                                            is_vat_invoice: !!c.is_vat_registered,
                                            vat_rate: c.is_vat_registered ? (companyVatInfo?.vat_rate || prev.vat_rate) : prev.vat_rate
                                        }));
                                        setSelectedCustomer(c);
                                        setIsCustomerDialogOpen(false);
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span>{c.name}</span>
                                        {c.is_vat_registered && (
                                            <span className="text-[10px] text-green-600 font-bold uppercase">VAT Registered</span>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground">{c.code}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Customer Create Dialog */}
            <Dialog open={isCustomerCreateDialogOpen} onOpenChange={(open) => {
                setIsCustomerCreateDialogOpen(open);
                if (!open) {
                    // Reset form when dialog closes
                    setCustomerForm({ name: '', phone: '', email: '', is_vat_registered: false, vat_no: '' });
                    setCustomerFormErrors({});
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Create New Customer')}</DialogTitle>
                        <DialogDescription>{t('Enter customer details')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="customer-name">{t('Name')} *</Label>
                            <Input
                                id="customer-name"
                                value={customerForm.name || ''}
                                onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('Enter customer name')}
                                className={customerFormErrors.name ? 'border-red-500' : ''}
                            />
                            {customerFormErrors.name && (
                                <p className="text-sm text-red-500 mt-1">{customerFormErrors.name}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="customer-phone">{t('Phone')}</Label>
                            <Input
                                id="customer-phone"
                                value={customerForm.phone || ''}
                                onChange={e => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder={t('Enter phone number')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="customer-email">{t('Email')}</Label>
                            <Input
                                id="customer-email"
                                type="email"
                                value={customerForm.email || ''}
                                onChange={e => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder={t('Enter email address')}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-2 border-t mt-2">
                            <input
                                type="checkbox"
                                id="cust-vat-reg"
                                checked={customerForm.is_vat_registered}
                                onChange={e => setCustomerForm(prev => ({ ...prev, is_vat_registered: e.target.checked }))}
                                className="w-4 h-4 text-primary rounded"
                            />
                            <Label htmlFor="cust-vat-reg">{t('VAT Registered Customer')}</Label>
                        </div>
                        {customerForm.is_vat_registered && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <Label htmlFor="customer-vat">{t('VAT Number')}</Label>
                                <Input
                                    id="customer-vat"
                                    value={customerForm.vat_no || ''}
                                    onChange={e => setCustomerForm(prev => ({ ...prev, vat_no: e.target.value }))}
                                    placeholder={t('Enter VAT number')}
                                    className="mt-1"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCustomerCreateDialogOpen(false)}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={createCustomer}
                            disabled={isCreatingCustomer}
                        >
                            {isCreatingCustomer ? t('Creating...') : t('Create Customer')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Item Search Dialog */}
            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Search Item')}</DialogTitle>
                        <DialogDescription>{t('Search and select an item')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder={t('Type name, code or barcode...')}
                            value={itemSearch}
                            onChange={e => {
                                setItemSearch(e.target.value);
                                searchItemsForDialog(e.target.value);
                            }}
                        />
                        <div className="max-h-60 overflow-y-auto divide-y border rounded">
                            {Array.from(new Map(items.map(item => [item.item_code, item])).values()).map((item, idx) => {
                                const hasMultipleBatches = items.filter(i => i.item_code === item.item_code).length > 1;
                                const displayPrice = getCurrentPrice(item);
                                return (
                                    <div
                                        key={item.item_code + idx}
                                        className="p-3 hover:bg-muted cursor-pointer"
                                        onClick={() => {
                                            const matchingBatches = items.filter(i => i.item_code === item.item_code);

                                            if (matchingBatches.length > 1) {
                                                setBatchCandidates(matchingBatches);
                                                setIsBatchModalOpen(true);
                                            } else {
                                                selectItem(item);
                                            }
                                            setIsItemDialogOpen(false);
                                        }}
                                    >
                                        <div className="flex justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{item.item_name}</span>
                                                    {hasMultipleBatches && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                                            Select Batch
                                                        </span>
                                                    )}
                                                </div>
                                                {!hasMultipleBatches && item.batch_no && (
                                                    <span className="text-xs text-blue-600 font-semibold">
                                                        Batch: {item.batch_no}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-muted-foreground">{item.item_code}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {hasMultipleBatches
                                                ? 'Multiple Batches Available'
                                                : `Stock: ${Number(item.stock).toFixed(2)}`} | Price: {Number(displayPrice).toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Printer Search Dialog */}
            <Dialog open={isPrinterDialogOpen} onOpenChange={setIsPrinterDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{t('Search Printer by Serial Number')}</DialogTitle>
                        <DialogDescription>Search through GRN stock for available printers</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder={t('Enter serial number, brand or model...')}
                            value={printerSearch}
                            onChange={e => {
                                setPrinterSearch(e.target.value);
                                searchPrinters(e.target.value);
                            }}
                            autoFocus
                        />
                        {printers.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border">
                                <h4 className="font-semibold text-blue-800">Printer Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                    <div>
                                        <strong>Name:</strong> {printers[0].item_name}
                                    </div>
                                    <div>
                                        <strong>Model:</strong> {printers[0].model}
                                    </div>
                                    <div>
                                        <strong>Brand:</strong> {printers[0].brand}
                                    </div>
                                    <div>
                                        <strong>Warranty:</strong> {printers[0].warranty || 'No Warranty'}
                                    </div>
                                    <div>
                                        <strong>Price:</strong> {Number(data.price_type === 'wholesale' ? printers[0].wholesale_price : data.price_type === 'extra' ? printers[0].extra_price : printers[0].retail_price).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="max-h-96 overflow-y-auto border rounded divide-y shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-muted sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left">Serial Number</th>
                                        <th className="p-3 text-left">Batch No</th>
                                        <th className="p-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {printers.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-muted-foreground">{t('No printers found with this serial number')}</td>
                                        </tr>
                                    ) : (
                                        printers.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-muted/50 border-b">
                                                <td className="p-3 font-mono font-bold text-blue-600">{p.serial_number}</td>
                                                <td className="p-3">{p.batch_no}</td>
                                                <td className="p-3 text-center">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addPrinter(p)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        Select
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Mobile Preview Dialog */}
            <Dialog open={isMobilePreviewOpen} onOpenChange={setIsMobilePreviewOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-muted">
                    <DialogHeader className="p-4 bg-white border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCcw className="w-5 h-5 text-blue-500" /> {t('Receipt Preview')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 overflow-y-auto max-h-[70vh]">
                        <QuickReceiptPreview data={data} companyInfo={companyInfo} selectedCustomer={selectedCustomer} />
                    </div>
                    <DialogFooter className="p-4 bg-white border-t">
                        <Button type="button" className="w-full" onClick={() => setIsMobilePreviewOpen(false)}>
                            {t('Close Preview')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <PrivilegeAccessModal
                isOpen={isPrivilegeModalOpen}
                onClose={() => setIsPrivilegeModalOpen(false)}
                onCustomerSelect={handlePrivilegeCustomerSelect}
            />
            <BatchSelectionModal
                isOpen={isBatchModalOpen}
                onClose={() => setIsBatchModalOpen(false)}
                items={batchCandidates}
                existingItems={data.items}
                onSelect={(item) => {
                    selectItem(item);
                    setIsBatchModalOpen(false);
                }}
            />

            {/* Card Price Confirmation Dialog */}
            <Dialog open={showCardPriceConfirmation} onOpenChange={setShowCardPriceConfirmation}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                            Apply Card Prices
                        </DialogTitle>
                        <DialogDescription>
                            Do you want to apply card prices to all items in the list?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={cancelCardPrices}>
                            No
                        </Button>
                        <Button onClick={applyCardPrices} className="bg-blue-600 hover:bg-blue-700">
                            Yes, Apply Card Prices
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default Create;
