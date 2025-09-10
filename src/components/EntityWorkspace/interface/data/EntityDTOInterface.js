/**
 * EntityDTO Interface Contract
 * 
 * Defines the methods that EntityWorkspace interface expects from DTOs.
 * All DTOs must implement these methods to work with EntityWorkspace.
 */

/**
 * Base DTO Interface that all entity DTOs must implement
 */
export class EntityDTOInterface {
  
  // === REQUIRED DATA METHODS ===
  
  /**
   * Transform API response data for EntityWorkspace consumption
   * @param {Object} rawData - Raw API response
   * @returns {Object} Transformed data with { items: [], total: number, ... }
   */
  transformResponse(rawData) {
    throw new Error('EntityDTO must implement transformResponse()');
  }
  
  /**
   * Get the primary entity type name
   * @returns {string} Entity type (e.g., 'krav', 'tiltak', 'combined-krav-tiltak')
   */
  get entityType() {
    throw new Error('EntityDTO must implement entityType getter');
  }
  
  // === REQUIRED SAVE/DELETE HANDLERS ===
  
  /**
   * Save entity (create or update)
   * @param {Object} entityData - Entity data to save
   * @param {boolean} isUpdate - Whether this is an update (true) or create (false)
   * @returns {Promise<Object>} Saved entity result
   */
  async save(entityData, isUpdate) {
    throw new Error('EntityDTO must implement save()');
  }
  
  /**
   * Delete entity
   * @param {Object} entity - Entity to delete
   * @returns {Promise<void>}
   */
  async delete(entity) {
    throw new Error('EntityDTO must implement delete()');
  }
  
  // === REQUIRED POST-OPERATION HOOKS ===
  
  /**
   * Handle post-save operations (selection, scrolling, etc.)
   * @param {Object} result - Save operation result
   * @param {boolean} isCreate - Whether this was a create operation
   * @param {Function} handleEntitySelect - EntityWorkspace's selection handler
   * @param {string} entityType - The entity type context from EntityWorkspace (proper DI)
   */
  onSaveComplete(result, isCreate, handleEntitySelect, entityType = null) {
    throw new Error('EntityDTO must implement onSaveComplete()');
  }
  
  /**
   * Handle post-delete operations
   * @param {Object} deletedEntity - The deleted entity
   * @param {Function} handleEntityDeselect - EntityWorkspace's deselection handler
   */
  onDeleteComplete(deletedEntity, handleEntityDeselect) {
    // Optional - provide default implementation
    if (handleEntityDeselect) {
      handleEntityDeselect();
    }
  }
  
  // === OPTIONAL CONFIGURATION METHODS ===
  
  /**
   * Get display configuration for EntityWorkspace
   * @returns {Object} Display config { title, entityTypes, ... }
   */
  getDisplayConfig() {
    return this.adapter?.getDisplayConfig?.() || { title: this.entityType };
  }
  
  /**
   * Get filter configuration for EntityWorkspace
   * @returns {Object} Filter config
   */
  getFilterConfig() {
    return this.adapter?.getFilterConfig?.() || { fields: {}, sortFields: [] };
  }
  
  // === REQUIRED RENDERING HELPERS ===
  
  /**
   * Create a new empty entity for creation forms
   * @param {string} entityType - Required entity type (e.g., 'krav', 'tiltak', 'prosjektkrav')
   * @returns {Object} New entity structure with proper type markers
   */
  createNewEntity(entityType) {
    throw new Error('EntityDTO must implement createNewEntity()');
  }

  /**
   * Get entity type from entity data (for save/delete operations)
   * @param {Object} entityData - Entity data to analyze
   * @returns {string} Detected entity type
   */
  getEntityType(entityData) {
    throw new Error('EntityDTO must implement getEntityType()');
  }
  
  /**
   * Enhance raw entity data with computed fields
   * @param {Object} rawEntity - Raw entity from API
   * @returns {Object} Enhanced entity with renderId, displayType, etc.
   */
  enhanceEntity(rawEntity) {
    throw new Error('EntityDTO must implement enhanceEntity()');
  }
  
  // === DEBUG/UTILITY METHODS ===
  
  /**
   * Get debug information about this DTO
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      type: this.constructor.name,
      entityType: this.entityType,
      adapter: this.adapter?.constructor?.name || 'unknown'
    };
  }
}

/**
 * Validation helper to ensure DTO implements required interface
 * @param {Object} dto - DTO instance to validate
 * @throws {Error} If DTO doesn't implement required methods
 */
export function validateEntityDTO(dto) {
  const requiredMethods = [
    'transformResponse',
    'save', 
    'delete',
    'onSaveComplete',
    'createNewEntity',
    'getEntityType',
    'enhanceEntity'
  ];
  
  const requiredProperties = ['entityType'];
  
  for (const method of requiredMethods) {
    if (typeof dto[method] !== 'function') {
      throw new Error(`EntityDTO must implement method: ${method}()`);
    }
  }
  
  for (const property of requiredProperties) {
    if (dto[property] === undefined) {
      throw new Error(`EntityDTO must implement property: ${property}`);
    }
  }
  
  return true;
}