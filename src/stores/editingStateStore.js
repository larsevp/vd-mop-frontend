import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useCallback } from 'react';

/**
 * Editing State Store
 * 
 * Manages which entities are currently being edited across the application.
 * This eliminates prop drilling and provides centralized state management
 * for editing operations.
 * 
 * Features:
 * - Track multiple entities being edited simultaneously
 * - Check if any entity is being edited (for disabling create buttons)
 * - Check if specific entity is being edited
 * - Clean API for components to interact with editing state
 */

export const useEditingStore = create(
  subscribeWithSelector((set, get) => ({
    // Set of entity IDs that are currently being edited
    editingEntities: new Set(),

    /**
     * Set editing state for a specific entity
     * @param {string|number} entityId - The ID of the entity
     * @param {boolean} isEditing - Whether the entity is being edited
     */
    setEntityEditing: (entityId, isEditing) => {
      set((state) => {
        const newEditingEntities = new Set(state.editingEntities);
        
        if (isEditing) {
          newEditingEntities.add(entityId);
        } else {
          newEditingEntities.delete(entityId);
        }
        
        return {
          editingEntities: newEditingEntities
        };
      });
    },

    /**
     * Check if any entity is currently being edited
     * @returns {boolean}
     */
    isAnyEntityEditing: () => {
      return get().editingEntities.size > 0;
    },

    /**
     * Check if a specific entity is being edited
     * @param {string|number} entityId - The ID of the entity to check
     * @returns {boolean}
     */
    isEntityEditing: (entityId) => {
      return get().editingEntities.has(entityId);
    },

    /**
     * Get all currently editing entity IDs
     * @returns {Array<string|number>}
     */
    getEditingEntities: () => {
      return Array.from(get().editingEntities);
    },

    /**
     * Clear all editing states (useful for cleanup)
     */
    clearAllEditing: () => {
      set({ editingEntities: new Set() });
    },

    /**
     * Get count of entities being edited
     * @returns {number}
     */
    getEditingCount: () => {
      return get().editingEntities.size;
    }
  }))
);

// Selector hooks for better performance (only re-render when specific data changes)
export const useIsAnyEntityEditing = () => useEditingStore((state) => state.editingEntities.size > 0);
export const useEditingCount = () => useEditingStore((state) => state.editingEntities.size);
export const useIsEntityEditing = (entityId) => useEditingStore((state) => state.editingEntities.has(entityId));

// Action hooks (don't cause re-renders) - stable references
export const useEditingActions = () => {
  const setEntityEditing = useCallback((entityId, isEditing) => {
    useEditingStore.getState().setEntityEditing(entityId, isEditing);
  }, []);

  const clearAllEditing = useCallback(() => {
    useEditingStore.getState().clearAllEditing();
  }, []);

  return { setEntityEditing, clearAllEditing };
};