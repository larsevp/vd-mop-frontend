import React from 'react';
import { truncateText } from './textHelpers';

/**
 * Reference helper functions for parent and special references
 */

/**
 * Get special reference component (e.g., generalTiltak)
 * @param {Object} entity - Entity object
 * @returns {React.Component|null} Special reference component or null
 */
export const getSpecialReference = (entity) => {
  if (entity.generalTiltak) {
    return (
      <span className="text-xs text-purple-600 flex items-center">
        <span className="text-purple-500">↑</span>
        {truncateText(entity.generalTiltak.tittel || entity.generalTiltak.navn, 25)}
      </span>
    );
  }
  return null;
};

/**
 * Get parent reference component
 * @param {Object} entity - Entity object
 * @returns {React.Component|null} Parent reference component or null
 */
export const getParentReference = (entity) => {
  if (entity.parentTittel || entity.parent?.tittel) {
    return (
      <span className="text-xs text-blue-600 flex items-center">
        <span className="text-blue-500">↑</span>
        {truncateText(entity.parentTittel || entity.parent?.tittel, 25)}
      </span>
    );
  }
  return null;
};