/**
 * flowDataTransformer.js - Transform combined entity data to React Flow format
 *
 * Converts data from ProsjektKravTiltakCombinedAdapter into nodes and edges
 * for React Flow visualization with right-to-left flow: Emne → ProsjektKrav → ProsjektTiltak
 */

// Import flow node components
import EmneFlowNode from "./EmneFlowNode";
import KravFlowNode from "./KravFlowNode";
import TiltakFlowNode from "./TiltakFlowNode";

/**
 * Utility functions for relationship detection
 */

// Detect if entity A is parent of entity B (hierarchical relationship)
const isParentOf = (parentEntity, childEntity) => {
  return childEntity.parentId === parentEntity.id;
};

// Detect if tiltak is connected to krav (business relationship)
const isTiltakConnectedToKrav = (tiltak, krav) => {
  // Check if tiltak has prosjektKrav array containing this krav
  if (tiltak.prosjektKrav?.some((pk) => pk.id === krav.id)) return true;

  // Check direct reference (backup)
  if (tiltak.prosjektKravId === krav.id) return true;

  // Check adapter-added relationship markers
  if (tiltak._relatedToKrav === String(krav.id)) return true;

  return false;
};

// Build relationship graph for systematic processing
const buildRelationshipGraph = (kravEntities, tiltakEntities) => {
  const relationships = {
    kravToKrav: [], // Parent krav → Child krav
    tiltakToTiltak: [], // Parent tiltak → Child tiltak
    tiltakToKrav: [], // Tiltak → Krav (business relationship)
    standaloneKrav: [], // Krav with no parent
    standaloneTiltak: [], // Tiltak with no parent and no krav connection
  };

  // Find Krav → Krav relationships
  kravEntities.forEach((krav) => {
    kravEntities.forEach((otherKrav) => {
      if (isParentOf(krav, otherKrav)) {
        relationships.kravToKrav.push({ parent: krav, child: otherKrav });
      }
    });
  });

  // Find Tiltak → Tiltak relationships
  tiltakEntities.forEach((tiltak) => {
    tiltakEntities.forEach((otherTiltak) => {
      if (isParentOf(tiltak, otherTiltak)) {
        relationships.tiltakToTiltak.push({ parent: tiltak, child: otherTiltak });
      }
    });
  });

  // Find Tiltak → Krav relationships (tiltak can connect to multiple krav)
  tiltakEntities.forEach((tiltak) => {
    const connectedKrav = kravEntities.filter((krav) => isTiltakConnectedToKrav(tiltak, krav));

    connectedKrav.forEach((krav) => {
      relationships.tiltakToKrav.push({ tiltak, krav });
    });

    // Store multiple connections for positioning logic
    if (connectedKrav.length > 0) {
      tiltak._connectedKrav = connectedKrav;
      tiltak._hasMultipleKravConnections = connectedKrav.length > 1;
    }
  });

  // Find standalone entities
  relationships.standaloneKrav = kravEntities.filter((krav) => !krav.parentId);
  relationships.standaloneTiltak = tiltakEntities.filter((tiltak) => {
    const hasParent = tiltak.parentId;
    const hasKravConnection = kravEntities.some((krav) => isTiltakConnectedToKrav(tiltak, krav));
    return !hasParent && !hasKravConnection;
  });

  return relationships;
};

// Calculate hierarchical levels for proper horizontal positioning
const calculateEntityLevels = (relationships) => {
  const entityLevels = new Map();

  // Level 1: Top-level krav (no parent)
  relationships.standaloneKrav.forEach((krav) => {
    entityLevels.set(`krav-${krav.id}`, 1);
  });

  // Recursive function to calculate child levels (with max level priority)
  const calculateChildLevels = (entityType, entityId, currentLevel) => {
    if (entityType === "krav") {
      // Find child krav
      relationships.kravToKrav
        .filter((rel) => rel.parent.id === entityId)
        .forEach((rel) => {
          const childLevel = currentLevel + 1;
          const existingLevel = entityLevels.get(`krav-${rel.child.id}`);
          // Use max level when entity has multiple paths
          const finalLevel = existingLevel ? Math.max(existingLevel, childLevel) : childLevel;
          entityLevels.set(`krav-${rel.child.id}`, finalLevel);
          calculateChildLevels("krav", rel.child.id, finalLevel);
        });

      // Find tiltak connected to this krav
      relationships.tiltakToKrav
        .filter((rel) => rel.krav.id === entityId)
        .forEach((rel) => {
          const tiltakLevel = currentLevel + 1;
          const existingLevel = entityLevels.get(`tiltak-${rel.tiltak.id}`);
          // Use max level when entity has multiple paths
          const finalLevel = existingLevel ? Math.max(existingLevel, tiltakLevel) : tiltakLevel;

          // Don't add extra level for multiple connections - just use the calculated level
          const adjustedLevel = finalLevel;

          entityLevels.set(`tiltak-${rel.tiltak.id}`, adjustedLevel);
          calculateChildLevels("tiltak", rel.tiltak.id, adjustedLevel);
        });
    } else if (entityType === "tiltak") {
      // Find child tiltak
      relationships.tiltakToTiltak
        .filter((rel) => rel.parent.id === entityId)
        .forEach((rel) => {
          const childLevel = currentLevel + 1;
          const existingLevel = entityLevels.get(`tiltak-${rel.child.id}`);
          // Use max level when entity has multiple paths
          const finalLevel = existingLevel ? Math.max(existingLevel, childLevel) : childLevel;
          entityLevels.set(`tiltak-${rel.child.id}`, finalLevel);
          calculateChildLevels("tiltak", rel.child.id, finalLevel);
        });
    }
  };

  // Build levels recursively from top-level krav
  relationships.standaloneKrav.forEach((krav) => {
    calculateChildLevels("krav", krav.id, 1);
  });

  // Handle standalone tiltak (level 1)
  relationships.standaloneTiltak.forEach((tiltak) => {
    if (!entityLevels.has(`tiltak-${tiltak.id}`)) {
      entityLevels.set(`tiltak-${tiltak.id}`, 1);
      calculateChildLevels("tiltak", tiltak.id, 1);
    }
  });

  return entityLevels;
};

// Convert level to X position
const getXPositionForLevel = (level) => {
  const BASE_X = 0;
  const LEVEL_SPACING = 350;
  return BASE_X + level * LEVEL_SPACING;
};

/**
 * Transform flow-optimized data to React Flow nodes and edges
 * @param {Object} flowData - Data from ProsjektKravTiltakFlowAdapter
 * @param {Object} handlers - Event handlers (onEntitySelect, onFieldSave)
 * @param {Object} viewOptions - Current view options
 * @returns {Object} { nodes, edges } for React Flow
 */
export const transformToFlowData = (flowData, handlers = {}, viewOptions = {}) => {
  const { dto } = handlers; // Extract DTO from handlers
  const nodes = [];
  const edges = [];
  let edgeCounter = 0;

  // Handle both direct emneGroups and wrapped in items
  const emneGroups = flowData?.emneGroups || flowData?.items?.emneGroups;

  if (!emneGroups || !Array.isArray(emneGroups)) {
    return { nodes, edges };
  }

  // Spacing configuration
  const MIN_EMNE_SPACING = 200; // Reduced spacing between emne groups
  const BASE_NODE_HEIGHT = 120; // Base height for nodes without merknad
  const MERKNAD_HEIGHT = 45; // Additional height when merknad is present
  const ENTITY_SPACING = 140; // Increased spacing to accommodate merknad

  // STEP 1: Global entity collection with deduplication
  const allKravEntities = [];
  const allTiltakEntities = [];
  const processedEmneGroups = [];
  const seenKravIds = new Set();
  const seenTiltakIds = new Set();

  emneGroups.forEach((groupData, emneIndex) => {
    const emne = groupData.emne;
    const kravEntities = groupData.kravEntities || [];
    const tiltakEntities = groupData.tiltakEntities || [];

    if (!emne) return;

    // Deduplicate entities - only add if not seen before
    const uniqueKravEntities = kravEntities.filter((krav) => {
      if (seenKravIds.has(krav.id)) return false;
      seenKravIds.add(krav.id);
      return true;
    });

    const uniqueTiltakEntities = tiltakEntities.filter((tiltak) => {
      if (seenTiltakIds.has(tiltak.id)) return false;
      seenTiltakIds.add(tiltak.id);
      return true;
    });

    // Add emne reference to entities for cross-emne tracking
    uniqueKravEntities.forEach((krav) => {
      krav._sourceEmne = emne;
    });
    uniqueTiltakEntities.forEach((tiltak) => {
      tiltak._sourceEmne = emne;
    });

    allKravEntities.push(...uniqueKravEntities);
    allTiltakEntities.push(...uniqueTiltakEntities);
    processedEmneGroups.push({ emne, emneIndex, kravEntities: uniqueKravEntities, tiltakEntities: uniqueTiltakEntities });
  });

  // STEP 2: Build global relationship graph
  const globalRelationships = buildRelationshipGraph(allKravEntities, allTiltakEntities);

  // Calculate cumulative Y position for each emne group
  let currentEmneY = 0;

  // Process each emne group with global relationship awareness
  processedEmneGroups.forEach(({ emne, emneIndex, kravEntities, tiltakEntities }) => {
    // Filter global relationships relevant to this emne
    const localRelationships = {
      kravToKrav: globalRelationships.kravToKrav.filter(
        (rel) => rel.parent._sourceEmne.id === emne.id || rel.child._sourceEmne.id === emne.id
      ),
      tiltakToTiltak: globalRelationships.tiltakToTiltak.filter(
        (rel) => rel.parent._sourceEmne.id === emne.id || rel.child._sourceEmne.id === emne.id
      ),
      tiltakToKrav: globalRelationships.tiltakToKrav.filter((rel) => rel.krav._sourceEmne.id === emne.id), // Tiltak positioned in krav's emne
      standaloneKrav: kravEntities.filter((krav) => !krav.parentId),
      standaloneTiltak: tiltakEntities.filter((tiltak) => {
        const hasParent = tiltak.parentId;
        const hasKravConnection = allKravEntities.some((krav) => isTiltakConnectedToKrav(tiltak, krav));
        return !hasParent && !hasKravConnection;
      }),
    };

    // STEP 3: Calculate hierarchical levels for this emne
    const entityLevels = calculateEntityLevels(localRelationships);

    // STEP 4: Position entities using level-based positioning
    const entityPositions = new Map();
    let currentY = currentEmneY;

    // Collect all entities in this emne group
    const allLocalEntities = [
      ...localRelationships.standaloneKrav.map((e) => ({ type: "krav", entity: e })),
      ...localRelationships.kravToKrav.map((rel) => ({ type: "krav", entity: rel.parent })), // Add parent krav
      ...localRelationships.kravToKrav.map((rel) => ({ type: "krav", entity: rel.child })),
      ...localRelationships.tiltakToKrav.map((rel) => ({ type: "tiltak", entity: rel.tiltak })),
      ...localRelationships.standaloneTiltak.map((e) => ({ type: "tiltak", entity: e })),
      ...localRelationships.tiltakToTiltak.map((rel) => ({ type: "tiltak", entity: rel.parent })), // Add parent tiltak
      ...localRelationships.tiltakToTiltak.map((rel) => ({ type: "tiltak", entity: rel.child })),
    ];

    // Remove duplicates (considering both entity ID and type to avoid conflicts)
    const uniqueEntities = allLocalEntities.filter(
      (item, index, self) =>
        index === self.findIndex((other) => other.entity.id === item.entity.id && other.entity.entityType === item.entity.entityType)
    );

    // Group entities by level for better spacing
    const entitiesByLevel = new Map();
    uniqueEntities.forEach(({ type, entity }) => {
      const nodeKey = `${type}-${entity.id}`;
      const level = entityLevels.get(nodeKey) || 1;

      if (!entitiesByLevel.has(level)) {
        entitiesByLevel.set(level, []);
      }
      entitiesByLevel.get(level).push({ type, entity, nodeKey });
    });

    // Position entities level by level with dynamic spacing
    entitiesByLevel.forEach((entities, level) => {
      const xPosition = getXPositionForLevel(level);
      let cumulativeY = currentY;

      entities.forEach((item, index) => {
        const entity = item.entity;
        
        // Calculate height based on content
        const hasMerknad = !!(entity?.merknad || entity?.merknader);
        const nodeHeight = BASE_NODE_HEIGHT + (hasMerknad ? MERKNAD_HEIGHT : 0);
        
        entityPositions.set(item.nodeKey, {
          x: xPosition,
          y: cumulativeY,
          entity: item.entity,
          level: level,
          height: nodeHeight,
        });
        
        // Add spacing for next node (current node height + gap)
        cumulativeY += nodeHeight + ENTITY_SPACING - BASE_NODE_HEIGHT;
      });
      
      // Update currentY for next level if this level extends further
      const levelMaxY = Math.max(cumulativeY, currentY);
      currentY = Math.max(currentY, levelMaxY);
    });

    // Position emne node at vertical center of its entities
    const allYPositions = Array.from(entityPositions.values()).map((pos) => pos.y);
    const emneY =
      allYPositions.length > 0
        ? (Math.min(...allYPositions) + Math.max(...allYPositions)) / 2 // Center emne among entities
        : currentEmneY;

    // STEP 5: Create nodes using level-based positions
    const emneNodeId = `emne-${emne.id !== null ? emne.id : `index-${emneIndex}`}`;

    // Create Emne node (leftmost, level 0)
    nodes.push({
      id: emneNodeId,
      type: "emne",
      position: { x: getXPositionForLevel(0), y: emneY },
      data: {
        emne,
        kravCount: kravEntities.length,
        tiltakCount: tiltakEntities.length,
      },
    });

    // Create all entity nodes from position map (will add usedHandles after analysis)
    const tempNodes = [];
    entityPositions.forEach(({ x, y, entity, level, height }, nodeKey) => {
      const [entityType, id] = nodeKey.split("-");

      tempNodes.push({
        id: nodeKey,
        type: entityType === "krav" ? "prosjektkrav" : "prosjekttiltak",
        position: { x, y },
        entity,
        level,
        height,
      });
    });

    // STEP 6: Pre-analyze handle usage for all connections
    const nodeHandleUsage = new Map(); // nodeId -> { source: [handles], target: [handles] }

    // Initialize handle tracking for all nodes
    entityPositions.forEach((_, nodeKey) => {
      nodeHandleUsage.set(nodeKey, { source: [], target: [] });
    });

    // Analyze all outgoing connections to determine source handles
    const handleOptions = ["right-top", "right-middle", "right-bottom"];
    const targetHandleOptions = ["left-top", "left-middle", "left-bottom"];

    // Track connections from each source node
    const sourceConnections = new Map(); // sourceNodeId -> [connections]

    // Collect all connections first - include ALL connection types from each source

    // Emne → Standalone Krav connections
    localRelationships.standaloneKrav.forEach((krav) => {
      const sourceId = emneNodeId;
      const targetId = `krav-${krav.id}`;
      if (!sourceConnections.has(sourceId)) sourceConnections.set(sourceId, []);
      sourceConnections.get(sourceId).push({ targetId, type: "emne-krav" });
    });

    // Emne → Standalone Tiltak connections (those without parents or krav connections)
    localRelationships.standaloneTiltak.forEach((tiltak) => {
      const sourceId = emneNodeId;
      const targetId = `tiltak-${tiltak.id}`;
      if (!sourceConnections.has(sourceId)) sourceConnections.set(sourceId, []);
      sourceConnections.get(sourceId).push({ targetId, type: "emne-tiltak" });
    });

    // Krav → Krav connections (hierarchical)
    localRelationships.kravToKrav.forEach(({ parent, child }) => {
      const sourceId = `krav-${parent.id}`;
      const targetId = `krav-${child.id}`;
      if (!sourceConnections.has(sourceId)) sourceConnections.set(sourceId, []);
      sourceConnections.get(sourceId).push({ targetId, type: "krav-krav" });
    });

    // Krav → Tiltak connections
    localRelationships.tiltakToKrav.forEach(({ tiltak, krav }) => {
      const sourceId = `krav-${krav.id}`;
      const targetId = `tiltak-${tiltak.id}`;
      if (!sourceConnections.has(sourceId)) sourceConnections.set(sourceId, []);
      sourceConnections.get(sourceId).push({ targetId, type: "krav-tiltak" });
    });

    // Tiltak → Tiltak connections (hierarchical)
    localRelationships.tiltakToTiltak.forEach(({ parent, child }) => {
      const sourceId = `tiltak-${parent.id}`;
      const targetId = `tiltak-${child.id}`;
      if (!sourceConnections.has(sourceId)) sourceConnections.set(sourceId, []);
      sourceConnections.get(sourceId).push({ targetId, type: "tiltak-tiltak" });
    });

    // Assign handles based on connections - only source handles (multiple out, single in)
    sourceConnections.forEach((connections, sourceId) => {
      connections.forEach((connection, index) => {
        // Assign source handle - multiple handles per source node
        const sourceHandle = handleOptions[index % handleOptions.length];
        if (nodeHandleUsage.has(sourceId)) {
          nodeHandleUsage.get(sourceId).source.push(sourceHandle);
        }
        // No target handle assignment - targets use single default handle
      });
    });

    // Add final nodes with handle usage data
    tempNodes.forEach((node) => {
      const usedHandles = nodeHandleUsage.get(node.id) || { source: [], target: [] };

      nodes.push({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          entity: node.entity,
          dto,
          onEntitySelect: handlers.onEntitySelect,
          onFieldSave: handlers.onFieldSave,
          viewOptions,
          level: node.level,
          usedHandles,
          calculatedHeight: node.height,
        },
      });
    });

    // STEP 7: Create edges based on relationships

    // Emne → Top-level Krav edges (blue solid)
    localRelationships.standaloneKrav.forEach((krav) => {
      edges.push({
        id: `edge-${++edgeCounter}-emne-krav-${krav.id}`,
        source: emneNodeId,
        target: `krav-${krav.id}`,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        type: "smoothstep",
      });
    });

    // Emne → Tiltak edges (only for standalone tiltak - no parents and no krav connections)
    tiltakEntities.forEach((tiltak) => {
      // Only create emne edge if tiltak has no parent AND no krav connections
      const hasParent = tiltak.parentId;
      const hasKravConnection = allKravEntities.some((krav) => isTiltakConnectedToKrav(tiltak, krav));

      if (!hasParent && !hasKravConnection) {
        edges.push({
          id: `edge-${++edgeCounter}-emne-tiltak-${tiltak.id}`,
          source: emneNodeId,
          target: `tiltak-${tiltak.id}`,
          style: {
            stroke: "#f59e0b",
            strokeWidth: 2,
          },
          type: "smoothstep",
        });
      }
    });

    // Krav → Child Krav hierarchical edges (blue solid)
    localRelationships.kravToKrav.forEach(({ parent, child }) => {
      const sourceId = `krav-${parent.id}`;
      const targetId = `krav-${child.id}`;

      // Find the specific source handle for this connection
      const sourceUsage = nodeHandleUsage.get(sourceId);
      const nodeConnections = sourceConnections.get(sourceId) || [];
      const connectionIndex = nodeConnections.findIndex((conn) => conn.targetId === targetId);
      const sourceHandle = sourceUsage?.source[connectionIndex] || "right-top";

      edges.push({
        id: `edge-${++edgeCounter}-krav-krav-${parent.id}-${child.id}`,
        source: sourceId,
        target: targetId,
        sourceHandle: sourceHandle,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        type: "smoothstep",
      });
    });

    // Krav → Tiltak edges (orange solid) using pre-calculated handles
    localRelationships.tiltakToKrav.forEach(({ tiltak, krav }) => {
      const sourceId = `krav-${krav.id}`;
      const targetId = `tiltak-${tiltak.id}`;

      // Find the specific source handle for this connection
      const sourceUsage = nodeHandleUsage.get(sourceId);
      const nodeConnections = sourceConnections.get(sourceId) || [];
      const connectionIndex = nodeConnections.findIndex((conn) => conn.targetId === targetId);
      const sourceHandle = sourceUsage?.source[connectionIndex] || "right-top";

      edges.push({
        id: `edge-${++edgeCounter}-krav-tiltak-${krav.id}-${tiltak.id}`,
        source: sourceId,
        target: targetId,
        sourceHandle: sourceHandle,
        style: { stroke: "#f59e0b", strokeWidth: 2 },
        type: "smoothstep",
      });
    });

    // Tiltak → Child Tiltak hierarchical edges (orange solid)
    localRelationships.tiltakToTiltak.forEach(({ parent, child }) => {
      const sourceId = `tiltak-${parent.id}`;
      const targetId = `tiltak-${child.id}`;

      // Find the specific source handle for this connection
      const sourceUsage = nodeHandleUsage.get(sourceId);
      const nodeConnections = sourceConnections.get(sourceId) || [];
      const connectionIndex = nodeConnections.findIndex((conn) => conn.targetId === targetId);
      const sourceHandle = sourceUsage?.source[connectionIndex] || "right-top";

      edges.push({
        id: `edge-${++edgeCounter}-tiltak-tiltak-${parent.id}-${child.id}`,
        source: sourceId,
        target: targetId,
        sourceHandle: sourceHandle,
        style: { stroke: "#f59e0b", strokeWidth: 2 },
        type: "smoothstep",
      });
    });

    // Handle cross-emne relationships (tiltak in different emne than krav)
    globalRelationships.tiltakToKrav
      .filter((rel) => rel.tiltak._sourceEmne.id !== rel.krav._sourceEmne.id && rel.krav._sourceEmne.id === emne.id)
      .forEach(({ tiltak, krav }) => {
        // Create a visual indicator for cross-emne connection
        edges.push({
          id: `edge-${++edgeCounter}-cross-emne-krav-tiltak-${krav.id}-${tiltak.id}`,
          source: `krav-${krav.id}`,
          target: `tiltak-${tiltak.id}`,
          style: { stroke: "#f59e0b", strokeWidth: 2 },
          type: "smoothstep",
        });
      });

    // Calculate Y position for next emne group
    // Find the maximum Y position used in this emne group and add minimum spacing
    const maxY = allYPositions.length > 0 ? Math.max(...allYPositions) : currentEmneY;
    currentEmneY = maxY + MIN_EMNE_SPACING;
  });

  return { nodes, edges };
};

/**
 * Get node types configuration for React Flow
 */
export const getNodeTypes = () => {
  return {
    emne: EmneFlowNode,
    prosjektkrav: KravFlowNode,
    prosjekttiltak: TiltakFlowNode,
  };
};

/**
 * Default React Flow settings
 */
export const getDefaultFlowSettings = () => ({
  nodesDraggable: true,
  nodesConnectable: false,
  elementsSelectable: true,
  fitView: true,
  fitViewOptions: { padding: 0.2 },
  defaultViewport: { x: 0, y: 0, zoom: 0.8 },
  minZoom: 0.2,
  maxZoom: 2,
});
