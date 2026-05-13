import { create } from "zustand";

export type WSStatus = "idle" | "connecting" | "connected" | "reconnecting" | "error";

interface WSState {
  status: WSStatus;
  setStatus: (status: WSStatus) => void;
}

export const useWSStore = create<WSState>()((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));
