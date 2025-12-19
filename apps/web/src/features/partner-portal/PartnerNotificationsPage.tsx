/**
 * Partner Notifications Page
 *
 * Central de notificações do parceiro com histórico completo.
 * Lista todas as notificações com opções de marcar como lida.
 */

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  Gift,
  Loader2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PartnerPageHeaderAction,
  usePartnerPageHeader,
} from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";

// Tipo de notificação
type NotificationType =
  | "voucher_redeemed"
  | "credits_added"
  | "delivery_ready"
  | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  link?: string;
}

// Mock notifications - TODO: Replace with real API
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "voucher_redeemed",
    title: "Voucher resgatado",
    description:
      "Cliente Maria resgatou o voucher #ABC123 e criou sua conta Baby Book.",
    time: "Há 2 horas",
    unread: true,
    link: "/partner/deliveries",
  },
  {
    id: "2",
    type: "credits_added",
    title: "Créditos adicionados",
    description:
      "5 créditos foram adicionados à sua conta após pagamento confirmado.",
    time: "Ontem às 14:30",
    unread: true,
  },
  {
    id: "3",
    type: "delivery_ready",
    title: "Entrega pronta",
    description:
      "A entrega 'Ensaio Newborn - João' está pronta para gerar voucher.",
    time: "Ontem às 10:15",
    unread: false,
    link: "/partner/deliveries",
  },
  {
    id: "4",
    type: "voucher_redeemed",
    title: "Voucher resgatado",
    description: "Cliente Ana Paula resgatou o voucher #XYZ789.",
    time: "2 dias atrás",
    unread: false,
  },
  {
    id: "5",
    type: "system",
    title: "Bem-vindo ao Baby Book PRO!",
    description:
      "Sua conta foi aprovada. Comece comprando créditos para criar suas primeiras entregas.",
    time: "3 dias atrás",
    unread: false,
    link: "/partner/credits",
  },
  {
    id: "6",
    type: "credits_added",
    title: "Créditos adicionados",
    description:
      "10 créditos foram adicionados à sua conta (pacote inicial de boas-vindas).",
    time: "3 dias atrás",
    unread: false,
  },
];

const notificationIcons: Record<NotificationType, typeof Bell> = {
  voucher_redeemed: Gift,
  credits_added: CreditCard,
  delivery_ready: Package,
  system: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  voucher_redeemed:
    "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
  credits_added:
    "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
  delivery_ready:
    "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
  system: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
};

export function PartnerNotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    setIsMarkingAll(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setIsMarkingAll(false);
  }, []);

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: "Notificações",
        backTo: "/partner",
        backLabel: "Voltar",
        actions:
          unreadCount > 0 ? (
            <PartnerPageHeaderAction
              label="Marcar todas como lidas"
              tone="neutral"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              icon={
                isMarkingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )
              }
            />
          ) : null,
      }),
      [handleMarkAllAsRead, isMarkingAll, unreadCount],
    ),
  );

  return (
    <PartnerPage size="narrow">
      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <PartnerBackButton label="Voltar" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Notificações
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {unreadCount > 0
                ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                : "Todas as notificações lidas"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium disabled:opacity-50 transition-colors"
            >
              {isMarkingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* Mobile summary */}
      <div className="md:hidden mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {unreadCount > 0
            ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
            : "Tudo em dia por aqui."}
        </p>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            {/* Ilustração animada */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              {/* Estrelinhas decorativas */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <div className="absolute top-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <div className="absolute -bottom-1 right-2 w-2.5 h-2.5 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tudo em dia! 🎉
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Você não tem notificações no momento. Quando houver novidades, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];

              const content = (
                <div
                  className={cn(
                    "flex items-start gap-4 p-4 transition-colors",
                    notification.unread
                      ? "bg-pink-50/50 dark:bg-pink-900/20 hover:bg-pink-50 dark:hover:bg-pink-900/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                    notification.link && "cursor-pointer",
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      colorClass,
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
                              ? "font-semibold text-gray-900 dark:text-white"
                              : "font-medium text-gray-700 dark:text-gray-300",
                          )}
                        >
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <span className="w-2 h-2 bg-pink-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {notification.description}
                    </p>
                  </div>

                  {/* Mark as read button */}
                  {notification.unread && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-pink-500 transition-colors flex-shrink-0"
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
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    {content}
                  </Link>
                );
              }

              return <div key={notification.id}>{content}</div>;
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Dica:</strong> As notificações são mantidas por 30 dias.
          Notificações mais antigas são removidas automaticamente.
        </p>
      </div>
    </PartnerPage>
  );
}

export default PartnerNotificationsPage;
