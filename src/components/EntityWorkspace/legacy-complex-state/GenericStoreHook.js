/**
 * Generic Store Hook - Restored with DTO Integration
 * 
 * React integration for GenericWorkspaceStore with DTO-routed data fetching.
 * Maintains generic infrastructure while routing through DTO contracts.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Main hook for workspace store integration
 */
export const useGenericWorkspace = (store, options = {}) => {
  const queryClient = useQueryClient();
  const [failureCount, setFailureCount] = useState(0);
  const [loadAttempted, setLoadAttempted] = useState(false);
  const errorRef = useRef(null);
  const initializationRef = useRef(false);
  
  const config = {
    enableDataFetching: true,
    enableActions: true,
    autoInitialize: true,
    maxFailures: 3,
    debug: false,
    ...options
  };

  // Get store state
  const storeState = store();

  if (config.debug) {
    console.log('GenericStoreHook: Store state:', {
      entityType: storeState.entityType,
      hasDTO: !!storeState.dto,
      entities: storeState.entities?.length || 0,
      entitiesArray: storeState.entities, // Show actual array
      loading: storeState.loading,
      error: storeState.error,
      loadAttempted
    });
  }

  // Initialize store with queryClient on mount - only once
  useEffect(() => {
    if (config.autoInitialize && !storeState.queryClient && !initializationRef.current) {
      if (config.debug) {
        console.log('GenericStoreHook: Initializing store with queryClient and DTO');
      }
      initializationRef.current = true;
      storeState.initialize(queryClient, config.userContext);
    }
  }, []); // Empty deps - run once on mount

  // Auto-load data on mount if enabled - only once
  useEffect(() => {
    if (!config.enableDataFetching || loadAttempted || failureCount >= config.maxFailures) {
      return;
    }
    
    // Only attempt to load once and if no error
    if (!loadAttempted && !storeState.error) {
      if (config.debug) {
        console.log('GenericStoreHook: First load attempt');
      }
      setLoadAttempted(true);
      
      if (storeState.loadEntities) {
        if (config.debug) {
          console.log('GenericStoreHook: Using storeState.loadEntities');
        }
        storeState.loadEntities();
      }
    }
  }, []); // Empty deps - run once on mount

  // Monitor for failures and increment failure count - use ref to prevent loops
  useEffect(() => {
    if (storeState.error && loadAttempted && storeState.error !== errorRef.current) {
      if (config.debug) {
        console.log('GenericStoreHook: Error detected, incrementing failure count');
      }
      errorRef.current = storeState.error;
      setFailureCount(prev => prev + 1);
    }
  }, [storeState.error, loadAttempted, config.debug]); // Check error changes

  // Enhanced actions with DTO integration
  const enhancedActions = {
    // Load entities (delegates to store which uses DTO)
    loadEntities: useCallback(async (options = {}) => {
      if (config.debug) {
        console.log('GenericStoreHook: Enhanced loadEntities called', options);
      }
      
      if (storeState.loadEntities) {
        await storeState.loadEntities(options);
      }
    }, [storeState.loadEntities, config.debug]),

    // Search with data refetch
    setSearchQuery: useCallback(async (query) => {
      if (config.debug) {
        console.log('GenericStoreHook: Setting search query:', query);
      }
      
      if (storeState.setSearchQuery) {
        storeState.setSearchQuery(query);
        
        // Trigger reload with new search
        if (config.enableDataFetching && storeState.loadEntities) {
          await storeState.loadEntities();
        }
      }
    }, [storeState.setSearchQuery, storeState.loadEntities, config.enableDataFetching, config.debug]),

    // Filter with data refetch
    setFilters: useCallback(async (filters) => {
      if (config.debug) {
        console.log('GenericStoreHook: Setting filters:', filters);
      }
      
      if (storeState.setFilters) {
        storeState.setFilters(filters);
        
        // Trigger reload with new filters
        if (config.enableDataFetching && storeState.loadEntities) {
          await storeState.loadEntities();
        }
      }
    }, [storeState.setFilters, storeState.loadEntities, config.enableDataFetching, config.debug]),

    // Additional filter methods
    setAdditionalFilters: useCallback(async (additionalFilters) => {
      if (config.debug) {
        console.log('GenericStoreHook: Setting additional filters:', additionalFilters);
      }
      
      if (storeState.setFilters) {
        const currentFilters = storeState.filters || {};
        storeState.setFilters({
          ...currentFilters,
          additionalFilters: { ...currentFilters.additionalFilters, ...additionalFilters }
        });
        
        // Trigger reload with new filters
        if (config.enableDataFetching && storeState.loadEntities) {
          await storeState.loadEntities();
        }
      }
    }, [storeState.setFilters, storeState.filters, storeState.loadEntities, config.enableDataFetching, config.debug]),

    // Pagination
    setPage: useCallback(async (page) => {
      if (config.debug) {
        console.log('GenericStoreHook: Setting page:', page);
      }
      
      if (storeState.setPage) {
        storeState.setPage(page);
        
        // Trigger reload with new page
        if (config.enableDataFetching && storeState.loadEntities) {
          await storeState.loadEntities();
        }
      }
    }, [storeState.setPage, storeState.loadEntities, config.enableDataFetching, config.debug]),

    // Selection methods
    setSelectedEntity: useCallback((entity) => {
      if (storeState.setSelectedEntity) {
        storeState.setSelectedEntity(entity);
      }
    }, [storeState.setSelectedEntity]),

    clearSelection: useCallback(() => {
      if (storeState.clearSelection) {
        storeState.clearSelection();
      }
    }, [storeState.clearSelection]),

    // Optimistic update methods (delegate to store)
    optimisticCreate: storeState.optimisticCreate,
    optimisticUpdate: storeState.optimisticUpdate,
    optimisticDelete: storeState.optimisticDelete,
    rollbackOptimistic: storeState.rollbackOptimistic,

    // Reset everything
    reset: useCallback(() => {
      if (storeState.reset) {
        storeState.reset();
        setLoadAttempted(false);
        setFailureCount(0);
      }
    }, [storeState.reset])
  };

  // Return comprehensive workspace interface
  return {
    // Store state (all current state from Zustand store)
    ...storeState,
    
    // Enhanced actions
    actions: enhancedActions,
    
    // Data hook integration (simplified - store handles the data loading)
    dataHook: {
      isLoading: storeState.loading,
      isFetching: storeState.loading,
      isError: !!storeState.error,
      error: storeState.error,
      refetch: enhancedActions.loadEntities,
      invalidate: () => enhancedActions.loadEntities({ force: true })
    },
    
    // Services access (from store)
    services: {
      entityInterface: null, // No longer using EntityInterface
      filterService: null, // Simplified - filtering done in DTO
      permissionService: null, // Simplified
      cacheManager: storeState.cacheManager,
      actionService: null // Simplified
    },
    
    // Utility functions
    getDebugInfo: () => ({
      store: storeState.getDebugInfo ? storeState.getDebugInfo() : storeState,
      hook: {
        loadAttempted,
        failureCount,
        maxFailures: config.maxFailures,
        enableDataFetching: config.enableDataFetching
      },
      config
    }),
    
    // Reset method
    reset: enhancedActions.reset
  };
};

/**
 * Selector hook for specific store state
 */
export const useWorkspaceSelector = (store, selector) => {
  return store(selector);
};

/**
 * Hook for workspace actions only
 */
export const useWorkspaceActions = (store, options = {}) => {
  const workspace = useGenericWorkspace(store, { 
    enableDataFetching: false, // Only actions, no data fetching
    ...options 
  });
  
  return {
    actions: workspace.actions,
    services: workspace.services
  };
};

/**
 * Hook for workspace data only
 */
export const useWorkspaceData = (store, options = {}) => {
  const workspace = useGenericWorkspace(store, { 
    enableActions: false, // Only data, no actions
    ...options 
  });
  
  return {
    entities: workspace.entities,
    pagination: workspace.pagination,
    loading: workspace.loading,
    error: workspace.error,
    stats: workspace.stats,
    availableFilters: workspace.availableFilters,
    dataHook: workspace.dataHook
  };
};

/**
 * Factory functions for creating pre-configured hooks
 */
export const createWorkspaceHook = (entityType, defaultConfig = {}) => {
  return (store, options = {}) => {
    return useGenericWorkspace(store, {
      ...defaultConfig,
      ...options
    });
  };
};

// Pre-configured hooks for common entity types
export const useTiltakWorkspace = createWorkspaceHook('tiltak');
export const useKravWorkspace = createWorkspaceHook('krav');
export const useProsjektTiltakWorkspace = createWorkspaceHook('prosjektTiltak');
export const useProsjektKravWorkspace = createWorkspaceHook('prosjektKrav');

export default useGenericWorkspace;