import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload,
  Search,
  X,
  Check,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Film,
  Music,
  Archive,
  File,
  RefreshCw,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { MediaItem, DirectoryItem } from '@/pages/media-library';

export interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string | string[]) => void;
  multiple?: boolean;
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
}: MediaLibraryModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  const getCsrfToken = () => {
    return (
      (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
    );
  };

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentDirectory) {
        params.append('directory_id', currentDirectory.toString());
      }

      const response = await fetch(`/media?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMedia(Array.isArray(data.media) ? data.media : []);
      setDirectories(data.directories || []);
    } catch (error) {
      console.error('Failed to load media in modal:', error);
      toast.error('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, [currentDirectory]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedUrls([]);
      setActiveTab('browse');
    }
  }, [isOpen, fetchMedia]);

  // Filtered media
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      if (!searchTerm.trim()) return true;
      return (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [media, searchTerm]);

  // Toggle selection
  const toggleSelect = (url: string) => {
    if (multiple) {
      if (selectedUrls.includes(url)) {
        setSelectedUrls(selectedUrls.filter((u) => u !== url));
      } else {
        setSelectedUrls([...selectedUrls, url]);
      }
    } else {
      setSelectedUrls([url]);
    }
  };

  const handleConfirmSelect = () => {
    if (selectedUrls.length === 0) {
      toast.error('Please select at least one media item');
      return;
    }
    if (multiple) {
      onSelect(selectedUrls);
    } else {
      onSelect(selectedUrls[0]);
    }
    onClose();
  };

  // Upload handler
  const handleBatchUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    uploadFiles.forEach((file) => formData.append('files[]', file));
    if (currentDirectory) {
      formData.append('directory_id', currentDirectory.toString());
    }

    try {
      const response = await fetch('/media/batch', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
        credentials: 'same-origin',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.errors?.[0] || 'Upload failed');
      }

      toast.success(data.message || 'Uploaded successfully');
      setUploadFiles([]);
      setActiveTab('browse');
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/80">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                Select Media Asset
              </DialogTitle>
              <DialogDescription className="text-xs">
                {multiple
                  ? 'Select one or more items from your library.'
                  : 'Select an image or document from your library.'}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === 'browse' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('browse')}
                className="h-8 text-xs"
              >
                Browse Library
              </Button>
              <Button
                variant={activeTab === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('upload')}
                className="h-8 text-xs gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload New
              </Button>
            </div>
          </div>
        </DialogHeader>

        {activeTab === 'browse' ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                {currentDirectory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDirectory(null)}
                    className="h-8 text-xs gap-1 px-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Root
                  </Button>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search media..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchMedia()}
                className="h-8 w-8 text-muted-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Folders (only at root) */}
            {!currentDirectory && directories.length > 0 && !searchTerm && (
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Directories
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {directories.map((dir) => (
                    <div
                      key={dir.id}
                      onClick={() => setCurrentDirectory(dir.id)}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-card/60 hover:bg-card hover:border-primary/50 cursor-pointer transition-all"
                    >
                      <Folder className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" />
                      <span className="text-xs font-medium truncate">{dir.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Items */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No media files found. Upload a file to get started.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredMedia.map((item) => {
                    const isSelected = selectedUrls.includes(item.url);
                    const isImage = item.mime_type?.startsWith('image/');

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelect(item.url)}
                        className={`group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-primary border-primary shadow-sm'
                            : 'hover:border-primary/50 bg-card/60'
                        }`}
                      >
                        {isImage ? (
                          <img
                            src={item.thumb_url || item.url}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-2 text-center bg-muted/20">
                            <File className="h-8 w-8 text-primary/70 mb-1" />
                            <span className="text-[10px] font-semibold truncate max-w-full">
                              {item.name}
                            </span>
                          </div>
                        )}

                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}

                        {/* Title Overlay on Hover */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white truncate font-medium">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Upload Tab */
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files) {
                  setUploadFiles(Array.from(e.dataTransfer.files));
                }
              }}
              className={`w-full max-w-lg border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border/80 bg-muted/20'
              }`}
            >
              <input
                type="file"
                multiple
                id="modal-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) setUploadFiles(Array.from(e.target.files));
                }}
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-primary" />
                <h4 className="text-sm font-semibold">Drop files here to upload</h4>
                <label
                  htmlFor="modal-file-input"
                  className="text-xs text-primary hover:underline cursor-pointer font-medium"
                >
                  or click to select from your device
                </label>
              </div>
            </div>

            {uploadFiles.length > 0 && (
              <div className="w-full max-w-lg mt-4 flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                <span>{uploadFiles.length} file(s) ready to upload</span>
                <Button
                  size="sm"
                  onClick={handleBatchUpload}
                  disabled={uploading}
                  className="h-8 text-xs"
                >
                  {uploading ? 'Uploading...' : 'Start Upload'}
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="p-3 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedUrls.length > 0
              ? `${selectedUrls.length} item(s) selected`
              : 'No items selected'}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSelect}
              disabled={selectedUrls.length === 0}
              className="h-8 text-xs gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Use Selected
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
