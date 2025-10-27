/**
 * Workspace UI Store Factory - Creates workspace-scoped UI stores
 *
 * This factory creates isolated UI state stores for each workspace type,
 * preventing cross-workspace contamination while maintaining reusable logic.
 * Server state is handled by TanStack Query, this only manages UI interactions.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Factory function to create workspace-scoped UI stores
 * Each workspace gets its own isolated instance of the UI state
 *
 * @param {string} workspaceId - Unique identifier for the workspace (e.g., 'krav', 'tiltak', 'krav-tiltak-combined')
 * @returns {Function} Zustand store hook for the specific workspace
 */
export const createWorkspaceUIStore = (workspaceId) => {
  return create(
    devtools(
      (set, get) => ({
        // ============ SELECTION STATE ============
        selectedEntity: null,
        selectedEntities: new Set(),
        selectedEntitiesMetadata: new Map(), // Map<id, {entityType, renderId}> for combined views
        focusedEntity: null,
        selectionMode: 'single', // 'single' | 'multi'

        // ============ SEARCH & FILTER STATE ============
        searchInput: '', // What user types in search box
        activeSearchQuery: '', // What actually gets sent to API
        filters: {
          filterBy: 'all',
          sortBy: 'id',
          sortOrder: 'asc',
          additionalFilters: {}
        },

        // ============ UI STATE ============
        showFilters: false,
        showBulkActions: false,
        viewMode: (() => {
          // Initialize viewMode from localStorage with workspace-specific key
          const saved = localStorage.getItem(`entityWorkspace-${workspaceId}-viewMode`);
          return saved && ['split', 'cards', 'list', 'flow'].includes(saved) ? saved : 'split';
        })(),

        // ============ EXPANSION STATE ============
        expandedEntities: new Set(),
        collapsedSections: new Set(),

        // ============ ACTIONS ============

        // Selection actions
        setSelectedEntity: (entity) => {
          set({ selectedEntity: entity });
        },

        clearSelection: () => {
          set({
            selectedEntity: null,
            selectedEntities: new Set(),
            selectedEntitiesMetadata: new Map(),
            focusedEntity: null
          });
        },

        setSelectedEntities: (entities) => {
          set({ selectedEntities: new Set(entities) });
        },

        toggleEntitySelection: (entityId, entityMetadata) => {
          set((state) => {
            const newSelected = new Set(state.selectedEntities);
            const newMetadata = new Map(state.selectedEntitiesMetadata);

            if (newSelected.has(entityId)) {
              newSelected.delete(entityId);
              newMetadata.delete(entityId);
            } else {
              newSelected.add(entityId);
              // Store metadata if provided (entityType, renderId for combined views)
              if (entityMetadata) {
                newMetadata.set(entityId, entityMetadata);
              }
            }
            return {
              selectedEntities: newSelected,
              selectedEntitiesMetadata: newMetadata
            };
          });
        },

        setFocusedEntity: (entity) => {
          set({ focusedEntity: entity });
        },

        // Multi-select mode actions
        setSelectionMode: (mode) => {
          set({
            selectionMode: mode,
            // Clear multi-selection when switching to single mode
            selectedEntities: mode === 'single' ? new Set() : get().selectedEntities,
            selectedEntitiesMetadata: mode === 'single' ? new Map() : get().selectedEntitiesMetadata
          });
        },

        toggleSelectionMode: () => {
          set((state) => ({
            selectionMode: state.selectionMode === 'single' ? 'multi' : 'single',
            // Clear multi-selection when switching to single mode
            selectedEntities: state.selectionMode === 'multi' ? new Set() : state.selectedEntities,
            selectedEntitiesMetadata: state.selectionMode === 'multi' ? new Map() : state.selectedEntitiesMetadata
          }));
        },

        selectAll: (ids, entitiesMetadata) => {
          const newMetadata = new Map();
          if (entitiesMetadata && Array.isArray(entitiesMetadata)) {
            entitiesMetadata.forEach(meta => {
              // Use uiKey if available (for combined views), otherwise use id
              const key = meta.uiKey || meta.id;
              if (key && meta.entityType) {
                newMetadata.set(key, {
                  id: meta.id,
                  entityType: meta.entityType,
                  renderId: meta.renderId,
                  uiKey: meta.uiKey
                });
              }
            });
          }
          set({
            selectedEntities: new Set(ids),
            selectedEntitiesMetadata: newMetadata
          });
        },

        // Search & filter actions
        setSearchInput: (input) => {
          set({ searchInput: input });
        },

        setActiveSearchQuery: (query) => {
          set({ activeSearchQuery: query });
        },

        executeSearch: () => {
          set((state) => ({
            activeSearchQuery: state.searchInput
          }));
        },

        setFilters: (newFilters) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters }
          }));
        },

        resetFilters: () => {
          set({
            searchInput: '',
            activeSearchQuery: '',
            filters: {
              filterBy: 'all',
              sortBy: 'id',
              sortOrder: 'asc',
              additionalFilters: {}
            }
          });
        },

        // UI state actions
        setShowFilters: (show) => {
          set({ showFilters: show });
        },

        toggleFilters: () => {
          set((state) => ({ showFilters: !state.showFilters }));
        },

        setShowBulkActions: (show) => {
          set({ showBulkActions: show });
        },

        setViewMode: (mode) => {
          // Persist viewMode to localStorage with workspace-specific key
          localStorage.setItem(`entityWorkspace-${workspaceId}-viewMode`, mode);
          set({ viewMode: mode });
        },

        // Expansion state actions
        toggleEntityExpansion: (entityId) => {
          set((state) => {
            const newExpanded = new Set(state.expandedEntities);
            if (newExpanded.has(entityId)) {
              newExpanded.delete(entityId);
            } else {
              newExpanded.add(entityId);
            }
            return { expandedEntities: newExpanded };
          });
        },

        expandEntity: (entityId) => {
          set((state) => ({
            expandedEntities: new Set(state.expandedEntities).add(entityId)
          }));
        },

        collapseEntity: (entityId) => {
          set((state) => {
            const newExpanded = new Set(state.expandedEntities);
            newExpanded.delete(entityId);
            return { expandedEntities: newExpanded };
          });
        },

        // Section expansion
        toggleSectionCollapse: (sectionId) => {
          set((state) => {
            const newCollapsed = new Set(state.collapsedSections);
            if (newCollapsed.has(sectionId)) {
              newCollapsed.delete(sectionId);
            } else {
              newCollapsed.add(sectionId);
            }
            return { collapsedSections: newCollapsed };
          });
        },

        // ============ UTILITY METHODS ============

        // Reset all UI state
        reset: () => {
          set({
            selectedEntity: null,
            selectedEntities: new Set(),
            focusedEntity: null,
            selectionMode: 'single',
            searchInput: '',
            activeSearchQuery: '',
            filters: {
              filterBy: 'all',
              sortBy: 'id',
              sortOrder: 'asc',
              additionalFilters: {}
            },
            showFilters: false,
            showBulkActions: false,
            viewMode: 'split',
            expandedEntities: new Set(),
            collapsedSections: new Set()
          });
        },

        // Get current state snapshot
        getState: () => {
          const state = get();
          return {
            selectedEntity: state.selectedEntity,
            selectedEntitiesCount: state.selectedEntities.size,
            searchInput: state.searchInput,
            activeSearchQuery: state.activeSearchQuery,
            hasActiveFilters: state.filters.filterBy !== 'all' ||
                             Object.keys(state.filters.additionalFilters).length > 0,
            viewMode: state.viewMode,
            expandedCount: state.expandedEntities.size
          };
        },

        // Debug information
        getDebugInfo: () => {
          const state = get();
          return {
            workspaceId,
            selectedEntity: state.selectedEntity?.id,
            selectedEntitiesCount: state.selectedEntities.size,
            searchInput: state.searchInput,
            activeSearchQuery: state.activeSearchQuery,
            filters: state.filters,
            showFilters: state.showFilters,
            viewMode: state.viewMode,
            expandedEntitiesCount: state.expandedEntities.size,
            collapsedSectionsCount: state.collapsedSections.size
          };
        }
      }),
      {
        name: `workspace-ui-store-${workspaceId}`,
        serialize: {
          set: false, // Don't serialize Set objects
          map: false  // Don't serialize Map objects
        }
      }
    )
  );
};

export default createWorkspaceUIStore;