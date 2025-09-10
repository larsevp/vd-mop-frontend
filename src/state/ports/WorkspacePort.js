/**
 * WorkspacePort - Manages workspace switching and state persistence
 * 
 * This port handles all workspace-related operations including switching
 * between different entity types, saving/restoring workspace state,
 * and coordinating between different workspaces.
 */

/**
 * WorkspacePort class - Handles workspace management
 */
export class WorkspacePort {
  constructor(workspaceStore, entityPort, services = {}) {
    this.workspaceStore = workspaceStore;
    this.entityPort = entityPort;
    this.cacheService = services.cacheService;
    this.debug = false;
  }

  setDebug(enabled) {
    this.debug = enabled;
  }

  log(message, data) {
    if (this.debug) {
      console.log(`[WorkspacePort] ${message}`, data);
    }
  }

  // ============ WORKSPACE SWITCHING ============

  /**
   * Switch to a different workspace
   */
  async switchWorkspace(toEntityType, dto = null, options = {}) {
    const { saveCurrentState = true, loadNewData = true } = options;
    
    this.log('Switching workspace', { 
      to: toEntityType, 
      hasDTO: !!dto, 
      saveCurrentState, 
      loadNewData 
    });

    const workspaceState = this.workspaceStore.getState();
    const currentEntityType = workspaceState.currentEntityType;

    try {
      // 1. Save current workspace state if requested
      if (saveCurrentState && currentEntityType && currentEntityType !== toEntityType) {
        await this.saveCurrentWorkspaceState(currentEntityType);
      }

      // 2. Update workspace tracking
      workspaceState.setCurrentWorkspace(toEntityType, dto);

      // 3. Clear entity state for clean transition
      this.entityPort.reset();

      // 4. Load new workspace data if requested
      if (loadNewData) {
        await this.loadWorkspaceData(toEntityType);
      }

      // 5. Restore saved state if available
      const savedState = workspaceState.getSavedState(toEntityType);
      if (savedState) {
        await this.restoreWorkspaceState(toEntityType, savedState);
      }

      this.log('Workspace switched successfully', { 
        from: currentEntityType, 
        to: toEntityType 
      });

      return { success: true, from: currentEntityType, to: toEntityType };

    } catch (error) {
      this.log('Error switching workspace', { 
        from: currentEntityType, 
        to: toEntityType, 
        error 
      });
      throw error;
    }
  }

  /**
   * Save current workspace state
   */
  async saveCurrentWorkspaceState(entityType) {
    this.log('Saving current workspace state', { entityType });

    const entityState = this.entityPort.getState(entityType);
    
    const stateToSave = {
      entities: entityState.entities,
      selectedEntity: entityState.selectedEntity,
      searchQuery: entityState.searchQuery,
      filters: entityState.filters,
      pagination: entityState.pagination,
      availableFilters: entityState.availableFilters,
      timestamp: Date.now()
    };

    this.workspaceStore.getState().setSavedState(entityType, stateToSave);
    
    this.log('Workspace state saved', { entityType, stateSize: stateToSave.entities?.length || 0 });
  }

  /**
   * Restore workspace state
   */
  async restoreWorkspaceState(entityType, savedState) {
    this.log('Restoring workspace state', { entityType, savedState });

    const entityStore = this.entityPort.entityStore.getState();

    // Restore entity data
    if (savedState.entities) {
      entityStore.setEntities(savedState.entities);
    }

    // Restore UI state
    if (savedState.selectedEntity) {
      entityStore.setSelectedEntity(savedState.selectedEntity);
    }

    if (savedState.searchQuery) {
      entityStore.setSearchQuery(savedState.searchQuery);
    }

    if (savedState.filters) {
      entityStore.setFilters(savedState.filters);
    }

    if (savedState.pagination) {
      entityStore.setPagination(savedState.pagination);
    }

    if (savedState.availableFilters) {
      entityStore.setAvailableFilters(savedState.availableFilters);
    }

    this.log('Workspace state restored', { 
      entityType, 
      entitiesCount: savedState.entities?.length || 0 
    });
  }

  /**
   * Load fresh data for workspace
   */
  async loadWorkspaceData(entityType, options = {}) {
    this.log('Loading workspace data', { entityType, options });
    
    try {
      await this.entityPort.loadEntities(entityType, options);
    } catch (error) {
      this.log('Error loading workspace data', { entityType, error });
      throw error;
    }
  }

  // ============ WORKSPACE MANAGEMENT ============

  /**
   * Register a DTO for an entity type
   */
  registerDTO(entityType, dto) {
    this.log('Registering DTO', { entityType, dto: dto?.constructor?.name });
    this.workspaceStore.getState().registerDTO(entityType, dto);
  }

  /**
   * Get current workspace info
   */
  getCurrentWorkspace() {
    const state = this.workspaceStore.getState();
    return {
      entityType: state.currentEntityType,
      dto: state.currentDTO,
      isActive: !!state.currentEntityType
    };
  }

  /**
   * Get all available workspaces
   */
  getAvailableWorkspaces() {
    return this.workspaceStore.getState().getAvailableWorkspaces();
  }

  // ============ STATE CLEANUP ============

  /**
   * Clear saved state for specific workspace
   */
  clearWorkspaceState(entityType) {
    this.log('Clearing workspace state', { entityType });
    this.workspaceStore.getState().clearSavedState(entityType);
  }

  /**
   * Clear all saved workspace states
   */
  clearAllWorkspaceStates() {
    this.log('Clearing all workspace states');
    this.workspaceStore.getState().clearAllSavedStates();
  }

  /**
   * Reset current workspace (clear data but keep workspace active)
   */
  async resetCurrentWorkspace() {
    const currentEntityType = this.workspaceStore.getState().currentEntityType;
    
    if (currentEntityType) {
      this.log('Resetting current workspace', { entityType: currentEntityType });
      
      // Clear entity data
      this.entityPort.reset();
      
      // Clear saved state
      this.clearWorkspaceState(currentEntityType);
      
      // Reload fresh data
      await this.loadWorkspaceData(currentEntityType, { force: true });
    }
  }

  // ============ CACHE MANAGEMENT ============

  /**
   * Clear cache for specific workspace
   */
  async clearWorkspaceCache(entityType) {
    this.log('Clearing workspace cache', { entityType });
    
    if (this.cacheService) {
      await this.cacheService.clearCache(entityType);
    }
    
    // Also clear saved state
    this.clearWorkspaceState(entityType);
  }

  /**
   * Clear all workspace caches
   */
  async clearAllWorkspaceCaches() {
    this.log('Clearing all workspace caches');
    
    if (this.cacheService) {
      await this.cacheService.clearAllCaches();
    }
    
    // Also clear all saved states
    this.clearAllWorkspaceStates();
  }

  // ============ WORKSPACE VALIDATION ============

  /**
   * Check if workspace switch is valid
   */
  canSwitchToWorkspace(entityType) {
    const workspaceState = this.workspaceStore.getState();
    const dto = workspaceState.getDTO(entityType);
    
    return {
      canSwitch: !!dto,
      reason: dto ? 'OK' : 'No DTO registered for entity type',
      entityType,
      hasDTO: !!dto
    };
  }

  /**
   * Validate current workspace state
   */
  validateCurrentWorkspace() {
    const workspace = this.getCurrentWorkspace();
    const entityState = this.entityPort.getState(workspace.entityType);
    
    return {
      isValid: workspace.isActive && !!workspace.dto,
      workspace,
      entityState: {
        hasEntities: !!entityState.entities?.length,
        hasError: !!entityState.error,
        isLoading: entityState.loading
      }
    };
  }

  // ============ UTILITY METHODS ============

  /**
   * Get debug information
   */
  getDebugInfo() {
    const workspaceState = this.workspaceStore.getState();
    const currentWorkspace = this.getCurrentWorkspace();
    
    return {
      currentWorkspace,
      availableWorkspaces: this.getAvailableWorkspaces(),
      savedStates: Array.from(workspaceState.savedStates?.keys() || []),
      registeredDTOs: Array.from(workspaceState.dtos?.keys() || []),
      workspaceHistory: workspaceState.workspaceHistory || []
    };
  }

  /**
   * Force refresh current workspace
   */
  async refreshCurrentWorkspace() {
    const currentEntityType = this.workspaceStore.getState().currentEntityType;
    
    if (currentEntityType) {
      this.log('Refreshing current workspace', { entityType: currentEntityType });
      await this.entityPort.refreshEntities(currentEntityType);
    }
  }
}

/**
 * React Hook for WorkspacePort
 * Provides a stable reference to WorkspacePort instance
 */
let workspacePortInstance = null;

export const useWorkspacePort = (workspaceStore, entityPort, services = {}) => {
  // Create singleton instance
  if (!workspacePortInstance) {
    workspacePortInstance = new WorkspacePort(workspaceStore, entityPort, services);
  }
  
  return workspacePortInstance;
};

export default WorkspacePort;