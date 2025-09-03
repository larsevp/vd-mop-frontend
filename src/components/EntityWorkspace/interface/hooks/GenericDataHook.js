/**
 * Generic Data Hook Interface
 * 
 * Provides standardized data fetching for entity workspaces using adapter pattern.
 * Handles both grouped and paginated responses with unified query building.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createEntityInterface } from '@/components/EntityWorkspace/interface/utils/EntityInterface.js';
import { createGenericCacheManager } from '@/components/EntityWorkspace/interface/services/GenericCacheManager.js';

/**
 * Generic hook for entity data fetching with adapter integration
 */
// Circuit breaker storage - global to prevent re-attempts across re-renders
const failureCache = new Map();

export const useGenericEntityData = (entityType, options = {}) => {
  console.log(`GenericDataHook[${entityType}]: Hook called with enabled:`, options.enabled);
  
  // Check circuit breaker - if this entity type has failed, disable completely
  const cacheKey = `${entityType}-${JSON.stringify(options.queryParams)}`;
  const hasFailed = failureCache.has(cacheKey);
  
  if (hasFailed) {
    console.log(`GenericDataHook[${entityType}]: Circuit breaker activated - query disabled`);
  } else {
    console.log(`GenericDataHook[${entityType}]: Circuit breaker OK - proceeding with query`);
  }
  
  const {
    modelConfig,
    queryParams = {},
    enabled = true && !hasFailed, // Disable if circuit breaker is active
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
    try {
      console.log(`GenericDataHook[${entityType}]: Starting API call with params:`, requestParams);
      
      // Get the actual query function from the adapter
      const apiQueryFn = entityInterface.adapter.getQueryFunction(entityType, entityInterface.supportsGroupByEmne(entityType));
      
      if (!apiQueryFn) {
        throw new Error(`No query function found for entity type: ${entityType}`);
      }
      
      // Special handling for project-based entities that need projectId
      if (entityType.includes('prosjekt') && (entityType === 'prosjekt-tiltak' || entityType === 'prosjekt-krav')) {
        // For project entities, we need to get the current project from userStore
        const { useProjectStore } = await import('@/stores/userStore');
        const currentProject = useProjectStore.getState().currentProject;
        const projectId = currentProject?.id;
        
        if (!projectId) {
          throw new Error(`Ingen prosjekt valgt for ${entityType}`);
        }
        
        // Call with projectId as the last parameter
        const response = await apiQueryFn(
          requestParams.page,
          requestParams.pageSize,
          requestParams.search || '',
          requestParams.sortBy,
          requestParams.sortOrder,
          projectId // Pass projectId for project entities
        );
        console.log(`GenericDataHook[${entityType}]: API response received:`, response);
        return response?.data || response;
      } else {
        // Regular entities - call with standard parameters
        const response = await apiQueryFn(
          requestParams.page,
          requestParams.pageSize,
          requestParams.search || '',
          requestParams.sortBy,
          requestParams.sortOrder,
          requestParams.filterBy || 'all',
          requestParams.additionalFilters || {}
        );
        return response?.data || response;
      }
      
      // Handle different response formats (some APIs return response.data, others return direct data)
      return response?.data || response;
    } catch (error) {
      // Add to failure cache to activate circuit breaker
      failureCache.set(cacheKey, true);
      console.error(`GenericDataHook[${entityType}]: API call failed - circuit breaker activated:`, error);
      
      // Improve error messaging
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Unknown error occurred while fetching data';
      
      throw new Error(errorMessage);
    }
  };

  console.log(`GenericDataHook[${entityType}]: useQuery setup - enabled: ${enabled}, queryKey:`, queryKey);
  
  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    cacheTime,
    retry: false, // NO RETRIES - stop immediately on failure
    refetchOnWindowFocus: false, // Prevent refetch on focus
    refetchOnMount: false, // Prevent refetch on mount if data exists
    refetchOnReconnect: false, // Prevent refetch on reconnect
    refetchInterval: false, // No automatic refetching
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