/**
 * CombinedEntityContract - Interface contract for multi-model entity mixing
 * 
 * This contract defines the interface for DTOs that handle combining
 * multiple entity types into unified views. Any domain that needs to
 * mix multiple models (like Krav + Tiltak) should implement this contract.
 */

/**
 * @typedef {Object} CombinedDisplayConfig
 * @property {string} title - Combined workspace title
 * @property {string[]} entityTypes - Array of entity types being combined
 * @property {boolean} supportsGroupByEmne - Whether combined view supports grouping
 * @property {string} layout - Layout type ("split", "list")
 * @property {boolean} isCombinedView - Always true for combined views
 * @property {string} primaryType - Primary entity type
 * @property {string} secondaryType - Secondary entity type  
 * @property {boolean} separateByType - Whether to visually separate by type
 */

/**
 * @typedef {Object} CombinedQueryFunctions
 * @property {Object} primary - Primary model query functions
 * @property {string} primary.entityType - Entity type identifier
 * @property {Function} primary.standard - Standard query function
 * @property {Function} primary.grouped - Grouped query function
 * @property {Object} secondary - Secondary model query functions
 * @property {string} secondary.entityType - Entity type identifier
 * @property {Function} secondary.standard - Standard query function
 * @property {Function} secondary.grouped - Grouped query function
 */

/**
 * @typedef {Object} MixingRules
 * @property {string} defaultSort - Default sort field
 * @property {string} defaultSortOrder - Default sort order
 * @property {boolean} separateByType - Visual separation setting
 * @property {Object} typeWeights - Sorting weights for entity types
 * @property {string[]} searchFields - Fields included in cross-type search
 */

/**
 * CombinedEntityContract Interface
 * 
 * Any DTO handling multi-model combination must implement these methods:
 */
export const CombinedEntityContract = {

  // === CONFIGURATION METHODS ===

  /**
   * Get combined display configuration
   * @returns {CombinedDisplayConfig}
   */
  getDisplayConfig() {
    throw new Error('getDisplayConfig() must be implemented');
  },

  /**
   * Get combined filter configuration
   * Includes entity type filters + common field filters
   * @returns {FilterConfig}
   */
  getFilterConfig() {
    throw new Error('getFilterConfig() must be implemented');
  },

  /**
   * Get query functions for all models
   * @returns {CombinedQueryFunctions}
   */
  getQueryFunctions() {
    throw new Error('getQueryFunctions() must be implemented');
  },

  // === COMBINATION METHODS ===

  /**
   * Combine multiple entity arrays into unified view
   * @param {TransformedEntity[]} primaryEntities - Primary model entities
   * @param {TransformedEntity[]} secondaryEntities - Secondary model entities
   * @returns {TransformedEntity[]} - Unified entity array
   */
  combineEntities(primaryEntities, secondaryEntities) {
    throw new Error('combineEntities() must be implemented');
  },

  /**
   * Sort combined entities using mixing rules
   * @param {TransformedEntity[]} entities - Combined entities
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order
   * @returns {TransformedEntity[]} - Sorted entities
   */
  sortCombinedEntities(entities, sortBy, sortOrder) {
    throw new Error('sortCombinedEntities() must be implemented');
  },

  /**
   * Filter combined entities across types
   * @param {TransformedEntity[]} entities - Combined entities
   * @param {Object} filters - Filter criteria
   * @returns {TransformedEntity[]} - Filtered entities
   */
  filterCombinedEntities(entities, filters) {
    throw new Error('filterCombinedEntities() must be implemented');
  },

  /**
   * Extract available filter values from combined entities
   * @param {TransformedEntity[]} entities - Combined entities
   * @returns {AvailableFilters} - Available filter options
   */
  extractAvailableFilters(entities) {
    throw new Error('extractAvailableFilters() must be implemented');
  },

  // === UTILITY METHODS ===

  /**
   * Get mixing rules configuration
   * @returns {MixingRules}
   */
  getMixingRules() {
    throw new Error('getMixingRules() must be implemented');
  },

  /**
   * Get debug information
   * @returns {Object}
   */
  getDebugInfo() {
    throw new Error('getDebugInfo() must be implemented');
  }
};

/**
 * Interface Requirements Summary for Combined Entity Views:
 * 
 * 1. DTO INJECTION: GenericWorkspace accepts combinedEntityDTO via props
 * 2. MULTI-MODEL CONFIG: DTO provides configuration for multiple models
 * 3. DATA MIXING: DTO combines data from multiple API sources
 * 4. CROSS-TYPE OPERATIONS: DTO handles filtering/sorting across entity types
 * 5. TYPE DISTINCTION: DTO maintains entity type info for UI display
 * 
 * The interface only needs to:
 * - Use DTO methods for all combined operations
 * - Display unified entity arrays with type badges
 * - Call DTO methods for cross-type filtering/sorting
 * - Handle multiple API calls via DTO query functions
 */

export default CombinedEntityContract;