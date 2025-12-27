/**
 * Delivery Upload Page
 *
 * Página para adicionar mais fotos a uma entrega existente.
 * Reutiliza o hook usePartnerUpload.
 */

import { useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  Image,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getDelivery } from "./api";
import { usePartnerUpload } from "./usePartnerUpload";
import { usePartnerPageHeader } from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import {
  PartnerEmptyState,
  PartnerErrorState,
  PartnerLoadingState,
} from "@/layouts/partnerStates";
import { useTranslation } from "@babybook/i18n";

export function DeliveryUploadPage() {
  const { t } = useTranslation();
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: t("partner.upload.title"),
        backTo: deliveryId
          ? `/partner/deliveries/${deliveryId}`
          : "/partner/deliveries",
        backLabel: t("partner.upload.backToDelivery"),
      }),
      [deliveryId, t],
    ),
  );

  // Query delivery details
  const {
    data: delivery,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["delivery", deliveryId],
    queryFn: () => getDelivery(deliveryId!),
    enabled: !!deliveryId,
  });

  // Upload hook
  const {
    uploads,
    addFiles,
    retryUpload,
    removeUpload,
    isUploading,
    completedCount,
    totalCount,
    totalProgress,
  } = usePartnerUpload({
    deliveryId: deliveryId!,
    onAllComplete: () => {
      // Opcional: redirecionar após completar
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const openFilePicker = () => fileInputRef.current?.click();

  if (isLoading) {
    return <PartnerLoadingState size="narrow" label={t("partner.upload.loading")} />;
  }

  if (error || !delivery) {
    return (
      <PartnerErrorState
        size="narrow"
        title={t("partner.upload.notFound")}
        primaryAction={{
          label: t("partner.upload.backToDeliveries"),
          to: "/partner/deliveries",
        }}
      />
    );
  }

  // Não permitir upload se já tem voucher
  if (delivery.voucher_code) {
    return (
      <PartnerEmptyState
        size="narrow"
        tone="warning"
        icon={AlertCircle}
        title={t("partner.upload.finalizedTitle")}
        description={t("partner.upload.finalizedDescription")}
        primaryAction={{
          label: t("partner.upload.viewDelivery"),
          to: deliveryId
            ? `/partner/deliveries/${deliveryId}`
            : "/partner/deliveries",
        }}
      />
    );
  }

  return (
    <PartnerPage size="narrow">
      {/* Back Navigation */}
      <Link
        to={`/partner/deliveries/${deliveryId}`}
        className="hidden md:inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 mb-4 transition-all duration-200 rounded-lg px-2 py-1 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t("partner.upload.backToDelivery")}</span>
      </Link>

      {/* Page Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {t("partner.upload.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t("partner.upload.deliveryLabel")}: {delivery.title || delivery.client_name || t("common.noTitle")}
        </p>
      </div>

      <div className="md:hidden mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("partner.upload.deliveryLabel")}:{" "}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {delivery.title || delivery.client_name || t("common.noTitle")}
          </span>
        </p>
      </div>
      {/* Current Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/50 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("partner.upload.stats.photosInDelivery")}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {delivery.assets_count}
              </p>
            </div>
          </div>
          {completedCount > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("partner.upload.stats.uploadedNow")}
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                +{completedCount}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={0}
        aria-label={t("partner.upload.zone.ariaLabel")}
        className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center hover:border-pink-400 dark:hover:border-pink-500 transition-colors cursor-pointer"
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          {t("partner.upload.zone.dragDrop")}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          {t("partner.upload.zone.formats")}
        </p>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("partner.upload.list.title")} ({completedCount}/{totalCount})
            </h2>
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                {totalProgress}%
              </div>
            )}
          </div>

          <div className="space-y-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                  <Image className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {upload.file.name}
                  </p>
                  {upload.status === "error" ? (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      {upload.error}
                    </p>
                  ) : (
                    <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          upload.status === "complete"
                            ? "bg-green-500"
                            : "bg-pink-500"
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {upload.status === "complete" && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {upload.status === "error" && (
                  <button
                    onClick={() => retryUpload(upload.id)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-pink-600 dark:hover:text-pink-400"
                    aria-label={t("partner.upload.list.retry")}
                    title={t("partner.upload.list.retry")}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                {(upload.status === "compressing" ||
                  upload.status === "uploading") && (
                  <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                )}
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  aria-label={t("partner.upload.list.remove")}
                  title={t("partner.upload.list.remove")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => navigate(`/partner/deliveries/${deliveryId}`)}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          {t("partner.upload.list.cancel")}
        </button>
        <button
          onClick={() => navigate(`/partner/deliveries/${deliveryId}`)}
          disabled={isUploading}
          className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 font-medium"
        >
          {isUploading ? t("partner.upload.list.wait") : t("partner.upload.list.finish")}
        </button>
      </div>
    </PartnerPage>
  );
}

export default DeliveryUploadPage;
