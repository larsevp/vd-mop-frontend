import React from 'react';
import { Handle, Position } from 'reactflow';
import { FileText } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

/**
 * EmneFlowNode - React Flow node for Emne entities
 * Displays subject area information on the rightmost side of the flow
 */
const EmneFlowNode = ({ data }) => {
  const { emne, kravCount } = data;

  return (
    <>
      {/* Output handle (right side) - connects to ProsjektKrav */}
      <Handle
        type="source"
        position={Position.Right}
        id="emne-source"
        style={{ background: '#3b82f6' }}
      />

      <div className="bg-white border-2 border-gray-300 rounded-lg p-3 min-w-[180px] max-w-[220px]">
        {/* Emne icon and title */}
        <div className="flex items-center justify-center gap-2">
          {/* Emne Icon with Color */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: emne?.color || "#6b7280" }}
          >
            <div className="text-white">
              {emne?.icon ? (
                <DynamicIcon name={emne.icon} size={14} color="white" />
              ) : (
                <FileText size={14} />
              )}
            </div>
          </div>

          <h3 className="font-semibold text-gray-900">
            {emne?.tittel || emne?.navn || emne?.name || 'Uten navn'}
          </h3>
        </div>
        
        {/* Merknad if present */}
        {(emne?.merknad || emne?.merknader) && (
          <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
            <span className="text-xs font-medium text-amber-800">Merknad:</span>
            <div className="mt-0.5 text-xs line-clamp-2">
              {emne?.merknad || emne?.merknader}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EmneFlowNode;