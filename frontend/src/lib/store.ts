import { create } from "zustand";
import { User, Project, ShortClip } from "./api";

interface AppState {
  user: User | null;
  token: string | null;
  currentProject: Project | null;
  activeShort: ShortClip | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setCurrentProject: (proj: Project | null) => void;
  setActiveShort: (short: ShortClip | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("clipforge_token") : null,
  currentProject: null,
  activeShort: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("clipforge_token", token);
      else localStorage.removeItem("clipforge_token");
    }
    set({ token });
  },
  setCurrentProject: (currentProject) => set({ currentProject }),
  setActiveShort: (activeShort) => set({ activeShort }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("clipforge_token");
    }
    set({ user: null, token: null, currentProject: null, activeShort: null });
  },
}));
