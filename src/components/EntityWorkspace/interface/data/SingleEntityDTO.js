/**
 * SingleEntityDTO - Generic DTO for single entity types
 *
 * This creates a consistent interface where all EntityWorkspace components
 * receive a DTO object, regardless of whether they handle single or combined entities.
 *
 * Architecture:
 * - EntityWorkspace creates and manages DTOs
 * - SingleEntityDTO wraps a single adapter
 * - CombinedEntityDTO coordinates multiple adapters
 * - Clean, consistent interface across all workspaces
 */

import { EntityDTOInterface } from './EntityDTOInterface.js';

export class SingleEntityDTO extends EntityDTOInterface {
  constructor(adapter, options = {}) {
    super();
    
    if (!adapter) {
      throw new Error("SingleEntityDTO requires an adapter");
    }

    this.adapter = adapter;
    this.options = options;
    this._entityType = this.adapter.getDisplayConfig().entityTypes[0];
  }

  // === REQUIRED INTERFACE PROPERTIES ===
  
  get entityType() {
    return this._entityType;
  }

  // === DTO CONTRACT METHODS ===

  getDisplayConfig() {
    return this.adapter.getDisplayConfig();
  }

  getFilterConfig() {
    return this.adapter.getFilterConfig();
  }

  getQueryFunctions() {
    return this.adapter.getQueryFunctions();
  }

  transformResponse(rawData) {
    const transformedData = this._transformAPIResponse(rawData);

    // DTO enhances entities with normalization + adapter business logic
    if (transformedData.isGrouped && transformedData.items) {
      transformedData.items = transformedData.items.map((groupData) => ({
        ...groupData,
        items: groupData.items.map((entity) => this.enhanceEntity(entity)), // DTO handles normalization + delegates to adapter
      }));
    } else if (transformedData.items) {
      transformedData.items = transformedData.items.map((entity) => this.enhanceEntity(entity)); // DTO handles normalization + delegates to adapter
    }

    return transformedData;
  }

  _transformAPIResponse(rawData) {
    if (!rawData || (typeof rawData === "object" && Object.keys(rawData).length === 0)) {
      return { items: [], total: 0, page: 1, pageSize: 50 };
    }

    if (this._isGroupedResponse(rawData)) {
      return this._transformGroupedResponse(rawData);
    }

    if (this._isPaginatedResponse(rawData)) {
      return this._transformPaginatedResponse(rawData);
    }

    if (Array.isArray(rawData)) {
      return { items: rawData, total: rawData.length, page: 1, pageSize: rawData.length };
    }

    return { items: [rawData], total: 1, page: 1, pageSize: 1 };
  }

  _isGroupedResponse(rawData) {
    return rawData?.items && Array.isArray(rawData.items) && rawData.items[0]?.emne;
  }

  _isPaginatedResponse(rawData) {
    return rawData?.items && (rawData?.count !== undefined || rawData?.totalCount !== undefined);
  }

  _transformGroupedResponse(rawData) {
    const propertyName = this.getGroupedPropertyName();

    const normalizedGroups = rawData.items.map((group) => {
      const groupItems = group[propertyName] || group.entities || [];

      return {
        group: { emne: group.emne },
        items: groupItems,
      };
    });

    return {
      items: normalizedGroups,
      total: rawData.total || 0,
      page: rawData.page || 1,
      pageSize: rawData.pageSize || 50,
      totalPages: rawData.totalPages || 1,
      isGrouped: true,
    };
  }

  _transformPaginatedResponse(rawData) {
    return {
      items: rawData.items || [],
      total: rawData.total || rawData.count || 0,
      page: rawData.page || 1,
      pageSize: rawData.pageSize || 50,
      totalPages: rawData.totalPages || Math.ceil((rawData.total || rawData.count || 0) / (rawData.pageSize || 50)),
    };
  }

  // === ENTITY PROPERTY MAPPING ===

  /**
   * Get the API property name for this entity type in grouped responses
   * This is generic - adapters should provide this mapping
   */
  getGroupedPropertyName() {
    // Ask adapter for property mapping if available
    if (this.adapter.getGroupedPropertyName) {
      return this.adapter.getGroupedPropertyName();
    }

    // Fallback to lowercase entity type
    return this.entityType.toLowerCase();
  }

  // === DELEGATION TO ADAPTER ===

  filterEntities(entities, filters = {}) {
    return this.adapter.filterEntities(entities, filters);
  }

  sortEntities(entities, sortBy = "updatedAt", sortOrder = "desc") {
    return this.adapter.sortEntities(entities, sortBy, sortOrder);
  }

  extractAvailableFilters(entities = []) {
    return this.adapter.extractAvailableFilters(entities);
  }

  extractUID(entity) {
    return this.adapter.extractUID ? this.adapter.extractUID(entity) : entity.uid || entity.id;
  }

  extractTitle(entity) {
    return this.adapter.extractTitle ? this.adapter.extractTitle(entity) : entity.title || entity.tittel || entity.name;
  }

  getBadgeColor(entityType) {
    return this.adapter.getBadgeColor ? this.adapter.getBadgeColor(entityType) : "bg-gray-100 text-gray-700";
  }

  getDisplayType(entityType) {
    return this.adapter.getDisplayType ? this.adapter.getDisplayType(entityType) : entityType;
  }

  // === SINGLE ENTITY SPECIFIC METHODS ===

  isCombinedView() {
    return false;
  }

  getPrimaryEntityType() {
    return this.entityType;
  }

  getSupportedEntityTypes() {
    return [this.entityType];
  }

  extractAllEntities(groupedData) {
    if (!Array.isArray(groupedData)) {
      return [];
    }

    const flattened = [];
    const propertyName = this.getGroupedPropertyName();

    groupedData.forEach((group) => {
      const groupItems = group[propertyName] || group.entities || [];
      flattened.push(...groupItems);
    });

    return flattened;
  }

  // === DATA LOADING ===

  async loadData(queryParams = {}) {
    try {
      const queryFunctions = this.adapter.getQueryFunctions();
      const queryFn = queryFunctions[this.entityType]?.grouped;

      if (!queryFn) {
        throw new Error(`No query function found for entity type: ${this.entityType}`);
      }

      const rawResponse = await queryFn(queryParams);
      const rawData = rawResponse.data || rawResponse;

      const transformedResponse = this.transformResponse(rawData);

      // Extract available filters from the loaded data if adapter supports it
      let availableFilters = {};
      if (this.adapter.extractAvailableFilters) {
        // Get flat list of entities for filter extraction
        const flatEntities = this.extractAllEntities(transformedResponse.items);
        availableFilters = this.adapter.extractAvailableFilters(flatEntities);
      }

      return {
        ...transformedResponse,
        availableFilters,
      };
    } catch (error) {
      console.error(`SingleEntityDTO[${this.entityType}]: Load data error:`, error);
      throw error;
    }
  }

  // === REQUIRED INTERFACE METHODS ===

  /**
   * Get entity type from entity data (implements EntityDTOInterface)
   * Normalizes to lowercase for system consistency
   */
  getEntityType(entityData) {
    // Single entity DTOs always return their configured entity type (normalized)
    return this.entityType?.toLowerCase() || 'unknown';
  }

  /**
   * Save entity (implements EntityDTOInterface)
   */
  async save(entityData, isUpdate) {
    const config = this.adapter?.config;
    if (!config) {
      throw new Error(`No config available for ${this.entityType}`);
    }
    
    if (isUpdate) {
      if (!config.updateFn) {
        throw new Error(`Update function not available for ${this.entityType}`);
      }
      return await config.updateFn(entityData.id, entityData);
    } else {
      if (!config.createFn) {
        throw new Error(`Create function not available for ${this.entityType}`);
      }
      return await config.createFn(entityData);
    }
  }

  /**
   * Delete entity (implements EntityDTOInterface)
   */
  async delete(entity) {
    const config = this.adapter?.config;
    if (!config?.deleteFn) {
      throw new Error(`Delete function not available for ${this.entityType}`);
    }
    return await config.deleteFn(entity.id);
  }

  /**
   * Create new entity structure (implements EntityDTOInterface)
   */
  createNewEntity(entityType) {
    // For single entity DTOs, entityType parameter is ignored
    return { 
      __isNew: true,
      __entityType: this.entityType
    };
  }

  /**
   * Enhance entity with computed fields (implements EntityDTOInterface)
   */
  enhanceEntity(rawEntity) {
    if (this.adapter?.enhanceEntity) {
      return this.adapter.enhanceEntity(rawEntity, this.entityType);
    }
    
    // Fallback enhancement
    return {
      ...rawEntity,
      entityType: this.entityType,
      renderId: `${this.entityType}-${rawEntity.id || rawEntity.uid || 'new'}`
    };
  }

  // === POST-OPERATION HOOKS ===

  onSaveComplete(result, isCreate, handleEntitySelect, entityType = null) {
    if (!result || !handleEntitySelect) {
      return;
    }
    
    // Extract the actual entity data from API response
    const actualEntity = result.data || result;
    
    // DTO responsibility: enhance the entity with proper normalization
    const entityToEnhance = {
      ...actualEntity,
      entityType: entityType || this.entityType
    };
    
    const enhancedEntity = this.enhanceEntity(entityToEnhance);
    
    if (enhancedEntity) {
      // DTO interface responsibility: select the enhanced entity
      handleEntitySelect(enhancedEntity);
      
      // DTO interface responsibility: handle UI interactions like scrolling
      if (isCreate) {
        setTimeout(() => {
          const entityId = enhancedEntity.id || enhancedEntity.uid;
          const renderId = enhancedEntity.renderId;
          
          const entityElement = document.querySelector(`[data-entity-id="${renderId}"]`) ||
                               document.querySelector(`[data-entity-id="${entityId}"]`) ||
                               document.querySelector(`[data-entity-uid="${entityId}"]`);
          
          if (entityElement) {
            entityElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
          
          // Delegate domain-specific business logic to adapter AFTER UI operations complete
          if (this.adapter.onSaveComplete) {
            this.adapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType || this.entityType);
          }
        }, 300);
      } else {
        // For updates, run business logic immediately (no scrolling needed)
        if (this.adapter.onSaveComplete) {
          this.adapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType || this.entityType);
        }
      }
    }
  }

  // === UTILITY METHODS ===

  getDebugInfo() {
    return {
      type: "SingleEntityDTO",
      entityType: this.entityType,
      hasAdapter: !!this.adapter,
      adapterType: this.adapter?.constructor?.name,
      options: this.options,
    };
  }

  clone(newOptions = {}) {
    return new SingleEntityDTO(this.adapter, { ...this.options, ...newOptions });
  }
}

export const createSingleEntityDTO = (adapter, options = {}) => {
  return new SingleEntityDTO(adapter, options);
};

export default SingleEntityDTO;
