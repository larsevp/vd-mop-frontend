import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDefaultViewOptions } from '../renderer';

/**
 * ProsjektKravViewStore - Manages view options state for ProsjektKrav entities
 * 
 * This store handles what information is shown/hidden in ProsjektKrav cards:
 * - View options (showStatus, showVurdering, etc.)
 * - Persists settings to localStorage
 * - Each entity type has its own store for independent settings
 */

export const useProsjektKravViewStore = create(
  persist(
    (set, get) => ({
      // View options state
      viewOptions: getDefaultViewOptions(),

      // Actions
      setViewOptions: (newOptions) => 
        set((state) => ({
          viewOptions: { ...state.viewOptions, ...newOptions }
        })),

      toggleViewOption: (optionKey) =>
        set((state) => ({
          viewOptions: {
            ...state.viewOptions,
            [optionKey]: !state.viewOptions[optionKey]
          }
        })),

      resetViewOptions: () =>
        set({ viewOptions: getDefaultViewOptions() }),

      // Computed getters
      getViewOptions: () => get().viewOptions,
    }),
    {
      name: 'prosjektkrav-view-options', // localStorage key
      partialize: (state) => ({ viewOptions: state.viewOptions }), // Only persist view options
    }
  )
);

export default useProsjektKravViewStore;