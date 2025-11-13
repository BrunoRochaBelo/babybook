import { useState } from "react";
import { Users, CheckCircle } from "lucide-react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { GuestbookList } from "@/components/GuestbookList";
import { GuestbookForm } from "@/components/GuestbookForm";

export const VisitasPage = () => {
  const { selectedChild } = useSelectedChild();
  const [activeTab, setActiveTab] = useState<"approved" | "pending">(
    "approved",
  );
  const [showForm, setShowForm] = useState(false);

  if (!selectedChild) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p className="text-[#C9D3C2]">Selecione uma criança primeiro</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-serif font-bold text-[#2A2A2A] mb-6">
        Livro de Visitas
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 border border-[#C9D3C2]">
        <button
          onClick={() => setActiveTab("approved")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
            activeTab === "approved"
              ? "bg-[#F2995D] text-white"
              : "text-[#2A2A2A] hover:bg-[#F7F3EF]"
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Aprovadas</span>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
            activeTab === "pending"
              ? "bg-[#F2995D] text-white"
              : "text-[#2A2A2A] hover:bg-[#F7F3EF]"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm">Pendentes</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === "approved" && (
        <div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-6 inline-flex items-center gap-2 bg-[#F2995D] text-white px-6 py-2 rounded-xl font-semibold hover:bg-opacity-90 transition-all"
          >
            <Users className="w-4 h-4" />
            Deixar Mensagem
          </button>

          {showForm && (
            <GuestbookForm
              childId={selectedChild.id}
              onClose={() => setShowForm(false)}
            />
          )}

          <GuestbookList childId={selectedChild.id} status="approved" />
        </div>
      )}

      {activeTab === "pending" && (
        <GuestbookList childId={selectedChild.id} status="pending" />
      )}
    </div>
  );
};
