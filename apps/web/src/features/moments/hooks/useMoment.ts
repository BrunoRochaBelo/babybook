import { useQuery } from "@tanstack/react-query";

export interface MomentMedia {
  id: string;
  url: string;
  kind: "photo" | "video" | "audio";
}

export interface Moment {
  id: string;
  title: string;
  summary: string;
  occurredAt: string | null;
  createdAt: string;
  updatedAt: string;
  templateKey: string | null;
  media: MomentMedia[];
}

const mockMoment: Moment = {
  id: "1",
  title: "Primeiro Ultrassom",
  summary: "A primeira vez que vimos nosso pequeno tesouro. O coração batia forte e a emoção tomou conta de nós. Foi um dia inesquecível.",
  occurredAt: "2023-01-15T10:00:00Z",
  createdAt: "2023-01-15T11:00:00Z",
  updatedAt: "2023-01-15T11:00:00Z",
  templateKey: "descoberta",
  media: [
    { id: "m1", url: "https://via.placeholder.com/400x300.png?text=Ultrassom+1", kind: "photo" },
    { id: "m2", url: "https://via.placeholder.com/400x300.png?text=Coração+do+Bebê", kind: "video" },
  ],
};

const fetchMoment = async (momentId: string): Promise<Moment | null> => {
  console.log(`Fetching moment ${momentId}`);
  if (!momentId) {
    return null;
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMoment);
    }, 500);
  });
};

export const useMoment = (momentId: string) => {
  return useQuery({
    queryKey: ["moment", momentId],
    queryFn: () => fetchMoment(momentId),
    enabled: !!momentId,
  });
};
