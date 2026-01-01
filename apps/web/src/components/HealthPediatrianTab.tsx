import { useMemo, useState } from "react";
import { CalendarClock, FileText, Plus, Stethoscope } from "lucide-react";
import { useHealthVisits } from "@/hooks/api";
import { HudCard } from "@/components/HudCard";
import { HealthVisitForm } from "@/components/HealthVisitForm";

interface HealthPediatrianTabProps {
  childId: string;
}

import { B2CErrorState } from "@/layouts/b2cStates";

export const HealthPediatrianTab = ({ childId }: HealthPediatrianTabProps) => {
  const { data: visits = [], isLoading, isError, error, refetch } = useHealthVisits(childId);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    
  let hudDescription = "Registre as consultas para manter o histórico médico organizado.";
  if (totalVisits > 0) {
     const visitText = totalVisits === 1 ? "visita realizada" : "visitas realizadas";
     hudDescription = `Última consulta. Total de ${totalVisits} ${visitText} até o momento.`;
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-3xl animate-pulse" style={{ backgroundColor: "var(--bb-color-muted)" }} />
        <div className="h-64 rounded-[32px] animate-pulse" style={{ backgroundColor: "var(--bb-color-muted)" }} />
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
        title="HUD • CONSULTAS PEDIÁTRICAS"
        value={hudValue}
        description={hudDescription}
        actions={
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nova Visita
          </button>
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
            <article
              key={visit.id}
              className="relative overflow-hidden rounded-[32px] border border-border bg-surface p-6 shadow-sm transition-all hover:border-ink/20 hover:shadow-md"
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
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {visit.notes}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-muted italic">Sem observações.</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-border bg-surface/50 p-12 text-center">
          <div className="mb-4 rounded-full bg-surface-hover p-4">
            <Stethoscope className="h-8 w-8 text-ink-muted" />
          </div>
          <h3 className="mb-2 font-serif text-lg text-ink">Nenhuma consulta registrada</h3>
          <p className="max-w-xs text-sm text-ink-muted">
            Comece registrando a primeira visita ao pediatra para manter o histórico de saúde organizado.
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
    </section>
  );
};
