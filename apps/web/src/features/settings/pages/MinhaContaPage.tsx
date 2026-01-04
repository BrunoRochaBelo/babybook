/**
 * Minha Conta Page - B2C
 *
 * Página unificada para gerenciamento de perfil e preferências do usuário.
 */

import { useState } from "react";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Key,
  Save,
  Loader2,
  Sun,
  Moon,
  Smartphone,
  LogOut,
  Baby,
  Plus,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/hooks/useTheme";
import { apiClient } from "@/lib/api-client";
import { useLanguage, useTranslation } from "@babybook/i18n";
import { MinhaContaSkeleton } from "../components/MinhaContaSkeleton";
import { B2CButton } from "@/components/B2CButton";

export const MinhaContaPage = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuthStore((state) => state);
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, languages } = useLanguage();
  const { children } = useSelectedChild();

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 py-6"
    >
      {/* Header Info - Refatorado */}
      <div>
        <Link
          to="/jornada"
          className="inline-flex items-center gap-2 mb-6 p-2 -ml-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--bb-color-bg)]"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </Link>
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold font-serif shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, var(--bb-color-accent), var(--bb-color-accent-dark, var(--bb-color-accent)))",
          }}
        >
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center h-24">
          <h1 className="text-3xl font-serif font-bold leading-tight" style={{ color: "var(--bb-color-ink)" }}>
            {user?.name || t("b2c.myAccount.user")}
          </h1>
          <p className="text-lg" style={{ color: "var(--bb-color-ink-muted)" }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* 2. Dados Pessoais */}
      <div
        className="rounded-2xl p-6 mb-8"
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
            <B2CButton
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              {t("b2c.myAccount.edit")}
            </B2CButton>
          ) : (
            <B2CButton
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? t("b2c.myAccount.saving") : t("b2c.myAccount.save")}
            </B2CButton>
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

      {/* 3. Preferências */}
      <div
        className="rounded-2xl p-6 mb-8"
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

      {/* 4. Crianças */}
      <div
        className="rounded-2xl p-6 mb-8"
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
            Crianças
          </h2>
          <B2CButton variant="secondary" size="sm" onClick={() => {}}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </B2CButton>
        </div>

        <div className="space-y-3">
          {(children || []).map((child: any) => (
            <div
              key={child.id}
              className="flex items-center justify-between p-3 rounded-xl transition-colors"
              style={{ backgroundColor: "var(--bb-color-bg)" }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bb-color-surface)", border: "1px solid var(--bb-color-border)" }}
                >
                  <Baby className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
                </div>
                <span className="font-semibold" style={{ color: "var(--bb-color-ink)" }}>
                  {child.name}
                </span>
              </div>
              <B2CButton 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = `/jornada/perfil-crianca?id=${child.id}`}
              >
                Gerenciar
              </B2CButton>
            </div>
          ))}
          {(!children || children.length === 0) && (
             <p className="text-sm text-center py-4" style={{ color: "var(--bb-color-ink-muted)" }}>
                Nenhuma criança cadastrada.
             </p>
          )}
        </div>
      </div>

      {/* 5. Segurança */}
      <div
        className="rounded-2xl p-6 mb-8"
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

      {/* Sugestões (Teia de Navegação) */}
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--bb-color-ink-muted)" }}>
        Veja também
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link
          to="/jornada/privacidade"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            backgroundColor: "var(--bb-color-bg)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bb-color-surface)", border: "1px solid var(--bb-color-border)" }}>
                <Key className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
             </div>
             <div>
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Privacidade</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Seus dados seguros</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
        
        <Link
          to="/jornada/armazenamento"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            backgroundColor: "var(--bb-color-bg)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bb-color-surface)", border: "1px solid var(--bb-color-border)" }}>
                <Save className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
             </div>
             <div>
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Armazenamento</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Gerencie seu espaço</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
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
    </motion.div>
  );
};
