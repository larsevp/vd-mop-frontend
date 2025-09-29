/**
 * Entity State Management Contract
 *
 * This defines the contract for entity state management that all
 * domain-specific implementations must follow.
 */

/**
 * Core Entity State Contract
 * All entity state managers must implement this interface
 */
export class EntityStateContract {
  constructor(dto, options = {}) {
    if (!dto) throw new Error("EntityStateContract requires a DTO");

    this.dto = dto;
    this.options = { debug: false, ...options };
    this.entityType = dto.getPrimaryEntityType ? dto.getPrimaryEntityType() : "unknown";

    // Core state
    this.entities = [];
    this.loading = false;
    this.error = null;
    this.selectedEntity = null;
    this.searchQuery = "";
    this.filters = {};
    this.pagination = { page: 1, pageSize: 50, total: 0 };

    // Cache state
    this.lastLoaded = null;
    this.cacheKey = null;
    this.isStale = false;

    // Subscribers for reactive updates
    this.subscribers = new Set();
  }

  // ============ CORE STATE METHODS (must implement) ============

  /**
   * Load entities - main data loading method
   */
  async loadEntities(params = {}) {
    throw new Error("loadEntities must be implemented by concrete state manager");
  }

  /**
   * Select an entity
   */
  setSelectedEntity(entity) {
    this.selectedEntity = entity;
    this.notifySubscribers();
  }

  /**
   * Update search query
   */
  setSearchQuery(query) {
    this.searchQuery = query;
    this.notifySubscribers();
  }

  /**
   * Update filters
   */
  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
    this.notifySubscribers();
  }

  // ============ CACHE MANAGEMENT CONTRACT ============

  /**
   * Generate cache key for current state
   */
  generateCacheKey(params = {}) {
    const keyParts = [this.entityType, this.searchQuery || "", JSON.stringify(this.filters), JSON.stringify(params)];
    return keyParts.join(":");
  }

  /**
   * Check if data is stale
   */
  isDataStale(maxAgeMs = 5 * 60 * 1000) {
    // 5 minutes default
    if (!this.lastLoaded) return true;
    return Date.now() - this.lastLoaded > maxAgeMs;
  }

  /**
   * Mark cache as stale
   */
  invalidateCache() {
    this.isStale = true;
    this.lastLoaded = null;
    this.cacheKey = null;
    if (this.options.debug) {
    }
  }

  /**
   * Force refresh data (bypass cache)
   */
  async refreshData(params = {}) {
    this.invalidateCache();
    return this.loadEntities({ ...params, force: true });
  }

  // ============ SUBSCRIPTION SYSTEM ============

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of state changes
   */
  notifySubscribers() {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error("Subscriber error:", error);
      }
    });
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return {
      entities: this.entities,
      loading: this.loading,
      error: this.error,
      selectedEntity: this.selectedEntity,
      searchQuery: this.searchQuery,
      filters: this.filters,
      pagination: this.pagination,
      lastLoaded: this.lastLoaded,
      isStale: this.isStale,
      cacheKey: this.cacheKey,
    };
  }

  // ============ UTILITY METHODS ============

  /**
   * Reset all state
   */
  reset() {
    this.entities = [];
    this.loading = false;
    this.error = null;
    this.selectedEntity = null;
    this.searchQuery = "";
    this.filters = {};
    this.pagination = { page: 1, pageSize: 50, total: 0 };
    this.invalidateCache();
    this.notifySubscribers();
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      entityType: this.entityType,
      entitiesCount: this.entities.length,
      loading: this.loading,
      hasError: !!this.error,
      selectedEntityId: this.selectedEntity?.id,
      cacheKey: this.cacheKey,
      lastLoaded: this.lastLoaded,
      isStale: this.isStale,
      subscribersCount: this.subscribers.size,
    };
  }
}

/**
 * Combined Entity State Contract
 * For workspaces that handle multiple entity types
 */
export class CombinedEntityStateContract extends EntityStateContract {
  constructor(dto, options = {}) {
    super(dto, options);

    // Combined-specific state
    this.entityTypeFilter = [];
    this.parentChildRelations = new Map();
    this.crossEntityCache = new Map();
  }

  // ============ COMBINED-SPECIFIC METHODS ============

  /**
   * Load combined entities with cross-entity coordination
   */
  async loadCombinedEntities(params = {}) {
    throw new Error("loadCombinedEntities must be implemented by combined state manager");
  }

  /**
   * Set entity type filter
   */
  setEntityTypeFilter(types) {
    this.entityTypeFilter = Array.isArray(types) ? types : [types];
    this.notifySubscribers();
  }

  /**
   * Update related entities when primary entity changes
   */
  async syncRelatedEntities(primaryEntity) {
    // Override in concrete implementation
    if (this.options.debug) {
    }
  }

  /**
   * Handle cascading updates across entity types
   */
  async handleCascadingUpdates(entityType, entityId, updates) {
    // Override in concrete implementation
    if (this.options.debug) {
    }
  }

  // ============ COMBINED CACHE MANAGEMENT ============

  /**
   * Invalidate cache for specific entity types
   */
  invalidateCacheForTypes(entityTypes) {
    entityTypes.forEach((type) => {
      this.crossEntityCache.delete(type);
    });
    this.invalidateCache();
  }

  /**
   * Get cache key that includes entity type filter
   */
  generateCacheKey(params = {}) {
    const baseKey = super.generateCacheKey(params);
    const typeFilter = this.entityTypeFilter.join(",");
    return `${baseKey}:types:${typeFilter}`;
  }

  /**
   * Reset with combined-specific cleanup
   */
  reset() {
    super.reset();
    this.entityTypeFilter = [];
    this.parentChildRelations.clear();
    this.crossEntityCache.clear();
  }

  /**
   * Get combined-specific state
   */
  getState() {
    return {
      ...super.getState(),
      entityTypeFilter: this.entityTypeFilter,
      parentChildRelations: Array.from(this.parentChildRelations.entries()),
      crossEntityCacheSize: this.crossEntityCache.size,
    };
  }
}

export default EntityStateContract;
