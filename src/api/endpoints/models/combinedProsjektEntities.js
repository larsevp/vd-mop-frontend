// API endpoints for combined ProsjektKrav/ProsjektTiltak entities
import { API } from "@/api";

/**
 * Get paginated combined view of ProsjektKrav and ProsjektTiltak - matches EntityWorkspace expected format
 * EntityWorkspace expects a function that accepts (page, pageSize, search, sortBy, sortOrder)
 * Uses the combined-entities route with projectId parameter
 */
export const getPaginatedCombinedProsjektEntities = async (page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc", filterBy = "all", additionalFilters = {}) => {
  // Handle case where page is passed as an object (fix for object parameter issue)
  const actualPage = typeof page === "object" && page !== null ? page.page || page.pageNumber || page.currentPage || 1 : parseInt(page) || 1;
  
  // Get current project ID from store (dynamic import to avoid React context issues)
  const { useProjectStore } = await import("@/stores/userStore");
  const currentProject = useProjectStore.getState().currentProject;
  const projectId = currentProject?.id;

  if (!projectId) {
    console.warn("No project selected - ProsjektCombinedWorkspace will return empty results");
    return Promise.resolve({ data: { items: [], totalCount: 0, page: actualPage, pageSize, totalPages: 0 } });
  }

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: actualPage.toString(),
    pageSize: pageSize.toString(),
    search,
    sortBy,
    sortOrder,
    projectId: projectId.toString(),
    // Filter parameters
    ...(filterBy && filterBy !== "all" && { filterBy }),
    // Additional filters as separate parameters
    ...(additionalFilters.status && { status: additionalFilters.status }),
    ...(additionalFilters.vurdering && { vurdering: additionalFilters.vurdering }),
    // Default view options for project entities
    primaryView: "prosjektkrav-first",
    showHierarchy: "true",
    showCrossRelations: "true", 
    includeChildren: "true",
    includeRelated: "true",
  });

  // Use the dedicated project combined entities route
  const url = `/combined-entities/project?${queryParams}`;
  const response = await API.get(url);
  return response;
};

/**
 * Advanced version that accepts custom options
 */
export const getPaginatedCombinedProsjektEntitiesWithOptions = async (params = {}) => {
  const {
    page = 1,
    pageSize = 50,
    search = "",
    sortBy = "",
    sortOrder = "asc",
    options = {}
  } = params;

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search,
    sortBy,
    sortOrder,
    // View options
    primaryView: options.primaryView || "prosjektkrav-first",
    showHierarchy: (options.showHierarchy !== false).toString(),
    showCrossRelations: (options.showCrossRelations !== false).toString(),
    includeChildren: (options.includeChildren !== false).toString(),
    includeRelated: (options.includeRelated !== false).toString(),
    groupByEmne: (options.groupByEmne === true).toString(),
  });

  const response = await API.get(`/combined-entities?${queryParams}`);
  return response.data;
};

/**
 * Get combined view with ProsjektKrav-first hierarchy (convenience method)
 */
export const getCombinedProsjektEntitiesKravFirst = async (params = {}) => {
  const { page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc" } = params;
  return await getPaginatedCombinedProsjektEntities(page, pageSize, search, sortBy, sortOrder);
};

/**
 * Get combined view with ProsjektTiltak-first hierarchy (convenience method)
 */
export const getCombinedProsjektEntitiesTiltakFirst = async (params = {}) => {
  const { page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc" } = params;
  return await getPaginatedCombinedProsjektEntities(page, pageSize, search, sortBy, sortOrder);
};

/**
 * Get combined view grouped by Emne (convenience method)
 */
export const getCombinedProsjektEntitiesGroupedByEmne = async (page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc", filterBy = "all", additionalFilters = {}) => {
  return await getPaginatedCombinedProsjektEntities(page, pageSize, search, sortBy, sortOrder, filterBy, additionalFilters);
};

/**
 * Combined project entity service object for use with CombinedEntityWorkspace
 */
export const combinedProsjektEntityService = {
  getPaginatedCombinedView: getPaginatedCombinedProsjektEntities,
  getPaginatedCombinedViewWithOptions: getPaginatedCombinedProsjektEntitiesWithOptions,
  getKravFirst: getCombinedProsjektEntitiesKravFirst,
  getTiltakFirst: getCombinedProsjektEntitiesTiltakFirst,
  getGroupedByEmne: getCombinedProsjektEntitiesGroupedByEmne,
};