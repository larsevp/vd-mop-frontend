/**
 * Data Cleaning Utilities
 *
 * Centralized logic for cleaning entity data before sending to backend.
 * Strips out internal fields, UI-specific fields, and junction table relationships
 * that shouldn't be sent in CRUD operations.
 */

/**
 * Internal fields to strip before sending to backend
 * These are added by the frontend for UI/state management purposes
 */
const INTERNAL_FIELDS = [
  // UI metadata fields
  'entityType',
  'renderId',
  'displayType',
  'badgeColor',

  // Junction table relationships (managed separately via join tables)
  'kravIds',
  'prosjektKravIds',
];

/**
 * Clean entity data before sending to backend
 * Removes all internal fields (starting with __) and UI-specific fields
 *
 * @param {Object} entityData - Raw entity data from form
 * @returns {Object} Clean entity data safe to send to backend
 *
 * @example
 * const formData = {
 *   id: 1,
 *   tittel: "My Title",
 *   __isNew: true,
 *   __entityType: "krav",
 *   entityType: "krav",
 *   kravIds: [1, 2, 3],
 *   renderId: "krav-123"
 * };
 *
 * const clean = cleanEntityData(formData);
 * // Result: { id: 1, tittel: "My Title" }
 */
export const cleanEntityData = (entityData) => {
  if (!entityData || typeof entityData !== 'object') {
    return {};
  }

  const cleanData = {};

  Object.keys(entityData).forEach((key) => {
    // Skip fields starting with __ (internal runtime fields)
    if (key.startsWith('__')) {
      return;
    }

    // Skip fields in the internal fields list
    if (INTERNAL_FIELDS.includes(key)) {
      return;
    }

    // Copy the field to clean data
    cleanData[key] = entityData[key];
  });

  return cleanData;
};

/**
 * Add a custom field to the internal fields list
 * Useful for domain-specific fields that need to be filtered
 *
 * @param {string} fieldName - Field name to add to filter list
 */
export const addInternalField = (fieldName) => {
  if (!INTERNAL_FIELDS.includes(fieldName)) {
    INTERNAL_FIELDS.push(fieldName);
  }
};

/**
 * Get list of all internal fields being filtered
 * Useful for debugging
 *
 * @returns {string[]} Array of field names
 */
export const getInternalFields = () => {
  return [...INTERNAL_FIELDS];
};
