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
 * Format text for display in cards - preserves line breaks but truncates for both views
 * @param {string} text - Text to format
 * @param {boolean} isExpandedCards - Whether this is expanded card view
 * @param {number} expandedMaxLength - Maximum length for expanded cards (default 400 chars ≈ 200 words)
 * @param {number} compactMaxLength - Maximum length for compact cards
 * @returns {string} Formatted text
 */
export const formatCardText = (text, isExpandedCards, expandedMaxLength = 400, compactMaxLength = 100) => {
  if (!text || typeof text !== 'string') return '';
  
  if (isExpandedCards) {
    // For expanded cards, truncate at higher limit but preserve structure
    return truncateText(text, expandedMaxLength);
  } else {
    // For compact cards, truncate at lower limit
    return truncateText(text, compactMaxLength);
  }
};

/**
 * Get entity title from various possible field names
 * @param {Object} entity - Entity object
 * @param {Object} config - Config object with badgeText
 * @returns {string} Entity title
 */
export const getEntityTitle = (entity, config) => {
  // Add safety check for undefined entity
  if (!entity) {
    console.error('getEntityTitle: entity is undefined');
    return `${config?.badgeText || 'Element'} [undefined]`;
  }
  
  return entity.tittel || entity.navn || entity.name || entity.title || `${config?.badgeText || 'Element'} ${entity.id || '[no-id]'}`;
};