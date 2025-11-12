import React from 'react';
import { truncateText } from './textHelpers';

/**
 * Reference helper functions for parent and special references
 */

/**
 * Get general tiltak reference component 
 * @param {Object} entity - Entity object
 * @returns {React.Component|null} General tiltak reference component or null
 */
export const getGeneralTiltakReference = (entity) => {
  if (entity.generalTiltak) {
    return (
      <span className="text-xs text-slate-600 flex items-center">
        <span className="text-slate-500">↑</span>
        {truncateText(entity.generalTiltak.tittel || entity.generalTiltak.navn, 25)}
      </span>
    );
  }
  return null;
};

/**
 * Get special reference component (deprecated - use specific functions)
 * @param {Object} entity - Entity object
 * @returns {React.Component|null} Special reference component or null
 */
export const getSpecialReference = (entity) => {
  // Disabled for now - use getGeneralTiltakReference if needed
  return null;
};

/**
 * Get parent reference component
 * @param {Object} entity - Entity object
 * @returns {React.Component|null} Parent reference component or null
 */
export const getParentReference = (entity) => {
  // Check for hierarchical parent (parentId) first
  if (entity.parentId) {
    const parentTitle = entity.parent?.tittel || entity.parent?.title;
    const parentUID = entity.parent?.kravUID || entity.parent?.tiltakUID || entity.parent?.uid || entity.parent?.id;
    const entityTitle = entity.tittel || entity.title;
    
    // Only show if we have a valid parent title that's different from the entity's title
    if (parentTitle && parentTitle !== entityTitle) {
      // Format: "UID: Title" 
      const displayText = parentUID ? `${parentUID}: ${parentTitle}` : parentTitle;
      
      return (
        <span className="text-xs text-slate-600 flex items-center">
          <span className="text-slate-500">↑</span>
          {truncateText(displayText, 35)}
        </span>
      );
    }
  }
  
  // Check for connected Krav parent (_parentKrav for Tiltak connected to Krav)
  if (entity._parentKrav) {
    const kravTitle = entity._parentKrav.tittel;
    const kravUID = entity._parentKrav.kravUID;
    
    if (kravTitle) {
      // Format: "UID: Title" 
      const displayText = kravUID ? `${kravUID}: ${kravTitle}` : kravTitle;
      
      return (
        <span className="text-xs text-slate-600 flex items-center">
          <span className="text-slate-500">→</span>
          {truncateText(displayText, 35)}
        </span>
      );
    }
  }
  
  return null;
};