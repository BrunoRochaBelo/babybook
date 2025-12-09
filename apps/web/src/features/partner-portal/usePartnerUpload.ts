/**
 * usePartnerUpload Hook
 *
 * Manages file uploads for partner deliveries with:
 * - Client-side image compression using browser-image-compression
 * - Progress tracking
 * - Concurrent upload management
 * - Error handling and retry logic
 */

import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  initUpload,
  uploadFileToPresignedUrl,
  confirmUpload,
  compressImage,
  isCompressibleImage,
} from "./api";
import type { UploadProgress } from "./types";

interface UsePartnerUploadOptions {
  deliveryId: string;
  onUploadComplete?: (uploadId: string, filename: string) => void;
  onAllComplete?: () => void;
  maxConcurrent?: number;
  compressionOptions?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  };
}

interface UploadItem {
  id: string;
  file: File;
  status: UploadProgress["status"];
  progress: number;
  error?: string;
}

export function usePartnerUpload(options: UsePartnerUploadOptions) {
  const {
    deliveryId,
    onUploadComplete,
    onAllComplete,
    maxConcurrent = 3,
    compressionOptions,
  } = options;

  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<Map<string, UploadItem>>(new Map());
  const activeCountRef = useRef(0);
  const queueRef = useRef<UploadItem[]>([]);

  // Update upload progress
  const updateUpload = useCallback(
    (id: string, updates: Partial<UploadItem>) => {
      setUploads((prev) => {
        const newMap = new Map(prev);
        const item = newMap.get(id);
        if (item) {
          newMap.set(id, { ...item, ...updates });
        }
        return newMap;
      });
    },
    [],
  );

  // Process a single upload
  const processUpload = useCallback(
    async (item: UploadItem) => {
      try {
        updateUpload(item.id, { status: "compressing", progress: 0 });

        // Compress image if applicable
        let fileToUpload: File | Blob = item.file;
        if (isCompressibleImage(item.file)) {
          try {
            fileToUpload = await compressImage(item.file, compressionOptions);
          } catch (err) {
            // If compression fails, use original file
            console.warn("Image compression failed, using original:", err);
            fileToUpload = item.file;
          }
        }

        updateUpload(item.id, { status: "uploading", progress: 5 });

        // Initialize upload
        const initResult = await initUpload(deliveryId, {
          filename: item.file.name,
          content_type: item.file.type,
          size_bytes: fileToUpload.size,
        });

        // Upload to presigned URL
        await uploadFileToPresignedUrl(
          initResult.upload_url,
          fileToUpload,
          item.file.type,
          (progress) => {
            // Scale progress: 5-95%
            updateUpload(item.id, { progress: 5 + Math.round(progress * 0.9) });
          },
        );

        // Confirm upload
        await confirmUpload(deliveryId, {
          upload_id: initResult.upload_id,
          key: initResult.key,
          filename: item.file.name,
          content_type: item.file.type,
          size_bytes: fileToUpload.size,
        });

        updateUpload(item.id, { status: "complete", progress: 100 });
        onUploadComplete?.(initResult.upload_id, item.file.name);

        // Invalidate delivery query to refresh asset list
        queryClient.invalidateQueries({ queryKey: ["delivery", deliveryId] });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        updateUpload(item.id, { status: "error", error: errorMessage });
      } finally {
        activeCountRef.current--;
        processQueue();
      }
    },
    [
      deliveryId,
      compressionOptions,
      onUploadComplete,
      queryClient,
      updateUpload,
    ],
  );

  // Process upload queue
  const processQueue = useCallback(() => {
    while (
      activeCountRef.current < maxConcurrent &&
      queueRef.current.length > 0
    ) {
      const item = queueRef.current.shift()!;
      activeCountRef.current++;
      processUpload(item);
    }

    // Check if all complete
    if (activeCountRef.current === 0 && queueRef.current.length === 0) {
      const allComplete = Array.from(uploads.values()).every(
        (u) => u.status === "complete" || u.status === "error",
      );
      if (allComplete && uploads.size > 0) {
        onAllComplete?.();
      }
    }
  }, [maxConcurrent, processUpload, uploads, onAllComplete]);

  // Add files to upload queue
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newItems: UploadItem[] = fileArray.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: "compressing" as const,
        progress: 0,
      }));

      // Add to state
      setUploads((prev) => {
        const newMap = new Map(prev);
        for (const item of newItems) {
          newMap.set(item.id, item);
        }
        return newMap;
      });

      // Add to queue and start processing
      queueRef.current.push(...newItems);
      processQueue();
    },
    [processQueue],
  );

  // Retry failed upload
  const retryUpload = useCallback(
    (uploadId: string) => {
      const item = uploads.get(uploadId);
      if (item && item.status === "error") {
        updateUpload(uploadId, {
          status: "compressing",
          progress: 0,
          error: undefined,
        });
        queueRef.current.push(item);
        processQueue();
      }
    },
    [uploads, updateUpload, processQueue],
  );

  // Remove upload from list
  const removeUpload = useCallback((uploadId: string) => {
    setUploads((prev) => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });
    queueRef.current = queueRef.current.filter((item) => item.id !== uploadId);
  }, []);

  // Clear all uploads
  const clearUploads = useCallback(() => {
    setUploads(new Map());
    queueRef.current = [];
    activeCountRef.current = 0;
  }, []);

  // Computed values
  const uploadList = Array.from(uploads.values());
  const isUploading = uploadList.some(
    (u) => u.status === "compressing" || u.status === "uploading",
  );
  const hasErrors = uploadList.some((u) => u.status === "error");
  const completedCount = uploadList.filter(
    (u) => u.status === "complete",
  ).length;
  const totalProgress =
    uploadList.length > 0
      ? Math.round(
          uploadList.reduce((sum, u) => sum + u.progress, 0) /
            uploadList.length,
        )
      : 0;

  return {
    uploads: uploadList,
    addFiles,
    retryUpload,
    removeUpload,
    clearUploads,
    isUploading,
    hasErrors,
    completedCount,
    totalCount: uploadList.length,
    totalProgress,
  };
}
