/**
 * Generic Workspace Store
 * 
 * Unified state management for entity workspaces using Zustand.
 * Integrates data hooks, cache management, permissions, and filtering.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createEntityInterface } from '@/components/EntityWorkspace/interface/utils/EntityInterface.js';
import { createGenericCacheManager } from '@/components/EntityWorkspace/interface/services/GenericCacheManager.js';
import { createGenericPermissionService } from '@/components/EntityWorkspace/interface/services/GenericPermissionService.js';
import { createGenericFilterService } from '@/components/EntityWorkspace/interface/services/GenericFilterService.js';

/**
 * Create a generic workspace store for any entity type
 */
export const createGenericWorkspaceStore = (entityType, config = {}) => {
  const storeConfig = {
    debug: false,
    persist: false,
    ...config
  };

  return create(
    devtools(
      subscribeWithSelector((set, get) => {
        // Initialize services
        const entityInterface = createEntityInterface(entityType, storeConfig);
        const filterService = createGenericFilterService(entityType, storeConfig);
        const permissionService = createGenericPermissionService(entityType, storeConfig);
        
        // Cache manager will be initialized when queryClient is available
        let cacheManager = null;
        
        const initializeCacheManager = (queryClient) => {
          if (!cacheManager && queryClient) {
            cacheManager = createGenericCacheManager(entityType, queryClient, storeConfig);
          }
          return cacheManager;
        };

        return {
          // ============ CORE STATE ============
          entityType,
          displayName: entityInterface.adapter.getDisplayName(entityType, true),
          
          // Services
          entityInterface,
          filterService,
          permissionService,
          cacheManager: null,
          
          // ============ DATA STATE ============
          // Entity collection
          entities: [],
          rawData: null,
          loading: false,
          error: null,
          
          // Pagination
          pagination: {
            page: 1,
            pageSize: 50,
            totalCount: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          },
          
          // ============ UI STATE ============
          // Search and filters
          searchQuery: '',
          filters: {
            filterBy: 'all',
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            additionalFilters: {}
          },
          
          // Selection and focus
          selectedEntities: new Set(),
          focusedEntity: null,
          expandedEntities: new Set(),
          
          // View state
          viewMode: 'list', // 'list', 'cards', 'unified'
          showFilters: false,
          showBulkActions: false,
          
          // Available filter options (populated from data)
          availableFilters: {
            statuses: [],
            vurderinger: [],
            emner: [],
            priorities: []
          },
          
          // Statistics
          stats: {
            total: 0,
            obligatorisk: 0,
            optional: 0,
            active: 0,
            completed: 0,
            pending: 0
          },
          
          // ============ ACTIONS ============
          
          /**
           * Initialize store with queryClient and user context
           */
          initialize: (queryClient, userContext = null) => {
            const manager = initializeCacheManager(queryClient);
            
            set(state => ({
              cacheManager: manager,
              permissionService: userContext 
                ? state.permissionService.setUserContext(userContext)
                : state.permissionService
            }));
            
            if (storeConfig.debug) {
              console.log(`GenericWorkspaceStore[${entityType}]: Initialized with queryClient and userContext`);
            }
          },
          
          /**
           * Load entities with current filters and pagination
           */
          loadEntities: async (options = {}) => {
            const state = get();
            const loadOptions = {
              page: state.pagination.page,
              pageSize: state.pagination.pageSize,
              searchQuery: state.searchQuery,
              ...state.filters,
              ...options
            };
            
            set({ loading: true, error: null });
            
            try {
              // This would typically use the data hook or direct API call
              // For now, we'll simulate the interface
              const mockResult = {
                data: [],
                totalCount: 0,
                page: loadOptions.page,
                pageSize: loadOptions.pageSize,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false
              };
              
              // Apply client-side filtering if needed
              let filteredEntities = mockResult.data;
              if (filteredEntities.length > 0) {
                // Apply filters using filter service
                filteredEntities = state.filterService.applyFilters(filteredEntities, state.filters);
                
                // Apply search
                if (state.searchQuery) {
                  filteredEntities = state.filterService.applySearch(filteredEntities, state.searchQuery);
                }
                
                // Apply sorting using filter service
                filteredEntities = state.filterService.applySorting(
                  filteredEntities, 
                  state.filters.sortBy, 
                  state.filters.sortOrder
                );
              }
              
              // Extract available filters from data
              const availableFilters = state.filterService.extractAvailableFilters(filteredEntities);
              
              // Calculate statistics
              const stats = state.filterService.calculateStats(filteredEntities);
              
              set({
                entities: filteredEntities,
                rawData: mockResult,
                loading: false,
                pagination: {
                  page: mockResult.page,
                  pageSize: mockResult.pageSize,
                  totalCount: mockResult.totalCount,
                  totalPages: mockResult.totalPages,
                  hasNextPage: mockResult.hasNextPage,
                  hasPreviousPage: mockResult.hasPreviousPage
                },
                availableFilters,
                stats,
                error: null
              });
              
              if (storeConfig.debug) {
                console.log(`GenericWorkspaceStore[${entityType}]: Loaded ${filteredEntities.length} entities`);
              }
              
            } catch (error) {
              set({
                loading: false,
                error: error.message || 'Failed to load entities',
                entities: [],
                rawData: null
              });
              
              if (storeConfig.debug) {
                console.error(`GenericWorkspaceStore[${entityType}]: Load error`, error);
              }
            }
          },
          
          /**
           * Update search query and reload
           */
          setSearchQuery: async (query) => {
            set({ searchQuery: query, pagination: { ...get().pagination, page: 1 } });
            await get().loadEntities();
          },
          
          /**
           * Update filters and reload
           */
          setFilters: async (newFilters) => {
            set(state => ({
              filters: { ...state.filters, ...newFilters },
              pagination: { ...state.pagination, page: 1 }
            }));
            await get().loadEntities();
          },
          
          /**
           * Update additional filters
           */
          setAdditionalFilters: async (additionalFilters) => {
            set(state => ({
              filters: {
                ...state.filters,
                additionalFilters: { ...state.filters.additionalFilters, ...additionalFilters }
              },
              pagination: { ...state.pagination, page: 1 }
            }));
            await get().loadEntities();
          },
          
          /**
           * Change page
           */
          setPage: async (page) => {
            set(state => ({
              pagination: { ...state.pagination, page }
            }));
            await get().loadEntities();
          },
          
          /**
           * Change page size
           */
          setPageSize: async (pageSize) => {
            set(state => ({
              pagination: { ...state.pagination, pageSize, page: 1 }
            }));
            await get().loadEntities();
          },
          
          /**
           * Entity selection
           */
          selectEntity: (entityId) => {
            set(state => ({
              selectedEntities: new Set([...state.selectedEntities, entityId])
            }));
          },
          
          deselectEntity: (entityId) => {
            set(state => {
              const newSelection = new Set(state.selectedEntities);
              newSelection.delete(entityId);
              return { selectedEntities: newSelection };
            });
          },
          
          toggleEntitySelection: (entityId) => {
            const state = get();
            if (state.selectedEntities.has(entityId)) {
              state.deselectEntity(entityId);
            } else {
              state.selectEntity(entityId);
            }
          },
          
          selectAllEntities: () => {
            set(state => ({
              selectedEntities: new Set(state.entities.map(e => e.id))
            }));
          },
          
          clearSelection: () => {
            set({ selectedEntities: new Set() });
          },
          
          /**
           * Focus management
           */
          setFocusedEntity: (entityId) => {
            set({ focusedEntity: entityId });
          },
          
          clearFocus: () => {
            set({ focusedEntity: null });
          },
          
          /**
           * Expand/collapse entities
           */
          toggleEntityExpansion: (entityId) => {
            set(state => {
              const newExpanded = new Set(state.expandedEntities);
              if (newExpanded.has(entityId)) {
                newExpanded.delete(entityId);
              } else {
                newExpanded.add(entityId);
              }
              return { expandedEntities: newExpanded };
            });
          },
          
          expandAllEntities: () => {
            set(state => ({
              expandedEntities: new Set(state.entities.map(e => e.id))
            }));
          },
          
          collapseAllEntities: () => {
            set({ expandedEntities: new Set() });
          },
          
          /**
           * View mode management
           */
          setViewMode: (viewMode) => {
            set({ viewMode });
          },
          
          toggleFilters: () => {
            set(state => ({ showFilters: !state.showFilters }));
          },
          
          toggleBulkActions: () => {
            set(state => ({ showBulkActions: !state.showBulkActions }));
          },
          
          /**
           * Optimistic updates (will be enhanced with cache integration)
           */
          optimisticCreate: (tempEntity) => {
            const tempId = `temp_${Date.now()}`;
            const entityWithId = { ...tempEntity, id: tempId, _isOptimistic: true };
            
            set(state => ({
              entities: [entityWithId, ...state.entities],
              stats: {
                ...state.stats,
                total: state.stats.total + 1
              }
            }));
            
            return tempId;
          },
          
          optimisticUpdate: (entityId, updates) => {
            set(state => ({
              entities: state.entities.map(entity =>
                entity.id === entityId
                  ? { ...entity, ...updates, _isOptimistic: true }
                  : entity
              )
            }));
          },
          
          optimisticDelete: (entityId) => {
            set(state => ({
              entities: state.entities.filter(entity => entity.id !== entityId),
              selectedEntities: new Set([...state.selectedEntities].filter(id => id !== entityId)),
              stats: {
                ...state.stats,
                total: Math.max(0, state.stats.total - 1)
              }
            }));
          },
          
          /**
           * Rollback optimistic updates
           */
          rollbackOptimistic: () => {
            set(state => ({
              entities: state.entities.filter(entity => !entity._isOptimistic)
            }));
            // Trigger reload to get fresh data
            get().loadEntities();
          },
          
          /**
           * Cache integration
           */
          invalidateCache: async (operation = 'update', data = null) => {
            const state = get();
            if (state.cacheManager) {
              await state.cacheManager.invalidateByPattern(operation, data);
            }
          },
          
          /**
           * Get entity by ID
           */
          getEntityById: (entityId) => {
            return get().entities.find(entity => entity.id === entityId);
          },
          
          /**
           * Get selected entities
           */
          getSelectedEntities: () => {
            const state = get();
            return state.entities.filter(entity => state.selectedEntities.has(entity.id));
          },
          
          /**
           * Get store debug info
           */
          getDebugInfo: () => {
            const state = get();
            return {
              entityType,
              entityCount: state.entities.length,
              selectedCount: state.selectedEntities.size,
              expandedCount: state.expandedEntities.size,
              currentPage: state.pagination.page,
              totalPages: state.pagination.totalPages,
              filters: state.filters,
              searchQuery: state.searchQuery,
              viewMode: state.viewMode,
              loading: state.loading,
              error: state.error,
              services: {
                hasEntityInterface: !!state.entityInterface,
                hasFilterService: !!state.filterService,
                hasPermissionService: !!state.permissionService,
                hasCacheManager: !!state.cacheManager
              }
            };
          },
          
          /**
           * Reset store to initial state
           */
          reset: () => {
            set(state => ({
              entities: [],
              rawData: null,
              loading: false,
              error: null,
              pagination: {
                page: 1,
                pageSize: 50,
                totalCount: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false
              },
              searchQuery: '',
              filters: {
                filterBy: 'all',
                sortBy: 'updatedAt',
                sortOrder: 'desc',
                additionalFilters: {}
              },
              selectedEntities: new Set(),
              focusedEntity: null,
              expandedEntities: new Set(),
              viewMode: 'list',
              showFilters: false,
              showBulkActions: false,
              availableFilters: {
                statuses: [],
                vurderinger: [],
                emner: [],
                priorities: []
              },
              stats: {
                total: 0,
                obligatorisk: 0,
                optional: 0,
                active: 0,
                completed: 0,
                pending: 0
              }
            }));
          }
        };
      }),
      {
        name: `generic-workspace-${entityType}`,
        enabled: storeConfig.debug
      }
    )
  );
};

/**
 * Pre-configured workspace stores for common entity types
 */
export const createTiltakWorkspaceStore = (config = {}) => {
  return createGenericWorkspaceStore('tiltak', config);
};

export const createKravWorkspaceStore = (config = {}) => {
  return createGenericWorkspaceStore('krav', config);
};

export const createProsjektTiltakWorkspaceStore = (config = {}) => {
  return createGenericWorkspaceStore('prosjektTiltak', config);
};

export const createProsjektKravWorkspaceStore = (config = {}) => {
  return createGenericWorkspaceStore('prosjektKrav', config);
};

/**
 * Hook for accessing workspace store
 */
export const useWorkspaceStore = (store) => {
  return store();
};

/**
 * Hook for accessing specific store state
 */
export const useWorkspaceSelector = (store, selector) => {
  return store(selector);
};

export default createGenericWorkspaceStore;