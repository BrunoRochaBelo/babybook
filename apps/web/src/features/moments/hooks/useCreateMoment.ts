import { useMutation } from "@tanstack/react-query";

// This is a mock mutation hook. In a real app, this would make an API call.
export const useCreateMoment = () => {
  return useMutation({
    mutationFn: async (newMoment: any) => {
      console.log("Creating new moment:", newMoment);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newMoment);
        }, 1000);
      });
    },
  });
};
