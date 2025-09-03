/**
 * WorkspaceAdapterContract - DTO defining interface requirements
 * 
 * This contract specifies exactly what the generic interface expects
 * from any domain adapter. Any workspace adapter must implement these methods.
 */

/**
 * @typedef {Object} DisplayConfig
 * @property {string} title - Workspace title (e.g., "Krav", "Krav og Tiltak")
 * @property {string[]} entityTypes - Array of entity types (e.g., ["krav"] or ["krav", "tiltak"])
 * @property {boolean} supportsGroupByEmne - Whether entities can be grouped by emne
 * @property {string} layout - Layout type ("split", "list", etc.)
 * @property {string} newButtonLabel - Label for create new button
 */

/**
 * @typedef {Object} FilterField
 * @property {boolean} enabled - Whether this filter is available
 * @property {string} label - Display label for filter
 * @property {string} placeholder - Placeholder text for "all" option
 */

/**
 * @typedef {Object} SortField  
 * @property {string} key - Field key for sorting
 * @property {string} label - Display label for sort option
 */

/**
 * @typedef {Object} FilterConfig
 * @property {Object.<string, FilterField>} fields - Available filter fields (status, vurdering, emne, etc.)
 * @property {SortField[]} sortFields - Available sort options
 * @property {Object} defaults - Default filter/sort values
 */

/**
 * @typedef {Object} QueryFunctions
 * @property {Object} krav - Krav query functions
 * @property {Function} krav.standard - Standard paginated query
 * @property {Function} krav.grouped - Grouped by emne query
 * @property {Object|null} tiltak - Tiltak query functions (null if not combined view)
 */

/**
 * @typedef {Object} TransformedEntity
 * @property {string|number} id - Unique identifier
 * @property {string} entityType - Type of entity ("krav", "tiltak", etc.)
 * @property {string} title - Display title
 * @property {string} uid - Unique business identifier (kravUID, tiltakUID, etc.)
 * @property {string} descriptionCard - Description for card display
 * @property {string} descriptionField - Full description field
 * @property {string} displayType - Human-readable type ("Krav", "Tiltak")
 * @property {string} badgeColor - CSS classes for type badge
 * @property {Object} status - Status object {id, name/navn}
 * @property {Object} vurdering - Vurdering object {id, name/navn}
 * @property {Object} emne - Emne object {id, navn/name}
 * @property {string} createdAt - Creation date
 * @property {string} updatedAt - Last modified date
 * 
 * // STRUCTURAL FIELDS (for general interface operations)
 * @property {string|number|null} parentId - Parent entity ID (for hierarchies)
 * @property {TransformedEntity|null} parent - Parent entity object (for optimistic updates)
 * @property {TransformedEntity[]} children - Child entities array (for optimistic updates)
 * @property {number} level - Hierarchy level (0 = root, 1 = child, etc.)
 * @property {boolean} hasChildren - Whether entity has child entities
 * @property {boolean} isExpanded - Whether entity is expanded in tree view (UI state)
 * @property {string[]} relationships - Array of related entity IDs (for cross-references)
 * 
 * // INTERFACE STATE FIELDS (managed by generic interface)
 * @property {boolean} _isSelected - Whether entity is selected (UI state)
 * @property {boolean} _isOptimistic - Whether entity is optimistic update (pending save)
 * @property {boolean} _isEditing - Whether entity is being edited (UI state)
 * @property {boolean} _hasUnsavedChanges - Whether entity has unsaved changes
 */

/**
 * @typedef {Object} TransformedResponse
 * @property {TransformedEntity[]} items - Array of transformed entities
 * @property {number} total - Total count
 * @property {number} page - Current page
 * @property {number} pageSize - Items per page
 * @property {number} totalPages - Total pages
 * @property {boolean} hasNextPage - Has more pages
 * @property {boolean} hasPreviousPage - Has previous pages
 */

/**
 * @typedef {Object} AvailableFilters
 * @property {string[]} statuses - Available status values
 * @property {string[]} vurderinger - Available vurdering values
 * @property {string[]} emner - Available emne values
 * @property {string[]} entityTypes - Available entity types (for combined views)
 */

/**
 * WorkspaceAdapter Interface Contract
 * 
 * Any domain adapter (KravTiltakAdapter, ProjectAdapter, etc.) must implement:
 */
export const WorkspaceAdapterContract = {
  
  // === CONFIGURATION METHODS ===
  
  /**
   * Get display configuration for workspace UI
   * @returns {DisplayConfig}
   */
  getDisplayConfig() {
    throw new Error('getDisplayConfig() must be implemented');
  },

  /**
   * Get SearchBar filter configuration  
   * @returns {FilterConfig}
   */
  getFilterConfig() {
    throw new Error('getFilterConfig() must be implemented');
  },

  /**
   * Get API query functions for data fetching
   * @returns {QueryFunctions}
   */
  getQueryFunctions() {
    throw new Error('getQueryFunctions() must be implemented');
  },

  // === DATA TRANSFORMATION METHODS ===

  /**
   * Transform raw API response to normalized format
   * @param {Object} rawData - Raw API response
   * @param {string} entityType - Entity type context
   * @returns {TransformedResponse}
   */
  transformResponse(rawData, entityType) {
    throw new Error('transformResponse() must be implemented');
  },

  /**
   * Enhance individual entity with domain-specific fields
   * @param {Object} entity - Base entity
   * @param {string} entityType - Entity type
   * @returns {TransformedEntity}
   */
  enhanceEntity(entity, entityType) {
    throw new Error('enhanceEntity() must be implemented');
  },

  // === COMBINED VIEW METHODS (if applicable) ===

  /**
   * Mix multiple entity arrays for combined view
   * @param {TransformedEntity[]} ...entityArrays - Arrays of entities to combine
   * @returns {TransformedEntity[]}
   */
  combineEntities(...entityArrays) {
    // Default: return first array (single entity type)
    return entityArrays[0] || [];
  },

  // === FILTERING AND SORTING METHODS ===

  /**
   * Filter entities based on criteria
   * @param {TransformedEntity[]} entities - Entity array
   * @param {Object} filters - Filter criteria
   * @returns {TransformedEntity[]}
   */
  filterEntities(entities, filters) {
    throw new Error('filterEntities() must be implemented');
  },

  /**
   * Sort entities by field and order
   * @param {TransformedEntity[]} entities - Entity array
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - "asc" or "desc"
   * @returns {TransformedEntity[]}
   */
  sortEntities(entities, sortBy, sortOrder) {
    throw new Error('sortEntities() must be implemented');
  },

  /**
   * Extract available filter values from entities
   * @param {TransformedEntity[]} entities - Entity array
   * @returns {AvailableFilters}
   */
  extractAvailableFilters(entities) {
    throw new Error('extractAvailableFilters() must be implemented');
  },

  // === STRUCTURAL METHODS (for optimistic updates, hierarchies) ===

  /**
   * Build parent-child relationships in entity array
   * @param {TransformedEntity[]} entities - Flat entity array
   * @returns {TransformedEntity[]} - Entities with parent/children populated
   */
  buildHierarchy(entities) {
    // Default implementation: set parent/children based on parentId
    const entityMap = new Map(entities.map(e => [e.id, {...e, children: []}]));
    
    entities.forEach(entity => {
      if (entity.parentId && entityMap.has(entity.parentId)) {
        const parent = entityMap.get(entity.parentId);
        const child = entityMap.get(entity.id);
        child.parent = parent;
        parent.children.push(child);
        parent.hasChildren = true;
      }
    });
    
    return Array.from(entityMap.values());
  },

  /**
   * Calculate hierarchy level for entity
   * @param {TransformedEntity} entity - Entity to calculate level for
   * @returns {number} - Hierarchy level (0 = root, 1 = child, etc.)
   */
  calculateLevel(entity) {
    let level = 0;
    let current = entity;
    while (current.parent && level < 10) { // Prevent infinite loops
      level++;
      current = current.parent;
    }
    return level;
  },

  /**
   * Find related entities for cross-references
   * @param {TransformedEntity} entity - Entity to find relations for
   * @param {TransformedEntity[]} allEntities - All available entities
   * @returns {TransformedEntity[]} - Array of related entities
   */
  findRelatedEntities(entity, allEntities) {
    if (!entity.relationships || !Array.isArray(entity.relationships)) {
      return [];
    }
    
    return allEntities.filter(e => 
      entity.relationships.includes(e.id) || 
      entity.relationships.includes(e.uid)
    );
  }
};

/**
 * Interface Requirements Summary for Generic Workspace:
 * 
 * 1. ADAPTER INJECTION: GenericWorkspace accepts adapter via props
 * 2. CONFIGURATION: Adapter provides display config, filter config, query functions
 * 3. DATA: Adapter transforms API responses to normalized TransformedEntity[]
 * 4. FILTERING: Adapter handles domain-specific filtering logic  
 * 5. SORTING: Adapter handles domain-specific sorting logic
 * 6. COMBINING: Adapter handles mixing multiple entity types (optional)
 * 
 * The interface only needs to:
 * - Render entity arrays using provided configurations
 * - Call adapter methods for filtering/sorting/combining
 * - Use adapter-provided query functions for data fetching
 * - Display using adapter-provided display configuration
 */

export default WorkspaceAdapterContract;