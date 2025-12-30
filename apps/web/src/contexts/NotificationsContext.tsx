/**
 * Notifications Context
 *
 * Contexto compartilhado para gerenciar notificações entre drawer e página.
 * Usa react-query para fetch da API com fallback para mock em dev.
 */

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationType,
} from "@/features/notifications/api";

export type { NotificationType };

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: NotificationType;
  link?: string;
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refetch: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const queryClient = useQueryClient();

  // Query para buscar notificações
  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Atualiza a cada minuto
  });

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Transforma resposta da API para formato do contexto
  const notifications: NotificationItem[] = (
    notificationsData?.items ?? []
  ).map((n: Notification) => ({
    id: n.id,
    title: n.title,
    description: n.description ?? "",
    time: n.time,
    unread: n.unread,
    type: n.type,
    link: n.link ?? undefined,
  }));

  const unreadCount = notificationsData?.unread_count ?? 0;

  const markAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isError,
        markAsRead,
        markAllAsRead,
        refetch: handleRefetch,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  }
  return context;
}
