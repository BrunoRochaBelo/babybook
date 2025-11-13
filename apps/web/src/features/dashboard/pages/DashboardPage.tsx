import React from "react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useDashboardData } from "../hooks/useDashboardData";
import { ChildSelector } from "../components/ChildSelector";
import { NextMomentSuggestion } from "../components/NextMomentSuggestion";
import { MomentsTimeline } from "../components/MomentsTimeline";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { children, selectedChild, setSelectedChildId } = useSelectedChild();
  const { data, isLoading } = useDashboardData(selectedChild?.id);

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ChildSelector
        children={children}
        selectedChildId={selectedChild?.id}
        onChildChange={setSelectedChildId}
      />

      {selectedChild && data?.nextTemplate && (
        <NextMomentSuggestion template={data.nextTemplate} />
      )}

      <MomentsTimeline moments={data?.moments || []} isLoading={isLoading} />

      {selectedChild && data?.moments && data.moments.length > 0 && (
        <button
          onClick={handleCreateAvulso}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};