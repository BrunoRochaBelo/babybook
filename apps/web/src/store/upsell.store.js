import { create } from "zustand";
export const useUpsellStore = create((set) => ({
    openModal: (visibleModal) => set({ visibleModal }),
    closeModal: () => set({ visibleModal: undefined })
}));
