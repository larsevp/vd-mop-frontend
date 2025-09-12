import React from 'react';
import { Handle, Position } from 'reactflow';

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
        style={{ background: '#3b82f6' }}
      />

      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-3 min-w-[180px] max-w-[220px]">
        {/* Emne title only */}
        <h3 className="font-semibold text-gray-900 text-center">
          {emne?.tittel || emne?.navn || emne?.name || 'Uten navn'}
        </h3>
      </div>
    </>
  );
};

export default EmneFlowNode;