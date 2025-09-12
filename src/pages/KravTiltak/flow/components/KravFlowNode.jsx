import React from 'react';
import { Handle, Position } from 'reactflow';
import { EntityCard } from '../../shared/components/EntityCard';
import { prosjektKrav as prosjektKravConfig } from '@/modelConfigs/models/prosjektKrav';

/**
 * KravFlowNode - React Flow node for Krav entities
 * Reuses existing EntityCard component for consistent styling and functionality
 */
const KravFlowNode = ({ data, selected }) => {
  const { entity, dto, onEntitySelect, onFieldSave, viewOptions, usedHandles } = data;

  return (
    <>
      {/* Input handle (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#3b82f6' }}
      />

      {/* Output handle (right side) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#6b7280' }}
      />

      {/* Flow node wrapper */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow w-80 max-w-80">
        {/* Header indicator with UID */}
        <div className="bg-blue-50 px-3 py-1 rounded-t-lg border-b border-blue-100 flex justify-between items-center">
          <span className="text-xs font-medium text-blue-700">KRAV</span>
          {dto && entity && (
            <span className="text-xs font-mono text-blue-600">
              {dto.extractUID(entity)}
            </span>
          )}
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
            
            {/* Merknad if present */}
            {(entity?.merknad || entity?.merknader) && (
              <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
                <span className="text-xs font-medium text-amber-800">Merknad:</span>
                <div className="mt-0.5 text-xs line-clamp-2">
                  {entity?.merknad || entity?.merknader}
                </div>
              </div>
            )}
            
            {/* Description snippet */}
            {entity?.beskrivelseSnippet && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {entity.beskrivelseSnippet}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default KravFlowNode;