/**
 * Simple model name utilities for table components
 * Replaces the heavy EntityTypeTranslator dependency
 */

/**
 * Convert string to camelCase (simple version)
 * @param {string} str - Input string
 * @returns {string} camelCase version
 */
export const toCamelCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  
  return str
    .toLowerCase()
    .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
    .replace(/^([a-z])/, (match, letter) => letter.toLowerCase());
};

/**
 * Normalize model name to camelCase
 * @param {string} modelName - Model name in any format
 * @returns {string} Normalized camelCase model name
 */
export const normalizeModelName = (modelName) => {
  if (!modelName) return null;
  return toCamelCase(modelName);
};