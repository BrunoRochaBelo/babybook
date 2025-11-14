import { useMemo } from "react";
import type { Moment } from "@babybook/contracts";
import { useMoments } from "@/hooks/api";
import {
  GUIDED_MOMENT_SEQUENCE,
  type CatalogSequenceItem,
} from "@/data/momentCatalog";

interface DashboardData {
  moments: Moment[];
  nextTemplate: CatalogSequenceItem | null;
}

const pickNextTemplate = (moments: Moment[]): CatalogSequenceItem | null => {
  if (!moments.length) {
    return GUIDED_MOMENT_SEQUENCE[0] ?? null;
  }

  const draftKeys = new Set(
    moments
      .filter(
        (moment): moment is Moment & { templateKey: string } =>
          moment.status === "draft" && Boolean(moment.templateKey),
      )
      .map((moment) => moment.templateKey),
  );
  if (draftKeys.size > 0) {
    const draftCandidate = GUIDED_MOMENT_SEQUENCE.find((item) =>
      draftKeys.has(item.templateKey),
    );
    if (draftCandidate) {
      return draftCandidate;
    }
  }

  const completedTemplates = new Set(
    moments
      .filter((moment) => moment.status === "published")
      .map((moment) => moment.templateKey)
      .filter((template): template is string => Boolean(template)),
  );

  return (
    GUIDED_MOMENT_SEQUENCE.find(
      (template) => !completedTemplates.has(template.templateKey),
    ) ?? null
  );
};

export const useDashboardData = (childId: string | undefined) => {
  const momentsQuery = useMoments(childId);

  const nextTemplate = useMemo(
    () => pickNextTemplate(momentsQuery.data ?? []),
    [momentsQuery.data],
  );

  const data = useMemo<DashboardData>(
    () => ({
      moments: momentsQuery.data ?? [],
      nextTemplate,
    }),
    [momentsQuery.data, nextTemplate],
  );

  return {
    ...momentsQuery,
    data,
  };
};
