import { create } from "zustand";

interface AuthState {
  userId: string | null;
  setUserId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  userId: null,
  setUserId: (userId) => set({ userId }),
}));

export function hydrateAuth(): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("ff_userId");
  if (stored) useAuthStore.getState().setUserId(stored);
}

export function persistAuth(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("ff_userId", userId);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("ff_userId");
  useAuthStore.getState().setUserId(null);
}
