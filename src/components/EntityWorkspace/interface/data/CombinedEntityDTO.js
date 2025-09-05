/**
 * CombinedEntityDTO - Generic DTO for combined entity types
 * 
 * Coordinates multiple adapters to provide a unified interface
 * for workspaces that handle multiple entity types simultaneously.
 */

export class CombinedEntityDTO {
  constructor(adapters = [], options = {}) {
    if (!Array.isArray(adapters) || adapters.length === 0) {
      throw new Error('CombinedEntityDTO requires an array of adapters');
    }
    
    this.adapters = adapters;
    this.options = options;
    this.primaryAdapter = adapters[0];
    this.entityTypes = adapters.map(adapter => 
      adapter.getDisplayConfig().entityTypes[0]
    );
  }

  // === DTO CONTRACT METHODS ===
  
  getDisplayConfig() {
    return {
      title: this.options.title || 'Combined Entities',
      entityTypes: this.entityTypes,
      supportsGroupByEmne: true, // Combined views typically support grouping
      layout: this.options.layout || 'split',
      newButtonLabel: this.options.newButtonLabel || 'New Entity'
    };
  }

  getFilterConfig() {
    // Merge filter configs from all adapters
    const baseConfig = this.primaryAdapter.getFilterConfig();
    
    // Add entity type filter for combined views
    return {
      ...baseConfig,
      fields: {
        ...baseConfig.fields,
        entityType: {
          enabled: true,
          label: 'Type',
          placeholder: 'All types'
        }
      }
    };
  }

  getQueryFunctions() {
    const queryFunctions = {};
    
    this.adapters.forEach(adapter => {
      const adapterQueries = adapter.getQueryFunctions();
      Object.assign(queryFunctions, adapterQueries);
    });
    
    return queryFunctions;
  }

  async loadData(queryParams = {}) {
    try {
      // Load data from all adapters in parallel
      const promises = this.adapters.map(async (adapter) => {
        const entityType = adapter.getDisplayConfig().entityTypes[0];
        const queryFunctions = adapter.getQueryFunctions();
        const queryFn = queryFunctions[entityType]?.grouped;
        
        if (!queryFn) {
          return { items: [], entityType };
        }

        const rawResponse = await queryFn(queryParams);
        const rawData = rawResponse.data || rawResponse;
        
        // Transform each adapter's data
        const singleDTO = new (await import('./SingleEntityDTO.js')).SingleEntityDTO(adapter);
        const transformedData = singleDTO.transformResponse(rawData);
        
        return {
          ...transformedData,
          entityType
        };
      });

      const results = await Promise.all(promises);
      
      // Combine results
      return this._combineResults(results);

    } catch (error) {
      console.error('CombinedEntityDTO: Load data error:', error);
      throw error;
    }
  }

  _combineResults(results) {
    const combinedItems = [];
    let totalCount = 0;
    
    results.forEach(result => {
      if (result.isGrouped && result.items) {
        // For grouped data, merge items from each entity type
        result.items.forEach(groupData => {
          const existingGroup = combinedItems.find(item => 
            item.group?.emne?.id === groupData.group?.emne?.id
          );
          
          if (existingGroup) {
            existingGroup.items.push(...groupData.items);
          } else {
            combinedItems.push(groupData);
          }
        });
      } else if (result.items) {
        // For flat data, just add all items
        combinedItems.push(...result.items);
      }
      
      totalCount += result.total || 0;
    });

    return {
      items: combinedItems,
      total: totalCount,
      isGrouped: results.some(r => r.isGrouped),
      page: 1,
      pageSize: 50
    };
  }

  transformResponse(rawData) {
    // For combined DTOs, transformation happens in loadData
    return rawData;
  }

  // === DELEGATION TO ADAPTERS ===

  filterEntities(entities, filters = {}) {
    // Filter by entity type first if specified
    let filteredEntities = entities;
    
    if (filters.entityType && filters.entityType !== 'all') {
      filteredEntities = entities.filter(entity => 
        entity.entityType === filters.entityType
      );
    }

    // Then apply adapter-specific filters
    // Group entities by type and filter using appropriate adapter
    const groupedByType = {};
    filteredEntities.forEach(entity => {
      const type = entity.entityType;
      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }
      groupedByType[type].push(entity);
    });

    const results = [];
    Object.entries(groupedByType).forEach(([type, typeEntities]) => {
      const adapter = this.adapters.find(a => 
        a.getDisplayConfig().entityTypes[0] === type
      );
      
      if (adapter) {
        const filtered = adapter.filterEntities(typeEntities, filters);
        results.push(...filtered);
      } else {
        results.push(...typeEntities);
      }
    });

    return results;
  }

  sortEntities(entities, sortBy = 'updatedAt', sortOrder = 'desc') {
    // Use primary adapter for sorting logic
    return this.primaryAdapter.sortEntities(entities, sortBy, sortOrder);
  }

  extractAvailableFilters(entities = []) {
    const allFilters = {
      statuses: new Set(),
      vurderinger: new Set(),
      emner: new Set(),
      entityTypes: new Set(this.entityTypes)
    };

    // Get filters from each adapter
    this.adapters.forEach(adapter => {
      const typeEntities = entities.filter(entity => 
        entity.entityType === adapter.getDisplayConfig().entityTypes[0]
      );
      
      const adapterFilters = adapter.extractAvailableFilters(typeEntities);
      
      if (adapterFilters.statuses) {
        adapterFilters.statuses.forEach(status => allFilters.statuses.add(status));
      }
      if (adapterFilters.vurderinger) {
        adapterFilters.vurderinger.forEach(v => allFilters.vurderinger.add(v));
      }
      if (adapterFilters.emner) {
        adapterFilters.emner.forEach(emne => allFilters.emner.add(emne));
      }
    });

    return {
      statuses: Array.from(allFilters.statuses).sort(),
      vurderinger: Array.from(allFilters.vurderinger).sort(),
      emner: Array.from(allFilters.emner).sort(),
      entityTypes: Array.from(allFilters.entityTypes).sort()
    };
  }

  // === COMBINED ENTITY SPECIFIC METHODS ===

  isCombinedView() {
    return true;
  }

  getPrimaryEntityType() {
    return this.entityTypes[0];
  }

  getSupportedEntityTypes() {
    return this.entityTypes;
  }

  // === UTILITY METHODS ===

  getDebugInfo() {
    return {
      type: 'CombinedEntityDTO',
      entityTypes: this.entityTypes,
      adapterCount: this.adapters.length,
      adapters: this.adapters.map(a => a.constructor?.name),
      options: this.options
    };
  }
}

export const createCombinedEntityDTO = (adapters, options = {}) => {
  return new CombinedEntityDTO(adapters, options);
};

export default CombinedEntityDTO;