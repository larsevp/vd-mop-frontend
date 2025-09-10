/**
 * ProsjektKravTiltakCombinedViewStore - Zustand store for ProsjektKravTiltak combined view options
 * 
 * Manages view state for the combined ProsjektKrav/ProsjektTiltak workspace
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useProsjektKravTiltakCombinedViewStore = create(
  persist(
    (set, get) => ({
      // View options state
      viewOptions: {
        groupByEmne: true,
        showEntityType: true,
        showHierarchy: true,
        showStatus: true,
        showVurdering: true,
        showProjectRelations: true,
        compactMode: false,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      },

      // Update view options
      setViewOptions: (newOptions) => {
        set((state) => ({
          viewOptions: {
            ...state.viewOptions,
            ...newOptions
          }
        }));
      },

      // Reset to defaults
      resetViewOptions: () => {
        set({
          viewOptions: {
            groupByEmne: true,
            showEntityType: true,
            showHierarchy: true,
            showStatus: true,
            showVurdering: true,
            showProjectRelations: true,
            compactMode: false,
            sortBy: 'updatedAt',
            sortOrder: 'desc'
          }
        });
      },

      // Entity type filter
      entityTypeFilter: 'all', // 'all', 'prosjektkrav', 'prosjekttiltak'
      setEntityTypeFilter: (filter) => set({ entityTypeFilter: filter }),

      // Combined view specific settings
      primaryView: 'prosjektkrav-first', // 'prosjektkrav-first', 'prosjekttiltak-first', 'mixed'
      setPrimaryView: (view) => set({ primaryView: view }),

      // Show cross-relations between entities
      showCrossRelations: true,
      setShowCrossRelations: (show) => set({ showCrossRelations: show }),

      // Show relationships to general entities
      showGeneralRelations: true,
      setShowGeneralRelations: (show) => set({ showGeneralRelations: show }),

      // Utility getters
      getFilteredOptions: () => {
        const { viewOptions, entityTypeFilter } = get();
        return {
          ...viewOptions,
          entityTypeFilter
        };
      }
    }),
    {
      name: 'prosjekt-krav-tiltak-combined-view-options',
      version: 1
    }
  )
);

export default useProsjektKravTiltakCombinedViewStore;