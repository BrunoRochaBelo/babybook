import { useMemo } from "react";
import { useMoments } from "@/hooks/api";
import type { Moment } from "@babybook/contracts";

interface DashboardTemplate {
  id: string;
  title: string;
  description: string;
}

interface DashboardData {
  moments: Moment[];
  nextTemplate: DashboardTemplate;
}

const templateSuggestions: DashboardTemplate[] = [
  {
    id: "descoberta",
    title: "A Descoberta",
    description: "O primeiro momento especial",
  },
  {
    id: "primeiro-sorriso",
    title: "Primeiro Sorriso",
    description: "Aquele sorriso inesquecível",
  },
  {
    id: "primeira-gargalhada",
    title: "Primeira Gargalhada",
    description: "O som mais especial",
  },
];

const pickNextTemplate = (moments: Moment[]): DashboardTemplate => {
  const seenTemplates = new Set(
    moments
      .map((moment) => moment.templateKey)
      .filter((template): template is string => Boolean(template)),
  );
  return (
    templateSuggestions.find((template) => !seenTemplates.has(template.id)) ??
    templateSuggestions[0]
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
