import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { EntityTypeResolver } from "../services/EntityTypeResolver";
import { EntityFilterService } from "../services/EntityFilterService";
import { useProjectStore } from "@/stores/userStore";

/**
 * useEntityData - Pure data fetching hook following SRP
 * Single responsibility: Data fetching and basic processing
 */
export const useEntityData = ({
  entityType,
  modelConfig,
  page = 1,
  pageSize = 50,
  searchQuery = "",
  sortBy = "updatedAt",
  sortOrder = "desc",
  groupByEmne = false,
  filterBy = "all",
  additionalFilters = {},
}) => {
  const { currentProject } = useProjectStore();

  // Resolve API configuration
  const apiConfig = useMemo(() => EntityTypeResolver.resolveApiConfig(entityType, modelConfig), [entityType, modelConfig]);

  // Build query key for stable caching - include project context for project entities
  const queryKey = useMemo(() => {
    const isProjectEntity = entityType.includes("prosjekt");
    const baseKey = [entityType, "workspace", "paginated", page, pageSize, searchQuery, sortBy, sortOrder, groupByEmne, filterBy, additionalFilters];

    // Add project context for project-specific entities
    if (isProjectEntity && currentProject) {
      baseKey.push(`project-${currentProject.id}`);
    }

    return baseKey;
  }, [entityType, page, pageSize, searchQuery, sortBy, sortOrder, groupByEmne, filterBy, additionalFilters, currentProject]);

  // Choose the appropriate query function based on grouping
  // Prefer workspace-specific functions for project entities
  const queryFunction = useMemo(() => {
    if (groupByEmne) {
      return apiConfig.queryFnGroupedByEmneWorkspace || apiConfig.queryFnGroupedByEmne;
    }
    return apiConfig.queryFnWorkspace || apiConfig.queryFnAllWorkspace || apiConfig.queryFn || apiConfig.queryFnAll;
  }, [groupByEmne, apiConfig]);

  // Fetch data with React Query
  const queryResult = useQuery({
    queryKey,
    queryFn: queryFunction
      ? () => {
          // Debug logging for combined entities
          if (entityType === "combined") {
          }
          // Only pass filter parameters to combined entity API functions
          const isCombinedEntity = entityType === "combined" || entityType === "prosjekt-combined";
          
          if (isCombinedEntity) {
            return queryFunction(page, pageSize, searchQuery, sortBy, sortOrder, filterBy, additionalFilters);
          } else {
            return queryFunction(page, pageSize, searchQuery, sortBy, sortOrder);
          }
        }
      : undefined,
    enabled: !!queryFunction, // Only run query if we have a function
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });

  // Process and normalize data
  const processedData = useMemo(() => {
    if (!queryResult.data) {
      return {
        items: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      };
    }

    // Extract data from axios response if needed
    const responseData = queryResult.data.data || queryResult.data;
    const items = responseData.items || responseData.rows || [];
    const totalCount = responseData.totalCount || responseData.count || 0;
    const totalPages = responseData.totalPages || Math.ceil(totalCount / pageSize);

    // Debug logging for combined entities - check for orphan entities
    if (entityType === "combined" || entityType === "prosjekt-combined") {
      const entityTypes = items.map(group => {
        if (group.krav || group.tiltak || group.prosjektKrav || group.prosjektTiltak) {
          // Grouped data - check what entity types are present in each group
          const hasKrav = (group.krav?.length > 0) || (group.prosjektKrav?.length > 0);
          const hasTiltak = (group.tiltak?.length > 0) || (group.prosjektTiltak?.length > 0);
          return { hasKrav, hasTiltak, groupTitle: group.emne?.tittel };
        }
        return { entityType: group.entityType, title: group.tittel || group.navn };
      });
      
    }

    // Apply frontend filtering for non-combined entities (combined entities handle filtering in backend)
    const isCombinedEntity = entityType === "combined" || entityType === "prosjekt-combined";
    let filteredItems = items;
    let finalTotalCount = totalCount;
    let finalTotalPages = totalPages;
    
    if (!isCombinedEntity && (filterBy !== "all" || Object.keys(additionalFilters).length > 0)) {
      // Build filter object combining filterBy and additionalFilters
      const combinedFilters = {
        ...(filterBy && filterBy !== "all" && { filterBy }),
        ...additionalFilters
      };
      
      if (Object.keys(combinedFilters).length > 0) {
        filteredItems = EntityFilterService.applyFilters(filteredItems, combinedFilters, entityType, groupByEmne);
        finalTotalCount = filteredItems.length;
        finalTotalPages = Math.ceil(filteredItems.length / pageSize);
      }
    }

    const result = {
      items: filteredItems,
      totalCount: finalTotalCount,
      totalPages: finalTotalPages,
      currentPage: page,
      originalTotalCount: totalCount, // Keep original count for reference
    };
    
    return result;
  }, [queryResult.data, page, pageSize, entityType, filterBy, additionalFilters]);

  // Clean: Let React Query handle staleness naturally after proper cache invalidation

  // Calculate basic statistics
  const stats = useMemo(() => {
    return EntityFilterService.calculateStats(processedData.items, entityType, groupByEmne);
  }, [processedData.items, entityType, groupByEmne]);

  return {
    // Data
    items: processedData.items,
    stats,
    totalCount: processedData.totalCount,
    totalPages: processedData.totalPages,
    currentPage: processedData.currentPage,

    // Loading states
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    error: queryResult.error,

    // Actions
    refetch: queryResult.refetch,

    // Meta
    hasData: processedData.items.length > 0,
    isEmpty: processedData.items.length === 0 && !queryResult.isLoading,
  };
};

export default useEntityData;
