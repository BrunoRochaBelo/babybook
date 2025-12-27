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
} from "lucide-react";
import { type Delivery } from "../types";
import {
  isPartnerDeliveryArchived,
  getPartnerDeliveryDisplayStatus,
} from "../deliveryStatus";
import { formatDate } from "../utils";
import { StatusBadge } from "./StatusBadges";
import { CreditStatusBadge } from "../creditStatus";
import { PLACEHOLDER_NOT_GENERATED } from "../placeholders";

interface DeliveryCardMobileProps {
  delivery: Delivery;
  onArchive: (archive: boolean) => void;
  isArchiving: boolean;
  /**
   * - "default": mostra ações completas (Archive, Open)
   * - "dashboard": mostra apenas ação de abrir detalhes
   */
  variant?: "default" | "dashboard";
}

export function DeliveryCardMobile({
  delivery,
  onArchive,
  isArchiving,
  variant = "default",
}: DeliveryCardMobileProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isArchived = isPartnerDeliveryArchived(delivery);
  const displayStatus = getPartnerDeliveryDisplayStatus(delivery);
  const hasVoucher = Boolean(delivery.voucher_code);

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all ${
        isArchived ? "opacity-70" : ""
      }`}
    >
      {/* Main Content - Clickable */}
      <Link to={`/partner/deliveries/${delivery.id}`} className="block p-4">
        {/* Row 1: Icon + Title/Client + Status Badge */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white text-base leading-tight line-clamp-2">
                  {delivery.title || delivery.client_name || "Sem título"}
                </h3>
                {delivery.client_name && delivery.title && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {delivery.client_name}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <StatusBadge status={displayStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Date + Voucher Code */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {formatDate(delivery.created_at, language)}
          </span>
          {delivery.voucher_code ? (
            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md">
              {delivery.voucher_code}
            </span>
          ) : (
            <span
              className="text-xs text-gray-400 dark:text-gray-500 italic"
              title={
                displayStatus === "ready"
                  ? "Entrega pronta. Gere o voucher nos detalhes."
                  : "O voucher aparece após a entrega ficar pronta."
              }
            >
              {PLACEHOLDER_NOT_GENERATED}
            </span>
          )}
        </div>
      </Link>

      {/* Row 3: Credit Badge + Actions - Separated */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
        <CreditStatusBadge
          status={delivery.credit_status}
          variant={hasVoucher ? "subtle" : "pill"}
        />

        <div className="flex items-center gap-2">
          {variant === "default" && (
            <ArchiveActionButton
              isArchived={isArchived}
              isArchiving={isArchiving}
              onArchive={onArchive}
            />
          )}

          {/* View Details Button - Primary action */}
          <Link
            to={`/partner/deliveries/${delivery.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t("partner.deliveries.actions.open")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Reuse similar Archive Button logic but styled for card context if needed (same as desktop actually)
function ArchiveActionButton({
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
        <button
          type="button"
          onClick={handleConfirmArchive}
          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded transition-colors"
          title={t("common.confirm")}
          aria-label={t("common.confirm")}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleCancelArchive}
          className="p-1 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
          title={t("common.cancel")}
          aria-label={t("common.cancel")}
        >
          <X className="w-5 h-5" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleArchiveClick}
      disabled={isArchiving}
      className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
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
    >
      {isArchiving ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isArchived ? (
        <ArchiveRestore className="w-5 h-5" />
      ) : (
        <Archive className="w-5 h-5" />
      )}
    </button>
  );
}
