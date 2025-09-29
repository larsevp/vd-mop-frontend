/**
 * Generic Workspace Store - Restored with DTO Integration
 *
 * Unified state management for entity workspaces using Zustand.
 * Routes all entity operations through DTO contracts while maintaining
 * generic infrastructure concerns (caching, state, optimistic updates).
 */

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

/**
 * Create a generic workspace store that works with DTOs
 */
export const createGenericWorkspaceStore = (entityType, config = {}) => {
  const storeConfig = {
    debug: false,
    persist: false,
    ...config,
  };

  return create(
    devtools(
      subscribeWithSelector((set, get) => {
        return {
          // ============ CORE STATE ============
          entityType,
          dto: config.dto || null,

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
            hasPreviousPage: false,
          },

          // ============ UI STATE ============
          // Search and filters
          searchQuery: "",
          filters: {
            filterBy: "all",
            sortBy: "id",
            sortOrder: "asc",
            additionalFilters: {},
          },

          // Selection and focus
          selectedEntities: new Set(),
          selectedEntity: null,
          focusedEntity: null,
          expandedEntities: new Set(),

          // View state
          viewMode: "list", // 'list', 'cards', 'unified'
          showFilters: false,
          showBulkActions: false,

          // Available filter options (populated from data)
          availableFilters: {
            statuses: [],
            vurderinger: [],
            emner: [],
            priorities: [],
          },

          // Statistics
          stats: {
            total: 0,
            obligatoriske: 0,
            valgfrie: 0,
            completed: 0,
            pending: 0,
          },

          // Cache and services
          cacheManager: null,
          queryClient: null,

          // ============ INITIALIZATION ============
          initialize: (queryClient, userContext) => {
            set((state) => ({
              ...state,
              queryClient,
              cacheManager: queryClient, // Simple cache reference
              initialized: true,
            }));
          },

          // ============ DATA LOADING ACTIONS ============
          loadEntities: async (options = {}) => {
            const state = get();

            // Set loading state
            set((prevState) => ({
              ...prevState,
              loading: true,
              error: null,
            }));

            try {
              // Route through DTO if available
              if (state.dto && state.dto.loadData) {
                const result = await state.dto.loadData({
                  page: state.pagination.page,
                  pageSize: state.pagination.pageSize,
                  searchQuery: state.searchQuery,
                  ...state.filters,
                  ...options,
                });

                // Update store with results
                set((prevState) => ({
                  ...prevState,
                  entities: result.items || [],
                  rawData: result,
                  pagination: {
                    page: result.page || 1,
                    pageSize: result.pageSize || 50,
                    totalCount: result.total || 0,
                    totalPages: result.totalPages || 1,
                    hasNextPage: result.hasNextPage || false,
                    hasPreviousPage: result.hasPreviousPage || false,
                  },
                  loading: false,
                  error: null,
                }));

                // Extract available filters if DTO provides extraction method
                if (state.dto.extractAvailableFilters && result.items?.length > 0) {
                  const availableFilters = state.dto.extractAvailableFilters(result.items);
                  set((prevState) => ({
                    ...prevState,
                    availableFilters,
                  }));
                }
              } else {
                console.warn(`GenericWorkspaceStore[${entityType}]: No DTO or loadData method available`);
                set((prevState) => ({
                  ...prevState,
                  loading: false,
                  error: "No data loading method available",
                }));
              }
            } catch (error) {
              console.error(`GenericWorkspaceStore[${entityType}]: Load error:`, error);
              set((prevState) => ({
                ...prevState,
                loading: false,
                error: error.message || "Failed to load entities",
              }));
            }
          },

          // ============ SEARCH AND FILTER ACTIONS ============
          setSearchQuery: (query) => {
            set((state) => ({
              ...state,
              searchQuery: query,
              pagination: { ...state.pagination, page: 1 },
            }));
          },

          setFilters: (newFilters) => {
            set((state) => ({
              ...state,
              filters: { ...state.filters, ...newFilters },
              pagination: { ...state.pagination, page: 1 },
            }));
          },

          setPage: (page) => {
            set((state) => ({
              ...state,
              pagination: { ...state.pagination, page },
            }));
          },

          // ============ SELECTION ACTIONS ============
          setSelectedEntity: (entity) => {
            set((state) => ({ ...state, selectedEntity: entity }));
          },

          clearSelection: () => {
            set((state) => ({
              ...state,
              selectedEntities: new Set(),
              selectedEntity: null,
            }));
          },

          // ============ OPTIMISTIC UPDATES ============
          optimisticCreate: (entityData) => {
            const tempId = `temp-${Date.now()}`;
            const tempEntity = {
              ...entityData,
              id: tempId,
              _isOptimistic: true,
              _tempId: tempId,
            };

            set((state) => ({
              ...state,
              entities: [tempEntity, ...state.entities],
            }));

            return tempId;
          },

          optimisticUpdate: (entityId, updates) => {
            set((state) => ({
              ...state,
              entities: state.entities.map((entity) => (entity.id === entityId ? { ...entity, ...updates, _isOptimistic: true } : entity)),
            }));
          },

          optimisticDelete: (entityId) => {
            set((state) => ({
              ...state,
              entities: state.entities.filter((entity) => entity.id !== entityId),
            }));
          },

          rollbackOptimistic: () => {
            // This would need backup state for proper rollback

            // For now, just trigger a reload
            const state = get();
            if (state.loadEntities) {
              state.loadEntities({ force: true });
            }
          },

          // ============ UTILITY METHODS ============
          reset: () => {
            set((state) => ({
              ...state,
              entities: [],
              rawData: null,
              loading: false,
              error: null,
              selectedEntity: null,
              selectedEntities: new Set(),
              searchQuery: "",
              filters: {
                filterBy: "all",
                sortBy: "id",
                sortOrder: "asc",
                additionalFilters: {},
              },
              pagination: {
                page: 1,
                pageSize: 50,
                totalCount: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            }));
          },

          getDebugInfo: () => {
            const state = get();
            return {
              entityType: state.entityType,
              hasDTO: !!state.dto,
              entitiesCount: state.entities?.length || 0,
              loading: state.loading,
              error: state.error,
              hasQueryClient: !!state.queryClient,
              searchQuery: state.searchQuery,
              filters: state.filters,
              pagination: state.pagination,
            };
          },
        };
      }),
      { name: `workspace-store-${entityType}` }
    )
  );
};

export default createGenericWorkspaceStore;
