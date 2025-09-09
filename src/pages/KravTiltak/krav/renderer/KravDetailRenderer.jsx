import React from 'react';
import { EntityDetailPane } from '../../shared';
import { krav as kravConfig } from '@/modelConfigs/models/krav.js';

/**
 * KravDetailRenderer - Domain-specific detail renderer
 * 
 * This renderer function passes the Krav modelConfig to the shared
 * EntityDetailPane component, following the established render prop pattern.
 */

/**
 * Render detail pane for Krav entity
 * 
 * @param {Object} entity - The entity data (normalized by DTO)
 * @param {Object} props - Render props from EntityWorkspace
 * @param {Function} props.onSave - Save handler from DTO
 * @param {Function} props.onDelete - Delete handler from DTO
 * @param {Function} props.onClose - Close handler for split view
 * @param {Object} props.viewOptions - Current view options state
 * @returns {JSX.Element} Krav detail pane
 */
export const renderDetailPane = (entity, props) => {
  const { key, ...restProps } = props;
  
  return (
    <EntityDetailPane
      key={key || `detail-${entity?.id || 'no-id'}`}
      entity={entity}
      modelConfig={kravConfig}
      entityType="krav"
      {...restProps}
    />
  );
};