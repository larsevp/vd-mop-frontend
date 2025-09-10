import {
  getProsjektKrav,
  deleteProsjektKrav,
  createProsjektKrav,
  updateProsjektKrav,
  getPaginatedProsjektKrav,
  getPaginatedProsjektKravAll,
  getPaginatedProsjektKravGroupedByEmne,
  getProsjektKravById,
} from "@/api/endpoints";
import { useProjectStore } from "@/stores/userStore";

// Project-aware query functions that automatically include current project context
const createProjectAwareQueryFn = (baseFn) => {
  return (page, pageSize, search, sortBy, sortOrder) => {
    const { currentProject } = useProjectStore.getState();
    const projectId = currentProject?.id;

    // If no valid project ID, return empty result instead of invalid query
    if (!projectId || isNaN(Number(projectId))) {
      console.warn("ProsjektKrav query: No valid project selected, returning empty result");
      return Promise.resolve({
        data: {
          items: [],
          count: 0,
          totalPages: 0,
          currentPage: page,
        },
      });
    }

    return baseFn(page, pageSize, search, sortBy, sortOrder, Number(projectId));
  };
};

export const prosjektKrav = {
  queryKey: ["prosjektKrav"], // Keep simple array for admin compatibility

  // Base API functions for admin pages (no project context)
  queryFn: getPaginatedProsjektKrav,
  queryFnAll: getPaginatedProsjektKravAll,
  queryFnGroupedByEmne: getPaginatedProsjektKravGroupedByEmne,

  // Project-aware functions for workspace (used by useEntityData)
  queryFnWorkspace: createProjectAwareQueryFn(getPaginatedProsjektKrav),
  queryFnAllWorkspace: createProjectAwareQueryFn(getPaginatedProsjektKravAll),
  queryFnGroupedByEmneWorkspace: createProjectAwareQueryFn(getPaginatedProsjektKravGroupedByEmne),

  getByIdFn: getProsjektKravById,
  createFn: createProsjektKrav,
  updateFn: updateProsjektKrav,
  deleteFn: deleteProsjektKrav,
};
