/**
 * Minha Conta Page - B2C
 *
 * Página unificada para gerenciamento de perfil e preferências do usuário.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Key,
  Camera,
  ChevronLeft,
  Save,
  Loader2,
  Sun,
  Moon,
  Smartphone,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/hooks/useTheme";
import { apiClient } from "@/lib/api-client";
import { useLanguage, useTranslation } from "@babybook/i18n";
import { MinhaContaSkeleton } from "../components/MinhaContaSkeleton";

export const MinhaContaPage = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuthStore((state) => state);
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, languages } = useLanguage();

  if (isLoading) {
    return <MinhaContaSkeleton />;
  }
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

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
          {t("b2c.myAccount.title")}
        </h1>
      </div>

      {/* Avatar */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--bb-color-accent), var(--bb-color-accent-dark, var(--bb-color-accent)))",
              }}
            >
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <button
              type="button"
              className="absolute -bottom-2 -right-2 p-2 rounded-xl shadow-lg"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                border: "1px solid var(--bb-color-border)",
                color: "var(--bb-color-ink-muted)",
              }}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center">
            <p
              className="font-semibold text-lg"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {user?.name || t("b2c.myAccount.user")}
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.myAccount.personalData")}
          </h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                color: "var(--bb-color-accent)",
                backgroundColor:
                  "var(--bb-color-accent-light, rgba(0,0,0,0.05))",
              }}
            >
              {t("b2c.myAccount.edit")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "var(--bb-color-accent)",
              }}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? t("b2c.myAccount.saving") : t("b2c.myAccount.save")}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Nome */}
          <div
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ backgroundColor: "var(--bb-color-bg)" }}
          >
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                border: "1px solid var(--bb-color-border)",
              }}
            >
              <User
                className="w-5 h-5"
                style={{ color: "var(--bb-color-ink-muted)" }}
              />
            </div>
            <div className="flex-1">
              <p
                className="text-xs mb-1"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {t("b2c.myAccount.fullName")}
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-transparent font-medium outline-none"
                  style={{ color: "var(--bb-color-ink)" }}
                />
              ) : (
                <p
                  className="font-medium"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {user?.name || "—"}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ backgroundColor: "var(--bb-color-bg)" }}
          >
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                border: "1px solid var(--bb-color-border)",
              }}
            >
              <Mail
                className="w-5 h-5"
                style={{ color: "var(--bb-color-ink-muted)" }}
              />
            </div>
            <div className="flex-1">
              <p
                className="text-xs mb-1"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {t("b2c.myAccount.email")}
              </p>
              <p
                className="font-medium"
                style={{ color: "var(--bb-color-ink)" }}
              >
                {user?.email || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {t("b2c.myAccount.security")}
        </h2>

        <button
          type="button"
          className="w-full flex items-center gap-4 p-4 rounded-xl transition-colors"
          style={{ backgroundColor: "var(--bb-color-bg)" }}
        >
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            <Key
              className="w-5 h-5"
              style={{ color: "var(--bb-color-ink-muted)" }}
            />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium" style={{ color: "var(--bb-color-ink)" }}>
              {t("b2c.myAccount.changePassword")}
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {t("b2c.myAccount.changePasswordDesc")}
            </p>
          </div>
        </button>

        <div
          className="mt-4 p-4 rounded-xl border border-dashed"
          style={{ borderColor: "var(--bb-color-border)" }}
        >
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.myAccount.signOutAll")}
          </p>
          <p
            className="text-xs mb-3"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.myAccount.signOutAllDesc")}
          </p>
          <button
            type="button"
            className="w-full py-2.5 rounded-xl font-medium transition-colors border"
            style={{
              borderColor: "var(--bb-color-danger)",
              color: "var(--bb-color-danger)",
            }}
            onClick={async () => {
              if (window.confirm(t("b2c.myAccount.signOutAllConfirm"))) {
                try {
                  await apiClient.post("/auth/logout/all");
                  window.location.href = "/login";
                } catch {
                  alert(t("b2c.myAccount.signOutAllError"));
                }
              }
            }}
          >
            {t("b2c.myAccount.signOutAllBtn")}
          </button>
        </div>
      </div>

      {/* Preferências */}
      <div
        className="rounded-2xl p-6 mt-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {t("b2c.myAccount.preferences")}
        </h2>

        <p
          className="text-sm mb-3"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {t("b2c.myAccount.theme")}
        </p>
        <div
          className="flex gap-2 p-1.5 rounded-2xl"
          style={{
            backgroundColor: "var(--bb-color-bg)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          {[
            {
              value: "light" as const,
              icon: Sun,
              label: t("b2c.myAccount.themeLight"),
            },
            {
              value: "dark" as const,
              icon: Moon,
              label: t("b2c.myAccount.themeDark"),
            },
            {
              value: "system" as const,
              icon: Smartphone,
              label: t("b2c.myAccount.themeSystem"),
            },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-semibold text-xs"
              style={{
                backgroundColor:
                  theme === option.value
                    ? "var(--bb-color-surface)"
                    : "transparent",
                color:
                  theme === option.value
                    ? "var(--bb-color-accent)"
                    : "var(--bb-color-ink-muted)",
                boxShadow:
                  theme === option.value
                    ? "0 1px 2px rgba(0,0,0,0.05)"
                    : "none",
              }}
            >
              <option.icon className="w-4 h-4" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {/* Idioma */}
        <p
          className="text-sm mb-3 mt-6"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {t("b2c.myAccount.language")}
        </p>
        <div
          className="flex gap-2 p-1.5 rounded-2xl"
          style={{
            backgroundColor: "var(--bb-color-bg)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          {languages.map((option) => (
            <button
              key={option.code}
              onClick={() => setLanguage(option.code)}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-semibold text-xs"
              style={{
                backgroundColor:
                  language === option.code
                    ? "var(--bb-color-surface)"
                    : "transparent",
                color:
                  language === option.code
                    ? "var(--bb-color-accent)"
                    : "var(--bb-color-ink-muted)",
                boxShadow:
                  language === option.code
                    ? "0 1px 2px rgba(0,0,0,0.05)"
                    : "none",
              }}
            >
              <span className="text-sm">{option.flag}</span>
              <span>{option.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        className="mt-6 w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-medium transition-opacity hover:opacity-80"
        style={{ color: "var(--bb-color-danger, #ef4444)" }}
      >
        <LogOut className="w-5 h-5" />
        {t("b2c.myAccount.signOut")}
      </button>
    </div>
  );
};
