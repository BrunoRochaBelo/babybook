/**
 * Partner Portal Types
 *
 * Type definitions for the partner portal feature.
 * Suporta o fluxo: Onboarding → Compra de Créditos → Criação de Entrega → Voucher
 */

// =============================================================================
// Perfil do Parceiro
// =============================================================================

export interface Partner {
  id: string;
  name: string;
  email: string;
  studio_name: string | null;
  phone: string | null;
  logo_url: string | null;
  voucher_balance: number; // Créditos disponíveis para gerar vouchers
  status: PartnerStatus;
  created_at: string;
}

export type PartnerStatus = "pending" | "approved" | "suspended";

// =============================================================================
// Dashboard Stats
// =============================================================================

export interface PartnerDashboardStats {
  voucher_balance: number;
  total_deliveries: number;
  ready_deliveries: number;
  delivered_deliveries: number;
  total_vouchers: number;
  redeemed_vouchers: number;
  pending_vouchers: number;
  total_assets: number;
}

// =============================================================================
// Créditos / Compra
// =============================================================================

export interface CreditPackage {
  id: string;
  name: string;
  voucher_count: number;
  price_cents: number;
  unit_price_cents: number;
  savings_percent: number;
  is_popular: boolean;
}

export interface PurchaseCreditsResponse {
  checkout_id: string;
  checkout_url: string;
  package: CreditPackage;
  expires_at: string;
}

// =============================================================================
// Entregas
// =============================================================================

export interface Delivery {
  id: string;
  title: string;
  client_name: string | null;
  status: DeliveryStatus;
  assets_count: number;
  voucher_code: string | null;
  created_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
}

export interface DeliveryDetail extends Delivery {
  description: string | null;
  event_date: string | null;
  assets: DeliveryAsset[];
}

export interface DeliveryAsset {
  upload_id: string;
  key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export type DeliveryStatus =
  | "draft" // Criada, sem assets ainda
  | "pending_upload" // Aguardando upload dos arquivos
  | "processing" // Processando arquivos
  | "ready" // Pronta, aguardando geração de voucher
  | "delivered" // Voucher resgatado pelo cliente
  | "archived"; // Arquivada

export interface CreateDeliveryRequest {
  client_name: string;
  title?: string;
  description?: string;
  event_date?: string;
}

// =============================================================================
// Upload
// =============================================================================

export interface UploadInitRequest {
  filename: string;
  content_type: string;
  size_bytes: number;
}

export interface UploadInitResponse {
  upload_id: string;
  upload_url: string;
  key: string;
  expires_at: string;
}

export interface UploadProgress {
  upload_id: string;
  filename: string;
  progress: number; // 0-100
  status: "compressing" | "uploading" | "complete" | "error";
  error?: string;
}

// =============================================================================
// Voucher Card
// =============================================================================

export interface GenerateVoucherCardRequest {
  beneficiary_name?: string;
  message?: string;
  voucher_prefix?: string;
  expires_days?: number;
}

export interface VoucherCardData {
  voucher_code: string;
  redeem_url: string;
  qr_data: string;
  studio_name: string;
  studio_logo_url: string | null;
  beneficiary_name: string | null;
  message: string;
  assets_count: number;
  expires_at: string | null;
}

// =============================================================================
// Onboarding
// =============================================================================

export interface OnboardingRequest {
  name: string;
  email: string;
  password: string;
  studio_name?: string;
  phone?: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  partner_id: string;
  status: string;
}
