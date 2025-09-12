/**
 * ProsjektKravTiltakFlowAdapter - Pure visualization transformation adapter
 * 
 * This adapter handles ONLY flow visualization transformation:
 * - Takes standard entity data from ProsjektKravTiltakCombinedAdapter
 * - Transforms it to React Flow nodes and edges
 * - Handles entity relationships and positioning
 * - NO CRUD operations (uses existing combined adapter for that)
 */

export class ProsjektKravTiltakFlowAdapter {
  constructor(options = {}) {
    this.options = { debug: true, ...options }; // Force debug on for now
  }

  // === FLOW VISUALIZATION METHODS ===

  /**
   * Fetch data optimized for flow visualization
   */
  async fetchFlowData(queryParams = {}) {
    try {
      // Use same API but process differently for flow
      const response = await getPaginatedCombinedProsjektEntities(queryParams);
      const rawData = response.data || response;
      
      if (this.options.debug) {
        console.log('LOGBACKEND FlowAdapter: Raw API response:', rawData);
      }

      // Transform to flow-optimized format
      return this.transformToFlowFormat(rawData);
      
    } catch (error) {
      console.error('FlowAdapter: API call failed:', error);
      throw error;
    }
  }

  /**
   * Transform grouped API response to flat flow format
   */
  transformToFlowFormat(rawData) {
    const flowData = {
      emneGroups: [],
      allEntities: [],
      relationships: {
        kravToKrav: [],
        tiltakToTiltak: [],
        tiltakToKrav: []
      }
    };

    if (!rawData?.items || !Array.isArray(rawData.items)) {
      return flowData;
    }

    const seenEntityKeys = new Set(); // Use entity type + ID as key

    rawData.items.forEach((groupData, emneIndex) => {
      const emne = groupData.emne;
      const entities = groupData.entities || [];
      
      // Handle "Ingen emne" as a valid group
      if (!emne) {
        if (this.options.debug) {
          console.log(`LOGBACKEND FlowAdapter: Skipping emne group with null emne`);
        }
        return;
      }

      if (this.options.debug) {
        console.log(`LOGBACKEND FlowAdapter: Processing emne ${emne.tittel} with ${entities.length} entities`);
      }

      // Separate and deduplicate entities
      const kravEntities = [];
      const tiltakEntities = [];

      entities.forEach(entity => {
        // Create unique key combining entity type and ID
        const entityKey = `${entity.entityType}-${entity.id}`;
        
        // Skip duplicates
        if (seenEntityKeys.has(entityKey)) {
          if (this.options.debug) {
            console.log(`LOGBACKEND FlowAdapter: Skipping duplicate entity ${entityKey}`);
          }
          return;
        }
        seenEntityKeys.add(entityKey);

        // Add emne reference
        entity._sourceEmne = emne;
        
        // Categorize by type
        if (entity.entityType === 'prosjektkrav') {
          kravEntities.push(entity);
          if (this.options.debug) {
            console.log(`LOGBACKEND FlowAdapter: Added krav ${entity.id} (${entity.kravUID})`);
          }
        } else if (entity.entityType === 'prosjekttiltak') {
          tiltakEntities.push(entity);
          if (this.options.debug) {
            console.log(`LOGBACKEND FlowAdapter: Added tiltak ${entity.id} (${entity.tiltakUID})`);
          }
        }
      });

      // Store emne group
      flowData.emneGroups.push({
        emne,
        emneIndex,
        kravEntities,
        tiltakEntities,
        totalEntities: kravEntities.length + tiltakEntities.length
      });

      // Add to global entity list
      flowData.allEntities.push(...kravEntities, ...tiltakEntities);
    });

    // Calculate relationships across all entities
    this.calculateRelationships(flowData);

    if (this.options.debug) {
      console.log('LOGBACKEND FlowAdapter: Transformed data:', {
        emneGroups: flowData.emneGroups.length,
        totalEntities: flowData.allEntities.length,
        relationships: Object.keys(flowData.relationships).map(key => 
          `${key}: ${flowData.relationships[key].length}`
        )
      });
    }

    return flowData;
  }

  /**
   * Calculate all relationships between entities
   */
  calculateRelationships(flowData) {
    const { allEntities, relationships } = flowData;
    
    const kravEntities = allEntities.filter(e => e.entityType === 'prosjektkrav');
    const tiltakEntities = allEntities.filter(e => e.entityType === 'prosjekttiltak');

    // Krav → Krav hierarchical relationships
    kravEntities.forEach(parent => {
      kravEntities.forEach(child => {
        if (child.parentId === parent.id) {
          relationships.kravToKrav.push({ parent, child });
        }
      });
    });

    // Tiltak → Tiltak hierarchical relationships  
    tiltakEntities.forEach(parent => {
      tiltakEntities.forEach(child => {
        if (child.parentId === parent.id) {
          relationships.tiltakToTiltak.push({ parent, child });
        }
      });
    });

    // Tiltak → Krav business relationships
    tiltakEntities.forEach(tiltak => {
      kravEntities.forEach(krav => {
        if (this.isTiltakConnectedToKrav(tiltak, krav)) {
          relationships.tiltakToKrav.push({ tiltak, krav });
        }
      });
    });
  }

  /**
   * Check if tiltak is connected to krav
   */
  isTiltakConnectedToKrav(tiltak, krav) {
    // Check prosjektKrav array
    if (tiltak.prosjektKrav?.some(pk => pk.id === krav.id)) {
      return true;
    }
    
    // Check direct reference
    if (tiltak.prosjektKravId === krav.id) {
      return true;
    }
    
    return false;
  }

  /**
   * DTO Interface method - required by useEntityData
   */
  async loadData(queryParams = {}) {
    return await this.fetchFlowData(queryParams);
  }

  /**
   * DTO Interface method - get supported entity types
   */
  getSupportedEntityTypes() {
    return ['prosjektkrav', 'prosjekttiltak'];
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      adapter: 'ProsjektKravTiltakFlowAdapter',
      purpose: 'React Flow visualization',
      optimizations: [
        'Flat entity structure',
        'Built-in deduplication', 
        'Pre-calculated relationships',
        'Flow-optimized format'
      ]
    };
  }

  /**
   * Extract UID from entity for display
   * @param {Object} entity - The entity to extract UID from
   * @returns {string} The entity's UID
   */
  getUID(entity) {
    // Check by entity type first
    if (entity.entityType === 'prosjektkrav') {
      return entity.kravUID || entity.uid || `PK${entity.id}`;
    } else if (entity.entityType === 'prosjekttiltak') {
      return entity.tiltakUID || entity.uid || `PT${entity.id}`;
    }
    
    // Fallback: check for UID fields directly
    return entity.kravUID || entity.tiltakUID || entity.uid || entity.id;
  }
}

/**
 * Factory function
 */
export const createProsjektKravTiltakFlowAdapter = (options = {}) => {
  return new ProsjektKravTiltakFlowAdapter(options);
};

export default ProsjektKravTiltakFlowAdapter;