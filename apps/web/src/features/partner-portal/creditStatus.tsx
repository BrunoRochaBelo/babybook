import { ArchiveRestore, CheckCircle2, Clock, Gift } from "lucide-react";

export type PartnerCreditStatus =
  | "reserved"
  | "consumed"
  | "refunded"
  | "not_required";

export type PartnerCreditStatusMeta = {
  label: string;
  shortLabel: string;
  title: string;
  pillClassName: string;
  subtleClassName: string;
  icon: typeof Clock;
};

const CREDIT_STATUS_META: Record<PartnerCreditStatus, PartnerCreditStatusMeta> =
  {
    reserved: {
      icon: Clock,
      label: "Crédito reservado",
      shortLabel: "Reservado",
      title:
        "Crédito reservado e em processamento. Será consumido ou devolvido quando o cliente resgatar.",
      pillClassName:
        "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200",
      subtleClassName: "text-amber-800 dark:text-amber-200",
    },
    not_required: {
      icon: Gift,
      label: "Sem custo",
      shortLabel: "Sem custo",
      title:
        "Esta entrega não requer voucher para existir. Só haverá cobrança se o cliente criar um novo Baby Book.",
      pillClassName:
        "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
      subtleClassName: "text-blue-800 dark:text-blue-200",
    },
    consumed: {
      icon: CheckCircle2,
      label: "Crédito usado",
      shortLabel: "Usado",
      title: "Crédito utilizado com sucesso.",
      pillClassName:
        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200",
      subtleClassName: "text-emerald-800 dark:text-emerald-200",
    },
    refunded: {
      icon: ArchiveRestore,
      label: "Crédito devolvido",
      shortLabel: "Devolvido",
      title:
        "Crédito devolvido automaticamente (ex.: cliente vinculou a um Baby Book existente).",
      pillClassName:
        "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
      subtleClassName: "text-gray-600 dark:text-gray-300",
    },
  };

export function getPartnerCreditStatusMeta(
  status: PartnerCreditStatus,
): PartnerCreditStatusMeta {
  return CREDIT_STATUS_META[status];
}

export function CreditStatusBadge({
  status,
  variant = "pill",
}: {
  status?: PartnerCreditStatus | null;
  variant?: "pill" | "subtle";
}) {
  if (!status) return null;

  const meta = getPartnerCreditStatusMeta(status);
  const Icon = meta.icon;

  const isSubtle = variant === "subtle";
  const className = isSubtle
    ? `inline-flex items-center gap-1.5 text-[11px] font-medium ${meta.subtleClassName}`
    : `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${meta.pillClassName}`;

  return (
    <span
      title={meta.title}
      aria-label={`${meta.label}. ${meta.title}`}
      className={className}
    >
      <Icon className="w-3 h-3 opacity-80" />
      <span className="sm:hidden">{meta.shortLabel}</span>
      <span className="hidden sm:inline">{meta.label}</span>
    </span>
  );
}
