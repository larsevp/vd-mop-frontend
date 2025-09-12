/**
 * FlowAdapterInterface - Contract for all Flow adapters
 * 
 * This interface defines the standard contract that all flow adapters must implement
 * to ensure consistent data structure for React Flow visualization components.
 */

/**
 * Standard Flow Data Structure
 * @typedef {Object} FlowData
 * @property {EmneGroup[]} emneGroups - Array of emne groups with their entities
 * @property {Entity[]} allEntities - Flat array of all entities (deduplicated)
 * @property {Relationships} relationships - Pre-calculated relationship mappings
 * @property {Object} metadata - Additional metadata (counts, totals, etc.)
 */

/**
 * Emne Group Structure
 * @typedef {Object} EmneGroup
 * @property {Object} emne - Emne object with id, tittel, icon, color
 * @property {number} emneIndex - Index in the original data
 * @property {Entity[]} kravEntities - Array of krav-type entities in this emne
 * @property {Entity[]} tiltakEntities - Array of tiltak-type entities in this emne
 * @property {number} totalEntities - Total count of entities in this emne
 */

/**
 * Relationships Structure
 * @typedef {Object} Relationships
 * @property {RelationshipPair[]} kravToKrav - Parent-child krav relationships
 * @property {RelationshipPair[]} tiltakToTiltak - Parent-child tiltak relationships  
 * @property {RelationshipPair[]} tiltakToKrav - Business relationships tiltak→krav
 * @property {RelationshipPair[]} [customRelationships] - Additional relationship types
 */

/**
 * Relationship Pair
 * @typedef {Object} RelationshipPair
 * @property {Entity} parent - Parent entity (or source entity)
 * @property {Entity} child - Child entity (or target entity)
 * @property {string} [relationshipType] - Type of relationship (hierarchical, business, etc.)
 * @property {Object} [metadata] - Additional relationship metadata
 */

/**
 * FlowAdapterInterface - All flow adapters must implement these methods
 */
export class FlowAdapterInterface {
  
  /**
   * Fetch data optimized for flow visualization
   * @param {Object} queryParams - Query parameters (search, filters, pagination)
   * @returns {Promise<FlowData>} Promise resolving to flow-optimized data
   */
  async fetchFlowData(queryParams = {}) {
    throw new Error('FlowAdapter must implement fetchFlowData method');
  }

  /**
   * Transform raw API data to flow format
   * @param {Object} rawData - Raw data from API
   * @returns {FlowData} Flow-optimized data structure
   */
  transformToFlowFormat(rawData) {
    throw new Error('FlowAdapter must implement transformToFlowFormat method');
  }

  /**
   * Calculate relationships between entities
   * @param {FlowData} flowData - Flow data with entities
   */
  calculateRelationships(flowData) {
    throw new Error('FlowAdapter must implement calculateRelationships method');
  }

  /**
   * Get supported entity types for this adapter
   * @returns {string[]} Array of entity types (e.g., ['krav', 'tiltak'])
   */
  getSupportedEntityTypes() {
    throw new Error('FlowAdapter must implement getSupportedEntityTypes method');
  }

  /**
   * Get adapter debug information
   * @returns {Object} Debug information about the adapter
   */
  getDebugInfo() {
    throw new Error('FlowAdapter must implement getDebugInfo method');
  }
}

/**
 * Validation function to ensure adapter implements the interface
 * @param {Object} adapter - Adapter instance to validate
 * @throws {Error} If adapter doesn't implement required methods
 */
export function validateFlowAdapter(adapter) {
  const requiredMethods = [
    'fetchFlowData',
    'transformToFlowFormat', 
    'calculateRelationships',
    'getSupportedEntityTypes',
    'getDebugInfo'
  ];

  const missingMethods = requiredMethods.filter(method => 
    typeof adapter[method] !== 'function'
  );

  if (missingMethods.length > 0) {
    throw new Error(
      `FlowAdapter missing required methods: ${missingMethods.join(', ')}`
    );
  }
}

/**
 * Helper function to create empty flow data structure
 * @returns {FlowData} Empty flow data structure
 */
export function createEmptyFlowData() {
  return {
    emneGroups: [],
    allEntities: [],
    relationships: {
      kravToKrav: [],
      tiltakToTiltak: [],
      tiltakToKrav: []
    },
    metadata: {
      totalEntities: 0,
      totalEmneGroups: 0,
      entityTypeCounts: {}
    }
  };
}

export default FlowAdapterInterface;