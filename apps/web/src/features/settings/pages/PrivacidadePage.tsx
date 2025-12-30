/**
 * Privacidade Page - B2C
 *
 * Página para configurações de privacidade e compartilhamento.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Globe, Users, Lock, Eye } from "lucide-react";

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  value: string;
  options: { value: string; label: string }[];
}

export const PrivacidadePage = () => {
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: "album_visibility",
      title: "Visibilidade do Álbum",
      description: "Quem pode ver o álbum do bebê",
      icon: Eye,
      value: "guardians",
      options: [
        { value: "private", label: "Somente eu" },
        { value: "guardians", label: "Guardiões convidados" },
        { value: "link", label: "Qualquer um com o link" },
      ],
    },
    {
      id: "guestbook",
      title: "Livro de Visitas",
      description: "Quem pode deixar mensagens",
      icon: Users,
      value: "moderated",
      options: [
        { value: "closed", label: "Desativado" },
        { value: "moderated", label: "Com aprovação" },
        { value: "open", label: "Aberto para convidados" },
      ],
    },
    {
      id: "share_default",
      title: "Compartilhamento Padrão",
      description: "Privacidade padrão para novos momentos",
      icon: Globe,
      value: "guardians",
      options: [
        { value: "private", label: "Privado" },
        { value: "guardians", label: "Guardiões" },
      ],
    },
  ]);

  const updateSetting = (id: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value } : s))
    );
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
          Privacidade
        </h1>
      </div>

      {/* Descrição */}
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        Configure quem pode ver e interagir com o álbum do seu bebê. Suas
        memórias estão sempre protegidas.
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
          Todas as suas fotos e dados são criptografados e armazenados com
          segurança. Você tem controle total sobre quem pode acessar as
          memórias do seu bebê.
        </p>
      </div>
    </div>
  );
};
