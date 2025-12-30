/**
 * Notificações Page - B2C
 *
 * Central de notificações com histórico e configurações.
 * Comportamento alinhado com o Partner Portal (B2B):
 * - Skeleton loading
 * - Marcar como lida (sem delete)
 * - Dica sobre retenção
 * - Estado vazio animado
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Bell,
  Calendar,
  Sparkles,
  Users,
  Heart,
  Camera,
  Gift,
  Check,
  CheckCheck,
  Loader2,
  Settings,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type NotificationType } from "@/contexts/NotificationsContext";
import { B2CNotificationsSkeleton } from "@/components/skeletons/B2CNotificationsSkeleton";

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  milestone: Sparkles,
  health: Calendar,
  guestbook: Users,
  memory: Heart,
  photo: Camera,
  gift: Gift,
  system: Bell,
  redemption: Gift,
  credits: CreditCard,
};

export const NotificacoesPage = () => {
  const [activeTab, setActiveTab] = useState<"all" | "settings">("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications();

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
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
      id: "memories",
      title: "Memórias",
      description: "Quando momentos são aprovados ou compartilhados",
      icon: Heart,
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

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    markAllAsRead();
    setIsMarkingAll(false);
  };

  // Mostra skeleton durante o carregamento inicial
  if (isLoading) {
    return <B2CNotificationsSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/jornada"
          className="p-2 rounded-xl hover:bg-[var(--bb-color-bg)] transition-colors"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1
            className="text-2xl font-serif font-bold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            Notificações
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
              : "Tudo em dia por aqui."}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
            activeTab === "all"
              ? "bg-[var(--bb-color-surface)] shadow-sm"
              : "hover:bg-[var(--bb-color-surface)]/50"
          )}
          style={{
            color:
              activeTab === "all"
                ? "var(--bb-color-ink)"
                : "var(--bb-color-ink-muted)",
          }}
        >
          <Bell className="w-4 h-4" />
          Histórico
          {unreadCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "var(--bb-color-accent)" }}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
            activeTab === "settings"
              ? "bg-[var(--bb-color-surface)] shadow-sm"
              : "hover:bg-[var(--bb-color-surface)]/50"
          )}
          style={{
            color:
              activeTab === "settings"
                ? "var(--bb-color-ink)"
                : "var(--bb-color-ink-muted)",
          }}
        >
          <Settings className="w-4 h-4" />
          Preferências
        </button>
      </div>

      {activeTab === "all" ? (
        <>
          {/* Action bar */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: "var(--bb-color-accent)" }}
              >
                {isMarkingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Marcar todas como lidas
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                {/* Animated illustration */}
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--bb-color-accent-light, rgba(0,0,0,0.05)), var(--bb-color-accent-light, rgba(0,0,0,0.1)))",
                    }}
                  />
                  <div
                    className="absolute inset-2 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--bb-color-surface)" }}
                  >
                    <Bell
                      className="w-8 h-8"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    />
                  </div>
                  <div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "var(--bb-color-accent)" }}
                  />
                  <div
                    className="absolute top-1 -left-1 w-2 h-2 rounded-full animate-bounce"
                    style={{
                      backgroundColor: "var(--bb-color-accent)",
                      animationDelay: "0.2s",
                    }}
                  />
                </div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  Tudo em dia! 🎉
                </h3>
                <p
                  className="text-sm max-w-xs mx-auto"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  Você não tem notificações no momento. Quando houver novidades,
                  elas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--bb-color-border)]">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type];

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 transition-colors",
                        notification.unread
                          ? "bg-[var(--bb-color-accent)]/5 hover:bg-[var(--bb-color-accent)]/10"
                          : "hover:bg-[var(--bb-color-bg)]",
                        notification.link && "cursor-pointer"
                      )}
                      onClick={() => {
                        if (notification.unread) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          notification.unread
                            ? "bg-[var(--bb-color-accent)]/10 text-[var(--bb-color-accent)]"
                            : "bg-[var(--bb-color-bg)] text-[var(--bb-color-ink-muted)]"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "text-sm",
                                notification.unread
                                  ? "font-semibold text-[var(--bb-color-ink)]"
                                  : "font-medium text-[var(--bb-color-ink-muted)]"
                              )}
                            >
                              {notification.title}
                            </p>
                            {notification.unread && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: "var(--bb-color-accent)",
                                }}
                              />
                            )}
                          </div>
                          <span
                            className="text-xs flex-shrink-0"
                            style={{ color: "var(--bb-color-ink-muted)" }}
                          >
                            {notification.time}
                          </span>
                        </div>
                        <p
                          className="text-sm mt-0.5"
                          style={{ color: "var(--bb-color-ink-muted)" }}
                        >
                          {notification.description}
                        </p>
                      </div>

                      {/* Mark as read */}
                      {notification.unread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1.5 rounded-lg transition-colors flex-shrink-0 hover:bg-[var(--bb-color-bg)]"
                          style={{ color: "var(--bb-color-ink-muted)" }}
                          title="Marcar como lida"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info/Tip */}
          <div
            className="mt-6 p-4 rounded-2xl"
            style={{
              backgroundColor: "var(--bb-color-accent)/5",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            <p
              className="text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              <strong>Dica:</strong> As notificações são mantidas por 30 dias.
              Notificações mais antigas são removidas automaticamente.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Preferences */}
          <p
            className="mb-4 text-sm"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            Configure quais notificações você deseja receber.
          </p>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            {preferences.map((pref, index) => {
              const Icon = pref.icon;
              return (
                <div
                  key={pref.id}
                  className="flex items-center gap-4 p-4"
                  style={{
                    borderBottom:
                      index < preferences.length - 1
                        ? "1px solid var(--bb-color-border)"
                        : "none",
                  }}
                >
                  <div
                    className="p-2.5 rounded-xl"
                    style={{
                      backgroundColor: "var(--bb-color-bg)",
                      color: pref.enabled
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
                      {pref.title}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      {pref.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference(pref.id)}
                    className="relative w-12 h-7 rounded-full transition-colors"
                    style={{
                      backgroundColor: pref.enabled
                        ? "var(--bb-color-accent)"
                        : "var(--bb-color-border)",
                    }}
                  >
                    <span
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
                      style={{
                        left: pref.enabled ? "calc(100% - 24px)" : "4px",
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Push info */}
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
            >
              💡 Para receber notificações push, certifique-se de que as
              notificações estão habilitadas nas configurações do seu
              dispositivo.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
