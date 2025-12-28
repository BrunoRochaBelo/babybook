/**
 * Delivery Detail Page
 *
 * Detalhes da entrega com:
 * - Lista de assets
 * - Geração de voucher
 * - Download do cartão-convite
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Image,
  Trash2,
  Loader2,
  Ticket,
  QrCode,
  Plus,
  Copy,
  Check,
  Calendar,
  User,
} from "lucide-react";
import { getDelivery, generateVoucherCard, deleteDeliveryAsset } from "./api";
import { VoucherCard } from "./VoucherCard";
import type {
  DeliveryDetail,
  VoucherCardData,
  GenerateVoucherCardRequest,
  DeliveryStatus,
} from "./types";
import { PLACEHOLDER_NOT_GENERATED } from "./placeholders";
import {
  PartnerPageHeaderAction,
  usePartnerPageHeader,
} from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import {
  PartnerErrorState,
} from "@/layouts/partnerStates";
import { DeliveryDetailLoadingSkeleton } from "./components/DeliveryDetailLoadingSkeleton";
import { getPartnerDeliveryStatusMeta } from "./deliveryStatus";

import { useTranslation, useLanguage } from "@babybook/i18n";

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeHtml(html: string) {
  return {
    __html: html
      .replace(
        /<bold>/g,
        '<strong class="font-medium text-gray-900 dark:text-white">',
      )
      .replace(/<\/bold>/g, "</strong>"),
  };
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const { t } = useTranslation();
  const meta = getPartnerDeliveryStatusMeta(status);
  const tone =
    status === "ready"
      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
      : status === "delivered"
        ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
        : status === "failed"
          ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
          : status === "processing"
            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
            : status === "pending_upload"
              ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
              : status === "archived"
                ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";

  return (
    <span
      title={t(meta.hint)}
      aria-label={`${t(meta.label)}. ${t(meta.hint)}`}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tone}`}
    >
      {t(meta.label)}
    </span>
  );
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DeliveryDetailPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const autoOpenVoucherHandledRef = useRef(false);

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCard, setVoucherCard] = useState<VoucherCardData | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  useEffect(() => {
    // Ao navegar entre entregas (mesma página), garantimos que o deep-link possa ser processado novamente.
    autoOpenVoucherHandledRef.current = false;
  }, [deliveryId]);

  useEffect(() => {
    if (!copiedMessage) return;
    const t = setTimeout(() => setCopiedMessage(null), 2600);
    return () => clearTimeout(t);
  }, [copiedMessage]);

  // Query
  const {
    data: delivery,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["delivery", deliveryId],
    queryFn: () => getDelivery(deliveryId!),
    enabled: !!deliveryId,
  });

  const hasVoucher = Boolean(delivery?.voucher_code);
  const canGenerateVoucher = Boolean(
    delivery && delivery.assets_count > 0 && !hasVoucher,
  );

  // Deep-link UX: permite abrir o modal de voucher ao navegar a partir da prévia.
  // Precisa ficar antes dos early returns para respeitar as regras de hooks.
  useEffect(() => {
    if (autoOpenVoucherHandledRef.current) return;
    if (isLoading || error || !delivery) return;

    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get("openVoucher") === "1";
    if (!shouldOpen) return;

    // Evita reabrir em refresh/back: removemos o parâmetro sempre que ele existir.
    params.delete("openVoucher");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );

    autoOpenVoucherHandledRef.current = true;

    // Se já existe voucher, abrimos direto o cartão.
    // Se não existe mas dá para gerar, abrimos o fluxo de geração.
    if (hasVoucher || canGenerateVoucher) {
      setShowVoucherModal(true);
      return;
    }

    // Edge-case: pedido para abrir voucher, mas não há arquivos nem voucher.
    // Mantemos feedback discreto e orientamos o próximo passo.
    setCopiedMessage(t("partner.voucher.clipboardWarning"));
  }, [
    autoOpenVoucherHandledRef,
    canGenerateVoucher,
    delivery,
    error,
    hasVoucher,
    isLoading,
    location.pathname,
    location.search,
    navigate,
    t,
  ]);

  usePartnerPageHeader(
    useMemo(() => {
      if (!deliveryId) return null;
      if (error) return null;

      const title = delivery
        ? delivery.title || delivery.client_name || t("partner.details.title")
        : t("partner.details.title");

      const hasVoucherLocal = Boolean(delivery?.voucher_code);
      const canGenerateVoucherLocal = Boolean(
        delivery && delivery.assets_count > 0 && !hasVoucherLocal,
      );

      const tone = (status?: DeliveryStatus) => {
        switch (status) {
          case "ready":
            return "success" as const;
          case "delivered":
            return "purple" as const;
          case "processing":
            return "info" as const;
          case "pending_upload":
            return "warning" as const;
          default:
            return "neutral" as const;
        }
      };

      // UX: ação sticky só quando há um próximo passo claro.
      // Se já existe voucher, o CTA principal fica concentrado na seção "Voucher".
      const actions = canGenerateVoucherLocal ? (
        <PartnerPageHeaderAction
          label={t("partner.voucher.generate")}
          tone="primary"
          onClick={() => setShowVoucherModal(true)}
          icon={<Ticket className="w-4 h-4" />}
        />
      ) : null;

      return {
        title,
        backTo: "/partner/deliveries",
        backLabel: t("partner.details.backToDeliveries"),
        badge: delivery?.status
          ? {
              text: t(getPartnerDeliveryStatusMeta(delivery.status).label),
              tone: tone(delivery.status),
            }
          : undefined,
        actions,
      };
    }, [delivery, deliveryId, error, t]),
  );

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: ({ key }: { key: string }) =>
      deleteDeliveryAsset(deliveryId!, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery", deliveryId] });
    },
  });

  // Generate voucher mutation
  const generateVoucherMutation = useMutation({
    mutationFn: (request: GenerateVoucherCardRequest) =>
      generateVoucherCard(deliveryId!, request),
    onSuccess: (data) => {
      setVoucherCard(data);
      queryClient.invalidateQueries({ queryKey: ["delivery", deliveryId] });
      queryClient.invalidateQueries({ queryKey: ["partner", "stats"] });
    },
  });

  if (isLoading) {
    return <DeliveryDetailLoadingSkeleton />;
  }

  if (error || !delivery) {
    return (
      <PartnerErrorState
        title={t("partner.upload.notFound")}
        primaryAction={{
          label: t("partner.details.backToDeliveries"),
          to: "/partner/deliveries",
        }}
        skeleton={<DeliveryDetailLoadingSkeleton />}
      />
    );
  }

  const canUploadAssets = !hasVoucher;

  // Nota de UX: evitamos repetir informações/ações do voucher em múltiplos lugares.
  // Tudo relacionado a voucher fica concentrado na seção "Voucher".

  return (
    <>
      <PartnerPage>
        {/* Back Navigation */}
        <Link
          to="/partner/deliveries"
          className="hidden md:inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 mb-4 transition-all duration-200 rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("partner.details.backToDeliveries")}</span>
        </Link>

        {/* Mobile meta (evita duplicar o header grande) */}
        <div className="md:hidden mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {delivery.client_name ? (
              <>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {delivery.client_name}
                </span>
                {" • "}
              </>
            ) : null}
            {t("partner.details.created")}{" "}
            {formatDate(delivery.created_at, language)}
          </p>
        </div>

        {/* Desktop Page Header */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {delivery.title ||
                delivery.client_name ||
                t("partner.details.title")}
            </h1>
            <StatusBadge status={delivery.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            {delivery.client_name && (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span className="text-gray-700 dark:text-gray-200">
                  {delivery.client_name}
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(delivery.created_at, language)}
            </span>
          </div>
        </div>

        {copiedMessage && (
          <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {copiedMessage}
          </div>
        )}

        {/* Voucher (sempre visível) */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("partner.voucher.label")}
                </p>
                {hasVoucher ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    {t("partner.voucher.ready")}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                    {PLACEHOLDER_NOT_GENERATED}
                  </span>
                )}
              </div>

              {hasVoucher ? (
                <>
                  <p className="mt-1 text-lg font-mono font-semibold text-gray-900 dark:text-white">
                    {delivery.voucher_code}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {delivery.redeemed_at
                      ? t("partner.voucher.redeemedAt", {
                          date: formatDateTime(delivery.redeemed_at, language),
                        })
                      : t("partner.voucher.notRedeemed")}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {delivery.assets_count > 0
                    ? t("partner.voucher.explanation")
                    : t("partner.voucher.explanationNoFiles")}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasVoucher ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowVoucherModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors font-medium"
                  >
                    <QrCode className="w-4 h-4" />
                    {t("partner.voucher.openCard")}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!delivery.voucher_code) return;
                      const ok = await copyToClipboard(delivery.voucher_code);
                      setCopiedMessage(
                        ok
                          ? t("partner.voucher.copied")
                          : t("partner.voucher.copyFailed"),
                      );
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    {t("partner.voucher.copy")}
                  </button>
                </>
              ) : canGenerateVoucher ? (
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors font-medium"
                >
                  <Ticket className="w-4 h-4" />
                  {t("partner.voucher.generate")}
                </button>
              ) : canUploadAssets ? (
                <Link
                  to={`/partner/deliveries/${deliveryId}/upload`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {t("partner.details.sendFiles")}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 font-medium cursor-not-allowed"
                  title="Entrega finalizada"
                >
                  <Ticket className="w-4 h-4" />
                  {t("partner.voucher.unavailable")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informações adicionais (inline) */}
        {(delivery.description || delivery.event_date) && (
          <div className="mb-6 flex flex-wrap gap-4 text-sm">
            {delivery.event_date && (
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {t("partner.details.event")}:{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(delivery.event_date, language)}
                  </span>
                </span>
              </div>
            )}
            {delivery.description && (
              <div className="text-gray-600 dark:text-gray-300">
                <span className="text-gray-400">
                  {t("partner.details.description")}:
                </span>{" "}
                {delivery.description}
              </div>
            )}
          </div>
        )}

        {/* Assets Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("partner.details.files")} ({delivery.assets_count})
            </h2>
            {!hasVoucher ? (
              <Link
                to={`/partner/deliveries/${deliveryId}/upload`}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
              >
                <Plus className="w-4 h-4" />
                {t("partner.details.add")}
              </Link>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("partner.details.finalizedAdd")}
              </span>
            )}
          </div>

          {delivery.assets.length === 0 ? (
            <div className="p-8 text-center">
              <Image className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t("partner.details.noFiles")}
              </p>
              <Link
                to={`/partner/deliveries/${deliveryId}/upload`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("partner.details.sendFiles")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {delivery.assets.map((asset) => (
                <div
                  key={asset.key}
                  className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-medium text-gray-900 dark:text-white truncate"
                          title={asset.filename}
                        >
                          {asset.filename}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(asset.size_bytes)} •{" "}
                          {formatDateTime(asset.uploaded_at, language)}
                        </p>
                      </div>
                    </div>

                    {!hasVoucher ? (
                      <AssetDeleteAction
                        disabled={deleteAssetMutation.isPending}
                        onConfirm={() =>
                          deleteAssetMutation.mutate({ key: asset.key })
                        }
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PartnerPage>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <VoucherModal
          delivery={delivery}
          voucherCard={voucherCard}
          isGenerating={generateVoucherMutation.isPending}
          error={generateVoucherMutation.error?.message}
          onGenerate={(request) => generateVoucherMutation.mutate(request)}
          onClose={() => {
            setShowVoucherModal(false);
            if (!delivery.voucher_code && voucherCard) {
              // Refresh delivery data after generating voucher
              queryClient.invalidateQueries({
                queryKey: ["delivery", deliveryId],
              });
            }
          }}
        />
      )}
    </>
  );
}

function AssetDeleteAction({
  disabled,
  onConfirm,
}: {
  disabled: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1">
        <span className="text-[11px] text-yellow-800 dark:text-yellow-200 hidden sm:inline">
          {t("partner.details.removeConfirm")}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(false);
            onConfirm();
          }}
          className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 disabled:opacity-50"
          title={t("common.confirm")}
          aria-label={t("common.confirm")}
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(false);
          }}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-200"
          title={t("common.cancel")}
          aria-label={t("common.cancel")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-700 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
      title={t("partner.details.removeFile")}
      aria-label={t("partner.details.removeFile")}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

// =============================================================================
// Voucher Modal
// =============================================================================

interface VoucherModalProps {
  delivery: DeliveryDetail;
  voucherCard: VoucherCardData | null;
  isGenerating: boolean;
  error?: string;
  onGenerate: (request: GenerateVoucherCardRequest) => void;
  onClose: () => void;
}

function VoucherModal({
  delivery,
  voucherCard,
  isGenerating,
  error,
  onGenerate,
  onClose,
}: VoucherModalProps) {
  const { t } = useTranslation();
  const [beneficiaryName, setBeneficiaryName] = useState(
    delivery.client_name || "",
  );
  const [message, setMessage] = useState("");

  const isDirectImport = delivery.credit_status === "not_required";

  const hasExistingVoucher = !!delivery.voucher_code;
  const showGenerateForm = !hasExistingVoucher && !voucherCard;
  const cardData =
    voucherCard ||
    (hasExistingVoucher
      ? {
          mode: "voucher" as const,
          voucher_code: delivery.voucher_code!,
          redeem_url: `${window.location.origin}/resgate/${delivery.voucher_code}`,
          qr_data: `${window.location.origin}/resgate/${delivery.voucher_code}`,
          studio_name: "",
          studio_logo_url: null,
          beneficiary_name: delivery.client_name,
          message: "",
          assets_count: delivery.assets_count,
          expires_at: null,
        }
      : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {showGenerateForm ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {isDirectImport
                  ? t("partner.voucher.modal.titleImport")
                  : t("partner.voucher.modal.titleVoucher")}
              </h2>

              <p
                className="text-gray-600 dark:text-gray-300 mb-6"
                dangerouslySetInnerHTML={safeHtml(
                  isDirectImport
                    ? t("partner.voucher.modal.descImport")
                    : t("partner.voucher.modal.descVoucher"),
                )}
              />

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("partner.voucher.modal.beneficiary")}
                  </label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder={t(
                      "partner.voucher.modal.beneficiaryPlaceholder",
                    )}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("partner.voucher.modal.message")}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder={t("partner.voucher.modal.messagePlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t("partner.voucher.modal.cancel")}
                </button>
                <button
                  onClick={() =>
                    onGenerate({
                      beneficiary_name: beneficiaryName || undefined,
                      message: message || undefined,
                    })
                  }
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("partner.voucher.modal.finalize")}
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      {isDirectImport
                        ? t("partner.voucher.modal.generateLink")
                        : t("partner.voucher.modal.generateBtn")}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : cardData ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t("partner.voucher.modal.titleCard")}
              </h2>

              {/* Use VoucherCard Component */}
              <VoucherCard data={cardData} />

              <button
                onClick={onClose}
                className="w-full mt-6 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t("common.close")}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default DeliveryDetailPage;
