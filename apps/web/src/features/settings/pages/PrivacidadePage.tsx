/**
 * Privacidade Page - B2C
 *
 * Página para configurações de privacidade e compartilhamento.
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Globe, Users, Lock, Eye, Download, Trash2 } from "lucide-react";
import { useTranslation } from "@babybook/i18n";

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  value: string;
  options: { value: string; label: string }[];
}

export const PrivacidadePage = () => {
  const { t } = useTranslation();
  
  const [values, setValues] = useState<Record<string, string>>({
    album_visibility: "guardians",
    guestbook: "moderated",
    share_default: "guardians",
  });

  const settings = useMemo<PrivacySetting[]>(() => [
    {
      id: "album_visibility",
      title: t("b2c.privacy.albumVisibility"),
      description: t("b2c.privacy.albumVisibilityDesc"),
      icon: Eye,
      value: values.album_visibility,
      options: [
        { value: "private", label: t("b2c.privacy.options.onlyMe") },
        { value: "guardians", label: t("b2c.privacy.options.guardians") },
        { value: "link", label: t("b2c.privacy.options.anyoneLink") },
      ],
    },
    {
      id: "guestbook",
      title: t("b2c.privacy.guestbook"),
      description: t("b2c.privacy.guestbookDesc"),
      icon: Users,
      value: values.guestbook,
      options: [
        { value: "closed", label: t("b2c.privacy.options.disabled") },
        { value: "moderated", label: t("b2c.privacy.options.withApproval") },
        { value: "open", label: t("b2c.privacy.options.openToGuests") },
      ],
    },
    {
      id: "share_default",
      title: t("b2c.privacy.shareDefault"),
      description: t("b2c.privacy.shareDefaultDesc"),
      icon: Globe,
      value: values.share_default,
      options: [
        { value: "private", label: t("b2c.privacy.options.private") },
        { value: "guardians", label: t("b2c.privacy.options.guardiansSimple") },
      ],
    },
  ], [t, values]);

  const updateSetting = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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
          {t("b2c.privacy.title")}
        </h1>
      </div>

      {/* Descrição */}
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        {t("b2c.privacy.description")}
      </p>

      {/* Settings List */}
      <div className="space-y-4">
        {settings.map((setting) => {
          const Icon = setting.icon;
          return (
            <div
              key={setting.id}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                border: "1px solid var(--bb-color-border)",
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: "var(--bb-color-bg)",
                    color: "var(--bb-color-accent)",
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p
                    className="font-medium"
                    style={{ color: "var(--bb-color-ink)" }}
                  >
                    {setting.title}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {setting.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {setting.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateSetting(setting.id, option.value)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor:
                        setting.value === option.value
                          ? "var(--bb-color-accent)"
                          : "var(--bb-color-bg)",
                      color:
                        setting.value === option.value
                          ? "white"
                          : "var(--bb-color-ink)",
                      border:
                        setting.value === option.value
                          ? "1px solid transparent"
                          : "1px solid var(--bb-color-border)",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Info */}
      <div
        className="mt-6 p-4 rounded-2xl flex items-start gap-3"
        style={{
          backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.03))",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <Lock
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: "var(--bb-color-accent)" }}
        />
        <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          {t("b2c.privacy.securityInfo")}
        </p>
      </div>

      {/* Data Management */}
      <div
        className="mt-6 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <button
          type="button"
          className="w-full p-4 flex items-center gap-4 transition-colors hover:bg-[var(--bb-color-bg)]"
          style={{ borderBottom: "1px solid var(--bb-color-border)" }}
        >
          <div
            className="p-2.5 rounded-xl"
            style={{
              backgroundColor: "var(--bb-color-bg)",
              color: "var(--bb-color-accent)",
            }}
          >
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium" style={{ color: "var(--bb-color-ink)" }}>
              {t("b2c.privacy.exportData")}
            </p>
            <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
              {t("b2c.privacy.exportDataDesc")}
            </p>
          </div>
        </button>

        <button
          type="button"
          className="w-full p-4 flex items-center gap-4 transition-colors hover:bg-[var(--bb-color-bg)]"
        >
          <div
            className="p-2.5 rounded-xl"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "var(--bb-color-danger, #ef4444)",
            }}
          >
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p
              className="font-medium"
              style={{ color: "var(--bb-color-danger, #ef4444)" }}
            >
              {t("b2c.privacy.deleteAccount")}
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--bb-color-danger, #ef4444)", opacity: 0.8 }}
            >
              {t("b2c.privacy.deleteAccountDesc")}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
