import { useState } from "react";
import { Users, CheckCircle } from "lucide-react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { GuestbookList } from "@/components/GuestbookList";
import { GuestbookForm } from "@/components/GuestbookForm";
import { cn } from "@/lib/utils";

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
      <div className="mb-6 flex flex-wrap gap-2 rounded-[28px] border border-border bg-surface p-2 shadow-sm">
        {[
          { id: "approved", icon: CheckCircle, label: "Aprovadas" },
          { id: "pending", icon: Users, label: "Pendentes" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "approved" | "pending")}
              className={cn(
                "flex-1 min-w-[120px] rounded-full border px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-ink bg-primary text-primary-foreground"
                  : "border-transparent text-ink-muted hover:border-border",
              )}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
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
