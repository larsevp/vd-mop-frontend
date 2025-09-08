/**
 * Text utility functions for KravTiltak domain
 */

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 60) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};