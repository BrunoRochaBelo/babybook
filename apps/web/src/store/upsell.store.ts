import { create } from "zustand";

type UpsellCategory = "recurrent_social" | "storage" | "premium_print";

interface UpsellState {
  visibleModal?: UpsellCategory;
  openModal: (category: UpsellCategory) => void;
  closeModal: () => void;
}

export const useUpsellStore = create<UpsellState>((set) => ({
  openModal: (visibleModal) => set({ visibleModal }),
  closeModal: () => set({ visibleModal: undefined })
}));
