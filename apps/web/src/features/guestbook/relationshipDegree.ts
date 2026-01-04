import { useMemo } from "react";
import { useTranslation } from "@babybook/i18n";
import { GuestbookEntry } from "@babybook/contracts";

export const rawRelationshipDegrees: GuestbookEntry["relationshipDegree"][] = [
  "mae",
  "pai",
  "tio",
  "tia",
  "irmao_irma",
  "avo",
  "avoa",
  "amigo",
  "madrasta",
  "padrasto",
];

export function useRelationshipDegrees() {
  const { t } = useTranslation();

  const options = useMemo(() => {
    return rawRelationshipDegrees.map((value) => ({
      value,
      label: t(`b2c.guestbook.relationship.${value}` as any, value),
    }));
  }, [t]);

  const formatRelationshipDegree = (
    value: GuestbookEntry["relationshipDegree"],
  ): string => {
    return t(`b2c.guestbook.relationship.${value}` as any, value);
  };

  return { options, formatRelationshipDegree };
}

// Deprecated: kept for migration, but should use the hook above
export function formatRelationshipDegreeSimple(
  value: GuestbookEntry["relationshipDegree"],
  t: (key: any, fallback: string) => string,
): string {
  return t(`b2c.guestbook.relationship.${value}` as any, value);
}
