import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Package, Barcode, DollarSign, RefreshCcw, Plus, Search } from 'lucide-react';
import { ItemMaster } from '../Create';

interface ItemEntryFormProps {
    itemInput: {
        code: string;
        name: string;
        price: number;
        quantity: number;
        barcode: string;
        serial_number: string;
    };
    setItemInput: React.Dispatch<React.SetStateAction<{
        code: string;
        name: string;
        price: number;
        quantity: number;
        barcode: string;
        serial_number: string;
    }>>;
    itemCodeRef: React.RefObject<HTMLInputElement | null>;
    quantityRef: React.RefObject<HTMLInputElement | null>;
    plusButtonRef: React.RefObject<HTMLButtonElement | null>;
    selectedItem: ItemMaster | null;
    items: ItemMaster[];
    isDropdownOpen: boolean;
    setIsDropdownOpen: (open: boolean) => void;
    setIsItemDialogOpen: (open: boolean) => void;
    searchItems: (query: string) => void;
    selectItem: (item: ItemMaster) => void;
    setBatchCandidates: React.Dispatch<React.SetStateAction<ItemMaster[]>>;
    setIsBatchModalOpen: (open: boolean) => void;
    addItem: () => void;
    resetItemInput: () => void;
}

const ItemEntryForm: React.FC<ItemEntryFormProps> = ({
    itemInput,
    setItemInput,
    itemCodeRef,
    quantityRef,
    plusButtonRef,
    selectedItem,
    items,
    isDropdownOpen,
    setIsDropdownOpen,
    setIsItemDialogOpen,
    searchItems,
    selectItem,
    setBatchCandidates,
    setIsBatchModalOpen,
    addItem,
    resetItemInput
}) => {
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const uniqueItems = useMemo(() => Array.from(new Map(items.map(item => [item.item_code, item])).values()), [items]);
    const [shouldFocusQuantity, setShouldFocusQuantity] = useState(false);

    useEffect(() => {
        if (isDropdownOpen && uniqueItems.length > 0) {
            setSelectedIndex(0);
        } else {
            setSelectedIndex(-1);
        }
    }, [isDropdownOpen, uniqueItems]);

    // Focus quantity field after item selection
    useEffect(() => {
        if (selectedItem && !isDropdownOpen && shouldFocusQuantity) {
            setTimeout(() => {
                if (quantityRef.current) {
                    quantityRef.current.focus();
                }
                setShouldFocusQuantity(false);
            }, 100);
        }
    }, [selectedItem, isDropdownOpen, shouldFocusQuantity, quantityRef]);

    return (
        <div className="space-y-3">
            <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Item Entry</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
                <div className="space-y-2 relative">
                    <Label htmlFor="item_code" className="text-sm font-medium text-gray-700 flex items-center">
                        <Barcode className="w-4 h-4 mr-2 text-blue-500" />
                        Item Code
                    </Label>
                    <div className="flex gap-2 relative">
                        <Input
                            id="item_code"
                            ref={itemCodeRef}
                            placeholder="Scan barcode, enter code or name"
                            value={itemInput.code}
                            onChange={(e) => {
                                const newVal = e.target.value;
                                setItemInput({ ...itemInput, code: newVal });
                                // Trigger search when typing
                                if (newVal.length > 0) {
                                    searchItems(newVal);
                                } else {
                                    setIsDropdownOpen(false);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (isDropdownOpen && uniqueItems.length > 0) {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setSelectedIndex(prev => prev < uniqueItems.length - 1 ? prev + 1 : 0);
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setSelectedIndex(prev => prev > 0 ? prev - 1 : uniqueItems.length - 1);
                                    } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (selectedIndex >= 0) {
                                            const item = uniqueItems[selectedIndex];
                                            const matchingBatches = items.filter(i => i.item_code === item.item_code);

                                            if (matchingBatches.length > 1) {
                                                setIsDropdownOpen(false);
                                                setSelectedIndex(-1);
                                                setShouldFocusQuantity(true);
                                                // Use setTimeout to ensure state updates before opening modal
                                                setTimeout(() => {
                                                    setBatchCandidates(matchingBatches);
                                                    setIsBatchModalOpen(true);
                                                }, 50);
                                            } else {
                                                selectItem(item);
                                                setIsDropdownOpen(false);
                                                setSelectedIndex(-1);
                                                setTimeout(() => {
                                                    if (quantityRef.current) {
                                                        quantityRef.current.focus();
                                                    }
                                                }, 100);
                                            }
                                        }
                                    } else if (e.key === 'Escape') {
                                        setIsDropdownOpen(false);
                                        setSelectedIndex(-1);
                                    }
                                } else {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setIsDropdownOpen(false);
                                        setTimeout(() => {
                                            if (quantityRef.current) {
                                                quantityRef.current.focus();
                                            }
                                        }, 100);
                                    }
                                }
                            }}
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                        />
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsItemDialogOpen(true)}>
                            <Search className="w-4 h-4" />
                        </Button>

                        {/* Dropdown for search results */}
                        {isDropdownOpen && items.length > 0 && (
                            <div className="absolute top-12 left-0 min-w-[600px] z-50 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
                                {uniqueItems.map((item, idx) => {
                                    const hasMultipleBatches = items.filter(i => i.item_code === item.item_code).length > 1;
                                    return (
                                        <div
                                            key={item.item_code + idx}
                                            className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${idx === selectedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                                            onClick={() => {
                                                const matchingBatches = items.filter(i => i.item_code === item.item_code);

                                                if (matchingBatches.length > 1) {
                                                    setBatchCandidates(matchingBatches);
                                                    setIsBatchModalOpen(true);
                                                    setIsDropdownOpen(false);
                                                    setShouldFocusQuantity(true);
                                                } else {
                                                    selectItem(item);
                                                    setIsDropdownOpen(false);
                                                    setShouldFocusQuantity(true);
                                                }
                                                setSelectedIndex(-1);
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{item.item_name}</div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        Code: {item.item_code} | Stock: <span className={item.stock > 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>{item.stock}</span>
                                                        {item.batch_no && <span className="text-[9px] block">Batch: {item.batch_no}</span>}
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-sm font-medium text-blue-600">
                                                        Rs. {item.retail_price?.toFixed(2)}
                                                    </div>
                                                    {hasMultipleBatches && (
                                                        <div className="text-xs text-orange-600 mt-1">
                                                            Multiple batches available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="item_name" className="text-sm font-medium text-gray-700 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-blue-500" />
                        Item Name
                    </Label>
                    <Input
                        id="item_name"
                        value={itemInput.name}
                        readOnly
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm bg-muted"
                    />
                </div>

                <div className="space-y-2 ">
                    <Label htmlFor="unit_price" className="text-sm font-medium text-gray-700 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-blue-500" />
                        Unit Price
                    </Label>
                    <Input
                        id="unit_price"
                        type="number"
                        value={itemInput.price}
                        onChange={(e) => setItemInput({ ...itemInput, price: Number(e.target.value) })}
                        className="w-28 border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium text-gray-700 flex">
                        <Package className="w-4 h-4 mr-2 text-blue-500" />
                        Quantity
                    </Label>
                    <div className="flex gap-1">
                        <Input
                            id="quantity"
                            type="number"
                            ref={quantityRef}
                            value={itemInput.quantity}
                            onChange={(e) => setItemInput({ ...itemInput, quantity: Number(e.target.value) })}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Focus plus button instead of directly adding item
                                    setTimeout(() => {
                                        if (plusButtonRef.current) {
                                            plusButtonRef.current.focus();
                                        }
                                    }, 100);
                                }
                            }}
                            className="flex-1 min-w-[68px] border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                        />
                        <Button
                            type="button"
                            ref={plusButtonRef}
                            onClick={addItem}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addItem();
                                }
                            }}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="outline" onClick={resetItemInput}>
                            Reset
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemEntryForm;