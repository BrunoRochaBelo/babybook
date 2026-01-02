/**
 * Armazenamento Page - B2C
 *
 * Página para visualização de uso de armazenamento e gestão de backups.
 */

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  HardDrive,
  Image,
  Video,
  Mic,
  Check,
  Cloud,
} from "lucide-react";
import { getStorageStats, settingsApiKeys } from "../api";
import { useTranslation } from "@babybook/i18n";
import { SettingsSubsectionSkeleton } from "../components/SettingsSubsectionSkeleton";

export const ArmazenamentoPage = () => {
  const { t } = useTranslation();

  // Busca estatísticas da API
  const { data, isLoading } = useQuery({
    queryKey: settingsApiKeys.storage,
    queryFn: getStorageStats,
    retry: 1,
    staleTime: 30000,
  });

  if (isLoading) {
    return <SettingsSubsectionSkeleton />;
  }

  // Converte bytes para GB
  const formatStorage = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1);
  };

  const storageUsed = data ? formatStorage(data.bytes_used) : "2.3";
  const storageTotal = data?.is_unlimited
    ? t("b2c.storage.unlimited")
    : data
      ? formatStorage(data.bytes_quota) + " GB"
      : t("b2c.storage.unlimited");
  const usagePercentage =
    data && !data.is_unlimited && data.bytes_quota > 0
      ? Math.min(100, (data.bytes_used / data.bytes_quota) * 100)
      : 23;
  const photosCount = data?.photos_count ?? 156;
  const videosCount = data?.videos_count ?? 12;
  const audiosCount = data?.audios_count ?? 8;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/jornada"
          className="p-2 rounded-xl hover:bg-[var(--bb-color-bg)] transition-colors"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1
          className="text-2xl font-serif font-bold"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.storage.title")}
        </h1>
      </div>

      {/* Storage Usage */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <HardDrive
            className="w-5 h-5"
            style={{ color: "var(--bb-color-accent)" }}
          />
          <h3
            className="font-semibold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.storage.usedSpace")}
          </h3>
        </div>
        <div className="flex justify-between items-baseline mb-3">
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {storageUsed} GB
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.storage.usedOfTotal", { total: storageTotal })}
          </span>
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--bb-color-bg)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              backgroundColor: "var(--bb-color-accent)",
              width: `${usagePercentage}%`,
            }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <h4
          className="font-semibold mb-4"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.storage.statsByType")}
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: Image,
              value: photosCount.toString(),
              label: t("b2c.storage.photos"),
              color: "var(--bb-color-accent)",
            },
            {
              icon: Video,
              value: videosCount.toString(),
              label: t("b2c.storage.videos"),
              color: "var(--bb-color-accent)",
            },
            {
              icon: Mic,
              value: audiosCount.toString(),
              label: t("b2c.storage.audios"),
              color: "var(--bb-color-accent)",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="text-center p-3 rounded-xl"
                style={{ backgroundColor: "var(--bb-color-bg)" }}
              >
                <Icon
                  className="w-6 h-6 mx-auto mb-2"
                  style={{ color: stat.color }}
                />
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backup Status */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.05))",
            }}
          >
            <Check
              className="w-5 h-5"
              style={{ color: "var(--bb-color-accent)" }}
            />
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--bb-color-ink)" }}>
              {t("b2c.storage.backupActive")}
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {t("b2c.storage.lastBackup", { time: "2 horas" })}
            </p>
          </div>
        </div>
        <button
          className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--bb-color-accent)",
            color: "white",
          }}
        >
          <Cloud className="w-5 h-5" />
          {t("b2c.storage.backupNow")}
        </button>
      </div>

      {/* Info */}
      <div
        className="mt-6 p-4 rounded-2xl"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <p
          className="text-sm"
          style={{ color: "var(--bb-color-ink-muted)" }}
          dangerouslySetInnerHTML={{ __html: t("b2c.storage.tip") }}
        />
      </div>
    </div>
  );
};
