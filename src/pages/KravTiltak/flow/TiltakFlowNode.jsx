import React from 'react';
import { Handle, Position } from 'reactflow';
import { EntityCard } from '../shared/components/EntityCard';
import { prosjektTiltak as prosjektTiltakConfig } from '@/modelConfigs/models/prosjektTiltak';

/**
 * TiltakFlowNode - React Flow node for Tiltak entities
 * Reuses existing EntityCard component for consistent styling and functionality
 */
const TiltakFlowNode = ({ data, selected }) => {
  const { entity, dto, onEntitySelect, onFieldSave, viewOptions, usedHandles } = data;

  return (
    <>
      {/* Input handle (left side) - receives connections from ProsjektKrav */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#6b7280' }}
      />

      {/* Output handles (right side) - connects to child ProsjektTiltak */}
      {usedHandles?.source?.includes('right-top') && (
        <Handle
          id="right-top"
          type="source"
          position={Position.Right}
          style={{ 
            background: '#6b7280', 
            top: '30%',
            transform: 'translateY(-50%)'
          }}
        />
      )}
      {usedHandles?.source?.includes('right-middle') && (
        <Handle
          id="right-middle"
          type="source"
          position={Position.Right}
          style={{ 
            background: '#6b7280',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      )}
      {usedHandles?.source?.includes('right-bottom') && (
        <Handle
          id="right-bottom"
          type="source"
          position={Position.Right}
          style={{ 
            background: '#6b7280',
            top: '70%',
            transform: 'translateY(-50%)'
          }}
        />
      )}

      {/* Flow node wrapper */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow w-80 max-w-80">
        {/* Header indicator with UID */}
        <div className="bg-green-50 px-3 py-1 rounded-t-lg border-b border-green-100 flex justify-between items-center">
          <span className="text-xs font-medium text-green-700">TILTAK</span>
          {dto && entity && (
            <span className="text-xs font-mono text-green-600">
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

export default TiltakFlowNode;