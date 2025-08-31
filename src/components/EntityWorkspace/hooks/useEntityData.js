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
}) => {
  const { currentProject } = useProjectStore();

  // Resolve API configuration
  const apiConfig = useMemo(() => EntityTypeResolver.resolveApiConfig(entityType, modelConfig), [entityType, modelConfig]);

  // Build query key for stable caching - include project context for project entities
  const queryKey = useMemo(() => {
    const isProjectEntity = entityType.includes("prosjekt");
    const baseKey = [entityType, "workspace", "paginated", page, pageSize, searchQuery, sortBy, sortOrder, groupByEmne];

    // Add project context for project-specific entities
    if (isProjectEntity && currentProject) {
      baseKey.push(`project-${currentProject.id}`);
    }

    return baseKey;
  }, [entityType, page, pageSize, searchQuery, sortBy, sortOrder, groupByEmne, currentProject]);

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
          return queryFunction(page, pageSize, searchQuery, sortBy, sortOrder);
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

    // Debug logging for ProsjektKrav
    if (entityType === "prosjekt-krav") {
    }

    return {
      items,
      totalCount,
      totalPages,
      currentPage: page,
    };
  }, [queryResult.data, page, pageSize, entityType]);

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
