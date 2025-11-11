/**
 * Vertical Layout Transformer
 * Transforms entity data into React Flow format using columnar layout
 */

import { collectAllUniqueEntities } from "../../engine/dataCollector.js";
import { buildGlobalRelationships } from "../../engine/relationshipBuilder.js";
import { preCalculateAllConnections } from "../../engine/connectionCalculator.js";
import { calculateColumnarLayout } from "./columnarLayoutEngine.js";
import { createVerticalNodes, createVerticalEdges } from "./verticalNodeEdgeBuilder.js";
import { getVerticalLayoutConfig } from "./verticalLayoutConfig.js";

/**
 * Transform data to vertical columnar flow layout
 * @param {Array} flowData - Emne groups with entities
 * @param {Object} nodeDataOptions - Options to pass to node data (dto, callbacks, etc)
 * @param {Object} viewOptions - View configuration (showMerknad, etc)
 * @param {Object} layoutOverrides - Custom layout configuration overrides
 * @returns {Object} { nodes, edges } for React Flow
 */
export function transformToVerticalFlow(flowData, nodeDataOptions = {}, viewOptions = {}, layoutOverrides = {}) {
  const nodes = [];
  const edges = [];

  // Handle data structure compatibility
  let emneGroups = [];
  if (flowData?.items && Array.isArray(flowData.items)) {
    emneGroups = flowData.items.map((item) => ({
      emne: item.emne,
      kravEntities: item.entities?.filter((e) => e.entityType?.toLowerCase().includes("krav")) || [],
      tiltakEntities: item.entities?.filter((e) => e.entityType?.toLowerCase().includes("tiltak")) || [],
    }));
  } else if (flowData?.emneGroups && Array.isArray(flowData.emneGroups)) {
    emneGroups = flowData.emneGroups;
  } else if (Array.isArray(flowData)) {
    emneGroups = flowData;
  }

  if (!emneGroups || emneGroups.length === 0) {
    return { nodes, edges };
  }

  // Get vertical layout configuration
  const config = getVerticalLayoutConfig(layoutOverrides);

  // STEP 1: Global data collection
  const { allKravEntities, allTiltakEntities } = collectAllUniqueEntities(emneGroups);

  // STEP 2: Global relationship building
  const globalRelationships = buildGlobalRelationships(allKravEntities, allTiltakEntities);

  // STEP 3: Global connection pre-calculation
  const globalConnections = preCalculateAllConnections(allKravEntities, allTiltakEntities, globalRelationships);

  // STEP 4: Columnar layout calculation (vertical positioning)
  const columnarPositions = calculateColumnarLayout(
    allKravEntities,
    allTiltakEntities,
    globalRelationships,
    globalConnections,
    config,
    viewOptions
  );

  // STEP 5: Create React Flow nodes and edges with vertical handles
  const finalNodes = createVerticalNodes(
    columnarPositions,
    globalRelationships,
    config,
    nodeDataOptions,
    allKravEntities,
    allTiltakEntities
  );

  const finalEdges = createVerticalEdges(globalRelationships, columnarPositions, allKravEntities, allTiltakEntities);

  return {
    nodes: finalNodes,
    edges: finalEdges,
  };
}
