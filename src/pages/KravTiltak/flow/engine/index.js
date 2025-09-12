/**
 * Flow Transformer Barrel Export
 * Clean modular architecture for flow data transformation
 */

import { collectAllUniqueEntities, getEntitiesForEmne } from "./dataCollector.js";
import { buildGlobalRelationships } from "./relationshipBuilder.js";
import { preCalculateAllConnections } from "./connectionCalculator.js";
import { calculateLayout } from "./layoutEngine.js";
import { createNodes, createEdges } from "./nodeEdgeBuilder.js";
import { buildFlowLayoutConfig } from "./flowLayoutConfig.js";

// Re-export all functions
export {
  collectAllUniqueEntities,
  getEntitiesForEmne,
  buildGlobalRelationships,
  preCalculateAllConnections,
  calculateLayout,
  createNodes,
  createEdges,
};

/**
 * Main flow data transformer - clean architecture
 */
export function transformFlowData(flowData, nodeDataOptions = {}, viewOptions = {}, layoutOverrides = {}) {
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
  } else if (Array.isArray(flowData)) {
    emneGroups = flowData;
  }

  if (!emneGroups || emneGroups.length === 0) {
    return { nodes, edges };
  }

  // Build merged layout configuration (defaults + overrides)
  const merged = buildFlowLayoutConfig(layoutOverrides);
  const L = merged.LAYOUT;
  const config = {
    // Raw spacing semantics used by downstream code
    BASE_NODE_HEIGHT: 120,
    MERKNAD_HEIGHT: 45,
    ENTITY_SPACING: L.vertical_distance_within_emne,
    MIN_EMNE_SPACING: L.vertical_distance_between_emne,
    verticalWithinEmne: L.vertical_distance_within_emne,
    verticalBetweenEmne: L.vertical_distance_between_emne,
    horizontalBetweenColumns: L.horizontal_distance_between_columns,
    minClusterHeight: L.min_cluster_height,
    enableClusterSpread: L.enable_cluster_spread,
    enableMultiParentAdjust: L.enable_multi_parent_adjust,
  };

  // STEP 1: Global data collection (once)
  const { allKravEntities, allTiltakEntities } = collectAllUniqueEntities(emneGroups);

  // STEP 2: Global relationship building (once)
  const globalRelationships = buildGlobalRelationships(allKravEntities, allTiltakEntities);

  // STEP 3: Global connection pre-calculation (once)
  const globalConnections = preCalculateAllConnections(allKravEntities, allTiltakEntities, globalRelationships);

  // STEP 4: Balanced layout calculation (Dagre + essential features)
  const globalPositions = calculateLayout(allKravEntities, allTiltakEntities, globalRelationships, globalConnections, config, viewOptions);

  // STEP 5: Create React Flow nodes and edges with proper handles
  const finalNodes = createNodes(globalPositions, globalRelationships, config, nodeDataOptions, allKravEntities, allTiltakEntities);
  const finalEdges = createEdges(globalRelationships, globalPositions, allKravEntities, allTiltakEntities);

  return {
    nodes: finalNodes,
    edges: finalEdges,
  };
}
