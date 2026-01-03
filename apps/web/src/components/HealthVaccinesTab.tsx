import { useHealthVaccines } from "@/hooks/api";
import { motion } from "motion/react";
import { CheckCircle2, Clock3, AlertCircle, Syringe } from "lucide-react";
import { HudCard } from "@/components/HudCard";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import React, { useState } from "react";
import { HealthVaccineForm } from "@/components/HealthVaccineForm";
import { HealthCardDetailViewer } from "@/components/HealthCardDetailViewer";
import { cn } from "@/lib/utils";

interface HealthVaccinesTabProps {
  childId: string;
}

const statusConfig = {
  completed: {
    label: "Aplicada",
    icon: CheckCircle2,
    containerClass: "inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-semibold",
    style: {
      backgroundColor: "var(--bb-color-success)",
      color: "var(--bb-color-surface)",
      opacity: 0.9,
    },
    iconClass: "h-4 w-4",
  },
  scheduled: {
    label: "Agendada",
    icon: Clock3,
    containerClass: "flex items-center gap-2 text-sm font-semibold",
    style: {
      color: "var(--bb-color-accent)",
    },
    iconClass: "h-4 w-4",
  },
  overdue: {
    label: "Atrasada",
    icon: AlertCircle,
    containerClass: "flex items-center gap-2 text-sm font-semibold",
    style: {
      color: "var(--bb-color-danger)",
    },
    iconClass: "h-4 w-4",
  },
};

// ...



const VACCINE_CALENDAR = [
  { period: "Ao nascer", months: 0, vaccines: ["BCG", "Hepatite B"] },
  {
    period: "2 meses",
    months: 2,
    vaccines: [
      "Pentavalente (1ª dose)",
      "Poliomielite inativada (1ª dose)",
      "Rotavírus (1ª dose)",
      "Pneumocócica 13 (1ª dose)",
      "Meningocócica C (1ª dose)",
    ],
  },
  {
    period: "4 meses",
    months: 4,
    vaccines: [
      "Pentavalente (2ª dose)",
      "Poliomielite inativada (2ª dose)",
      "Rotavírus (2ª dose)",
      "Pneumocócica 13 (2ª dose)",
    ],
  },
  {
    period: "6 meses",
    months: 6,
    vaccines: [
      "Pentavalente (3ª dose)",
      "Poliomielite inativada (3ª dose)",
      "Hepatite B (3ª dose)",
    ],
  },
  { period: "9 meses", months: 9, vaccines: ["Febre amarela"] },
  {
    period: "12 meses",
    months: 12,
    vaccines: [
      "Tríplice viral",
      "Pneumocócica 13 (reforço)",
      "Meningocócica C (reforço)",
    ],
  },
  {
    period: "15 meses",
    months: 15,
    vaccines: ["Tetra viral", "Hepatite A", "DTP (1º reforço)"],
  },
];


import { B2CButton } from "@/components/B2CButton";
import { B2CErrorState } from "@/layouts/b2cStates";

export const HealthVaccinesTab = ({ childId }: HealthVaccinesTabProps) => {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useHealthVaccines(childId);
  const { selectedChild } = useSelectedChild();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVaccineForForm, setSelectedVaccineForForm] =
    useState<string>("");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const selectedEntry = data.find(e => e.id === selectedEntryId);

  const schedule = VACCINE_CALENDAR.map((section) => ({
    ...section,
    vaccines: section.vaccines.map((vaccineName) => {
      const entry =
        data.find((vaccine) =>
          vaccine.name.toLowerCase().includes(vaccineName.toLowerCase()),
        ) ?? null;
      return {
        name: vaccineName,
        entry,
      };
    }),
  }));

  const totalVaccines = schedule.reduce(
    (total, section) => total + section.vaccines.length,
    0,
  );
  const applied = data.filter(
    (vaccine) => vaccine.status === "completed",
  ).length;
  const percentage =
    totalVaccines === 0
      ? 0
      : Math.min(100, Math.round((applied / totalVaccines) * 100));

  // Determine Next Vaccine based on Age and Status
  const getNextVaccineInfo = () => {
    if (!selectedChild?.birthday) {
      return {
        title: "Próxima Vacina",
        description:
          "Atualize a data de nascimento para ver o calendário personalizado.",
        actions: null,
      };
    }

    const birthDate = new Date(selectedChild.birthday);
    const today = new Date();

    // Find the first vaccine that is NOT completed
    for (const section of schedule) {
      for (const vaccine of section.vaccines) {
        if (!vaccine.entry || vaccine.entry.status !== "completed") {
          // Found a pending vaccine
          const dueDate = new Date(birthDate);
          dueDate.setMonth(birthDate.getMonth() + section.months);

          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          const isOverdue = diffDays < 0;
          const statusText = isOverdue
            ? `Venceu há ${Math.abs(diffDays)} dias!`
            : diffDays === 0
              ? "Vence hoje!"
              : `Vence em ${diffDays} dias`;

          return {
            title: `Próxima: ${vaccine.name} (${section.period})`,
            description: statusText,
            isOverdue,
            actions: (
              <B2CButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedVaccineForForm(vaccine.name);
                  setIsFormOpen(true);
                }}
              >
                <Syringe className="h-4 w-4" />
                Marcar como tomada
              </B2CButton>
            ),
          };
        }
      }
    }
    return {
      title: "Vacinação em dia!",
      description: "Parabéns, todas as vacinas registradas foram aplicadas.",
      actions: null,
    };
  };

  const nextVaccine = getNextVaccineInfo();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div
          className="h-32 rounded-3xl animate-pulse"
          style={{ backgroundColor: "var(--bb-color-muted)" }}
        />
        <div
          className="h-64 rounded-[32px] animate-pulse"
          style={{ backgroundColor: "var(--bb-color-muted)" }}
        />
        <div
          className="h-64 rounded-[32px] animate-pulse"
          style={{ backgroundColor: "var(--bb-color-muted)" }}
        />
      </div>
    );
  }

  if (isError) {
    // ... (existing error handling)
    const skeleton = (
      <div className="space-y-6">
        {/* HUD Skeleton */}
        <div
          className="rounded-[32px] border p-6"
          style={{
            borderColor: "var(--bb-color-border)",
            backgroundColor: "var(--bb-color-surface)",
          }}
        >
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="h-8 w-12 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="mt-6 h-2 w-full rounded-full bg-gray-100 animate-pulse" />
        </div>
        {/* List Skeleton */}
        <div className="h-48 rounded-[32px] bg-gray-100 animate-pulse" />
      </div>
    );
    return (
      <B2CErrorState
        variant="section"
        title="Erro nas vacinas"
        description="Não foi possível carregar o cartão de vacinas."
        errorDetails={error?.message}
        onRetry={() => refetch()}
        skeleton={skeleton}
      />
    );
  }

  return (
    <section className="space-y-6">
      <HudCard
        title="Próxima Vacina"
        value={nextVaccine.title}
        description={nextVaccine.description}
        progressPercent={percentage}
        progressText={`${applied} de ${totalVaccines}`}
        actions={nextVaccine.actions}
      />

      {schedule.map((section) => (
        <div
          key={section.period}
          className="rounded-[32px] border border-border bg-surface p-6 shadow-sm"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {section.period}
          </p>
          <div className="mt-4 space-y-3">

            {section.vaccines.map(({ name, entry }) => {
              const status =
                (entry &&
                  statusConfig[entry.status as keyof typeof statusConfig]) ||
                statusConfig.scheduled;
              const StatusIcon = status?.icon || Clock3;

              return (
                <motion.button
                  key={name}
                  layoutId={entry ? `vaccine-card-${entry.id}` : undefined}
                  type="button"
                  onClick={() => {
                    if (entry && entry.status === "completed") {
                      setSelectedEntryId(entry.id);
                    } else {
                      setSelectedVaccineForForm(name);
                      setIsFormOpen(true);
                    }
                  }}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-4 w-full text-left rounded-2xl border border-border bg-surface px-4 py-3 transition-all",
                    "hover:border-[var(--bb-color-accent)] hover:shadow-sm active:scale-[0.99] cursor-pointer"
                  )}
                >
                  <div>
                    <p className="font-semibold text-ink">{name}</p>
                    {entry?.dueDate && (
                      <p className="text-xs text-ink-muted">
                        Prevista para{" "}
                        {new Date(entry.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {entry?.appliedAt ? (
                      <p className="text-xs text-ink-muted">
                        Aplicada em{" "}
                        {new Date(entry.appliedAt).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-muted">
                        Sem registro aplicado
                      </p>
                    )}
                  </div>
                  <div
                    className={status.containerClass}
                    style={status.style}
                  >
                    <StatusIcon className={status.iconClass} />
                    <span>{status.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
      <HealthVaccineForm
        childId={childId}
        vaccineName={selectedVaccineForForm}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      <HealthCardDetailViewer
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntryId(null)}
        title={selectedEntry?.name || "Detalhes da Vacina"}
        subtitle={selectedEntry?.appliedAt ? `Aplicada em ${new Date(selectedEntry.appliedAt).toLocaleDateString("pt-BR")}` : "Registro de Vacina"}
        icon={Syringe}
        layoutId={selectedEntry ? `vaccine-card-${selectedEntry.id}` : undefined}
      >
        {selectedEntry && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl bg-[var(--bb-color-bg)] p-6">
                <p className="text-sm font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)] mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <span 
                    className={cn(statusConfig[selectedEntry.status as keyof typeof statusConfig]?.containerClass)}
                    style={statusConfig[selectedEntry.status as keyof typeof statusConfig]?.style}
                  >
                    {React.createElement(statusConfig[selectedEntry.status as keyof typeof statusConfig]?.icon || Clock3, {
                      className: statusConfig[selectedEntry.status as keyof typeof statusConfig]?.iconClass
                    })}
                    <span className="ml-2">
                       {statusConfig[selectedEntry.status as keyof typeof statusConfig]?.label}
                    </span>
                  </span>
                </div>
              </div>

              {selectedEntry.appliedAt && (
                <div className="rounded-3xl bg-[var(--bb-color-bg)] p-6">
                  <p className="text-sm font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)] mb-2">Data da Aplicação</p>
                  <p className="text-lg font-semibold text-[var(--bb-color-ink)]">
                    {new Date(selectedEntry.appliedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>

            {selectedEntry.notes && (
              <div className="rounded-3xl bg-[var(--bb-color-bg)] p-6">
                <p className="text-sm font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)] mb-4">Observações</p>
                <p className="text-lg leading-relaxed text-[var(--bb-color-ink)] whitespace-pre-wrap">{selectedEntry.notes}</p>
              </div>
            )}
          </motion.div>
        )}
      </HealthCardDetailViewer>
    </section>
  );
};
