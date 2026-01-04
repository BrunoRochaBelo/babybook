/**
 * Deliveries List Page
 *
 * Lista todas as entregas do parceiro com filtros e busca.
 * Refatorado para UI Premium: Pills, Glassmorphism, Rounded-[2rem].
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Package,
  X,
  Loader2,
} from "lucide-react";
import { listDeliveries, archiveDelivery } from "./api";
import type { Delivery, DeliveryAggregations, DeliveryStatus } from "./types";
import {
  getPartnerDeliveryDisplayStatus,
} from "./deliveryStatus";
import {
  PartnerPageHeaderAction,
  usePartnerPageHeader,
} from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import { PartnerErrorState } from "@/layouts/partnerStates";
import {
  DeliveryFiltersModal,
  type DeliveryFilters,
  type DeliveriesFilterPreset,
} from "./components/DeliveryFiltersModal";
import { DeliveriesLoadingSkeleton } from "./components/DeliveriesLoadingSkeleton";
import { DeliveryTableRow, DELIVERY_GRID_COLS } from "./components/DeliveryTableRow";
import { DeliveryCardMobile } from "./components/DeliveryCardMobile";
import { DeliveryDetailsDrawer } from "./components/DeliveryDetailsDrawer";
import { useTranslation } from "@babybook/i18n";
import { cn } from "@/lib/utils";

// --- Types & Constants ---

type FilterStatus = "all" | DeliveryStatus;
type SortOption = "newest" | "oldest" | "status" | "client";
type VoucherFilter = "all" | "with" | "without";
type RedeemedFilter = "all" | "redeemed" | "not_redeemed";
type CreditFilter =
  | "all"
  | "reserved"
  | "consumed"
  | "refunded"
  | "not_required"
  | "unknown";
type ViewFilter = "all" | "needs_action";
type PeriodFilter = "all" | "last_7" | "last_30" | "last_90" | "custom";

const DELIVERIES_PRESETS_STORAGE_KEY =
  "@babybook/partner-deliveries-filter-presets";

const BUILTIN_PRESETS: DeliveriesFilterPreset[] = [
  {
    id: "builtin:needs_action",
    name: "Precisa de ação",
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    filters: {
      status: "all",
      q: "",
      includeArchived: false,
      sort: "status",
      voucher: "all",
      redeemed: "all",
      view: "needs_action",
    },
  },
  {
    id: "builtin:without_voucher",
    name: "Sem voucher",
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    filters: {
      status: "all",
      q: "",
      includeArchived: false,
      sort: "newest",
      voucher: "without",
      redeemed: "all",
    },
  },
];

function safeLoadPresets(): DeliveriesFilterPreset[] {
  try {
    const raw = localStorage.getItem(DELIVERIES_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((p) => p as DeliveriesFilterPreset)
      .filter((p) => Boolean(p?.id) && Boolean(p?.name) && Boolean(p?.filters));
  } catch {
    return [];
  }
}

function makePresetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `preset_${Date.now()}`;
}

// --- Components Helpers ---

function StatusPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex-shrink-0",
        active
          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md transform scale-105"
          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700",
      )}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
            active
              ? "bg-white/20 text-white dark:bg-black/10 dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ActiveFilterTag({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300 border border-pink-100 dark:border-pink-900/30 animate-in fade-in zoom-in duration-200">
      <span>{label}</span>
      <button
        onClick={onClear}
        className="hover:bg-pink-100 dark:hover:bg-pink-900/40 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function DeliveriesListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Header Config
  usePartnerPageHeader(
    useMemo(
      () => ({
        title: t("partner.deliveries.list.title"),
        actions: (
          <PartnerPageHeaderAction
            to="/partner/deliveries/new"
            label={t("partner.deliveries.newDelivery")}
            tone="primary"
            icon={<Plus className="w-4 h-4" />}
          />
        ),
      }),
      [t],
    ),
  );

  // --- State Setup ---
  // Defaults from URL
  const initialStatus = (searchParams.get("status") as FilterStatus) || "all";
  const initialQuery = searchParams.get("q") || "";
  const initialArchived = searchParams.get("archived") === "1" || initialStatus === "archived";
  const initialSort = (searchParams.get("sort") as SortOption) || "newest";
  const initialVoucher = (searchParams.get("voucher") as VoucherFilter) || "all";
  const initialRedeemed = (searchParams.get("redeemed") as RedeemedFilter) || "all";
  const initialCredit = (searchParams.get("credit") as CreditFilter) || "all";
  const initialView = (searchParams.get("view") as ViewFilter) || "all";
  const initialCreatedPeriod = (searchParams.get("created") as PeriodFilter) || "all";
  const initialCreatedFrom = searchParams.get("created_from") || "";
  const initialCreatedTo = searchParams.get("created_to") || "";
  const initialRedeemedPeriod = (searchParams.get("redeemed_period") as PeriodFilter) || "all";
  const initialRedeemedFrom = searchParams.get("redeemed_from") || "";
  const initialRedeemedTo = searchParams.get("redeemed_to") || "";

  // React State
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialQuery);
  const [includeArchived, setIncludeArchived] = useState(initialArchived);
  const [sort, setSort] = useState(initialSort);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  
  const [voucherFilter, setVoucherFilter] = useState(initialVoucher);
  const [redeemedFilter, setRedeemedFilter] = useState(initialRedeemed);
  const [creditFilter, setCreditFilter] = useState(initialCredit);
  const [viewFilter, setViewFilter] = useState(initialView);
  const [createdPeriod, setCreatedPeriod] = useState(initialCreatedPeriod);
  const [createdFrom, setCreatedFrom] = useState(initialCreatedFrom);
  const [createdTo, setCreatedTo] = useState(initialCreatedTo);
  const [redeemedPeriod, setRedeemedPeriod] = useState(initialRedeemedPeriod);
  const [redeemedFrom, setRedeemedFrom] = useState(initialRedeemedFrom);
  const [redeemedTo, setRedeemedTo] = useState(initialRedeemedTo);

  // Presets State
  const [presets, setPresets] = useState<DeliveriesFilterPreset[]>(() => safeLoadPresets());
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  // Persist Presets
  useEffect(() => {
     try {
       localStorage.setItem(DELIVERIES_PRESETS_STORAGE_KEY, JSON.stringify(presets));
     } catch {}
  }, [presets]);

  // Debounce Search
  useEffect(() => {
     const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
     return () => clearTimeout(t);
  }, [searchTerm]);

  const lastProcessedUrlRef = useRef("");
  // Sync URL -> State
  useEffect(() => {
    const currentUrl = searchParams.toString();
    if (currentUrl === lastProcessedUrlRef.current) return;
    lastProcessedUrlRef.current = currentUrl;
    
    // Update state from URL parameters
    setStatusFilter((searchParams.get("status") as FilterStatus) || "all");
    setSearchTerm(searchParams.get("q") || "");
    setDebouncedSearchTerm(searchParams.get("q") || "");
    setIncludeArchived(searchParams.get("archived") === "1");
    setSort((searchParams.get("sort") as SortOption) || "newest");
    setVoucherFilter((searchParams.get("voucher") as VoucherFilter) || "all");
    setRedeemedFilter((searchParams.get("redeemed") as RedeemedFilter) || "all");
    setCreditFilter((searchParams.get("credit") as CreditFilter) || "all");
    setViewFilter((searchParams.get("view") as ViewFilter) || "all");
    setCreatedPeriod((searchParams.get("created") as PeriodFilter) || "all");
    setCreatedFrom(searchParams.get("created_from") || "");
    setCreatedTo(searchParams.get("created_to") || "");
    setRedeemedPeriod((searchParams.get("redeemed_period") as PeriodFilter) || "all");
    setRedeemedFrom(searchParams.get("redeemed_from") || "");
    setRedeemedTo(searchParams.get("redeemed_to") || "");
  }, [searchParams]);

  // Sync State -> URL
  useEffect(() => {
    const next = new URLSearchParams();
    if (statusFilter !== "all") next.set("status", statusFilter);
    if (debouncedSearchTerm) next.set("q", debouncedSearchTerm);
    if (includeArchived) next.set("archived", "1");
    if (sort !== "newest") next.set("sort", sort);
    if (voucherFilter !== "all") next.set("voucher", voucherFilter);
    if (redeemedFilter !== "all") next.set("redeemed", redeemedFilter);
    if (creditFilter !== "all") next.set("credit", creditFilter);
    if (viewFilter !== "all") next.set("view", viewFilter);
    if (createdPeriod !== "all") next.set("created", createdPeriod);
    if (createdFrom) next.set("created_from", createdFrom);
    if (createdTo) next.set("created_to", createdTo);
    if (redeemedPeriod !== "all") next.set("redeemed_period", redeemedPeriod);
    if (redeemedFrom) next.set("redeemed_from", redeemedFrom);
    if (redeemedTo) next.set("redeemed_to", redeemedTo);

    if (next.toString() !== searchParams.toString()) {
         setSearchParams(next, { replace: true });
    }
  }, [
      statusFilter, debouncedSearchTerm, includeArchived, sort, 
      voucherFilter, redeemedFilter, creditFilter, viewFilter,
      createdPeriod, createdFrom, createdTo,
      redeemedPeriod, redeemedFrom, redeemedTo,
      searchParams, setSearchParams
  ]);

  // Filters object for Modal
  const filtersObj: DeliveryFilters = useMemo(() => ({
    voucher: voucherFilter,
    redeemed: redeemedFilter,
    credit: creditFilter,
    view: viewFilter,
    sort,
    createdPeriod,
    createdFrom,
    createdTo,
    redeemedPeriod,
    redeemedFrom,
    redeemedTo
  }), [voucherFilter, redeemedFilter, creditFilter, viewFilter, sort, createdPeriod, createdFrom, createdTo, redeemedPeriod, redeemedFrom, redeemedTo]);

  const handleApplyFilters = (newFilters: DeliveryFilters) => {
    setVoucherFilter(newFilters.voucher);
    setRedeemedFilter(newFilters.redeemed);
    setCreditFilter(newFilters.credit);
    setViewFilter(newFilters.view);
    setSort(newFilters.sort);
    setCreatedPeriod(newFilters.createdPeriod);
    setCreatedFrom(newFilters.createdFrom);
    setCreatedTo(newFilters.createdTo);
    setRedeemedPeriod(newFilters.redeemedPeriod);
    setRedeemedFrom(newFilters.redeemedFrom);
    setRedeemedTo(newFilters.redeemedTo);
    setSelectedPresetId(""); // Clear preset selection on manual change
  };

  const currentFiltersSnapshot = {
      status: statusFilter,
      q: searchTerm.trim(),
      includeArchived,
      sort,
      voucher: voucherFilter,
      redeemed: redeemedFilter,
      credit: creditFilter,
      view: viewFilter,
      createdPeriod,
      createdFrom,
      createdTo,
      redeemedPeriod,
      redeemedFrom,
      redeemedTo,
  };

  // Preset Handlers
  const handleSelectPreset = (preset: DeliveriesFilterPreset) => {
      setSelectedPresetId(preset.id);
      setStatusFilter(preset.filters.status);
      setIncludeArchived(preset.filters.includeArchived);
      setSearchTerm(preset.filters.q);
      setDebouncedSearchTerm(preset.filters.q);
      handleApplyFilters({
          ...filtersObj, // base
          voucher: preset.filters.voucher,
          redeemed: preset.filters.redeemed,
          credit: preset.filters.credit ?? "all",
          view: preset.filters.view ?? "all",
          sort: preset.filters.sort,
          createdPeriod: preset.filters.createdPeriod ?? "all",
          createdFrom: preset.filters.createdFrom ?? "",
          createdTo: preset.filters.createdTo ?? "",
          redeemedPeriod: preset.filters.redeemedPeriod ?? "all",
          redeemedFrom: preset.filters.redeemedFrom ?? "",
          redeemedTo: preset.filters.redeemedTo ?? "",
      });
  };

  const handleSavePreset = (name: string) => {
      const newPreset: DeliveriesFilterPreset = {
          id: makePresetId(),
          name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          filters: currentFiltersSnapshot,
      };
      setPresets(prev => [...prev, newPreset]);
      setSelectedPresetId(newPreset.id);
  };

  const handleUpdatePreset = () => {
      if (!selectedPresetId) return;
      setPresets(prev => prev.map(p => 
          p.id === selectedPresetId 
            ? { ...p, updated_at: new Date().toISOString(), filters: currentFiltersSnapshot }
            : p
      ));
  };

  const handleDeletePreset = () => {
      if (!selectedPresetId) return;
      setPresets(prev => prev.filter(p => p.id !== selectedPresetId));
      setSelectedPresetId("");
  };

  const handleResetFilters = () => {
      setStatusFilter("all");
      setIncludeArchived(false);
      setSearchTerm("");
      setDebouncedSearchTerm("");
      setVoucherFilter("all");
      setRedeemedFilter("all");
      setCreditFilter("all");
      setViewFilter("all");
      setCreatedPeriod("all");
      setRedeemedPeriod("all");
      setSort("newest");
      setSelectedPresetId("");
  };

  // Use Query Hook
  const PAGE_SIZE = 20;
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    items,
    aggregations
  } = useDeliveriesQuery({
      statusFilter,
      includeArchived,
      q: debouncedSearchTerm,
      sort,
      voucherFilter,
      redeemedFilter,
      creditFilter,
      viewFilter,
      createdPeriod,
      createdFrom,
      createdTo,
      redeemedPeriod,
      redeemedFrom,
      redeemedTo,
      PAGE_SIZE
  });

  // Infinite Scroll Observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   // Mutation to archive
   const archiveMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      archiveDelivery(id, archive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", "deliveries"] }),
  });


  const handleArchive = (delivery: Delivery, archive: boolean) => {
      archiveMutation.mutate({ id: delivery.id, archive });
      toast.success(archive ? "Entrega arquivada" : "Entrega desarquivada");
  };

  const hasAnyFiltersActive = statusFilter !== "all" || searchTerm || viewFilter !== "all";

  return (
    <PartnerPage>
      <div className="flex flex-col gap-6">
        <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t("partner.deliveries.list.title")}
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
                Gerencie suas entregas, status e vouchers.
            </p>
        </div>

        {/* Top Controls: Search & Main Filters */}
        <div className="flex flex-col gap-4">
           {/* Row 1: Search + Filter + New Delivery */}
           <div className="flex items-center gap-2">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por cliente ou título..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border-none rounded-[2.5rem] shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500/50 transition-all text-base"
                  />
                  <button 
                     onClick={() => setIsFiltersModalOpen(true)}
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
                  >
                     <Filter className="w-5 h-5" />
                  </button>
               </div>
               
               {/* New Delivery Button (Prominent) */}
               <Link
                    to="/partner/deliveries/new" 
                    className="flex-shrink-0 hidden sm:inline-flex group relative items-center justify-center gap-2 px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-lg shadow-gray-900/10 dark:shadow-white/10 overflow-hidden transition-transform active:scale-95"
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Nova Entrega</span>
                  </span>
               </Link>
               {/* Mobile variant (Icon only) */}
               <Link
                    to="/partner/deliveries/new" 
                    className="flex-shrink-0 sm:hidden flex items-center justify-center w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.5rem] shadow-lg hover:scale-105 active:scale-95 transition-all"
               >
                   <Plus className="w-6 h-6" />
               </Link>
           </div>

           {/* Status Pills */}
           <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient-x">
             <StatusPill 
               label="Todas" 
               count={aggregations?.total ?? 0}
               active={statusFilter === "all" && !includeArchived} 
               onClick={() => { setStatusFilter("all"); setIncludeArchived(false); }}
             />
             <StatusPill 
               label="Rascunho" 
               count={aggregations?.by_status?.draft ?? 0} 
               active={statusFilter === "draft"} 
               onClick={() => setStatusFilter("draft")}
             />
             {/* Note: 'active' status is a frontend concept in UI commonly, but backend enum might differs. 
                 Assuming 'processing' or 'ready' or just using 'all' minus 'archived' for active.
                 Based on types, we have specific statuses. Let's show specific statuses instead of 'Active' generic group if backend doesn't support it directly.
                 However, UI wanted 'Ativas'. Let's Map 'Ativas' to reset status filter or show pending/processing/ready.
                 For now, let's list specific statuses to be safe with types.
             */}
              <StatusPill 
               label="Processando" 
               count={aggregations?.by_status?.processing ?? 0} 
               active={statusFilter === "processing"} 
               onClick={() => setStatusFilter("processing")}
             />
              <StatusPill 
               label="Prontas" 
               count={aggregations?.by_status?.ready ?? 0} 
               active={statusFilter === "ready"} 
               onClick={() => setStatusFilter("ready")}
             />
              <StatusPill 
               label="Entregues" 
               count={aggregations?.by_status?.delivered ?? 0} 
               active={statusFilter === "delivered"} 
               onClick={() => setStatusFilter("delivered")}
             />
             <StatusPill 
               label="Arquivadas" 
               count={aggregations?.by_status?.archived ?? 0}
               active={includeArchived} 
               onClick={() => { setIncludeArchived(true); setStatusFilter("all"); }}
             />
           </div>

           {/* Active Filters Display */}
           {hasAnyFiltersActive && (
             <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                {viewFilter === "needs_action" && (
                    <ActiveFilterTag label="Precisa de atenção" onClear={() => setViewFilter("all")} />
                )}
                {/* ... other tags ... */}
             </div>
           )}
        </div>

        {/* Listeners & Modals */}
        <DeliveryFiltersModal 
            isOpen={isFiltersModalOpen}
            onClose={() => setIsFiltersModalOpen(false)}
            filters={filtersObj}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            presets={presets}
            builtinPresets={BUILTIN_PRESETS}
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
            onSavePreset={handleSavePreset}
            onUpdatePreset={handleUpdatePreset}
            onDeletePreset={handleDeletePreset}
            isBuiltinSelected={selectedPresetId.startsWith("builtin:")}
            hasUserPreset={Boolean(selectedPresetId && !selectedPresetId.startsWith("builtin:"))}
        />

        {/* Content Area */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 border border-white/50 dark:border-gray-700/50 overflow-hidden min-h-[400px]">
           {isLoading ? (
               <div className="p-8">
                  <DeliveriesLoadingSkeleton />
               </div>
           ) : isError ? (
               <PartnerErrorState onRetry={() => {}} title="Erro ao carregar entregas" />
           ) : items.length === 0 ? (
               <div className="p-12 flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                       <Package className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                       Nenhuma entrega encontrada
                   </h3>
                   <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                       Tente ajustar os filtros ou crie uma nova entrega para começar.
                   </p>
                   <Link 
                     to="/partner/deliveries/new"
                     className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-105 transition-transform"
                   >
                     Criar Nova Entrega
                   </Link>
               </div>
           ) : (
               <div className="flex flex-col">
                  {/* Desktop Header */}
                  <div className={`hidden md:grid ${DELIVERY_GRID_COLS} items-center gap-4 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-wider`}>
                      <div>Entrega / Cliente</div>
                      <div>Status</div>
                      <div>Voucher</div>
                      <div>Criado em</div>
                      <div className="text-right">Ações</div>
                  </div>

                  {/* List Items */}
                  <div>
                      {items.map((delivery, i) => (
                          <motion.div 
                              key={delivery.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="group border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                              {/* Mobile Card View */}
                              <div className="md:hidden p-4">
                                <DeliveryCardMobile 
                                    delivery={delivery}
                                    onArchive={(archive) => handleArchive(delivery, archive)}
                                    isArchiving={archiveMutation.isPending}
                                />
                              </div>

                              {/* Desktop Row View */}
                              <div className="hidden md:block">
                                  <DeliveryTableRow 
                                      delivery={delivery}
                                      isSelected={selectedDeliveryId === delivery.id}
                                      onPreview={() => setSelectedDeliveryId(delivery.id)}
                                      onArchive={(archive) => handleArchive(delivery, archive)}
                                      isArchiving={archiveMutation.isPending}
                                  />
                              </div>
                          </motion.div>
                      ))}
                  </div>

                  {/* Load More Trigger (Infinite Scroll) */}
                  <div ref={loadMoreRef} className="py-8 text-center text-gray-400">
                      {isFetchingNextPage ? (
                          <div className="flex justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                          </div>
                      ) : hasNextPage ? (
                          <span className="text-xs">Carregando mais...</span>
                      ) : null}
                  </div>
               </div>
           )}
        </div>

        <DeliveryDetailsDrawer 
            isOpen={!!selectedDeliveryId}
            onClose={() => setSelectedDeliveryId(null)}
            deliveryId={selectedDeliveryId}
        />
      </div>
    </PartnerPage>
  );
}

// Hook wrapper for cleaner component
function useDeliveriesQuery(params: any) {
    // Ensure we map "all" to undefined for the API if needed, or pass strict params
    // backend expects status_filter for "active", "draft" etc. 
    // "active" in UI pill might map to "processing,ready,delivered" or backend specific "active" alias.
    // If backend only supports strict statuses, we need to map them.
    // Assuming backend handles "draft", "ready", etc. correctly.
    const queryParams = {
        ...params,
        status_filter: params.statusFilter === "all" ? undefined : params.statusFilter,
        limit: params.PAGE_SIZE, 
        offset: params.pageParam 
    };

    const { data, ...rest } = useInfiniteQuery({
        queryKey: ["partner", "deliveries", "list", params], // Params in key to trigger re-fetch
        initialPageParam: 0,
        queryFn: ({ pageParam }) => listDeliveries({ ...queryParams, offset: pageParam }),
        getNextPageParam: (last, all) => {
             const loaded = all.reduce((acc, p) => acc + (p.deliveries?.length || 0), 0);
             return loaded < (last.total || 0) ? loaded : undefined;
        }
    });

    const items = useMemo(() => data?.pages.flatMap(p => p.deliveries || []) || [], [data]);
    const total = data?.pages[0]?.total || 0;
    const aggregations = data?.pages[0]?.aggregations;

    return { data, items, total, aggregations, ...rest };
}
