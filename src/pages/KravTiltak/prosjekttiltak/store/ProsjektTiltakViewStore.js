import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * ProsjektTiltakViewStore - Persistent view options for ProsjektTiltak workspace
 * 
 * Manages user preferences for how ProsjektTiltak entities are displayed,
 * including which metadata fields to show and layout preferences.
 */
export const useProsjektTiltakViewStore = create(
  persist(
    (set, get) => ({
      // View options state
      viewOptions: {
        showHierarchy: true,
        showMerknad: true,
        showGeneralTiltak: true,
        showStatus: false,
        showVurdering: true,
        showPrioritet: true,
        showObligatorisk: false,
        showUID: false,
      },


      // View options actions
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
            showGeneralTiltak: true,
            showStatus: false,
            showVurdering: true,
            showPrioritet: true,
            showObligatorisk: false,
            showUID: false,
          }
        });
      },

      toggleViewOption: (optionKey) => {
        set((state) => ({
          viewOptions: {
            ...state.viewOptions,
            [optionKey]: !state.viewOptions[optionKey]
          }
        }));
      },

    }),
    {
      name: 'prosjekttiltak-view-store',
      version: 4, // Bumped to add showUID: false default
    }
  )
);

export default useProsjektTiltakViewStore;