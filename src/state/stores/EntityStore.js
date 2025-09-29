/**
 * EntityStore - Pure data store for entities
 *
 * This store only handles data storage and basic state management.
 * All business logic is handled by ports.
 */

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

/**
 * Create entity store - handles pure data state
 */
export const createEntityStore = (debug = false) => {
  return create(
    devtools(
      subscribeWithSelector((set, get) => ({
        // ============ DATA STATE ============
        entities: [],
        loading: false,
        error: null,

        // ============ UI STATE ============
        searchQuery: "",
        filters: {
          filterBy: "all",
          sortBy: "id",
          sortOrder: "asc",
          additionalFilters: {},
        },

        // ============ PAGINATION ============
        pagination: {
          page: 1,
          pageSize: 50,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },

        // ============ SELECTION ============
        selectedEntity: null,
        selectedEntities: new Set(),
        focusedEntity: null,
        expandedEntities: new Set(),

        // ============ AVAILABLE FILTERS ============
        availableFilters: {
          statuses: [],
          vurderinger: [],
          emner: [],
          priorities: [],
        },

        // ============ STATISTICS ============
        stats: {
          total: 0,
          obligatoriske: 0,
          valgfrie: 0,
          completed: 0,
          pending: 0,
        },

        // ============ SETTERS - PURE DATA OPERATIONS ============

        setEntities: (entities) => {
          set({ entities: entities || [] });
        },

        setLoading: (loading) => {
          set({ loading });
        },

        setError: (error) => {
          set({ error });
        },

        clearError: () => set({ error: null }),

        setSearchQuery: (searchQuery) => {
          set({ searchQuery });
        },

        setFilters: (newFilters) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
          }));
        },

        setPagination: (newPagination) => {
          set((state) => ({
            pagination: { ...state.pagination, ...newPagination },
          }));
        },

        setSelectedEntity: (entity) => {
          set({ selectedEntity: entity });
        },

        clearSelection: () => {
          set({
            selectedEntity: null,
            selectedEntities: new Set(),
            focusedEntity: null,
          });
        },

        setSelectedEntities: (entities) => {
          set({ selectedEntities: new Set(entities) });
        },

        setFocusedEntity: (entity) => {
          set({ focusedEntity: entity });
        },

        setExpandedEntities: (entities) => {
          set({ expandedEntities: new Set(entities) });
        },

        setAvailableFilters: (availableFilters) => {
          set({ availableFilters });
        },

        setStats: (stats) => {
          set({ stats });
        },

        // ============ ENTITY OPERATIONS ============

        updateEntity: (entityId, updates) => {
          set((state) => ({
            entities: state.entities.map((entity) => (entity.id === entityId ? { ...entity, ...updates } : entity)),
          }));
        },

        addEntity: (entity) => {
          set((state) => ({
            entities: [entity, ...state.entities],
          }));
        },

        removeEntity: (entityId) => {
          set((state) => ({
            entities: state.entities.filter((entity) => entity.id !== entityId),
          }));
        },

        getEntity: (entityId) => {
          const state = get();
          return state.entities.find((entity) => entity.id === entityId);
        },

        // ============ OPTIMISTIC UPDATES ============

        optimisticCreate: (entityData) => {
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const tempEntity = {
            ...entityData,
            id: tempId,
            _isOptimistic: true,
            _tempId: tempId,
            _createdAt: Date.now(),
          };

          set((state) => ({
            entities: [tempEntity, ...state.entities],
          }));

          return tempId;
        },

        optimisticUpdate: (entityId, updates) => {
          set((state) => ({
            entities: state.entities.map((entity) =>
              entity.id === entityId ? { ...entity, ...updates, _isOptimistic: true, _updatedAt: Date.now() } : entity
            ),
          }));
        },

        optimisticDelete: (entityId) => {
          set((state) => ({
            entities: state.entities.filter((entity) => entity.id !== entityId),
          }));
        },

        replaceTempEntity: (tempId, realEntity) => {
          set((state) => ({
            entities: state.entities.map((entity) => (entity._tempId === tempId ? { ...realEntity, _isOptimistic: false } : entity)),
          }));
        },

        restoreEntity: (entity) => {
          set((state) => ({
            entities: [entity, ...state.entities.filter((e) => e.id !== entity.id)],
          }));
        },

        rollbackOptimistic: (tempId = null) => {
          if (tempId) {
            // Rollback specific temp entity
            set((state) => ({
              entities: state.entities.filter((entity) => entity._tempId !== tempId),
            }));
          } else {
            // Rollback all optimistic changes
            set((state) => ({
              entities: state.entities.filter((entity) => !entity._isOptimistic),
            }));
          }
        },

        // ============ BULK OPERATIONS ============

        bulkUpdate: (entityIds, updates) => {
          set((state) => ({
            entities: state.entities.map((entity) => (entityIds.includes(entity.id) ? { ...entity, ...updates } : entity)),
          }));
        },

        bulkDelete: (entityIds) => {
          set((state) => ({
            entities: state.entities.filter((entity) => !entityIds.includes(entity.id)),
          }));
        },

        // ============ UTILITIES ============

        reset: () => {
          set({
            entities: [],
            loading: false,
            error: null,
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
            selectedEntity: null,
            selectedEntities: new Set(),
            focusedEntity: null,
            expandedEntities: new Set(),
            availableFilters: {
              statuses: [],
              vurderinger: [],
              emner: [],
              priorities: [],
            },
            stats: {
              total: 0,
              obligatoriske: 0,
              valgfrie: 0,
              completed: 0,
              pending: 0,
            },
          });
        },

        getDebugInfo: () => {
          const state = get();
          return {
            entitiesCount: state.entities?.length || 0,
            loading: state.loading,
            error: state.error,
            searchQuery: state.searchQuery,
            selectedEntityId: state.selectedEntity?.id,
            pagination: state.pagination,
            optimisticEntities: state.entities?.filter((e) => e._isOptimistic) || [],
          };
        },
      })),
      { name: "entity-store" }
    )
  );
};

// Global store instance
let entityStoreInstance = null;

/**
 * Get or create entity store singleton
 */
export const useEntityStore = (debug = false) => {
  if (!entityStoreInstance) {
    entityStoreInstance = createEntityStore(debug);
  }
  return entityStoreInstance;
};

export default createEntityStore;
