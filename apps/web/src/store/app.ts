import { create } from "zustand";

type Theme = "light" | "dark";

interface AppState {
  selectedChildId: string | null;
  setSelectedChildId: (childId: string) => void;
  clearSelectedChild: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedChildId: null,
  setSelectedChildId: (childId) => set({ selectedChildId: childId }),
  clearSelectedChild: () => set({ selectedChildId: null }),
  theme: "light",
  setTheme: (theme) => set({ theme }),
}));
