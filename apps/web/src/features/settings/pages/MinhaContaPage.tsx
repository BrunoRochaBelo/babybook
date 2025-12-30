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
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

export const MinhaContaPage = () => {
  const user = useAuthStore((state) => state.user);
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
          Minha Conta
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
              {user?.name || "Usuário"}
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
            Dados Pessoais
          </h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                color: "var(--bb-color-accent)",
                backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.05))",
              }}
            >
              Editar
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
              Salvar
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
                Nome completo
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
                E-mail
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
          Segurança
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
              Alterar Senha
            </p>
            <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
              Redefina sua senha de acesso
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
