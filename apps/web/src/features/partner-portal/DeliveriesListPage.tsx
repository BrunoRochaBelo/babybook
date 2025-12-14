/**
 * Deliveries List Page
 *
 * Lista todas as entregas do parceiro com filtros e busca.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Image,
  Loader2,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  Gift,
  ArrowLeft,
  Archive,
  ArchiveRestore,
  X,
} from "lucide-react";
import { listDeliveries, archiveDelivery } from "./api";
import type { Delivery, DeliveryStatus } from "./types";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const statusConfig: Record<
  DeliveryStatus,
  { icon: typeof Clock; className: string; label: string }
> = {
  draft: {
    icon: Clock,
    className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    label: "Rascunho",
  },
  pending_upload: {
    icon: Clock,
    className: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    label: "Aguardando upload",
  },
  processing: {
    icon: Loader2,
    className: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    label: "Processando",
  },
  ready: {
    icon: CheckCircle2,
    className: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    label: "Pronta",
  },
  delivered: {
    icon: Gift,
    className: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    label: "Entregue",
  },
  archived: {
    icon: Package,
    className: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    label: "Arquivada",
  },
};

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const cfg = statusConfig[status] || statusConfig.draft;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon
        className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`}
      />
      {cfg.label}
    </span>
  );
}

type FilterStatus = "all" | DeliveryStatus;

export function DeliveriesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  
  // Ler filtro da URL (ex: /partner/deliveries?status=ready)
  const searchParams = new URLSearchParams(window.location.search);
  const initialStatus = (searchParams.get("status") as FilterStatus) || "all";
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatus);

  // Sincronizar URL quando mudar o filtro
  const handleStatusChange = (newStatus: FilterStatus) => {
    setStatusFilter(newStatus);
    const url = new URL(window.location.href);
    if (newStatus === "all") {
      url.searchParams.delete("status");
    } else {
      url.searchParams.set("status", newStatus);
    }
    window.history.replaceState({}, "", url.toString());
  };

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ["partner", "deliveries", statusFilter, includeArchived],
    queryFn: () =>
      listDeliveries({
        status: statusFilter !== "all" ? statusFilter : undefined,
        include_archived: includeArchived,
        limit: 50,
      }),
  });

  // Mutation para arquivar
  const archiveMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      archiveDelivery(id, archive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "deliveries"] });
    },
  });

  const deliveries = data?.deliveries || [];

  // Client-side search filter
  const filteredDeliveries = deliveries.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.title?.toLowerCase().includes(term) ||
      d.client_name?.toLowerCase().includes(term) ||
      d.voucher_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Minhas Entregas
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {data?.total || 0} entregas no total
            </p>
          </div>
          <Link
            to="/partner/deliveries/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nova Entrega</span>
            <span className="sm:hidden">Nova</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, título ou código..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) =>
                handleStatusChange(e.target.value as FilterStatus)
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="pending_upload">Aguardando upload</option>
              <option value="ready">Pronta</option>
              <option value="delivered">Entregue</option>
            </select>
          </div>

          {/* Show Archived Toggle */}
          <button
            type="button"
            onClick={() => setIncludeArchived(!includeArchived)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${includeArchived 
                ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" 
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }
            `}
          >
            <Archive className="w-4 h-4" />
            <span>{includeArchived ? "Ocultar arquivadas" : "Mostrar arquivadas"}</span>
            {/* Toggle indicator */}
            <div className={`
              relative w-8 h-4 rounded-full transition-colors
              ${includeArchived ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-500"}
            `}>
              <div className={`
                absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform
                ${includeArchived ? "translate-x-4" : "translate-x-0.5"}
              `} />
            </div>
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== "all"
                ? "Nenhuma entrega encontrada"
                : "Nenhuma entrega ainda"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar seus filtros de busca"
                : "Crie sua primeira entrega para começar"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link
                to="/partner/deliveries/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar Primeira Entrega
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredDeliveries.map((delivery) => (
                <DeliveryRow
                  key={delivery.id}
                  delivery={delivery}
                  onArchive={(archive) =>
                    archiveMutation.mutate({ id: delivery.id, archive })
                  }
                  isArchiving={archiveMutation.isPending && archiveMutation.variables?.id === delivery.id}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// =============================================================================
// Delivery Row
// =============================================================================

interface DeliveryRowProps {
  delivery: Delivery;
  onArchive: (archive: boolean) => void;
  isArchiving: boolean;
}

function DeliveryRow({ delivery, onArchive, isArchiving }: DeliveryRowProps) {
  // Determina se está arquivada baseando-se no status ou campo archived_at
  // O backend retorna entregas arquivadas apenas quando include_archived=true
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Considera arquivada se status é "archived" ou se veio da lista com include_archived
  // TODO: Backend deve retornar campo is_archived quando disponível
  const isArchived = delivery.status === "archived";

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isArchived) {
      // Desarquivar sem confirmação
      onArchive(false);
    } else {
      // Mostrar confirmação antes de arquivar
      setShowConfirm(true);
    }
  };

  const handleConfirmArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
    onArchive(true);
  };

  const handleCancelArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <Link
      to={`/partner/deliveries/${delivery.id}`}
      className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isArchived ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <Image className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {delivery.title || delivery.client_name || "Sem título"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {delivery.client_name && delivery.title && (
              <span className="mr-2">{delivery.client_name}</span>
            )}
            <span>{delivery.assets_count} arquivos</span>
            <span className="mx-1">•</span>
            <span>{formatDate(delivery.created_at)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <StatusBadge status={delivery.status} />
        {delivery.voucher_code && (
          <span className="hidden sm:inline text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
            {delivery.voucher_code}
          </span>
        )}
        
        {/* Botão de Arquivar/Desarquivar */}
        {showConfirm ? (
          // Confirmação inline
          <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg px-2 py-1">
            <span className="text-xs text-yellow-700 dark:text-yellow-300 mr-1">Arquivar?</span>
            <button
              onClick={handleConfirmArchive}
              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded transition-colors"
              title="Confirmar"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelArchive}
              className="p-1 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleArchiveClick}
            disabled={isArchiving}
            title={isArchived ? "Desarquivar entrega" : "Arquivar entrega (não afeta o cliente)"}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isArchiving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isArchived ? (
              <ArchiveRestore className="w-4 h-4" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
          </button>
        )}
        
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>
    </Link>
  );
}

export default DeliveriesListPage;
