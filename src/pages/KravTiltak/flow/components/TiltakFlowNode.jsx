import React from "react";
import { Handle, Position } from "reactflow";
import { EntityCard } from "../../shared/components/EntityCard";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak";

/**
 * TiltakFlowNode - React Flow node for Tiltak entities
 * Reuses existing EntityCard component for consistent styling and functionality
 */
const TiltakFlowNode = ({ data, selected }) => {
  const { entity, dto, onEntitySelect, onFieldSave, viewOptions, usedHandles, hasIncoming, hasOutgoing } = data;

  return (
    <>
      {hasIncoming && <Handle type="target" position={Position.Left} id="tiltak-target" style={{ background: "#6b7280" }} />}
      {hasOutgoing && <Handle type="source" position={Position.Right} id="tiltak-source" style={{ background: "#6b7280" }} />}

      {/* Flow node wrapper */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow w-80 max-w-80">
        {/* Header indicator with UID */}
        <div className="bg-green-50 px-3 py-1 rounded-t-lg border-b border-green-100 flex justify-between items-center">
          <span className="text-xs font-medium text-green-700">TILTAK</span>
          {dto && entity && <span className="text-xs font-mono text-green-600">{dto.extractUID(entity)}</span>}
        </div>

        {/* Simplified card content */}
        <div className="p-3 overflow-hidden">
          <div className="cursor-pointer" onClick={() => onEntitySelect?.(entity, "select")}>
            {/* Title */}
            <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
              {entity?.tittel || entity?.navn || entity?.name || "Uten tittel"}
            </h4>

            {/* Merknad if present */}
            {(entity?.merknad || entity?.merknader) && (
              <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
                <span className="text-xs font-medium text-amber-800">Merknad:</span>
                <div className="mt-0.5 text-xs line-clamp-2">{entity?.merknad || entity?.merknader}</div>
              </div>
            )}

            {/* Description snippet */}
            {entity?.beskrivelseSnippet && (
              <div className="mb-2">
                <p className="text-xs text-gray-600 line-clamp-2">{entity.beskrivelseSnippet}</p>
              </div>
            )}

            {/* Implementation snippet */}
            {entity?.implementasjonSnippet && (
              <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 border-l-2 border-blue-300">
                <span className="font-medium text-gray-700">Implementasjon:</span>
                <p className="mt-0.5 line-clamp-2">{entity.implementasjonSnippet}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TiltakFlowNode;
