import React from "react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useDashboardData } from "../hooks/useDashboardData";
import { MomentsTimeline } from "../components/MomentsTimeline";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { B2CErrorState } from "@/layouts/b2cStates";
import { useTranslation } from "@babybook/i18n";

export const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const { data, isLoading, isError, error, refetch } = useDashboardData(selectedChild?.id);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <B2CErrorState
        title={t("b2c.dashboard.errorTitle")}
        description={t("b2c.dashboard.errorDescription")}
        errorDetails={error?.message}
        onRetry={() => refetch()}
        skeleton={<DashboardSkeleton />}
      />
    );
  }

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  const hasBirthday = Boolean(selectedChild?.birthday);
  const completedMoments = data?.moments.filter(
    (moment) => moment.status === "published",
  ).length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1
        className="mb-6 text-center text-3xl font-serif font-bold"
        style={{ color: "var(--bb-color-ink)" }}
      >
        {t("b2c.dashboard.title")}
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
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
          style={{
            backgroundColor: "var(--bb-color-accent)",
            color: "var(--bb-color-surface)",
          }}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
