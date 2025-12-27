import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation, useLanguage } from "@babybook/i18n";
import {
  Image,
  Eye,
  ChevronRight,
  Loader2,
  ArchiveRestore,
  Archive,
  CheckCircle2,
  X,
} from "lucide-react";
import type { Delivery } from "../types";
import {
  getPartnerDeliveryDisplayStatus,
  isPartnerDeliveryArchived,
} from "../deliveryStatus";
import { CreditStatusBadge } from "../creditStatus";
import { StatusBadge } from "./StatusBadges";
import { formatDate } from "../utils";
import {
  PLACEHOLDER_NOT_GENERATED,
  PLACEHOLDER_NOT_INFORMED,
} from "../placeholders";

interface DeliveryTableRowProps {
  delivery: Delivery;
  isSelected: boolean;
  onPreview: () => void;
  onArchive: (archive: boolean) => void;
  isArchiving: boolean;
  /**
   * - "default": mostra ações completas (Preview, Archive, Open)
   * - "dashboard": mostra apenas ação de abrir detalhes
   */
  variant?: "default" | "dashboard";
}

export function DeliveryTableRow({
  delivery,
  isSelected,
  onPreview,
  onArchive,
  isArchiving,
  variant = "default",
}: DeliveryTableRowProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isArchived = isPartnerDeliveryArchived(delivery);
  const displayStatus = getPartnerDeliveryDisplayStatus(delivery);
  const hasVoucher = Boolean(delivery.voucher_code);

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as Element | null;
    const isInteractive = !!target?.closest(
      "a,button,input,select,textarea,[role='button']",
    );
    if (isInteractive) return;

    // No dashboard, clicar na linha vai para detalhes
    if (variant === "dashboard") {
      onPreview();
    } else {
      onPreview();
    }
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`
        group
        cursor-pointer
        hover:bg-gray-50 dark:hover:bg-gray-700/30
        transition-colors
        ${isArchived ? "opacity-70" : ""}
        ${
          isSelected
            ? "bg-pink-50/60 dark:bg-pink-900/10"
            : "bg-white dark:bg-transparent"
        }
      `}
    >
      <td className="px-4 py-2.5">
        <Link
          to={`/partner/deliveries/${delivery.id}`}
          className="flex items-center gap-3 min-w-0"
        >
          <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {delivery.title || delivery.client_name || "Sem título"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              ID: {delivery.id}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">
        <span className="truncate block max-w-[220px]">
          {delivery.client_name || PLACEHOLDER_NOT_INFORMED}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={displayStatus} />
      </td>
      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">
        {formatDate(delivery.created_at, language)}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex flex-col gap-1">
          {delivery.voucher_code ? (
            <span className="inline-block max-w-[160px] truncate align-middle text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
              {delivery.voucher_code}
            </span>
          ) : (
            <span
              className="text-gray-400"
              title={
                displayStatus === "ready"
                  ? "Entrega pronta. Gere o voucher nos detalhes."
                  : "O voucher aparece após a entrega ficar pronta."
              }
            >
              {PLACEHOLDER_NOT_GENERATED}
            </span>
          )}
          <CreditStatusBadge
            status={delivery.credit_status}
            variant={hasVoucher ? "subtle" : "pill"}
          />
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          {variant === "default" && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPreview();
                }}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={t("partner.deliveries.actions.preview")}
                aria-label={t("partner.deliveries.actions.preview")}
              >
                <Eye className="w-4 h-4" />
              </button>
              <ArchiveAction
                isArchived={isArchived}
                isArchiving={isArchiving}
                onArchive={onArchive}
              />
            </>
          )}

          <Link
            to={`/partner/deliveries/${delivery.id}`}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={t("partner.deliveries.actions.open")}
            aria-label={t("partner.deliveries.actions.open")}
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

// Internal ArchiveAction component (could be exported if needed elsewhere, but kept here for now)
function ArchiveAction({
  isArchived,
  isArchiving,
  onArchive,
}: {
  isArchived: boolean;
  isArchiving: boolean;
  onArchive: (archive: boolean) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useTranslation();

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isArchived) {
      onArchive(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleConfirmArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
    onArchive(true);
  };

  const handleCancelArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg px-2 py-1">
        <span className="hidden sm:inline text-xs text-yellow-700 dark:text-yellow-300 mr-1">
          Arquivar?
        </span>
        <button
          type="button"
          onClick={handleConfirmArchive}
          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded transition-colors"
          title={t("common.confirm")}
          aria-label={t("common.confirm")}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCancelArchive}
          className="p-1 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
          title={t("common.cancel")}
          aria-label={t("common.cancel")}
        >
          <X className="w-4 h-4" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleArchiveClick}
      disabled={isArchiving}
      title={
        isArchived
          ? t("partner.deliveries.archive.unarchive")
          : t("partner.deliveries.archive.action")
      }
      aria-label={
        isArchived
          ? t("partner.deliveries.archive.unarchive")
          : t("partner.deliveries.archive.action")
      }
      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {isArchiving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isArchived ? (
        <ArchiveRestore className="w-4 h-4" />
      ) : (
        <Archive className="w-4 h-4" />
      )}
    </button>
  );
}
