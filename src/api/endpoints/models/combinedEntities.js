// API endpoints for combined Krav/Tiltak entities
import { API } from "@/api";

/**
 * Get paginated combined view - matches EntityWorkspace expected format
 * EntityWorkspace expects a function that accepts (page, pageSize, search, sortBy, sortOrder)
 * Uses the dedicated grouped route like Krav service
 */
export const getPaginatedCombinedEntities = (
  page = 1,
  pageSize = 50,
  search = "",
  sortBy = "",
  sortOrder = "asc",
  filterBy = "all",
  additionalFilters = {}
) => {
  // Extract actual page number if it's wrapped in an object
  const actualPage =
    typeof page === "object" && page !== null ? page.page || page.pageNumber || page.currentPage || 1 : parseInt(page) || 1;

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: actualPage.toString(),
    pageSize: pageSize.toString(),
    search,
    sortBy,
    sortOrder,
    // Filter parameters
    ...(filterBy && filterBy !== "all" && { filterBy }),
    // Additional filters as separate parameters
    ...(additionalFilters.status && { status: additionalFilters.status }),
    ...(additionalFilters.vurdering && { vurdering: additionalFilters.vurdering }),
    ...(additionalFilters.prioritet && { prioritet: additionalFilters.prioritet }),
    // Default view options for grouped route
    primaryView: "krav-first",
    showHierarchy: "true",
    showCrossRelations: "true",
    includeChildren: "true",
    includeRelated: "true",
  });

  console.log("[DEBUG] Combined entity API call with parameters:", {
    page: actualPage,
    pageSize,
    search,
    sortBy,
    sortOrder,
    filterBy,
    additionalFilters,
    queryParams: queryParams.toString(),
  });

  // Use the dedicated grouped route like Krav service
  return API.get(`/combined-entities/grouped-by-emne?${queryParams}`);
};

/**
 * Advanced version that accepts custom options
 */
export const getPaginatedCombinedEntitiesWithOptions = async (params = {}) => {
  const { page = 1, pageSize = 50, search = "", sortBy = "", sortOrder = "asc", options = {} } = params;

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search,
    sortBy,
    sortOrder,
    // View options
    primaryView: options.primaryView || "krav-first",
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
 * Get combined view with Krav-first hierarchy (convenience method)
 */
export const getCombinedEntitiesKravFirst = async (params = {}) => {
  return getPaginatedCombinedEntities({
    ...params,
    options: {
      ...params.options,
      primaryView: "krav-first",
    },
  });
};

/**
 * Get combined view with Tiltak-first hierarchy (convenience method)
 */
export const getCombinedEntitiesTiltakFirst = async (params = {}) => {
  return getPaginatedCombinedEntities({
    ...params,
    options: {
      ...params.options,
      primaryView: "tiltak-first",
    },
  });
};

/**
 * Get combined view grouped by Emne (convenience method)
 * Matches EntityWorkspace expected signature: (page, pageSize, search, sortBy, sortOrder)
 */
export const getCombinedEntitiesGroupedByEmne = (
  page = 1,
  pageSize = 50,
  search = "",
  sortBy = "",
  sortOrder = "asc",
  filterBy = "all",
  additionalFilters = {}
) => {
  return getPaginatedCombinedEntities(page, pageSize, search, sortBy, sortOrder, filterBy, additionalFilters);
};

/**
 * Combined entity service object for use with CombinedEntityWorkspace
 */
export const combinedEntityService = {
  getPaginatedCombinedView: getPaginatedCombinedEntities,
  getPaginatedCombinedViewWithOptions: getPaginatedCombinedEntitiesWithOptions,
  getKravFirst: getCombinedEntitiesKravFirst,
  getTiltakFirst: getCombinedEntitiesTiltakFirst,
  getGroupedByEmne: getCombinedEntitiesGroupedByEmne,
};
