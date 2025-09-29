/**
 * Unified State Handler Architecture
 *
 * Central state management system that coordinates all state operations across the application.
 * Follows Command Pattern and Observer Pattern for extensible state management.
 */

import React from "react";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

/**
 * State Operation Types - Extensible enum for different state operations
 */
export const StateOperations = {
  WORKSPACE_SWITCH: "WORKSPACE_SWITCH",
  WORKSPACE_CLEANUP: "WORKSPACE_CLEANUP",
  STORE_RESET: "STORE_RESET",
  CACHE_CLEAR: "CACHE_CLEAR",
  SESSION_CLEANUP: "SESSION_CLEANUP",
  NAVIGATION_CLEANUP: "NAVIGATION_CLEANUP",
  FORM_STATE_CLEAR: "FORM_STATE_CLEAR",
  FILTER_STATE_RESET: "FILTER_STATE_RESET",
  // Extensible - add new operations as needed
};

/**
 * State Context - Contains all contextual information for state operations
 */
class StateContext {
  constructor(operation, payload = {}) {
    this.operation = operation;
    this.payload = payload;
    this.timestamp = Date.now();
    this.id = `${operation}-${this.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    this.metadata = {};
  }

  withMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }
}

/**
 * Abstract State Handler - Base class for all state handlers
 */
class BaseStateHandler {
  constructor(operation) {
    this.operation = operation;
    this.priority = 0; // Higher priority = executed first
  }

  canHandle(context) {
    return context.operation === this.operation;
  }

  async handle(context, stateManager) {
    throw new Error(`Handler for ${this.operation} must implement handle() method`);
  }

  async rollback(context, stateManager) {
    // Optional rollback implementation
  }
}

/**
 * Workspace Switch Handler - Manages workspace transitions
 */
class WorkspaceSwitchHandler extends BaseStateHandler {
  constructor() {
    super(StateOperations.WORKSPACE_SWITCH);
    this.priority = 100;
  }

  async handle(context, stateManager) {
    const { fromEntityType, toEntityType, dto, stores } = context.payload;

    // 1. Save current state
    if (fromEntityType && stores.has(fromEntityType)) {
      const currentStore = stores.get(fromEntityType);
      const currentState = currentStore.getState();

      stateManager.saveState(fromEntityType, {
        entities: currentState.entities,
        selectedEntity: currentState.selectedEntity,
        searchQuery: currentState.searchQuery,
        filters: currentState.filters,
        timestamp: Date.now(),
      });
    }

    // 2. Clear target workspace
    if (toEntityType && stores.has(toEntityType)) {
      const targetStore = stores.get(toEntityType);
      const targetState = targetStore.getState();

      if (targetState.reset) {
        targetState.reset();
      }
    }

    // 3. Update current workspace tracking
    stateManager.updateCurrentWorkspace(toEntityType, dto);

    return { success: true, fromEntityType, toEntityType };
  }
}

/**
 * Store Reset Handler - Handles store cleanup operations
 */
class StoreResetHandler extends BaseStateHandler {
  constructor() {
    super(StateOperations.STORE_RESET);
    this.priority = 50;
  }

  async handle(context, stateManager) {
    const { entityTypes, stores, clearCache = true } = context.payload;

    const resetResults = [];

    for (const entityType of entityTypes) {
      if (stores.has(entityType)) {
        const store = stores.get(entityType);
        const state = store.getState();

        if (state.reset) {
          state.reset();
          resetResults.push({ entityType, success: true });
        } else {
          resetResults.push({ entityType, success: false, error: "No reset method" });
        }

        if (clearCache) {
          stateManager.clearSavedState(entityType);
        }
      }
    }

    return { success: true, results: resetResults };
  }
}

/**
 * Cache Clear Handler - Manages cache clearing operations
 */
class CacheClearHandler extends BaseStateHandler {
  constructor() {
    super(StateOperations.CACHE_CLEAR);
    this.priority = 10;
  }

  async handle(context, stateManager) {
    const { cacheTypes = ["all"], entityTypes = [] } = context.payload;

    if (cacheTypes.includes("all") || cacheTypes.includes("workspace")) {
      // Clear workspace states
      if (entityTypes.length > 0) {
        entityTypes.forEach((entityType) => stateManager.clearSavedState(entityType));
      } else {
        stateManager.clearAllSavedStates();
      }
    }

    if (cacheTypes.includes("all") || cacheTypes.includes("query")) {
      // Clear query cache (would integrate with React Query)
    }

    return { success: true, cacheTypes, entityTypes };
  }
}

/**
 * Main State Handler - Coordinates all state operations
 */
export const useStateHandler = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ============ STATE ============
      handlers: new Map(),
      activeOperations: new Map(),
      operationHistory: [],

      // Workspace-specific state
      currentWorkspace: null,
      currentEntityType: null,
      currentDTO: null,
      savedStates: new Map(),
      activeStores: new Map(),

      // Operation tracking
      isProcessing: false,
      lastOperationTime: null,

      // ============ INITIALIZATION ============
      initialized: false,
      initialize: () => {
        const state = get();

        // Guard against multiple initializations
        if (state.initialized) {
          return;
        }

        // Register default handlers
        const handlers = new Map([
          [StateOperations.WORKSPACE_SWITCH, new WorkspaceSwitchHandler()],
          [StateOperations.STORE_RESET, new StoreResetHandler()],
          [StateOperations.CACHE_CLEAR, new CacheClearHandler()],
        ]);

        set({ handlers, initialized: true });
      },

      // ============ HANDLER REGISTRATION ============
      registerHandler: (handler) => {
        const state = get();
        const newHandlers = new Map(state.handlers);
        newHandlers.set(handler.operation, handler);
        set({ handlers: newHandlers });
      },

      // ============ STORE MANAGEMENT ============
      registerStore: (entityType, store, dto = null) => {
        const state = get();
        const newStores = new Map(state.activeStores);
        newStores.set(entityType, store);
        set({ activeStores: newStores });
      },

      // ============ STATE OPERATIONS ============
      execute: async (operation, payload = {}) => {
        const state = get();

        if (state.isProcessing) {
          // Could implement queuing here if needed
          return { success: false, error: "Operation in progress" };
        }

        set({ isProcessing: true });

        try {
          const context = new StateContext(operation, payload);

          // Find appropriate handler
          const handler = state.handlers.get(operation);
          if (!handler) {
            throw new Error(`No handler registered for operation: ${operation}`);
          }

          // Execute handler

          const result = await handler.handle(context, {
            saveState: (entityType, stateData) => state.saveState(entityType, stateData),
            clearSavedState: (entityType) => state.clearSavedState(entityType),
            clearAllSavedStates: () => state.clearAllSavedStates(),
            updateCurrentWorkspace: (entityType, dto) => state.updateCurrentWorkspace(entityType, dto),
            getSavedState: (entityType) => state.getSavedState(entityType),
          });

          // Record operation
          set((prevState) => ({
            operationHistory: [
              ...prevState.operationHistory.slice(-49),
              {
                // Keep last 50
                context,
                result,
                timestamp: Date.now(),
              },
            ],
            lastOperationTime: Date.now(),
            isProcessing: false,
          }));

          return { success: true, result };
        } catch (error) {
          console.error("StateHandler: Operation failed", { operation, error });
          set({ isProcessing: false });
          return { success: false, error: error.message };
        }
      },

      // ============ WORKSPACE-SPECIFIC OPERATIONS ============
      switchWorkspace: async (toEntityType, dto = null) => {
        const state = get();
        return await state.execute(StateOperations.WORKSPACE_SWITCH, {
          fromEntityType: state.currentEntityType,
          toEntityType,
          dto,
          stores: state.activeStores,
        });
      },

      resetStores: async (entityTypes, clearCache = true) => {
        const state = get();
        return await state.execute(StateOperations.STORE_RESET, {
          entityTypes: Array.isArray(entityTypes) ? entityTypes : [entityTypes],
          stores: state.activeStores,
          clearCache,
        });
      },

      clearCache: async (cacheTypes = ["all"], entityTypes = []) => {
        const state = get();
        return await state.execute(StateOperations.CACHE_CLEAR, {
          cacheTypes: Array.isArray(cacheTypes) ? cacheTypes : [cacheTypes],
          entityTypes: Array.isArray(entityTypes) ? entityTypes : [entityTypes],
        });
      },

      // ============ STATE PERSISTENCE ============
      saveState: (entityType, stateData) => {
        set((prevState) => ({
          savedStates: new Map(prevState.savedStates).set(entityType, stateData),
        }));
      },

      getSavedState: (entityType) => {
        const state = get();
        return state.savedStates.get(entityType);
      },

      clearSavedState: (entityType) => {
        set((prevState) => {
          const newSavedStates = new Map(prevState.savedStates);
          newSavedStates.delete(entityType);
          return { savedStates: newSavedStates };
        });
      },

      clearAllSavedStates: () => {
        set({ savedStates: new Map() });
      },

      updateCurrentWorkspace: (entityType, dto) => {
        set({
          currentWorkspace: entityType,
          currentEntityType: entityType,
          currentDTO: dto,
        });
      },

      // ============ UTILITIES ============
      getDebugInfo: () => {
        const state = get();
        return {
          handlers: Array.from(state.handlers.keys()),
          activeStores: Array.from(state.activeStores.keys()),
          savedStates: Array.from(state.savedStates.keys()),
          currentWorkspace: state.currentWorkspace,
          isProcessing: state.isProcessing,
          operationHistoryCount: state.operationHistory.length,
          lastOperationTime: state.lastOperationTime,
        };
      },
    })),
    { name: "state-handler" }
  )
);

/**
 * React Hook for State Handler operations
 */
export const useStateOperations = () => {
  const {
    initialize,
    execute,
    switchWorkspace,
    resetStores,
    clearCache,
    registerStore,
    registerHandler,
    currentEntityType,
    isProcessing,
    getDebugInfo,
  } = useStateHandler();

  // Auto-initialize on first use
  React.useEffect(() => {
    initialize();
  }, []); // Empty dependency array - only run once

  // Memoize the return object to prevent recreating functions
  return React.useMemo(
    () => ({
      execute,
      switchWorkspace,
      resetStores,
      clearCache,
      registerStore,
      registerHandler,
      currentEntityType,
      isProcessing,
      getDebugInfo,

      // Convenience methods
      createHandler: (operation, handleFn, priority = 0) => {
        class CustomHandler extends BaseStateHandler {
          constructor() {
            super(operation);
            this.priority = priority;
          }

          async handle(context, stateManager) {
            return await handleFn(context, stateManager);
          }
        }

        return new CustomHandler();
      },
    }),
    [execute, switchWorkspace, resetStores, clearCache, registerStore, registerHandler, currentEntityType, isProcessing, getDebugInfo]
  );
};

// Export base classes for custom handlers
export { BaseStateHandler, StateContext };

export default useStateHandler;
