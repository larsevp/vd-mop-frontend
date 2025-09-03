/**
 * Generic Store Hook
 * 
 * React integration for GenericWorkspaceStore with automatic data fetching,
 * action service integration, and optimistic updates.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createGenericActionService } from '../services/GenericActionService.js';
import { useGenericEntityData } from './GenericDataHook.js';

/**
 * Main hook for workspace store integration
 */
export const useGenericWorkspace = (store, options = {}) => {
  const queryClient = useQueryClient();
  const actionsRef = useRef(null);
  
  const config = {
    enableDataFetching: true,
    enableActions: true,
    autoInitialize: true,
    ...options
  };

  // Get store state and actions
  const storeState = store();
  
  // Initialize store with queryClient on mount
  useEffect(() => {
    if (config.autoInitialize && !storeState.cacheManager) {
      storeState.initialize(queryClient, config.userContext);
    }
  }, [storeState, queryClient, config.autoInitialize, config.userContext]);

  // Initialize action service
  useEffect(() => {
    if (config.enableActions && storeState.cacheManager && !actionsRef.current) {
      actionsRef.current = createGenericActionService(
        storeState.entityType,
        queryClient,
        {
          userContext: config.userContext,
          debug: config.debug,
          ...config.actionConfig
        }
      );
    }
  }, [storeState.cacheManager, storeState.entityType, queryClient, config]);

  // Data fetching integration
  const dataHookOptions = {
    queryParams: {
      page: storeState.pagination.page,
      pageSize: storeState.pagination.pageSize,
      searchQuery: storeState.searchQuery,
      ...storeState.filters
    },
    enabled: config.enableDataFetching && !storeState.loading,
    debug: config.debug,
    ...config.dataHookConfig
  };

  const dataHook = useGenericEntityData(storeState.entityType, dataHookOptions);

  // Sync data hook results with store
  useEffect(() => {
    if (dataHook.data && !dataHook.isLoading && !storeState.loading) {
      // Update store with fresh data
      const state = store.getState();
      
      // Update entities and pagination
      state.entities = dataHook.data;
      state.rawData = dataHook.rawData;
      state.pagination = {
        page: dataHook.page,
        pageSize: dataHook.pageSize,
        totalCount: dataHook.totalCount,
        totalPages: dataHook.totalPages,
        hasNextPage: dataHook.hasNextPage,
        hasPreviousPage: dataHook.hasPreviousPage
      };
      
      // Extract filters and stats using filter service
      if (state.filterService && dataHook.data.length > 0) {
        state.availableFilters = state.filterService.extractAvailableFilters(dataHook.data);
        state.stats = state.filterService.calculateStats(dataHook.data);
      }
      
      state.loading = false;
      state.error = null;
      
      // Trigger store update
      store.setState(state);
    }
  }, [dataHook.data, dataHook.isLoading, dataHook.page, dataHook.totalCount, store, storeState.loading]);

  // Sync loading and error states
  useEffect(() => {
    if (dataHook.isLoading !== storeState.loading) {
      store.setState({ loading: dataHook.isLoading });
    }
  }, [dataHook.isLoading, storeState.loading, store]);

  useEffect(() => {
    if (dataHook.error && !storeState.error) {
      store.setState({ 
        error: dataHook.error.message || 'Failed to load data',
        loading: false 
      });
    }
  }, [dataHook.error, storeState.error, store]);

  // Create enhanced actions with store integration
  const createEnhancedActions = useCallback(() => {
    if (!actionsRef.current) return {};

    const actionService = actionsRef.current;

    return {
      // Create entity with store integration
      createEntity: async (entityData, options = {}) => {
        // Apply optimistic update to store
        const tempId = storeState.optimisticCreate(entityData);
        
        try {
          const result = await actionService.createEntity(entityData, {
            enableOptimistic: false, // Store handles optimistic updates
            ...options
          });
          
          if (result.success) {
            // Replace temp entity with real entity
            const state = store.getState();
            state.entities = state.entities.map(entity =>
              entity.id === tempId ? result.data : entity
            );
            store.setState(state);
            
            // Refresh data
            dataHook.refetch();
          } else {
            // Remove optimistic entity on failure
            const state = store.getState();
            state.entities = state.entities.filter(entity => entity.id !== tempId);
            store.setState(state);
          }
          
          return result;
        } catch (error) {
          // Remove optimistic entity on error
          const state = store.getState();
          state.entities = state.entities.filter(entity => entity.id !== tempId);
          store.setState(state);
          throw error;
        }
      },

      // Update entity with store integration
      updateEntity: async (entityId, updates, options = {}) => {
        // Apply optimistic update to store
        storeState.optimisticUpdate(entityId, updates);
        
        try {
          const result = await actionService.updateEntity(entityId, updates, {
            enableOptimistic: false, // Store handles optimistic updates
            ...options
          });
          
          if (result.success) {
            // Update store with real data
            const state = store.getState();
            state.entities = state.entities.map(entity =>
              entity.id === entityId 
                ? { ...result.data, _isOptimistic: false }
                : entity
            );
            store.setState(state);
          } else {
            // Rollback optimistic update on failure
            storeState.rollbackOptimistic();
            dataHook.refetch();
          }
          
          return result;
        } catch (error) {
          // Rollback optimistic update on error
          storeState.rollbackOptimistic();
          dataHook.refetch();
          throw error;
        }
      },

      // Delete entity with store integration
      deleteEntity: async (entityId, options = {}) => {
        // Apply optimistic update to store
        storeState.optimisticDelete(entityId);
        
        try {
          const result = await actionService.deleteEntity(entityId, {
            enableOptimistic: false, // Store handles optimistic updates
            ...options
          });
          
          if (!result.success) {
            // Rollback optimistic update on failure
            storeState.rollbackOptimistic();
            dataHook.refetch();
          }
          
          return result;
        } catch (error) {
          // Rollback optimistic update on error
          storeState.rollbackOptimistic();
          dataHook.refetch();
          throw error;
        }
      },

      // Bulk operations
      bulkUpdate: async (entityIds, updates, options = {}) => {
        return await actionService.bulkUpdate(entityIds, updates, {
          onSuccess: () => {
            dataHook.refetch();
            storeState.clearSelection();
          },
          ...options
        });
      },

      bulkDelete: async (entityIds, options = {}) => {
        return await actionService.bulkDelete(entityIds, {
          onSuccess: () => {
            dataHook.refetch();
            storeState.clearSelection();
          },
          ...options
        });
      },

      // Validation
      validateEntity: (entityData, operation) => {
        return actionService.validateEntity(entityData, operation);
      }
    };
  }, [actionsRef.current, storeState, store, dataHook]);

  // Enhanced store actions with data fetching integration
  const enhancedStoreActions = {
    // Override loadEntities to use data hook
    loadEntities: useCallback(async (options = {}) => {
      if (options.force || !config.enableDataFetching) {
        // Force reload through store if needed
        await storeState.loadEntities(options);
      } else {
        // Use data hook refetch for normal loads
        await dataHook.refetch();
      }
    }, [storeState.loadEntities, dataHook.refetch, config.enableDataFetching]),

    // Enhanced search with automatic data fetching
    setSearchQuery: useCallback(async (query) => {
      store.setState({ 
        searchQuery: query,
        pagination: { ...storeState.pagination, page: 1 }
      });
      
      if (config.enableDataFetching) {
        // Data hook will automatically refetch due to query change
        await dataHook.refetch();
      } else {
        await storeState.loadEntities();
      }
    }, [store, storeState, dataHook.refetch, config.enableDataFetching]),

    // Enhanced filters with automatic data fetching
    setFilters: useCallback(async (filters) => {
      store.setState({
        filters: { ...storeState.filters, ...filters },
        pagination: { ...storeState.pagination, page: 1 }
      });
      
      if (config.enableDataFetching) {
        await dataHook.refetch();
      } else {
        await storeState.loadEntities();
      }
    }, [store, storeState, dataHook.refetch, config.enableDataFetching]),

    // Enhanced additional filters
    setAdditionalFilters: useCallback(async (additionalFilters) => {
      store.setState({
        filters: {
          ...storeState.filters,
          additionalFilters: { ...storeState.filters.additionalFilters, ...additionalFilters }
        },
        pagination: { ...storeState.pagination, page: 1 }
      });
      
      if (config.enableDataFetching) {
        await dataHook.refetch();
      } else {
        await storeState.loadEntities();
      }
    }, [store, storeState, dataHook.refetch, config.enableDataFetching]),

    // Enhanced pagination
    setPage: useCallback(async (page) => {
      store.setState({
        pagination: { ...storeState.pagination, page }
      });
      
      if (config.enableDataFetching) {
        await dataHook.refetch();
      } else {
        await storeState.loadEntities();
      }
    }, [store, storeState, dataHook.refetch, config.enableDataFetching])
  };

  // Return comprehensive workspace interface
  return {
    // Store state
    ...storeState,
    
    // Data hook integration
    dataHook: {
      isLoading: dataHook.isLoading,
      isFetching: dataHook.isFetching,
      isError: dataHook.isError,
      error: dataHook.error,
      refetch: dataHook.refetch,
      invalidate: dataHook.invalidate
    },
    
    // Enhanced store actions
    actions: {
      ...storeState,
      ...enhancedStoreActions,
      ...createEnhancedActions()
    },
    
    // Services access
    services: {
      entityInterface: storeState.entityInterface,
      filterService: storeState.filterService,
      permissionService: storeState.permissionService,
      cacheManager: storeState.cacheManager,
      actionService: actionsRef.current
    },
    
    // Utility functions
    getDebugInfo: () => ({
      store: storeState.getDebugInfo(),
      dataHook: {
        isLoading: dataHook.isLoading,
        isFetching: dataHook.isFetching,
        isError: dataHook.isError,
        hasData: !!dataHook.data,
        queryKey: dataHook.queryKey
      },
      actions: actionsRef.current ? actionsRef.current.getDebugInfo() : null,
      config
    }),
    
    // Reset everything
    reset: useCallback(() => {
      storeState.reset();
      if (config.enableDataFetching) {
        dataHook.refetch();
      }
    }, [storeState.reset, dataHook.refetch, config.enableDataFetching])
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