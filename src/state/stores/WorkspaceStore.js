/**
 * WorkspaceStore - Pure workspace state store
 * 
 * This store handles workspace switching, DTO registration,
 * and workspace state persistence. No business logic.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

/**
 * Create workspace store - handles workspace state only
 */
export const createWorkspaceStore = (debug = false) => {
  return create(
    devtools(
      subscribeWithSelector((set, get) => ({
        // ============ CURRENT WORKSPACE ============
        currentEntityType: null,
        currentDTO: null,
        currentWorkspace: null,
        
        // ============ DTO REGISTRY ============
        dtos: new Map(),
        
        // ============ SAVED STATES ============
        savedStates: new Map(),
        
        // ============ WORKSPACE HISTORY ============
        workspaceHistory: [],
        
        // ============ METADATA ============
        lastLoaded: new Map(),
        workspaceSwitchCount: 0,

        // ============ WORKSPACE MANAGEMENT ============

        setCurrentWorkspace: (entityType, dto = null) => {
          if (debug) console.log('[WorkspaceStore] Setting current workspace', { entityType, hasDTO: !!dto });
          
          const state = get();
          
          // Add to history if different from current
          if (state.currentEntityType !== entityType) {
            const newHistory = [...state.workspaceHistory.slice(-9), {
              entityType: state.currentEntityType,
              timestamp: Date.now(),
              switchCount: state.workspaceSwitchCount
            }].filter(item => item.entityType); // Remove null entries
            
            set({
              currentEntityType: entityType,
              currentDTO: dto,
              currentWorkspace: entityType,
              workspaceHistory: newHistory,
              workspaceSwitchCount: state.workspaceSwitchCount + 1
            });
          } else {
            // Same workspace, just update DTO
            set({
              currentDTO: dto
            });
          }
        },

        clearCurrentWorkspace: () => {
          if (debug) console.log('[WorkspaceStore] Clearing current workspace');
          set({
            currentEntityType: null,
            currentDTO: null,
            currentWorkspace: null
          });
        },

        // ============ DTO MANAGEMENT ============

        registerDTO: (entityType, dto) => {
          if (debug) console.log('[WorkspaceStore] Registering DTO', { 
            entityType, 
            dtoType: dto?.constructor?.name 
          });
          
          set(state => ({
            dtos: new Map(state.dtos).set(entityType, dto)
          }));
        },

        unregisterDTO: (entityType) => {
          if (debug) console.log('[WorkspaceStore] Unregistering DTO', entityType);
          
          set(state => {
            const newDtos = new Map(state.dtos);
            newDtos.delete(entityType);
            return { dtos: newDtos };
          });
        },

        getDTO: (entityType) => {
          const state = get();
          return state.dtos.get(entityType);
        },

        getAvailableWorkspaces: () => {
          const state = get();
          return Array.from(state.dtos.keys());
        },

        // ============ STATE PERSISTENCE ============

        setSavedState: (entityType, stateData) => {
          if (debug) console.log('[WorkspaceStore] Saving workspace state', { 
            entityType, 
            entitiesCount: stateData.entities?.length || 0 
          });
          
          set(state => ({
            savedStates: new Map(state.savedStates).set(entityType, {
              ...stateData,
              savedAt: Date.now()
            })
          }));
        },

        getSavedState: (entityType) => {
          const state = get();
          return state.savedStates.get(entityType);
        },

        clearSavedState: (entityType) => {
          if (debug) console.log('[WorkspaceStore] Clearing saved state', entityType);
          
          set(state => {
            const newSavedStates = new Map(state.savedStates);
            newSavedStates.delete(entityType);
            return { savedStates: newSavedStates };
          });
        },

        clearAllSavedStates: () => {
          if (debug) console.log('[WorkspaceStore] Clearing all saved states');
          set({ savedStates: new Map() });
        },

        hasSavedState: (entityType) => {
          const state = get();
          return state.savedStates.has(entityType);
        },

        // ============ METADATA TRACKING ============

        updateLastLoaded: (entityType, timestamp = Date.now()) => {
          if (debug) console.log('[WorkspaceStore] Updating last loaded', { entityType, timestamp });
          
          set(state => ({
            lastLoaded: new Map(state.lastLoaded).set(entityType, timestamp)
          }));
        },

        getLastLoaded: (entityType) => {
          const state = get();
          return state.lastLoaded.get(entityType);
        },

        isStale: (entityType, maxAgeMs = 5 * 60 * 1000) => { // 5 minutes default
          const lastLoaded = get().getLastLoaded(entityType);
          if (!lastLoaded) return true;
          
          return (Date.now() - lastLoaded) > maxAgeMs;
        },

        // ============ WORKSPACE VALIDATION ============

        isWorkspaceActive: (entityType) => {
          const state = get();
          return state.currentEntityType === entityType;
        },

        canSwitchToWorkspace: (entityType) => {
          const state = get();
          return state.dtos.has(entityType);
        },

        getCurrentWorkspaceInfo: () => {
          const state = get();
          return {
            entityType: state.currentEntityType,
            dto: state.currentDTO,
            isActive: !!state.currentEntityType,
            hasDTO: !!state.currentDTO,
            lastLoaded: state.getLastLoaded(state.currentEntityType),
            hasSavedState: state.hasSavedState(state.currentEntityType)
          };
        },

        // ============ WORKSPACE HISTORY ============

        getWorkspaceHistory: () => {
          const state = get();
          return [...state.workspaceHistory].reverse(); // Most recent first
        },

        clearWorkspaceHistory: () => {
          if (debug) console.log('[WorkspaceStore] Clearing workspace history');
          set({ workspaceHistory: [] });
        },

        getPreviousWorkspace: () => {
          const state = get();
          const history = state.workspaceHistory;
          return history.length > 0 ? history[history.length - 1] : null;
        },

        // ============ BULK OPERATIONS ============

        bulkRegisterDTOs: (dtoMap) => {
          if (debug) console.log('[WorkspaceStore] Bulk registering DTOs', Object.keys(dtoMap));
          
          set(state => {
            const newDtos = new Map(state.dtos);
            Object.entries(dtoMap).forEach(([entityType, dto]) => {
              newDtos.set(entityType, dto);
            });
            return { dtos: newDtos };
          });
        },

        bulkClearSavedStates: (entityTypes) => {
          if (debug) console.log('[WorkspaceStore] Bulk clearing saved states', entityTypes);
          
          set(state => {
            const newSavedStates = new Map(state.savedStates);
            entityTypes.forEach(entityType => {
              newSavedStates.delete(entityType);
            });
            return { savedStates: newSavedStates };
          });
        },

        // ============ UTILITIES ============

        reset: () => {
          if (debug) console.log('[WorkspaceStore] Resetting store');
          
          set({
            currentEntityType: null,
            currentDTO: null,
            currentWorkspace: null,
            dtos: new Map(),
            savedStates: new Map(),
            workspaceHistory: [],
            lastLoaded: new Map(),
            workspaceSwitchCount: 0
          });
        },

        getDebugInfo: () => {
          const state = get();
          return {
            currentWorkspace: state.getCurrentWorkspaceInfo(),
            registeredDTOs: Array.from(state.dtos.keys()),
            savedStatesCount: state.savedStates.size,
            savedStatesKeys: Array.from(state.savedStates.keys()),
            workspaceHistoryCount: state.workspaceHistory.length,
            workspaceSwitchCount: state.workspaceSwitchCount,
            lastLoadedCount: state.lastLoaded.size
          };
        },

        // ============ ADVANCED QUERIES ============

        getWorkspaceStats: () => {
          const state = get();
          return {
            totalWorkspaces: state.dtos.size,
            activeSavedStates: state.savedStates.size,
            switchCount: state.workspaceSwitchCount,
            historyLength: state.workspaceHistory.length,
            currentWorkspace: state.currentEntityType,
            oldestSavedState: Array.from(state.savedStates.values())
              .reduce((oldest, current) => 
                !oldest || current.savedAt < oldest.savedAt ? current : oldest, null
              )?.savedAt || null,
            newestSavedState: Array.from(state.savedStates.values())
              .reduce((newest, current) => 
                !newest || current.savedAt > newest.savedAt ? current : newest, null
              )?.savedAt || null
          };
        },

        findStaleWorkspaces: (maxAgeMs = 5 * 60 * 1000) => {
          const state = get();
          const now = Date.now();
          const staleWorkspaces = [];
          
          state.lastLoaded.forEach((timestamp, entityType) => {
            if ((now - timestamp) > maxAgeMs) {
              staleWorkspaces.push({
                entityType,
                lastLoaded: timestamp,
                ageMs: now - timestamp
              });
            }
          });
          
          return staleWorkspaces;
        }
      })),
      { name: 'workspace-store' }
    )
  );
};

// Global store instance
let workspaceStoreInstance = null;

/**
 * Get or create workspace store singleton
 */
export const useWorkspaceStore = (debug = false) => {
  if (!workspaceStoreInstance) {
    workspaceStoreInstance = createWorkspaceStore(debug);
  }
  return workspaceStoreInstance;
};

export default createWorkspaceStore;