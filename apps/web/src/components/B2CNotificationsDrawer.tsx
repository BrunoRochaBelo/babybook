/**
 * B2C Notifications Drawer
 *
 * Drawer lateral para notificações no app B2C.
 * Comportamento alinhado com o Partner Portal (B2B):
 * - Ícones por tipo de notificação
 * - Marcar como lida individualmente
 * - Marcar todas como lidas
 * - Sem opção de excluir
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Sparkles,
  Calendar,
  Users,
  Heart,
  Camera,
  Gift,
  Check,
  CheckCheck,
  Loader2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";

import { NotificationType } from "@/features/notifications/api";

export interface B2CNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  link?: string;
  type: NotificationType;
}

interface B2CNotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: B2CNotification[];
  onNotificationClick?: (notification: B2CNotification) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
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
  credits: Settings,
};

export function B2CNotificationsDrawer({
  open,
  onOpenChange,
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
}: B2CNotificationsDrawerProps) {
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    onMarkAllAsRead();
    setIsMarkingAll(false);
  };

  const handleNotificationClick = (notification: B2CNotification) => {
    if (notification.unread) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
    if (notification.link) {
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="h-full w-full sm:max-w-sm"
        style={{ backgroundColor: "var(--bb-color-surface)" }}
      >
        <DrawerHeader
          className="px-6 py-4"
          style={{
            borderBottom: "1px solid var(--bb-color-border)",
            backgroundColor: "var(--bb-color-surface)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DrawerTitle className="text-lg font-bold text-[var(--bb-color-ink)] font-serif">
                Notificações
              </DrawerTitle>
              {unreadCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: "var(--bb-color-accent)",
                    color: "white",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody
          className="p-0 overflow-y-auto"
          style={{ backgroundColor: "var(--bb-color-surface)" }}
        >
          {/* Sub-header: Recentes + Marcar todas */}
          {notifications.length > 0 && (
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderBottom: "1px solid var(--bb-color-border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                Recentes
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{ color: "var(--bb-color-accent)" }}
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  Marcar todas como lidas
                </button>
              )}
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              {/* Ilustração animada */}
              <div className="relative w-20 h-20 mb-5">
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
                {/* Decorative dots */}
                <div
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ backgroundColor: "var(--bb-color-accent)", animationDelay: "0s" }}
                />
                <div
                  className="absolute top-1 -left-1 w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: "var(--bb-color-accent)", animationDelay: "0.2s" }}
                />
              </div>
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--bb-color-ink)" }}
              >
                Tudo em dia! 🎉
              </h3>
              <p
                className="text-sm max-w-[200px]"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                Você não tem notificações no momento. Novidades aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--bb-color-border)]">
              {notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type];

                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-4 p-4 transition-colors",
                      notification.unread
                        ? "bg-[var(--bb-color-accent)]/5 hover:bg-[var(--bb-color-accent)]/10"
                        : "hover:bg-[var(--bb-color-bg)]"
                    )}
                    onClick={() => handleNotificationClick(notification)}
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
                              style={{ backgroundColor: "var(--bb-color-accent)" }}
                            />
                          )}
                        </div>
                        <span
                          className="text-[10px] flex-shrink-0"
                          style={{ color: "var(--bb-color-ink-muted)" }}
                        >
                          {notification.time}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--bb-color-ink-muted)" }}
                      >
                        {notification.description}
                      </p>
                    </div>

                    {/* Mark as read button */}
                    {notification.unread && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        className="p-1.5 rounded-lg transition-colors flex-shrink-0 hover:bg-[var(--bb-color-bg)]"
                        style={{ color: "var(--bb-color-ink-muted)" }}
                        title="Marcar como lida"
                        aria-label="Marcar como lida"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );

                if (notification.link) {
                  return (
                    <Link
                      key={notification.id}
                      to={notification.link}
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      {content}
                    </Link>
                  );
                }

                return <div key={notification.id}>{content}</div>;
              })}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter
          className="p-4"
          style={{
            borderTop: "1px solid var(--bb-color-border)",
            backgroundColor: "var(--bb-color-bg)",
          }}
        >
          <Link
            to="/jornada/notificacoes"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              color: "var(--bb-color-ink)",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            <Settings className="w-4 h-4" />
            Gerenciar notificações
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
