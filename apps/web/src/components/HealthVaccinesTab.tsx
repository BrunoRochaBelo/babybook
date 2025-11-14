import { useHealthVaccines } from "@/hooks/api";
import { CheckCircle, Clock3, Syringe, AlertCircle } from "lucide-react";

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

export const HealthVaccinesTab = ({ childId }: HealthVaccinesTabProps) => {
  const { data = [], isLoading } = useHealthVaccines(childId);

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Syringe className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              Vacinas
            </p>
            <h2 className="mt-1 font-serif text-2xl text-ink">
              Cartão de vacinação em dia
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Acompanhe doses previstas e registradas. Mantenha o cartão sempre
              atualizado para o pediatra e para futuras viagens.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              Histórico
            </p>
            <h3 className="font-serif text-xl text-ink">
              Próximas doses e registros
            </h3>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-surface-muted"
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-ink-muted">
            Nenhuma vacina registrada ainda. Adicione registros direto pelo
            pediatra ou importando do cartão físico.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {data.map((vaccine) => {
              const status = statusConfig[vaccine.status];
              const StatusIcon = status.icon;
              return (
                <li
                  key={vaccine.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{vaccine.name}</p>
                    <p className="text-xs text-ink-muted">
                      Prevista para{" "}
                      {new Date(vaccine.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                    {vaccine.appliedAt && (
                      <p className="text-xs text-ink-muted">
                        Aplicada em{" "}
                        {new Date(vaccine.appliedAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {vaccine.notes && (
                      <p className="mt-1 text-xs text-ink-muted">
                        {vaccine.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <StatusIcon className={status.className} />
                    <span className={status.className}>{status.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
