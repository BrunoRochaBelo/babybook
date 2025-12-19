/**
 * OfflineBanner - Componente de banner para conexão offline
 *
 * Exibe um banner persistente quando o usuário perde a conexão,
 * com tempo offline e indicador de reconexão.
 */

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function OfflineBanner() {
  const queryClient = useQueryClient();

  const { isOnline, wasOffline, offlineDuration } = useOnlineStatus({
    onReconnect: () => {
      // Invalidar todas as queries quando reconectar
      queryClient.invalidateQueries();
    },
  });

  // Não mostrar nada se está online e não acabou de reconectar
  if (isOnline && !wasOffline) {
    return null;
  }

  // Banner de "reconectado" (aparece brevemente após reconectar)
  if (isOnline && wasOffline) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg">
          <Wifi className="w-5 h-5" />
          <span className="font-medium">Conexão restaurada!</span>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm opacity-90">Atualizando dados...</span>
        </div>
      </div>
    );
  }

  // Banner de "offline" (persistente enquanto sem conexão)
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-600 text-white rounded-xl shadow-lg">
        <WifiOff className="w-5 h-5" />
        <div>
          <p className="font-medium">Você está offline</p>
          <p className="text-sm opacity-90">
            Sem conexão há {formatDuration(offlineDuration)}. 
            Suas alterações serão salvas quando reconectar.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OfflineBanner;
