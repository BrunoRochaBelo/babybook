/**
 * useOnlineStatus - Hook para detectar status de conexão
 *
 * Detecta quando o usuário está online/offline e fornece:
 * - Estado atual de conexão
 * - Tempo desde que ficou offline
 * - Callback quando reconectar
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface OnlineStatusOptions {
  /** Callback executado quando reconectar */
  onReconnect?: () => void;
  /** Intervalo para verificar conexão real via fetch (ms), 0 = desabilitado */
  pingInterval?: number;
  /** URL para verificar conexão (deve retornar 200) */
  pingUrl?: string;
}

export interface OnlineStatus {
  /** Se está online */
  isOnline: boolean;
  /** Se estava offline e acabou de reconectar */
  wasOffline: boolean;
  /** Timestamp de quando ficou offline (null se online) */
  offlineSince: number | null;
  /** Tempo em segundos desde que ficou offline */
  offlineDuration: number;
}

export function useOnlineStatus(options: OnlineStatusOptions = {}): OnlineStatus {
  const { onReconnect, pingInterval = 0, pingUrl } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState<number | null>(
    navigator.onLine ? null : Date.now()
  );
  const [offlineDuration, setOfflineDuration] = useState(0);

  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  // Atualizar duração offline a cada segundo
  useEffect(() => {
    if (!offlineSince) {
      setOfflineDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setOfflineDuration(Math.floor((Date.now() - offlineSince) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [offlineSince]);

  // Handlers para eventos online/offline
  const handleOnline = useCallback(() => {
    const wasOff = !isOnline;
    setIsOnline(true);
    setOfflineSince(null);
    
    if (wasOff) {
      setWasOffline(true);
      onReconnectRef.current?.();
      
      // Limpar flag wasOffline após 5 segundos
      setTimeout(() => setWasOffline(false), 5000);
    }
  }, [isOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setOfflineSince(Date.now());
    setWasOffline(false);
  }, []);

  // Listeners para eventos do browser
  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Ping periódico para verificar conexão real (opcional)
  useEffect(() => {
    if (!pingInterval || !pingUrl) return;

    const checkConnection = async () => {
      try {
        const response = await fetch(pingUrl, { 
          method: "HEAD",
          cache: "no-store",
          mode: "no-cors"
        });
        if (response.ok || response.type === "opaque") {
          handleOnline();
        }
      } catch {
        handleOffline();
      }
    };

    const interval = setInterval(checkConnection, pingInterval);
    return () => clearInterval(interval);
  }, [pingInterval, pingUrl, handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    offlineSince,
    offlineDuration,
  };
}

/**
 * Hook para prevenir navegação/fechamento quando há dados não salvos
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean, message?: string) {
  const defaultMessage = "Você tem alterações não salvas. Tem certeza que deseja sair?";
  
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message ?? defaultMessage;
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, message]);
}

export default useOnlineStatus;
