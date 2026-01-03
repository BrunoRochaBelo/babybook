import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation, useLanguage } from "@babybook/i18n";
import {
  Image,
  ChevronRight,
  Loader2,
  ArchiveRestore,
  Archive,
  CheckCircle2,
  X,
  User,
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

export const DELIVERY_GRID_COLS = "grid-cols-[2.5fr,1fr,1.2fr,0.8fr,auto]";

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
    <div
      onClick={handleRowClick}
      className={`
        group
        grid ${DELIVERY_GRID_COLS} items-center gap-4 px-6 py-4
        cursor-pointer
        bg-white dark:bg-transparent
        hover:bg-gray-50 dark:hover:bg-gray-700/30
        transition-colors
        ${isArchived ? "opacity-70 grayscale" : ""}
        ${
          isSelected
            ? "bg-pink-50/60 dark:bg-pink-900/10 ring-1 ring-inset ring-pink-100 dark:ring-pink-900/30"
            : ""
        }
      `}
    >
      {/* 1. Info: Icon + Title + Client */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-700">
           <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex flex-col min-w-0">
            <Link
              to={`/partner/deliveries/${delivery.id}`}
              className="font-bold text-gray-900 dark:text-white truncate hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
            >
              {delivery.title || "Sem título"}
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <User className="w-3 h-3" />
                <span className="truncate">{delivery.client_name || PLACEHOLDER_NOT_INFORMED}</span>
            </div>
        </div>
      </div>

      {/* 2. Status */}
      <div>
        <StatusBadge status={displayStatus} />
      </div>

      {/* 3. Voucher */}
      <div className="flex flex-col items-start gap-1">
          {delivery.voucher_code ? (
            <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 select-all">
              {delivery.voucher_code}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">
               {PLACEHOLDER_NOT_GENERATED}
            </span>
          )}
          <CreditStatusBadge
            status={delivery.credit_status}
            variant="subtle"
          />
      </div>

      {/* 4. Date */}
      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {formatDate(delivery.created_at, language)}
      </div>

      {/* 5. Actions */}
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        {variant === "default" && (
          <>
            <ArchiveAction
              isArchived={isArchived}
              isArchiving={isArchiving}
              onArchive={onArchive}
            />
          </>
        )}

        <Link
          to={`/partner/deliveries/${delivery.id}`}
          className="p-2 rounded-lg text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors ml-1"
          title={t("partner.deliveries.actions.open")}
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
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
      <span className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-0.5 animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={handleConfirmArchive}
          className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
          title={t("common.confirm")}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCancelArchive}
          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title={t("common.cancel")}
        >
          <X className="w-3.5 h-3.5" />
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
      className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
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
