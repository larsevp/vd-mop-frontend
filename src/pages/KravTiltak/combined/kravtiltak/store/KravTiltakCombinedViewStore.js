/**
 * KravTiltakCombinedViewStore - Zustand store for KravTiltak combined view options
 * 
 * Manages view state for the combined Krav/Tiltak workspace
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Default view options for combined KravTiltak view
const getDefaultViewOptions = () => ({
  groupByEmne: true,
  showEntityType: true,
  showHierarchy: true,
  showMerknad: true,
  showStatus: true,
  showVurdering: true,
  showPrioritet: true,
  showObligatorisk: true,
  showRelations: true,
  compactMode: false,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
});

export const useKravTiltakCombinedViewStore = create(
  persist(
    (set, get) => ({
      // View options state
      viewOptions: getDefaultViewOptions(),

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
          viewOptions: getDefaultViewOptions()
        });
      },

      // Entity type filter
      entityTypeFilter: 'all', // 'all', 'krav', 'tiltak'
      setEntityTypeFilter: (filter) => set({ entityTypeFilter: filter }),

      // Combined view specific settings
      primaryView: 'krav-first', // 'krav-first', 'tiltak-first', 'mixed'
      setPrimaryView: (view) => set({ primaryView: view }),

      // Show cross-relations between entities
      showCrossRelations: true,
      setShowCrossRelations: (show) => set({ showCrossRelations: show }),

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
      name: 'krav-tiltak-combined-view-options',
      version: 1
    }
  )
);

export default useKravTiltakCombinedViewStore;