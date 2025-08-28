// API endpoints for combined ProsjektKrav/ProsjektTiltak entities
import { API } from "@/api";

/**
 * Get paginated combined view of ProsjektKrav and ProsjektTiltak - matches EntityWorkspace expected format
 * EntityWorkspace expects a function that accepts (page, pageSize, search, sortBy, sortOrder)
 * Uses the dedicated grouped route for project entities
 */
export const getPaginatedCombinedProsjektEntities = (page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc") => {
  // Build query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search,
    sortBy,
    sortOrder,
    // Default view options for grouped route
    primaryView: "prosjektkrav-first",
    showHierarchy: "true",
    showCrossRelations: "true", 
    includeChildren: "true",
    includeRelated: "true",
  });

  // Use the existing combined entities route with project filtering
  return API.get(`/combined-entities/grouped-by-emne?${queryParams}`);
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
  return getPaginatedCombinedProsjektEntities({
    ...params,
    options: {
      ...params.options,
      primaryView: "prosjektkrav-first"
    }
  });
};

/**
 * Get combined view with ProsjektTiltak-first hierarchy (convenience method)
 */
export const getCombinedProsjektEntitiesTiltakFirst = async (params = {}) => {
  return getPaginatedCombinedProsjektEntities({
    ...params,
    options: {
      ...params.options,
      primaryView: "prosjekttiltak-first"
    }
  });
};

/**
 * Get combined view grouped by Emne (convenience method)
 */
export const getCombinedProsjektEntitiesGroupedByEmne = async (params = {}) => {
  return getPaginatedCombinedProsjektEntities({
    ...params,
    options: {
      ...params.options,
      groupByEmne: true
    }
  });
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