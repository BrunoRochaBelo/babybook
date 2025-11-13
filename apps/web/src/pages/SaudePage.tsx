import { useState } from "react";
import { Activity, FileText, Database } from "lucide-react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { HealthGrowthTab } from "@/components/HealthGrowthTab";
import { HealthPediatrianTab } from "@/components/HealthPediatrianTab";
import { VaultTab } from "@/components/VaultTab";

type HealthTab = "crescimento" | "pediatra" | "cofre";

export const SaudePage = () => {
  const [activeTab, setActiveTab] = useState<HealthTab>("crescimento");
  const { selectedChild } = useSelectedChild();

  const tabs = [
    {
      id: "crescimento" as const,
      label: "Crescimento",
      icon: Activity,
    },
    {
      id: "pediatra" as const,
      label: "Pediatra",
      icon: FileText,
    },
    {
      id: "cofre" as const,
      label: "Cofre",
      icon: Database,
    },
  ];

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
        Saúde de {selectedChild.name}
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 border border-[#C9D3C2]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
                isActive
                  ? "bg-[#F2995D] text-white"
                  : "text-[#2A2A2A] hover:bg-[#F7F3EF]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "crescimento" && (
          <HealthGrowthTab childId={selectedChild.id} />
        )}
        {activeTab === "pediatra" && (
          <HealthPediatrianTab childId={selectedChild.id} />
        )}
        {activeTab === "cofre" && <VaultTab childId={selectedChild.id} />}
      </div>
    </div>
  );
};
