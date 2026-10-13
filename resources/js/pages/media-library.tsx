import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import {
  Upload,
  Search,
  X,
  Plus,
  Info,
  Copy,
  Download,
  MoreVertical,
  Image as ImageIcon,
  Calendar,
  HardDrive,
  FileText,
  FileSpreadsheet,
  Film,
  Music,
  Archive,
  File,
  Trash2,
  Folder,
  FolderPlus,
  ArrowLeft,
  RefreshCw,
  FolderOpen,
  Check,
  MoveRight,
  Edit2,
  Layers,
  ExternalLink,
} from 'lucide-react';

export interface MediaItem {
  id: number;
  name: string;
  file_name: string;
  url: string;
  thumb_url: string;
  size: number;
  mime_type: string;
  directory_id?: number | null;
  creator_id?: number;
  created_by?: number;
  created_at: string;
}

export interface DirectoryItem {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  media_count?: number;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<number | null>(null);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetDirectoryId, setTargetDirectoryId] = useState<string>('root');
  const [dragActive, setDragActive] = useState(false);

  // Directory Create & Rename
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderToRename, setFolderToRename] = useState<DirectoryItem | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');

  // Move Media Modal
  const [mediaToMove, setMediaToMove] = useState<MediaItem | null>(null);
  const [moveToDirectoryId, setMoveToDirectoryId] = useState<string>('root');

  // File Details Info Modal
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedMediaInfo, setSelectedMediaInfo] = useState<MediaItem | null>(null);

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'media' | 'directory'; id: number; name: string } | null>(null);

  const getCsrfToken = () => {
    return (
      (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
    );
  };

  // Helper format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Fetch Media and Directories
  const fetchMedia = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!showAllFiles && currentDirectory) {
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
      const mediaList = Array.isArray(data.media) ? data.media : [];
      setMedia(mediaList);
      setDirectories(data.directories || []);
    } catch (error) {
      console.error('Failed to load media:', error);
      toast.error('Failed to load media library');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [currentDirectory, showAllFiles]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Current Directory Object
  const currentDirectoryObj = useMemo(() => {
    if (!currentDirectory) return null;
    return directories.find((d) => d.id === currentDirectory) || null;
  }, [directories, currentDirectory]);

  // Filtered files
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      // Search term
      if (searchTerm.trim()) {
        const matchesName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFileName = item.file_name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesName && !matchesFileName) return false;
      }

      // Type filter
      if (typeFilter !== 'all') {
        const mime = item.mime_type?.toLowerCase() || '';
        const ext = item.file_name.split('.').pop()?.toLowerCase() || '';
        if (typeFilter === 'images' && !mime.startsWith('image/')) return false;
        if (typeFilter === 'documents' && !['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext) && !mime.includes('word') && !mime.includes('pdf') && !mime.includes('text')) return false;
        if (typeFilter === 'sheets' && !['xls', 'xlsx', 'csv'].includes(ext) && !mime.includes('spreadsheet') && !mime.includes('csv')) return false;
        if (typeFilter === 'videos' && !mime.startsWith('video/')) return false;
        if (typeFilter === 'audio' && !mime.startsWith('audio/')) return false;
        if (typeFilter === 'archives' && !['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) && !mime.includes('zip') && !mime.includes('compressed')) return false;
      }

      return true;
    });
  }, [media, searchTerm, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage) || 1;
  const paginatedMedia = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMedia.slice(start, start + itemsPerPage);
  }, [filteredMedia, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, currentDirectory, showAllFiles]);

  // Statistics
  const stats = useMemo(() => {
    const totalFiles = media.length;
    const totalSize = media.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const imagesCount = media.filter((m) => m.mime_type?.startsWith('image/')).length;
    const docsCount = media.filter((m) => {
      const ext = m.file_name.split('.').pop()?.toLowerCase() || '';
      return ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv'].includes(ext);
    }).length;

    return {
      totalFiles,
      totalSize: formatBytes(totalSize),
      imagesCount,
      docsCount,
    };
  }, [media]);

  // File type icon & styling helper
  const getFileBadge = (item: MediaItem) => {
    const mime = item.mime_type?.toLowerCase() || '';
    const ext = item.file_name.split('.').pop()?.toLowerCase() || '';

    if (mime.startsWith('image/')) {
      return { icon: ImageIcon, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', label: ext.toUpperCase() || 'IMG' };
    }
    if (ext === 'pdf' || mime.includes('pdf')) {
      return { icon: FileText, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', label: 'PDF' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('csv')) {
      return { icon: FileSpreadsheet, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800', label: ext.toUpperCase() || 'XLS' };
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext) || mime.includes('word') || mime.includes('text')) {
      return { icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', label: ext.toUpperCase() || 'DOC' };
    }
    if (mime.startsWith('video/')) {
      return { icon: Film, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', label: ext.toUpperCase() || 'VID' };
    }
    if (mime.startsWith('audio/')) {
      return { icon: Music, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', label: ext.toUpperCase() || 'AUD' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: Archive, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', label: ext.toUpperCase() || 'ZIP' };
    }

    return { icon: File, color: 'text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800', label: ext.toUpperCase() || 'FILE' };
  };

  // Upload handler
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files[]', file);
    });

    const dirId = targetDirectoryId === 'root' ? '' : targetDirectoryId;
    if (dirId) {
      formData.append('directory_id', dirId);
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

      toast.success(data.message || 'Files uploaded successfully!');
      setSelectedFiles([]);
      setIsUploadModalOpen(false);
      fetchMedia();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      const response = await fetch('/media/directories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: currentDirectory || null,
        }),
        credentials: 'same-origin',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create directory');
      }

      toast.success(data.message || 'Directory created successfully');
      setNewFolderName('');
      setShowCreateFolder(false);
      fetchMedia();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create directory');
    }
  };

  // Rename folder
  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderToRename || !renameFolderName.trim()) return;

    try {
      const response = await fetch(`/media/directories/${folderToRename.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: renameFolderName.trim(),
        }),
        credentials: 'same-origin',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to rename directory');
      }

      toast.success(data.message || 'Directory renamed successfully');
      setFolderToRename(null);
      setRenameFolderName('');
      fetchMedia();
    } catch (error: any) {
      toast.error(error.message || 'Failed to rename directory');
    }
  };

  // Move media to directory
  const handleMoveMedia = async () => {
    if (!mediaToMove) return;

    try {
      const dirId = moveToDirectoryId === 'root' ? null : parseInt(moveToDirectoryId, 10);
      const response = await fetch(`/media/${mediaToMove.id}/directory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          directory_id: dirId,
        }),
        credentials: 'same-origin',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to move media');
      }

      toast.success(data.message || 'Media moved successfully');
      setMediaToMove(null);
      fetchMedia();
    } catch (error: any) {
      toast.error(error.message || 'Failed to move media');
    }
  };

  // Delete media or folder
  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      const url =
        deleteTarget.type === 'media'
          ? `/media/${deleteTarget.id}`
          : `/media/directories/${deleteTarget.id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Delete operation failed');
      }

      toast.success(data.message || 'Deleted successfully');
      setDeleteTarget(null);
      if (deleteTarget.type === 'directory' && currentDirectory === deleteTarget.id) {
        setCurrentDirectory(null);
      }
      fetchMedia();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  // Drag and drop handlers for upload modal
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Copy link
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Media Library'), href: '/media-library' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs} footerModuleName="Media Library">
      <Head title={t('Media Library')} />

      <div className="flex-1 bg-slate-50 dark:bg-background">
        {/* Header Banner */}
        <header className="bg-gradient-to-r from-vismass-blue to-vismass-grey shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-white/20 p-2 shadow">
                  <Folder className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">
                      {t('Media Library')}
                    </h1>
                    {currentDirectory && currentDirectoryObj && (
                      <Badge className="bg-white/20 text-white border-none text-xs px-2.5 py-0.5">
                        {t('Folder')}: {currentDirectoryObj.name}
                      </Badge>
                    )}
                    {showAllFiles && (
                      <Badge className="bg-white/20 text-white border-none text-xs px-2.5 py-0.5">
                        {t('All Files')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-sky-100">
                    {t('Upload, organize, inspect, and manage digital media assets')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMedia(true)}
                  disabled={loading}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  <span>{t('Refresh')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateFolder(true)}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  <FolderPlus className="h-4 w-4 mr-1" />
                  <span>{t('New Folder')}</span>
                </Button>
                <button
                  onClick={() => {
                    setTargetDirectoryId(currentDirectory ? currentDirectory.toString() : 'root');
                    setIsUploadModalOpen(true);
                  }}
                  className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-vismass-blue shadow hover:bg-slate-100 transition-all duration-200"
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  <span>{t('Upload Files')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Stat Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-xl bg-white dark:bg-card p-4 shadow-sm border border-slate-200 dark:border-border transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                    {t('Total Files')}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-foreground">
                    {stats.totalFiles}
                  </p>
                </div>
                <div className="rounded-lg bg-vismass-blue p-2.5 shadow-sm text-white">
                  <File className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-muted-foreground">
                {t('Indexed digital assets across system')}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-white dark:bg-card p-4 shadow-sm border border-slate-200 dark:border-border transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                    {t('Storage Used')}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalSize}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-500 p-2.5 shadow-sm text-white">
                  <HardDrive className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-muted-foreground">
                {t('Total storage footprint occupied')}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-white dark:bg-card p-4 shadow-sm border border-slate-200 dark:border-border transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                    {t('Images')}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.imagesCount}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-500 p-2.5 shadow-sm text-white">
                  <ImageIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-muted-foreground">
                {Math.round((stats.imagesCount / (stats.totalFiles || 1)) * 100)}% {t('of total assets')}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-white dark:bg-card p-4 shadow-sm border border-slate-200 dark:border-border transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                    {t('Documents')}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.docsCount}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-500 p-2.5 shadow-sm text-white">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-muted-foreground">
                {t('PDFs, sheets, and documents')}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mb-6 rounded-xl bg-white dark:bg-card p-4 shadow-sm border border-slate-200 dark:border-border">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search input & Back button */}
              <div className="flex flex-1 items-center gap-2">
                {(currentDirectory || showAllFiles) && (
                  <button
                    onClick={() => {
                      setCurrentDirectory(null);
                      setShowAllFiles(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted px-3 py-2 text-xs font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted/80 transition shrink-0"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>{t('Back to Root')}</span>
                  </button>
                )}

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('Search files by name or extension...')}
                    className="w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card pl-9 pr-9 py-2 text-sm text-slate-800 dark:text-foreground placeholder-slate-400 focus:border-vismass-blue focus:ring-2 focus:ring-vismass-blue/20 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs text-slate-700 dark:text-foreground focus:border-vismass-blue focus:ring-1 focus:ring-vismass-blue transition"
                >
                  <option value="all">{t('All Types')}</option>
                  <option value="images">{t('Images')}</option>
                  <option value="documents">{t('Documents')}</option>
                  <option value="sheets">{t('Sheets / CSV')}</option>
                  <option value="videos">{t('Videos')}</option>
                  <option value="audio">{t('Audio')}</option>
                  <option value="archives">{t('Archives')}</option>
                </select>

                {/* Directory View Toggle */}
                <button
                  onClick={() => {
                    setShowAllFiles(!showAllFiles);
                    setCurrentDirectory(null);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    showAllFiles
                      ? 'border-vismass-blue bg-vismass-blue text-white shadow-xs'
                      : 'border-slate-200 dark:border-border bg-white dark:bg-card text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted'
                  }`}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>{showAllFiles ? t('Directory View') : t('All Files')}</span>
                </button>

                {/* Clear Filters */}
                {(searchTerm || typeFilter !== 'all' || showAllFiles || currentDirectory) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                      setShowAllFiles(false);
                      setCurrentDirectory(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-border bg-slate-100 dark:bg-muted px-3 py-2 text-xs font-medium text-slate-700 dark:text-foreground hover:bg-slate-200 dark:hover:bg-muted/80 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>{t('Clear')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Folder Path indicator when inside folder */}
          {currentDirectory && currentDirectoryObj && !showAllFiles && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-white dark:bg-card border border-slate-200 dark:border-border px-4 py-2.5 text-xs text-slate-600 dark:text-muted-foreground shadow-xs">
              <button
                onClick={() => setCurrentDirectory(null)}
                className="hover:text-vismass-blue font-medium flex items-center gap-1 transition"
              >
                <Folder className="h-3.5 w-3.5 text-vismass-blue" />
                <span>{t('Root')}</span>
              </button>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 dark:text-foreground font-semibold flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                <span>{currentDirectoryObj.name}</span>
              </span>
            </div>
          )}

          {/* Content Card Container */}
          <div className="overflow-hidden rounded-xl bg-white dark:bg-card shadow-sm border border-slate-200 dark:border-border mb-6">
            {/* Card Header Strip */}
            <div className="border-b border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-foreground">
                  {!currentDirectory && !showAllFiles
                    ? t('Media Library Assets')
                    : currentDirectoryObj
                    ? currentDirectoryObj.name
                    : t('All Media Files')}
                </h2>
                <span className="rounded-full bg-slate-200 dark:bg-muted px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {filteredMedia.length} {t('files')}
                </span>
              </div>
              {filteredMedia.length > itemsPerPage && (
                <span className="text-xs text-slate-500 dark:text-muted-foreground">
                  {t('Showing')} {paginatedMedia.length} {t('of')} {filteredMedia.length}
                </span>
              )}
            </div>

            <div className="p-6">
              {/* Directories Section (only at root level when not in All Files flat view) */}
              {!currentDirectory && !showAllFiles && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5" />
                      <span>{t('Folders')} ({directories.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {/* All Files flat card */}
                    <div
                      onClick={() => setShowAllFiles(true)}
                      className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-border bg-slate-50/50 dark:bg-muted/20 hover:bg-slate-100/80 dark:hover:bg-muted/40 hover:border-vismass-blue/60 hover:shadow-xs transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-vismass-blue/10 text-vismass-blue group-hover:scale-110 transition-transform">
                          <Layers className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                          {t('Flat')}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-foreground group-hover:text-vismass-blue transition-colors">
                          {t('All Files')}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-muted-foreground">{t('View everything')}</p>
                      </div>
                    </div>

                    {/* Directories list */}
                    {directories.map((dir) => (
                      <div
                        key={dir.id}
                        className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 dark:border-border bg-slate-50/40 dark:bg-muted/20 hover:bg-white dark:hover:bg-card hover:border-vismass-blue/50 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div
                          className="flex items-center justify-between mb-2"
                          onClick={() => setCurrentDirectory(dir.id)}
                        >
                          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <Folder className="h-5 w-5 fill-amber-500/20" />
                          </div>

                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setFolderToRename(dir);
                                    setRenameFolderName(dir.name);
                                  }}
                                  className="gap-2"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  {t('Rename')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'directory',
                                      id: dir.id,
                                      name: dir.name,
                                    })
                                  }
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {t('Delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div onClick={() => setCurrentDirectory(dir.id)}>
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-foreground group-hover:text-vismass-blue transition-colors truncate">
                            {dir.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                            {dir.media_count !== undefined ? `${dir.media_count} ${t('files')}` : t('Folder')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Section Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
                  <File className="h-3.5 w-3.5" />
                  <span>{t('Files')} ({filteredMedia.length})</span>
                </h3>
              </div>

              {/* File Grid or States */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 p-3 flex flex-col gap-2.5 animate-pulse">
                      <div className="aspect-square bg-slate-200 dark:bg-muted rounded-lg" />
                      <div className="h-3 bg-slate-200 dark:bg-muted rounded-sm w-3/4" />
                      <div className="h-2.5 bg-slate-200 dark:bg-muted rounded-sm w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-border bg-slate-50/50 dark:bg-muted/20">
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-muted text-slate-400 mb-3">
                    <FolderOpen className="h-10 w-10 stroke-[1.5]" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-foreground">{t('No media files found')}</h3>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground max-w-sm mt-1 mb-4">
                    {searchTerm
                      ? t('No files match your search criteria. Try a different query.')
                      : t('This folder is currently empty. Upload files to get started.')}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setTargetDirectoryId(currentDirectory ? currentDirectory.toString() : 'root');
                      setIsUploadModalOpen(true);
                    }}
                    className="gap-1.5 bg-vismass-blue hover:bg-vismass-blue/90 text-white"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{t('Upload Files')}</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                  {paginatedMedia.map((item) => {
                    const badge = getFileBadge(item);
                    const isImage = item.mime_type?.startsWith('image/');

                    return (
                      <div
                        key={item.id}
                        className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card hover:border-vismass-blue/50 hover:shadow-md transition-all overflow-hidden"
                      >
                        {/* Media Thumbnail Container */}
                        <div
                          onClick={() => {
                            setSelectedMediaInfo(item);
                            setInfoModalOpen(true);
                          }}
                          className="relative aspect-square w-full bg-slate-50 dark:bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer"
                        >
                          {isImage ? (
                            <img
                              src={item.thumb_url || item.url}
                              alt={item.name}
                              loading="lazy"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                                const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}

                          {/* Fallback or non-image icon */}
                          <div
                            className={`flex flex-col items-center justify-center gap-1.5 p-4 text-center ${
                              isImage ? 'hidden' : 'flex'
                            }`}
                          >
                            <badge.icon className={`h-10 w-10 ${badge.color.split(' ')[0]}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 rounded-full shadow-sm bg-white text-slate-800 hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMediaInfo(item);
                                setInfoModalOpen(true);
                              }}
                              title={t('View Info')}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </Button>

                            <a
                              href={`/media/${item.id}/download`}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-slate-800 hover:bg-slate-100 shadow-sm"
                              title={t('Download')}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-2.5 flex items-start justify-between gap-1 border-t border-slate-100 dark:border-border/60">
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              setSelectedMediaInfo(item);
                              setInfoModalOpen(true);
                            }}
                          >
                            <p className="text-xs font-semibold text-slate-900 dark:text-foreground truncate" title={item.name}>
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-muted-foreground mt-0.5">
                              <span>{formatBytes(item.size)}</span>
                              <span>•</span>
                              <span>
                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                          </div>

                          {/* Dropdown Options */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs w-40">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMediaInfo(item);
                                  setInfoModalOpen(true);
                                }}
                                className="gap-2"
                              >
                                <Info className="h-3.5 w-3.5" />
                                {t('View Info')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(item.url)} className="gap-2">
                                <Copy className="h-3.5 w-3.5" />
                                {t('Copy Link')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setMediaToMove(item);
                                  setMoveToDirectoryId(item.directory_id ? item.directory_id.toString() : 'root');
                                }}
                                className="gap-2"
                              >
                                <MoveRight className="h-3.5 w-3.5" />
                                {t('Move Folder')}
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="gap-2">
                                <a href={`/media/${item.id}/download`} download>
                                  <Download className="h-3.5 w-3.5" />
                                  {t('Download')}
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'media',
                                    id: item.id,
                                    name: item.name,
                                  })
                                }
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t('Delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-border pt-4 mt-6 gap-3">
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">
                    {t('Page')} <span className="font-semibold text-slate-700 dark:text-foreground">{currentPage}</span> {t('of')}{' '}
                    <span className="font-semibold text-slate-700 dark:text-foreground">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 text-xs border-slate-200 dark:border-border"
                    >
                      {t('Previous')}
                    </Button>
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNum = index + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - currentPage) <= 1
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 w-8 text-xs p-0 ${
                              currentPage === pageNum
                                ? 'bg-vismass-blue text-white hover:bg-vismass-blue/90'
                                : 'border-slate-200 dark:border-border'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return (
                          <span key={pageNum} className="text-xs text-slate-400 px-1">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 text-xs border-slate-200 dark:border-border"
                    >
                      {t('Next')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Table / Card Footer Summary */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/30 px-6 py-3 text-xs text-slate-500 dark:text-muted-foreground">
              <div>
                {t('Showing')}{' '}
                <span className="font-semibold text-slate-700 dark:text-foreground">
                  {paginatedMedia.length}
                </span>{' '}
                {t('of')}{' '}
                <span className="font-semibold text-slate-700 dark:text-foreground">
                  {filteredMedia.length}
                </span>{' '}
                {t('media items')}
              </div>
              <div className="text-slate-400">
                {t('VISMASS POS Media Asset Repository')}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Upload Modal with Drag & Drop */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Media Files
            </DialogTitle>
            <DialogDescription>
              Select files or drag and drop them below. Files will be stored in your media library.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Target Folder Selector */}
            <div className="flex items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-lg border">
              <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Folder className="h-4 w-4 text-amber-500" />
                Target Directory:
              </span>
              <Select value={targetDirectoryId} onValueChange={setTargetDirectoryId}>
                <SelectTrigger className="h-8 text-xs w-[180px]">
                  <SelectValue placeholder="Root Directory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root (No Folder)</SelectItem>
                  {directories.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-border/80 hover:border-primary/50 bg-muted/20'
              }`}
            >
              <input
                type="file"
                multiple
                id="file-upload-input"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Drag and drop files here, or{' '}
                  <label
                    htmlFor="file-upload-input"
                    className="text-primary hover:underline cursor-pointer"
                  >
                    browse
                  </label>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Supports Images (PNG, JPG, WEBP, GIF), Documents (PDF, DOCX, XLSX), Audio & Video.
                </p>
              </div>
            </div>

            {/* Selected files preview list */}
            {selectedFiles.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Selected Files ({selectedFiles.length}):
                </p>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-card border text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <File className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-muted-foreground shrink-0 text-[10px]">
                        ({formatBytes(file.size)})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeSelectedFile(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFiles([]);
                setIsUploadModalOpen(false);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="gap-1.5"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Modal */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateFolder}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-primary" />
                Create New Folder
              </DialogTitle>
              <DialogDescription>
                Enter a directory name to organize your uploaded files.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="text-xs font-medium mb-1.5 block">Folder Name</label>
              <Input
                placeholder="e.g. Logos, Invoices, Marketing"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateFolder(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Create Folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Modal */}
      <Dialog open={!!folderToRename} onOpenChange={(open) => !open && setFolderToRename(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRenameFolder}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" />
                Rename Folder
              </DialogTitle>
              <DialogDescription>Update the folder display name.</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="text-xs font-medium mb-1.5 block">Folder Name</label>
              <Input
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFolderToRename(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Media to Directory Modal */}
      <Dialog open={!!mediaToMove} onOpenChange={(open) => !open && setMediaToMove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MoveRight className="h-5 w-5 text-primary" />
              Move File to Directory
            </DialogTitle>
            <DialogDescription>
              Select which directory to move <span className="font-semibold text-foreground">{mediaToMove?.name}</span> to.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-xs font-medium mb-1.5 block">Destination Folder</label>
            <Select value={moveToDirectoryId} onValueChange={setMoveToDirectoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Root Directory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No Folder)</SelectItem>
                {directories.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMediaToMove(null)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleMoveMedia}>
              Move File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Details Info Modal */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate pr-4">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{selectedMediaInfo?.name}</span>
            </DialogTitle>
            <DialogDescription>Asset metadata and storage information</DialogDescription>
          </DialogHeader>

          {selectedMediaInfo && (
            <div className="flex flex-col gap-4 py-2">
              {/* Preview Box */}
              <div className="aspect-video w-full rounded-xl bg-muted/30 border flex items-center justify-center overflow-hidden">
                {selectedMediaInfo.mime_type?.startsWith('image/') ? (
                  <img
                    src={selectedMediaInfo.url}
                    alt={selectedMediaInfo.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-6">
                    <File className="h-14 w-14 text-primary" />
                    <span className="text-xs font-semibold uppercase">
                      {selectedMediaInfo.mime_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata Details List */}
              <div className="grid grid-cols-2 gap-2.5 text-xs bg-muted/20 p-3 rounded-xl border">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Filename:</span>
                  <span className="font-semibold text-foreground truncate block">
                    {selectedMediaInfo.file_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">File Size:</span>
                  <span className="font-semibold text-foreground">
                    {formatBytes(selectedMediaInfo.size)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">MIME Type:</span>
                  <span className="font-semibold text-foreground">
                    {selectedMediaInfo.mime_type || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Uploaded At:</span>
                  <span className="font-semibold text-foreground">
                    {selectedMediaInfo.created_at
                      ? new Date(selectedMediaInfo.created_at).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* URL with Copy */}
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={selectedMediaInfo.url}
                  className="h-8 text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(selectedMediaInfo.url)}
                  className="h-8 shrink-0 gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            {selectedMediaInfo && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setInfoModalOpen(false);
                  setDeleteTarget({
                    type: 'media',
                    id: selectedMediaInfo.id,
                    name: selectedMediaInfo.name,
                  });
                }}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInfoModalOpen(false)}
              >
                Close
              </Button>
              {selectedMediaInfo && (
                <a
                  href={`/media/${selectedMediaInfo.id}/download`}
                  download
                  className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
              {deleteTarget?.type === 'directory'
                ? ' Files inside this directory will be moved to root.'
                : ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={executeDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
