/**
 * CombinedEntityDTO - Generic DTO for combined entity types
 *
 * This creates a consistent interface for EntityWorkspace components
 * that handle combined entities (e.g. Krav+Tiltak, ProsjektKrav+ProsjektTiltak).
 *
 * Architecture:
 * - EntityWorkspace creates and manages DTOs
 * - CombinedEntityDTO wraps a combined adapter
 * - SingleEntityDTO wraps a single adapter
 * - Clean, consistent interface across all workspaces
 */

import { EntityDTOInterface } from "./EntityDTOInterface.js";
import { applyEntityFilters } from "@/utils/entityFilters.js";

export class CombinedEntityDTO extends EntityDTOInterface {
  constructor(adapter, options = {}) {
    super();

    if (!adapter) {
      throw new Error("CombinedEntityDTO requires an adapter");
    }

    this.adapter = adapter;
    this.options = options;
    this.entityTypes = this.adapter.getDisplayConfig().entityTypes || [];
    this.primaryEntityType = this.adapter.getDisplayConfig().primaryType || this.entityTypes[0];
  }

  // === REQUIRED INTERFACE PROPERTIES ===

  get entityType() {
    return this.adapter?.entityType || "combined";
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
        items: groupData.items.map(
          (entity) => this.enhanceEntity(entity) // DTO handles normalization + delegates to adapter
        ),
      }));
    } else if (transformedData.items) {
      transformedData.items = transformedData.items.map(
        (entity) => this.enhanceEntity(entity) // DTO handles normalization + delegates to adapter
      );
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
    const propertyNames = this.getGroupedPropertyNames();

    const normalizedGroups = rawData.items.map((group) => {
      const allGroupItems = [];

      // Extract entities from all property names (e.g., both 'krav' and 'tiltak')
      propertyNames.forEach((propertyName) => {
        const items = group[propertyName] || [];
        allGroupItems.push(...items);
      });

      // If no items found in expected properties, check for 'entities' fallback
      if (allGroupItems.length === 0 && group.entities) {
        allGroupItems.push(...group.entities);
      }

      return {
        group: { emne: group.emne },
        items: allGroupItems,
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
   * Get the API property names for this combined entity type in grouped responses
   * This returns multiple property names (e.g., ['krav', 'tiltak'])
   */
  getGroupedPropertyNames() {
    // Ask adapter for property mapping if available
    if (this.adapter.getGroupedPropertyNames) {
      return this.adapter.getGroupedPropertyNames();
    }

    // Fallback to lowercase entity types
    return this.entityTypes.map((type) => type.toLowerCase());
  }

  // === DATA LOADING ===

  async loadData(queryParams = {}) {
    try {
      const queryFunctions = this.adapter.getQueryFunctions();
      const queryFn = queryFunctions.combined?.grouped;

      if (!queryFn) {
        throw new Error(`No combined query function found`);
      }

      // Extract individual parameters from queryParams object
      // API functions expect individual parameters, not an object
      const { page = 1, pageSize = 50, searchQuery = "", filters = {}, pagination = {} } = queryParams;

      const actualPage = pagination.page || page;
      const actualPageSize = pagination.pageSize || pageSize;
      const search = searchQuery || "";
      const sortBy = filters.sortBy || "";
      const sortOrder = filters.sortOrder || "asc";
      const filterBy = filters.filterBy || "all";
      const additionalFilters = filters.additionalFilters || {};

      // Call API function with individual parameters (only search supported by backend for now)
      const rawResponse = await queryFn(actualPage, actualPageSize, search, sortBy, sortOrder);
      const rawData = rawResponse.data || rawResponse;

      // Transform the response first
      const transformedData = this.transformResponse(rawData);

      // Apply client-side filtering to the transformed data
      if (filterBy !== "all" || Object.keys(additionalFilters).length > 0) {
        transformedData.items = applyEntityFilters(transformedData.items, filterBy, additionalFilters);
        transformedData.total = transformedData.items.length;
      }

      // Extract available filters from the data for UI dropdowns
      if (transformedData.items) {
        const flatEntities = transformedData.isGrouped ? this.extractAllEntities(transformedData.items) : transformedData.items;

        transformedData.availableFilters = this.extractAvailableFilters(flatEntities);
      }

      return transformedData;
    } catch (error) {
      console.error(`CombinedEntityDTO[${this.entityTypes.join(",")}]: Load data error:`, error);
      throw error;
    }
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

  // === COMBINED ENTITY SPECIFIC METHODS ===

  isCombinedView() {
    return true;
  }

  getPrimaryEntityType() {
    return this.primaryEntityType;
  }

  getSupportedEntityTypes() {
    return this.entityTypes;
  }

  extractAllEntities(groupedData) {
    if (!Array.isArray(groupedData)) {
      return [];
    }

    const flattened = [];

    groupedData.forEach((group) => {
      // Handle normalized grouped format: { group: {...}, items: [...] }
      if (group.items && Array.isArray(group.items)) {
        flattened.push(...group.items);
      } else {
        // Handle original grouped format with property names
        const propertyNames = this.getGroupedPropertyNames();
        propertyNames.forEach((propertyName) => {
          const groupItems = group[propertyName] || [];
          flattened.push(...groupItems);
        });
      }
    });

    return flattened;
  }

  // === REQUIRED INTERFACE METHODS ===

  /**
   * Get entity type from entity data (implements EntityDTOInterface)
   * Normalizes to lowercase for system consistency
   */
  getEntityType(entityData) {
    let entityType;
    if (this.adapter.detectEntityType) {
      entityType = this.adapter.detectEntityType(entityData);
    } else {
      entityType = entityData.__entityType || entityData.entityType || "unknown";
    }
    // Normalize to lowercase at DTO interface boundary (single source of truth)
    return entityType?.toLowerCase() || "unknown";
  }

  /**
   * Save entity (implements EntityDTOInterface)
   * Delegates to the appropriate individual adapter based on entity type
   */
  async save(entityData, isUpdate) {
    // Delegate directly to the combined adapter's save method
    // The adapter has better logic for detecting entity types and handling delegation
    if (this.adapter.save) {
      return await this.adapter.save(entityData, isUpdate);
    }

    throw new Error("Combined adapter does not provide save method");
  }

  /**
   * Delete entity (implements EntityDTOInterface)
   */
  async delete(entity) {
    // Delegate directly to the combined adapter's delete method
    // The adapter has better logic for detecting entity types and handling delegation
    if (this.adapter.delete) {
      return await this.adapter.delete(entity);
    }

    throw new Error("Combined adapter does not provide delete method");
  }

  /**
   * Create new entity structure (implements EntityDTOInterface)
   */
  createNewEntity(entityType, initialData = {}) {
    if (!entityType) {
      throw new Error("Combined DTO requires entityType parameter for createNewEntity");
    }

    return {
      __isNew: true,
      __entityType: entityType,
      ...initialData, // Merge any initial data provided
    };
  }

  /**
   * Enhance entity with computed fields (implements EntityDTOInterface)
   * DTO normalizes entity data for UI consistency
   */
  enhanceEntity(rawEntity) {
    let enhanced;

    if (this.adapter?.enhanceEntity) {
      enhanced = this.adapter.enhanceEntity(rawEntity);
    } else {
      // Fallback enhancement for combined entities
      const entityType = rawEntity.entityType || "unknown";
      enhanced = {
        ...rawEntity,
        entityType,
        renderId: `${entityType}-${rawEntity.id || rawEntity.uid || "new"}`,
      };
    }

    // DTO responsibility: FORCE normalize entityType on the entity itself for UI consistency
    // This must happen regardless of what the adapter returned
    if (enhanced?.entityType) {
      enhanced.entityType = enhanced.entityType.toLowerCase();
      // Update renderId with normalized type if it exists
      if (enhanced.renderId) {
        const entityId = enhanced.id || enhanced.uid || "new";
        enhanced.renderId = `${enhanced.entityType}-${entityId}`;
      }
    }

    return enhanced;
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
      __entityType: entityType, // Ensure entityType context is preserved
      entityType: entityType,
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

          const entityElement =
            document.querySelector(`[data-entity-id="${renderId}"]`) ||
            document.querySelector(`[data-entity-id="${entityId}"]`) ||
            document.querySelector(`[data-entity-uid="${entityId}"]`);

          if (entityElement) {
            entityElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }

          // Delegate domain-specific business logic to adapter AFTER UI operations complete
          if (this.adapter.onSaveComplete) {
            this.adapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
          }
        }, 300);
      } else {
        // For updates, run business logic immediately (no scrolling needed)
        if (this.adapter.onSaveComplete) {
          this.adapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
        }
      }
    }
  }

  // === UTILITY METHODS ===

  getDebugInfo() {
    return {
      type: "CombinedEntityDTO",
      entityTypes: this.entityTypes,
      primaryEntityType: this.primaryEntityType,
      hasAdapter: !!this.adapter,
      adapterType: this.adapter?.constructor?.name,
      options: this.options,
    };
  }

  clone(newOptions = {}) {
    return new CombinedEntityDTO(this.adapter, { ...this.options, ...newOptions });
  }
}

export const createCombinedEntityDTO = (adapter, options = {}) => {
  return new CombinedEntityDTO(adapter, options);
};

export default CombinedEntityDTO;
