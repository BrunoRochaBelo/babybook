import { create } from "zustand";

export type SessionRole = "company_admin" | "affiliate";

export type Session = {
  role: SessionRole;
  email: string;
  affiliateId: string | null;
};

const STORAGE_KEY = "@babybook/affiliates-session/v1";

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session & {
      affiliate_id?: string | null;
      affiliateId?: string | null;
    };
    if (!parsed?.role || !parsed?.email) return null;
    return {
      role: parsed.role,
      email: parsed.email,
      affiliateId:
        parsed.affiliateId ??
        (typeof parsed.affiliate_id === "string"
          ? parsed.affiliate_id
          : null) ??
        null,
    };
  } catch {
    return null;
  }
}

function persistSession(session: Session | null) {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

type SessionState = {
  session: Session | null;
  setSession: (session: Session | null) => void;
  logout: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: loadSession(),
  setSession: (session) => {
    persistSession(session);
    set({ session });
  },
  logout: () => {
    persistSession(null);
    set({ session: null });
  },
}));
