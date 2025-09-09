/**
 * Text utility functions for EntityCard
 */

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 60) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Get entity title from various possible field names
 * @param {Object} entity - Entity object
 * @param {Object} config - Config object with badgeText
 * @returns {string} Entity title
 */
export const getEntityTitle = (entity, config) => {
  return entity.tittel || entity.navn || entity.name || entity.title || `${config.badgeText || 'Element'} ${entity.id}`;
};