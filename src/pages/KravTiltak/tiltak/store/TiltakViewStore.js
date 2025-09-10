import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * TiltakViewStore - Persistent view options for Tiltak workspace
 * 
 * Manages user preferences for how Tiltak entities are displayed,
 * including which metadata fields to show and layout preferences.
 */
export const useTiltakViewStore = create(
  persist(
    (set, get) => ({
      // View options state
      viewOptions: {
        showHierarchy: true,
        showMerknad: true,
        showStatus: false,
        showVurdering: true,
        showPrioritet: true,
        showObligatorisk: false,
        showRelations: true,
        showFavorites: true,
      },

      // Actions
      setViewOptions: (newOptions) => {
        set((state) => ({
          viewOptions: {
            ...state.viewOptions,
            ...newOptions
          }
        }));
      },

      resetViewOptions: () => {
        set({
          viewOptions: {
            showHierarchy: true,
            showMerknad: true,
            showStatus: false,
            showVurdering: true,
            showPrioritet: true,
            showObligatorisk: false,
            showRelations: true,
            showFavorites: true,
          }
        });
      },

      // Utility actions
      toggleViewOption: (optionKey) => {
        set((state) => ({
          viewOptions: {
            ...state.viewOptions,
            [optionKey]: !state.viewOptions[optionKey]
          }
        }));
      }
    }),
    {
      name: 'tiltak-view-store',
      version: 1,
    }
  )
);

export default useTiltakViewStore;