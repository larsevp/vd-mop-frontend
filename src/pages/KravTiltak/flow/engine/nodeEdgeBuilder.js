/**
 * Simplified Node and Edge Builder
 * Creates React Flow nodes/edges directly from Dagre positions
 */

/**
 * Create React Flow nodes from Dagre positions - with proper handles
 */
export function createNodes(dagrePositions, globalRelationships, config, nodeDataOptions = {}) {
  const nodes = [];

  // Create entity nodes directly from Dagre positions
  dagrePositions.forEach((position, nodeKey) => {
    const entity = position.entity;
    if (!entity) {
      // Handle emne nodes (network nodes, not just headers)
      if (position.emne) {
        nodes.push({
          id: nodeKey,
          type: 'emne',
          position: { x: position.x - 125, y: position.y - 30 }, // Center the emne node
          data: { 
            emne: position.emne,
            label: position.emne.tittel || position.emne.navn || 'Emne'
          },
          draggable: true,  // Make emne draggable
          selectable: true  // Make emne selectable
        });
      }
      return;
    }

    // Determine node type based on entity type
    const entityTypeLower = entity.entityType?.toLowerCase() || '';
    let nodeType;
    
    if (entityTypeLower.includes('krav')) {
      nodeType = 'prosjektkrav';  // Maps to KravFlowNode
    } else if (entityTypeLower.includes('tiltak')) {
      nodeType = 'prosjekttiltak';  // Maps to TiltakFlowNode
    } else {
      nodeType = 'default';
    }

    // Create React Flow node with proper handles
    nodes.push({
      id: nodeKey,
      type: nodeType,
      position: { x: position.x - 160, y: position.y - 70 }, // Center the node
      data: { 
        entity: entity,
        label: entity.kravUID || entity.tiltakUID || entity.tittel || 'Untitled',
        ...nodeDataOptions
      },
      draggable: true,
      selectable: true,
      // Add source and target handles for connections
      sourcePosition: 'right',
      targetPosition: 'left'
    });
  });

  console.log(`[LOGBACKEND] Created ${nodes.length} React Flow nodes`);
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
  [...allKravEntities, ...allTiltakEntities].forEach(entity => {
    if (entity._sourceEmne) {
      const entityKey = entity.entityType?.toLowerCase().includes('krav') ? 
        `krav-${entity.id}` : `tiltak-${entity.id}`;
      
      if (!allParentedEntities.has(entityKey)) {
        const emneKey = `emne-${entity._sourceEmne.id}`;
        
        if (positions.has(emneKey) && positions.has(entityKey)) {
          edges.push({
            id: `${emneKey}-${entityKey}`,
            source: emneKey,
            target: entityKey,
            type: 'default',
            style: { 
              stroke: '#94a3b8', 
              strokeWidth: 1,
              strokeDasharray: '2,2'
            },
            animated: false
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
      type: 'hierarchy'
    })),
    // Parent-child tiltak relationships  
    ...globalRelationships.tiltakToTiltak.map(({ parent, child }) => ({
      source: `tiltak-${parent.id}`,
      target: `tiltak-${child.id}`,
      type: 'hierarchy'
    })),
    // Business relationships (krav → tiltak)
    ...globalRelationships.tiltakToKrav.map(({ krav, tiltak }) => ({
      source: `krav-${krav.id}`,
      target: `tiltak-${tiltak.id}`,
      type: 'business'
    }))
  ];

  // Create edges with unified styling
  allRelationships.forEach(({ source, target, type }) => {
    if (positions.has(source) && positions.has(target)) {
      edges.push({
        id: `${source}-${target}`,
        source: source,
        target: target,
        type: 'default',
        style: { 
          stroke: '#6b7280', 
          strokeWidth: 2 
        },
        animated: false
      });
    }
  });

  console.log(`[LOGBACKEND] Created ${edges.length} React Flow edges (including emne connections)`);
  return edges;
}