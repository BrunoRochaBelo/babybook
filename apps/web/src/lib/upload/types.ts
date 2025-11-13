export type UploadKind = "photo" | "video" | "audio";

export type UploadStatus =
  | "queued"
  | "preprocessing"
  | "uploading"
  | "completing"
  | "done"
  | "failed";

export interface UploadItem {
  id: string;
  kind: UploadKind;
  file: File;
  status: UploadStatus;
  progress: number;
  errorCode?: string;
  traceId?: string;
}
