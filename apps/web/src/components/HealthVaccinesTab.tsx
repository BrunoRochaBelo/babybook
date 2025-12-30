import { useHealthVaccines } from "@/hooks/api";
import { CheckCircle, Clock3, AlertCircle } from "lucide-react";
import { HudCard } from "@/components/HudCard";

interface HealthVaccinesTabProps {
  childId: string;
}

const statusConfig = {
  completed: {
    label: "Aplicada",
    icon: CheckCircle,
    className: "text-success",
  },
  scheduled: {
    label: "Agendada",
    icon: Clock3,
    className: "text-accent",
  },
  overdue: {
    label: "Atrasada",
    icon: AlertCircle,
    className: "text-danger",
  },
};

const VACCINE_CALENDAR = [
  {
    period: "Ao nascer",
    vaccines: ["BCG", "Hepatite B"],
  },
  {
    period: "2 meses",
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
    vaccines: [
      "Pentavalente (2ª dose)",
      "Poliomielite inativada (2ª dose)",
      "Rotavírus (2ª dose)",
      "Pneumocócica 13 (2ª dose)",
    ],
  },
  {
    period: "6 meses",
    vaccines: [
      "Pentavalente (3ª dose)",
      "Poliomielite inativada (3ª dose)",
      "Hepatite B (3ª dose)",
    ],
  },
  {
    period: "9 meses",
    vaccines: ["Febre amarela"],
  },
  {
    period: "12 meses",
    vaccines: [
      "Tríplice viral",
      "Pneumocócica 13 (reforço)",
      "Meningocócica C (reforço)",
    ],
  },
  {
    period: "15 meses",
    vaccines: [
      "Tetra viral",
      "Hepatite A",
      "DTP (1º reforço)",
    ],
  },
];

import { B2CErrorState } from "@/layouts/b2cStates";

export const HealthVaccinesTab = ({ childId }: HealthVaccinesTabProps) => {
  const { data = [], isLoading, isError, error, refetch } = useHealthVaccines(childId);

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
  const applied = data.filter((vaccine) => vaccine.status === "completed")
    .length;
  const percentage =
    totalVaccines === 0
      ? 0
      : Math.min(100, Math.round((applied / totalVaccines) * 100));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-3xl animate-pulse" style={{ backgroundColor: "var(--bb-color-muted)" }} />
        <div className="h-64 rounded-[32px] animate-pulse" style={{ backgroundColor: "var(--bb-color-muted)" }} />
        <div className="h-64 rounded-[32px] animate-pulse" style={{ backgroundColor: "var(--bb-color-muted)" }} />
      </div>
    );
  }

  if (isError) {
    const skeleton = (
       <div className="space-y-6">
         <div className="h-64 rounded-[32px] animate-pulse" style={{ backgroundColor: "var(--bb-color-muted)" }} />
         <div className="h-64 rounded-[32px] animate-pulse" style={{ backgroundColor: "var(--bb-color-muted)" }} />
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
        title={"HUD \u2022 cartão de vacinas"}
        value={`${applied} de ${totalVaccines} vacinas registradas`}
        description="Acompanhe cada período do calendário nacional."
        progressPercent={percentage}
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
                  (entry && statusConfig[entry.status as keyof typeof statusConfig]) ||
                  statusConfig.scheduled;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={name}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-ink">{name}</p>
                      {entry?.dueDate && (
                        <p className="text-xs text-ink-muted">
                          Prevista para {new Date(entry.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                      {entry?.appliedAt ? (
                        <p className="text-xs text-ink-muted">
                          Aplicada em {new Date(entry.appliedAt).toLocaleDateString("pt-BR")}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-muted">Sem registro aplicado</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <StatusIcon className={status.className} />
                      <span className={status.className}>{status.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </section>
  );
};
