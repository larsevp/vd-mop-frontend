/**
 * Connection Calculator Module
 * Pre-calculates all entity connections globally
 */

/**
 * Pre-calculate all connections for all entities globally
 * This prevents duplicate processing and enables cross-emne lookups
 */
export function preCalculateAllConnections(allKravEntities, allTiltakEntities, globalRelationships) {
  const entityConnections = new Map();
  const allEntities = [
    ...allKravEntities.map((entity) => ({ type: "krav", entity })),
    ...allTiltakEntities.map((entity) => ({ type: "tiltak", entity })),
  ];

  allEntities.forEach(({ type, entity }) => {
    const nodeKey = `${type}-${entity.id}`;
    const connections = {
      hierarchicalParents: [],
      businessConnections: [],
    };

    // Find hierarchical parent connections
    const parentRelation =
      globalRelationships.kravToKrav.find((rel) => rel.child.id === entity.id) ||
      globalRelationships.tiltakToTiltak.find((rel) => rel.child.id === entity.id);

    if (parentRelation) {
      // Determine parent node key based on PARENT'S entity type
      const isParentKrav = globalRelationships.kravToKrav.some((rel) => rel.parent.id === parentRelation.parent.id);
      const parentNodeKey = isParentKrav ? `krav-${parentRelation.parent.id}` : `tiltak-${parentRelation.parent.id}`;
      connections.hierarchicalParents.push(parentNodeKey);
    }

    // Find business relationship connections (tiltak → krav)
    const entityTypeLower = entity.entityType?.toLowerCase();
    if (entityTypeLower === "prosjekttiltak" || entityTypeLower === "tiltak") {
      const connectedKrav = globalRelationships.tiltakToKrav.filter((rel) => rel.tiltak.id === entity.id);

      connectedKrav.forEach((rel) => {
        connections.businessConnections.push(`krav-${rel.krav.id}`);
      });
    }

    entityConnections.set(nodeKey, connections);
  });

  return entityConnections;
}
