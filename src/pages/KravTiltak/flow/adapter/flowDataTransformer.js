/**
 * flowDataTransformer.js - Transform combined entity data to React Flow format
 *
 * Clean modular architecture that fixes cross-emne positioning issues
 * Converts data from ProsjektKravTiltakCombinedAdapter into nodes and edges
 * for React Flow visualization with right-to-left flow: Emne → ProsjektKrav → ProsjektTiltak
 */

// Import flow node components
import EmneFlowNode from "../components/EmneFlowNode";
import KravFlowNode from "../components/KravFlowNode";
import TiltakFlowNode from "../components/TiltakFlowNode";

// Import modular transformer
import { transformFlowData } from "../engine/index.js";

// Register node types
export const nodeTypes = {
  emneNode: EmneFlowNode,
  kravNode: KravFlowNode,
  tiltakNode: TiltakFlowNode,
};

/**
 * Legacy function name compatibility
 * Wrapper around the new transformFlowData function
 */
export function transformToFlowData(flowAdapterData, options = {}, viewOptions = {}) {
  // Handle different data structures
  let emneGroups = null;

  if (flowAdapterData?.emneGroups) {
    // FlowAdapter format: { emneGroups: [...] }
    emneGroups = flowAdapterData.emneGroups;
  } else if (Array.isArray(flowAdapterData)) {
    // Direct emneGroups array
    emneGroups = flowAdapterData;
  } else {
    return { nodes: [], edges: [] };
  }

  // Extract node data options from the legacy parameters
  const nodeDataOptions = {};
  if (options?.dto) nodeDataOptions.dto = options.dto;
  if (options?.onEntitySelect) nodeDataOptions.onEntitySelect = options.onEntitySelect;
  if (options?.onFieldSave) nodeDataOptions.onFieldSave = options.onFieldSave;
  if (viewOptions) nodeDataOptions.viewOptions = viewOptions;

  return transformFlowData(emneGroups, nodeDataOptions);
}

/**
 * Get default flow settings for React Flow
 */
export function getDefaultFlowSettings() {
  return {
    defaultViewport: { x: 0, y: 0, zoom: 0.8 },
    minZoom: 0.1,
    maxZoom: 2,
    attributionPosition: "bottom-left",
    snapToGrid: true,
    snapGrid: [10, 10],
    defaultEdgeOptions: {
      type: "default",
      style: { strokeWidth: 2 },
    },
  };
}

// Export the main transformer function with both names
export { transformFlowData };
