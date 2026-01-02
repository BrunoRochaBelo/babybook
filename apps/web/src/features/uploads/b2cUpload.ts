import { apiClient } from "@/lib/api-client";
import {
  canProcessOnClient,
  getMediaProcessor,
} from "@/services/media-processor";

export type AssetKind = "photo" | "video" | "audio";
export type AssetScope =
  | "moment"
  | "guestbook"
  | "vault"
  | "pod_preview"
  | "health";

type UploadInitRequest = {
  child_id: string;
  filename: string;
  size: number;
  mime: string;
  sha256: string;
  kind?: AssetKind | null;
  scope?: AssetScope | null;
};

type UploadInitResponse = {
  asset_id: string;
  status: "queued" | "processing" | "ready" | "failed";
  upload_id?: string | null;
  key?: string | null;
  part_size?: number | null;
  parts?: number[] | null;
  urls?: string[] | null;
  deduplicated?: boolean;
};

type UploadCompleteRequest = {
  upload_id: string;
  etags: Array<{ part: number; etag: string }>;
};

type UploadCompleteResponse = {
  asset_id: string;
  status: "queued" | "processing" | "ready" | "failed";
};

export type MomentPayloadMediaEntry = {
  id: string;
  type: "image" | "video" | "audio";
  key: string;
  durationSeconds?: number;
};

const isCompressibleImage = (file: File): boolean =>
  ["image/jpeg", "image/png", "image/webp"].includes(file.type);

const isVideoFile = (file: File): boolean => file.type.startsWith("video/");

const replaceExtension = (filename: string, newExt: string): string => {
  const base = filename.replace(/\.[^.]+$/, "");
  return `${base}.${newExt}`;
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export async function sha256Hex(blob: Blob): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "WebCrypto não disponível (crypto.subtle). Não foi possível calcular sha256 do arquivo.",
    );
  }
  const data = await blob.arrayBuffer();
  const digest = await subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function processFileBestEffort(
  file: File,
): Promise<{
  blob: Blob;
  filename: string;
  mime: string;
  durationSeconds?: number;
}> {
  // 1) Imagem: compressão client-side (barata e rápida)
  if (isCompressibleImage(file)) {
    try {
      const imageCompression = (await import("browser-image-compression"))
        .default;

      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        initialQuality: 0.85,
        useWebWorker: true,
        fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
      });

      return {
        blob: compressed,
        filename: file.name,
        mime: (compressed as File).type ?? file.type,
      };
    } catch {
      return { blob: file, filename: file.name, mime: file.type };
    }
  }

  // 2) Vídeo: transcode best-effort (se o device suportar)
  if (isVideoFile(file)) {
    try {
      if (canProcessOnClient()) {
        const processor = getMediaProcessor();
        const ready = await processor.initialize();
        if (ready) {
          const result = await processor.transcodeVideo(file, {
            resolution: "720p",
            format: "mp4",
            quality: "medium",
          });

          return {
            blob: result.blob,
            filename: replaceExtension(file.name, "mp4"),
            mime: result.blob.type || "video/mp4",
          };
        }
      }
    } catch {
      // fallback silencioso
    }

    return { blob: file, filename: file.name, mime: file.type };
  }

  // 3) Áudio/outros: sem processamento por enquanto
  return { blob: file, filename: file.name, mime: file.type };
}

function putToPresignedUrl(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  onProgress?: (uploadedBytes: number) => void,
): Promise<{ etag: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Importante: upload para storage via URL presignada não deve enviar cookies.
    xhr.withCredentials = false;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(e.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag =
          xhr.getResponseHeader("ETag") || xhr.getResponseHeader("etag");
        if (!etag) {
          reject(
            new Error(
              "Upload concluído, mas o header ETag não foi exposto pela resposta. Verifique CORS do storage (Access-Control-Expose-Headers: ETag).",
            ),
          );
          return;
        }
        resolve({ etag });
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.ontimeout = () => reject(new Error("Upload timeout"));

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.timeout = 300000; // 5 minutes
    xhr.send(blob);
  });
}

async function uploadMultipart(
  init: {
    asset_id: string;
    upload_id: string;
    key: string;
    part_size: number;
    parts: number[];
    urls: string[];
  },
  blob: Blob,
  mime: string,
  onProgress?: (pct: number) => void,
): Promise<{ assetId: string; key: string }> {
  const partSize = init.part_size;
  const parts = init.parts;
  const urls = init.urls;

  if (!partSize || !parts?.length || !urls?.length) {
    throw new Error("Resposta inválida do /uploads/init (multipart).");
  }
  if (parts.length !== urls.length) {
    throw new Error("Resposta inválida do /uploads/init: parts/urls mismatch.");
  }

  const totalBytes = blob.size;
  let uploadedBytes = 0;
  const etags: Array<{ part: number; etag: string }> = [];

  for (let i = 0; i < parts.length; i += 1) {
    const partNumber = parts[i]!;
    const url = urls[i]!;

    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, totalBytes);
    const chunk = blob.slice(start, end);

    const { etag } = await putToPresignedUrl(url, chunk, mime, (loaded) => {
      // loaded é bytes dentro do chunk. Para não “voltar” o progress, usamos base do já concluído.
      const current = uploadedBytes + loaded;
      const pct = totalBytes > 0 ? Math.round((current / totalBytes) * 100) : 0;
      onProgress?.(Math.max(0, Math.min(100, pct)));
    });

    etags.push({ part: partNumber, etag });
    uploadedBytes += chunk.size;
    const pct =
      totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
    onProgress?.(Math.max(0, Math.min(100, pct)));
  }

  const completePayload: UploadCompleteRequest = {
    upload_id: init.upload_id,
    etags,
  };
  await apiClient.post<UploadCompleteResponse>(
    "/uploads/complete",
    completePayload,
  );

  return { assetId: init.asset_id, key: init.key };
}

async function uploadSinglePart(
  init: {
    asset_id: string;
    upload_id: string;
    key: string;
    parts: number[];
    urls: string[];
  },
  blob: Blob,
  mime: string,
  onProgress?: (pct: number) => void,
): Promise<{ assetId: string; key: string }> {
  const url = init.urls?.[0];
  const part = init.parts?.[0];
  if (!url || !part) {
    throw new Error("Resposta inválida do /uploads/init (single PUT).");
  }

  const { etag } = await putToPresignedUrl(url, blob, mime, (loaded) => {
    const pct = blob.size > 0 ? Math.round((loaded / blob.size) * 100) : 0;
    onProgress?.(Math.max(0, Math.min(100, pct)));
  });

  const completePayload: UploadCompleteRequest = {
    upload_id: init.upload_id,
    etags: [{ part, etag }],
  };
  await apiClient.post<UploadCompleteResponse>(
    "/uploads/complete",
    completePayload,
  );

  return { assetId: init.asset_id, key: init.key };
}

export async function uploadMomentMediaFiles(params: {
  childId: string;
  files: File[];
  scope?: AssetScope;
  onProgress?: (info: {
    fileIndex: number;
    fileCount: number;
    fileName: string;
    filePct: number;
    overallPct: number;
  }) => void;
}): Promise<MomentPayloadMediaEntry[]> {
  const scope = params.scope ?? "moment";
  const result: MomentPayloadMediaEntry[] = [];

  const fileCount = params.files.length;
  for (let idx = 0; idx < fileCount; idx += 1) {
    const file = params.files[idx]!;

    const processed = await processFileBestEffort(file);
    const kind: AssetKind = processed.mime.startsWith("video/")
      ? "video"
      : processed.mime.startsWith("audio/")
        ? "audio"
        : "photo";

    const sha256 = await sha256Hex(processed.blob);

    const initPayload: UploadInitRequest = {
      child_id: params.childId,
      filename: processed.filename,
      size: processed.blob.size,
      mime: processed.mime,
      sha256,
      kind,
      scope,
    };

    const init = await apiClient.post<UploadInitResponse>(
      "/uploads/init",
      initPayload,
    );

    const report = (filePct: number) => {
      const overallPct =
        fileCount > 0
          ? Math.round(((idx + filePct / 100) / fileCount) * 100)
          : 0;
      params.onProgress?.({
        fileIndex: idx,
        fileCount,
        fileName: file.name,
        filePct,
        overallPct,
      });
    };

    // Dedup: nada a fazer, já existe (key precisa estar presente).
    if (init.deduplicated) {
      if (!init.key) {
        throw new Error("Upload deduplicado, mas sem key no response.");
      }
      result.push({
        id: init.asset_id,
        type: kind === "photo" ? "image" : kind,
        key: init.key,
      });
      report(100);
      continue;
    }

    if (!init.upload_id || !init.key) {
      throw new Error(
        "Resposta inválida do /uploads/init: upload_id/key ausentes.",
      );
    }

    const partCount = init.parts?.length ?? 0;
    if (partCount <= 0) {
      throw new Error("Resposta inválida do /uploads/init: parts ausente.");
    }

    if (partCount === 1) {
      const uploaded = await uploadSinglePart(
        {
          asset_id: init.asset_id,
          upload_id: init.upload_id,
          key: init.key,
          parts: init.parts ?? [],
          urls: init.urls ?? [],
        },
        processed.blob,
        processed.mime,
        report,
      );

      result.push({
        id: uploaded.assetId,
        type: kind === "photo" ? "image" : kind,
        key: uploaded.key,
      });
      report(100);
      continue;
    }

    const uploaded = await uploadMultipart(
      {
        asset_id: init.asset_id,
        upload_id: init.upload_id,
        key: init.key,
        part_size: init.part_size ?? 0,
        parts: init.parts ?? [],
        urls: init.urls ?? [],
      },
      processed.blob,
      processed.mime,
      report,
    );

    result.push({
      id: uploaded.assetId,
      type: kind === "photo" ? "image" : kind,
      key: uploaded.key,
    });

    report(100);
  }

  return result;
}
