import { useQuery } from "@tanstack/react-query";

export interface Profile {
  name: string;
  email: string;
  children: {
    id: string;
    name: string;
  }[];
}

const mockProfile: Profile = {
  name: "Bruno",
  email: "dev@babybook.dev",
  children: [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
  ],
};

const fetchProfile = async (): Promise<Profile> => {
  console.log("Fetching profile data");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockProfile);
    }, 600);
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });
};
