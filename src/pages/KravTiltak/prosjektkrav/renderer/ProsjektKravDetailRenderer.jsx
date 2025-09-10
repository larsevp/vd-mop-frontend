import React from 'react';
import { EntityDetailPane } from '../../shared';
import { prosjektKrav as prosjektKravConfig } from '@/modelConfigs/models/prosjektKrav.js';

/**
 * ProsjektKravDetailRenderer - Domain-specific detail renderer
 * 
 * This renderer function passes the ProsjektKrav modelConfig to the shared
 * EntityDetailPane component, following the established render prop pattern.
 */

/**
 * Render detail pane for ProsjektKrav entity
 * 
 * @param {Object} entity - The entity data (normalized by DTO)
 * @param {Object} props - Render props from EntityWorkspace
 * @param {Function} props.onSave - Save handler from DTO
 * @param {Function} props.onDelete - Delete handler from DTO
 * @param {Function} props.onClose - Close handler for split view
 * @param {Object} props.viewOptions - Current view options state
 * @returns {JSX.Element} ProsjektKrav detail pane
 */
export const renderDetailPane = (entity, props) => {
  const { key, onSave, onDelete, ...restProps } = props;
  
  // Pass onSave to integrate with EntityWorkspace's post-save logic
  // EntityDetailPane will use this if provided, otherwise fall back to modelConfig
  return (
    <EntityDetailPane
      key={key || `detail-${entity?.id || 'no-id'}`}
      entity={entity}
      modelConfig={prosjektKravConfig}
      entityType="prosjektKrav"
      onSave={onSave} // Pass through to enable post-save selection
      onDelete={onDelete} // Pass through for consistency
      {...restProps}
    />
  );
};