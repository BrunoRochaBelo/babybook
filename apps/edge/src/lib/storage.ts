/**
 * Storage proxy for B2/S3 backend
 *
 * Uses aws4fetch to sign requests to private B2 bucket.
 * This allows the Worker to fetch from a private bucket
 * without exposing credentials to the client.
 */
import { AwsClient } from "aws4fetch";

export interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  region?: string;
}

/**
 * Creates a signed request to fetch from B2/S3
 *
 * The AwsClient handles the AWS Signature V4 signing process,
 * which B2 supports via S3-compatible API.
 */
export async function createSignedRequest(
  config: StorageConfig,
  objectKey: string,
  originalRequest: Request
): Promise<Request> {
  const aws = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: config.region || "us-east-1", // B2 uses us-east-1 for S3 compat
  });

  // Construct the B2 URL
  // Format: https://bucket-name.s3.region.backblazeb2.com/object-key
  const b2Url = `https://${config.bucketName}.${config.endpoint}/${objectKey}`;

  // Headers to forward from original request
  const headers: Record<string, string> = {};

  // Forward Range header (critical for video streaming!)
  const rangeHeader = originalRequest.headers.get("Range");
  if (rangeHeader) {
    headers["Range"] = rangeHeader;
  }

  // Forward If-None-Match for conditional requests
  const ifNoneMatch = originalRequest.headers.get("If-None-Match");
  if (ifNoneMatch) {
    headers["If-None-Match"] = ifNoneMatch;
  }

  // Forward If-Modified-Since for conditional requests
  const ifModifiedSince = originalRequest.headers.get("If-Modified-Since");
  if (ifModifiedSince) {
    headers["If-Modified-Since"] = ifModifiedSince;
  }

  // Sign the request
  const signedRequest = await aws.sign(b2Url, {
    method: originalRequest.method,
    headers,
  });

  return signedRequest;
}

/**
 * Fetches object from B2 and applies response headers
 *
 * @param signedRequest - The AWS-signed request
 * @param objectKey - The object key (used to determine content-type)
 * @param cacheMaxAge - Cache duration in seconds (default 4 hours)
 */
export async function fetchAndTransform(
  signedRequest: Request,
  objectKey: string,
  cacheMaxAge: number = 14400
): Promise<Response> {
  const response = await fetch(signedRequest);

  // Don't modify error responses
  if (!response.ok && response.status !== 206) {
    return response;
  }

  const newHeaders = new Headers(response.headers);

  // Set cache headers
  // - public: Can be cached by CDN/browser
  // - max-age: Client cache duration
  // - s-maxage: CDN cache duration (can be different)
  newHeaders.set("Cache-Control", `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`);

  // CORS headers (allow access from any origin)
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "Authorization, Range");
  newHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

  // Accept-Ranges for video streaming
  if (!newHeaders.has("Accept-Ranges")) {
    newHeaders.set("Accept-Ranges", "bytes");
  }

  // Content-Disposition for downloads
  // Add inline disposition for images/videos to allow embedding
  const contentType = newHeaders.get("Content-Type") || "";
  if (
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/")
  ) {
    if (!newHeaders.has("Content-Disposition")) {
      newHeaders.set("Content-Disposition", "inline");
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Gets content type based on file extension
 */
export function getContentType(objectKey: string): string {
  const ext = objectKey.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    // Video
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    // Documents
    pdf: "application/pdf",
    json: "application/json",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
