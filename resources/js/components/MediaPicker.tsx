import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MediaLibraryModal from '@/components/MediaLibraryModal';
import { Image as ImageIcon, X, FolderOpen, File } from 'lucide-react';

export interface MediaPickerProps {
  label?: string;
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  showPreview?: boolean;
  disabled?: boolean;
  id?: string;
  required?: boolean;
}

export default function MediaPicker({
  label,
  value = '',
  onChange,
  multiple = false,
  placeholder = 'Select image or file...',
  showPreview = true,
  disabled = false,
  id,
  required,
}: MediaPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (selected: string | string[]) => {
    onChange(selected);
  };

  const handleClear = () => {
    onChange(multiple ? [] : '');
  };

  const safeValue = multiple
    ? Array.isArray(value)
      ? value
      : value
      ? [value]
      : []
    : Array.isArray(value)
    ? value[0] || ''
    : value || '';

  const mediaUrls: string[] = multiple
    ? (Array.isArray(safeValue) ? safeValue.filter(Boolean) : [])
    : safeValue
    ? [safeValue as string]
    : [];

  const isImageUrl = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <Label htmlFor={id} className="text-xs font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      {/* Input + Choose button */}
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={
            multiple
              ? Array.isArray(safeValue)
                ? safeValue.join(', ')
                : ''
              : (safeValue as string)
          }
          onChange={(e) => !multiple && onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-9 text-xs"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className="h-9 text-xs gap-1.5 shrink-0"
        >
          <FolderOpen className="h-4 w-4 text-primary" />
          <span>Library</span>
        </Button>

        {mediaUrls.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
            title="Clear"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preview Section */}
      {showPreview && mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {mediaUrls.map((url, index) => (
            <div
              key={index}
              className="group relative h-16 w-16 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center"
            >
              {isImageUrl(url) ? (
                <img
                  src={url}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}

              <div
                className={`flex items-center justify-center h-full w-full p-2 text-muted-foreground ${
                  isImageUrl(url) ? 'hidden' : 'flex'
                }`}
              >
                <File className="h-6 w-6 text-primary/60" />
              </div>

              {multiple && (
                <button
                  type="button"
                  onClick={() => {
                    const newUrls = (safeValue as string[]).filter((_, i) => i !== index);
                    onChange(newUrls);
                  }}
                  className="absolute top-1 right-1 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Embedded Modal Dialog */}
      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        multiple={multiple}
      />
    </div>
  );
}
