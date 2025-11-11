import React from 'react';

/**
 * EmneFlowNode (Vertical Layout) - React Flow node for Emne entities
 * Displays subject area as column header at the top
 * No handles needed - emne doesn't connect to children with lines
 */
const EmneFlowNode = ({ data }) => {
  const { emne, kravCount } = data;

  return (
    <>
      <div className="bg-gradient-to-b from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-3 w-80 max-w-80">
        {/* Emne title */}
        <h3 className="font-semibold text-gray-900 text-center mb-2">
          {emne?.tittel || emne?.navn || emne?.name || 'Uten navn'}
        </h3>

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
