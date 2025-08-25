/**
 * Field Suppression Utility
 *
 * Handles automatic field exclusion based on model configuration suppressIndex,
 * suppressCreate, and suppressEdit properties.
 */

/**
 * Extract fields that should be suppressed for a specific operation
 * @param {Object} modelConfig - The model configuration object
 * @param {string} operation - The operation type ('index', 'create', 'edit')
 * @returns {string[]} Array of field names to suppress
 */
export function getSuppressedFields(modelConfig, operation = "index") {
  if (!modelConfig || !modelConfig.fields) {
    return [];
  }

  const suppressProperty = {
    index: "suppressIndex",
    create: "suppressCreate",
    edit: "suppressEdit",
  }[operation];

  if (!suppressProperty) {
    return [];
  }

  return modelConfig.fields.filter((field) => field[suppressProperty] === true).map((field) => field.name);
}

/**
 * Get legacy hidden fields for backward compatibility
 * @param {Object} modelConfig - The model configuration object
 * @param {string} operation - The operation type ('index', 'create', 'edit')
 * @returns {string[]} Array of field names that are hidden
 */
export function getHiddenFields(modelConfig, operation = "index") {
  if (!modelConfig || !modelConfig.fields) {
    return [];
  }

  const hiddenProperty = {
    index: "hiddenIndex",
    create: "hiddenCreate",
    edit: "hiddenEdit",
  }[operation];

  if (!hiddenProperty) {
    return [];
  }

  return modelConfig.fields.filter((field) => field[hiddenProperty] === true).map((field) => field.name);
}

/**
 * Get all fields to exclude for an operation (both suppress and hidden)
 * @param {Object} modelConfig - The model configuration object
 * @param {string} operation - The operation type ('index', 'create', 'edit')
 * @returns {string[]} Array of field names to exclude
 */
export function getExcludedFields(modelConfig, operation = "index") {
  const suppressedFields = getSuppressedFields(modelConfig, operation);
  const hiddenFields = getHiddenFields(modelConfig, operation);

  // Combine and deduplicate
  const allExcluded = [...new Set([...suppressedFields, ...hiddenFields])];
  return allExcluded;
}

/**
 * Create X-Exclude-Fields header value for API calls
 * @param {Object} modelConfig - The model configuration object
 * @param {string} operation - The operation type ('index', 'create', 'edit')
 * @returns {string|null} Header value or null if no fields to exclude
 */
export function createExcludeFieldsHeader(modelConfig, operation = "index") {
  const excludedFields = getExcludedFields(modelConfig, operation);

  if (excludedFields.length === 0) {
    return null;
  }

  return excludedFields.join(",");
}

/**
 * Add field exclusion headers to request config
 * @param {Object} modelConfig - The model configuration object
 * @param {string} operation - The operation type ('index', 'create', 'edit')
 * @param {Object} config - Existing axios config (optional)
 * @returns {Object} Updated config with headers
 */
export function addFieldExclusionHeaders(modelConfig, operation = "index", config = {}) {
  const excludeHeader = createExcludeFieldsHeader(modelConfig, operation);

  if (!excludeHeader) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Exclude-Fields": excludeHeader,
    },
  };
}
