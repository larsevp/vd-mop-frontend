import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUserLastVisitedProjects, setLastVisitedProject } from "@/api/endpoints/models/lastVisitedProjects";

/**
 * Recent Projects Store - Manages recently visited projects with caching and deduplication
 * Prevents duplicate API calls and handles optimistic updates
 */
export const useRecentProjectsStore = create(
  persist(
    (set, get) => ({
      // State
      recentProjects: [],
      isLoading: false,
      error: null,

      // Cache to prevent duplicate tracking calls (in-memory only)
      _lastTrackedProjects: new Map(), // projectId -> timestamp
      _trackingCooldown: 5000, // 5 seconds cooldown between tracking same project

      // Actions
      setRecentProjects: (projects) => set({ recentProjects: projects }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Fetch recent projects from API
      fetchRecentProjects: async (userId) => {
        if (!userId) return;

        const { isLoading } = get();
        if (isLoading) return; // Prevent concurrent requests

        set({ isLoading: true, error: null });

        try {
          const response = await getUserLastVisitedProjects();
          const projects =
            response?.data && Array.isArray(response.data)
              ? response.data
                  .filter((item) => item.project) // Only items with valid project data
                  .map((item) => ({
                    ...item.project,
                    lastVisited: item.updatedAt, // Include last visited timestamp
                  }))
              : [];

          set({ recentProjects: projects, isLoading: false });
        } catch (error) {
          console.error("Failed to fetch recent projects:", error);
          set({ error: error.message, isLoading: false });
        }
      },

      // Track a project visit with deduplication
      trackProjectVisit: async (project, userId) => {
        if (!project?.id || !userId) {
          console.warn("Invalid project data or user for tracking visit");
          return;
        }

        const { _lastTrackedProjects, _trackingCooldown } = get();
        const now = Date.now();
        const lastTracked = _lastTrackedProjects.get(project.id);

        // Check if we've tracked this project recently (cooldown)
        if (lastTracked && now - lastTracked < _trackingCooldown) {
          return;
        }

        // Update cooldown cache
        const newCooldownMap = new Map(_lastTrackedProjects);
        newCooldownMap.set(project.id, now);
        set({ _lastTrackedProjects: newCooldownMap });

        // Optimistic update - add/move project to front of list
        const currentTime = new Date().toISOString();
        const projectWithTimestamp = {
          ...project,
          lastVisited: currentTime,
        };

        set((state) => {
          const filteredProjects = state.recentProjects
            .filter((p) => p.id !== project.id) // Remove if already exists
            .slice(0, 4); // Keep only 4 others (will be 5 total with new one)

          return {
            recentProjects: [projectWithTimestamp, ...filteredProjects],
          };
        });

        // Make API call in background
        try {
          await setLastVisitedProject({
            userId: userId,
            projectId: project.id,
          });

          // Refresh from server after successful API call
          setTimeout(() => {
            get().fetchRecentProjects(userId);
          }, 500);
        } catch (error) {
          console.error("Failed to track project visit:", error);
          // Don't revert optimistic update - keep the UI responsive
          // The next fetch will correct any inconsistencies
        }
      },

      // Clear recent projects
      clearRecentProjects: () => set({ recentProjects: [], error: null }),

      // Reset cooldown cache (useful for testing)
      resetTrackingCooldown: () => set({ _lastTrackedProjects: new Map() }),
    }),
    {
      name: "recent-projects-storage",
      // Only persist the actual projects data, not the cooldown cache
      partialize: (state) => ({
        recentProjects: state.recentProjects,
      }),
    }
  )
);
