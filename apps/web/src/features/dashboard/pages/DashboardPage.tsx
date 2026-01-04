import React from "react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useDashboardData } from "../hooks/useDashboardData";
import { MomentsTimeline } from "../components/MomentsTimeline";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { B2CErrorState } from "@/layouts/b2cStates";
import { useTranslation } from "@babybook/i18n";
import { B2COnboarding } from "../components/B2COnboarding";
import {
  GuidedTour,
  B2C_TOUR_STEPS,
  TOUR_COMPLETED_KEY_B2C,
} from "@/components/GuidedTour";
import { useVault } from "@/features/vault/hooks/useVault";
import { useQuery } from "@tanstack/react-query";
import { listFamilyMembers, settingsApiKeys } from "@/features/settings/api";
import { motion } from "motion/react";

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { selectedChild } = useSelectedChild();
  const {
    data,
    isLoading: loadingDash,
    isError,
    error,
    refetch,
  } = useDashboardData(selectedChild?.id);
  const { data: vaultDocs, isLoading: loadingVault } = useVault();
  const { data: familyData, isLoading: loadingFamily } = useQuery({
    queryKey: settingsApiKeys.family,
    queryFn: listFamilyMembers,
  });

  const isLoading = loadingDash || loadingVault || loadingFamily;

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

  const hasBirthday = Boolean(selectedChild?.birthday);
  const completedMoments =
    data?.moments.filter((moment) => moment.status === "published").length ?? 0;

  const onboardingStats = {
    hasCompletedProfile: Boolean(
      selectedChild?.name && selectedChild?.birthday,
    ),
    hasMoments: completedMoments > 0,
    hasVaultFiles: (vaultDocs?.length ?? 0) > 0,
    hasFamilyMembers: (familyData?.members?.length ?? 0) > 1, // > 1 pois o dono da conta sempre está lá
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="mb-8 mt-2 px-2" variants={itemVariants}>
        <h1
          className="text-4xl md:text-5xl font-serif font-medium tracking-tight"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.dashboard.title")}
        </h1>
        <p className="mt-2 text-lg opacity-60 font-medium max-w-lg">
          {selectedChild?.name
            ? t("b2c.dashboard.subtitle_child", {
                defaultValue: "O livro da vida de " + selectedChild.name,
                name: selectedChild.name,
              })
            : t("b2c.dashboard.subtitle_generic", {
                defaultValue: "Cada momento conta uma história.",
              })}
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <B2COnboarding stats={onboardingStats} />
      </motion.div>

      <motion.div data-tour="moments-timeline" variants={itemVariants}>
        <MomentsTimeline
          moments={data?.moments || []}
          isLoading={isLoading}
          nextTemplate={data?.nextTemplate ?? null}
          childName={selectedChild?.name ?? undefined}
          hasBirthday={hasBirthday}
          completedCount={completedMoments}
        />
      </motion.div>

      <GuidedTour steps={B2C_TOUR_STEPS} tourKey={TOUR_COMPLETED_KEY_B2C} />
    </motion.div>
  );
};
