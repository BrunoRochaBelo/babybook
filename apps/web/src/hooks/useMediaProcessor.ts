/**
 * useMediaProcessor Hook
 *
 * React hook for client-side media processing with automatic fallback.
 * Handles video transcoding, thumbnail extraction, and image optimization.
 *
 * Features:
 * - Automatic device capability detection
 * - Progress tracking
 * - Fallback to server-side processing
 * - Abort functionality
 *
 * Usage:
 * ```tsx
 * function UploadComponent() {
 *   const {
 *     transcodeVideo,
 *     isProcessing,
 *     progress,
 *     supportsClientProcessing
 *   } = useMediaProcessor();
 *
 *   const handleUpload = async (file: File) => {
 *     const result = await transcodeVideo(file, { resolution: '720p' });
 *     // Upload result.blob to storage
 *   };
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MediaProcessorService,
  getMediaProcessor,
  canProcessOnClient,
  detectDeviceCapabilities,
  type TranscodeOptions,
  type ThumbnailOptions,
  type OptimizeOptions,
  type ProcessingResult,
  type DeviceCapabilities,
} from "../services/media-processor";

export interface MediaProcessorState {
  isInitializing: boolean;
  isProcessing: boolean;
  isReady: boolean;
  progress: number;
  stage: string;
  error: string | null;
  capabilities: DeviceCapabilities | null;
}

export interface UseMediaProcessorReturn extends MediaProcessorState {
  // Processing methods
  transcodeVideo: (
    file: File,
    options?: Partial<TranscodeOptions>,
  ) => Promise<ProcessingResult>;
  extractThumbnail: (
    file: File,
    options?: ThumbnailOptions,
  ) => Promise<ProcessingResult>;
  optimizeImage: (
    file: File,
    options?: OptimizeOptions,
  ) => Promise<ProcessingResult>;

  // Control methods
  abort: () => void;
  reset: () => void;

  // Capability checks
  supportsClientProcessing: boolean;
  shouldUseServerFallback: boolean;
}

const DEFAULT_TRANSCODE_OPTIONS: TranscodeOptions = {
  resolution: "720p",
  format: "mp4",
  quality: "medium",
};

export function useMediaProcessor(): UseMediaProcessorReturn {
  const [state, setState] = useState<MediaProcessorState>({
    isInitializing: false,
    isProcessing: false,
    isReady: false,
    progress: 0,
    stage: "",
    error: null,
    capabilities: null,
  });

  const processorRef = useRef<MediaProcessorService | null>(null);
  const currentJobRef = useRef<string | null>(null);

  // Detect capabilities on mount
  useEffect(() => {
    const caps = detectDeviceCapabilities();
    setState((prev) => ({ ...prev, capabilities: caps }));
  }, []);

  // Initialize processor lazily
  const ensureInitialized = useCallback(async (): Promise<boolean> => {
    if (processorRef.current?.ready) {
      return true;
    }

    if (!canProcessOnClient()) {
      return false;
    }

    setState((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
      const processor = getMediaProcessor();
      const success = await processor.initialize();

      if (success) {
        processorRef.current = processor;
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          isReady: true,
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          isReady: false,
        }));
        return false;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        isReady: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize processor",
      }));
      return false;
    }
  }, []);

  // Progress callback
  const handleProgress = useCallback((progress: number, stage: string) => {
    setState((prev) => ({ ...prev, progress, stage }));
  }, []);

  // Transcode video
  const transcodeVideo = useCallback(
    async (
      file: File,
      options?: Partial<TranscodeOptions>,
    ): Promise<ProcessingResult> => {
      const initialized = await ensureInitialized();

      if (!initialized || !processorRef.current) {
        // Return a marker for server fallback
        throw new Error("CLIENT_PROCESSING_UNAVAILABLE");
      }

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        progress: 0,
        stage: "starting",
        error: null,
      }));

      try {
        const mergedOptions: TranscodeOptions = {
          ...DEFAULT_TRANSCODE_OPTIONS,
          ...options,
          onProgress: handleProgress,
        };

        const result = await processorRef.current.transcodeVideo(
          file,
          mergedOptions,
        );

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          stage: "complete",
        }));

        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : "Transcoding failed",
        }));
        throw error;
      }
    },
    [ensureInitialized, handleProgress],
  );

  // Extract thumbnail
  const extractThumbnail = useCallback(
    async (
      file: File,
      options?: ThumbnailOptions,
    ): Promise<ProcessingResult> => {
      const initialized = await ensureInitialized();

      if (!initialized || !processorRef.current) {
        throw new Error("CLIENT_PROCESSING_UNAVAILABLE");
      }

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        progress: 0,
        stage: "extracting thumbnail",
        error: null,
      }));

      try {
        const result = await processorRef.current.extractThumbnail(
          file,
          options,
        );

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          stage: "complete",
        }));

        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error:
            error instanceof Error
              ? error.message
              : "Thumbnail extraction failed",
        }));
        throw error;
      }
    },
    [ensureInitialized],
  );

  // Optimize image
  const optimizeImage = useCallback(
    async (
      file: File,
      options?: OptimizeOptions,
    ): Promise<ProcessingResult> => {
      const initialized = await ensureInitialized();

      if (!initialized || !processorRef.current) {
        throw new Error("CLIENT_PROCESSING_UNAVAILABLE");
      }

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        progress: 0,
        stage: "optimizing image",
        error: null,
      }));

      try {
        const result = await processorRef.current.optimizeImage(file, options);

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          stage: "complete",
        }));

        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error:
            error instanceof Error
              ? error.message
              : "Image optimization failed",
        }));
        throw error;
      }
    },
    [ensureInitialized],
  );

  // Abort current processing
  const abort = useCallback(() => {
    if (currentJobRef.current && processorRef.current) {
      processorRef.current.abort(currentJobRef.current);
      currentJobRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isProcessing: false,
      progress: 0,
      stage: "",
      error: "Cancelled by user",
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      progress: 0,
      stage: "",
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processorRef.current) {
        processorRef.current.cleanup();
        processorRef.current = null;
      }
    };
  }, []);

  // Computed values
  const supportsClientProcessing = state.capabilities
    ? state.capabilities.supportsSharedArrayBuffer &&
      state.capabilities.supportsWebWorker &&
      !state.capabilities.isLowEndDevice
    : false;

  const shouldUseServerFallback: boolean =
    !supportsClientProcessing ||
    Boolean(
      state.capabilities?.isMobile &&
        state.capabilities?.estimatedMemoryMB < 3072,
    );

  return {
    ...state,
    transcodeVideo,
    extractThumbnail,
    optimizeImage,
    abort,
    reset,
    supportsClientProcessing,
    shouldUseServerFallback,
  };
}

export default useMediaProcessor;
