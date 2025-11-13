import { useQuery } from "@tanstack/react-query";

interface MockMoment {
  id: string;
  title: string;
  date: string;
  coverImage: string;
}

// Mock data - in a real scenario, this would come from an API call
const mockMoments: MockMoment[] = [
  {
    id: "1",
    title: "Primeiro Ultrassom",
    date: "2023-01-15",
    coverImage: "https://via.placeholder.com/300x200.png?text=Ultrassom",
  },
  {
    id: "2",
    title: "Cha de Revelacao",
    date: "2023-03-20",
    coverImage: "https://via.placeholder.com/300x200.png?text=Cha+de+Revelacao",
  },
  {
    id: "3",
    title: "Primeiro Chute",
    date: "2023-05-10",
    coverImage: "https://via.placeholder.com/300x200.png?text=Primeiro+Chute",
  },
  {
    id: "4",
    title: "Quarto do Bebe",
    date: "2023-06-25",
    coverImage: "https://via.placeholder.com/300x200.png?text=Quarto+do+Bebe",
  },
];

const fetchMoments = async (
  childId: string | undefined,
): Promise<MockMoment[]> => {
  if (!childId) {
    return [];
  }

  // In a real app, you'd fetch this data from your API
  // e.g., await apiClient.get(`/moments?childId=${childId}`);
  return new Promise<MockMoment[]>((resolve) => {
    setTimeout(() => {
      resolve(mockMoments);
    }, 500);
  });
};

export const useMoments = (childId: string | undefined) => {
  return useQuery<MockMoment[]>({
    queryKey: ["moments", childId],
    queryFn: () => fetchMoments(childId),
    enabled: Boolean(childId), // Only run the query if a child is selected
  });
};
