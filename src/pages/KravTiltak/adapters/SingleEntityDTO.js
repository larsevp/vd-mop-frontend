/**
 * SingleEntityDTO - Unified DTO wrapper for single entity adapters
 * 
 * This creates a consistent interface where all EntityWorkspace components
 * receive a DTO object, regardless of whether they handle single or combined entities.
 * 
 * Architecture:
 * - EntityWorkspace always receives dto={...} prop
 * - SingleEntityDTO wraps a single adapter
 * - CombinedEntityDTO coordinates multiple adapters
 * - Clean, consistent interface across all workspaces
 */

/**
 * SingleEntityDTO class - wraps a single adapter to provide DTO interface
 */
export class SingleEntityDTO {
  constructor(adapter, options = {}) {
    if (!adapter) {
      throw new Error('SingleEntityDTO requires an adapter');
    }
    
    this.adapter = adapter;
    this.options = options;
    this.entityType = this.adapter.getDisplayConfig().entityTypes[0];
  }

  // === DTO CONTRACT METHODS ===
  
  /**
   * Get display configuration (delegates to adapter)
   */
  getDisplayConfig() {
    return this.adapter.getDisplayConfig();
  }

  /**
   * Get filter configuration (delegates to adapter) 
   */
  getFilterConfig() {
    return this.adapter.getFilterConfig();
  }

  /**
   * Get query functions (delegates to adapter)
   */
  getQueryFunctions() {
    return this.adapter.getQueryFunctions();
  }

  /**
   * Transform API response (delegates to adapter)
   */
  transformResponse(rawData) {
    return this.adapter.transformResponse(rawData, this.entityType);
  }

  /**
   * Filter entities (delegates to adapter)
   */
  filterEntities(entities, filters = {}) {
    return this.adapter.filterEntities(entities, filters);
  }

  /**
   * Sort entities (delegates to adapter)
   */
  sortEntities(entities, sortBy = 'updatedAt', sortOrder = 'desc') {
    return this.adapter.sortEntities(entities, sortBy, sortOrder);
  }

  /**
   * Extract available filters (delegates to adapter)
   */
  extractAvailableFilters(entities = []) {
    return this.adapter.extractAvailableFilters(entities);
  }

  /**
   * Get entity UID (delegates to adapter)
   */
  extractUID(entity) {
    return this.adapter.extractUID ? 
      this.adapter.extractUID(entity) : 
      entity.uid || entity.id;
  }

  /**
   * Get entity title (delegates to adapter)
   */
  extractTitle(entity) {
    return this.adapter.extractTitle ? 
      this.adapter.extractTitle(entity) : 
      entity.title || entity.tittel || entity.name;
  }

  /**
   * Get badge color for entity type (delegates to adapter)
   */
  getBadgeColor(entityType) {
    return this.adapter.getBadgeColor ? 
      this.adapter.getBadgeColor(entityType) : 
      'bg-gray-100 text-gray-700';
  }

  /**
   * Get display type name (delegates to adapter)
   */
  getDisplayType(entityType) {
    return this.adapter.getDisplayType ? 
      this.adapter.getDisplayType(entityType) : 
      entityType;
  }

  // === SINGLE ENTITY SPECIFIC METHODS ===

  /**
   * Check if this DTO handles combined entities (always false for single)
   */
  isCombinedView() {
    return false;
  }

  /**
   * Get primary entity type
   */
  getPrimaryEntityType() {
    return this.entityType;
  }

  /**
   * Get all supported entity types (just one for single)
   */
  getSupportedEntityTypes() {
    return [this.entityType];
  }

  // === UTILITY METHODS ===

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      type: 'SingleEntityDTO',
      entityType: this.entityType,
      hasAdapter: !!this.adapter,
      adapterType: this.adapter?.constructor?.name,
      options: this.options
    };
  }

  /**
   * Create a copy with different options
   */
  clone(newOptions = {}) {
    return new SingleEntityDTO(this.adapter, { ...this.options, ...newOptions });
  }
}

/**
 * Factory function for creating SingleEntityDTO instances
 * 
 * @param {Object} adapter - The adapter to wrap
 * @param {Object} options - Additional options
 * @returns {SingleEntityDTO}
 */
export const createSingleEntityDTO = (adapter, options = {}) => {
  return new SingleEntityDTO(adapter, options);
};

export default SingleEntityDTO;