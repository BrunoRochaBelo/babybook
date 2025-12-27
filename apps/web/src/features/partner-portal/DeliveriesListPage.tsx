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
  PLACEHOLDER_NOT_GENERATED,
  PLACEHOLDER_NOT_INFORMED,
} from "./placeholders";
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
import {
  DeliveryFiltersModal,
  type DeliveryFilters,
} from "./components/DeliveryFiltersModal";

import { useTranslation, useLanguage } from "@babybook/i18n";

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Configuração agora armazena chaves de tradução
const statusConfig: Record<
  DeliveryStatus,
  { icon: typeof Clock; className: string; labelKey: string; shortLabelKey: string }
> = {
  draft: {
    icon: Clock,
    className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    labelKey: "partner.status.draft.label",
    shortLabelKey: "partner.status.draft.shortLabel",
  },
  pending_upload: {
    icon: Clock,
    className:
      "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    labelKey: "partner.status.pending_upload.label",
    shortLabelKey: "partner.status.pending_upload.shortLabel",
  },
  processing: {
    icon: Loader2,
    className:
      "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    labelKey: "partner.status.processing.label",
    shortLabelKey: "partner.status.processing.shortLabel",
  },
  ready: {
    icon: CheckCircle2,
    className:
      "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    labelKey: "partner.status.ready.label",
    shortLabelKey: "partner.status.ready.shortLabel",
  },
  delivered: {
    icon: Gift,
    className:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    labelKey: "partner.status.delivered.label",
    shortLabelKey: "partner.status.delivered.shortLabel",
  },
  failed: {
    icon: X,
    className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    labelKey: "partner.status.failed.label",
    shortLabelKey: "partner.status.failed.shortLabel",
  },
  archived: {
    icon: Package,
    className: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    labelKey: "partner.status.archived.label",
    shortLabelKey: "partner.status.archived.shortLabel",
  },
};

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const { t } = useTranslation();
  const cfg = statusConfig[status] || statusConfig.draft;
  const Icon = cfg.icon;
  const meta = getPartnerDeliveryStatusMeta(status);

  return (
    <span
      title={t(meta.hint)}
      aria-label={`${t(cfg.labelKey)}. ${t(meta.hint)}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon
        className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`}
      />
      <span className="sm:hidden">{t(cfg.shortLabelKey)}</span>
      <span className="hidden sm:inline">{t(cfg.labelKey)}</span>
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
  name: string; // Mantido como string, mas para builtins usaremos chave
  nameKey?: string; // Opcional para built-ins traduzíveis
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
    nameKey: "partner.deliveries.list.filters.presets.needsAction",
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
    nameKey: "partner.deliveries.list.filters.presets.withoutVoucher",
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
    nameKey: "partner.deliveries.list.filters.presets.redeemed",
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

function getPeriodLabel(
  period: PeriodFilter,
  t: (key: string) => string,
): string {
  // TODO: Add translation keys for periods
  if (period === "last_7") return "7 dias";
  if (period === "last_30") return "30 dias";
  if (period === "last_90") return "90 dias";
  if (period === "custom") return t("partner.credits.period.custom") || "intervalo";
  return t("partner.credits.period.all") || "tudo";
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
  const { t } = useTranslation();
  const { language } = useLanguage();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: t("partner.deliveries.list.title"),
        backTo: "/partner",
        backLabel: t("partner.deliveries.list.backToPortal"),
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
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  const [presets, setPresets] = useState<DeliveriesFilterPreset[]>(() =>
    safeLoadPresets(),
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatus);
  // Track the last processed URL to avoid re-running on state changes
  const lastProcessedUrlRef = useRef<string>("");

  useEffect(() => {
    // Only sync URL → State when the URL actually changed (browser navigation)
    const currentUrl = searchParams.toString();
    if (currentUrl === lastProcessedUrlRef.current) {
      return;
    }
    lastProcessedUrlRef.current = currentUrl;

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

    // Apply all states from URL
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
  }, [searchParams]);

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
        `${t("partner.deliveries.list.filters.status")}: ${statusConfig[statusFilter]?.labelKey ? t(statusConfig[statusFilter].labelKey) : statusFilter}`,
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
          ? `${t("partner.deliveries.list.filters.date")} ${createdFrom.trim() || "…"} → ${createdTo.trim() || "…"}`
          : `${t("partner.deliveries.list.filters.date")}: ${getPeriodLabel(createdPeriod, t)}`;
      parts.push(label);
    }

    if (redeemedPeriod !== "all") {
      const label =
        redeemedPeriod === "custom" &&
        (redeemedFrom.trim() || redeemedTo.trim())
          ? `${t("partner.deliveries.list.filters.redeemed")} ${redeemedFrom.trim() || "…"} → ${redeemedTo.trim() || "…"}`
          : `${t("partner.deliveries.list.filters.redeemed")}: ${getPeriodLabel(redeemedPeriod, t)}`;
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

  // Modal filter callbacks
  const currentModalFilters: DeliveryFilters = useMemo(
    () => ({
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
      redeemedTo,
    }),
    [
      voucherFilter,
      redeemedFilter,
      creditFilter,
      viewFilter,
      sort,
      createdPeriod,
      createdFrom,
      createdTo,
      redeemedPeriod,
      redeemedFrom,
      redeemedTo,
    ]
  );

  const applyFiltersFromModal = useCallback((filters: DeliveryFilters) => {
    setVoucherFilter(filters.voucher as VoucherFilter);
    setRedeemedFilter(filters.redeemed as RedeemedFilter);
    setCreditFilter(filters.credit as CreditFilter);
    setViewFilter(filters.view as ViewFilter);
    setSort(filters.sort as SortOption);
    setCreatedPeriod(filters.createdPeriod as PeriodFilter);
    setCreatedFrom(filters.createdFrom);
    setCreatedTo(filters.createdTo);
    setRedeemedPeriod(filters.redeemedPeriod as PeriodFilter);
    setRedeemedFrom(filters.redeemedFrom);
    setRedeemedTo(filters.redeemedTo);
  }, []);

  const resetAllFilters = useCallback(() => {
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
    setSelectedPresetId("");
  }, []);

  const createPresetFromModal = useCallback(
    (name: string) => {
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
    },
    [currentFiltersSnapshot]
  );

  const advancedFiltersCount = useMemo(() => {
    let count = 0;
    if (voucherFilter !== "all") count++;
    if (redeemedFilter !== "all") count++;
    if (creditFilter !== "all") count++;
    if (viewFilter !== "all") count++;
    if (createdPeriod !== "all") count++;
    if (redeemedPeriod !== "all") count++;
    if (sort !== "newest") count++;
    return count;
  }, [
    voucherFilter,
    redeemedFilter,
    creditFilter,
    viewFilter,
    createdPeriod,
    redeemedPeriod,
    sort,
  ]);

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
        <PartnerBackButton to="/partner" label={t("partner.deliveries.list.backToPortal")} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t("partner.deliveries.list.title")}
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
              {aggregations ? (
                <>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {aggregations.total}
                  </span>{" "}
                  {t("partner.deliveries.list.total")} •{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {aggregations.archived}
                  </span>{" "}
                  {t("partner.deliveries.list.archived")}
                </>
              ) : (
                <>{total} {t("partner.deliveries.list.deliveriesSuffix")}</>
              )}
            </p>
          </div>
          <Link
            to="/partner/deliveries/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t("partner.deliveries.newDelivery")}</span>
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          NOVA FILTER BAR MODERNIZADA
          ══════════════════════════════════════════════════════════════════════ */}

      {/* Filter Bar Unificada */}
      <div className="mb-4 space-y-3">
        {/* Linha principal: Busca + Filtros + Ordenação */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, voucher…"
              data-search-input="true"
              ref={searchInputRef}
              aria-label="Buscar entregas"
              title="Dica: pressione / para buscar"
              className="
                w-full pl-10 pr-9 py-2.5
                border border-gray-200 dark:border-gray-700 
                bg-white dark:bg-gray-800/80 
                text-gray-900 dark:text-white 
                rounded-xl 
                focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 
                placeholder:text-gray-400 dark:placeholder:text-gray-500 
                text-sm
                transition-all duration-200
                hover:border-gray-300 dark:hover:border-gray-600
              "
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botão Filtros - Abre o modal */}
          <button
            type="button"
            onClick={() => setIsFiltersModalOpen(true)}
            className={`
              relative inline-flex items-center gap-2 px-4 py-2.5
              border rounded-xl font-medium text-sm
              transition-all duration-200
              ${
                advancedFiltersCount > 0
                  ? "border-pink-300 dark:border-pink-700 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }
            `}
            title="Filtros avançados"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {advancedFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 text-white text-xs font-bold">
                {advancedFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Chips - Redesenhados */}
        <div
          className="flex items-center gap-2 overflow-x-auto bb-no-scrollbar pb-1 -mx-1 px-1"
          role="radiogroup"
          aria-label={t("partner.deliveries.list.filters.status")}
        >
          <StatusCounterChip
            label={t("partner.deliveries.list.filters.options.all")}
            title={t("partner.deliveries.status.all")}
            count={statusCounters.totalAll}
            active={includeArchived && statusFilter === "all"}
            onClick={() => {
              setIncludeArchived(true);
              setStatusFilter("all");
            }}
          />
          <StatusCounterChip
            label={t("partner.status.active")}
            title={t("partner.status.active")}
            count={statusCounters.activeTotal}
            active={!includeArchived && statusFilter === "all"}
            onClick={() => {
              setIncludeArchived(false);
              setStatusFilter("all");
            }}
          />

          <span className="h-5 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

          {Object.entries(statusConfig).map(([key, config]) => {
            if (key === "archived") return null; // Renderizado separadamente
            return (
              <StatusCounterChip
                key={key}
                label={t(config.shortLabelKey)}
                title={t(config.labelKey)}
                count={
                  statusCounters.byStatus[key as keyof typeof statusCounters.byStatus] ||
                  0
                }
                active={statusFilter === key}
                onClick={() => {
                  setIncludeArchived(false);
                  setStatusFilter(key as FilterStatus);
                }}
              />
            );
          })}

          <span className="h-5 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

          <StatusCounterChip
            label={t(statusConfig.archived.shortLabelKey)}
            title={t(statusConfig.archived.labelKey)}
            count={statusCounters.archivedCount}
            active={includeArchived && statusFilter === "archived"}
            onClick={() => {
              setIncludeArchived(true);
              setStatusFilter("archived");
            }}
          />
        </div>

        {/* Hint mobile - Deslize */}
        <p
          className="sm:hidden text-[10px] text-gray-400 dark:text-gray-500 text-center -mt-2"
          aria-hidden="true"
        >
          ← Deslize para ver mais →
        </p>
      </div>

      {/* Filtros Ativos - Chips removíveis */}
      {hasAnyFiltersActive && (
        <div className="mb-4 flex items-start gap-3 animate-fade-in">
          <div className="flex flex-wrap gap-2 flex-1">
            {statusFilter !== "all" && (
              <ActiveFilterChip
                label={`${t("partner.deliveries.list.filters.status")}: ${statusConfig[statusFilter]?.labelKey ? t(statusConfig[statusFilter].labelKey) : statusFilter}`}
                onClear={() => setStatusFilter("all")}
              />
            )}

            {searchTerm.trim() && (
              <ActiveFilterChip
                label={`Busca: "${searchTerm.trim()}"`}
                onClear={() => setSearchTerm("")}
              />
            )}

            {voucherFilter !== "all" && (
              <ActiveFilterChip
                label={voucherFilter === "with" ? "Com voucher" : "Sem voucher"}
                onClear={() => setVoucherFilter("all")}
              />
            )}

            {redeemedFilter !== "all" && (
              <ActiveFilterChip
                label={
                  redeemedFilter === "redeemed" ? "Resgatadas" : "Não resgatadas"
                }
                onClear={() => setRedeemedFilter("all")}
              />
            )}

            {creditFilter !== "all" && (
              <ActiveFilterChip
                label={
                  creditFilter === "reserved"
                    ? "Crédito reservado"
                    : creditFilter === "consumed"
                      ? "Crédito usado"
                      : creditFilter === "refunded"
                        ? "Crédito devolvido"
                        : creditFilter === "not_required"
                          ? "Sem custo"
                          : "Crédito: ?"
                }
                onClear={() => setCreditFilter("all")}
              />
            )}

            {viewFilter !== "all" && (
              <ActiveFilterChip
                label="Precisa de ação"
                onClear={() => setViewFilter("all")}
              />
            )}

            {createdPeriod !== "all" && (
              <ActiveFilterChip
                label={
                  createdPeriod === "custom" && (createdFrom || createdTo)
                    ? `${t("partner.deliveries.list.filters.date")}: ${createdFrom || "…"} → ${createdTo || "…"}`
                    : `${t("partner.deliveries.list.filters.date")}: ${getPeriodLabel(createdPeriod, t)}`
                }
                onClear={() => {
                  setCreatedPeriod("all");
                  setCreatedFrom("");
                  setCreatedTo("");
                }}
              />
            )}

            {redeemedPeriod !== "all" && (
              <ActiveFilterChip
                label={
                  redeemedPeriod === "custom" && (redeemedFrom || redeemedTo)
                    ? `${t("partner.deliveries.list.filters.redeemed")}: ${redeemedFrom || "…"} → ${redeemedTo || "…"}`
                    : `${t("partner.deliveries.list.filters.redeemed")}: ${getPeriodLabel(redeemedPeriod, t)}`
                }
                onClear={() => {
                  setRedeemedPeriod("all");
                  setRedeemedFrom("");
                  setRedeemedTo("");
                }}
              />
            )}

            {sort !== "newest" && (
              <ActiveFilterChip
                label={
                  sort === "oldest"
                    ? "Mais antigas"
                    : sort === "status"
                      ? "Por status"
                      : "Por cliente"
                }
                onClear={() => setSort("newest")}
              />
            )}
          </div>

          <button
            type="button"
            onClick={resetAllFilters}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Limpar todos os filtros"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      )}

      {/* Modal de Ordenação Mobile */}
      {isSortModalOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setIsSortModalOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 pb-8 animate-slide-up">
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
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
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

      {/* Modal de Filtros Avançados */}
      <DeliveryFiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        filters={currentModalFilters}
        onApply={applyFiltersFromModal}
        onReset={resetAllFilters}
        presets={presets}
        builtinPresets={BUILTIN_PRESETS}
        selectedPresetId={selectedPresetId}
        onSelectPreset={(preset) => {
          setSelectedPresetId(preset.id);
          applyPreset(preset);
          setIsFiltersModalOpen(false);
        }}
        onSavePreset={createPresetFromModal}
        onUpdatePreset={upsertSelectedPreset}
        onDeletePreset={deleteSelectedPreset}
        isBuiltinSelected={isBuiltinPresetSelected}
        hasUserPreset={!!selectedUserPreset}
      />
      {isLoading ? (
        <PartnerLoadingState variant="section" label="Carregando entregas…" />
      ) : filteredDeliveries.length === 0 ? (
        <PartnerEmptyState
          variant="section"
          icon={Package}
          title={
            searchTerm || statusFilter !== "all"
              ? "Nenhuma entrega encontrada"
              : "Tudo pronto para começar! 🎉"
          }
          description={
            searchTerm || statusFilter !== "all"
              ? "Tente ajustar os filtros ou buscar algo diferente."
              : "Crie sua primeira entrega e comece a encantar seus clientes."
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
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isArchived = isDeliveryArchived(delivery);
  const displayStatus = getDeliveryDisplayStatus(delivery);
  const hasVoucher = Boolean(delivery.voucher_code);

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all ${
        isArchived ? "opacity-70" : ""
      }`}
    >
      {/* Main Content - Clickable */}
      <Link
        to={`/partner/deliveries/${delivery.id}`}
        className="block p-4"
      >
        {/* Row 1: Icon + Title/Client + Status Badge */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white text-base leading-tight line-clamp-2">
                  {delivery.title || delivery.client_name || "Sem título"}
                </h3>
                {delivery.client_name && delivery.title && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {delivery.client_name}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <StatusBadge status={displayStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Date + Voucher Code */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {formatDate(delivery.created_at, language)}
          </span>
          {delivery.voucher_code ? (
            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md">
              {delivery.voucher_code}
            </span>
          ) : (
            <span
              className="text-xs text-gray-400 dark:text-gray-500 italic"
              title={
                displayStatus === "ready"
                  ? "Entrega pronta. Gere o voucher nos detalhes."
                  : "O voucher aparece após a entrega ficar pronta."
              }
            >
              {PLACEHOLDER_NOT_GENERATED}
            </span>
          )}
        </div>
      </Link>

      {/* Row 3: Credit Badge + Actions - Separated */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
        <CreditStatusBadge
          status={delivery.credit_status}
          variant={hasVoucher ? "subtle" : "pill"}
        />
        
        <div className="flex items-center gap-2">
          {/* Archive Button - Larger touch target */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onArchive(!isArchived);
            }}
            disabled={isArchiving}
            className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            title={isArchived ? t("partner.deliveries.archive.unarchive") : t("partner.deliveries.archive.action")}
            aria-label={isArchived ? t("partner.deliveries.archive.unarchive") : t("partner.deliveries.archive.action")}
          >
            {isArchiving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isArchived ? (
              <ArchiveRestore className="w-5 h-5" />
            ) : (
              <Archive className="w-5 h-5" />
            )}
          </button>
          
          {/* View Details Button - Primary action */}
          <Link
            to={`/partner/deliveries/${delivery.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t("partner.deliveries.actions.open")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
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
  const { t } = useTranslation();
  const { language } = useLanguage();
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
          {delivery.client_name || PLACEHOLDER_NOT_INFORMED}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={displayStatus} />
      </td>
      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">
        {formatDate(delivery.created_at, language)}
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
              {PLACEHOLDER_NOT_GENERATED}
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
            title={t("partner.deliveries.actions.preview")}
            aria-label={t("partner.deliveries.actions.preview")}
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
            title={t("partner.deliveries.actions.open")}
            aria-label={t("partner.deliveries.actions.open")}
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

  const { t } = useTranslation();
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
          title={t("common.confirm")}
          aria-label={t("common.confirm")}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCancelArchive}
          className="p-1 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
          title={t("common.cancel")}
          aria-label={t("common.cancel")}
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
      title={isArchived ? t("partner.deliveries.archive.unarchive") : t("partner.deliveries.archive.action")}
      aria-label={isArchived ? t("partner.deliveries.archive.unarchive") : t("partner.deliveries.archive.action")}
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
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isArchived = isDeliveryArchived(delivery);
  const displayStatus = getDeliveryDisplayStatus(delivery);
  const title = delivery.title || delivery.client_name || t("common.delivery");
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
        setCopiedMessage(t("partner.deliveries.actions.copyFailed"));
      }
    } finally {
      window.setTimeout(() => setCopiedMessage(null), 1600);
    }
  };

  const deliveryUrl = new URL(
    `/partner/deliveries/${delivery.id}`,
    window.location.origin,
  ).toString();

  const timeline = getDeliveryTimeline(delivery, language, t);

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
                  {t("partner.deliveries.actions.preview")}
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
                    onClick={() => copyToClipboard(deliveryUrl, t("partner.deliveries.actions.linkCopied"))}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    {t("partner.deliveries.actions.copyLink")}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(delivery.id, t("partner.deliveries.actions.idCopied"))}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <Package className="w-4 h-4" />
                    {t("partner.deliveries.actions.copyId")}
                  </button>
                  {delivery.voucher_code ? (
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          delivery.voucher_code!,
                          t("partner.deliveries.actions.voucherCopied"),
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                      title={t("partner.deliveries.actions.copyVoucher")}
                      aria-label={t("partner.deliveries.actions.copyVoucher")}
                    >
                      <Gift className="w-4 h-4" />
                      {t("partner.deliveries.actions.copyVoucher")}
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
                      title={`Voucher ${PLACEHOLDER_NOT_GENERATED.toLowerCase()}`}
                      aria-label={`Voucher ${PLACEHOLDER_NOT_GENERATED.toLowerCase()}`}
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
                  {t("partner.deliveries.sections.client")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {delivery.client_name || PLACEHOLDER_NOT_INFORMED}
                </p>
                {delivery.redeemed_at && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Resgatado em {formatDateTime(delivery.redeemed_at, language)}
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
                    {formatDate(delivery.created_at, language)}
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
                      {PLACEHOLDER_NOT_GENERATED}
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

function getDeliveryTimeline(
  delivery: Delivery,
  language: string,
  t: (key: string) => string,
): TimelineItem[] {
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
    subtitle: formatDateTime(delivery.created_at, language),
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
    subtitle: delivery.voucher_code ? "Gerado" : PLACEHOLDER_NOT_GENERATED,
    state: delivery.voucher_code ? "done" : "pending",
    icon: Gift,
  };

  const redeemed: TimelineItem = {
    key: "redeemed",
    title: "Resgate",
    subtitle: delivery.redeemed_at
      ? formatDateTime(delivery.redeemed_at, language)
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
