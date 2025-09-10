import React from 'react';
import { Handle, Position } from 'reactflow';
import { EntityCard } from '../../../shared/components/EntityCard';
import { prosjektTiltak as prosjektTiltakConfig } from '@/modelConfigs/models/prosjektTiltak';

/**
 * ProsjektTiltakFlowNode - React Flow node for ProsjektTiltak entities
 * Reuses existing EntityCard component for consistent styling and functionality
 */
const ProsjektTiltakFlowNode = ({ data, selected }) => {
  const { entity, onEntitySelect, onFieldSave, viewOptions } = data;

  return (
    <>
      {/* Input handle (left side) - receives connections from ProsjektKrav */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#10b981' }}
      />

      {/* Flow node wrapper */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow w-80 max-w-80">
        {/* Header indicator */}
        <div className="bg-green-50 px-3 py-1 rounded-t-lg border-b border-green-100">
          <span className="text-xs font-medium text-green-700">PROSJEKTTILTAK</span>
        </div>

        {/* Simplified card content */}
        <div className="p-3 overflow-hidden">
          <div 
            className="cursor-pointer"
            onClick={() => onEntitySelect?.(entity, 'select')}
          >
            {/* Title */}
            <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
              {entity?.tittel || entity?.navn || entity?.name || 'Uten tittel'}
            </h4>
            
            {/* Description snippet */}
            {entity?.beskrivelseSnippet && (
              <p className="text-xs text-gray-600 line-clamp-3">
                {entity.beskrivelseSnippet}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProsjektTiltakFlowNode;