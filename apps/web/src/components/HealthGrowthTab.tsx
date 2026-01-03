import { useState } from "react";
import { motion } from "motion/react";
import { useHealthMeasurements } from "@/hooks/api";
import {
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Plus, Maximize2, Activity } from "lucide-react";
import { HudCard } from "@/components/HudCard";
import { useTheme } from "@/hooks/useTheme";
import { B2CErrorState } from "@/layouts/b2cStates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HealthGrowthForm } from "@/components/HealthGrowthForm";
import { HealthCardDetailViewer } from "@/components/HealthCardDetailViewer";

interface HealthGrowthTabProps {
  childId: string;
}

export const HealthGrowthTab = ({ childId }: HealthGrowthTabProps) => {
  const {
    data: measurements = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useHealthMeasurements(childId);
  // useCreateHealthMeasurement moved to form component
  const { isDark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);

  const selectedMeasurement = measurements.find(m => m.id === selectedMeasurementId);

  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const lastMeasurement = sortedMeasurements.at(-1);
  const measurementGoal: number = 12;
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
    // Mock healthy range (just an example calculation around the point)
    expectedMinWeight: measurement.weight
      ? measurement.weight * 0.9
      : undefined,
    expectedMaxWeight: measurement.weight
      ? measurement.weight * 1.1
      : undefined,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div
          className="h-32 rounded-3xl animate-pulse"
          style={{ backgroundColor: "var(--bb-color-muted)" }}
        />
        <div
          className="h-64 rounded-3xl animate-pulse"
          style={{ backgroundColor: "var(--bb-color-muted)" }}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <B2CErrorState
        variant="section"
        title="Erro no gráfico de crescimento"
        description="Não foi possível carregar o histórico de medidas."
        errorDetails={error?.message}
        onRetry={() => refetch()}
        skeleton={
          <div className="space-y-6">
            {/* HUD Skeleton */}
            <div
              className="rounded-[32px] border p-6"
              style={{
                borderColor: "var(--bb-color-border)",
                backgroundColor: "var(--bb-color-surface)",
              }}
            >
              <div className="flex gap-4 mb-6">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
                  <div className="h-6 w-32 rounded bg-gray-200 animate-pulse" />
                </div>
              </div>
              <div className="h-[120px] w-full rounded-2xl bg-gray-100 animate-pulse" />
            </div>
            {/* List Skeleton */}
            <div className="space-y-3">
              <div className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
              <div className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
              <div className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
            </div>
          </div>
        }
      />
    );
  }

  return (
    <section className="space-y-6">
      <HudCard
        title={"HUD \u2022 curva de crescimento"}
        value={hudValue}
        description={hudDescription}
        customVisual={
          chartData.length > 0 ? (
            <div
              className="h-[120px] w-full cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => setIsChartOpen(true)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#F2995D"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-ink-muted">
                <Maximize2 className="h-3 w-3" />
                Toque para expandir
              </div>
            </div>
          ) : undefined
        }
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

      <HealthGrowthForm
        childId={childId}
        open={showForm}
        onOpenChange={setShowForm}
      />

      {chartData.length > 0 ? (
        <div className="space-y-4">
          <h3 className="px-2 text-lg font-semibold text-ink">
            Histórico de Medições
          </h3>
          <div className="grid gap-3 grid-cols-1">
            {[...sortedMeasurements].reverse().map((measurement) => (
              <motion.button
                key={measurement.id}
                layoutId={`measurement-card-${measurement.id}`}
                type="button"
                onClick={() => setSelectedMeasurementId(measurement.id)}
                className="flex items-center justify-between w-full text-left rounded-2xl border border-border bg-surface px-5 py-4 transition-all hover:border-[var(--bb-color-accent)] hover:shadow-sm active:scale-[0.99]"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                    {new Date(measurement.date).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="mt-1 font-serif text-lg text-ink">
                    {typeof measurement.weight === "number"
                      ? `${measurement.weight} kg`
                      : "--"}
                  </p>
                </div>
                {typeof measurement.height === "number" && (
                  <div className="text-right">
                    <p className="text-xs text-ink-muted">Altura</p>
                    <p className="font-semibold text-ink">
                      {measurement.height} cm
                    </p>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-border bg-surface p-10 text-center shadow-sm">
          <p className="text-sm text-ink-muted">
            Nenhuma medição registrada ainda. Use o botão acima para começar o
            histórico oficial de crescimento.
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

      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent
          className="max-w-4xl w-[90vw] h-[80vh] flex flex-col"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle style={{ color: "var(--bb-color-ink)" }}>
              Curva Detalhada
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full min-h-0 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="healthyRange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={isDark ? "#3d352e" : "#E3DBCF"}
                />
                <XAxis
                  dataKey="date"
                  stroke={isDark ? "#8a8075" : "#8C8C8C"}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="weight"
                  stroke="#F2995D"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Peso (kg)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#F2995D",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  yAxisId="height"
                  orientation="right"
                  stroke="#C76A6A"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Altura (cm)",
                    angle: 90,
                    position: "insideRight",
                    fill: "#C76A6A",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    borderColor: "var(--bb-color-border)",
                    backgroundColor: "var(--bb-color-surface)",
                    color: "var(--bb-color-ink)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                  itemStyle={{ padding: 0 }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  yAxisId="weight"
                  type="monotone"
                  dataKey="expectedMaxWeight"
                  baseValue="dataMin" // or use expectedMinWeight if you restructure data for [min, max]
                  stroke="none"
                  fill="url(#healthyRange)"
                  name="Faixa Saudável (OMS)"
                />
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weight"
                  stroke="#F2995D"
                  strokeWidth={3}
                  name="Peso (kg)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#F2995D" }}
                />
                <Line
                  yAxisId="height"
                  type="monotone"
                  dataKey="height"
                  stroke="#C76A6A"
                  strokeWidth={3}
                  name="Altura (cm)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#C76A6A" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
      <HealthCardDetailViewer
        isOpen={!!selectedMeasurement}
        onClose={() => setSelectedMeasurementId(null)}
        title="Detalhes da Medição"
        subtitle={selectedMeasurement ? new Date(selectedMeasurement.date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : ""}
        icon={Activity}
        layoutId={selectedMeasurement ? `measurement-card-${selectedMeasurement.id}` : undefined}
      >
        {selectedMeasurement && (
          <motion.div 
            className="grid grid-cols-2 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="rounded-3xl bg-[var(--bb-color-bg)] p-6 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)]">Peso</p>
              <p className="mt-2 font-serif text-4xl font-bold text-[var(--bb-color-accent)]">
                {selectedMeasurement.weight ? `${selectedMeasurement.weight} kg` : "--"}
              </p>
            </div>
            <div className="rounded-3xl bg-[var(--bb-color-bg)] p-6 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--bb-color-ink-muted)]">Altura</p>
              <p className="mt-2 font-serif text-4xl font-bold text-[var(--bb-color-ink)]">
                {selectedMeasurement.height ? `${selectedMeasurement.height} cm` : "--"}
              </p>
            </div>
          </motion.div>
        )}
      </HealthCardDetailViewer>
    </section>
  );
};
