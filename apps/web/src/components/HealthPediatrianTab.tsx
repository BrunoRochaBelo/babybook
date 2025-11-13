import { useState } from "react";
import { Plus } from "lucide-react";

interface HealthPediatrianTabProps {
  childId: string;
}

export const HealthPediatrianTab = ({ childId }: HealthPediatrianTabProps) => {
  const [visits, setVisits] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newVisit = {
      id: Date.now().toString(),
      childId,
      date,
      reason,
      notes,
    };
    setVisits([...visits, newVisit]);
    setDate("");
    setReason("");
    setNotes("");
    setShowForm(false);
  };

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 bg-[#F2995D] text-white px-4 py-2 rounded-xl font-semibold hover:bg-opacity-90 transition-all mb-6"
      >
        <Plus className="w-4 h-4" />
        Registrar Visita
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 mb-6 border border-[#C9D3C2]"
        >
          <div className="grid gap-4 mb-4">
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
                Motivo
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
                placeholder="Consulta de rotina, vacinação, etc"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                Anotações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
                rows={4}
                placeholder="Anotações importantes da visita"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-[#F2995D] text-white px-6 py-2 rounded-xl font-semibold hover:bg-opacity-90"
            >
              Salvar
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

      {visits.length > 0 ? (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-2xl p-4 border border-[#C9D3C2]"
            >
              <p className="text-xs text-[#C9D3C2] mb-1">
                {new Date(visit.date).toLocaleDateString("pt-BR")}
              </p>
              <h4 className="font-semibold text-[#2A2A2A] mb-1">
                {visit.reason}
              </h4>
              {visit.notes && (
                <p className="text-sm text-[#2A2A2A]">{visit.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#C9D3C2]">
          <p className="text-[#C9D3C2] mb-4">Nenhuma visita registrada</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-[#F2995D] text-white px-6 py-2 rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            Registrar Primeira Visita
          </button>
        </div>
      )}
    </div>
  );
};
