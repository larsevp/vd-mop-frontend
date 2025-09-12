/**
 * Simplified Node and Edge Builder
 * Creates React Flow nodes/edges directly from Dagre positions
 */

/**
 * Create React Flow nodes from Dagre positions - with proper handles
 */
export function createNodes(
  dagrePositions,
  globalRelationships,
  config,
  nodeDataOptions = {},
  allKravEntities = [],
  allTiltakEntities = []
) {
  const nodes = [];

  // Build incoming/outgoing maps to decide which nodes actually need handles.
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
  // Business (krav -> tiltak)
  globalRelationships.tiltakToKrav.forEach(({ krav, tiltak }) => {
    outgoing.add(`krav-${krav.id}`);
    incoming.add(`tiltak-${tiltak.id}`);
  });

  // Orphan (emne -> entity) edges: replicate logic from edge builder so orphans still keep handles
  const parented = new Set();
  globalRelationships.kravToKrav.forEach(({ child }) => parented.add(`krav-${child.id}`));
  globalRelationships.tiltakToTiltak.forEach(({ child }) => parented.add(`tiltak-${child.id}`));
  globalRelationships.tiltakToKrav.forEach(({ tiltak }) => parented.add(`tiltak-${tiltak.id}`));

  [...allKravEntities, ...allTiltakEntities].forEach((entity) => {
    if (!entity._sourceEmne) return;
    const key = entity.entityType?.toLowerCase().includes("krav") ? `krav-${entity.id}` : `tiltak-${entity.id}`;
    if (!parented.has(key)) {
      // emne -> entity
      incoming.add(key); // entity has an incoming from emne
      outgoing.add(`emne-${entity._sourceEmne.id}`);
    }
  });

  // Create nodes from dagre positions
  dagrePositions.forEach((position, nodeKey) => {
    const entity = position.entity;
    if (!entity) {
      if (position.emne) {
        const hasOut = outgoing.has(nodeKey);
        // Emne node
        nodes.push({
          id: nodeKey,
          type: "emne",
          position: { x: position.x - 125, y: position.y - 30 },
          data: {
            emne: position.emne,
            label: position.emne.tittel || position.emne.navn || "Emne",
          },
          draggable: true,
          selectable: true,
          ...(hasOut ? { sourcePosition: "right" } : {}),
        });
      }
      return;
    }

    // Determine node type
    const entityTypeLower = entity.entityType?.toLowerCase() || "";
    let nodeType = "default";
    if (entityTypeLower.includes("krav")) nodeType = "prosjektkrav";
    else if (entityTypeLower.includes("tiltak")) nodeType = "prosjekttiltak";

    const hasIn = incoming.has(nodeKey);
    const hasOut = outgoing.has(nodeKey);

    const baseNode = {
      id: nodeKey,
      type: nodeType,
      position: { x: position.x - 160, y: position.y - 70 },
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

    if (hasOut) baseNode.sourcePosition = "right";
    if (hasIn) baseNode.targetPosition = "left";

    nodes.push(baseNode);
  });

  console.log(`[LOGBACKEND] Created ${nodes.length} React Flow nodes (conditional handles)`);
  return nodes;
}

/**
 * Create React Flow edges from relationships - unified approach
 */
export function createEdges(globalRelationships, positions, allKravEntities, allTiltakEntities) {
  const edges = [];

  // Emne to ROOT entity edges only (entities with NO parents of any kind)
  // Use relationship data to find truly orphaned entities
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

  // Connect emne only to entities that have NO parents (hierarchical OR business)
  [...allKravEntities, ...allTiltakEntities].forEach((entity) => {
    if (entity._sourceEmne) {
      const entityKey = entity.entityType?.toLowerCase().includes("krav") ? `krav-${entity.id}` : `tiltak-${entity.id}`;

      if (!allParentedEntities.has(entityKey)) {
        const emneKey = `emne-${entity._sourceEmne.id}`;

        if (positions.has(emneKey) && positions.has(entityKey)) {
          edges.push({
            id: `${emneKey}-${entityKey}`,
            source: emneKey,
            target: entityKey,
            type: "default",
            style: { stroke: "#6b7280", strokeWidth: 2 },
            animated: false,
          });
        }
      }
    }
  });

  // All other relationships
  const allRelationships = [
    // Parent-child krav relationships
    ...globalRelationships.kravToKrav.map(({ parent, child }) => ({
      source: `krav-${parent.id}`,
      target: `krav-${child.id}`,
      type: "hierarchy",
    })),
    // Parent-child tiltak relationships
    ...globalRelationships.tiltakToTiltak.map(({ parent, child }) => ({
      source: `tiltak-${parent.id}`,
      target: `tiltak-${child.id}`,
      type: "hierarchy",
    })),
    // Business relationships (krav → tiltak)
    ...globalRelationships.tiltakToKrav.map(({ krav, tiltak }) => ({
      source: `krav-${krav.id}`,
      target: `tiltak-${tiltak.id}`,
      type: "business",
    })),
  ];

  // Create edges with unified styling
  allRelationships.forEach(({ source, target, type }) => {
    if (positions.has(source) && positions.has(target)) {
      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        type: "default",
        style: { stroke: "#6b7280", strokeWidth: 2 },
        animated: false,
      });
    }
  });

  console.log(`[LOGBACKEND] Created ${edges.length} React Flow edges (including emne connections)`);
  return edges;
}
