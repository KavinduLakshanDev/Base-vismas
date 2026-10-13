import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ItemMaster, SaleItem } from '../Create';

interface BatchSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: ItemMaster[];
    existingItems?: SaleItem[];
    onSelect: (item: ItemMaster) => void;
}

const BatchSelectionModal: React.FC<BatchSelectionModalProps> = ({ isOpen, onClose, items, existingItems = [], onSelect }) => {
    // Early return if no items to prevent hooks order violation
    if (!items || items.length === 0) return null;

    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedIndexRef = useRef(0);

    const baseItem = items[0];

    // Helper to get effective stock
    const getEffectiveStock = (item: ItemMaster) => {
        const usedStock = existingItems
            .filter(i => i.item_code === item.item_code && i.batch_no === item.batch_no)
            .reduce((sum, i) => sum + Number(i.quantity || 0) + Number(i.free_quantity || 0), 0);
        return Math.max(0, item.stock - usedStock);
    };

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = Math.min(selectedIndexRef.current + 1, items.length - 1);
                selectedIndexRef.current = nextIndex;
                setSelectedIndex(nextIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = Math.max(selectedIndexRef.current - 1, 0);
                selectedIndexRef.current = prevIndex;
                setSelectedIndex(prevIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (items[selectedIndexRef.current]) {
                    const currentItem = items[selectedIndexRef.current];
                    if (getEffectiveStock(currentItem) > 0) {
                        onSelect(currentItem);
                    }
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [isOpen, items, onSelect, onClose, existingItems]);

    // Add/remove keyboard event listeners
    useEffect(() => {
        if (isOpen) {
            selectedIndexRef.current = 0;
            setSelectedIndex(0);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Select Batch</DialogTitle>
                    <DialogDescription className="space-y-1">
                        <div>
                            Multiple batches found for <span className="font-semibold text-blue-600">{baseItem.item_name}</span> ({baseItem.item_code})
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Use ↑↓ arrow keys to navigate, Enter to select, Escape to cancel
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-700 font-semibold">
                            <tr>
                                <th className="px-4 py-3">Batch No</th>
                                <th className="px-4 py-3 text-right">Stock</th>
                                <th className="px-4 py-3 text-right">Retail Price</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, idx) => {
                                const effectiveStock = getEffectiveStock(item);
                                const isOutOfStock = effectiveStock <= 0;

                                return (
                                    <tr
                                        key={idx}
                                        className={`transition-colors ${isOutOfStock
                                            ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                                            : idx === selectedIndex
                                                ? 'bg-blue-100 border-blue-300 cursor-pointer'
                                                : 'hover:bg-blue-50 cursor-pointer'
                                            }`}
                                        onClick={() => {
                                            if (!isOutOfStock) {
                                                selectedIndexRef.current = idx;
                                                setSelectedIndex(idx);
                                                onSelect(item);
                                            }
                                        }}
                                    >
                                        <td className="px-4 py-3 font-mono text-gray-800">
                                            {item.batch_no || 'N/A'}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${isOutOfStock ? 'text-red-500' : ''}`}>
                                            {effectiveStock.toFixed(2)}
                                            {effectiveStock < item.stock && (
                                                <span className="text-xs text-gray-400 block">
                                                    (Orig: {Number(item.stock).toFixed(2)})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {Number(item.retail_price).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                size="sm"
                                                disabled={isOutOfStock}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelect(item);
                                                }}
                                                className={`h-8 ${isOutOfStock
                                                    ? 'bg-gray-400'
                                                    : idx === selectedIndex
                                                        ? 'bg-blue-700 hover:bg-blue-800'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                    }`}
                                            >
                                                Select
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BatchSelectionModal;
