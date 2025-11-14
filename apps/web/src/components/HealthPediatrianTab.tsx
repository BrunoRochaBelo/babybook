import { useMemo, useState } from "react";
import { CalendarClock, FileText, Plus } from "lucide-react";
import { useCreateHealthVisit, useHealthVisits } from "@/hooks/api";
import { HudCard } from "@/components/HudCard";

interface HealthPediatrianTabProps {
  childId: string;
}

export const HealthPediatrianTab = ({ childId }: HealthPediatrianTabProps) => {
  const { data: visits = [], isLoading } = useHealthVisits(childId);
  const { mutate: createVisit, isPending } = useCreateHealthVisit();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const sortedVisits = useMemo(
    () =>
      [...visits].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [visits],
  );
  const lastVisit = sortedVisits[0];
  const hudValue = lastVisit
    ? new Date(lastVisit.date).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
      })
    : "Organize consultas e orientações";
  const hudDescription = lastVisit
    ? lastVisit.reason
    : "Registre consultas, vacinas e receituário para compartilhar com os responsáveis.";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!date || !reason) {
      return;
    }
    createVisit(
      {
        childId,
        date,
        reason,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setDate("");
          setReason("");
          setNotes("");
          setIsFormOpen(false);
        },
      },
    );
  };

  return (
    <section className="space-y-6">
      <HudCard
        title={"HUD \u2022 consultas pediátricas"}
        value={hudValue}
        description={hudDescription}
        actions={
          <button
            type="button"
            onClick={() => setIsFormOpen((state) => !state)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {isFormOpen ? "Fechar formulário" : "Registrar visita"}
          </button>
        }
      />

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] border border-border bg-surface p-6 shadow-sm"
        >
          <div className="grid gap-4">
            <label className="flex flex-col text-sm font-medium text-ink">
              Data
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 rounded-2xl border border-border bg-transparent px-3 py-2 text-sm focus:border-ink focus:outline-none"
                required
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-ink">
              Motivo
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Consulta de rotina, vacina, intercorrência..."
                className="mt-2 rounded-2xl border border-border bg-transparent px-3 py-2 text-sm focus:border-ink focus:outline-none"
                required
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-ink">
              Anotações
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Recomendações, medicamentos prescritos, próximos passos..."
                className="mt-2 resize-none rounded-2xl border border-border bg-transparent px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar visita"}
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="inline-flex items-center justify-center rounded-2xl border border-border px-6 py-2 text-sm font-semibold text-ink transition hover:border-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="rounded-[32px] border border-border bg-surface p-6 text-sm text-ink-muted shadow-sm">
          Carregando consultas...
        </div>
      ) : sortedVisits.length > 0 ? (
        <div className="space-y-4">
          {sortedVisits.map((visit) => (
            <article
              key={visit.id}
              className="rounded-[28px] border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 text-ink-muted">
                <CalendarClock className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.3em]">
                  {new Date(visit.date).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <h3 className="mt-2 font-serif text-xl text-ink">{visit.reason}</h3>
              {visit.notes && (
                <p className="mt-2 text-sm text-ink-muted">{visit.notes}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-border bg-surface p-10 text-center shadow-sm">
          <p className="text-sm text-ink-muted">
            Nenhuma consulta registrada ainda. Depois da próxima visita, anote aqui o motivo e as orientações do pediatra.
          </p>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <FileText className="h-4 w-4" />
            Registrar primeira visita
          </button>
        </div>
      )}
    </section>
  );
};
