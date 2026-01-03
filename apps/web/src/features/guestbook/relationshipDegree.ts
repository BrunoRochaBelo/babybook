import { GuestbookEntry } from "@babybook/contracts";

export const relationshipDegreeOptions = [
  { value: "mae", label: "Mãe" },
  { value: "pai", label: "Pai" },
  { value: "tio", label: "Tio" },
  { value: "tia", label: "Tia" },
  { value: "irmao_irma", label: "Irmão / Irmã" },
  { value: "avo", label: "Avô" },
  { value: "avoa", label: "Avó" },
  { value: "amigo", label: "Amigo(a)" },
  { value: "madrasta", label: "Madrasta" },
  { value: "padrasto", label: "Padrasto" },
] as const satisfies ReadonlyArray<{
  value: GuestbookEntry["relationshipDegree"];
  label: string;
}>;

const labelByValue: Record<GuestbookEntry["relationshipDegree"], string> =
  relationshipDegreeOptions.reduce(
    (acc, option) => {
      acc[option.value] = option.label;
      return acc;
    },
    {} as Record<GuestbookEntry["relationshipDegree"], string>,
  );

export function formatRelationshipDegree(
  value: GuestbookEntry["relationshipDegree"],
): string {
  return labelByValue[value] ?? value;
}
