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
  const g = new dagre.graphlib.Graph({ compound: true });

  // Keep compound graph configuration - it works for spacing
  g.setGraph({
    rankdir: "LR",
    nodesep: Math.max(15, (config.verticalWithinEmne || 100) * 0.2), // Vertical separation within emne from config
    ranksep: config.horizontalBetweenColumns || 120, // horizontal separation (LR mode)
    edgesep: 10,
    marginx: 20,
    marginy: 100, // Standard margins
  });

  g.setDefaultEdgeLabel(() => ({}));

  // First, collect all unique emne from entities in order of appearance
  const emneSet = new Map();
  const emneOrder = []; // Track the order emne first appear
  [...allKravEntities, ...allTiltakEntities].forEach((entity) => {
    if (entity._sourceEmne && !emneSet.has(entity._sourceEmne.id)) {
      emneSet.set(entity._sourceEmne.id, entity._sourceEmne);
      emneOrder.push(entity._sourceEmne.id);
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

    // Calculate height using the helper function for consistency
    const estimatedHeight = calculateEntityHeight(entity, viewOptions);

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
      gap: config.verticalBetweenEmne || config.MIN_EMNE_SPACING || 120, // More compact gap between emne groups
      minHeight: config.minClusterHeight || 240, // Increased minimum height
      emneOrder: emneOrder, // Pass the original order
    });
  }

  if (config.enableMultiParentAdjust) {
    try {
      applyMultiParentPositioning(dagrePositions, globalRelationships);
    } catch (e) {}
  }

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
        // Use dynamic spacing based on actual card height + buffer
        const cardHeight = position.height || 120;
        entityY += cardHeight + 40; // Card height + 40px buffer between cards
      });

    // Move to next emne group - calculate actual height based on positioned entities
    const actualGroupHeight = entityY - currentY; // Total height used by this group
    const groupHeight = Math.max(200, actualGroupHeight);
    currentY += groupHeight + (config.MIN_EMNE_SPACING || 240);
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
    }
  });
}

/**
 * Calculate realistic height needed for an entity based on its content
 */
function calculateEntityHeight(entity, viewOptions = {}) {
  let height = 120; // Base height
  
  const hasMerknad = entity.merknad || entity.merknader;
  if (hasMerknad && viewOptions.showMerknad !== false) {
    height += 50;
  }
  
  if (entity.beskrivelseSnippet) {
    height += 30;
  }
  
  return height;
}

/**
 * spreadEmneClusters
 * KISS post-processing: keep Dagre X & intra-cluster relative Y; shift clusters to inject fixed vertical gaps.
 * Works for any number of emne. O(N) over nodes.
 */
function spreadEmneClusters(dagrePositions, { gap = 240, minHeight = 220, emneOrder = [] }) {
  // Group nodes by emneId (entity._sourceEmne.id or emne.id for header nodes)
  const groups = new Map();
  dagrePositions.forEach((pos, key) => {
    // Skip cluster nodes - they are invisible layout helpers, not displayable content
    if (key.startsWith('cluster-')) return;
    
    const emneId = pos.entity?._sourceEmne?.id || pos.emne?.id;
    // Include nodes even if emneId is null/undefined - they belong to "Ingen emne" group
    const groupKey = emneId || 'null';
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { nodes: [], minY: Infinity, maxY: -Infinity });
    }
    const g = groups.get(groupKey);
    g.nodes.push(key);
    const top = pos.y - pos.height / 2;
    const bottom = pos.y + pos.height / 2;
    if (top < g.minY) g.minY = top;
    if (bottom > g.maxY) g.maxY = bottom;
  });

  if (groups.size === 0) return; // Nothing to do

  // Debug logs removed - spacing is now working correctly
  
  // Order clusters by original emne order (preserving data sequence), but ensure "Ingen emne" is always last
  const ordered = [...groups.entries()]
    .map(([emneId, data]) => ({ emneId, ...data }))
    .sort((a, b) => {
      // Get emne names for special handling - try multiple ways to find the name
      let aName = '';
      let bName = '';
      
      // Try to get emne from the emne node
      const aEmneNode = dagrePositions.get(`emne-${a.emneId}`);
      const bEmneNode = dagrePositions.get(`emne-${b.emneId}`);
      
      if (aEmneNode?.emne) {
        aName = aEmneNode.emne.navn || aEmneNode.emne.name || '';
      }
      if (bEmneNode?.emne) {
        bName = bEmneNode.emne.navn || bEmneNode.emne.name || '';
      }
      
      // If still no name, try to get from entity nodes in the group
      if (!aName) {
        for (const nodeKey of a.nodes) {
          const pos = dagrePositions.get(nodeKey);
          if (pos?.entity?._sourceEmne) {
            aName = pos.entity._sourceEmne.navn || pos.entity._sourceEmne.name || '';
            break;
          }
        }
      }
      
      if (!bName) {
        for (const nodeKey of b.nodes) {
          const pos = dagrePositions.get(nodeKey);
          if (pos?.entity?._sourceEmne) {
            bName = pos.entity._sourceEmne.navn || pos.entity._sourceEmne.name || '';
            break;
          }
        }
      }
      
      // Handle special case for "null" emneId groups
      if (a.emneId === 'null' || a.emneId === null) aName = 'Ingen emne';
      if (b.emneId === 'null' || b.emneId === null) bName = 'Ingen emne';
      
      
      // Handle null/undefined emneId as "Ingen emne"
      const aIsIngenEmne = (!a.emneId || a.emneId === 'null' || aName === 'Ingen emne');
      const bIsIngenEmne = (!b.emneId || b.emneId === 'null' || bName === 'Ingen emne');
      
      // Always put "Ingen emne" last
      if (aIsIngenEmne && !bIsIngenEmne) return 1;
      if (bIsIngenEmne && !aIsIngenEmne) return -1;
      if (aIsIngenEmne && bIsIngenEmne) return 0;
      
      // For other emne, use original order
      const aIndex = emneOrder.indexOf(a.emneId);
      const bIndex = emneOrder.indexOf(b.emneId);
      
      // If both are in emneOrder, sort by their order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // Fallback to minY sorting for any missing emne
      return a.minY - b.minY;
    });

  // Apply uniform spacing from the top
  let currentY = 0;
  
  ordered.forEach((group, index) => {
    // Calculate the shift needed to position this group at currentY
    const originalMinY = group.minY;
    const targetMinY = currentY;
    const shift = targetMinY - originalMinY;
    
    // Apply the shift to all nodes in this group and recalculate actual bounds
    let newMinY = Infinity;
    let newMaxY = -Infinity;
    
    group.nodes.forEach((nodeKey) => {
      const p = dagrePositions.get(nodeKey);
      if (!p) return;
      
      // Shift the node
      const newY = p.y + shift;
      dagrePositions.set(nodeKey, { ...p, y: newY });
      
      // Calculate new bounds based on shifted positions - but exclude cluster nodes from bounds
      if (!nodeKey.startsWith('cluster-')) {
        const top = newY - p.height / 2;
        const bottom = newY + p.height / 2;
        newMinY = Math.min(newMinY, top);
        newMaxY = Math.max(newMaxY, bottom);
      }
    });
    
    // Update group bounds with actual calculated values
    group.minY = newMinY;
    group.maxY = newMaxY;
    
    // Move currentY to start of next group
    const actualGroupHeight = group.maxY - group.minY;
    currentY = group.maxY + gap;
    
    // Debug logging for group heights - focus on "Ingen emne"
    const enableDebugLogs = false; // Set to true to enable debug logging
    if (enableDebugLogs) {
      const emneName = group.emneId === 'null' || group.emneId === null ? 'Ingen emne' : `Emne ${group.emneId}`;
      const visibleNodes = group.nodes.filter(key => !key.startsWith('cluster-'));
      const clusterNodes = group.nodes.filter(key => key.startsWith('cluster-'));
      
      if (emneName === 'Ingen emne' || index < 3) { // Log Ingen emne always, and first few groups
        console.log(`[LOGBACKEND] SPACING-DEBUG: ${emneName} - Height: ${actualGroupHeight.toFixed(1)}px`);
        console.log(`[LOGBACKEND] SPACING-DEBUG: ${emneName} - Visible nodes: ${visibleNodes.length}, Cluster nodes: ${clusterNodes.length}`);
        console.log(`[LOGBACKEND] SPACING-DEBUG: ${emneName} - Bounds: minY=${group.minY.toFixed(1)}, maxY=${group.maxY.toFixed(1)}`);
        
        if (emneName === 'Ingen emne') {
          console.log(`[LOGBACKEND] SPACING-DEBUG: ${emneName} - All nodes:`, group.nodes);
          console.log(`[LOGBACKEND] SPACING-DEBUG: ${emneName} - Visible nodes:`, visibleNodes);
          console.log(`[LOGBACKEND] SPACING-DEBUG: ${emneName} - Cluster nodes:`, clusterNodes);
        }
      }
    }
    
  });
}
