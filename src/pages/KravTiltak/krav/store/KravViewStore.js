import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * KravViewStore - Persistent view options for Krav workspace
 * 
 * Manages user preferences for how Krav entities are displayed,
 * including which metadata fields to show and layout preferences.
 */
export const useKravViewStore = create(
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
        showUID: false,
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
            showUID: false,
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
      name: 'krav-view-store',
      version: 3, // Bumped to add showUID: false default
    }
  )
);

export default useKravViewStore;