import React from 'react';
import { EntityDetailPane } from '../../shared';
import { tiltak as tiltakConfig } from '@/modelConfigs/models/tiltak';
import { krav as kravConfig } from '@/modelConfigs/models/krav';

/**
 * TiltakDetailRenderer - Domain-specific detail renderer
 * 
 * This renderer function passes the Tiltak modelConfig to the shared
 * EntityDetailPane component, following the established render prop pattern.
 */

/**
 * Render detail pane for Tiltak entity
 * 
 * @param {Object} entity - The entity data (normalized by DTO)
 * @param {Object} props - Render props from EntityWorkspace
 * @param {Function} props.onSave - Save handler from DTO
 * @param {Function} props.onDelete - Delete handler from DTO
 * @param {Function} props.onClose - Close handler for split view
 * @param {Object} props.viewOptions - Current view options state
 * @returns {JSX.Element} Tiltak detail pane
 */
export const renderDetailPane = (entity, props) => {
  const { key, onSave, onDelete, dto, workspaceType, modelConfig, ...restProps } = props;

  // Use modelConfig from props if provided (for read-only mode), otherwise use default tiltakConfig
  const effectiveModelConfig = modelConfig || tiltakConfig;

  // Pass onSave to integrate with EntityWorkspace's post-save logic
  // EntityDetailPane will use this if provided, otherwise fall back to modelConfig
  // Use workspaceType if provided (for combined views), otherwise use "tiltak"
  return (
    <EntityDetailPane
      key={key || `detail-${entity?.id || 'no-id'}`}
      entity={entity}
      modelConfig={effectiveModelConfig}
      entityType={workspaceType || "tiltak"}
      onSave={onSave} // Pass through to enable post-save selection
      onDelete={onDelete} // Pass through for consistency
      dto={dto}  // NEW: Pass dto for inheritance logic
      kravConfig={kravConfig}  // NEW: For fetching connected Krav data
      {...restProps}
    />
  );
};