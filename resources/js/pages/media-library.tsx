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
    { title: 'Dashboard', href: '/company/dashboard' },
    { title: 'Media Library', href: '/media-library' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Media Library - Manage Media" />

      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow-sm shadow-blue-500/20">
                  <Layers className="h-6 w-6" />
                </div>
                Media Library
              </h1>
              {currentDirectoryObj && (
                <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-medium ml-2 bg-muted/80">
                  Folder: {currentDirectoryObj.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Upload, organize, inspect, and manage your digital assets across your company workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
              className="gap-1.5 shadow-xs"
            >
              <FolderPlus className="h-4 w-4 text-primary" />
              <span>New Folder</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setTargetDirectoryId(currentDirectory ? currentDirectory.toString() : 'root');
                setIsUploadModalOpen(true);
              }}
              className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-600/20"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Files</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-xl border bg-card/60 backdrop-blur-xs p-4 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <File className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Files</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{stats.totalFiles}</h3>
            </div>
          </div>

          <div className="rounded-xl border bg-card/60 backdrop-blur-xs p-4 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Storage Used</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{stats.totalSize}</h3>
            </div>
          </div>

          <div className="rounded-xl border bg-card/60 backdrop-blur-xs p-4 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Images</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{stats.imagesCount}</h3>
            </div>
          </div>

          <div className="rounded-xl border bg-card/60 backdrop-blur-xs p-4 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Documents</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{stats.docsCount}</h3>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Folders Navigation */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/40 p-3 rounded-xl border">
          <div className="flex flex-1 items-center gap-2">
            {/* Back Button if in folder */}
            {(currentDirectory || showAllFiles) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentDirectory(null);
                  setShowAllFiles(false);
                }}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Root
              </Button>
            )}

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Filter by Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="sheets">Sheets/CSV</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="archives">Archives</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggle All Files vs Directory view */}
            <Button
              variant={showAllFiles ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                setShowAllFiles(!showAllFiles);
                setCurrentDirectory(null);
              }}
              className="h-9 text-xs gap-1.5"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>{showAllFiles ? 'Directory View' : 'All Files'}</span>
            </Button>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchMedia(true)}
              disabled={loading}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Refresh Media"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Breadcrumb path navigation inside directory */}
        {currentDirectory && currentDirectoryObj && !showAllFiles && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <button
              onClick={() => setCurrentDirectory(null)}
              className="hover:underline flex items-center gap-1 font-medium"
            >
              <Folder className="h-3.5 w-3.5 text-blue-500" />
              Home
            </button>
            <span>/</span>
            <span className="text-foreground font-semibold flex items-center gap-1">
              <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
              {currentDirectoryObj.name}
            </span>
          </div>
        )}

        {/* Directory Folders (Displayed only at root level when not in "All Files" flat view) */}
        {!currentDirectory && !showAllFiles && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Directories ({directories.length})
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* All Files folder card */}
              <div
                onClick={() => setShowAllFiles(true)}
                className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-dashed border-border/80 bg-card/40 hover:bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                    <Layers className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                    Flat
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    All Files
                  </h4>
                  <p className="text-[11px] text-muted-foreground">View everything</p>
                </div>
              </div>

              {/* User directories */}
              {directories.map((dir) => (
                <div
                  key={dir.id}
                  className="group relative flex flex-col justify-between p-3.5 rounded-xl border bg-card/60 hover:bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2" onClick={() => setCurrentDirectory(dir.id)}>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                      <Folder className="h-5 w-5 fill-amber-500/20" />
                    </div>

                    {/* Folder menu */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
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
                            Rename
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
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div onClick={() => setCurrentDirectory(dir.id)}>
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {dir.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {dir.media_count !== undefined ? `${dir.media_count} files` : 'Folder'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Grid Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Files ({filteredMedia.length})
            </h2>
            {filteredMedia.length > itemsPerPage && (
              <span className="text-xs text-muted-foreground">
                Showing {paginatedMedia.length} of {filteredMedia.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card/40 p-3 flex flex-col gap-2.5 animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg" />
                  <div className="h-3 bg-muted rounded-sm w-3/4" />
                  <div className="h-2.5 bg-muted rounded-sm w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed bg-card/30">
              <div className="p-4 rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                <FolderOpen className="h-10 w-10 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No media files found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {searchTerm
                  ? 'No files match your search criteria. Try a different query.'
                  : 'This folder is currently empty. Upload files or drag and drop items to get started.'}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setTargetDirectoryId(currentDirectory ? currentDirectory.toString() : 'root');
                  setIsUploadModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Files</span>
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
                    className="group relative flex flex-col justify-between rounded-xl border bg-card/70 hover:bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Media Thumbnail Container */}
                    <div
                      onClick={() => {
                        setSelectedMediaInfo(item);
                        setInfoModalOpen(true);
                      }}
                      className="relative aspect-square w-full bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {isImage ? (
                        <img
                          src={item.thumb_url || item.url}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback to icon on image load error
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      {/* Non-image or image fallback */}
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
                          className="h-8 w-8 rounded-full shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMediaInfo(item);
                            setInfoModalOpen(true);
                          }}
                          title="View Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </Button>

                        <a
                          href={`/media/${item.id}/download`}
                          download
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Card Footer Details */}
                    <div className="p-2.5 flex items-start justify-between gap-1">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          setSelectedMediaInfo(item);
                          setInfoModalOpen(true);
                        }}
                      >
                        <p className="text-xs font-semibold text-foreground truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
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
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground shrink-0">
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
                            View Info
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(item.url)} className="gap-2">
                            <Copy className="h-3.5 w-3.5" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setMediaToMove(item);
                              setMoveToDirectoryId(item.directory_id ? item.directory_id.toString() : 'root');
                            }}
                            className="gap-2"
                          >
                            <MoveRight className="h-3.5 w-3.5" />
                            Move Folder
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="gap-2">
                            <a href={`/media/${item.id}/download`} download>
                              <Download className="h-3.5 w-3.5" />
                              Download
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
                            Delete
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
            <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-6">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  // Show current, first, last, and immediate siblings
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
                        className="h-8 w-8 text-xs p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return (
                      <span key={pageNum} className="text-xs text-muted-foreground px-1">
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
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
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
