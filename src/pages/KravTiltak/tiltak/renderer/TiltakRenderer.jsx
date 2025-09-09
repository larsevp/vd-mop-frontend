import React from 'react';
import TiltakCard from './components/TiltakCard.jsx';
import { EmneGroupHeader, RowListHeading, EntityDetailPane } from '../../shared';

/**
 * Tiltak-specific renderer functions
 * 
 * These functions provide domain-specific rendering for Tiltak entities
 * while maintaining consistency with the EntityWorkspace pattern.
 */

/**
 * Render a single Tiltak entity card
 */
export const renderEntityCard = (entity, props) => {
  const { key, ...restProps } = props;
  return (
    <TiltakCard
      key={key}
      entity={entity}
      {...restProps}
    />
  );
};

/**
 * Render emne group header for Tiltak entities
 */
export const renderGroupHeader = (groupData, options = {}) => {
  return (
    <EmneGroupHeader
      groupData={groupData}
      itemCount={groupData.items?.length || 0}
      entityType="tiltak"
      {...options}
    />
  );
};

/**
 * Render list heading for Tiltak entities
 */
export const renderListHeading = (props) => {
  return (
    <RowListHeading
      {...props}
      entityType="tiltak"
    />
  );
};


/**
 * Get available view options for Tiltak
 */
export const getAvailableViewOptions = () => {
  return {
    showHierarchy: "Vis hierarki",
    showMerknad: "Vis merknader",
    showStatus: "Vis status",
    showVurdering: "Vis vurdering",
    showPrioritet: "Vis prioritet",
    showObligatorisk: "Vis obligatorisk",
    showRelations: "Vis relasjoner",
    showFavorites: "Vis favoritter",
  };
};