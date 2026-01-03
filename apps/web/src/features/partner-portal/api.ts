/**
 * Partner Portal API Service
 *
 * API calls for the partner portal.
 * Fluxo: Onboarding → Compra Créditos → Criar Entrega → Upload → Gerar Voucher
 */

import { apiClient } from "../../lib/api-client";
import type {
  Partner,
  Delivery,
  DeliveryDetail,
  DeliveryAggregations,
  CreateDeliveryRequest,
  PartnerDashboardStats,
  CreditPackage,
  CreditPaymentMethod,
  PurchaseCreditsResponse,
  UploadInitRequest,
  UploadInitResponse,
  GenerateVoucherCardRequest,
  VoucherCardData,
  OnboardingRequest,
  OnboardingResponse,
  CreditHistoryResponse,
} from "./types";

const API_BASE = "/partner";

// ============================================================
// Onboarding
// ============================================================

/**
 * Register new partner (photographer)
 */
export async function registerPartner(
  request: OnboardingRequest,
): Promise<OnboardingResponse> {
  return apiClient.post<OnboardingResponse>(`${API_BASE}/onboarding`, request);
}

// ============================================================
// Partner Profile
// ============================================================

/**
 * Get current partner profile
 */
export async function getPartnerProfile(): Promise<Partner> {
  return apiClient.get<Partner>(`${API_BASE}/me`);
}

/**
 * Update partner profile
 */
export async function updatePartnerProfile(
  updates: Partial<
    Pick<Partner, "name" | "studio_name" | "phone" | "logo_url">
  >,
): Promise<Partner> {
  return apiClient.patch<Partner>(`${API_BASE}/me`, updates);
}

/**
 * Get partner dashboard stats
 */
export async function getPartnerDashboardStats(): Promise<PartnerDashboardStats> {
  return apiClient.get<PartnerDashboardStats>(`${API_BASE}/me/stats`);
}

// ============================================================
// Check Client Access (verificação de acesso)
// ============================================================

export interface CheckAccessResponse {
  has_access: boolean;
  email: string;
  client_name: string | null;
  children: Array<{ id: string; name: string; has_access: boolean }>;
  message: string;
}

export type EligibilityReason = "EXISTING_ACTIVE_CHILD" | "NEW_USER";

export interface CheckEligibilityResponse {
  is_eligible: boolean;
  reason: EligibilityReason;
}

/**
 * Verifica se o e-mail já possui conta no Baby Book.
 * - Se NÃO tiver conta: será necessário gerar voucher (onboarding).
 * - Se tiver conta: o fotógrafo pode criar entrega sem voucher (direct import).
 *   O custo é por criança e será decidido na importação (EXISTING_CHILD grátis; NEW_CHILD 1 crédito).
 */
export async function checkClientAccess(
  email: string,
): Promise<CheckAccessResponse> {
  return apiClient.get<CheckAccessResponse>(
    `${API_BASE}/check-access?email=${encodeURIComponent(email)}`,
  );
}

/**
 * Validação silenciosa (debounce no frontend):
 * elegível = usuário existe e já tem pelo menos 1 Child com PCE pago.
 */
export async function checkEligibility(
  email: string,
): Promise<CheckEligibilityResponse> {
  return apiClient.post<CheckEligibilityResponse>(
    `${API_BASE}/check-eligibility`,
    {
      email,
    },
  );
}

// ============================================================
// Notifications
// ============================================================

export type NotificationType =
  | "voucher_redeemed"
  | "credits_added"
  | "delivery_ready"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "voucher_redeemed",
    title: "Voucher resgatado",
    description:
      "Cliente Maria resgatou o voucher #ABC123 e criou sua conta Baby Book.",
    time: "Há 2 horas",
    unread: true,
    link: "/partner/deliveries",
  },
  {
    id: "2",
    type: "credits_added",
    title: "Créditos adicionados",
    description:
      "5 créditos foram adicionados à sua conta após pagamento confirmado.",
    time: "Ontem às 14:30",
    unread: true,
    link: "/partner/credits",
  },
  {
    id: "3",
    type: "delivery_ready",
    title: "Entrega pronta",
    description:
      "A entrega 'Ensaio Newborn - João' está pronta para gerar voucher.",
    time: "Ontem às 10:15",
    unread: true, // Changed to true for testing
    link: "/partner/deliveries",
  },
  {
    id: "4",
    type: "voucher_redeemed",
    title: "Voucher resgatado",
    description: "Cliente Ana Paula resgatou o voucher #XYZ789.",
    time: "2 dias atrás",
    unread: false,
    link: "/partner/deliveries",
  },
  {
    id: "5",
    type: "system",
    title: "Bem-vindo ao Baby Book PRO!",
    description:
      "Sua conta foi aprovada. Comece comprando créditos para criar suas primeiras entregas.",
    time: "3 dias atrás",
    unread: false,
    link: "/partner/credits",
  },
  {
    id: "6",
    type: "credits_added",
    title: "Créditos adicionados",
    description:
      "10 créditos foram adicionados à sua conta (pacote inicial de boas-vindas).",
    time: "3 dias atrás",
    unread: false,
    link: "/partner/credits",
  },
];

/**
 * Get partner notifications
 * (Mocked with delay)
 */
export async function getNotifications(): Promise<Notification[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [...MOCK_NOTIFICATIONS];
}

// ============================================================
// Credits & Packages
// ============================================================

/**
 * Get available credit packages
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  return apiClient.get<CreditPackage[]>(`${API_BASE}/credits/packages`);
}

/**
 * Purchase credits - creates Stripe checkout session
 */
export async function purchaseCredits(
  packageId: string,
  paymentMethod: CreditPaymentMethod,
): Promise<PurchaseCreditsResponse> {
  return apiClient.post<PurchaseCreditsResponse>(
    `${API_BASE}/credits/purchase`,
    {
      package_id: packageId,
      payment_method: paymentMethod,
    },
  );
}

/**
 * Get credit usage history
 */
export async function getCreditsHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<CreditHistoryResponse> {
  return apiClient.get<CreditHistoryResponse>(`${API_BASE}/credits/history`, {
    searchParams: params,
  });
}

// ============================================================
// Deliveries
// ============================================================

/**
 * List partner deliveries
 */
export async function listDeliveries(params?: {
  // preferir status_filter (compatível com o backend). status é mantido por compatibilidade.
  status_filter?: string;
  status?: string;
  q?: string;
  voucher?: "with" | "without";
  redeemed?: "redeemed" | "not_redeemed";
  credit?: "reserved" | "consumed" | "refunded" | "not_required" | "unknown";
  view?: "needs_action";
  created?: "last_7" | "last_30" | "last_90" | "custom";
  created_from?: string;
  created_to?: string;
  redeemed_period?: "last_7" | "last_30" | "last_90" | "custom";
  redeemed_from?: string;
  redeemed_to?: string;
  sort?: "newest" | "oldest" | "status" | "client";
  include_archived?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{
  deliveries: Delivery[];
  total: number;
  aggregations?: DeliveryAggregations;
}> {
  const { status, status_filter, ...rest } = params ?? {};
  return apiClient.get<{
    deliveries: Delivery[];
    total: number;
    aggregations?: DeliveryAggregations;
  }>(`${API_BASE}/deliveries`, {
    searchParams: {
      ...rest,
      status_filter: status_filter ?? status,
    },
  });
}

/**
 * Get delivery details
 */
export async function getDelivery(deliveryId: string): Promise<DeliveryDetail> {
  return apiClient.get<DeliveryDetail>(`${API_BASE}/deliveries/${deliveryId}`);
}

/**
 * Create a new delivery
 */
export async function createDelivery(
  request: CreateDeliveryRequest,
): Promise<Delivery> {
  return apiClient.post<Delivery>(`${API_BASE}/deliveries`, request);
}

/**
 * Update delivery
 */
export async function updateDelivery(
  deliveryId: string,
  updates: Partial<Pick<Delivery, "title" | "status">> & {
    client_name?: string;
    description?: string;
    event_date?: string;
  },
): Promise<Delivery> {
  return apiClient.patch<Delivery>(
    `${API_BASE}/deliveries/${deliveryId}`,
    updates,
  );
}

/**
 * Delete delivery (only if draft/no voucher)
 */
export async function deleteDelivery(deliveryId: string): Promise<void> {
  return apiClient.delete(`${API_BASE}/deliveries/${deliveryId}`);
}

/**
 * Archive or unarchive a delivery
 * This is a soft delete - hides from photographer but doesn't affect client
 */
export async function archiveDelivery(
  deliveryId: string,
  archive: boolean = true,
): Promise<{ success: boolean; archived: boolean; message: string }> {
  return apiClient.patch(
    `${API_BASE}/deliveries/${deliveryId}/archive?archive=${archive}`,
  );
}

// ============================================================
// Upload (direct to presigned URL)
// ============================================================

/**
 * Initialize upload - get presigned URL
 */
export async function initUpload(
  deliveryId: string,
  request: UploadInitRequest,
): Promise<UploadInitResponse> {
  return apiClient.post<UploadInitResponse>(
    `${API_BASE}/deliveries/${deliveryId}/upload/init`,
    request,
  );
}

/**
 * Upload file directly to presigned URL
 * Returns progress via callback
 */
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Importante: upload para storage via URL presignada não deve enviar cookies.
    xhr.withCredentials = false;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.ontimeout = () => reject(new Error("Upload timeout"));

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.timeout = 300000; // 5 minutes
    xhr.send(file);
  });
}

/**
 * Confirm upload completion
 */
export async function confirmUpload(
  deliveryId: string,
  uploadData: {
    upload_id: string;
    key: string;
    filename: string;
    content_type: string;
    size_bytes: number;
  },
): Promise<void> {
  return apiClient.post(
    `${API_BASE}/deliveries/${deliveryId}/upload/complete`,
    uploadData,
  );
}

// ============================================================
// Voucher Generation
// ============================================================

/**
 * Generate voucher card for delivery
 * Consome 1 crédito do voucher_balance
 */
export async function generateVoucherCard(
  deliveryId: string,
  request: GenerateVoucherCardRequest,
): Promise<VoucherCardData> {
  return apiClient.post<VoucherCardData>(
    `${API_BASE}/deliveries/${deliveryId}/finalize`,
    request,
  );
}

// ============================================================
// Asset Management
// ============================================================

/**
 * Delete asset from delivery
 */
export async function deleteDeliveryAsset(
  deliveryId: string,
  assetKey: string,
): Promise<void> {
  return apiClient.delete(
    `${API_BASE}/deliveries/${deliveryId}/assets/${encodeURIComponent(assetKey)}`,
  );
}

// ============================================================
// Image Compression (Client-side helper)
// ============================================================

/**
 * Compress image using browser-image-compression
 * Called before uploading to reduce transfer size
 */
export async function compressImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  } = {},
): Promise<File> {
  // Dynamically import browser-image-compression
  const imageCompression = (await import("browser-image-compression")).default;

  const compressed = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB ?? 2,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 2048,
    initialQuality: options.quality ?? 0.85,
    useWebWorker: true,
    fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
  });

  return new File([compressed], file.name, { type: compressed.type });
}

/**
 * Check if file is an image that can be compressed
 */
export function isCompressibleImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}
