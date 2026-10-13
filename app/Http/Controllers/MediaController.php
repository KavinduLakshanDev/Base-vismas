<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\MediaDirectory;
use App\Models\User;
use App\Services\DynamicStorageService;
use App\Services\StorageConfigService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MediaController extends Controller
{
    private function getAuthenticatedUser(Request $request)
    {
        return $request->user('company') ?? $request->user('web') ?? Auth::user();
    }

    private function getTenantId(Request $request): ?int
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return null;
        }

        // If company guard
        if ($request->user('company')) {
            return $user->id;
        }

        // If super admin
        if (isset($user->user_type) && $user->user_type === 'super_admin') {
            return $user->id;
        }

        // If normal user
        return $user->id;
    }

    private function canAccessMedia($user, string $permission): bool
    {
        if (!$user) {
            return false;
        }

        if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return true;
        }

        if (isset($user->user_type) && in_array($user->user_type, ['super_admin', 'company_admin'])) {
            return true;
        }

        if (method_exists($user, 'hasPermission')) {
            return $user->hasPermission($permission);
        }

        return true;
    }

    public function page(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return redirect()->route('login');
        }

        if (!$this->canAccessMedia($user, 'manage-media')) {
            return back()->with('error', __('Permission denied'));
        }

        return Inertia::render('media-library');
    }

    public function index(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => __('Unauthorized')], 401);
        }

        if (!$this->canAccessMedia($user, 'manage-media')) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $directoryId = $request->query('directory_id');
        $mediaQuery = Media::query();

        // Filter by directory if provided
        if ($directoryId !== null && $directoryId !== '') {
            $mediaQuery->where('directory_id', $directoryId);
        }

        // Multi-tenant isolation
        if (isset($user->user_type) && $user->user_type === 'super_admin') {
            // Super admin sees all, or can filter by company
        } else {
            $mediaQuery->where(function ($q) use ($user) {
                $q->where('creator_id', $user->id)
                  ->orWhere('created_by', $user->id);
            });
        }

        $media = $mediaQuery->latest()->get()->map(function (Media $item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'file_name' => $item->file_name,
                'url' => $item->url,
                'thumb_url' => $item->thumb_url,
                'size' => $item->size,
                'mime_type' => $item->mime_type,
                'directory_id' => $item->directory_id,
                'creator_id' => $item->creator_id,
                'created_by' => $item->created_by,
                'created_at' => $item->created_at?->toIso8601String(),
            ];
        });

        // Get root directories
        $directoriesQuery = MediaDirectory::whereNull('parent_id')->withCount('media');

        if (isset($user->user_type) && $user->user_type === 'super_admin') {
            // Super admin sees all directories
        } else {
            $directoriesQuery->where(function ($q) use ($user) {
                $q->where('creator_id', $user->id)
                  ->orWhere('created_by', $user->id);
            });
        }

        $directories = $directoriesQuery->orderBy('name')->get();

        return response()->json([
            'media' => $media,
            'directories' => $directories,
        ]);
    }

    public function batchStore(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => __('Unauthorized')], 401);
        }

        if (!$this->canAccessMedia($user, 'create-media') && !$this->canAccessMedia($user, 'manage-media')) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $files = $request->file('files');
        if (!$files || !is_array($files)) {
            return response()->json([
                'message' => __('Please select at least one file to upload.'),
                'errors' => [__('Files must be provided as an array.')],
            ], 422);
        }

        // Storage limit check
        $storageCheck = $this->checkStorageLimit($user, $files);
        if ($storageCheck) {
            return $storageCheck;
        }

        $config = StorageConfigService::getStorageConfig();
        $validationRules = StorageConfigService::getFileValidationRules();

        $validator = Validator::make($request->all(), [
            'files' => 'required|array',
            'files.*' => array_merge(['file'], $validationRules),
            'directory_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('File validation failed'),
                'errors' => $validator->errors()->all(),
            ], 422);
        }

        // Configure dynamic storage (S3/Wasabi/Public)
        DynamicStorageService::configureDynamicDisks();
        $activeDisk = StorageConfigService::getActiveDisk();

        $uploadedMedia = [];
        $errors = [];

        foreach ($files as $file) {
            $originalName = $file->getClientOriginalName();
            try {
                $extension = $file->getClientOriginalExtension();
                $hashedName = Str::random(40) . ($extension ? '.' . $extension : '');

                // Store file directly to storage disk
                $storedPath = $file->storeAs('media', $hashedName, $activeDisk);

                // Create Media database record
                $media = new Media();
                $media->model_type = get_class($user);
                $media->model_id = $user->id;
                $media->uuid = (string) Str::uuid();
                $media->collection_name = 'files';
                $media->name = pathinfo($originalName, PATHINFO_FILENAME);
                $media->file_name = $hashedName;
                $media->mime_type = $file->getMimeType();
                $media->disk = $activeDisk;
                $media->size = $file->getSize();
                $media->manipulations = [];
                $media->custom_properties = [];
                $media->generated_conversions = [];
                $media->responsive_images = [];
                $media->creator_id = $user->id;
                $media->created_by = $this->getTenantId($request);
                $media->directory_id = $request->input('directory_id') ?: null;
                $media->save();

                $uploadedMedia[] = [
                    'id' => $media->id,
                    'name' => $media->name,
                    'file_name' => $media->file_name,
                    'url' => $media->url,
                    'thumb_url' => $media->thumb_url,
                    'size' => $media->size,
                    'mime_type' => $media->mime_type,
                    'directory_id' => $media->directory_id,
                    'creator_id' => $media->creator_id,
                    'created_by' => $media->created_by,
                    'created_at' => $media->created_at?->toIso8601String(),
                ];
            } catch (\Exception $e) {
                if (isset($storedPath) && Storage::disk($activeDisk)->exists($storedPath)) {
                    Storage::disk($activeDisk)->delete($storedPath);
                }

                Log::error('Media upload failed', [
                    'file' => $originalName,
                    'error' => $e->getMessage(),
                ]);

                $errors[] = $originalName . ': ' . $e->getMessage();
            }
        }

        return response()->json([
            'message' => count($uploadedMedia) > 0 ? __('The media uploaded successfully.') : __('Upload failed'),
            'data' => $uploadedMedia,
            'errors' => $errors,
        ]);
    }

    public function download(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || (!$this->canAccessMedia($user, 'download-media') && !$this->canAccessMedia($user, 'manage-media'))) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $media = Media::findOrFail($id);
        $disk = $media->disk ?: 'public';

        try {
            $filePath = 'media/' . $media->file_name;
            if (!Storage::disk($disk)->exists($filePath)) {
                abort(404, __('File not found on storage.'));
            }

            $downloadName = $media->name . ($media->file_name ? '.' . pathinfo($media->file_name, PATHINFO_EXTENSION) : '');

            return Storage::disk($disk)->download($filePath, $downloadName);
        } catch (\Exception $e) {
            abort(404, __('File storage unavailable'));
        }
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || (!$this->canAccessMedia($user, 'delete-media') && !$this->canAccessMedia($user, 'manage-media'))) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $media = Media::findOrFail($id);

        try {
            Storage::disk($media->disk ?: 'public')->delete('media/' . $media->file_name);
            $media->delete();
        } catch (\Exception $e) {
            $media->delete();
        }

        return response()->json(['message' => __('The media has been deleted.')]);
    }

    public function createDirectory(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || (!$this->canAccessMedia($user, 'create-media-directories') && !$this->canAccessMedia($user, 'manage-media'))) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:media_directories,id',
        ]);

        $slug = Str::slug($request->name . '-' . time());

        $directory = MediaDirectory::create([
            'name' => $request->name,
            'slug' => $slug,
            'parent_id' => $request->parent_id ?: null,
            'creator_id' => $user->id,
            'created_by' => $this->getTenantId($request),
        ]);

        return response()->json([
            'message' => __('The directory has been created successfully.'),
            'directory' => $directory,
        ]);
    }

    public function updateMediaDirectory(Request $request, $mediaId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => __('Unauthorized')], 401);
        }

        $request->validate([
            'directory_id' => 'nullable|exists:media_directories,id',
        ]);

        $media = Media::findOrFail($mediaId);
        $media->update(['directory_id' => $request->directory_id ?: null]);

        return response()->json([
            'message' => __('The media moved successfully.'),
        ]);
    }

    public function updateDirectory(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || (!$this->canAccessMedia($user, 'edit-media-directories') && !$this->canAccessMedia($user, 'manage-media'))) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $directory = MediaDirectory::findOrFail($id);
        $slug = Str::slug($request->name . '-' . time());

        $directory->update([
            'name' => $request->name,
            'slug' => $slug,
        ]);

        return response()->json([
            'message' => __('The directory details are updated successfully.'),
            'directory' => $directory,
        ]);
    }

    public function destroyDirectory(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user || (!$this->canAccessMedia($user, 'delete-media-directories') && !$this->canAccessMedia($user, 'manage-media'))) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $directory = MediaDirectory::findOrFail($id);
        $directory->delete();

        return response()->json([
            'message' => __('The directory has been deleted.'),
        ]);
    }

    private function checkStorageLimit($user, array $files)
    {
        if (isset($user->user_type) && $user->user_type === 'super_admin') {
            return null;
        }

        $storageLimit = isset($user->storage_limit) ? (float) $user->storage_limit : -1;
        if ($storageLimit == -1 || $storageLimit <= 0) {
            return null;
        }

        $limitBytes = $storageLimit * 1024; // KB to Bytes
        $totalNewSize = 0;
        foreach ($files as $file) {
            $totalNewSize += $file->getSize();
        }

        $currentUsage = Media::where('created_by', $user->id)
            ->orWhere('creator_id', $user->id)
            ->sum('size');

        if (($currentUsage + $totalNewSize) > $limitBytes) {
            return response()->json([
                'message' => __('Storage limit exceeded'),
                'errors' => [__('Storage quota reached. Please delete files or upgrade your plan.')],
            ], 422);
        }

        return null;
    }
}
