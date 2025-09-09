import React from 'react';
import ProsjektTiltakCard from './components/ProsjektTiltakCard.jsx';
import { EmneGroupHeader, RowListHeading, EntityDetailPane } from '../../shared';

/**
 * ProsjektTiltak-specific renderer functions
 * 
 * These functions provide domain-specific rendering for ProsjektTiltak entities
 * while maintaining consistency with the EntityWorkspace pattern.
 */

/**
 * Render a single ProsjektTiltak entity card
 */
export const renderEntityCard = (entity, props) => {
  const { key, ...restProps } = props;
  return (
    <ProsjektTiltakCard
      key={key}
      entity={entity}
      {...restProps}
    />
  );
};

/**
 * Render emne group header for ProsjektTiltak entities
 */
export const renderGroupHeader = (groupData, options = {}) => {
  return (
    <EmneGroupHeader
      groupData={groupData}
      itemCount={groupData.items?.length || 0}
      entityType="prosjekttiltak"
      {...options}
    />
  );
};

/**
 * Render list heading for ProsjektTiltak entities
 */
export const renderListHeading = (props) => {
  return (
    <RowListHeading
      {...props}
      entityType="prosjekttiltak"
    />
  );
};


/**
 * Get available view options for ProsjektTiltak
 */
export const getAvailableViewOptions = () => {
  return {
    showHierarchy: "Vis hierarki",
    showMerknad: "Vis merknader",
    showGeneralTiltak: "Vis generelt tiltak", 
    showStatus: "Vis status",
    showVurdering: "Vis vurdering",
    showPrioritet: "Vis prioritet",
    showObligatorisk: "Vis obligatorisk",
    showRelations: "Vis relasjoner",
  };
};