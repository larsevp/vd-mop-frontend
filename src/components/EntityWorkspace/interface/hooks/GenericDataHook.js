/**
 * Generic Data Hook Interface
 * 
 * Provides standardized data fetching for entity workspaces using adapter pattern.
 * Handles both grouped and paginated responses with unified query building.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createEntityInterface } from '../utils/EntityInterface.js';
import { createGenericCacheManager } from '../services/GenericCacheManager.js';

/**
 * Generic hook for entity data fetching with adapter integration
 */
export const useGenericEntityData = (entityType, options = {}) => {
  const {
    modelConfig,
    queryParams = {},
    enabled = true,
    staleTime = 30000, // 30 seconds
    cacheTime = 600000, // 10 minutes
  } = options;

  // Create EntityInterface for adapter-based operations
  const entityInterface = createEntityInterface(entityType, { modelConfig });
  
  // Get queryClient for cache management
  const queryClient = useQueryClient();
  
  // Create cache manager for advanced cache operations
  const cacheManager = createGenericCacheManager(entityType, queryClient, { 
    modelConfig,
    debug: options.debug 
  });

  // Build query key using adapter-aware cache key generation
  const queryKey = [
    entityType,
    'workspace',
    entityInterface.supportsGroupByEmne(entityType) ? 'grouped' : 'paginated',
    queryParams
  ];

  // Build API request parameters using adapter
  const buildRequestParams = () => {
    const baseParams = {
      page: queryParams.page || 1,
      pageSize: queryParams.pageSize || 50,
      sortBy: queryParams.sortBy || 'updatedAt',
      sortOrder: queryParams.sortOrder || 'desc'
    };

    // Add search parameter if provided
    if (queryParams.searchQuery) {
      baseParams.search = queryParams.searchQuery;
    }

    // Add filter parameters
    if (queryParams.filterBy && queryParams.filterBy !== 'all') {
      baseParams.filterBy = queryParams.filterBy;
    }

    // Add additional filters
    if (queryParams.additionalFilters) {
      Object.keys(queryParams.additionalFilters).forEach(key => {
        const value = queryParams.additionalFilters[key];
        if (value && value !== '' && value !== 'all') {
          baseParams[key] = value;
        }
      });
    }

    // Add grouping parameter if entity supports it
    if (entityInterface.supportsGroupByEmne(entityType)) {
      baseParams.groupByEmne = queryParams.groupByEmne !== false;
    }

    return baseParams;
  };

  const requestParams = buildRequestParams();

  // Create the actual query function
  const queryFn = async () => {
    // This would be replaced with actual API calls in real implementation
    // For now, return mock data structure that matches expected format
    throw new Error('GenericDataHook: API integration not implemented. This hook provides the interface structure.');
  };

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    cacheTime,
    // Transform response using adapter
    select: (data) => {
      if (!data) return null;

      // Use adapter to transform the raw response
      const transformedResponse = entityInterface.adapter.transformResponse(data);
      
      return {
        ...transformedResponse,
        // Add metadata for UI components
        metadata: {
          entityType,
          queryParams: requestParams,
          hasNextPage: transformedResponse.totalPages > transformedResponse.page,
          hasPreviousPage: transformedResponse.page > 1,
        }
      };
    }
  });

  // Return standardized hook result
  return {
    // Data
    data: query.data?.items || [],
    rawData: query.data,
    
    // Pagination info
    totalCount: query.data?.total || 0,
    page: query.data?.page || 1,
    pageSize: query.data?.pageSize || 50,
    totalPages: query.data?.totalPages || 1,
    hasNextPage: query.data?.metadata?.hasNextPage || false,
    hasPreviousPage: query.data?.metadata?.hasPreviousPage || false,
    
    // Status
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Methods
    refetch: query.refetch,
    invalidate: async (operation = 'update', data = null) => {
      await cacheManager.invalidateByPattern(operation, data);
    },
    
    // Metadata
    queryKey,
    requestParams,
    entityInterface,
    cacheManager
  };
};

/**
 * Generic hook for single entity fetching
 */
export const useGenericEntity = (entityType, entityId, options = {}) => {
  const {
    modelConfig,
    enabled = true,
    staleTime = 60000, // 1 minute
  } = options;

  // Create EntityInterface for adapter-based operations
  const entityInterface = createEntityInterface(entityType, { modelConfig });
  
  // Get queryClient for cache management
  const queryClient = useQueryClient();
  
  // Create cache manager for advanced cache operations
  const cacheManager = createGenericCacheManager(entityType, queryClient, { 
    modelConfig,
    debug: options.debug 
  });

  const queryKey = [entityType, 'detail', entityId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // This would be replaced with actual API call
      throw new Error('useGenericEntity: API integration not implemented');
    },
    enabled: enabled && !!entityId,
    staleTime,
    // Transform single entity using adapter
    select: (data) => {
      if (!data) return null;
      return entityInterface.transformEntityForDisplay(data);
    }
  });

  return {
    entity: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate: async (operation = 'update', data = query.data) => {
      await cacheManager.invalidateByPattern(operation, data);
    },
    queryKey,
    entityInterface,
    cacheManager
  };
};

/**
 * Factory function for creating entity-specific data hooks
 */
export const createEntityDataHook = (entityType, defaultModelConfig = null) => {
  return (options = {}) => {
    const mergedOptions = {
      modelConfig: defaultModelConfig,
      ...options
    };
    
    return useGenericEntityData(entityType, mergedOptions);
  };
};

/**
 * Factory function for creating entity-specific single entity hooks  
 */
export const createEntityDetailHook = (entityType, defaultModelConfig = null) => {
  return (entityId, options = {}) => {
    const mergedOptions = {
      modelConfig: defaultModelConfig,
      ...options
    };
    
    return useGenericEntity(entityType, entityId, mergedOptions);
  };
};

// Pre-configured hooks for common entity types
export const useTiltakData = createEntityDataHook('tiltak');
export const useKravData = createEntityDataHook('krav'); 
export const useProsjektTiltakData = createEntityDataHook('prosjektTiltak');
export const useProsjektKravData = createEntityDataHook('prosjektKrav');

export const useTiltak = createEntityDetailHook('tiltak');
export const useKrav = createEntityDetailHook('krav');
export const useProsjektTiltak = createEntityDetailHook('prosjektTiltak');
export const useProsjektKrav = createEntityDetailHook('prosjektKrav');

export default useGenericEntityData;