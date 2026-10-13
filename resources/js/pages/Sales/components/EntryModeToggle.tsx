import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, Barcode } from 'lucide-react';

interface EntryModeToggleProps {
    entryMode: 'item' | 'printer';
    setEntryMode: (mode: 'item' | 'printer') => void;
}

const EntryModeToggle: React.FC<EntryModeToggleProps> = ({ entryMode, setEntryMode }) => {
    return (
        <div className="flex gap-2">
            <Button
                type="button"
                variant={entryMode === 'item' ? 'default' : 'outline'}
                onClick={() => setEntryMode('item')}
                size="sm"
                className={entryMode === 'item' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
                <Package className="w-4 h-4 mr-2" />
                Item Entry
            </Button>
            <Button
                type="button"
                variant={entryMode === 'printer' ? 'default' : 'outline'}
                onClick={() => setEntryMode('printer')}
                size="sm"
                className={entryMode === 'printer' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
                <Barcode className="w-4 h-4 mr-2" />
                Printer Entry
            </Button>
        </div>
    );
};

export default EntryModeToggle;