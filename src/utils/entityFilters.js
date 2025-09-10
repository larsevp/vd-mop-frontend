/**
 * Entity Filtering Utilities
 * 
 * Reusable client-side filtering logic for all entity types.
 * This provides consistent filtering behavior across different models.
 */

/**
 * Apply client-side filters to entity data
 * @param {Array} items - Entity items (can be flat list or grouped structure)
 * @param {string} filterBy - Basic filter type ("all", "obligatorisk", "optional")
 * @param {Object} additionalFilters - Additional filter criteria
 * @returns {Array} Filtered entity items
 */
export const applyEntityFilters = (items, filterBy = "all", additionalFilters = {}) => {
  if (!Array.isArray(items)) return items;
  
  // Handle grouped data structure (items with group.emne)
  if (items.length > 0 && items[0]?.group && items[0]?.items) {
    return items.map(groupData => ({
      ...groupData,
      items: filterEntities(groupData.items, filterBy, additionalFilters)
    })).filter(groupData => groupData.items.length > 0); // Remove empty groups
  }
  
  // Handle flat entity list
  return filterEntities(items, filterBy, additionalFilters);
};

/**
 * Filter individual entities based on criteria
 * @param {Array} entities - Array of entity objects
 * @param {string} filterBy - Basic filter type
 * @param {Object} additionalFilters - Additional filter criteria
 * @returns {Array} Filtered entities
 */
export const filterEntities = (entities, filterBy, additionalFilters) => {
  return entities.filter(entity => {
    // Basic filter (obligatorisk/optional)
    if (filterBy === "obligatorisk" && !entity.obligatorisk) return false;
    if (filterBy === "optional" && entity.obligatorisk) return false;
    
    // Status filter (by ID)
    if (additionalFilters.statusId) {
      if (entity.status?.id !== additionalFilters.statusId) return false;
    }
    
    // Vurdering filter (by ID)
    if (additionalFilters.vurderingId) {
      if (entity.vurdering?.id !== additionalFilters.vurderingId) return false;
    }
    
    // Prioritet filter (calculated levels)
    if (additionalFilters.prioritet) {
      const prioritetLevel = calculatePrioritetLevel(entity.prioritet);
      if (prioritetLevel !== additionalFilters.prioritet) return false;
    }
    
    // Emne filter (by ID)
    if (additionalFilters.emneId) {
      if (entity.emne?.id !== additionalFilters.emneId) return false;
    }
    
    // Obligatorisk filter (explicit true/false)
    if (additionalFilters.obligatorisk !== undefined) {
      const obligatoriskValue = additionalFilters.obligatorisk === "true";
      if (Boolean(entity.obligatorisk) !== obligatoriskValue) return false;
    }
    
    // Entity type filter (for combined views)
    if (additionalFilters.entityType) {
      const entityTypeLower = entity.entityType?.toLowerCase() || "";
      if (entityTypeLower !== additionalFilters.entityType.toLowerCase()) return false;
    }
    
    return true;
  });
};

/**
 * Calculate prioritet level based on numeric value
 * @param {number} prioritetValue - Numeric priority value
 * @returns {string} Priority level ("høy", "middels", "lav")
 */
export const calculatePrioritetLevel = (prioritetValue) => {
  const value = prioritetValue || 0;
  if (value >= 30) return "høy";
  if (value >= 20) return "middels";
  return "lav";
};

/**
 * Extract available filter values from entities (DEPRECATED - use extractAvailableFilters instead)
 * @param {Array} entities - Array of entity objects
 * @returns {Object} Available filter values for dropdowns
 */
export const extractAvailableFilterValues = (entities) => {
  const filters = {
    statuses: new Set(),
    vurderinger: new Set(),
    emner: new Set(),
    entityTypes: new Set(),
  };

  entities.forEach((entity) => {
    // Status values
    const status = entity.status?.name || entity.status?.navn;
    if (status) filters.statuses.add(status);

    // Vurdering values
    const vurdering = entity.vurdering?.name || entity.vurdering?.navn;
    if (vurdering) filters.vurderinger.add(vurdering);

    // Emne values
    const emne = entity.emne?.navn || entity.emne?.name;
    if (emne) filters.emner.add(emne);

    // Entity type values
    if (entity.entityType) filters.entityTypes.add(entity.entityType);
  });

  return {
    statuses: Array.from(filters.statuses).sort(),
    vurderinger: Array.from(filters.vurderinger).sort(),
    emner: Array.from(filters.emner).sort(),
    entityTypes: Array.from(filters.entityTypes).sort(),
  };
};

/**
 * Extract available filters for Select components (ID-based) and backwards compatibility (name-based)
 * This is the shared logic that all adapters should use
 * 
 * @param {Array} entities - Array of entity objects
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeEntityTypes - Whether to include entityTypes (for combined views)
 * @returns {Object} Available filter IDs and names for UI components
 */
export const extractAvailableFilters = (entities = [], options = {}) => {
  const { includeEntityTypes = false } = options;
  
  const filters = {
    statusIds: new Set(),
    vurderingIds: new Set(),
    emneIds: new Set(),
    // Keep names for backwards compatibility and display
    statuses: new Set(),
    vurderinger: new Set(),
    emner: new Set(),
  };

  // Add entityTypes for combined views
  if (includeEntityTypes) {
    filters.entityTypes = new Set();
  }

  entities.forEach((entity) => {
    // Extract status ID and name
    if (entity.status?.id) filters.statusIds.add(entity.status.id);
    const status = entity.status?.name || entity.status?.navn;
    if (status) filters.statuses.add(status);

    // Extract vurdering ID and name
    if (entity.vurdering?.id) filters.vurderingIds.add(entity.vurdering.id);
    const vurdering = entity.vurdering?.name || entity.vurdering?.navn;
    if (vurdering) filters.vurderinger.add(vurdering);

    // Extract emne ID and name
    if (entity.emne?.id) filters.emneIds.add(entity.emne.id);
    const emne = entity.emne?.navn || entity.emne?.name;
    if (emne) filters.emner.add(emne);

    // Entity type values (for combined views)
    if (includeEntityTypes && entity.entityType) {
      filters.entityTypes.add(entity.entityType);
    }
  });

  const result = {
    // ID-based filters for Select components
    statusIds: Array.from(filters.statusIds).sort((a, b) => a - b),
    vurderingIds: Array.from(filters.vurderingIds).sort((a, b) => a - b),
    emneIds: Array.from(filters.emneIds).sort((a, b) => a - b),
    // Name-based filters for backwards compatibility
    statuses: Array.from(filters.statuses).sort(),
    vurderinger: Array.from(filters.vurderinger).sort(),
    emner: Array.from(filters.emner).sort(),
  };

  // Add entityTypes for combined views
  if (includeEntityTypes) {
    result.entityTypes = Array.from(filters.entityTypes).sort();
  }

  return result;
};