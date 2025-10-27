/**
 * Workspace UI State Store - Simple Zustand store for UI state only
 * 
 * This replaces the complex state management with simple UI state handling.
 * Server state is handled by TanStack Query, this only manages UI interactions.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Simple UI state store for EntityWorkspace
 * Only handles UI state - server state is managed by TanStack Query
 */
export const useWorkspaceUIStore = create(
  devtools(
    (set, get) => ({
      // ============ SELECTION STATE ============
      selectedEntity: null,
      selectedEntities: new Set(),
      focusedEntity: null,
      
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
        // Initialize viewMode from localStorage, default to 'split'
        const saved = localStorage.getItem('entityWorkspace-viewMode');
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
          focusedEntity: null
        });
      },
      
      setSelectedEntities: (entities) => {
        set({ selectedEntities: new Set(entities) });
      },
      
      toggleEntitySelection: (entity) => {
        set((state) => {
          const newSelected = new Set(state.selectedEntities);
          if (newSelected.has(entity.id)) {
            newSelected.delete(entity.id);
          } else {
            newSelected.add(entity.id);
          }
          return { selectedEntities: newSelected };
        });
      },
      
      setFocusedEntity: (entity) => {
        set({ focusedEntity: entity });
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
        // Persist viewMode to localStorage
        localStorage.setItem('entityWorkspace-viewMode', mode);
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
          searchQuery: '',
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
          searchQuery: state.searchQuery,
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
          selectedEntity: state.selectedEntity?.id,
          selectedEntitiesCount: state.selectedEntities.size,
          searchQuery: state.searchQuery,
          filters: state.filters,
          showFilters: state.showFilters,
          viewMode: state.viewMode,
          expandedEntitiesCount: state.expandedEntities.size,
          collapsedSectionsCount: state.collapsedSections.size
        };
      }
    }),
    { 
      name: 'workspace-ui-store',
      serialize: {
        set: false, // Don't serialize Set objects
        map: false  // Don't serialize Map objects  
      }
    }
  )
);

export default useWorkspaceUIStore;