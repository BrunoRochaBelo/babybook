/**
 * Notifications API
 *
 * Cliente API para o sistema de notificações B2C.
 * Inclui fallback para dados mock quando a API não está disponível.
 */

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";

const API_BASE = "/me/notifications";

export type NotificationType =
  | "milestone"
  | "health"
  | "guestbook"
  | "memory"
  | "photo"
  | "gift"
  | "system"
  | "redemption"
  | "credits";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string | null;
  link: string | null;
  unread: boolean;
  time: string;
  created_at: string;
}

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationPreferences {
  notify_milestones: boolean;
  notify_health: boolean;
  notify_guestbook: boolean;
  notify_memories: boolean;
  notify_photos: boolean;
  notify_gifts: boolean;
  notify_updates: boolean;
  notify_redemptions: boolean;
  notify_credits: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
}

// Mock data para desenvolvimento local
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "Momento aprovado",
    description: "Primeiro sorriso agora está visível para a família.",
    time: "Há 2 horas",
    unread: true,
    type: "memory",
    link: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "notif-2",
    title: "Convite aceito",
    description: "Helena entrou como Madrinha no Livro de Visitas.",
    time: "Ontem",
    unread: true,
    type: "guestbook",
    link: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "notif-3",
    title: "Novo marco alcançado",
    description: "Seu bebê completou 6 meses! Que tal registrar esse momento?",
    time: "2 dias atrás",
    unread: false,
    type: "milestone",
    link: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "notif-4",
    title: "Consulta agendada",
    description: "Lembrete: Consulta de rotina amanhã às 10h.",
    time: "3 dias atrás",
    unread: false,
    type: "health",
    link: null,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "notif-5",
    title: "Nova foto adicionada",
    description: "Uma nova foto foi adicionada ao álbum do bebê.",
    time: "Semana passada",
    unread: false,
    type: "photo",
    link: null,
    created_at: new Date(Date.now() - 604800000).toISOString(),
  },
];

const MOCK_PREFERENCES: NotificationPreferences = {
  notify_milestones: true,
  notify_health: true,
  notify_guestbook: true,
  notify_memories: true,
  notify_photos: true,
  notify_gifts: true,
  notify_updates: false,
  notify_redemptions: true,
  notify_credits: true,
  push_enabled: true,
  email_enabled: false,
};

// Estado local para mock (permite persistência durante a sessão)
let mockNotificationsState = [...MOCK_NOTIFICATIONS];
let mockPreferencesState = { ...MOCK_PREFERENCES };

/**
 * Emails de usuários de teste que podem usar mock
 */
const TEST_USER_EMAILS = [
  "dev@babybook.dev",  // B2C test user
  "pro@babybook.dev",  // B2B test user
];

/**
 * Verifica se o usuário atual é um usuário de teste
 * Mocks só funcionam para esses usuários
 */
function isTestUser(): boolean {
  const user = useAuthStore.getState().user;
  
  if (!user?.email) return false;
  return TEST_USER_EMAILS.includes(user.email.toLowerCase());
}

/**
 * Permite fallback mock apenas para usuários de teste em DEV
 */
function shouldUseMockFallback(): boolean {
  return import.meta.env.DEV && isTestUser();
}

/**
 * Busca lista de notificações
 * Sempre tenta API real primeiro. Em DEV, usa mock como fallback se API falhar.
 */
export async function fetchNotifications(): Promise<NotificationsResponse> {
  // Em DEV para usuários de teste, priorizamos o mock para garantir que ele tenha dados
  if (shouldUseMockFallback()) {
    console.info("[Notifications] Usuário de teste em DEV, usando mock data");
    const unreadCount = mockNotificationsState.filter((n) => n.unread).length;
    return {
      items: mockNotificationsState,
      total: mockNotificationsState.length,
      unread_count: unreadCount,
    };
  }

  try {
    const response = await apiClient.get<NotificationsResponse>(API_BASE);
    return response;
  } catch (error) {
    console.error("[Notifications] API error:", error);
    throw error;
  }
}

/**
 * Busca contagem de não lidas (para badge)
 */
export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  if (shouldUseMockFallback()) {
    const count = mockNotificationsState.filter((n) => n.unread).length;
    return { unread_count: count };
  }

  try {
    const response = await apiClient.get<UnreadCountResponse>(
      `${API_BASE}/unread-count`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Marca uma notificação como lida
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    const response = await apiClient.patch<{ success: boolean }>(
      `${API_BASE}/${notificationId}/read`,
      {}
    );
    return response;
  } catch (error) {
    if (shouldUseMockFallback()) {
      console.warn("[Notifications] mark-read API falhou, usando mock");
      mockNotificationsState = mockNotificationsState.map((n) =>
        n.id === notificationId ? { ...n, unread: false } : n
      );
      return { success: true };
    }
    throw error;
  }
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  marked: number;
}> {
  try {
    const response = await apiClient.patch<{ success: boolean; marked: number }>(
      `${API_BASE}/read-all`,
      {}
    );
    return response;
  } catch (error) {
    if (shouldUseMockFallback()) {
      console.warn("[Notifications] mark-all-read API falhou, usando mock");
      const count = mockNotificationsState.filter((n) => n.unread).length;
      mockNotificationsState = mockNotificationsState.map((n) => ({
        ...n,
        unread: false,
      }));
      return { success: true, marked: count };
    }
    throw error;
  }
}

/**
 * Busca preferências de notificação
 */
export async function fetchPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await apiClient.get<NotificationPreferences>(
      `${API_BASE}/preferences`
    );
    return response;
  } catch (error) {
    if (shouldUseMockFallback()) {
      return mockPreferencesState;
    }
    throw error;
  }
}

/**
 * Atualiza preferências de notificação
 */
export async function updatePreferences(
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const response = await apiClient.patch<NotificationPreferences>(
      `${API_BASE}/preferences`,
      updates
    );
    return response;
  } catch (error) {
    if (shouldUseMockFallback()) {
      mockPreferencesState = { ...mockPreferencesState, ...updates };
      return mockPreferencesState;
    }
    throw error;
  }
}

/**
 * Reseta o estado mock (útil para testes)
 */
export function resetMockState(): void {
  mockNotificationsState = [...MOCK_NOTIFICATIONS];
  mockPreferencesState = { ...MOCK_PREFERENCES };
}
