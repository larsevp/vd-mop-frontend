/**
 * Vertical Layout Node and Edge Builder
 * Creates React Flow nodes/edges for vertical columnar layout
 */

/**
 * Create React Flow nodes from columnar positions
 */
export function createVerticalNodes(
  columnarPositions,
  globalRelationships,
  config,
  nodeDataOptions = {},
  allKravEntities = [],
  allTiltakEntities = []
) {
  const nodes = [];

  // Build incoming/outgoing maps for handles
  const incoming = new Set();
  const outgoing = new Set();

  // Hierarchical krav
  globalRelationships.kravToKrav.forEach(({ parent, child }) => {
    outgoing.add(`krav-${parent.id}`);
    incoming.add(`krav-${child.id}`);
  });

  // Hierarchical tiltak
  globalRelationships.tiltakToTiltak.forEach(({ parent, child }) => {
    outgoing.add(`tiltak-${parent.id}`);
    incoming.add(`tiltak-${child.id}`);
  });

  // Business relationships (krav -> tiltak)
  globalRelationships.tiltakToKrav.forEach(({ krav, tiltak }) => {
    outgoing.add(`krav-${krav.id}`);
    incoming.add(`tiltak-${tiltak.id}`);
  });

  // Don't track emne -> entity connections (we don't show those)

  // Create nodes from columnar positions
  columnarPositions.forEach((position, nodeKey) => {
    const entity = position.entity;

    if (!entity) {
      if (position.emne) {
        // Emne node - centered at top of column (no handles)
        nodes.push({
          id: nodeKey,
          type: "emneNode",
          position: {
            x: position.x - (position.width || 160) / 2,
            y: position.y - (position.height || 32.5) / 2
          },
          data: {
            emne: position.emne,
            label: position.emne.tittel || position.emne.navn || "Emne",
          },
          draggable: true,
          selectable: true,
        });
      }
      return;
    }

    // Determine node type
    const entityTypeLower = entity.entityType?.toLowerCase() || "";
    let nodeType = "kravNode";
    if (entityTypeLower.includes("tiltak")) nodeType = "tiltakNode";

    const hasIn = incoming.has(nodeKey);
    const hasOut = outgoing.has(nodeKey);

    const baseNode = {
      id: nodeKey,
      type: nodeType,
      position: {
        x: position.x - (position.width || 160) / 2,
        y: position.y - (position.height || 70) / 2
      },
      data: {
        entity,
        label: entity.kravUID || entity.tiltakUID || entity.tittel || "Untitled",
        hasIncoming: hasIn,
        hasOutgoing: hasOut,
        ...nodeDataOptions,
      },
      draggable: true,
      selectable: true,
    };

    // Set handle positions for vertical flow (both on left middle edge)
    if (hasIn) baseNode.targetPosition = "left";
    if (hasOut) baseNode.sourcePosition = "left";

    nodes.push(baseNode);
  });

  return nodes;
}

/**
 * Create React Flow edges from relationships
 */
export function createVerticalEdges(globalRelationships, columnarPositions, allKravEntities, allTiltakEntities) {
  const edges = [];
  let edgeId = 0;

  // Dashed edges for all relationships (smaller arrows)
  const edgeStyle = { stroke: "#64748b", strokeWidth: 2, strokeDasharray: "5,5" };

  // Hierarchical krav edges (parent -> child krav) - dashed
  globalRelationships.kravToKrav.forEach(({ parent, child }) => {
    edges.push({
      id: `edge-krav-${edgeId++}`,
      source: `krav-${parent.id}`,
      target: `krav-${child.id}`,
      type: "smoothstep",
      style: edgeStyle,
      animated: false,
      markerEnd: {
        type: "arrowclosed",
        color: "#64748b",
        width: 12,
        height: 12,
      },
      sourceHandle: null,
      targetHandle: null,
    });
  });

  // Hierarchical tiltak edges (parent -> child tiltak) - dashed
  globalRelationships.tiltakToTiltak.forEach(({ parent, child }) => {
    edges.push({
      id: `edge-tiltak-${edgeId++}`,
      source: `tiltak-${parent.id}`,
      target: `tiltak-${child.id}`,
      type: "smoothstep",
      style: edgeStyle,
      animated: false,
      markerEnd: {
        type: "arrowclosed",
        color: "#64748b",
        width: 12,
        height: 12,
      },
      sourceHandle: null,
      targetHandle: null,
    });
  });

  // Business relationship edges (krav -> tiltak) - dashed with smaller arrows
  globalRelationships.tiltakToKrav.forEach(({ krav, tiltak }) => {
    edges.push({
      id: `edge-business-${edgeId++}`,
      source: `krav-${krav.id}`,
      target: `tiltak-${tiltak.id}`,
      type: "smoothstep",
      style: edgeStyle,
      animated: false,
      markerEnd: {
        type: "arrowclosed",
        color: "#64748b",
        width: 12,
        height: 12,
      },
      sourceHandle: null,
      targetHandle: null,
    });
  });

  // Don't draw emne -> root entity edges (user doesn't want these)
  // Only show actual parent-child and business relationships

  return edges;
}
