/**
 * Simplified Layout Engine - Industry Standard Dagre Approach
 * Let Dagre do the work with proper configuration
 */
import dagre from "dagre";

/**
 * Balanced layout calculation - Dagre + Essential Emne Grouping
 * Keep the important features but simplify the approach
 */
export function calculateLayout(allKravEntities, allTiltakEntities, globalRelationships, globalConnections, config, viewOptions = {}) {
  console.log("[LOGBACKEND] DAGRE: Starting balanced layout calculation");

  const g = new dagre.graphlib.Graph({ compound: true });

  // Keep compound graph configuration - it works for spacing
  g.setGraph({
    rankdir: "LR",
    nodesep: Math.max(20, (config.verticalWithinEmne || 140) * 0.25), // local vertical separation heuristic
    ranksep: config.horizontalBetweenColumns || 120, // horizontal separation (LR mode)
    edgesep: 10,
    marginx: 20,
    marginy: 120,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // First, collect all unique emne from entities
  const emneSet = new Map();
  [...allKravEntities, ...allTiltakEntities].forEach((entity) => {
    if (entity._sourceEmne) {
      emneSet.set(entity._sourceEmne.id, entity._sourceEmne);
    }
  });

  // Create invisible cluster containers for grouping with minimum height for spacing
  emneSet.forEach((emne, emneId) => {
    g.setNode(`cluster-${emneId}`, {
      label: "",
      style: "fill: none; stroke: none",
      width: 0,
      height: 0,
    });
  });

  // Add visible emne nodes as root nodes (positioned left)
  emneSet.forEach((emne, emneId) => {
    g.setNode(`emne-${emneId}`, {
      width: 220,
      height: 65,
      emne: emne,
    });
  });

  // Add all entities and set their parent to invisible cluster for grouping
  [...allKravEntities, ...allTiltakEntities].forEach((entity) => {
    const nodeKey = entity.entityType?.toLowerCase().includes("krav") ? `krav-${entity.id}` : `tiltak-${entity.id}`;

    // Calculate height: base 100px + 20% for merknad + 20% for description
    let estimatedHeight = 100; // Base: 100px

    // Add 20% if merknad is visible and present
    const hasMerknad = entity.merknad || entity.merknader;
    if (hasMerknad && viewOptions.showMerknad !== false) {
      estimatedHeight += Math.round(estimatedHeight * 0.2); // +20%
    }

    // Add 20% if description snippet is present
    if (entity.beskrivelseSnippet) {
      estimatedHeight += Math.round(estimatedHeight * 0.2); // +20%
    }

    g.setNode(nodeKey, {
      width: 320,
      height: estimatedHeight,
      entity: entity,
    });

    // Set parent to invisible cluster for proper grouping
    if (entity._sourceEmne) {
      g.setParent(nodeKey, `cluster-${entity._sourceEmne.id}`);
    }
  });

  // Connect visible emne root nodes to their root entities
  const allParentedEntities = new Set();

  // Mark entities that have hierarchical parents
  globalRelationships.kravToKrav.forEach(({ child }) => {
    allParentedEntities.add(`krav-${child.id}`);
  });
  globalRelationships.tiltakToTiltak.forEach(({ child }) => {
    allParentedEntities.add(`tiltak-${child.id}`);
  });

  // Mark tiltak that have business parents (connected to krav)
  globalRelationships.tiltakToKrav.forEach(({ tiltak }) => {
    allParentedEntities.add(`tiltak-${tiltak.id}`);
  });

  // Connect emne root nodes to orphaned entities only
  [...allKravEntities, ...allTiltakEntities].forEach((entity) => {
    if (entity._sourceEmne) {
      const entityKey = entity.entityType?.toLowerCase().includes("krav") ? `krav-${entity.id}` : `tiltak-${entity.id}`;

      if (!allParentedEntities.has(entityKey)) {
        const emneKey = `emne-${entity._sourceEmne.id}`;
        g.setEdge(emneKey, entityKey);
      }
    }
  });

  // Add relationship edges
  globalRelationships.kravToKrav.forEach(({ parent, child }) => {
    g.setEdge(`krav-${parent.id}`, `krav-${child.id}`);
  });

  globalRelationships.tiltakToTiltak.forEach(({ parent, child }) => {
    g.setEdge(`tiltak-${parent.id}`, `tiltak-${child.id}`);
  });

  globalRelationships.tiltakToKrav.forEach(({ krav, tiltak }) => {
    g.setEdge(`krav-${krav.id}`, `tiltak-${tiltak.id}`);
  });

  // Let Dagre do the layout
  console.log(`[LOGBACKEND] DAGRE: Graph has ${g.nodes().length} nodes and ${g.edges().length} edges`);
  dagre.layout(g);

  // Extract Dagre positions
  const dagrePositions = new Map();
  g.nodes().forEach((nodeKey) => {
    const node = g.node(nodeKey);
    dagrePositions.set(nodeKey, {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      entity: node.entity,
      emne: node.emne, // Preserve emne data
    });
  });

  // Optional deterministic cluster spreading (post-processing) for vertical clarity with many emne
  if (config.enableClusterSpread !== false) {
    spreadEmneClusters(dagrePositions, {
      gap: config.verticalBetweenEmne || config.MIN_EMNE_SPACING || 240,
      minHeight: config.minClusterHeight || 220,
    });
  }

  if (config.enableMultiParentAdjust) {
    try {
      applyMultiParentPositioning(dagrePositions, globalRelationships);
    } catch (e) {
      console.warn("[LOGBACKEND] Multi-parent adjustment failed:", e);
    }
  }

  console.log(
    `[LOGBACKEND] DAGRE: Layout complete - positioned ${dagrePositions.size} elements (cluster spread: ${
      config.enableClusterSpread !== false
    })`
  );
  return dagrePositions;
}

/**
 * Apply emne grouping - preserve Dagre X positions, organize Y positions by emne
 */
function applyEmneGrouping(dagrePositions, config) {
  const positions = new Map();
  const emneGroups = new Map();

  // Group entities by emne (skip emne nodes themselves)
  dagrePositions.forEach((position, nodeKey) => {
    if (position.entity && position.entity._sourceEmne) {
      const emneId = position.entity._sourceEmne.id;
      if (!emneGroups.has(emneId)) {
        emneGroups.set(emneId, {
          emne: position.entity._sourceEmne,
          entities: [],
          emneNode: null,
        });
      }
      emneGroups.get(emneId).entities.push({ nodeKey, position });
    } else if (position.emne) {
      // This is an emne node
      const emneId = position.emne.id;
      if (!emneGroups.has(emneId)) {
        emneGroups.set(emneId, {
          emne: position.emne,
          entities: [],
          emneNode: null,
        });
      }
      emneGroups.get(emneId).emneNode = { nodeKey, position };
    }
  });

  // Position emne groups with proper spacing
  let currentY = 0;
  emneGroups.forEach((group, emneId) => {
    // Position emne node
    if (group.emneNode) {
      positions.set(group.emneNode.nodeKey, {
        ...group.emneNode.position,
        y: currentY + 30, // Keep Dagre X, set organized Y
      });
    }

    // Position entities in this emne group with compact spacing
    let entityY = currentY + 100; // Start below emne
    group.entities
      .sort((a, b) => a.position.x - b.position.x) // Sort by Dagre X to maintain hierarchy
      .forEach(({ nodeKey, position }) => {
        positions.set(nodeKey, {
          ...position, // Keep Dagre X position
          y: entityY, // Organized Y position
        });
        entityY += 140; // Proper spacing for 120px nodes
      });

    // Move to next emne group
    const groupHeight = Math.max(200, group.entities.length * 140 + 80);
    currentY += groupHeight + config.MIN_EMNE_SPACING;
  });

  return positions;
}

/**
 * Apply multi-parent positioning - handles entities with multiple parent relationships
 */
function applyMultiParentPositioning(positions, globalRelationships) {
  const { multiParentEntities, tiltakToKrav, kravToKrav, tiltakToTiltak } = globalRelationships;

  multiParentEntities.forEach((entityKey) => {
    const currentPos = positions.get(entityKey);
    if (!currentPos) return;

    // Find all parent positions for this entity
    const parentPositions = [];

    // Check hierarchical parents
    const isKrav = entityKey.startsWith("krav-");
    const isTiltak = entityKey.startsWith("tiltak-");

    if (isKrav) {
      // Find hierarchical parent
      const hierarchicalParent = kravToKrav.find(({ child }) => `krav-${child.id}` === entityKey);
      if (hierarchicalParent) {
        const parentPos = positions.get(`krav-${hierarchicalParent.parent.id}`);
        if (parentPos) parentPositions.push(parentPos);
      }
    } else if (isTiltak) {
      // Find hierarchical parent
      const hierarchicalParent = tiltakToTiltak.find(({ child }) => `tiltak-${child.id}` === entityKey);
      if (hierarchicalParent) {
        const parentPos = positions.get(`tiltak-${hierarchicalParent.parent.id}`);
        if (parentPos) parentPositions.push(parentPos);
      }

      // Find business parent krav
      const businessParents = tiltakToKrav.filter(({ tiltak }) => `tiltak-${tiltak.id}` === entityKey);
      businessParents.forEach(({ krav }) => {
        const kravPos = positions.get(`krav-${krav.id}`);
        if (kravPos) parentPositions.push(kravPos);
      });
    }

    // Position entity optimally relative to all parents
    if (parentPositions.length > 1) {
      const yPositions = parentPositions.map((pos) => pos.y);
      const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;

      positions.set(entityKey, { ...currentPos, y: avgY });
      console.log(`[LOGBACKEND] Multi-parent positioning for ${entityKey}: y=${avgY} (${parentPositions.length} parents)`);
    }
  });
}

/**
 * spreadEmneClusters
 * KISS post-processing: keep Dagre X & intra-cluster relative Y; shift clusters to inject fixed vertical gaps.
 * Works for any number of emne. O(N) over nodes.
 */
function spreadEmneClusters(dagrePositions, { gap = 240, minHeight = 220 }) {
  // Group nodes by emneId (entity._sourceEmne.id or emne.id for header nodes)
  const groups = new Map();
  dagrePositions.forEach((pos, key) => {
    const emneId = pos.entity?._sourceEmne?.id || pos.emne?.id;
    if (!emneId) return; // Skip non-emne / ungrouped nodes
    if (!groups.has(emneId)) {
      groups.set(emneId, { nodes: [], minY: Infinity, maxY: -Infinity });
    }
    const g = groups.get(emneId);
    g.nodes.push(key);
    const top = pos.y - pos.height / 2;
    const bottom = pos.y + pos.height / 2;
    if (top < g.minY) g.minY = top;
    if (bottom > g.maxY) g.maxY = bottom;
  });

  if (groups.size === 0) return; // Nothing to do

  // Order clusters by their top (minY)
  const ordered = [...groups.entries()].map(([emneId, data]) => ({ emneId, ...data })).sort((a, b) => a.minY - b.minY);

  let cursor = ordered.length ? ordered[0].minY : 0; // Start from first top for stable shift
  ordered.forEach((group) => {
    const rawHeight = group.maxY - group.minY;
    const height = Math.max(rawHeight, minHeight);
    // Ensure current group top aligns with cursor
    const shift = cursor - group.minY;
    if (Math.abs(shift) > 0.5) {
      group.nodes.forEach((nodeKey) => {
        const p = dagrePositions.get(nodeKey);
        if (!p) return;
        dagrePositions.set(nodeKey, { ...p, y: p.y + shift });
      });
    }
    cursor += height + gap;
  });
}
