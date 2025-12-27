
import {
  Clock,
  Loader2,
  CheckCircle2,
  Gift,
  X,
  Package,
} from "lucide-react";
import { useTranslation } from "@babybook/i18n";
import { type DeliveryStatus } from "../types";
import { getPartnerDeliveryStatusMeta } from "../deliveryStatus";

const statusConfig: Record<
  DeliveryStatus,
  {
    icon: typeof Clock;
    className: string;
    labelKey: string;
    shortLabelKey: string;
  }
> = {
  draft: {
    icon: Clock,
    className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    labelKey: "partner.status.draft.label",
    shortLabelKey: "partner.status.draft.shortLabel",
  },
  pending_upload: {
    icon: Clock,
    className:
      "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    labelKey: "partner.status.pending_upload.label",
    shortLabelKey: "partner.status.pending_upload.shortLabel",
  },
  processing: {
    icon: Loader2,
    className:
      "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    labelKey: "partner.status.processing.label",
    shortLabelKey: "partner.status.processing.shortLabel",
  },
  ready: {
    icon: CheckCircle2,
    className:
      "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    labelKey: "partner.status.ready.label",
    shortLabelKey: "partner.status.ready.shortLabel",
  },
  delivered: {
    icon: Gift,
    className:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    labelKey: "partner.status.delivered.label",
    shortLabelKey: "partner.status.delivered.shortLabel",
  },
  failed: {
    icon: X,
    className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    labelKey: "partner.status.failed.label",
    shortLabelKey: "partner.status.failed.shortLabel",
  },
  archived: {
    icon: Package,
    className: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    labelKey: "partner.status.archived.label",
    shortLabelKey: "partner.status.archived.shortLabel",
  },
};

export { statusConfig };

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const { t } = useTranslation();
  const cfg = statusConfig[status] || statusConfig.draft;
  const Icon = cfg.icon;
  const meta = getPartnerDeliveryStatusMeta(status);

  return (
    <span
      title={t(meta.hint)}
      aria-label={`${t(cfg.labelKey)}. ${t(meta.hint)}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon
        className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`}
      />
      <span className="sm:hidden">{t(cfg.shortLabelKey)}</span>
      <span className="hidden sm:inline">{t(cfg.labelKey)}</span>
    </span>
  );
}

// Also re-export CreditStatusBadge if needed, or just import it directly.
// The existing components imported CreditStatusBadge from "../components/StatusBadges" 
// which implies I should export it here too if I want to match the import path 
// BUT it was originally in `creditStatus.ts`.
// I will just make the components import from correct place (`../creditStatus`).
