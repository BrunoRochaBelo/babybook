import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarClock, Plus, Stethoscope } from "lucide-react";
import { useHealthVisits } from "@/hooks/api";
import { HudCard } from "@/components/HudCard";
import { HealthVisitForm } from "@/components/HealthVisitForm";
import { HealthCardDetailViewer } from "@/components/HealthCardDetailViewer";
import { B2CErrorState } from "@/layouts/b2cStates";
import { B2CButton } from "@/components/B2CButton";

interface HealthPediatrianTabProps {
  childId: string;
}

export const HealthPediatrianTab = ({ childId }: HealthPediatrianTabProps) => {
  const {
    data: visits = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useHealthVisits(childId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
 
  const selectedVisit = visits.find(v => v.id === selectedVisitId);

  // Sorting
  const sortedVisits = useMemo(
    () =>
      [...visits].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [visits],
  );

  const lastVisit = sortedVisits[0];
  const totalVisits = sortedVisits.length;

  // HUD Data
  const hudValue = lastVisit
    ? new Date(lastVisit.date).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Nenhuma visita";

  let hudDescription =
    "Registre as consultas para manter o histórico médico organizado.";
  if (totalVisits > 0) {
    const visitText =
      totalVisits === 1 ? "visita realizada" : "visitas realizadas";
    hudDescription = `Última consulta. Total de ${totalVisits} ${visitText} até o momento.`;
  }

  // Loading State
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
      </div>
    );
  }

  // Error State
  if (isError) {
    const skeleton = (
      <div className="space-y-6">
        <div className="h-32 rounded-[32px] bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-[32px] bg-gray-100 animate-pulse" />
      </div>
    );
    return (
      <B2CErrorState
        variant="section"
        title="Erro nas consultas"
        description="Não foi possível carregar o histórico de visitas."
        errorDetails={error?.message}
        onRetry={() => refetch()}
        skeleton={skeleton}
      />
    );
  }

  return (
    <section className="space-y-6">
      <HudCard
        title="Consultas Pediátricas"
        value={hudValue}
        description={hudDescription}
        actions={
          <B2CButton
            variant="secondary"
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Visita
          </B2CButton>
        }
      />

      <HealthVisitForm
        childId={childId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      {sortedVisits.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {sortedVisits.map((visit) => (
            <motion.button
              key={visit.id}
              layoutId={`visit-card-${visit.id}`}
              type="button"
              onClick={() => setSelectedVisitId(visit.id)}
              className="relative w-full text-left overflow-hidden rounded-[32px] border border-border bg-surface p-6 shadow-sm transition-all hover:border-[var(--bb-color-accent)] hover:shadow-md active:scale-[0.99]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-surface-hover px-3 py-1">
                  <CalendarClock className="h-3.5 w-3.5 text-ink-muted" />
                  <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                    {new Date(visit.date).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              </div>

              <h3 className="mb-2 font-serif text-xl font-medium text-ink">
                {visit.reason}
              </h3>

              {visit.notes ? (
                <div className="mt-3 rounded-2xl bg-surface-hover/50 p-4">
                  <p className="text-sm line-clamp-2 leading-relaxed text-ink-muted">
                    {visit.notes}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-muted italic">
                  Sem observações.
                </p>
              )}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-border bg-surface/50 p-12 text-center">
          <div className="mb-4 rounded-full bg-surface-hover p-4">
            <Stethoscope className="h-8 w-8 text-ink-muted" />
          </div>
          <h3 className="mb-2 font-serif text-lg text-ink">
            Nenhuma consulta registrada
          </h3>
          <p className="max-w-xs text-sm text-ink-muted">
            Comece registrando a primeira visita ao pediatra para manter o
            histórico de saúde organizado.
          </p>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Registrar primeira visita
          </button>
        </div>
      )}
      <HealthCardDetailViewer
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisitId(null)}
        title={selectedVisit?.reason || "Detalhes da Consulta"}
        subtitle={selectedVisit ? new Date(selectedVisit.date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : ""}
        icon={Stethoscope}
        layoutId={selectedVisit ? `visit-card-${selectedVisit.id}` : undefined}
      >
        {selectedVisit && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="rounded-3xl bg-[var(--bb-color-bg)] p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)] mb-4">Motivo da Consulta</p>
              <p className="text-xl font-serif text-[var(--bb-color-ink)]">
                {selectedVisit.reason}
              </p>
            </div>
            
            <div className="rounded-3xl bg-[var(--bb-color-bg)] p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)] mb-4">Relato e Observações</p>
              {selectedVisit.notes ? (
                <p className="text-lg leading-relaxed text-[var(--bb-color-ink)] whitespace-pre-wrap">
                  {selectedVisit.notes}
                </p>
              ) : (
                <p className="text-lg italic text-[var(--bb-color-ink-muted)]">
                  Nenhuma observação registrada para esta consulta.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </HealthCardDetailViewer>
    </section>
  );
};
