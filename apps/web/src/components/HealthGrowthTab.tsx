import { useState } from "react";
import { useHealthMeasurements, useCreateHealthMeasurement } from "@/hooks/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Plus } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (date && (weight || height)) {
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
    }
  };

  const chartData = [...measurements]
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString("pt-BR", {
        month: "short",
        day: "numeric",
      }),
      weight: m.weight,
      height: m.height,
    }));

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 bg-[#F2995D] text-white px-4 py-2 rounded-xl font-semibold hover:bg-opacity-90 transition-all mb-6"
      >
        <Plus className="w-4 h-4" />
        Adicionar Medição
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 mb-6 border border-[#C9D3C2]"
        >
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
                placeholder="3.5"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                Altura (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
                placeholder="50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-[#F2995D] text-white px-6 py-2 rounded-xl font-semibold hover:bg-opacity-90 disabled:opacity-50"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-[#C9D3C2] text-[#2A2A2A] px-6 py-2 rounded-xl font-semibold hover:bg-opacity-80"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {chartData.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-[#C9D3C2]">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C9D3C2" />
              <XAxis dataKey="date" stroke="#2A2A2A" />
              <YAxis stroke="#2A2A2A" />
              <Tooltip />
              <Legend />
              {chartData.some((d) => d.weight) && (
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#F2995D"
                  name="Peso (kg)"
                />
              )}
              {chartData.some((d) => d.height) && (
                <Line
                  type="monotone"
                  dataKey="height"
                  stroke="#C76A6A"
                  name="Altura (cm)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {measurements.map((m) => (
              <div key={m.id} className="bg-[#F7F3EF] rounded-xl p-4">
                <p className="text-xs text-[#C9D3C2] mb-1">
                  {new Date(m.date).toLocaleDateString("pt-BR")}
                </p>
                {m.weight && (
                  <p className="text-sm text-[#2A2A2A]">
                    Peso: <strong>{m.weight}kg</strong>
                  </p>
                )}
                {m.height && (
                  <p className="text-sm text-[#2A2A2A]">
                    Altura: <strong>{m.height}cm</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#C9D3C2]">
          <p className="text-[#C9D3C2] mb-4">Nenhuma medição registrada</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-[#F2995D] text-white px-6 py-2 rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            Registrar Primeira Medição
          </button>
        </div>
      )}
    </div>
  );
};
