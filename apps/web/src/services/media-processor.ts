/**
 * Media Processor Service
 *
 * Manages client-side media processing with ffmpeg.wasm.
 * Provides fallback to server-side processing when:
 * - Device doesn't support SharedArrayBuffer (required for ffmpeg.wasm)
 * - Processing fails
 * - User is on mobile with limited resources
 *
 * Usage:
 * ```ts
 * const processor = new MediaProcessorService();
 * await processor.initialize();
 *
 * const result = await processor.transcodeVideo(file, {
 *   resolution: '720p',
 *   format: 'mp4',
 *   quality: 'medium',
 * });
 * ```
 */

import type {
  WorkerMessage,
  WorkerResponse,
  TranscodePayload,
  ThumbnailPayload,
  OptimizePayload,
  MediaMetadata,
} from "../workers/media-processor.worker";

export interface TranscodeOptions {
  resolution: "720p" | "1080p" | "480p";
  format: "mp4" | "webm";
  quality: "high" | "medium" | "low";
  onProgress?: (progress: number, stage: string) => void;
}

export interface ThumbnailOptions {
  timeSeconds?: number;
  width?: number;
  height?: number;
}

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export interface ProcessingResult {
  blob: Blob;
  metadata: MediaMetadata;
  processedOnClient: boolean;
}

export interface DeviceCapabilities {
  supportsSharedArrayBuffer: boolean;
  supportsWebWorker: boolean;
  estimatedMemoryMB: number;
  isMobile: boolean;
  isLowEndDevice: boolean;
}

type PendingJob = {
  resolve: (value: ProcessingResult) => void;
  reject: (reason: Error) => void;
  onProgress?: (progress: number, stage: string) => void;
};

/**
 * Detect device capabilities for client-side processing
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const supportsSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
  const supportsWebWorker = typeof Worker !== "undefined";

  // Estimate available memory (if API is available)
  const deviceMemory = (navigator as unknown as { deviceMemory?: number })
    .deviceMemory;
  const estimatedMemoryMB = deviceMemory ? deviceMemory * 1024 : 4096; // Default to 4GB

  // Mobile detection
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // Low-end device heuristics
  const isLowEndDevice =
    estimatedMemoryMB < 2048 || navigator.hardwareConcurrency < 4;

  return {
    supportsSharedArrayBuffer,
    supportsWebWorker,
    estimatedMemoryMB,
    isMobile,
    isLowEndDevice,
  };
}

/**
 * Check if client-side processing is supported and recommended
 */
export function canProcessOnClient(): boolean {
  const caps = detectDeviceCapabilities();
  return (
    caps.supportsSharedArrayBuffer &&
    caps.supportsWebWorker &&
    !caps.isLowEndDevice
  );
}

export class MediaProcessorService {
  private worker: Worker | null = null;
  private isReady = false;
  private initPromise: Promise<void> | null = null;
  private pendingJobs = new Map<string, PendingJob>();
  private jobCounter = 0;

  /**
   * Initialize the media processor worker
   */
  async initialize(): Promise<boolean> {
    if (this.isReady) return true;

    if (!canProcessOnClient()) {
      console.warn(
        "[MediaProcessor] Client-side processing not supported on this device",
      );
      return false;
    }

    if (this.initPromise) {
      await this.initPromise;
      return this.isReady;
    }

    this.initPromise = this.initWorker();
    await this.initPromise;
    return this.isReady;
  }

  private async initWorker(): Promise<void> {
    try {
      // Create worker with module support
      this.worker = new Worker(
        new URL("../workers/media-processor.worker.ts", import.meta.url),
        { type: "module" },
      );

      // Set up message handler
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = (error) => {
        console.error("[MediaProcessor] Worker error:", error);
        this.handleWorkerError(error);
      };

      // Initialize ffmpeg in worker
      await new Promise<void>((resolve, reject) => {
        const initHandler = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === "ready") {
            this.isReady = true;
            resolve();
          } else if (event.data.type === "error" && event.data.id === "init") {
            reject(new Error(event.data.error));
          }
        };

        const originalHandler = this.worker!.onmessage;
        this.worker!.onmessage = (event) => {
          initHandler(event);
          if (
            originalHandler &&
            typeof originalHandler === "function" &&
            this.worker
          ) {
            originalHandler.call(this.worker, event);
          }
        };

        this.worker!.postMessage({
          type: "init",
          id: "init",
        } satisfies WorkerMessage);

        // Timeout after 30 seconds
        setTimeout(
          () => reject(new Error("Worker initialization timeout")),
          30000,
        );
      });

      console.log("[MediaProcessor] Worker initialized successfully");
    } catch (error) {
      console.error("[MediaProcessor] Failed to initialize worker:", error);
      this.cleanup();
      throw error;
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, id, progress, stage, result, error, metadata } = event.data;

    const job = this.pendingJobs.get(id);
    if (!job) return;

    switch (type) {
      case "progress":
        job.onProgress?.(progress ?? 0, stage ?? "processing");
        break;

      case "complete":
        if (result && metadata) {
          job.resolve({
            blob: result,
            metadata,
            processedOnClient: true,
          });
          this.pendingJobs.delete(id);
        }
        break;

      case "error":
        job.reject(new Error(error ?? "Unknown processing error"));
        this.pendingJobs.delete(id);
        break;
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    // Reject all pending jobs
    this.pendingJobs.forEach((job, id) => {
      job.reject(new Error(`Worker error: ${error.message}`));
      this.pendingJobs.delete(id);
    });
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${++this.jobCounter}`;
  }

  /**
   * Transcode video to target resolution and format
   */
  async transcodeVideo(
    file: File,
    options: TranscodeOptions,
  ): Promise<ProcessingResult> {
    if (!this.isReady || !this.worker) {
      throw new Error(
        "MediaProcessor not initialized. Call initialize() first.",
      );
    }

    const id = this.generateJobId();

    return new Promise((resolve, reject) => {
      this.pendingJobs.set(id, {
        resolve,
        reject,
        onProgress: options.onProgress,
      });

      const payload: TranscodePayload = {
        file,
        targetResolution: options.resolution,
        format: options.format,
        quality: options.quality,
      };

      this.worker!.postMessage({
        type: "transcode",
        id,
        payload,
      } satisfies WorkerMessage);
    });
  }

  /**
   * Extract thumbnail from video
   */
  async extractThumbnail(
    file: File,
    options: ThumbnailOptions = {},
  ): Promise<ProcessingResult> {
    if (!this.isReady || !this.worker) {
      throw new Error(
        "MediaProcessor not initialized. Call initialize() first.",
      );
    }

    const id = this.generateJobId();

    return new Promise((resolve, reject) => {
      this.pendingJobs.set(id, { resolve, reject });

      const payload: ThumbnailPayload = {
        file,
        timeSeconds: options.timeSeconds ?? 1,
        width: options.width ?? 320,
        height: options.height ?? 180,
      };

      this.worker!.postMessage({
        type: "thumbnail",
        id,
        payload,
      } satisfies WorkerMessage);
    });
  }

  /**
   * Optimize image (resize and compress)
   */
  async optimizeImage(
    file: File,
    options: OptimizeOptions = {},
  ): Promise<ProcessingResult> {
    if (!this.isReady || !this.worker) {
      throw new Error(
        "MediaProcessor not initialized. Call initialize() first.",
      );
    }

    const id = this.generateJobId();

    return new Promise((resolve, reject) => {
      this.pendingJobs.set(id, { resolve, reject });

      const payload: OptimizePayload = {
        file,
        maxWidth: options.maxWidth ?? 1920,
        maxHeight: options.maxHeight ?? 1080,
        quality: options.quality ?? 85,
        format: options.format ?? "webp",
      };

      this.worker!.postMessage({
        type: "optimize",
        id,
        payload,
      } satisfies WorkerMessage);
    });
  }

  /**
   * Abort a pending job
   */
  abort(jobId: string): void {
    if (this.worker) {
      this.worker.postMessage({
        type: "abort",
        id: jobId,
      } satisfies WorkerMessage);
    }
    this.pendingJobs.delete(jobId);
  }

  /**
   * Abort all pending jobs
   */
  abortAll(): void {
    this.pendingJobs.forEach((_, id) => this.abort(id));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.abortAll();
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
    this.initPromise = null;
  }

  /**
   * Check if the processor is ready
   */
  get ready(): boolean {
    return this.isReady;
  }
}

// Singleton instance for convenience
let defaultProcessor: MediaProcessorService | null = null;

export function getMediaProcessor(): MediaProcessorService {
  if (!defaultProcessor) {
    defaultProcessor = new MediaProcessorService();
  }
  return defaultProcessor;
}
