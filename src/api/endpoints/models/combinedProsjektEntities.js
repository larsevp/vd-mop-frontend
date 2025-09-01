// API endpoints for combined ProsjektKrav/ProsjektTiltak entities
import { API } from "@/api";
import { useProjectStore } from "@/stores/userStore";

/**
 * Get paginated combined view of ProsjektKrav and ProsjektTiltak - matches EntityWorkspace expected format
 * EntityWorkspace expects a function that accepts (page, pageSize, search, sortBy, sortOrder)
 * Uses the combined-entities route with projectId parameter
 */
export const getPaginatedCombinedProsjektEntities = (page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc") => {
  // Handle case where page is passed as an object (fix for object parameter issue)
  const actualPage = typeof page === "object" && page !== null ? page.page || page.pageNumber || page.currentPage || 1 : parseInt(page) || 1;
  
  // Get current project ID from store
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
    // Default view options for project entities
    primaryView: "prosjektkrav-first",
    showHierarchy: "true",
    showCrossRelations: "true", 
    includeChildren: "true",
    includeRelated: "true",
  });

  // Use the dedicated project combined entities route
  return API.get(`/combined-entities/project?${queryParams}`);
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
  return getPaginatedCombinedProsjektEntities(page, pageSize, search, sortBy, sortOrder);
};

/**
 * Get combined view with ProsjektTiltak-first hierarchy (convenience method)
 */
export const getCombinedProsjektEntitiesTiltakFirst = async (params = {}) => {
  const { page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc" } = params;
  return getPaginatedCombinedProsjektEntities(page, pageSize, search, sortBy, sortOrder);
};

/**
 * Get combined view grouped by Emne (convenience method)
 */
export const getCombinedProsjektEntitiesGroupedByEmne = async (params = {}) => {
  const { page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc" } = params;
  return getPaginatedCombinedProsjektEntities(page, pageSize, search, sortBy, sortOrder);
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