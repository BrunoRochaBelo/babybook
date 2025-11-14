import { useQuery } from "@tanstack/react-query";
import { useSelectedChild } from "@/hooks/useSelectedChild";

export interface Document {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  type: "pdf" | "image" | "other";
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "certidao-nascimento.pdf",
    size: "2.3 MB",
    uploadedAt: "2023-01-20T10:00:00Z",
    type: "pdf",
  },
  {
    id: "2",
    name: "carteira-vacinacao.pdf",
    size: "5.1 MB",
    uploadedAt: "2023-02-15T14:30:00Z",
    type: "pdf",
  },
];

const fetchVaultDocuments = async (childId: string | undefined): Promise<Document[]> => {
  if (!childId) {
    return [];
  }
  console.log(`Fetching vault documents for child ${childId}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDocuments);
    }, 800);
  });
};

export const useVault = () => {
  const { selectedChild } = useSelectedChild();
  return useQuery({
    queryKey: ["vault", selectedChild?.id],
    queryFn: () => fetchVaultDocuments(selectedChild?.id),
    enabled: !!selectedChild,
  });
};
