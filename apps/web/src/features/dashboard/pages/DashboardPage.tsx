import React from "react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useDashboardData } from "../hooks/useDashboardData";
import { MomentsTimeline } from "../components/MomentsTimeline";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const { data, isLoading } = useDashboardData(selectedChild?.id);

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  const hasBirthday = Boolean(selectedChild?.birthday);
  const completedMoments = data?.moments.filter(
    (moment) => moment.status === "published",
  ).length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="mb-6 text-center text-3xl font-serif font-bold text-ink">
        Jornada
      </h1>

      <MomentsTimeline
        moments={data?.moments || []}
        isLoading={isLoading}
        nextTemplate={data?.nextTemplate ?? null}
        childName={selectedChild?.name ?? undefined}
        hasBirthday={hasBirthday}
        completedCount={completedMoments}
      />

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
