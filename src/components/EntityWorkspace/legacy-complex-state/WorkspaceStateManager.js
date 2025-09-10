/**
 * Centralized Workspace State Manager
 * 
 * Handles complex state clearing, caching, and switching logic for all entity workspaces.
 * Prevents cross-contamination between different entity types and manages store lifecycle.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Global workspace state manager
 */
export const useWorkspaceStateManager = create(
  devtools((set, get) => ({
    // ============ ACTIVE WORKSPACE TRACKING ============
    currentWorkspace: null,
    currentEntityType: null,
    currentDTO: null,
    previousWorkspace: null,
    
    // ============ STORE REGISTRY ============
    activeStores: new Map(), // Map of entityType -> store instance
    storeStates: new Map(),  // Map of entityType -> last known state
    
    // ============ LIFECYCLE MANAGEMENT ============
    switchingInProgress: false,
    lastSwitchTime: null,
    
    // ============ ACTIONS ============
    
    /**
     * Register a workspace store for an entity type
     */
    registerStore: (entityType, store, dto = null) => {
      const state = get();
      console.log('WorkspaceStateManager: Registering store', { entityType, hasDTO: !!dto });
      
      const newActiveStores = new Map(state.activeStores);
      newActiveStores.set(entityType, store);
      
      set({
        activeStores: newActiveStores
      });
    },
    
    /**
     * Switch to a new workspace - handles all cleanup and initialization
     */
    switchWorkspace: (newEntityType, newDTO = null) => {
      const state = get();
      const currentEntityType = state.currentEntityType;
      
      console.log('WorkspaceStateManager: Switching workspace', {
        from: currentEntityType,
        to: newEntityType,
        hasNewDTO: !!newDTO,
        switchingInProgress: state.switchingInProgress
      });
      
      // Prevent concurrent switches
      if (state.switchingInProgress) {
        console.log('WorkspaceStateManager: Switch already in progress, ignoring');
        return;
      }
      
      // Same workspace - no need to switch
      if (currentEntityType === newEntityType && state.currentDTO === newDTO) {
        console.log('WorkspaceStateManager: Same workspace, no action needed');
        return;
      }
      
      set({ switchingInProgress: true });
      
      try {
        // 1. Save current workspace state before switching
        if (currentEntityType && state.activeStores.has(currentEntityType)) {
          const currentStore = state.activeStores.get(currentEntityType);
          const currentStoreState = currentStore.getState();
          
          console.log('WorkspaceStateManager: Saving current workspace state', {
            entityType: currentEntityType,
            entitiesCount: currentStoreState.entities?.length || 0
          });
          
          const newStoreStates = new Map(state.storeStates);
          newStoreStates.set(currentEntityType, {
            entities: currentStoreState.entities,
            selectedEntity: currentStoreState.selectedEntity,
            searchQuery: currentStoreState.searchQuery,
            filters: currentStoreState.filters,
            timestamp: Date.now()
          });
          
          set({ storeStates: newStoreStates });
        }
        
        // 2. Clear the new workspace if it exists (prevent cross-contamination)
        if (state.activeStores.has(newEntityType)) {
          const newStore = state.activeStores.get(newEntityType);
          const newStoreState = newStore.getState();
          
          console.log('WorkspaceStateManager: Clearing target workspace', {
            entityType: newEntityType,
            entitiesCount: newStoreState.entities?.length || 0
          });
          
          // Reset the target store
          if (newStoreState.reset) {
            newStoreState.reset();
          }
        }
        
        // 3. Update current workspace tracking
        set({
          previousWorkspace: state.currentWorkspace,
          currentWorkspace: newEntityType,
          currentEntityType: newEntityType,
          currentDTO: newDTO,
          lastSwitchTime: Date.now(),
          switchingInProgress: false
        });
        
        console.log('WorkspaceStateManager: Workspace switch completed', {
          newEntityType,
          hasNewDTO: !!newDTO
        });
        
      } catch (error) {
        console.error('WorkspaceStateManager: Error during workspace switch', error);
        set({ switchingInProgress: false });
      }
    },
    
    /**
     * Clean up a specific workspace
     */
    cleanupWorkspace: (entityType) => {
      const state = get();
      console.log('WorkspaceStateManager: Cleaning up workspace', { entityType });
      
      if (state.activeStores.has(entityType)) {
        const store = state.activeStores.get(entityType);
        const storeState = store.getState();
        
        // Reset store state
        if (storeState.reset) {
          storeState.reset();
        }
        
        // Remove from saved states
        const newStoreStates = new Map(state.storeStates);
        newStoreStates.delete(entityType);
        set({ storeStates: newStoreStates });
      }
    },
    
    /**
     * Get saved state for an entity type
     */
    getSavedState: (entityType) => {
      const state = get();
      return state.storeStates.get(entityType);
    },
    
    /**
     * Clear all workspaces (global reset)
     */
    clearAllWorkspaces: () => {
      const state = get();
      console.log('WorkspaceStateManager: Clearing all workspaces');
      
      // Reset all active stores
      state.activeStores.forEach((store, entityType) => {
        const storeState = store.getState();
        if (storeState.reset) {
          console.log('WorkspaceStateManager: Resetting store', entityType);
          storeState.reset();
        }
      });
      
      // Clear all saved states
      set({
        currentWorkspace: null,
        currentEntityType: null,
        currentDTO: null,
        previousWorkspace: null,
        storeStates: new Map(),
        lastSwitchTime: null,
        switchingInProgress: false
      });
    },
    
    /**
     * Get debug information
     */
    getDebugInfo: () => {
      const state = get();
      return {
        currentWorkspace: state.currentWorkspace,
        currentEntityType: state.currentEntityType,
        activeStoresCount: state.activeStores.size,
        savedStatesCount: state.storeStates.size,
        switchingInProgress: state.switchingInProgress,
        lastSwitchTime: state.lastSwitchTime,
        activeStoreTypes: Array.from(state.activeStores.keys()),
        savedStateTypes: Array.from(state.storeStates.keys())
      };
    }
  }), 
  { name: 'workspace-state-manager' })
);

/**
 * Hook to use workspace state manager in components
 */
export const useWorkspaceSwitch = () => {
  const {
    switchWorkspace,
    cleanupWorkspace,
    clearAllWorkspaces,
    registerStore,
    currentEntityType,
    currentWorkspace,
    switchingInProgress,
    getDebugInfo
  } = useWorkspaceStateManager();
  
  return {
    switchWorkspace,
    cleanupWorkspace,
    clearAllWorkspaces,
    registerStore,
    currentEntityType,
    currentWorkspace,
    switchingInProgress,
    getDebugInfo
  };
};

export default useWorkspaceStateManager;