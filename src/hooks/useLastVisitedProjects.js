import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getUserLastVisitedProjects, setLastVisitedProject } from "@/api/endpoints/models/lastVisitedProjects";
import { useUserStore } from "@/stores/userStore";
import { useRef } from "react";

/**
 * Custom hook for managing last visited projects with proper caching and local updates
 * Provides consistent data fetching, caching, and visit tracking across components
 */
export const useLastVisitedProjects = () => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const {
    data: lastVisitedData = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["lastVisitedProjects"],
    queryFn: getUserLastVisitedProjects,
    select: (response) => {
      // Transform the API response to extract project data
      if (response?.data && Array.isArray(response.data)) {
        return response.data
          .filter(item => item.project) // Only items with valid project data
          .map(item => ({
            ...item.project,
            lastVisited: item.updatedAt // Include last visited timestamp
          }));
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    enabled: !!user?.id, // Only fetch if user is available
  });

  // Mutation for tracking project visits
  const visitProjectMutation = useMutation({
    mutationFn: (projectData) => {
      if (!user?.id) throw new Error("User not available");
      return setLastVisitedProject({
        userId: user.id,
        projectId: projectData.id
      });
    },
    onMutate: async (visitedProject) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["lastVisitedProjects"] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(["lastVisitedProjects"]);

      // Optimistically update the cache
      queryClient.setQueryData(["lastVisitedProjects"], (old) => {
        if (!old?.data) return old;

        const currentTime = new Date().toISOString();
        const projectWithTimestamp = {
          ...visitedProject,
          lastVisited: currentTime
        };

        // Remove the project if it already exists in the list
        const filteredProjects = old.data
          .filter(item => item.project?.id !== visitedProject.id)
          .filter(item => item.project); // Keep only valid projects

        // Add the visited project at the beginning
        const updatedData = [
          { project: projectWithTimestamp, updatedAt: currentTime },
          ...filteredProjects
        ].slice(0, 5); // Keep only the 5 most recent

        return {
          ...old,
          data: updatedData
        };
      });

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onError: (err, visitedProject, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(["lastVisitedProjects"], context.previousProjects);
      }
      console.error("Failed to track project visit:", err);
    },
    onSuccess: () => {
      // Invalidate and refetch after successful backend update
      queryClient.invalidateQueries({ queryKey: ["lastVisitedProjects"] });
    },
  });

  /**
   * Track a project visit - updates cache immediately and syncs with backend
   * @param {Object} project - Project object to track
   */
  const trackProjectVisit = (project) => {
    if (!project || !project.id) {
      console.warn("Invalid project data for tracking visit");
      return;
    }

    visitProjectMutation.mutate(project);
  };

  return {
    projects: lastVisitedData,
    isLoading,
    isError,
    error,
    refetch,
    hasProjects: lastVisitedData.length > 0,
    trackProjectVisit,
    isTrackingVisit: visitProjectMutation.isPending
  };
};

export default useLastVisitedProjects;