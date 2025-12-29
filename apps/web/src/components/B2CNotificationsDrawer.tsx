/**
 * B2C Notifications Drawer
 *
 * Drawer lateral para exibir notificações no app B2C.
 * Inspirado no drawer de notificações do Partner Portal.
 * Suporta dark mode através de variáveis CSS.
 */

import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";

export interface B2CNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
  link?: string;
}

interface B2CNotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: B2CNotification[];
  onNotificationClick?: (notification: B2CNotification) => void;
  onMarkAllAsRead?: () => void;
}

export function B2CNotificationsDrawer({
  open,
  onOpenChange,
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
}: B2CNotificationsDrawerProps) {
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotificationClick = (notification: B2CNotification) => {
    onNotificationClick?.(notification);
    onOpenChange(false);
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
            <DrawerTitle className="text-lg font-bold text-[var(--bb-color-ink)] font-serif">
              Notificações
            </DrawerTitle>
            {unreadCount > 0 && (
              <div className="px-2 py-0.5 rounded-full bg-[var(--bb-color-accent)]/10 text-[var(--bb-color-accent)] text-xs font-bold">
                {unreadCount} nova(s)
              </div>
            )}
          </div>
        </DrawerHeader>

        <DrawerBody
          className="p-0"
          style={{ backgroundColor: "var(--bb-color-surface)" }}
        >
          {/* Action Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--bb-color-border)]/60">
            <p className="text-sm text-[var(--bb-color-ink-muted)] font-medium">Recentes</p>
            <button
              onClick={onMarkAllAsRead}
              className="text-xs font-semibold text-[var(--bb-color-accent)] hover:text-[var(--bb-color-accent)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={unreadCount === 0}
            >
              Marcar todas como lidas
            </button>
          </div>

          <div className="divide-y divide-[var(--bb-color-border)]/60">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "relative px-6 py-5 hover:bg-[var(--bb-color-bg)] cursor-pointer transition-colors group",
                  notification.unread ? "bg-[var(--bb-color-surface)]" : "bg-transparent opacity-80"
                )}
              >
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105",
                      notification.unread
                        ? "bg-[var(--bb-color-accent)]/10 text-[var(--bb-color-accent)] ring-2 ring-[var(--bb-color-accent)]/20"
                        : "bg-[var(--bb-color-muted)]/20 text-[var(--bb-color-ink-muted)]"
                    )}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p
                        className={cn(
                          "text-sm font-semibold truncate pr-2",
                          notification.unread ? "text-[var(--bb-color-ink)]" : "text-[var(--bb-color-ink-muted)]"
                        )}
                      >
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-[var(--bb-color-ink-muted)] whitespace-nowrap font-medium">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--bb-color-ink-muted)] line-clamp-2 leading-relaxed">
                      {notification.description}
                    </p>
                  </div>
                  {notification.unread && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <span className="block w-2 h-2 bg-[var(--bb-color-accent)] rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 bg-[var(--bb-color-muted)]/20 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-[var(--bb-color-ink-muted)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--bb-color-ink)] mb-1">
                  Tudo limpo por aqui
                </h3>
                <p className="text-xs text-[var(--bb-color-ink-muted)] max-w-[200px]">
                  Você não tem novas notificações no momento.
                </p>
              </div>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter
          className="p-6"
          style={{
            borderTop: "1px solid var(--bb-color-border)",
            backgroundColor: "var(--bb-color-bg)",
          }}
        >
          <Link
            to="/notificacoes"
            onClick={() => onOpenChange(false)}
            className="w-full block text-center text-sm text-[var(--bb-color-accent)] hover:text-[var(--bb-color-accent)]/80 font-medium"
          >
            Ver todas as notificações
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
