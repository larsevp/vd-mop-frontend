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

          // Get fresh user state right before merge to avoid stale closure
          const currentUser = get().user;

          // Merge with existing user data or create new user object
          const updatedUser = {
            ...currentUser,
            navn: userInfo.navn,
            rolle: userInfo.rolle,
            enhetId: userInfo.enhetId,
          };

          set({
            user: updatedUser,
            isLoadingUserInfo: false,
          });

          // Verify the set worked
          const verifyUser = get().user;
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
      version: 1, // Add version to handle state migrations
      migrate: (persistedState, version) => {
        // Handle migration from previous versions
        if (version === 0) {
          // Migration from v0 to v1 - ensure user structure is correct
          return {
            user: persistedState.user || null
          };
        }
        return persistedState;
      },
      // Only persist minimal user data, exclude sensitive information like tokens
      partialize: (state) => {
        const persistedData = {
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
        };
        //console.log('UserStore: Persisting to localStorage:', persistedData);
        return persistedData;
      },
      onRehydrateStorage: () => (state) => {
        //console.log('UserStore: Rehydrated from localStorage:', state);
      },
    }
  )
);

// Project store: not persisted, always fresh from backend
export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,

      setProjects: (projects) => set({ projects }),
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      clearProjects: () => set({ projects: [] }),

      // Current project management
      setCurrentProject: (project) => set({ currentProject: project }),
      clearCurrentProject: () => set({ currentProject: null }),
      getCurrentProject: () => get().currentProject,
    }),
    {
      name: "project-storage",
      version: 1, // Add version to handle state migrations
      migrate: (persistedState, version) => {
        // Handle migration from previous versions
        if (version === 0) {
          // Migration from v0 to v1 - ensure project structure is correct
          return {
            currentProject: persistedState.currentProject || null
          };
        }
        return persistedState;
      },
      // Only persist currentProject, not the full projects list
      partialize: (state) => ({
        currentProject: state.currentProject,
      }),
    }
  )
);
