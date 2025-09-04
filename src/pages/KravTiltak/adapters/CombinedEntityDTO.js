/**
 * CombinedEntityDTO - Coordinates multiple SingleEntityDTOs for combined views
 * 
 * This DTO takes SingleEntityDTO instances as input and orchestrates them
 * to provide a unified interface for combined entity workspaces like KravTiltak.
 * 
 * Architecture: CombinedEntityDTO -> SingleEntityDTOs -> Adapters
 */

export class CombinedEntityDTO {
  constructor(entityDTOs, options = {}) {
    if (!Array.isArray(entityDTOs) || entityDTOs.length === 0) {
      throw new Error('CombinedEntityDTO requires an array of SingleEntityDTOs');
    }
    
    this.entityDTOs = entityDTOs;
    this.options = { debug: false, ...options };
    
    // Extract primary types from DTOs
    this.entityTypes = entityDTOs.map(dto => dto.entityType);
    this.primaryEntityType = this.entityTypes[0];
    
    if (this.options.debug) {
      console.log('CombinedEntityDTO: Initialized with DTOs for types:', this.entityTypes);
    }
  }

  // === DTO CONTRACT METHODS ===

  /**
   * Get combined display configuration
   */
  getDisplayConfig() {
    const configs = this.entityDTOs.map(dto => dto.getDisplayConfig());
    const primaryConfig = configs[0];
    
    return {
      title: `${primaryConfig.title} og ${configs.slice(1).map(c => c.title).join(', ')}`,
      entityTypes: this.entityTypes,
      supportsGroupByEmne: configs.every(c => c.supportsGroupByEmne),
      layout: primaryConfig.layout,
      newButtonLabel: primaryConfig.newButtonLabel,
      // Combined config
      isCombinedView: true,
      combinedEntityTypes: this.entityTypes
    };
  }

  /**
   * Get combined filter configuration
   */
  getFilterConfig() {
    const configs = this.entityDTOs.map(dto => dto.getFilterConfig());
    const primaryConfig = configs[0];
    
    // Merge all available sort fields
    const allSortFields = configs.reduce((acc, config) => {
      config.sortFields?.forEach(field => {
        if (!acc.find(existing => existing.key === field.key)) {
          acc.push(field);
        }
      });
      return acc;
    }, []);
    
    return {
      ...primaryConfig,
      // Add entity type filter for combined views
      fields: {
        ...primaryConfig.fields,
        entityType: {
          enabled: true,
          label: 'Type',
          placeholder: 'Alle typer'
        }
      },
      sortFields: allSortFields
    };
  }

  /**
   * Get combined query functions for all entity types
   */
  getQueryFunctions() {
    const functions = {};
    
    this.entityDTOs.forEach(dto => {
      const entityQueries = dto.getQueryFunctions();
      functions[dto.entityType] = entityQueries;
    });
    
    return functions;
  }

  // === DATA TRANSFORMATION METHODS ===

  /**
   * Load and combine data from all entity DTOs
   */
  async loadCombinedData(queryParams = {}) {
    if (this.options.debug) {
      console.log('CombinedEntityDTO: Loading combined data with params:', queryParams);
    }
    
    try {
      // Load data from all DTOs in parallel
      const dataPromises = this.entityDTOs.map(async (dto) => {
        try {
          const data = await dto.loadData(queryParams);
          return {
            entityType: dto.entityType,
            success: true,
            data: data,
            error: null
          };
        } catch (error) {
          console.error(`CombinedEntityDTO: Failed to load ${dto.entityType}:`, error);
          return {
            entityType: dto.entityType,
            success: false,
            data: { items: [], total: 0 },
            error: error.message || 'Failed to load data'
          };
        }
      });
      
      const results = await Promise.all(dataPromises);
      
      // Combine successful results
      const allItems = [];
      let totalCount = 0;
      let hasErrors = false;
      const errors = [];
      
      results.forEach(result => {
        if (result.success) {
          // Tag each entity with its type for filtering
          const taggedItems = result.data.items.map(item => ({
            ...item,
            entityType: result.entityType,
            _combinedViewSource: result.entityType
          }));
          allItems.push(...taggedItems);
          totalCount += result.data.total || 0;
        } else {
          hasErrors = true;
          errors.push(`${result.entityType}: ${result.error}`);
        }
      });
      
      // Apply combined filtering and sorting
      const processed = this.processCombinedData(allItems, queryParams);
      
      return {
        items: processed.items,
        total: totalCount,
        page: queryParams.page || 1,
        pageSize: queryParams.pageSize || 50,
        totalPages: Math.ceil(totalCount / (queryParams.pageSize || 50)),
        hasNextPage: false, // TODO: Implement proper pagination for combined views
        hasPreviousPage: false,
        isGrouped: false,
        isCombined: true,
        entityTypes: this.entityTypes,
        errors: hasErrors ? errors : null,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'CombinedEntityDTO',
          entityTypes: this.entityTypes
        }
      };
      
    } catch (error) {
      console.error('CombinedEntityDTO: Critical error loading combined data:', error);
      throw error;
    }
  }

  /**
   * Process combined data (filtering, sorting, etc.)
   */
  processCombinedData(items, queryParams = {}) {
    let processed = [...items];
    
    // Apply search filter
    if (queryParams.search) {
      const searchTerm = queryParams.search.toLowerCase();
      processed = processed.filter(item => {
        const searchable = [
          item.title,
          item.descriptionCard,
          item.uid,
          item.emne?.navn || item.emne?.name,
          item.entityType
        ].join(' ').toLowerCase();
        
        return searchable.includes(searchTerm);
      });
    }
    
    // Apply entity type filter
    if (queryParams.entityType && queryParams.entityType !== 'all') {
      processed = processed.filter(item => item.entityType === queryParams.entityType);
    }
    
    // Apply other filters (delegate to individual DTOs if needed)
    // TODO: Implement more sophisticated filtering
    
    // Apply sorting
    const sortBy = queryParams.sortBy || 'updatedAt';
    const sortOrder = queryParams.sortOrder || 'desc';
    
    processed.sort((a, b) => {
      let aValue = this.getSortValue(a, sortBy);
      let bValue = this.getSortValue(b, sortBy);
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return { items: processed };
  }

  /**
   * Get sort value for combined entities
   */
  getSortValue(entity, field) {
    switch (field) {
      case 'title':
        return entity.title || '';
      case 'status':
        return entity.status?.name || entity.status?.navn || '';
      case 'emne':
        return entity.emne?.navn || entity.emne?.name || '';
      case 'entityType':
        return entity.entityType || '';
      default:
        return entity[field] || '';
    }
  }

  /**
   * Extract available filter options from combined data
   */
  extractAvailableFilters(entities = []) {
    const filters = {
      statuses: new Set(),
      vurderinger: new Set(),
      emner: new Set(),
      entityTypes: new Set()
    };

    entities.forEach(entity => {
      // Status values
      const status = entity.status?.name || entity.status?.navn;
      if (status) filters.statuses.add(status);
      
      // Vurdering values
      const vurdering = entity.vurdering?.name || entity.vurdering?.navn;
      if (vurdering) filters.vurderinger.add(vurdering);
      
      // Emne values
      const emne = entity.emne?.navn || entity.emne?.name;
      if (emne) filters.emner.add(emne);
      
      // Entity types (this is the key addition for combined views)
      if (entity.entityType) filters.entityTypes.add(entity.entityType);
    });

    return {
      statuses: Array.from(filters.statuses).sort(),
      vurderinger: Array.from(filters.vurderinger).sort(),
      emner: Array.from(filters.emner).sort(),
      entityTypes: Array.from(filters.entityTypes).sort()
    };
  }

  // === ENTITY OPERATIONS ===

  /**
   * Create entity - delegate to appropriate DTO
   */
  async createEntity(entityType, entityData, options = {}) {
    const dto = this.getEntityDTO(entityType);
    if (!dto) {
      throw new Error(`No DTO found for entity type: ${entityType}`);
    }
    
    return await dto.createEntity(entityData, options);
  }

  /**
   * Update entity - delegate to appropriate DTO
   */
  async updateEntity(entityType, entityId, updates, options = {}) {
    const dto = this.getEntityDTO(entityType);
    if (!dto) {
      throw new Error(`No DTO found for entity type: ${entityType}`);
    }
    
    return await dto.updateEntity(entityId, updates, options);
  }

  /**
   * Delete entity - delegate to appropriate DTO
   */
  async deleteEntity(entityType, entityId, options = {}) {
    const dto = this.getEntityDTO(entityType);
    if (!dto) {
      throw new Error(`No DTO found for entity type: ${entityType}`);
    }
    
    return await dto.deleteEntity(entityId, options);
  }

  // === UTILITY METHODS ===

  /**
   * Get DTO for specific entity type
   */
  getEntityDTO(entityType) {
    return this.entityDTOs.find(dto => dto.entityType === entityType);
  }

  /**
   * Get all managed entity types
   */
  getEntityTypes() {
    return this.entityTypes;
  }

  /**
   * Check if this is a combined view
   */
  isCombinedView() {
    return true;
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      type: 'CombinedEntityDTO',
      entityTypes: this.entityTypes,
      primaryEntityType: this.primaryEntityType,
      dtoCount: this.entityDTOs.length,
      options: this.options,
      dtosDebugInfo: this.entityDTOs.map(dto => dto.getDebugInfo?.() || { entityType: dto.entityType })
    };
  }
}

/**
 * Factory function for creating combined DTOs
 */
export const createCombinedEntityDTO = (entityDTOs, options = {}) => {
  return new CombinedEntityDTO(entityDTOs, options);
};

export default CombinedEntityDTO;