import { useQuery } from "@tanstack/react-query";

export interface MomentTemplate {
  id: string;
  title: string;
  description: string;
}

const templates: Record<string, MomentTemplate> = {
  descoberta: {
    id: "descoberta",
    title: "A Descoberta",
    description: "O primeiro momento especial. Registre detalhes do nascimento ou chegada.",
  },
  "primeiro-sorriso": {
    id: "primeiro-sorriso",
    title: "Primeiro Sorriso",
    description: "Aquele sorriso inesquecível que derreteu seu coração.",
  },
  "primeira-gargalhada": {
    id: "primeira-gargalhada",
    title: "Primeira Gargalhada",
    description: "O som mais especial que você já ouviu.",
  },
  "primeira-comida": {
    id: "primeira-comida",
    title: "Primeira Comida",
    description: "A reação à introdução alimentar.",
  },
  "primeiro-dente": {
    id: "primeiro-dente",
    title: "Primeiro Dente",
    description: "O tão esperado primeiro dentinho!",
  },
  "primeiro-dia-escola": {
    id: "primeiro-dia-escola",
    title: "Primeiro Dia na Escola",
    description: "Um marco importante nessa jornada.",
  },
  "meses-passados": {
    id: "meses-passados",
    title: "Meses se Passaram",
    description: "Reflexão sobre o tempo que passou.",
  },
};

const fetchMomentTemplate = async (templateId: string): Promise<MomentTemplate | null> => {
  console.log(`Fetching template ${templateId}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(templates[templateId] || null);
    }, 100);
  });
};

export const useMomentTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ["momentTemplate", templateId],
    queryFn: () => fetchMomentTemplate(templateId),
    enabled: !!templateId,
  });
};
