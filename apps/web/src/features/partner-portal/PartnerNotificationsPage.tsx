/**
 * Partner Notifications Page
 *
 * Central de notificações do parceiro com histórico completo.
 * Lista todas as notificações com opções de marcar como lida.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  Gift,
  Loader2,
  Package,
  Ticket,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipo de notificação
type NotificationType = "voucher_redeemed" | "credits_added" | "delivery_ready" | "system";

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
    description: "Cliente Maria resgatou o voucher #ABC123 e criou sua conta Baby Book.",
    time: "Há 2 horas",
    unread: true,
    link: "/partner/deliveries",
  },
  {
    id: "2",
    type: "credits_added",
    title: "Créditos adicionados",
    description: "5 créditos foram adicionados à sua conta após pagamento confirmado.",
    time: "Ontem às 14:30",
    unread: true,
  },
  {
    id: "3",
    type: "delivery_ready",
    title: "Entrega pronta",
    description: "A entrega 'Ensaio Newborn - João' está pronta para gerar voucher.",
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
    description: "Sua conta foi aprovada. Comece comprando créditos para criar suas primeiras entregas.",
    time: "3 dias atrás",
    unread: false,
    link: "/partner/credits",
  },
  {
    id: "6",
    type: "credits_added",
    title: "Créditos adicionados",
    description: "10 créditos foram adicionados à sua conta (pacote inicial de boas-vindas).",
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
  voucher_redeemed: "bg-purple-100 text-purple-600",
  credits_added: "bg-green-100 text-green-600",
  delivery_ready: "bg-blue-100 text-blue-600",
  system: "bg-gray-100 text-gray-600",
};

export function PartnerNotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setIsMarkingAll(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Notificações
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0
                ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                : "Todas as notificações lidas"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-pink-600 hover:text-pink-700 font-medium disabled:opacity-50"
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

        {/* Notifications List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma notificação ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];

                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-4 p-4 transition-colors",
                      notification.unread
                        ? "bg-pink-50/50 hover:bg-pink-50"
                        : "hover:bg-gray-50",
                      notification.link && "cursor-pointer"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        colorClass
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
                                ? "font-semibold text-gray-900"
                                : "font-medium text-gray-700"
                            )}
                          >
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <span className="w-2 h-2 bg-pink-500 rounded-full" />
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
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
                        className="p-1.5 text-gray-400 hover:text-pink-500 transition-colors flex-shrink-0"
                        title="Marcar como lida"
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
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>Dica:</strong> As notificações são mantidas por 30 dias. 
            Notificações mais antigas são removidas automaticamente.
          </p>
        </div>
      </main>
    </div>
  );
}

export default PartnerNotificationsPage;
