/**
 * API Client para Configurações B2C
 * 
 * Endpoints para família, assinatura, armazenamento e gerenciamento de dados.
 */

import { apiClient } from "@/lib/api-client";

// =============================================================================
// Types
// =============================================================================

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "guardian" | "viewer";
  status: "active" | "pending" | "locked";
}

export interface FamilyListResponse {
  members: FamilyMember[];
  total: number;
}

export interface FamilyMemberInviteRequest {
  email: string;
  role: "guardian" | "viewer";
}

export interface SubscriptionResponse {
  plan_name: string;
  plan_display_name: string;
  price_cents: number;
  currency: string;
  renewal_date: string | null;
  features: string[];
  storage_bytes_used: number;
  storage_bytes_limit: number;
  is_unlimited: boolean;
}

export interface StorageStatsResponse {
  bytes_used: number;
  bytes_quota: number;
  is_unlimited: boolean;
  photos_count: number;
  videos_count: number;
  audios_count: number;
  last_backup_at: string | null;
}

export interface DataExportResponse {
  request_id: string;
  status: string;
  message: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Lista membros da família (usuários da conta)
 */
export async function listFamilyMembers(): Promise<FamilyListResponse> {
  const response = await apiClient.get<FamilyListResponse>("/me/settings/family");
  return response || { members: [], total: 0 };
}

/**
 * Convida um novo membro para a família
 */
export async function inviteFamilyMember(
  data: FamilyMemberInviteRequest
): Promise<FamilyMember> {
  return apiClient.post<FamilyMember>("/me/settings/family/invite", data);
}

/**
 * Remove um membro da família
 */
export async function removeFamilyMember(
  memberId: string
): Promise<{ success: boolean; message: string } | undefined> {
  return apiClient.delete(`/me/settings/family/${memberId}`);
}

/**
 * Obtém detalhes da assinatura atual
 */
export async function getSubscription(): Promise<SubscriptionResponse> {
  const response = await apiClient.get<SubscriptionResponse>("/me/settings/subscription");
  return response || {
    plan_name: "",
    plan_display_name: "",
    price_cents: 0,
    currency: "BRL",
    renewal_date: null,
    features: [],
    storage_bytes_used: 0,
    storage_bytes_limit: 0,
    is_unlimited: false
  };
}

/**
 * Obtém estatísticas de armazenamento
 */
export async function getStorageStats(): Promise<StorageStatsResponse> {
  const response = await apiClient.get<StorageStatsResponse>("/me/settings/storage");
  return response || {
    bytes_used: 0,
    bytes_quota: 0,
    is_unlimited: false,
    photos_count: 0,
    videos_count: 0,
    audios_count: 0,
    last_backup_at: null
  };
}

/**
 * Solicita exportação de dados (LGPD/GDPR)
 */
export async function requestDataExport(
  format: "zip" | "json" = "zip"
): Promise<DataExportResponse> {
  return apiClient.post<DataExportResponse>("/me/settings/data/export", {
    format,
  });
}

/**
 * Solicita exclusão da conta
 */
export async function requestAccountDeletion(
  confirmation: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  return apiClient.post("/me/settings/data/delete", {
    confirmation,
    password,
  });
}

// =============================================================================
// React Query Hooks (opcional)
// =============================================================================

export const settingsApiKeys = {
  family: ["settings", "family"] as const,
  subscription: ["settings", "subscription"] as const,
  storage: ["settings", "storage"] as const,
};
