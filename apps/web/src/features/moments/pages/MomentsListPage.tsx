import type { Moment } from "@babybook/contracts";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { MomentCard } from "@/components/MomentCard";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useMoments } from "@/hooks/api";

export const MomentsListPage = () => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const { data: moments = [], isLoading } = useMoments(selectedChild?.id);

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Meus Momentos</h1>
        <button
          onClick={handleCreateAvulso}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Momento
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl h-32 shadow-md animate-pulse"
            />
          ))}
        </div>
      ) : moments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moments.map((moment: Moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">
            Você ainda não registrou nenhum momento.
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
