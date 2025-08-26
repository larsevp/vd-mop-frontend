/**
 * Krav-specific Field Visibility Utility
 *
 * Handles field visibility specifically for Krav components (KravDetailDisplay, KravCard, etc.)
 * Uses new naming convention: hideIndexKrav, hideCreateKrav, hideEditKrav, hideViewKrav
 */

/**
 * Get fields that should be hidden for a specific Krav operation
 * @param {Object} modelConfig - The model configuration object
 * @param {string} operation - The operation type ('index', 'create', 'edit', 'view')
 * @returns {string[]} Array of field names to hide
 */
export function getHiddenKravFields(modelConfig, operation = "view") {
  if (!modelConfig || !modelConfig.fields) {
    return [];
  }

  const hideProperty = {
    index: "hideIndexKrav",
    create: "hideCreateKrav", 
    edit: "hideEditKrav",
    view: "hideViewKrav",
  }[operation];

  if (!hideProperty) {
    return [];
  }

  return modelConfig.fields
    .filter((field) => field[hideProperty] === true)
    .map((field) => field.name);
}

/**
 * Check if a specific field should be hidden for a Krav operation
 * @param {Object} field - The field configuration object
 * @param {string} operation - The operation type ('index', 'create', 'edit', 'view')
 * @returns {boolean} True if field should be hidden
 */
export function isKravFieldHidden(field, operation = "view") {
  if (!field) return false;

  const hideProperty = {
    index: "hideIndexKrav",
    create: "hideCreateKrav",
    edit: "hideEditKrav", 
    view: "hideViewKrav",
  }[operation];

  return hideProperty && field[hideProperty] === true;
}

/**
 * Filter fields to get only visible fields for a Krav operation
 * @param {Array} fields - Array of field configuration objects
 * @param {string} operation - The operation type ('index', 'create', 'edit', 'view')
 * @returns {Array} Array of visible field configurations
 */
export function getVisibleKravFields(fields, operation = "view") {
  if (!fields || !Array.isArray(fields)) {
    return [];
  }

  return fields.filter((field) => !isKravFieldHidden(field, operation));
}

/**
 * Check if a field should be rendered in a specific Krav section
 * Combines both legacy visibility and new Krav-specific visibility
 * @param {Object} field - The field configuration object
 * @param {string} operation - The operation type ('index', 'create', 'edit', 'view')
 * @param {boolean} respectLegacy - Whether to also respect legacy hidden* fields (default: true)
 * @returns {boolean} True if field should be rendered
 */
export function shouldRenderKravField(field, operation = "view", respectLegacy = true) {
  if (!field) return false;

  // Check Krav-specific visibility
  if (isKravFieldHidden(field, operation)) {
    return false;
  }

  // Optionally check legacy visibility
  if (respectLegacy) {
    const legacyProperty = {
      index: "hiddenIndex",
      create: "hiddenCreate",
      edit: "hiddenEdit",
      view: "hiddenView", // Note: this might not exist in current system
    }[operation];

    if (legacyProperty && field[legacyProperty] === true) {
      return false;
    }
  }

  return true;
}

/**
 * Create a hook for Krav field visibility
 * @param {Object} modelConfig - The model configuration object
 * @param {string} operation - The operation type
 * @returns {Object} Visibility utility functions
 */
export function useKravFieldVisibility(modelConfig, operation = "view") {
  const hiddenFields = getHiddenKravFields(modelConfig, operation);
  const visibleFields = getVisibleKravFields(modelConfig?.fields || [], operation);

  return {
    hiddenFields,
    visibleFields,
    isFieldHidden: (fieldName) => hiddenFields.includes(fieldName),
    shouldRenderField: (field) => shouldRenderKravField(field, operation),
    getField: (fieldName) => modelConfig?.fields?.find(f => f.name === fieldName),
  };
}