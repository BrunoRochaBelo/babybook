import React from "react";
import { Plus } from "lucide-react";
import { MomentCard } from "@/components/MomentCard";
import { useNavigate } from "react-router-dom";
import type { Moment } from "@babybook/contracts";

interface MomentsTimelineProps {
  moments: Moment[];
  isLoading: boolean;
}

export const MomentsTimeline = ({ moments, isLoading }: MomentsTimelineProps) => {
  const navigate = useNavigate();

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Seus Momentos</h3>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl h-32 shadow-md animate-pulse"
            />
          ))}
        </div>
      ) : moments && moments.length > 0 ? (
        <div className="space-y-4">
          {moments.map((moment: any) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            Nenhum momento registrado ainda
          </p>
          <button
            onClick={handleCreateAvulso}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-semibold hover:bg-opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Registrar Primeiro Momento
          </button>
        </div>
      )}
    </div>
  );
};
