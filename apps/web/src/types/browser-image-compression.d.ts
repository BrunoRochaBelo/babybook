/**
 * Type declarations for browser-image-compression
 *
 * @see https://github.com/niceperson/browser-image-compression
 */

declare module "browser-image-compression" {
  interface Options {
    /** @default Number.POSITIVE_INFINITY */
    maxSizeMB?: number;
    /** @default undefined */
    maxWidthOrHeight?: number;
    /** @default true */
    useWebWorker?: boolean;
    /** @default 10 */
    maxIteration?: number;
    /** @default undefined */
    exifOrientation?: number;
    /** @default undefined */
    onProgress?: (progress: number) => void;
    /** @default undefined */
    fileType?: "image/jpeg" | "image/png" | "image/webp";
    /** @default 1 */
    initialQuality?: number;
    /** @default false */
    alwaysKeepResolution?: boolean;
    /** @default undefined */
    signal?: AbortSignal;
    /** @default false */
    preserveExif?: boolean;
    /** @default 'document' */
    libURL?: string;
  }

  function imageCompression(file: File, options?: Options): Promise<File>;

  export default imageCompression;
}
