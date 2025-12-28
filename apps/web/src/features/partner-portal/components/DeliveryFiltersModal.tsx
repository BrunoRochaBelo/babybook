/**
 * DeliveryFiltersDrawer
 *
 * Drawer lateral de filtros avançados para a página de entregas.
 * Design: glassmorphism suave, micro-animações, seções organizadas.
 * Responsivo: Side drawer em desktop, bottom sheet em mobile.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Filter,
  Bookmark,
  Save,
  Trash2,
  RotateCcw,
  Check,
  ChevronDown,
  Sparkles,
  Calendar,
  Ticket,
  Gift,
  CreditCard,
  Eye,
  ArrowUpDown,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";

// ─────────────────────────────────────────────────────────────────────────────
// Types (replicados do DeliveriesListPage para evitar circular deps)
// ─────────────────────────────────────────────────────────────────────────────

export type FilterStatus =
  | "all"
  | "draft"
  | "pending_upload"
  | "processing"
  | "ready"
  | "delivered"
  | "failed"
  | "archived";

export type SortOption = "newest" | "oldest" | "status" | "client";
export type VoucherFilter = "all" | "with" | "without";
export type RedeemedFilter = "all" | "redeemed" | "not_redeemed";
export type CreditFilter =
  | "all"
  | "reserved"
  | "consumed"
  | "refunded"
  | "not_required"
  | "unknown";
export type ViewFilter = "all" | "needs_action";
export type PeriodFilter = "all" | "last_7" | "last_30" | "last_90" | "custom";

export interface DeliveryFilters {
  voucher: VoucherFilter;
  redeemed: RedeemedFilter;
  credit: CreditFilter;
  view: ViewFilter;
  sort: SortOption;
  createdPeriod: PeriodFilter;
  createdFrom: string;
  createdTo: string;
  redeemedPeriod: PeriodFilter;
  redeemedFrom: string;
  redeemedTo: string;
}

export interface DeliveriesFilterPreset {
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
}

interface DeliveryFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DeliveryFilters;
  onApply: (filters: DeliveryFilters) => void;
  onReset: () => void;
  // Presets
  presets: DeliveriesFilterPreset[];
  builtinPresets: DeliveriesFilterPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: DeliveriesFilterPreset) => void;
  onSavePreset: (name: string) => void;
  onUpdatePreset: () => void;
  onDeletePreset: () => void;
  isBuiltinSelected: boolean;
  hasUserPreset: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function countActiveFilters(filters: DeliveryFilters): number {
  let count = 0;
  if (filters.voucher !== "all") count++;
  if (filters.redeemed !== "all") count++;
  if (filters.credit !== "all") count++;
  if (filters.view !== "all") count++;
  if (filters.createdPeriod !== "all") count++;
  if (filters.redeemedPeriod !== "all") count++;
  if (filters.sort !== "newest") count++;
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

interface FilterSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function FilterSection({ icon, title, children }: FilterSectionProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="space-y-3 pb-5 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0"
    >
      <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
        <span className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/30 text-pink-500 dark:text-pink-400">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </motion.div>
  );
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

function FilterSelect({
  value,
  onChange,
  options,
  className = "",
}: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full appearance-none px-4 py-2.5 pr-10 
          bg-white dark:bg-gray-800/80 
          border border-gray-200 dark:border-gray-700/80 
          rounded-xl 
          text-sm text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500
          transition-all duration-200
          cursor-pointer
          hover:border-gray-300 dark:hover:border-gray-600
          ${className}
        `}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

interface FilterChipButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterChipButton({
  active,
  onClick,
  children,
}: FilterChipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200 ease-out
        ${
          active
            ? "bg-pink-500 text-white shadow-md shadow-pink-500/25"
            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }
      `}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function DeliveryFiltersModal({
  isOpen,
  onClose,
  filters: initialFilters,
  onApply,
  onReset,
  presets,
  builtinPresets,
  selectedPresetId,
  onSelectPreset,
  onSavePreset,
  onUpdatePreset,
  onDeletePreset,
  isBuiltinSelected,
  hasUserPreset,
}: DeliveryFiltersModalProps) {
  // Local state for editing before applying
  const [localFilters, setLocalFilters] =
    useState<DeliveryFilters>(initialFilters);
  const [activeTab, setActiveTab] = useState<"filters" | "presets">("filters");
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Sync with external filters when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    onClose();
  }, [localFilters, onApply, onClose]);

  const handleReset = useCallback(() => {
    const defaultFilters: DeliveryFilters = {
      voucher: "all",
      redeemed: "all",
      credit: "all",
      view: "all",
      sort: "newest",
      createdPeriod: "all",
      createdFrom: "",
      createdTo: "",
      redeemedPeriod: "all",
      redeemedFrom: "",
      redeemedTo: "",
    };
    setLocalFilters(defaultFilters);
    onReset();
  }, [onReset]);

  const handleSavePreset = useCallback(() => {
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim());
      setNewPresetName("");
      setIsCreatingPreset(false);
    }
  }, [newPresetName, onSavePreset]);

  const updateFilter = useCallback(
    <K extends keyof DeliveryFilters>(key: K, value: DeliveryFilters[K]) => {
      setLocalFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const activeCount = countActiveFilters(localFilters);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {/* Header */}
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-900/30">
              <Filter className="w-5 h-5 text-pink-500 dark:text-pink-400" />
            </div>
            <div>
              <DrawerTitle>Filtros e Ordenação</DrawerTitle>
              {activeCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeCount} filtro{activeCount !== 1 ? "s" : ""} ativo
                  {activeCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </DrawerHeader>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-4">
          <button
            type="button"
            onClick={() => setActiveTab("filters")}
            className={`
              flex-1 py-3 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === "filters"
                  ? "border-pink-500 text-pink-500"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
              {activeCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400">
                  {activeCount}
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`
              flex-1 py-3 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === "presets"
                  ? "border-pink-500 text-pink-500"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <Bookmark className="w-4 h-4" />
              Salvos
              {presets.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {presets.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Content */}
        <DrawerBody>
          {activeTab === "filters" ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              {/* Ordenação */}
              <FilterSection
                icon={<ArrowUpDown className="w-4 h-4" />}
                title="Ordenar por"
              >
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "newest", label: "Mais recentes" },
                    { value: "oldest", label: "Mais antigas" },
                    { value: "status", label: "Status" },
                    { value: "client", label: "Cliente" },
                  ].map((opt) => (
                    <FilterChipButton
                      key={opt.value}
                      active={localFilters.sort === opt.value}
                      onClick={() =>
                        updateFilter("sort", opt.value as SortOption)
                      }
                    >
                      {opt.label}
                    </FilterChipButton>
                  ))}
                </div>
              </FilterSection>

              {/* Visão rápida */}
              <FilterSection
                icon={<Eye className="w-4 h-4" />}
                title="Visão rápida"
              >
                <div className="flex flex-wrap gap-2">
                  <FilterChipButton
                    active={localFilters.view === "all"}
                    onClick={() => updateFilter("view", "all")}
                  >
                    Todas
                  </FilterChipButton>
                  <FilterChipButton
                    active={localFilters.view === "needs_action"}
                    onClick={() => updateFilter("view", "needs_action")}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Precisa de ação
                    </span>
                  </FilterChipButton>
                </div>
              </FilterSection>

              {/* Voucher */}
              <FilterSection
                icon={<Ticket className="w-4 h-4" />}
                title="Voucher"
              >
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Todos" },
                    { value: "with", label: "Com voucher" },
                    { value: "without", label: "Sem voucher" },
                  ].map((opt) => (
                    <FilterChipButton
                      key={opt.value}
                      active={localFilters.voucher === opt.value}
                      onClick={() =>
                        updateFilter("voucher", opt.value as VoucherFilter)
                      }
                    >
                      {opt.label}
                    </FilterChipButton>
                  ))}
                </div>
              </FilterSection>

              {/* Resgate */}
              <FilterSection
                icon={<Gift className="w-4 h-4" />}
                title="Resgate"
              >
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Todas" },
                    { value: "redeemed", label: "Resgatadas" },
                    { value: "not_redeemed", label: "Não resgatadas" },
                  ].map((opt) => (
                    <FilterChipButton
                      key={opt.value}
                      active={localFilters.redeemed === opt.value}
                      onClick={() =>
                        updateFilter("redeemed", opt.value as RedeemedFilter)
                      }
                    >
                      {opt.label}
                    </FilterChipButton>
                  ))}
                </div>
              </FilterSection>

              {/* Crédito */}
              <FilterSection
                icon={<CreditCard className="w-4 h-4" />}
                title="Status do crédito"
              >
                <FilterSelect
                  value={localFilters.credit}
                  onChange={(v) => updateFilter("credit", v as CreditFilter)}
                  options={[
                    { value: "all", label: "Todos" },
                    { value: "reserved", label: "Reservado" },
                    { value: "consumed", label: "Usado" },
                    { value: "refunded", label: "Devolvido" },
                    { value: "not_required", label: "Sem custo" },
                    { value: "unknown", label: "Desconhecido" },
                  ]}
                />
              </FilterSection>

              {/* Período de criação */}
              <FilterSection
                icon={<Calendar className="w-4 h-4" />}
                title="Data de criação"
              >
                <FilterSelect
                  value={localFilters.createdPeriod}
                  onChange={(v) => {
                    updateFilter("createdPeriod", v as PeriodFilter);
                    if (v !== "custom") {
                      updateFilter("createdFrom", "");
                      updateFilter("createdTo", "");
                    }
                  }}
                  options={[
                    { value: "all", label: "Qualquer data" },
                    { value: "last_7", label: "Últimos 7 dias" },
                    { value: "last_30", label: "Últimos 30 dias" },
                    { value: "last_90", label: "Últimos 90 dias" },
                    { value: "custom", label: "Período personalizado" },
                  ]}
                />
                {localFilters.createdPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-3 mt-3 animate-slide-down">
                    <label className="block">
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        De
                      </span>
                      <input
                        type="date"
                        value={localFilters.createdFrom}
                        onChange={(e) =>
                          updateFilter("createdFrom", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Até
                      </span>
                      <input
                        type="date"
                        value={localFilters.createdTo}
                        onChange={(e) =>
                          updateFilter("createdTo", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                      />
                    </label>
                  </div>
                )}
              </FilterSection>

              {/* Período de resgate */}
              <FilterSection
                icon={<Calendar className="w-4 h-4" />}
                title="Data de resgate"
              >
                <FilterSelect
                  value={localFilters.redeemedPeriod}
                  onChange={(v) => {
                    updateFilter("redeemedPeriod", v as PeriodFilter);
                    if (v !== "custom") {
                      updateFilter("redeemedFrom", "");
                      updateFilter("redeemedTo", "");
                    }
                    if (v !== "all") {
                      updateFilter("redeemed", "redeemed");
                    }
                  }}
                  options={[
                    { value: "all", label: "Qualquer data" },
                    { value: "last_7", label: "Últimos 7 dias" },
                    { value: "last_30", label: "Últimos 30 dias" },
                    { value: "last_90", label: "Últimos 90 dias" },
                    { value: "custom", label: "Período personalizado" },
                  ]}
                />
                {localFilters.redeemedPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-3 mt-3 animate-slide-down">
                    <label className="block">
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        De
                      </span>
                      <input
                        type="date"
                        value={localFilters.redeemedFrom}
                        onChange={(e) =>
                          updateFilter("redeemedFrom", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Até
                      </span>
                      <input
                        type="date"
                        value={localFilters.redeemedTo}
                        onChange={(e) =>
                          updateFilter("redeemedTo", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                      />
                    </label>
                  </div>
                )}
              </FilterSection>
            </motion.div>
          ) : (
            /* Presets Tab */
            <div className="space-y-4">
              {/* Sugestões (Built-in) */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Sugestões
                </h3>
                <div className="space-y-2">
                  {builtinPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectPreset(preset)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200
                        ${
                          selectedPresetId === preset.id
                            ? "bg-pink-50 dark:bg-pink-900/30 border-2 border-pink-500"
                            : "bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                        }
                      `}
                    >
                      <Sparkles
                        className={`w-4 h-4 ${selectedPresetId === preset.id ? "text-pink-500" : "text-gray-400"}`}
                      />
                      <span
                        className={`flex-1 text-left text-sm font-medium ${selectedPresetId === preset.id ? "text-pink-700 dark:text-pink-300" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {preset.name}
                      </span>
                      {selectedPresetId === preset.id && (
                        <Check className="w-4 h-4 text-pink-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meus presets */}
              <div className="space-y-4">
                {/* Card de Salvar - sempre visível */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-100 dark:border-pink-800/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                      <Bookmark className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Salvar filtros atuais
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Guarde sua configuração para usar novamente
                      </p>

                      {!isCreatingPreset ? (
                        <button
                          type="button"
                          onClick={() => setIsCreatingPreset(true)}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                          <Save className="w-4 h-4" />
                          Salvar como preset
                        </button>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Nome do preset..."
                            autoFocus
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePreset();
                              if (e.key === "Escape")
                                setIsCreatingPreset(false);
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleSavePreset}
                            disabled={!newPresetName.trim()}
                            className="px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingPreset(false);
                              setNewPresetName("");
                            }}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Lista de presets salvos */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Meus filtros salvos
                  </h3>

                  {presets.length === 0 ? (
                    <div className="text-center py-6 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum preset salvo ainda
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Use o botão acima para salvar sua configuração
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {presets.map((preset) => (
                        <div
                          key={preset.id}
                          className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl
                          transition-all duration-200
                          ${
                            selectedPresetId === preset.id
                              ? "bg-pink-50 dark:bg-pink-900/30 border-2 border-pink-500"
                              : "bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent"
                          }
                        `}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectPreset(preset)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            <Bookmark
                              className={`w-4 h-4 ${selectedPresetId === preset.id ? "text-pink-500" : "text-gray-400"}`}
                            />
                            <span
                              className={`text-sm font-medium ${selectedPresetId === preset.id ? "text-pink-700 dark:text-pink-300" : "text-gray-700 dark:text-gray-300"}`}
                            >
                              {preset.name}
                            </span>
                          </button>
                          {selectedPresetId === preset.id && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={!hasUserPreset || isBuiltinSelected}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdatePreset();
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  !hasUserPreset || isBuiltinSelected
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30"
                                }`}
                                title={
                                  isBuiltinSelected
                                    ? "Presets padrão não podem ser atualizados"
                                    : "Atualizar preset"
                                }
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={!hasUserPreset || isBuiltinSelected}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePreset();
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  !hasUserPreset || isBuiltinSelected
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                                }`}
                                title={
                                  isBuiltinSelected
                                    ? "Presets padrão não podem ser excluídos"
                                    : "Excluir preset"
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>{" "}
                {/* Fecha Lista de presets salvos */}
              </div>
            </div>
          )}
        </DrawerBody>

        {/* Footer */}
        <DrawerFooter className="flex-row items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
          >
            <Check className="w-4 h-4" />
            Aplicar filtros
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default DeliveryFiltersModal;
