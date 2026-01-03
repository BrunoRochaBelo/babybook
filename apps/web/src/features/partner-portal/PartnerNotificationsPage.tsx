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
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PartnerPageHeaderAction,
  usePartnerPageHeader,
} from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";
import { PartnerErrorState } from "@/layouts/partnerStates";



import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NotificationsSkeleton } from "./components/NotificationsSkeleton";
import { getNotifications, type NotificationType, type Notification } from "./api";

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
  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["partner", "notifications"],
    queryFn: getNotifications,
    staleTime: 60 * 1000,
  });

  const queryClient = useQueryClient();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAsRead = useCallback(
    (id: string) => {
      queryClient.setQueryData(
        ["partner", "notifications"],
        (old: Notification[] | undefined) =>
          old?.map((n) => (n.id === id ? { ...n, unread: false } : n)) ?? [],
      );
    },
    [queryClient],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    setIsMarkingAll(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    queryClient.setQueryData(
      ["partner", "notifications"],
      (old: Notification[] | undefined) =>
        old?.map((n) => ({ ...n, unread: false })) ?? [],
    );
    setIsMarkingAll(false);
  }, [queryClient]);

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

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  if (isError) {
    return (
      <PartnerErrorState
        title="Não foi possível carregar as notificações"
        onRetry={refetch}
        skeleton={<NotificationsSkeleton />}
      />
    );
  }

  return (
    <PartnerPage size="narrow">
      {/* Header handled by PartnerLayout now, but we add a body title for consistency if needed, 
          though notifications page usually has the title in the header config. 
          Let's keep it clean as per other pages which removed inner titles if header has it.
          Wait, other pages ADDED inner H1s. Let's add an H1 here too for consistency. 
      */}
      <div className="mb-8">
        <div className="hidden md:block mb-4">
           <PartnerBackButton to="/partner" label="Voltar" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notificações
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
              {unreadCount > 0
                ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                : "Todas as notificações lidas"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium disabled:opacity-50 transition-colors bg-pink-50 dark:bg-pink-900/20 rounded-xl"
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

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            {/* Ilustração animada */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-50 dark:border-gray-700">
                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              {/* Estrelinhas decorativas */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <div className="absolute top-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <div className="absolute -bottom-1 right-2 w-2.5 h-2.5 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Tudo em dia! 🎉
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              Você não tem notificações no momento. Quando houver novidades sobre créditos, entregas ou vouchers, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];

              const content = (
                <div
                  className={cn(
                    "flex items-start gap-5 p-6 transition-all duration-200",
                    notification.unread
                      ? "bg-pink-50/40 dark:bg-pink-900/10 hover:bg-pink-50/80 dark:hover:bg-pink-900/20"
                      : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30",
                    notification.link && "group cursor-pointer",
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105",
                      colorClass,
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <p
                              className={cn(
                                "text-base",
                                notification.unread
                                  ? "font-bold text-gray-900 dark:text-white"
                                  : "font-semibold text-gray-700 dark:text-gray-300",
                              )}
                            >
                              {notification.title}
                            </p>
                            {notification.unread && (
                              <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse" />
                            )}
                         </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {notification.description}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex-shrink-0 whitespace-nowrap bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-lg">
                        {notification.time}
                      </span>
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {notification.unread && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="p-2 -mr-2 text-gray-400 dark:text-gray-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-all flex-shrink-0"
                      title="Marcar como lida"
                      aria-label="Marcar como lida"
                    >
                      <Check className="w-5 h-5" />
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
      <div className="mt-8 flex justify-center">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-800/50">
            <Info className="w-3.5 h-3.5" />
            <span>Notificações antigas são removidas automaticamente após 30 dias.</span>
         </div>
      </div>
    </PartnerPage>
  );
}

export default PartnerNotificationsPage;
