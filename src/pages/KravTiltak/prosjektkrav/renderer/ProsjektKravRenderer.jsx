import React from 'react';
import { EmneGroupHeader } from '../../shared';
import ProsjektKravCard from './components/ProsjektKravCard.jsx';

/**
 * ProsjektKravRenderer - Render functions for ProsjektKrav entities
 * 
 * This module exports render functions that the EntityWorkspace interface calls
 * to generate the actual JSX for ProsjektKrav entities and groups.
 */

/**
 * Render a single ProsjektKrav entity card
 * 
 * @param {Object} entity - The entity data (normalized by adapter)
 * @param {Object} props - Render props from EntityWorkspace
 * @param {boolean} props.isSelected - Whether this entity is selected
 * @param {Function} props.onClick - Click handler for entity selection
 * @param {Object} props.viewOptions - Current view options state
 * @returns {JSX.Element} ProsjektKrav card component
 */
export const renderEntityCard = (entity, props) => {
  const { key, ...restProps } = props;
  return (
    <ProsjektKravCard
      key={key}
      entity={entity}
      {...restProps}
    />
  );
};

/**
 * Render an emne group header
 * 
 * @param {Object} groupData - The group data with emne information
 * @param {Object} props - Render props from EntityWorkspace
 * @param {boolean} props.isCollapsed - Whether this group is collapsed
 * @param {Function} props.onToggle - Toggle handler for group collapse
 * @param {number} props.itemCount - Number of items in this group
 * @returns {JSX.Element} EmneGroupHeader component (shared)
 */
export const renderGroupHeader = (groupData, props) => {
  const { key, ...restProps } = props;
  return (
    <EmneGroupHeader
      key={key || `group-${groupData.group?.emne?.id || 'no-emne'}`}
      groupData={groupData}
      {...restProps}
    />
  );
};

/**
 * Get available view options for ProsjektKrav
 * This defines what toggles appear in the "Visning" dropdown
 * 
 * @returns {Object} Available view options with labels
 */
export const getAvailableViewOptions = () => {
  return {
    showHierarchy: "Hierarki og relasjoner",
    showVurdering: "Vurdering", 
    showStatus: "Status",
    showPrioritet: "Prioritet",
    showObligatorisk: "Obligatorisk/Valgfri",
    showRelations: "Tilknyttede relasjoner"
  };
};

/**
 * Get default view options for ProsjektKrav
 * 
 * @returns {Object} Default view options state
 */
export const getDefaultViewOptions = () => {
  return {
    showHierarchy: true,
    showVurdering: true,
    showStatus: false,
    showPrioritet: true,
    showObligatorisk: true,
    showRelations: true
  };
};