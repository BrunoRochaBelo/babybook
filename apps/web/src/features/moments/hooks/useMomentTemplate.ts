import { useQuery } from "@tanstack/react-query";
import {
  GUIDED_MOMENT_SEQUENCE,
  type CatalogSequenceItem,
  getMomentByTemplateKey,
} from "@/data/momentCatalog";

export type MomentTemplate = CatalogSequenceItem;

const findTemplate = (templateId: string): MomentTemplate | null => {
  if (!templateId) {
    return null;
  }
  const byId = GUIDED_MOMENT_SEQUENCE.find(
    (template) => template.id === templateId,
  );
  if (byId) {
    return byId;
  }
  const byTemplateKey = getMomentByTemplateKey(templateId);
  return byTemplateKey ?? null;
};

const fetchMomentTemplate = async (
  templateId: string,
): Promise<MomentTemplate | null> => findTemplate(templateId);

export const useMomentTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ["momentTemplate", templateId],
    queryFn: () => fetchMomentTemplate(templateId),
    enabled: Boolean(templateId),
  });
};
