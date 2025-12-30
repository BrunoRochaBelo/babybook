/**
 * Notificações Page - B2C
 *
 * Página para configurações de notificações e lembretes.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Bell, Calendar, Sparkles, Users } from "lucide-react";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

export const NotificacoesPage = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "milestones",
      title: "Marcos do Bebê",
      description: "Lembretes sobre marcos de desenvolvimento",
      icon: Sparkles,
      enabled: true,
    },
    {
      id: "appointments",
      title: "Consultas e Vacinas",
      description: "Alertas de consultas médicas agendadas",
      icon: Calendar,
      enabled: true,
    },
    {
      id: "guestbook",
      title: "Livro de Visitas",
      description: "Novas mensagens no livro de visitas",
      icon: Users,
      enabled: true,
    },
    {
      id: "updates",
      title: "Atualizações do App",
      description: "Novidades e melhorias do Baby Book",
      icon: Bell,
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
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
          Notificações
        </h1>
      </div>

      {/* Descrição */}
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        Configure quais notificações você deseja receber para acompanhar a
        jornada do seu bebê.
      </p>

      {/* Settings List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        {settings.map((setting, index) => {
          const Icon = setting.icon;
          return (
            <div
              key={setting.id}
              className="flex items-center gap-4 p-4"
              style={{
                borderBottom:
                  index < settings.length - 1
                    ? "1px solid var(--bb-color-border)"
                    : "none",
              }}
            >
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: "var(--bb-color-bg)",
                  color: setting.enabled
                    ? "var(--bb-color-accent)"
                    : "var(--bb-color-ink-muted)",
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
              <button
                type="button"
                onClick={() => toggleSetting(setting.id)}
                className="relative w-12 h-7 rounded-full transition-colors"
                style={{
                  backgroundColor: setting.enabled
                    ? "var(--bb-color-accent)"
                    : "var(--bb-color-border)",
                }}
              >
                <span
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
                  style={{
                    left: setting.enabled ? "calc(100% - 24px)" : "4px",
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Push Notifications Info */}
      <div
        className="mt-6 p-4 rounded-2xl"
        style={{
          backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.03))",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          💡 Para receber notificações push, certifique-se de que as
          notificações estão habilitadas nas configurações do seu dispositivo.
        </p>
      </div>
    </div>
  );
};
