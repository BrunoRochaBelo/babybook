import { useState } from "react";
import { useHealthMeasurements, useCreateHealthMeasurement } from "@/hooks/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plus } from "lucide-react";
import { HudCard } from "@/components/HudCard";

interface HealthGrowthTabProps {
  childId: string;
}

export const HealthGrowthTab = ({ childId }: HealthGrowthTabProps) => {
  const { data: measurements = [] } = useHealthMeasurements(childId);
  const { mutate: createMeasurement, isPending } = useCreateHealthMeasurement();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const lastMeasurement = sortedMeasurements.at(-1);
  const measurementGoal = 12;
  const measurementsPercent =
    measurementGoal === 0
      ? 0
      : Math.min(
          100,
          Math.round((sortedMeasurements.length / measurementGoal) * 100),
        );
  const lastMeasurementDate = lastMeasurement
    ? new Date(lastMeasurement.date).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const hudValue = lastMeasurement
    ? `${lastMeasurement.weight ? `${lastMeasurement.weight} kg` : "--"} \u2022 ${
        lastMeasurement.height ? `${lastMeasurement.height} cm` : "--"
      }`
    : "Acompanhe peso e altura";
  const hudDescription = lastMeasurement
    ? `Atualizado em ${lastMeasurementDate}. ${sortedMeasurements.length} de ${measurementGoal} registros recomendados.`
    : "Registre peso e altura sempre que fizer uma medição oficial para alimentar o gráfico da próxima consulta.";

  const chartData = sortedMeasurements.map((measurement) => ({
    date: new Date(measurement.date).toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
    }),
    weight: measurement.weight,
    height: measurement.height,
  }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!date || (!weight && !height)) {
      return;
    }
    createMeasurement({
      childId,
      date,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
    });
    setDate("");
    setWeight("");
    setHeight("");
    setShowForm(false);
  };

  return (
    <section className="space-y-6">
      <HudCard
        title={"HUD \u2022 curva de crescimento"}
        value={hudValue}
        description={hudDescription}
        progressPercent={measurementsPercent}
        actions={
          <button
            type="button"
            onClick={() => setShowForm((state) => !state)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Fechar formulário" : "Adicionar medição"}
          </button>
        }
      />

      {lastMeasurement && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              Última medição
            </p>
            <p className="mt-2 text-ink">{lastMeasurementDate}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              Peso / Altura
            </p>
            <p className="mt-2 font-serif text-2xl text-ink">{hudValue}</p>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] border border-border bg-surface p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-3">
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
              Peso (kg)
              <input
                type="number"
                step="0.01"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="3,50"
                className="mt-2 rounded-2xl border border-border bg-transparent px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-ink">
              Altura (cm)
              <input
                type="number"
                step="0.1"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                placeholder="50"
                className="mt-2 rounded-2xl border border-border bg-transparent px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar medição"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex items-center justify-center rounded-2xl border border-border px-6 py-2 text-sm font-semibold text-ink transition hover:border-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {chartData.length > 0 ? (
        <div className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                Ver gráfico
              </p>
              <h3 className="font-serif text-xl text-ink">
                Peso x altura ao longo do tempo
              </h3>
            </div>
          </div>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E3DBCF" />
                <XAxis dataKey="date" stroke="#8C8C8C" />
                <YAxis stroke="#8C8C8C" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    borderColor: "#E3DBCF",
                  }}
                />
                {chartData.some((item) => item.weight) && (
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#F2995D"
                    strokeWidth={2}
                    name="Peso (kg)"
                    dot={false}
                  />
                )}
                {chartData.some((item) => item.height) && (
                  <Line
                    type="monotone"
                    dataKey="height"
                    stroke="#C76A6A"
                    strokeWidth={2}
                    name="Altura (cm)"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {sortedMeasurements.map((measurement) => (
              <div
                key={measurement.id}
                className="rounded-2xl border border-border px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {new Date(measurement.date).toLocaleDateString("pt-BR")}
                </p>
                <div className="mt-1 text-sm text-ink">
                  {typeof measurement.weight === "number" && (
                    <p>
                      Peso: <strong>{measurement.weight} kg</strong>
                    </p>
                  )}
                  {typeof measurement.height === "number" && (
                    <p>
                      Altura: <strong>{measurement.height} cm</strong>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-border bg-surface p-10 text-center shadow-sm">
          <p className="text-sm text-ink-muted">
            Nenhuma medição registrada ainda. Use o botão acima para começar o histórico oficial de crescimento.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Registrar primeira medição
          </button>
        </div>
      )}
    </section>
  );
};
