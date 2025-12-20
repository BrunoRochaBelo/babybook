import type { Delivery, DeliveryStatus } from "./types";

export type PartnerDeliveryStatusMeta = {
  label: string;
  shortLabel: string;
  hint: string;
};

const STATUS_META: Record<DeliveryStatus, PartnerDeliveryStatusMeta> = {
  draft: {
    label: "Rascunho",
    shortLabel: "Rascunho",
    hint: "Entrega criada, mas ainda não enviada. Adicione os arquivos para continuar.",
  },
  pending_upload: {
    label: "Aguardando upload",
    shortLabel: "Upload",
    hint: "Estamos esperando você enviar os arquivos desta entrega.",
  },
  processing: {
    label: "Processando",
    shortLabel: "Proc.",
    hint: "Seus arquivos estão sendo preparados. Isso pode levar alguns minutos.",
  },
  ready: {
    label: "Pronta",
    shortLabel: "Pronta",
    hint: "Entrega pronta para envio. Gere o voucher/link para seu cliente.",
  },
  delivered: {
    label: "Entregue",
    shortLabel: "OK",
    hint: "Seu cliente já resgatou/importou a entrega.",
  },
  failed: {
    label: "Falhou",
    shortLabel: "Erro",
    hint: "Houve um erro no processamento. Tente novamente ou contate o suporte com o ID da entrega.",
  },
  archived: {
    label: "Arquivada",
    shortLabel: "Arq.",
    hint: "Entrega arquivada (oculta na lista ativa). Você pode desarquivar a qualquer momento.",
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
