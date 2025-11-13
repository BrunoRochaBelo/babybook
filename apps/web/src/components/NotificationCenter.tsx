import { Bell, Calendar, Syringe, Heart, Gift, CheckCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Notification {
  id: string;
  type: "vaccine" | "milestone" | "memory" | "celebration" | "general";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

const notificationIcons = {
  vaccine: Syringe,
  milestone: Heart,
  memory: Calendar,
  celebration: Gift,
  general: Bell,
};

const notificationColors = {
  vaccine: "text-red-500 bg-red-50 dark:bg-red-950/20",
  milestone: "text-primary bg-primary/10",
  memory: "text-accent bg-accent/10",
  celebration: "text-secondary-foreground bg-secondary",
  general: "text-muted-foreground bg-muted",
};

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.action) {
      notification.action.onClick();
      setOpen(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        className="relative rounded-full h-10 w-10 hover:bg-muted flex items-center justify-center text-foreground"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
          >
            <span className="text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </motion.div>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div className="fixed right-4 top-16 w-80 max-h-96 bg-card rounded-3xl border border-border shadow-2xl overflow-hidden z-40">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-serif font-semibold">
                Notificações
              </h2>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-3 py-1 text-xs hover:bg-muted rounded-full flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} ${unreadCount === 1 ? "novidade para você" : "novidades para você"}`
                : "Tudo em dia"}
            </p>
          </div>

          <div className="overflow-y-auto max-h-64">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Sem notificações no momento
                </p>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];

                return (
                  <motion.button
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`w-full p-4 border-b border-border last:border-b-0 text-left hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {notification.time}
                          </span>
                          {notification.action && (
                            <button className="text-xs text-primary hover:underline">
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
