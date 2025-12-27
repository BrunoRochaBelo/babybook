import type { Delivery, DeliveryStatus } from "./types";

export type PartnerDeliveryStatusMeta = {
  label: string;
  shortLabel: string;
  hint: string;
};

const STATUS_META: Record<DeliveryStatus, PartnerDeliveryStatusMeta> = {
  draft: {
    label: "partner.status.draft.label",
    shortLabel: "partner.status.draft.shortLabel",
    hint: "partner.status.draft.hint",
  },
  pending_upload: {
    label: "partner.status.pending_upload.label",
    shortLabel: "partner.status.pending_upload.shortLabel",
    hint: "partner.status.pending_upload.hint",
  },
  processing: {
    label: "partner.status.processing.label",
    shortLabel: "partner.status.processing.shortLabel",
    hint: "partner.status.processing.hint",
  },
  ready: {
    label: "partner.status.ready.label",
    shortLabel: "partner.status.ready.shortLabel",
    hint: "partner.status.ready.hint",
  },
  delivered: {
    label: "partner.status.delivered.label",
    shortLabel: "partner.status.delivered.shortLabel",
    hint: "partner.status.delivered.hint",
  },
  failed: {
    label: "partner.status.failed.label",
    shortLabel: "partner.status.failed.shortLabel",
    hint: "partner.status.failed.hint",
  },
  archived: {
    label: "partner.status.archived.label",
    shortLabel: "partner.status.archived.shortLabel",
    hint: "partner.status.archived.hint",
  },
};

export function getPartnerDeliveryStatusMeta(
  status: DeliveryStatus,
): PartnerDeliveryStatusMeta {
  return STATUS_META[status] ?? STATUS_META.draft;
}

// Centraliza a normalização de status para evitar drift entre telas.
// Backend também normaliza, mas aqui mantemos um fallback defensivo para:
// - dados legados no banco
// - caches/client state
// - mocks
export function normalizePartnerDeliveryStatus(
  raw: string | null | undefined,
): DeliveryStatus {
  if (!raw) return "draft";

  switch (raw) {
    case "completed":
      return "delivered";
    case "pending":
      // No modelo do banco, "pending" significa enfileirado/aguardando processamento.
      return "processing";
    case "failed":
      return "failed";

    case "draft":
    case "pending_upload":
    case "processing":
    case "ready":
    case "delivered":
    case "archived":
      return raw;

    default:
      return "draft";
  }
}

export function isPartnerDeliveryArchived(delivery: Delivery): boolean {
  return (
    Boolean(delivery.is_archived ?? delivery.archived_at) ||
    delivery.status === "archived"
  );
}

export function getPartnerDeliveryDisplayStatus(
  delivery: Delivery,
): DeliveryStatus {
  return isPartnerDeliveryArchived(delivery)
    ? "archived"
    : normalizePartnerDeliveryStatus(delivery.status);
}
