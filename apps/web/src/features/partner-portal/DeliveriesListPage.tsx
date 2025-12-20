/**
 * Deliveries List Page
 *
 * Lista todas as entregas do parceiro com filtros e busca.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Image,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
  Clock,
  CheckCircle2,
  Ticket,
  Gift,
  Archive,
  ArchiveRestore,
  Eye,
  Upload,
  X,
  Bookmark,
  Save,
  Trash2,
} from "lucide-react";
import { listDeliveries, archiveDelivery } from "./api";
import type { Delivery, DeliveryAggregations, DeliveryStatus } from "./types";
import {
  getPartnerDeliveryDisplayStatus,
  getPartnerDeliveryStatusMeta,
  isPartnerDeliveryArchived,
} from "./deliveryStatus";
import { CreditStatusBadge } from "./creditStatus";
import {
  PartnerPageHeaderAction,
  usePartnerPageHeader,
} from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import {
  PartnerEmptyState,
  PartnerLoadingState,
  PartnerErrorState,
} from "@/layouts/partnerStates";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig: Record<
  DeliveryStatus,
  { icon: typeof Clock; className: string; label: string; shortLabel: string }
> = {
  draft: {
    icon: Clock,
    className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    label: "Rascunho",
    shortLabel: "Rascunho",
  },
  pending_upload: {
    icon: Clock,
    className:
      "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    label: "Aguardando upload",
    shortLabel: "Upload",
  },
  processing: {
    icon: Loader2,
    className:
      "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    label: "Processando",
    shortLabel: "Proc.",
  },
  ready: {
    icon: CheckCircle2,
    className:
      "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    label: "Pronta",
    shortLabel: "Pronta",
  },
  delivered: {
    icon: Gift,
    className:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    label: "Entregue",
    shortLabel: "Entregue",
  },
  failed: {
    icon: X,
    className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    label: "Falhou",
    shortLabel: "Erro",
  },
  archived: {
    icon: Package,
    className: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    label: "Arquivada",
    shortLabel: "Arq.",
  },
};

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const cfg = statusConfig[status] || statusConfig.draft;
  const Icon = cfg.icon;
  const meta = getPartnerDeliveryStatusMeta(status);

  return (
    <span
      title={meta.hint}
      aria-label={`${cfg.label}. ${meta.hint}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon
        className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`}
      />
      <span className="sm:hidden">{cfg.shortLabel}</span>
      <span className="hidden sm:inline">{cfg.label}</span>
    </span>
  );
}

function getDeliveryDisplayStatus(delivery: Delivery): DeliveryStatus {
  return getPartnerDeliveryDisplayStatus(delivery);
}

function isDeliveryArchived(delivery: Delivery): boolean {
  return isPartnerDeliveryArchived(delivery);
}

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

type DeliveriesFilterPreset = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  filters: {
    status: FilterStatus;
    q: string;
    includeArchived: boolean;
    sort: SortOption;
    voucher: VoucherFilter;
    redeemed: RedeemedFilter;
    credit?: CreditFilter;
    view?: ViewFilter;
    createdPeriod?: PeriodFilter;
    createdFrom?: string;
    createdTo?: string;
    redeemedPeriod?: PeriodFilter;
    redeemedFrom?: string;
    redeemedTo?: string;
  };
};

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
      credit: "all",
      view: "needs_action",
      createdPeriod: "all",
      redeemedPeriod: "all",
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
      credit: "all",
      view: "all",
      createdPeriod: "all",
      redeemedPeriod: "all",
    },
  },
  {
    id: "builtin:redeemed",
    name: "Resgatadas",
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    filters: {
      status: "all",
      q: "",
      includeArchived: false,
      sort: "newest",
      voucher: "with",
      redeemed: "redeemed",
      credit: "all",
      view: "all",
      createdPeriod: "all",
      redeemedPeriod: "all",
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
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `preset_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sumCounts(obj: Record<string, number> | undefined): number {
  if (!obj) return 0;
  return Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function getPeriodLabel(period: PeriodFilter): string {
  if (period === "last_7") return "últimos 7 dias";
  if (period === "last_30") return "últimos 30 dias";
  if (period === "last_90") return "últimos 90 dias";
  if (period === "custom") return "intervalo";
  return "tudo";
}

function StatusCounterChip({
  label,
  title,
  count,
  active,
  onClick,
}: {
  label: string;
  title?: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      role="radio"
      aria-checked={active}
      aria-label={title || label}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 whitespace-nowrap ${
        active
          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
          : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      <span>{label}</span>
      <span
        className={`tabular-nums text-xs ${
          active
            ? "text-white/70 dark:text-gray-900/60"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ActiveFilterChip({
  label,
  title,
  onClear,
}: {
  label: string;
  title?: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      title={title || `Remover filtro: ${label}`}
      aria-label={title || `Remover filtro: ${label}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="truncate max-w-[180px]">{label}</span>
      <X className="w-3.5 h-3.5 opacity-70" />
    </button>
  );
}

export function DeliveriesListPage() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const applyingUrlStateRef = useRef(false);

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: "Entregas",
        backTo: "/partner",
        backLabel: "Voltar ao portal",
        actions: (
          <PartnerPageHeaderAction
            to="/partner/deliveries/new"
            label="Nova entrega"
            tone="primary"
            icon={<Plus className="w-4 h-4" />}
          />
        ),
      }),
      [],
    ),
  );

  const initialStatus = (searchParams.get("status") as FilterStatus) || "all";
  const initialQuery = searchParams.get("q") || "";
  const initialArchived =
    searchParams.get("archived") === "1" || initialStatus === "archived";
  const initialSort = (searchParams.get("sort") as SortOption) || "newest";
  const initialVoucher =
    (searchParams.get("voucher") as VoucherFilter) || "all";
  const initialRedeemed =
    (searchParams.get("redeemed") as RedeemedFilter) || "all";
  const initialCredit = (searchParams.get("credit") as CreditFilter) || "all";
  const initialView = (searchParams.get("view") as ViewFilter) || "all";

  const initialCreatedPeriod =
    (searchParams.get("created") as PeriodFilter) || "all";
  const initialCreatedFrom = searchParams.get("created_from") || "";
  const initialCreatedTo = searchParams.get("created_to") || "";

  const initialRedeemedPeriod =
    (searchParams.get("redeemed_period") as PeriodFilter) || "all";
  const initialRedeemedFrom = searchParams.get("redeemed_from") || "";
  const initialRedeemedTo = searchParams.get("redeemed_to") || "";

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialQuery);
  const [includeArchived, setIncludeArchived] = useState(initialArchived);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [voucherFilter, setVoucherFilter] =
    useState<VoucherFilter>(initialVoucher);
  const [redeemedFilter, setRedeemedFilter] =
    useState<RedeemedFilter>(initialRedeemed);
  const [creditFilter, setCreditFilter] = useState<CreditFilter>(initialCredit);
  const [viewFilter, setViewFilter] = useState<ViewFilter>(initialView);

  const [createdPeriod, setCreatedPeriod] =
    useState<PeriodFilter>(initialCreatedPeriod);
  const [createdFrom, setCreatedFrom] = useState(initialCreatedFrom);
  const [createdTo, setCreatedTo] = useState(initialCreatedTo);

  const [redeemedPeriod, setRedeemedPeriod] = useState<PeriodFilter>(
    initialRedeemedPeriod,
  );
  const [redeemedFrom, setRedeemedFrom] = useState(initialRedeemedFrom);
  const [redeemedTo, setRedeemedTo] = useState(initialRedeemedTo);
  const [previewDeliveryId, setPreviewDeliveryId] = useState<string | null>(
    null,
  );
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  const [presets, setPresets] = useState<DeliveriesFilterPreset[]>(() =>
    safeLoadPresets(),
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatus);

  useEffect(() => {
    // Se o usuário navega com back/forward e a URL muda, sincronizamos o estado
    // (sem reescrever a URL em loop).
    const nextStatus = (searchParams.get("status") as FilterStatus) || "all";
    const nextQuery = searchParams.get("q") || "";
    const nextArchived =
      searchParams.get("archived") === "1" || nextStatus === "archived";
    const nextSort = (searchParams.get("sort") as SortOption) || "newest";
    const nextVoucher = (searchParams.get("voucher") as VoucherFilter) || "all";
    const nextRedeemed =
      (searchParams.get("redeemed") as RedeemedFilter) || "all";
    const nextCredit = (searchParams.get("credit") as CreditFilter) || "all";
    const nextView = (searchParams.get("view") as ViewFilter) || "all";

    const nextCreatedPeriod =
      (searchParams.get("created") as PeriodFilter) || "all";
    const nextCreatedFrom = searchParams.get("created_from") || "";
    const nextCreatedTo = searchParams.get("created_to") || "";

    const nextRedeemedPeriod =
      (searchParams.get("redeemed_period") as PeriodFilter) || "all";
    const nextRedeemedFrom = searchParams.get("redeemed_from") || "";
    const nextRedeemedTo = searchParams.get("redeemed_to") || "";

    const changed =
      nextStatus !== statusFilter ||
      nextQuery !== searchTerm ||
      nextArchived !== includeArchived ||
      nextSort !== sort ||
      nextVoucher !== voucherFilter ||
      nextRedeemed !== redeemedFilter ||
      nextCredit !== creditFilter ||
      nextView !== viewFilter ||
      nextCreatedPeriod !== createdPeriod ||
      nextCreatedFrom !== createdFrom ||
      nextCreatedTo !== createdTo ||
      nextRedeemedPeriod !== redeemedPeriod ||
      nextRedeemedFrom !== redeemedFrom ||
      nextRedeemedTo !== redeemedTo;

    if (!changed) return;

    applyingUrlStateRef.current = true;
    setStatusFilter(nextStatus);
    setSearchTerm(nextQuery);
    setDebouncedSearchTerm(nextQuery);
    setIncludeArchived(nextArchived);
    setSort(nextSort);
    setVoucherFilter(nextVoucher);
    setRedeemedFilter(nextRedeemed);
    setCreditFilter(nextCredit);
    setViewFilter(nextView);
    setCreatedPeriod(nextCreatedPeriod);
    setCreatedFrom(nextCreatedFrom);
    setCreatedTo(nextCreatedTo);
    setRedeemedPeriod(nextRedeemedPeriod);
    setRedeemedFrom(nextRedeemedFrom);
    setRedeemedTo(nextRedeemedTo);
  }, [
    createdFrom,
    createdPeriod,
    createdTo,
    creditFilter,
    includeArchived,
    redeemedFilter,
    redeemedFrom,
    redeemedPeriod,
    redeemedTo,
    searchParams,
    searchTerm,
    sort,
    statusFilter,
    voucherFilter,
    viewFilter,
  ]);

  useEffect(() => {
    // Se o usuário/URL/preset selecionou "Arquivadas", garantir que o modo
    // inclua arquivadas. (Evita cair para "all" e perder a intenção.)
    if (statusFilter === "archived" && !includeArchived) {
      setIncludeArchived(true);
    }
  }, [includeArchived, statusFilter]);

  useEffect(() => {
    // Se o usuário aplica um período de resgate, implicitamente estamos falando de resgatadas.
    if (redeemedPeriod !== "all" && redeemedFilter !== "redeemed") {
      setRedeemedFilter("redeemed");
    }
  }, [redeemedFilter, redeemedPeriod]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  // Sincronizar URL a partir do estado atual (inclui filtros client-side)
  useEffect(() => {
    if (applyingUrlStateRef.current) {
      applyingUrlStateRef.current = false;
      return;
    }

    const next = new URLSearchParams(searchParams);

    if (statusFilter === "all") next.delete("status");
    else next.set("status", statusFilter);

    if (debouncedSearchTerm.trim()) next.set("q", debouncedSearchTerm.trim());
    else next.delete("q");

    if (includeArchived) next.set("archived", "1");
    else next.delete("archived");

    if (sort === "newest") next.delete("sort");
    else next.set("sort", sort);

    if (voucherFilter === "all") next.delete("voucher");
    else next.set("voucher", voucherFilter);

    if (redeemedFilter === "all") next.delete("redeemed");
    else next.set("redeemed", redeemedFilter);

    if (creditFilter === "all") next.delete("credit");
    else next.set("credit", creditFilter);

    if (viewFilter === "all") next.delete("view");
    else next.set("view", viewFilter);

    if (createdPeriod === "all") {
      next.delete("created");
      next.delete("created_from");
      next.delete("created_to");
    } else {
      next.set("created", createdPeriod);
      if (createdPeriod === "custom" && createdFrom.trim())
        next.set("created_from", createdFrom.trim());
      else next.delete("created_from");
      if (createdPeriod === "custom" && createdTo.trim())
        next.set("created_to", createdTo.trim());
      else next.delete("created_to");
    }

    if (redeemedPeriod === "all") {
      next.delete("redeemed_period");
      next.delete("redeemed_from");
      next.delete("redeemed_to");
    } else {
      next.set("redeemed_period", redeemedPeriod);
      if (redeemedPeriod === "custom" && redeemedFrom.trim())
        next.set("redeemed_from", redeemedFrom.trim());
      else next.delete("redeemed_from");
      if (redeemedPeriod === "custom" && redeemedTo.trim())
        next.set("redeemed_to", redeemedTo.trim());
      else next.delete("redeemed_to");
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    statusFilter,
    includeArchived,
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
    debouncedSearchTerm,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DELIVERIES_PRESETS_STORAGE_KEY,
        JSON.stringify(presets),
      );
    } catch {
      // ignore
    }
  }, [presets]);

  const PAGE_SIZE = 20;

  // Query (pagination incremental)
  const {
    data,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "partner",
      "deliveries",
      "list",
      {
        statusFilter,
        includeArchived,
        q: debouncedSearchTerm.trim(),
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
      },
    ],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listDeliveries({
        status_filter: statusFilter !== "all" ? statusFilter : undefined,
        include_archived: includeArchived,
        q: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
        sort,
        voucher:
          voucherFilter !== "all"
            ? (voucherFilter as "with" | "without")
            : undefined,
        redeemed:
          redeemedFilter !== "all"
            ? (redeemedFilter as "redeemed" | "not_redeemed")
            : undefined,
        credit:
          creditFilter !== "all"
            ? (creditFilter as
                | "reserved"
                | "consumed"
                | "refunded"
                | "not_required"
                | "unknown")
            : undefined,
        view: viewFilter !== "all" ? "needs_action" : undefined,
        created:
          createdPeriod !== "all"
            ? (createdPeriod as "last_7" | "last_30" | "last_90" | "custom")
            : undefined,
        created_from:
          createdPeriod === "custom" && createdFrom.trim()
            ? createdFrom.trim()
            : undefined,
        created_to:
          createdPeriod === "custom" && createdTo.trim()
            ? createdTo.trim()
            : undefined,
        redeemed_period:
          redeemedPeriod !== "all"
            ? (redeemedPeriod as "last_7" | "last_30" | "last_90" | "custom")
            : undefined,
        redeemed_from:
          redeemedPeriod === "custom" && redeemedFrom.trim()
            ? redeemedFrom.trim()
            : undefined,
        redeemed_to:
          redeemedPeriod === "custom" && redeemedTo.trim()
            ? redeemedTo.trim()
            : undefined,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (acc, p) => acc + (p.deliveries?.length || 0),
        0,
      );
      return loaded < (lastPage.total || 0) ? loaded : undefined;
    },
  });

  // Mutation para arquivar (precisa ficar antes de qualquer early-return)
  const archiveMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      archiveDelivery(id, archive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "deliveries"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o arquivamento da entrega",
      );
    },
  });

  const handleArchive = useCallback(
    (delivery: Delivery, archive: boolean) => {
      const title = delivery.title || delivery.client_name || "Entrega";

      archiveMutation.mutate(
        { id: delivery.id, archive },
        {
          onSuccess: () => {
            toast.success(
              archive
                ? `Entrega arquivada: ${title}`
                : `Entrega desarquivada: ${title}`,
              {
                action: {
                  label: "Desfazer",
                  onClick: () =>
                    archiveMutation.mutate({
                      id: delivery.id,
                      archive: !archive,
                    }),
                },
              },
            );
          },
        },
      );
    },
    [archiveMutation],
  );

  const errorState = isError ? (
    <PartnerErrorState
      title="Não foi possível carregar as entregas"
      onRetry={refetch}
    />
  ) : null;

  const { deliveries, total, aggregations } = useMemo(() => {
    const pages = data?.pages || [];
    const items = pages.flatMap((p) => p.deliveries || []);
    const totalCount = pages.at(-1)?.total ?? 0;
    const aggs = (
      pages[0] as { aggregations?: DeliveryAggregations } | undefined
    )?.aggregations;
    return { deliveries: items, total: totalCount, aggregations: aggs };
  }, [data]);

  const filteredDeliveries = deliveries;
  const showingCount = deliveries.length;

  const hasAnyFiltersActive =
    statusFilter !== "all" ||
    searchTerm.trim() ||
    sort !== "newest" ||
    voucherFilter !== "all" ||
    redeemedFilter !== "all" ||
    creditFilter !== "all" ||
    viewFilter !== "all" ||
    createdPeriod !== "all" ||
    redeemedPeriod !== "all";

  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];

    if (statusFilter !== "all") {
      parts.push(
        `Status: ${statusConfig[statusFilter]?.label || statusFilter}`,
      );
    }
    if (searchTerm.trim()) {
      parts.push(`Busca: “${searchTerm.trim()}”`);
    }
    if (voucherFilter !== "all") {
      parts.push(voucherFilter === "with" ? "Voucher: com" : "Voucher: sem");
    }
    if (redeemedFilter !== "all") {
      parts.push(
        redeemedFilter === "redeemed"
          ? "Resgate: resgatadas"
          : "Resgate: não resgatadas",
      );
    }
    if (creditFilter !== "all") {
      const creditLabel =
        creditFilter === "reserved"
          ? "Crédito: reservado"
          : creditFilter === "consumed"
            ? "Crédito: usado"
            : creditFilter === "refunded"
              ? "Crédito: devolvido"
              : creditFilter === "not_required"
                ? "Crédito: sem custo"
                : "Crédito: desconhecido";
      parts.push(creditLabel);
    }

    if (viewFilter !== "all") {
      parts.push(
        viewFilter === "needs_action" ? "Visão: precisa de ação" : "Visão",
      );
    }

    if (createdPeriod !== "all") {
      const label =
        createdPeriod === "custom" && (createdFrom.trim() || createdTo.trim())
          ? `Criadas: ${createdFrom.trim() || "…"} → ${createdTo.trim() || "…"}`
          : `Criadas: ${getPeriodLabel(createdPeriod)}`;
      parts.push(label);
    }

    if (redeemedPeriod !== "all") {
      const label =
        redeemedPeriod === "custom" &&
        (redeemedFrom.trim() || redeemedTo.trim())
          ? `Resgate (data): ${redeemedFrom.trim() || "…"} → ${redeemedTo.trim() || "…"}`
          : `Resgate (data): ${getPeriodLabel(redeemedPeriod)}`;
      parts.push(label);
    }
    if (sort !== "newest") {
      parts.push(
        sort === "oldest"
          ? "Ordenação: mais antigas"
          : sort === "status"
            ? "Ordenação: status"
            : "Ordenação: cliente",
      );
    }

    return parts;
  }, [
    creditFilter,
    createdFrom,
    createdPeriod,
    createdTo,
    redeemedFilter,
    redeemedFrom,
    redeemedPeriod,
    redeemedTo,
    searchTerm,
    sort,
    statusFilter,
    voucherFilter,
    viewFilter,
  ]);

  const activeFiltersSummaryDisplay = useMemo(() => {
    const full = activeFiltersSummary.join(" • ");
    if (activeFiltersSummary.length <= 2) return { text: full, full };
    const head = activeFiltersSummary.slice(0, 2).join(" • ");
    return { text: `${head} • +${activeFiltersSummary.length - 2}`, full };
  }, [activeFiltersSummary]);

  const selectedPreset = useMemo(() => {
    if (!selectedPresetId) return null;
    return (
      [...BUILTIN_PRESETS, ...presets].find((p) => p.id === selectedPresetId) ??
      null
    );
  }, [presets, selectedPresetId]);

  const selectedUserPreset = useMemo(() => {
    if (!selectedPresetId) return null;
    return presets.find((p) => p.id === selectedPresetId) ?? null;
  }, [presets, selectedPresetId]);

  const isBuiltinPresetSelected = selectedPresetId.startsWith("builtin:");

  const currentFiltersSnapshot = useMemo(
    () => ({
      status: statusFilter,
      q: searchTerm.trim(),
      includeArchived,
      sort,
      voucher: voucherFilter,
      redeemed: redeemedFilter,
      credit: creditFilter,
      view: viewFilter,
      createdPeriod,
      createdFrom: createdFrom.trim(),
      createdTo: createdTo.trim(),
      redeemedPeriod,
      redeemedFrom: redeemedFrom.trim(),
      redeemedTo: redeemedTo.trim(),
    }),
    [
      creditFilter,
      createdFrom,
      createdPeriod,
      createdTo,
      includeArchived,
      redeemedFilter,
      redeemedFrom,
      redeemedPeriod,
      redeemedTo,
      searchTerm,
      sort,
      statusFilter,
      voucherFilter,
      viewFilter,
    ],
  );

  const applyPreset = (preset: DeliveriesFilterPreset) => {
    setStatusFilter(preset.filters.status);
    setIncludeArchived(preset.filters.includeArchived);
    setSort(preset.filters.sort);
    setVoucherFilter(preset.filters.voucher);
    setRedeemedFilter(preset.filters.redeemed);
    setCreditFilter(preset.filters.credit ?? "all");
    setViewFilter(preset.filters.view ?? "all");
    setCreatedPeriod(preset.filters.createdPeriod ?? "all");
    setCreatedFrom(preset.filters.createdFrom ?? "");
    setCreatedTo(preset.filters.createdTo ?? "");
    setRedeemedPeriod(preset.filters.redeemedPeriod ?? "all");
    setRedeemedFrom(preset.filters.redeemedFrom ?? "");
    setRedeemedTo(preset.filters.redeemedTo ?? "");
    setSearchTerm(preset.filters.q);
    setDebouncedSearchTerm(preset.filters.q);
  };

  const upsertSelectedPreset = () => {
    if (!selectedUserPreset) return;
    const now = new Date().toISOString();
    setPresets((prev) =>
      prev.map((p) =>
        p.id === selectedUserPreset.id
          ? { ...p, updated_at: now, filters: currentFiltersSnapshot }
          : p,
      ),
    );
  };

  const createPreset = () => {
    const name = newPresetName.trim();
    if (!name) return;
    const now = new Date().toISOString();
    const preset: DeliveriesFilterPreset = {
      id: makePresetId(),
      name,
      created_at: now,
      updated_at: now,
      filters: currentFiltersSnapshot,
    };
    setPresets((prev) => [preset, ...prev]);
    setSelectedPresetId(preset.id);
    setIsCreatingPreset(false);
    setNewPresetName("");
  };

  const deleteSelectedPreset = () => {
    if (!selectedUserPreset) return;
    setPresets((prev) => prev.filter((p) => p.id !== selectedUserPreset.id));
    setSelectedPresetId("");
  };

  const computedCounts = useMemo(() => {
    const byStatus: Record<DeliveryStatus, number> = {
      draft: 0,
      pending_upload: 0,
      processing: 0,
      ready: 0,
      delivered: 0,
      failed: 0,
      archived: 0,
    };

    for (const d of deliveries) {
      const s = getDeliveryDisplayStatus(d);
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }

    const archived = byStatus.archived || 0;
    return {
      totalAll: deliveries.length,
      archived,
      byStatus,
      activeTotal: Math.max(0, deliveries.length - archived),
    };
  }, [deliveries]);

  const statusCounters = useMemo(() => {
    const byStatus = aggregations?.by_status as
      | DeliveryAggregations["by_status"]
      | undefined;

    const activeTotal = byStatus
      ? sumCounts(byStatus)
      : computedCounts.activeTotal;
    const archivedCount = aggregations?.archived ?? computedCounts.archived;
    const totalAll = aggregations?.total ?? computedCounts.totalAll;

    return {
      totalAll,
      archivedCount,
      activeTotal,
      byStatus: {
        draft: byStatus?.draft ?? computedCounts.byStatus.draft,
        pending_upload:
          byStatus?.pending_upload ?? computedCounts.byStatus.pending_upload,
        processing: byStatus?.processing ?? computedCounts.byStatus.processing,
        failed: byStatus?.failed ?? computedCounts.byStatus.failed,
        ready: byStatus?.ready ?? computedCounts.byStatus.ready,
        delivered: byStatus?.delivered ?? computedCounts.byStatus.delivered,
      },
    };
  }, [aggregations, computedCounts]);

  const previewIndex = useMemo(() => {
    if (!previewDeliveryId) return -1;
    return filteredDeliveries.findIndex((d) => d.id === previewDeliveryId);
  }, [filteredDeliveries, previewDeliveryId]);

  const previewDelivery = useMemo(() => {
    if (!previewDeliveryId) return null;
    return (
      filteredDeliveries.find((d) => d.id === previewDeliveryId) ||
      deliveries.find((d) => d.id === previewDeliveryId) ||
      null
    );
  }, [deliveries, filteredDeliveries, previewDeliveryId]);

  const canPreviewPrev = previewIndex > 0;
  const canPreviewNext =
    previewIndex >= 0 && previewIndex < filteredDeliveries.length - 1;

  const goPreviewPrev = useCallback(() => {
    if (!canPreviewPrev) return;
    const prev = filteredDeliveries[previewIndex - 1];
    if (prev) setPreviewDeliveryId(prev.id);
  }, [canPreviewPrev, filteredDeliveries, previewIndex]);

  const goPreviewNext = useCallback(() => {
    if (!canPreviewNext) return;
    const next = filteredDeliveries[previewIndex + 1];
    if (next) setPreviewDeliveryId(next.id);
  }, [canPreviewNext, filteredDeliveries, previewIndex]);

  useEffect(() => {
    if (!previewDeliveryId) return;

    // Se a entrega sumiu (filtro/busca/paginação), fecha a prévia.
    if (!previewDelivery) {
      setPreviewDeliveryId(null);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        activeEl?.isContentEditable;

      if (isTyping) return;

      if (e.key === "Escape") {
        setPreviewDeliveryId(null);
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        goPreviewPrev();
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        goPreviewNext();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goPreviewNext, goPreviewPrev, previewDelivery, previewDeliveryId]);

  // Atalho de teclado: "/" foca a busca (padrão comum em apps web)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        activeEl?.isContentEditable;

      if (isTyping) return;
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Tratamento de erro de carregamento (precisa ficar após os hooks)
  if (errorState) {
    return errorState;
  }

  return (
    <PartnerPage>
      {/* Mobile summary - O botão voltar mobile é renderizado pelo header sticky */}
      <div className="md:hidden mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Minhas entregas
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {aggregations ? (
            <>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {aggregations.total}
              </span>{" "}
              no total •{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {aggregations.archived}
              </span>{" "}
              arquivadas
            </>
          ) : (
            <>{total} entregas</>
          )}
        </p>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-8">
        <PartnerBackButton to="/partner" label="Voltar ao portal" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Minhas Entregas
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
              {aggregations ? (
                <>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {aggregations.total}
                  </span>{" "}
                  no total •{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {aggregations.archived}
                  </span>{" "}
                  arquivadas
                </>
              ) : (
                <>{total} entregas</>
              )}
            </p>
          </div>
          <Link
            to="/partner/deliveries/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nova Entrega</span>
          </Link>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por entrega, cliente ou voucher…"
            data-search-input="true"
            ref={searchInputRef}
            aria-label="Buscar entregas"
            title="Dica: pressione / para buscar"
            className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort - Desktop (select) */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="hidden md:block px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-w-[140px]"
          aria-label="Ordenar"
        >
          <option value="newest">Mais recentes</option>
          <option value="oldest">Mais antigas</option>
          <option value="status">Por status</option>
          <option value="client">Por cliente</option>
        </select>

        {/* Sort - Mobile (icon button that opens modal) */}
        <button
          type="button"
          onClick={() => setIsSortModalOpen(true)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          aria-label="Ordenar"
          title="Ordenar"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Status Chips (ghost style, inline) */}
      <div className="mb-3">
        <div
          className="flex items-center gap-2 overflow-x-auto bb-no-scrollbar pb-1"
          role="radiogroup"
          aria-label="Filtrar entregas por status"
        >
          <StatusCounterChip
            label="Tudo"
            title="Todas as entregas (ativas + arquivadas)"
            count={statusCounters.totalAll}
            active={includeArchived && statusFilter === "all"}
            onClick={() => {
              setIncludeArchived(true);
              setStatusFilter("all");
            }}
          />
          <StatusCounterChip
            label="Ativas"
            title="Entregas ativas (não arquivadas)"
            count={statusCounters.activeTotal}
            active={!includeArchived && statusFilter === "all"}
            onClick={() => {
              setIncludeArchived(false);
              setStatusFilter("all");
            }}
          />

          <span className="h-5 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

          <StatusCounterChip
            label={statusConfig.draft.shortLabel}
            title={statusConfig.draft.label}
            count={statusCounters.byStatus.draft}
            active={statusFilter === "draft"}
            onClick={() => {
              setIncludeArchived(false);
              setStatusFilter("draft");
            }}
          />
          <StatusCounterChip
            label={statusConfig.pending_upload.shortLabel}
            title={statusConfig.pending_upload.label}
            count={statusCounters.byStatus.pending_upload}
            active={statusFilter === "pending_upload"}
            onClick={() => {
              setIncludeArchived(false);
              setStatusFilter("pending_upload");
            }}
          />
          <StatusCounterChip
            label={statusConfig.processing.shortLabel}
            title={statusConfig.processing.label}
            count={statusCounters.byStatus.processing}
            active={statusFilter === "processing"}
            onClick={() => {
              setIncludeArchived(false);
              setStatusFilter("processing");
            }}
          />
          <StatusCounterChip
            label={statusConfig.failed.shortLabel}
            title={statusConfig.failed.label}
            count={statusCounters.byStatus.failed}
            active={statusFilter === "failed"}
            onClick={() => {
              setIncludeArchived(false);
              setStatusFilter("failed");
            }}
          />
          <StatusCounterChip
            label={statusConfig.ready.shortLabel}
            title={statusConfig.ready.label}
            count={statusCounters.byStatus.ready}
            active={statusFilter === "ready"}
            onClick={() => {
              setIncludeArchived(false);
              setStatusFilter("ready");
            }}
          />
          <StatusCounterChip
            label={statusConfig.delivered.shortLabel}
            title={statusConfig.delivered.label}
            count={statusCounters.byStatus.delivered}
            active={statusFilter === "delivered"}
            onClick={() => {
              setIncludeArchived(false);
              setStatusFilter("delivered");
            }}
          />

          <span className="h-5 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

          <StatusCounterChip
            label="Arq."
            title="Arquivadas"
            count={statusCounters.archivedCount}
            active={includeArchived && statusFilter === "archived"}
            onClick={() => {
              setIncludeArchived(true);
              setStatusFilter("archived");
            }}
          />

          <span className="h-5 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

          <button
            type="button"
            onClick={() => {
              const details = document.getElementById("presets-details");
              if (details) {
                (details as HTMLDetailsElement).open = !(
                  details as HTMLDetailsElement
                ).open;
              }
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedPresetId
                ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            title="Presets de filtros"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Presets</span>
          </button>
        </div>

        <p
          className="sm:hidden text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1"
          aria-hidden="true"
        >
          ← Deslize →
        </p>
      </div>

      {/* Presets Dropdown (hidden by default) */}
      <details id="presets-details" className="mb-3 group">
        <summary className="sr-only">Presets de filtros</summary>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              value={selectedPresetId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedPresetId(id);
                const preset = [...BUILTIN_PRESETS, ...presets].find(
                  (p) => p.id === id,
                );
                if (preset) applyPreset(preset);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              aria-label="Preset de filtros"
            >
              <option value="">Selecionar preset…</option>
              <optgroup label="Sugestões">
                {BUILTIN_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Meus presets">
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>

            {isCreatingPreset ? (
              <div className="flex items-center gap-2">
                <input
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Nome..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                />
                <button
                  type="button"
                  onClick={createPreset}
                  className="p-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600"
                  title="Salvar"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingPreset(false);
                    setNewPresetName("");
                  }}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingPreset(true)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Salvar filtros atuais"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={!selectedUserPreset || isBuiltinPresetSelected}
                  onClick={upsertSelectedPreset}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                  title={
                    isBuiltinPresetSelected
                      ? "Presets sugeridos não podem ser editados"
                      : "Atualizar preset"
                  }
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={!selectedUserPreset || isBuiltinPresetSelected}
                  onClick={deleteSelectedPreset}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                  title={
                    isBuiltinPresetSelected
                      ? "Presets sugeridos não podem ser excluídos"
                      : "Excluir preset"
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </details>

      {/* Sort Modal (Mobile) */}
      {isSortModalOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSortModalOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ordenar por
              </h3>
              <button
                type="button"
                onClick={() => setIsSortModalOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {[
                { value: "newest", label: "Mais recentes" },
                { value: "oldest", label: "Mais antigas" },
                { value: "status", label: "Por status" },
                { value: "client", label: "Por cliente" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSort(option.value as SortOption);
                    setIsSortModalOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                    sort === option.value
                      ? "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasAnyFiltersActive ? (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <div
            className="text-xs text-gray-500 dark:text-gray-400 flex-1 min-w-0 truncate"
            title={activeFiltersSummaryDisplay.full}
          >
            <span className="font-medium text-gray-700 dark:text-gray-200">
              Filtros:
            </span>{" "}
            {activeFiltersSummaryDisplay.text}
          </div>

          <div className="w-full flex flex-wrap gap-2">
            {statusFilter !== "all" ? (
              <ActiveFilterChip
                label={`Status: ${statusConfig[statusFilter]?.label || statusFilter}`}
                onClear={() => setStatusFilter("all")}
              />
            ) : null}

            {searchTerm.trim() ? (
              <ActiveFilterChip
                label={`Busca: “${searchTerm.trim()}”`}
                onClear={() => setSearchTerm("")}
              />
            ) : null}

            {voucherFilter !== "all" ? (
              <ActiveFilterChip
                label={
                  voucherFilter === "with" ? "Voucher: com" : "Voucher: sem"
                }
                onClear={() => setVoucherFilter("all")}
              />
            ) : null}

            {redeemedFilter !== "all" ? (
              <ActiveFilterChip
                label={
                  redeemedFilter === "redeemed"
                    ? "Resgate: resgatadas"
                    : "Resgate: não resgatadas"
                }
                onClear={() => setRedeemedFilter("all")}
              />
            ) : null}

            {creditFilter !== "all" ? (
              <ActiveFilterChip
                label={
                  creditFilter === "reserved"
                    ? "Crédito: reservado"
                    : creditFilter === "consumed"
                      ? "Crédito: usado"
                      : creditFilter === "refunded"
                        ? "Crédito: devolvido"
                        : creditFilter === "not_required"
                          ? "Crédito: sem custo"
                          : "Crédito: desconhecido"
                }
                onClear={() => setCreditFilter("all")}
              />
            ) : null}

            {viewFilter !== "all" ? (
              <ActiveFilterChip
                label={
                  viewFilter === "needs_action"
                    ? "Visão: precisa de ação"
                    : "Visão"
                }
                onClear={() => setViewFilter("all")}
              />
            ) : null}

            {createdPeriod !== "all" ? (
              <ActiveFilterChip
                label={
                  createdPeriod === "custom" &&
                  (createdFrom.trim() || createdTo.trim())
                    ? `Criadas: ${createdFrom.trim() || "…"} → ${
                        createdTo.trim() || "…"
                      }`
                    : `Criadas: ${getPeriodLabel(createdPeriod)}`
                }
                onClear={() => {
                  setCreatedPeriod("all");
                  setCreatedFrom("");
                  setCreatedTo("");
                }}
              />
            ) : null}

            {redeemedPeriod !== "all" ? (
              <ActiveFilterChip
                label={
                  redeemedPeriod === "custom" &&
                  (redeemedFrom.trim() || redeemedTo.trim())
                    ? `Resgate (data): ${redeemedFrom.trim() || "…"} → ${
                        redeemedTo.trim() || "…"
                      }`
                    : `Resgate (data): ${getPeriodLabel(redeemedPeriod)}`
                }
                onClear={() => {
                  setRedeemedPeriod("all");
                  setRedeemedFrom("");
                  setRedeemedTo("");
                }}
              />
            ) : null}

            {sort !== "newest" ? (
              <ActiveFilterChip
                label={
                  sort === "oldest"
                    ? "Ordenação: mais antigas"
                    : sort === "status"
                      ? "Ordenação: status"
                      : "Ordenação: cliente"
                }
                onClear={() => setSort("newest")}
              />
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setIncludeArchived(false);
              setSort("newest");
              setVoucherFilter("all");
              setRedeemedFilter("all");
              setCreditFilter("all");
              setViewFilter("all");
              setCreatedPeriod("all");
              setCreatedFrom("");
              setCreatedTo("");
              setRedeemedPeriod("all");
              setRedeemedFrom("");
              setRedeemedTo("");
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      ) : null}

      <details className="mb-3 group">
        <summary className="list-none cursor-pointer flex items-center justify-between gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
          <span className="inline-flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Filtros avançados
            {(voucherFilter !== "all" ||
              redeemedFilter !== "all" ||
              creditFilter !== "all" ||
              viewFilter !== "all" ||
              createdPeriod !== "all" ||
              redeemedPeriod !== "all") && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 text-white text-xs font-bold">
                {(voucherFilter !== "all" ? 1 : 0) +
                  (redeemedFilter !== "all" ? 1 : 0) +
                  (creditFilter !== "all" ? 1 : 0) +
                  (viewFilter !== "all" ? 1 : 0) +
                  (createdPeriod !== "all" ? 1 : 0) +
                  (redeemedPeriod !== "all" ? 1 : 0)}
              </span>
            )}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Visão
            </span>
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="needs_action">Precisa de ação</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Voucher
            </span>
            <select
              value={voucherFilter}
              onChange={(e) =>
                setVoucherFilter(e.target.value as VoucherFilter)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todos</option>
              <option value="with">Com voucher</option>
              <option value="without">Sem voucher</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Resgate
            </span>
            <select
              value={redeemedFilter}
              onChange={(e) =>
                setRedeemedFilter(e.target.value as RedeemedFilter)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="not_redeemed">Não resgatadas</option>
              <option value="redeemed">Resgatadas</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Crédito
            </span>
            <select
              value={creditFilter}
              onChange={(e) => setCreditFilter(e.target.value as CreditFilter)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todos</option>
              <option value="reserved">Reservado</option>
              <option value="consumed">Usado</option>
              <option value="refunded">Devolvido</option>
              <option value="not_required">Sem custo</option>
              <option value="unknown">Desconhecido</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Criadas
            </span>
            <select
              value={createdPeriod}
              onChange={(e) => {
                const next = e.target.value as PeriodFilter;
                setCreatedPeriod(next);
                if (next !== "custom") {
                  setCreatedFrom("");
                  setCreatedTo("");
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tudo</option>
              <option value="last_7">Últimos 7 dias</option>
              <option value="last_30">Últimos 30 dias</option>
              <option value="last_90">Últimos 90 dias</option>
              <option value="custom">Intervalo…</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Resgate (data)
            </span>
            <select
              value={redeemedPeriod}
              onChange={(e) => {
                const next = e.target.value as PeriodFilter;
                setRedeemedPeriod(next);
                if (next !== "custom") {
                  setRedeemedFrom("");
                  setRedeemedTo("");
                }
                if (next !== "all") {
                  setRedeemedFilter("redeemed");
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tudo</option>
              <option value="last_7">Últimos 7 dias</option>
              <option value="last_30">Últimos 30 dias</option>
              <option value="last_90">Últimos 90 dias</option>
              <option value="custom">Intervalo…</option>
            </select>
          </label>
        </div>

        {(createdPeriod === "custom" || redeemedPeriod === "custom") && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {createdPeriod === "custom" ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Criadas — intervalo
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      De
                    </span>
                    <input
                      type="date"
                      value={createdFrom}
                      onChange={(e) => setCreatedFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      Até
                    </span>
                    <input
                      type="date"
                      value={createdTo}
                      onChange={(e) => setCreatedTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {redeemedPeriod === "custom" ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Resgate — intervalo
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      De
                    </span>
                    <input
                      type="date"
                      value={redeemedFrom}
                      onChange={(e) => setRedeemedFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      Até
                    </span>
                    <input
                      type="date"
                      value={redeemedTo}
                      onChange={(e) => setRedeemedTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </details>
      {isLoading ? (
        <PartnerLoadingState variant="section" label="Carregando entregas…" />
      ) : filteredDeliveries.length === 0 ? (
        <PartnerEmptyState
          variant="section"
          icon={Package}
          title={
            searchTerm || statusFilter !== "all"
              ? "Nenhuma entrega encontrada"
              : "Nenhuma entrega ainda"
          }
          description={
            searchTerm || statusFilter !== "all"
              ? "Tente ajustar seus filtros de busca."
              : "Crie sua primeira entrega para começar."
          }
          primaryAction={
            !searchTerm && statusFilter === "all"
              ? {
                  label: "Criar primeira entrega",
                  to: "/partner/deliveries/new",
                  icon: Plus,
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Mostrando <span className="font-medium">{showingCount}</span> de{" "}
              <span className="font-medium">{total}</span>
            </span>
            {isFetching && !isFetchingNextPage ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Atualizando…
              </span>
            ) : null}
          </div>

          {/* Mobile / Tablet: cards */}
          <div className="grid gap-3 lg:hidden">
            {filteredDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onArchive={(archive) => handleArchive(delivery, archive)}
                isArchiving={
                  archiveMutation.isPending &&
                  archiveMutation.variables?.id === delivery.id
                }
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-auto max-h-[70vh]">
                <table className="min-w-[920px] w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="sticky top-0 z-10 text-left font-medium px-4 py-2.5 bg-gray-50 dark:bg-gray-900/30">
                        Entrega
                      </th>
                      <th className="sticky top-0 z-10 text-left font-medium px-4 py-2.5 bg-gray-50 dark:bg-gray-900/30">
                        Cliente
                      </th>
                      <th className="sticky top-0 z-10 text-left font-medium px-4 py-2.5 bg-gray-50 dark:bg-gray-900/30">
                        Status
                      </th>
                      <th className="sticky top-0 z-10 text-left font-medium px-4 py-2.5 bg-gray-50 dark:bg-gray-900/30">
                        Criada em
                      </th>
                      <th className="sticky top-0 z-10 text-left font-medium px-4 py-2.5 bg-gray-50 dark:bg-gray-900/30">
                        <span
                          title="Código do voucher e status de cobrança (crédito)"
                          aria-label="Voucher e crédito"
                        >
                          Voucher / Crédito
                        </span>
                      </th>
                      <th className="sticky top-0 z-10 text-right font-medium px-4 py-2.5 bg-gray-50 dark:bg-gray-900/30">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredDeliveries.map((delivery) => (
                      <DeliveryTableRow
                        key={delivery.id}
                        delivery={delivery}
                        isSelected={delivery.id === previewDeliveryId}
                        onPreview={() => setPreviewDeliveryId(delivery.id)}
                        onArchive={(archive) =>
                          handleArchive(delivery, archive)
                        }
                        isArchiving={
                          archiveMutation.isPending &&
                          archiveMutation.variables?.id === delivery.id
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando…
                  </>
                ) : (
                  "Carregar mais"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick preview (desktop-first) */}
      {previewDelivery && (
        <DeliveryQuickPreview
          delivery={previewDelivery}
          onClose={() => setPreviewDeliveryId(null)}
          onPrev={goPreviewPrev}
          onNext={goPreviewNext}
          canPrev={canPreviewPrev}
          canNext={canPreviewNext}
        />
      )}
    </PartnerPage>
  );
}

// =============================================================================
// Delivery Card (mobile)
// =============================================================================

interface DeliveryRowProps {
  delivery: Delivery;
  onArchive: (archive: boolean) => void;
  isArchiving: boolean;
}

function DeliveryCard({ delivery, onArchive, isArchiving }: DeliveryRowProps) {
  const isArchived = isDeliveryArchived(delivery);
  const displayStatus = getDeliveryDisplayStatus(delivery);
  const hasVoucher = Boolean(delivery.voucher_code);

  return (
    <Link
      to={`/partner/deliveries/${delivery.id}`}
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-all ${
        isArchived ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Image className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {delivery.title || delivery.client_name || "Sem título"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {delivery.client_name && delivery.title
                ? delivery.client_name
                : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={displayStatus} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span>{formatDate(delivery.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            {delivery.voucher_code ? (
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                {delivery.voucher_code}
              </span>
            ) : (
              <span
                className="text-xs text-gray-400 dark:text-gray-500"
                title={
                  displayStatus === "ready"
                    ? "Entrega pronta. Gere o voucher nos detalhes."
                    : "O voucher aparece após a entrega ficar pronta."
                }
              >
                Não gerado
              </span>
            )}
            <CreditStatusBadge
              status={delivery.credit_status}
              variant={hasVoucher ? "subtle" : "pill"}
            />
          </div>
          <ArchiveAction
            isArchived={isArchived}
            isArchiving={isArchiving}
            onArchive={onArchive}
          />
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// Delivery table row (desktop)
// =============================================================================

interface DeliveryTableRowProps {
  delivery: Delivery;
  isSelected: boolean;
  onPreview: () => void;
  onArchive: (archive: boolean) => void;
  isArchiving: boolean;
}

function DeliveryTableRow({
  delivery,
  isSelected,
  onPreview,
  onArchive,
  isArchiving,
}: DeliveryTableRowProps) {
  const isArchived = isDeliveryArchived(delivery);
  const displayStatus = getDeliveryDisplayStatus(delivery);
  const hasVoucher = Boolean(delivery.voucher_code);

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as Element | null;
    const isInteractive = !!target?.closest(
      "a,button,input,select,textarea,[role='button']",
    );
    if (isInteractive) return;
    onPreview();
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`
        group
        cursor-pointer
        hover:bg-gray-50 dark:hover:bg-gray-700/30
        transition-colors
        ${isArchived ? "opacity-70" : ""}
        ${
          isSelected
            ? "bg-pink-50/60 dark:bg-pink-900/10"
            : "bg-white dark:bg-transparent"
        }
      `}
    >
      <td className="px-4 py-2.5">
        <Link
          to={`/partner/deliveries/${delivery.id}`}
          className="flex items-center gap-3 min-w-0"
        >
          <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {delivery.title || delivery.client_name || "Sem título"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              ID: {delivery.id}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">
        <span className="truncate block max-w-[220px]">
          {delivery.client_name || "—"}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={displayStatus} />
      </td>
      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">
        {formatDate(delivery.created_at)}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex flex-col gap-1">
          {delivery.voucher_code ? (
            <span className="inline-block max-w-[160px] truncate align-middle text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
              {delivery.voucher_code}
            </span>
          ) : (
            <span
              className="text-gray-400"
              title={
                displayStatus === "ready"
                  ? "Entrega pronta. Gere o voucher nos detalhes."
                  : "O voucher aparece após a entrega ficar pronta."
              }
            >
              Não gerado
            </span>
          )}
          <CreditStatusBadge
            status={delivery.credit_status}
            variant={hasVoucher ? "subtle" : "pill"}
          />
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPreview();
            }}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Prévia"
            aria-label="Abrir prévia"
          >
            <Eye className="w-4 h-4" />
          </button>

          <ArchiveAction
            isArchived={isArchived}
            isArchiving={isArchiving}
            onArchive={onArchive}
          />

          <Link
            to={`/partner/deliveries/${delivery.id}`}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Abrir detalhes"
            aria-label="Abrir detalhes"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// Shared archive action
// =============================================================================

function ArchiveAction({
  isArchived,
  isArchiving,
  onArchive,
}: {
  isArchived: boolean;
  isArchiving: boolean;
  onArchive: (archive: boolean) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isArchived) {
      onArchive(false);
    } else {
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

  if (showConfirm) {
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg px-2 py-1">
        <span className="hidden sm:inline text-xs text-yellow-700 dark:text-yellow-300 mr-1">
          Arquivar?
        </span>
        <button
          type="button"
          onClick={handleConfirmArchive}
          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded transition-colors"
          title="Confirmar"
          aria-label="Confirmar arquivamento"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCancelArchive}
          className="p-1 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
          title="Cancelar"
          aria-label="Cancelar arquivamento"
        >
          <X className="w-4 h-4" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleArchiveClick}
      disabled={isArchiving}
      title={isArchived ? "Desarquivar entrega" : "Arquivar entrega"}
      aria-label={isArchived ? "Desarquivar entrega" : "Arquivar entrega"}
      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {isArchiving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isArchived ? (
        <ArchiveRestore className="w-4 h-4" />
      ) : (
        <Archive className="w-4 h-4" />
      )}
    </button>
  );
}

// =============================================================================
// Quick preview (slide-over)
// =============================================================================

function DeliveryQuickPreview({
  delivery,
  onClose,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  delivery: Delivery;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  const isArchived = isDeliveryArchived(delivery);
  const displayStatus = getDeliveryDisplayStatus(delivery);
  const title = delivery.title || delivery.client_name || "Entrega";
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const hasVoucher = Boolean(delivery.voucher_code);
  const canGenerateVoucher =
    displayStatus === "ready" && !hasVoucher && delivery.assets_count > 0;
  const isDirectImport = delivery.credit_status === "not_required";

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(message);
    } catch {
      try {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopiedMessage(message);
      } catch {
        setCopiedMessage("Não foi possível copiar");
      }
    } finally {
      window.setTimeout(() => setCopiedMessage(null), 1600);
    }
  };

  const deliveryUrl = new URL(
    `/partner/deliveries/${delivery.id}`,
    window.location.origin,
  ).toString();

  const timeline = getDeliveryTimeline(delivery);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="Fechar prévia"
      />
      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Prévia
                </p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {title}
                </h2>
                <div className="mt-2">
                  <StatusBadge status={displayStatus} />
                  {isArchived && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      (arquivada)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!canPrev}
                  className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Entrega anterior"
                  title="Anterior (← ou k)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!canNext}
                  className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Próxima entrega"
                  title="Próxima (→ ou j)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Fechar"
                  title="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 overflow-auto">
            <div className="space-y-4">
              {copiedMessage && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                  {copiedMessage}
                </div>
              )}

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ações rápidas
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deliveryUrl, "Link copiado")}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Copiar link
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(delivery.id, "ID copiado")}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <Package className="w-4 h-4" />
                    Copiar ID
                  </button>
                  {delivery.voucher_code ? (
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          delivery.voucher_code!,
                          "Voucher copiado",
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                      title="Copiar voucher"
                      aria-label="Copiar voucher"
                    >
                      <Gift className="w-4 h-4" />
                      Copiar voucher
                    </button>
                  ) : canGenerateVoucher ? (
                    <Link
                      to={`/partner/deliveries/${delivery.id}?openVoucher=1`}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors text-sm font-medium"
                      title={
                        isDirectImport
                          ? "Gerar link de importação"
                          : "Gerar voucher"
                      }
                      aria-label={
                        isDirectImport
                          ? "Gerar link de importação"
                          : "Gerar voucher"
                      }
                    >
                      <Ticket className="w-4 h-4" />
                      {isDirectImport ? "Gerar link" : "Gerar voucher"}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 transition-colors text-sm font-medium opacity-50"
                      title="Voucher não gerado"
                      aria-label="Voucher não gerado"
                    >
                      <Gift className="w-4 h-4" />
                      Voucher
                    </button>
                  )}

                  <Link
                    to={`/partner/deliveries/${delivery.id}`}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Abrir
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cliente
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {delivery.client_name || "—"}
                </p>
                {delivery.redeemed_at && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Resgatado em {formatDateTime(delivery.redeemed_at)}
                    {delivery.redeemed_by ? ` por ${delivery.redeemed_by}` : ""}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Arquivos
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {delivery.assets_count}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Criada em
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(delivery.created_at)}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Voucher / Crédito
                </p>
                {delivery.voucher_code ? (
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {delivery.voucher_code}
                    </p>
                    <CreditStatusBadge
                      status={delivery.credit_status}
                      variant="subtle"
                    />
                  </div>
                ) : (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Não gerado
                    </p>
                    <CreditStatusBadge
                      status={delivery.credit_status}
                      variant={hasVoucher ? "subtle" : "pill"}
                    />
                    {displayStatus === "ready" ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Dica: abra os detalhes para gerar o voucher.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Histórico
                </p>
                <div className="mt-3">
                  <DeliveryTimeline items={timeline} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            {canGenerateVoucher ? (
              <Link
                to={`/partner/deliveries/${delivery.id}?openVoucher=1`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors font-medium"
              >
                <Ticket className="w-4 h-4" />
                {isDirectImport ? "Gerar link de importação" : "Gerar voucher"}
              </Link>
            ) : null}
            {delivery.status === "pending_upload" && (
              <Link
                to={`/partner/deliveries/${delivery.id}/upload`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                Enviar arquivos
              </Link>
            )}
            <Link
              to={`/partner/deliveries/${delivery.id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors font-medium"
            >
              Abrir detalhes
              <ChevronRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Dica: <span className="font-medium">Esc</span> fecha •{" "}
              <span className="font-medium">←/→</span> navega.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

type TimelineItem = {
  key: string;
  title: string;
  subtitle?: string;
  state: "done" | "current" | "pending";
  icon: typeof Clock;
};

function getDeliveryTimeline(delivery: Delivery): TimelineItem[] {
  const effectiveStatus: DeliveryStatus =
    delivery.status === "failed" ? "processing" : delivery.status;

  const isDone = (status: DeliveryStatus) => {
    const order: DeliveryStatus[] = [
      "draft",
      "pending_upload",
      "processing",
      "ready",
      "delivered",
      "archived",
    ];
    return order.indexOf(effectiveStatus) >= order.indexOf(status);
  };

  const created: TimelineItem = {
    key: "created",
    title: "Entrega criada",
    subtitle: formatDateTime(delivery.created_at),
    state: "done",
    icon: Clock,
  };

  const upload: TimelineItem = {
    key: "upload",
    title: "Upload",
    subtitle:
      delivery.status === "draft"
        ? "Aguardando iniciar"
        : "Em andamento / concluído",
    state:
      delivery.status === "pending_upload"
        ? "current"
        : isDone("pending_upload")
          ? "done"
          : "pending",
    icon: Upload,
  };

  const processing: TimelineItem = {
    key: "processing",
    title: "Processamento",
    subtitle:
      delivery.status === "failed"
        ? "Falhou no processamento"
        : delivery.status === "processing"
          ? "Estamos preparando seus arquivos"
          : isDone("processing")
            ? "Concluído"
            : "Pendente",
    state:
      delivery.status === "failed" || delivery.status === "processing"
        ? "current"
        : isDone("processing")
          ? "done"
          : "pending",
    icon: Loader2,
  };

  const ready: TimelineItem = {
    key: "ready",
    title: "Pronta",
    subtitle:
      delivery.status === "ready"
        ? "Entrega pronta para envio"
        : isDone("ready")
          ? "Concluído"
          : "Pendente",
    state:
      delivery.status === "ready"
        ? "current"
        : isDone("ready")
          ? "done"
          : "pending",
    icon: CheckCircle2,
  };

  const voucher: TimelineItem = {
    key: "voucher",
    title: "Voucher",
    subtitle: delivery.voucher_code ? "Gerado" : "Não gerado",
    state: delivery.voucher_code ? "done" : "pending",
    icon: Gift,
  };

  const redeemed: TimelineItem = {
    key: "redeemed",
    title: "Resgate",
    subtitle: delivery.redeemed_at
      ? formatDateTime(delivery.redeemed_at)
      : "Aguardando cliente",
    state: delivery.redeemed_at
      ? "done"
      : delivery.status === "delivered"
        ? "current"
        : "pending",
    icon: Gift,
  };

  return [created, upload, processing, ready, voucher, redeemed];
}

function DeliveryTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-3">
      {items.map((it) => {
        const Icon = it.icon;
        const tone =
          it.state === "done"
            ? "text-emerald-600 dark:text-emerald-400"
            : it.state === "current"
              ? "text-pink-600 dark:text-pink-400"
              : "text-gray-400 dark:text-gray-500";

        const bg =
          it.state === "done"
            ? "bg-emerald-50 dark:bg-emerald-900/20"
            : it.state === "current"
              ? "bg-pink-50 dark:bg-pink-900/20"
              : "bg-gray-50 dark:bg-gray-800";

        return (
          <li key={it.key} className="flex items-start gap-3">
            <div
              className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800 ${bg}`}
            >
              <Icon
                className={`w-4 h-4 ${it.key === "processing" && it.state === "current" ? "animate-spin" : ""} ${tone}`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {it.title}
              </p>
              {it.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {it.subtitle}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default DeliveriesListPage;
