import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCurrentUserInfo } from "@/api/userApi";

// Main user store with authentication, roles, and user management
export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoadingUserInfo: false,
      userInfoError: null,

      setUser: (user) => {
        set({ user });
      },

      clearUser: () => {
        set({ user: null, userInfoError: null });
      },

      // Fetch current user info (role and name) from backend
      fetchUserInfo: async () => {
        const { user } = get();

        // Don't fetch if already loading
        if (get().isLoadingUserInfo) {
          return;
        }

        // For manual login users, only fetch if they don't have enhetId
        if (user && user.isManualLogin && user.enhetId) {
          return;
        }

        set({ isLoadingUserInfo: true, userInfoError: null });

        try {
          const response = await getCurrentUserInfo();
          const userInfo = response.data;

          // Merge with existing user data or create new user object
          set({
            user: {
              ...user,
              navn: userInfo.navn,
              rolle: userInfo.rolle,
              enhetId: userInfo.enhetId,
            },
            isLoadingUserInfo: false,
          });
        } catch (error) {
          set({
            userInfoError: error.message || "Failed to fetch user info",
            isLoadingUserInfo: false,
          });
        }
      },
    }),
    {
      name: "user-storage", // unique name for localStorage key
      // Only persist minimal user data, exclude sensitive information like tokens
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              rolle: state.user.rolle,
              navn: state.user.navn,
              name: state.user.name, // Legacy support for HeaderNav
              enhetId: state.user.enhetId,
              isManualLogin: state.user.isManualLogin,
              // Explicitly exclude manualToken and other sensitive data
            }
          : null,
      }),
    }
  )
);

// Project store: not persisted, always fresh from backend
export const useProjectStore = create((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  clearProjects: () => set({ projects: [] }),
}));
