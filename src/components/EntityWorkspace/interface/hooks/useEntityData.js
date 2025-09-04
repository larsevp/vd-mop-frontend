/**
 * useEntityData - TanStack Query hook for entity data fetching
 * 
 * Integrates TanStack Query with existing DTO pattern.
 * Replaces complex state management with industry-standard server state handling.
 */

import { useQuery } from '@tanstack/react-query';

/**
 * Main hook for fetching entity data through DTOs
 * 
 * @param {Object} dto - DTO instance (SingleEntityDTO, CombinedEntityDTO, etc.)
 * @param {Object} options - Additional query options
 * @returns {Object} TanStack Query result with entities data
 */
export const useEntityData = (dto, options = {}) => {
  const {
    searchQuery = '',
    filters = {},
    pagination = { page: 1, pageSize: 50 },
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: [
      'entities',
      dto?.entityType || dto?.getPrimaryEntityType?.() || 'unknown',
      searchQuery,
      filters,
      pagination
    ],
    
    queryFn: async () => {
      if (!dto || !dto.loadData) {
        throw new Error('Invalid DTO or missing loadData method');
      }

      const result = await dto.loadData({
        searchQuery,
        filters,
        pagination,
      });

      // Return standardized format
      return {
        items: result.items || [],
        total: result.total || 0,
        page: result.page || pagination.page,
        pageSize: result.pageSize || pagination.pageSize,
        hasMore: result.hasMore || false,
        ...result
      };
    },

    enabled: enabled && !!dto,
    staleTime,
    cacheTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Keep previous data while loading new results (better UX)
    keepPreviousData: true,
    
    // Refetch on window focus for real-time updates
    refetchOnWindowFocus: true,
    
    ...queryOptions
  });
};

/**
 * Hook for combined entity data (multi-entity DTOs)
 * 
 * @param {Object} combinedDTO - CombinedEntityDTO instance  
 * @param {Object} options - Additional query options
 * @returns {Object} TanStack Query result with combined entities
 */
export const useCombinedEntityData = (combinedDTO, options = {}) => {
  const {
    staleTime = 2 * 60 * 1000, // Shorter stale time for combined data
    refetchInterval = 30000, // Auto-refresh every 30 seconds
    ...restOptions
  } = options;

  return useEntityData(combinedDTO, {
    staleTime,
    refetchInterval,
    ...restOptions
  });
};

/**
 * Hook for project-specific entity data
 * 
 * @param {Object} dto - DTO instance
 * @param {string} projectId - Project identifier
 * @param {Object} options - Additional query options  
 * @returns {Object} TanStack Query result with project entities
 */
export const useProjectEntityData = (dto, projectId, options = {}) => {
  return useEntityData(dto, {
    filters: { projectId, ...(options.filters || {}) },
    enabled: !!projectId && (options.enabled !== false),
    ...options
  });
};

export default useEntityData;