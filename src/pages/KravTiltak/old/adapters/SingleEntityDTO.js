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
      throw new Error("SingleEntityDTO requires an adapter");
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
   * Transform API response (DTO responsibility)
   */
  transformResponse(rawData) {
    // Handle the actual data transformation here (DTO responsibility)
    const transformedData = this._transformAPIResponse(rawData);

    // Let adapter enhance with business logic
    if (this.adapter.enhanceEntity) {
      if (transformedData.isGrouped && transformedData.items) {
        // For normalized grouped data, enhance items in each group
        transformedData.items = transformedData.items.map((groupData) => ({
          ...groupData,
          items: groupData.items.map((entity) => this.adapter.enhanceEntity(entity, this.entityType)),
        }));
      } else if (transformedData.items) {
        // For flat data, enhance entities directly
        transformedData.items = transformedData.items.map((entity) => this.adapter.enhanceEntity(entity, this.entityType));
      }
    }

    return transformedData;
  }

  /**
   * Core API response transformation (private method)
   */
  _transformAPIResponse(rawData) {
    if (!rawData || (typeof rawData === "object" && Object.keys(rawData).length === 0)) {
      return { items: [], total: 0, page: 1, pageSize: 50 };
    }

    // Handle grouped response (preserve structure)
    if (this._isGroupedResponse(rawData)) {
      return this._transformGroupedResponse(rawData);
    }

    // Handle paginated response
    if (this._isPaginatedResponse(rawData)) {
      return this._transformPaginatedResponse(rawData);
    }

    // Handle plain array
    if (Array.isArray(rawData)) {
      return { items: rawData, total: rawData.length, page: 1, pageSize: rawData.length };
    }

    // Handle single entity
    return { items: [rawData], total: 1, page: 1, pageSize: 1 };
  }

  _isGroupedResponse(rawData) {
    return rawData?.items && Array.isArray(rawData.items) && rawData.items[0]?.emne;
  }

  _isPaginatedResponse(rawData) {
    return rawData?.items && (rawData?.count !== undefined || rawData?.totalCount !== undefined);
  }

  _transformGroupedResponse(rawData) {
    // Normalize grouped structure to consistent format
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

  _getEntityKeyForGroup(group) {
    // Find the entity array key in the group (e.g., 'prosjektkrav', 'krav', etc.)
    const possibleKeys = ["prosjektkrav", "krav", "tiltak", "prosjekttiltak", "entities"];
    return possibleKeys.find((key) => Array.isArray(group[key])) || possibleKeys[0];
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
  sortEntities(entities, sortBy = "updatedAt", sortOrder = "desc") {
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
    return this.adapter.extractUID ? this.adapter.extractUID(entity) : entity.uid || entity.id;
  }

  /**
   * Get entity title (delegates to adapter)
   */
  extractTitle(entity) {
    return this.adapter.extractTitle ? this.adapter.extractTitle(entity) : entity.title || entity.tittel || entity.name;
  }

  /**
   * Get badge color for entity type (delegates to adapter)
   */
  getBadgeColor(entityType) {
    return this.adapter.getBadgeColor ? this.adapter.getBadgeColor(entityType) : "bg-gray-100 text-gray-700";
  }

  /**
   * Get display type name (delegates to adapter)
   */
  getDisplayType(entityType) {
    return this.adapter.getDisplayType ? this.adapter.getDisplayType(entityType) : entityType;
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

  /**
   * Get the API property name for this entity type in grouped responses
   * This handles the mapping between entityType and API keys
   */
  getGroupedPropertyName() {
    const mapping = {
      prosjektKrav: "prosjektkrav",
      prosjektTiltak: "prosjekttiltak",
      krav: "krav",
      tiltak: "tiltak",
    };
    return mapping[this.entityType] || this.entityType.toLowerCase();
  }

  /**
   * Extract all entities from grouped data structure
   * This is the authoritative method for flattening grouped data
   */
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

  /**
   * Load data using adapter and query functions
   */
  async loadData(queryParams = {}) {
    try {
      // Get query functions from adapter
      const queryFunctions = this.adapter.getQueryFunctions();

      // For individual entities, use the grouped query function
      const queryFn = queryFunctions[this.entityType]?.grouped;

      if (!queryFn) {
        console.error(
          `SingleEntityDTO[${this.entityType}]: No query function found for entity type. Available:`,
          Object.keys(queryFunctions)
        );
        throw new Error(`No query function found for entity type: ${this.entityType}`);
      }

      // Call the query function with parameters
      const rawResponse = await queryFn(queryParams);

      // Extract data from Axios response
      const rawData = rawResponse.data || rawResponse;

      // Transform the response

      const transformedResponse = this.transformResponse(rawData);

      return transformedResponse;
    } catch (error) {
      console.error(`SingleEntityDTO[${this.entityType}]: Load data error:`, error);
      throw error;
    }
  }

  // === UTILITY METHODS ===

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      type: "SingleEntityDTO",
      entityType: this.entityType,
      hasAdapter: !!this.adapter,
      adapterType: this.adapter?.constructor?.name,
      options: this.options,
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
