/**
 * EntityPort - Single entry point for all entity operations
 *
 * This port centralizes all entity-related state operations, providing
 * a clean interface between the UI components and the underlying state management.
 * All entity operations (CRUD, search, filtering) go through this port.
 */

/**
 * EntityPort class - Handles all entity operations
 */
export class EntityPort {
  constructor(entityStore, workspaceStore, services = {}) {
    this.entityStore = entityStore;
    this.workspaceStore = workspaceStore;
    this.cacheService = services.cacheService;
    this.validationService = services.validationService;
    this.debug = false;
  }

  setDebug(enabled) {
    this.debug = enabled;
  }

  log(message, data) {}

  // ============ CORE ENTITY OPERATIONS ============

  /**
   * Load entities for a specific type
   */
  async loadEntities(entityType, options = {}) {
    this.log("Loading entities", { entityType, options });

    const { filters = {}, pagination = {}, searchQuery = "", force = false } = options;

    // Set loading state
    this.entityStore.getState().setLoading(true);
    this.entityStore.getState().clearError();

    try {
      // Get DTO from workspace store
      const workspaceState = this.workspaceStore.getState();
      const dto = workspaceState.getDTO(entityType);

      if (!dto) {
        throw new Error(`No DTO found for entity type: ${entityType}`);
      }

      // Load data through DTO
      const result = await dto.loadData({
        searchQuery,
        ...filters,
        page: pagination.page || 1,
        pageSize: pagination.pageSize || 50,
        force,
      });

      // Update store with results
      const store = this.entityStore.getState();
      store.setEntities(result.items || []);
      store.setPagination({
        page: result.page || 1,
        pageSize: result.pageSize || 50,
        totalCount: result.total || 0,
        totalPages: result.totalPages || 1,
        hasNextPage: result.hasNextPage || false,
        hasPreviousPage: result.hasPreviousPage || false,
      });

      // Extract available filters if supported
      if (dto.extractAvailableFilters && result.items?.length > 0) {
        const availableFilters = dto.extractAvailableFilters(result.items);
        store.setAvailableFilters(availableFilters);
      }

      // Update workspace state
      workspaceState.updateLastLoaded(entityType, Date.now());

      this.log("Entities loaded successfully", {
        entityType,
        count: result.items?.length || 0,
      });

      return result;
    } catch (error) {
      this.log("Error loading entities", { entityType, error });
      this.entityStore.getState().setError(error.message || "Failed to load entities");
      throw error;
    } finally {
      this.entityStore.getState().setLoading(false);
    }
  }

  /**
   * Create a new entity
   */
  async createEntity(entityType, entityData) {
    this.log("Creating entity", { entityType, entityData });

    try {
      // Validate data
      if (this.validationService) {
        this.validationService.validateEntityData(entityType, entityData);
      }

      // Get DTO
      const dto = this.workspaceStore.getState().getDTO(entityType);
      if (!dto || !dto.createEntity) {
        throw new Error(`Create operation not supported for ${entityType}`);
      }

      // Optimistic update
      const tempId = this.entityStore.getState().optimisticCreate(entityData);

      try {
        // Create through DTO
        const result = await dto.createEntity(entityData);

        // Replace temp entity with real entity
        this.entityStore.getState().replaceTempEntity(tempId, result);

        this.log("Entity created successfully", { entityType, result });
        return result;
      } catch (error) {
        // Rollback optimistic update
        this.entityStore.getState().rollbackOptimistic(tempId);
        throw error;
      }
    } catch (error) {
      this.log("Error creating entity", { entityType, error });
      throw error;
    }
  }

  /**
   * Update an existing entity
   */
  async updateEntity(entityType, entityId, updates) {
    this.log("Updating entity", { entityType, entityId, updates });

    try {
      // Validate updates
      if (this.validationService) {
        this.validationService.validateEntityUpdates(entityType, updates);
      }

      // Get DTO
      const dto = this.workspaceStore.getState().getDTO(entityType);
      if (!dto || !dto.updateEntity) {
        throw new Error(`Update operation not supported for ${entityType}`);
      }

      // Optimistic update
      this.entityStore.getState().optimisticUpdate(entityId, updates);

      try {
        // Update through DTO
        const result = await dto.updateEntity(entityId, updates);

        // Update with real result
        this.entityStore.getState().updateEntity(entityId, result);

        this.log("Entity updated successfully", { entityType, entityId });
        return result;
      } catch (error) {
        // Rollback optimistic update
        this.entityStore.getState().rollbackOptimistic();
        throw error;
      }
    } catch (error) {
      this.log("Error updating entity", { entityType, entityId, error });
      throw error;
    }
  }

  /**
   * Delete an entity
   */
  async deleteEntity(entityType, entityId) {
    this.log("Deleting entity", { entityType, entityId });

    try {
      // Get DTO
      const dto = this.workspaceStore.getState().getDTO(entityType);
      if (!dto || !dto.deleteEntity) {
        throw new Error(`Delete operation not supported for ${entityType}`);
      }

      // Store entity for potential rollback
      const entity = this.entityStore.getState().getEntity(entityId);

      // Optimistic delete
      this.entityStore.getState().optimisticDelete(entityId);

      try {
        // Delete through DTO
        await dto.deleteEntity(entityId);

        this.log("Entity deleted successfully", { entityType, entityId });
      } catch (error) {
        // Rollback - restore entity
        if (entity) {
          this.entityStore.getState().restoreEntity(entity);
        }
        throw error;
      }
    } catch (error) {
      this.log("Error deleting entity", { entityType, entityId, error });
      throw error;
    }
  }

  // ============ SEARCH AND FILTERING ============

  /**
   * Update search query and reload data
   */
  async updateSearchQuery(entityType, query) {
    this.log("Updating search query", { entityType, query });

    // Update store state
    this.entityStore.getState().setSearchQuery(query);

    // Reload data with new search
    return this.loadEntities(entityType, {
      searchQuery: query,
      pagination: { page: 1 }, // Reset to first page
    });
  }

  /**
   * Update filters and reload data
   */
  async updateFilters(entityType, filters) {
    this.log("Updating filters", { entityType, filters });

    // Update store state
    this.entityStore.getState().setFilters(filters);

    // Reload data with new filters
    return this.loadEntities(entityType, {
      filters,
      pagination: { page: 1 }, // Reset to first page
    });
  }

  /**
   * Update pagination and reload data
   */
  async updatePagination(entityType, pagination) {
    this.log("Updating pagination", { entityType, pagination });

    // Update store state
    this.entityStore.getState().setPagination(pagination);

    // Reload data with new pagination
    return this.loadEntities(entityType, { pagination });
  }

  // ============ SELECTION MANAGEMENT ============

  /**
   * Set selected entity
   */
  setSelectedEntity(entity) {
    this.log("Setting selected entity", { entity });
    this.entityStore.getState().setSelectedEntity(entity);
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    this.log("Clearing selection");
    this.entityStore.getState().clearSelection();
  }

  // ============ UTILITY METHODS ============

  /**
   * Force refresh entities (bypass cache)
   */
  async refreshEntities(entityType) {
    return this.loadEntities(entityType, { force: true });
  }

  /**
   * Get current state snapshot
   */
  getState(entityType) {
    const entityState = this.entityStore.getState();
    const workspaceState = this.workspaceStore.getState();

    return {
      entities: entityState.entities,
      loading: entityState.loading,
      error: entityState.error,
      searchQuery: entityState.searchQuery,
      filters: entityState.filters,
      pagination: entityState.pagination,
      selectedEntity: entityState.selectedEntity,
      availableFilters: entityState.availableFilters,
      currentWorkspace: workspaceState.currentWorkspace,
      dto: workspaceState.getDTO(entityType),
    };
  }

  /**
   * Reset all entity state
   */
  reset() {
    this.log("Resetting entity state");
    this.entityStore.getState().reset();
  }
}

/**
 * React Hook for EntityPort
 * Provides a stable reference to EntityPort instance
 */
let entityPortInstance = null;

export const useEntityPort = (entityStore, workspaceStore, services = {}) => {
  // Create singleton instance
  if (!entityPortInstance) {
    entityPortInstance = new EntityPort(entityStore, workspaceStore, services);
  }

  return entityPortInstance;
};

export default EntityPort;
