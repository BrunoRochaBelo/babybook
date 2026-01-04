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
  Shield,
  ArrowRight,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { getStorageStats, settingsApiKeys } from "../api";
import { useTranslation } from "@babybook/i18n";
import { SettingsSubsectionSkeleton } from "../components/SettingsSubsectionSkeleton";

import { B2CBackButton } from "@/components/B2CBackButton";

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 py-6"
    >
      {/* Botão Voltar */}
      <B2CBackButton fallback="/jornada/minha-conta" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h1
          className="text-3xl font-serif font-bold leading-tight"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.storage.title")}
        </h1>
      </div>

      {/* Descrição */}
      <p
        className="mb-8 text-lg"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        Gerencie o espaço utilizado por suas memórias e backups.
      </p>

      {/* Storage Usage */}
      <div
        className="rounded-2xl p-6 mb-8 shadow-sm"
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
            className="font-bold text-lg"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.storage.usedSpace")}
          </h3>
        </div>
        <div className="flex justify-between items-baseline mb-4">
          <span
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {storageUsed} GB
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.storage.usedOfTotal", { total: storageTotal })}
          </span>
        </div>
        <div
          className="h-4 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--bb-color-bg)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              backgroundColor: "var(--bb-color-accent)",
            }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div
        className="rounded-2xl p-6 mb-8 shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <h4
          className="font-bold mb-4 text-base"
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
                className="text-center p-4 rounded-2xl transition-transform hover:scale-105"
                style={{ backgroundColor: "var(--bb-color-bg)" }}
              >
                <Icon
                  className="w-8 h-8 mx-auto mb-3"
                  style={{ color: stat.color }}
                />
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs font-medium uppercase tracking-wide"
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
        className="rounded-2xl p-6 mb-8 shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.05))",
            }}
          >
            <Check
              className="w-6 h-6"
              style={{ color: "var(--bb-color-accent)" }}
            />
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: "var(--bb-color-ink)" }}>
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
          className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90"
          style={{
            backgroundColor: "var(--bb-color-accent)",
            color: "white",
          }}
        >
          <Cloud className="w-5 h-5" />
          {t("b2c.storage.backupNow")}
        </button>
      </div>

      {/* Info Tip */}
       <div
        className="mb-10 p-6 rounded-2xl"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--bb-color-ink-muted)" }}
          dangerouslySetInnerHTML={{ __html: t("b2c.storage.tip") }}
        />
      </div>

      {/* Sugestões (Teia de Navegação) */}
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--bb-color-ink-muted)" }}>
        Veja também
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/cofre"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99] group"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[var(--bb-color-bg)]" style={{ backgroundColor: "var(--bb-color-bg)", border: "1px solid var(--bb-color-border)" }}>
                <Shield className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
             </div>
             <div>
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Cofre Seguro</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Proteja seus documentos</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
        
        <Link
          to="/jornada/minha-conta"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99] group"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[var(--bb-color-bg)]" style={{ backgroundColor: "var(--bb-color-bg)", border: "1px solid var(--bb-color-border)" }}>
                <User className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
             </div>
             <div>
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Minha Conta</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Planos e Perfil</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
      </div>
    </motion.div>
  );
};
