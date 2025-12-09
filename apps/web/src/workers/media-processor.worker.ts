/**
 * Web Worker for client-side media processing using ffmpeg.wasm
 *
 * This worker handles video transcoding and image optimization in the browser,
 * reducing server load and egress costs. It supports:
 * - Video transcoding (4K → 720p/variants)
 * - Video thumbnail extraction
 * - Image resizing/optimization
 *
 * Falls back to server-side processing if ffmpeg.wasm fails or device is unsupported.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Worker message types
export interface WorkerMessage {
  type: "transcode" | "thumbnail" | "optimize" | "init" | "abort";
  id: string;
  payload?: TranscodePayload | ThumbnailPayload | OptimizePayload;
}

export interface TranscodePayload {
  file: File;
  targetResolution: "720p" | "1080p" | "480p";
  format: "mp4" | "webm";
  quality: "high" | "medium" | "low";
}

export interface ThumbnailPayload {
  file: File;
  timeSeconds: number;
  width: number;
  height: number;
}

export interface OptimizePayload {
  file: File;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: "webp" | "jpeg" | "png";
}

export interface WorkerResponse {
  type: "progress" | "complete" | "error" | "ready";
  id: string;
  progress?: number;
  stage?: string;
  result?: Blob;
  error?: string;
  metadata?: MediaMetadata;
}

export interface MediaMetadata {
  width: number;
  height: number;
  duration?: number;
  codec?: string;
  size: number;
}

// Resolution presets
const RESOLUTION_PRESETS = {
  "720p": { width: 1280, height: 720, bitrate: "2500k" },
  "1080p": { width: 1920, height: 1080, bitrate: "5000k" },
  "480p": { width: 854, height: 480, bitrate: "1500k" },
} as const;

// Quality presets
const QUALITY_PRESETS = {
  high: { crf: 18, preset: "slow" },
  medium: { crf: 23, preset: "medium" },
  low: { crf: 28, preset: "fast" },
} as const;

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;
const activeJobs = new Map<string, { aborted: boolean }>();

/**
 * Initialize ffmpeg.wasm with core and codecs
 */
async function initFFmpeg(): Promise<void> {
  if (isLoaded && ffmpeg) return;

  ffmpeg = new FFmpeg();

  // Configure progress callback
  ffmpeg.on(
    "progress",
    ({ progress, time }: { progress: number; time: number }) => {
      // Broadcast progress to active jobs
      activeJobs.forEach((job, id) => {
        if (!job.aborted) {
          postMessage({
            type: "progress",
            id,
            progress: Math.min(progress * 100, 100),
            stage: "processing",
          } satisfies WorkerResponse);
        }
      });
    },
  );

  ffmpeg.on("log", ({ message }: { message: string }) => {
    console.log("[ffmpeg]", message);
  });

  try {
    // Load ffmpeg core from CDN with SharedArrayBuffer support check
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    const coreURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript",
    );
    const wasmURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm",
    );

    await ffmpeg.load({
      coreURL,
      wasmURL,
    });

    isLoaded = true;
    postMessage({ type: "ready", id: "init" } satisfies WorkerResponse);
  } catch (error) {
    throw new Error(`Failed to initialize ffmpeg: ${error}`);
  }
}

/**
 * Transcode video to target resolution and format
 */
async function transcodeVideo(
  id: string,
  payload: TranscodePayload,
): Promise<void> {
  if (!ffmpeg || !isLoaded) {
    throw new Error("ffmpeg not initialized");
  }

  const job = { aborted: false };
  activeJobs.set(id, job);

  try {
    const { file, targetResolution, format, quality } = payload;
    const preset = RESOLUTION_PRESETS[targetResolution];
    const qualityPreset = QUALITY_PRESETS[quality];

    postMessage({
      type: "progress",
      id,
      progress: 0,
      stage: "loading",
    } satisfies WorkerResponse);

    // Write input file to virtual filesystem
    const inputName = `input_${id}.${file.name.split(".").pop()}`;
    const outputName = `output_${id}.${format}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    if (job.aborted) {
      await cleanupFiles(inputName, outputName);
      return;
    }

    postMessage({
      type: "progress",
      id,
      progress: 10,
      stage: "transcoding",
    } satisfies WorkerResponse);

    // Build ffmpeg command
    const args = [
      "-i",
      inputName,
      "-vf",
      `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`,
      "-c:v",
      format === "webm" ? "libvpx-vp9" : "libx264",
      "-crf",
      String(qualityPreset.crf),
      "-preset",
      qualityPreset.preset,
      "-b:v",
      preset.bitrate,
      "-c:a",
      format === "webm" ? "libopus" : "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-y",
      outputName,
    ];

    await ffmpeg.exec(args);

    if (job.aborted) {
      await cleanupFiles(inputName, outputName);
      return;
    }

    // Read output file
    const outputData = await ffmpeg.readFile(outputName);
    // Convert FileData to Uint8Array for Blob compatibility
    const outputBytes =
      outputData instanceof Uint8Array
        ? new Uint8Array(outputData)
        : new TextEncoder().encode(outputData as string);
    const outputBlob = new Blob([outputBytes], {
      type: format === "webm" ? "video/webm" : "video/mp4",
    });

    // Get metadata
    const metadata: MediaMetadata = {
      width: preset.width,
      height: preset.height,
      size: outputBlob.size,
      codec: format === "webm" ? "vp9" : "h264",
    };

    // Cleanup
    await cleanupFiles(inputName, outputName);
    activeJobs.delete(id);

    postMessage({
      type: "complete",
      id,
      result: outputBlob,
      metadata,
    } satisfies WorkerResponse);
  } catch (error) {
    activeJobs.delete(id);
    throw error;
  }
}

/**
 * Extract thumbnail from video at specified time
 */
async function extractThumbnail(
  id: string,
  payload: ThumbnailPayload,
): Promise<void> {
  if (!ffmpeg || !isLoaded) {
    throw new Error("ffmpeg not initialized");
  }

  const job = { aborted: false };
  activeJobs.set(id, job);

  try {
    const { file, timeSeconds, width, height } = payload;

    const inputName = `input_${id}.${file.name.split(".").pop()}`;
    const outputName = `thumb_${id}.jpg`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    if (job.aborted) {
      await cleanupFiles(inputName, outputName);
      return;
    }

    await ffmpeg.exec([
      "-ss",
      String(timeSeconds),
      "-i",
      inputName,
      "-vf",
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      "-y",
      outputName,
    ]);

    if (job.aborted) {
      await cleanupFiles(inputName, outputName);
      return;
    }

    const outputData = await ffmpeg.readFile(outputName);
    // Convert FileData to Uint8Array for Blob compatibility
    const outputBytes =
      outputData instanceof Uint8Array
        ? new Uint8Array(outputData)
        : new TextEncoder().encode(outputData as string);
    const outputBlob = new Blob([outputBytes], { type: "image/jpeg" });

    await cleanupFiles(inputName, outputName);
    activeJobs.delete(id);

    postMessage({
      type: "complete",
      id,
      result: outputBlob,
      metadata: { width, height, size: outputBlob.size },
    } satisfies WorkerResponse);
  } catch (error) {
    activeJobs.delete(id);
    throw error;
  }
}

/**
 * Optimize image (resize and compress)
 */
async function optimizeImage(
  id: string,
  payload: OptimizePayload,
): Promise<void> {
  if (!ffmpeg || !isLoaded) {
    throw new Error("ffmpeg not initialized");
  }

  const job = { aborted: false };
  activeJobs.set(id, job);

  try {
    const { file, maxWidth, maxHeight, quality, format } = payload;

    const inputName = `input_${id}.${file.name.split(".").pop()}`;
    const outputName = `output_${id}.${format}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    if (job.aborted) {
      await cleanupFiles(inputName, outputName);
      return;
    }

    // Scale maintaining aspect ratio
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      `scale='min(${maxWidth},iw)':min'(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
      "-q:v",
      String(Math.round((100 - quality) / 10) + 1), // Convert quality to ffmpeg scale
      "-y",
      outputName,
    ]);

    if (job.aborted) {
      await cleanupFiles(inputName, outputName);
      return;
    }

    const outputData = await ffmpeg.readFile(outputName);
    const mimeType =
      format === "webp"
        ? "image/webp"
        : format === "png"
          ? "image/png"
          : "image/jpeg";
    // Convert FileData to Uint8Array for Blob compatibility
    const outputBytes =
      outputData instanceof Uint8Array
        ? new Uint8Array(outputData)
        : new TextEncoder().encode(outputData as string);
    const outputBlob = new Blob([outputBytes], { type: mimeType });

    await cleanupFiles(inputName, outputName);
    activeJobs.delete(id);

    postMessage({
      type: "complete",
      id,
      result: outputBlob,
      metadata: { width: maxWidth, height: maxHeight, size: outputBlob.size },
    } satisfies WorkerResponse);
  } catch (error) {
    activeJobs.delete(id);
    throw error;
  }
}

/**
 * Cleanup virtual filesystem files
 */
async function cleanupFiles(...files: string[]): Promise<void> {
  if (!ffmpeg) return;

  for (const file of files) {
    try {
      await ffmpeg.deleteFile(file);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Abort an active job
 */
function abortJob(id: string): void {
  const job = activeJobs.get(id);
  if (job) {
    job.aborted = true;
    activeJobs.delete(id);
    postMessage({
      type: "error",
      id,
      error: "Job aborted",
    } satisfies WorkerResponse);
  }
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case "init":
        await initFFmpeg();
        break;

      case "transcode":
        if (!payload) throw new Error("Payload required for transcode");
        await transcodeVideo(id, payload as TranscodePayload);
        break;

      case "thumbnail":
        if (!payload) throw new Error("Payload required for thumbnail");
        await extractThumbnail(id, payload as ThumbnailPayload);
        break;

      case "optimize":
        if (!payload) throw new Error("Payload required for optimize");
        await optimizeImage(id, payload as OptimizePayload);
        break;

      case "abort":
        abortJob(id);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    postMessage({
      type: "error",
      id,
      error: error instanceof Error ? error.message : String(error),
    } satisfies WorkerResponse);
  }
};
