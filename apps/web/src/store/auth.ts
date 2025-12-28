import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@babybook/contracts";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string | null;
  sessionToken: string | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setCsrfToken: (token: string | null) => void;
  setSessionToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      csrfToken: null,
      sessionToken: null,

      login: (user: UserProfile) =>
        set({
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          csrfToken: null,
          sessionToken: null,
        }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setCsrfToken: (token: string | null) => set({ csrfToken: token }),

      setSessionToken: (token: string | null) => set({ sessionToken: token }),
    }),
    {
      name: "babybook-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        csrfToken: state.csrfToken,
        sessionToken: state.sessionToken,
      }),
    },
  ),
);
