import React from 'react';
import KravCard from './components/KravCard.jsx';
import { EmneGroupHeader, RowListHeading, EntityDetailPane } from '../../shared';

/**
 * Krav-specific renderer functions
 * 
 * These functions provide domain-specific rendering for Krav entities
 * while maintaining consistency with the EntityWorkspace pattern.
 */

/**
 * Render a single Krav entity card
 */
export const renderEntityCard = (entity, props) => {
  const { key, ...restProps } = props;
  return (
    <KravCard
      key={key}
      entity={entity}
      {...restProps}
    />
  );
};

/**
 * Render emne group header for Krav entities
 */
export const renderGroupHeader = (groupData, options = {}) => {
  return (
    <EmneGroupHeader
      groupData={groupData}
      itemCount={groupData.items?.length || 0}
      entityType="krav"
      {...options}
    />
  );
};

/**
 * Render list heading for Krav entities
 */
export const renderListHeading = (props) => {
  return (
    <RowListHeading
      {...props}
      entityType="krav"
    />
  );
};


/**
 * Get available view options for Krav
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
  };
};