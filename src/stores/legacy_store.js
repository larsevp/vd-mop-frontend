import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store: handles user id and tokens, persisted in sessionStorage for security
export const useUserStore = create(persist(
  (set) => ({
    userId: null,
    name: null,
    setUser: ({ userId, name }) => set({ userId, name }),
    clearUser: () => set({ userId: null, name: null }),
  }),
  {
    name: 'user-storage-session',
    version: 1, // Add version to handle state migrations
    getStorage: () => sessionStorage, // sessionStorage
  }
));

// Project store: not persisted, always fresh from backend
export const useProjectStore = create((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  clearProjects: () => set({ projects: [] }),
}));
