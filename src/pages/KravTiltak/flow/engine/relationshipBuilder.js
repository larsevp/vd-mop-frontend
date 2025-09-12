/**
 * Relationship Builder Module
 * Handles building global relationship graphs from entities
 */

/**
 * Check if tiltak is connected to krav via business relationship
 */
function isTiltakConnectedToKrav(tiltak, krav) {
  return (
    tiltak.prosjektKrav?.some((k) => k.id === krav.id) ||
    krav.prosjektTiltak?.some((t) => t.id === tiltak.id)
  );
}

/**
 * Build global relationship graph from all entities - supports multiple parents
 */
export function buildGlobalRelationships(allKravEntities, allTiltakEntities) {
  const relationships = {
    kravToKrav: [],
    tiltakToTiltak: [],
    tiltakToKrav: [],
    standaloneKrav: [],
    standaloneTiltak: [],
    // Track entities with multiple parents for special positioning
    multiParentEntities: new Set()
  };

  // Build hierarchical relationships - krav to krav
  allKravEntities.forEach((child) => {
    if (child.parentId) {
      const parent = allKravEntities.find((k) => k.id === child.parentId);
      if (parent) {
        relationships.kravToKrav.push({ parent, child });
      }
    }
  });

  // Build hierarchical relationships - tiltak to tiltak  
  allTiltakEntities.forEach((child) => {
    if (child.parentId) {
      const parent = allTiltakEntities.find((t) => t.id === child.parentId);
      if (parent) {
        relationships.tiltakToTiltak.push({ parent, child });
      }
    }
  });

  // Build business relationships - tiltak to krav (these are additional "parent" connections)
  allTiltakEntities.forEach((tiltak) => {
    const connectedKrav = [];
    allKravEntities.forEach((krav) => {
      if (isTiltakConnectedToKrav(tiltak, krav)) {
        relationships.tiltakToKrav.push({ tiltak, krav });
        connectedKrav.push(krav);
      }
    });
    
    // Mark tiltak with multiple "parents" (hierarchical parent + business connections)
    const hasHierarchicalParent = tiltak.parentId;
    const hasMultipleKravConnections = connectedKrav.length > 1;
    const hasMultipleParentTypes = hasHierarchicalParent && connectedKrav.length > 0;
    
    if (hasMultipleKravConnections || hasMultipleParentTypes) {
      relationships.multiParentEntities.add(`tiltak-${tiltak.id}`);
      console.log(`[LOGBACKEND] Multi-parent tiltak detected: ${tiltak.tiltakUID} (hierarchical: ${!!hasHierarchicalParent}, business: ${connectedKrav.length})`);
    }
  });

  // Similarly, check krav with multiple business connections
  allKravEntities.forEach((krav) => {
    const connectedTiltak = allTiltakEntities.filter(tiltak => 
      isTiltakConnectedToKrav(tiltak, krav)
    );
    
    const hasHierarchicalParent = krav.parentId;
    const hasMultipleBusinessConnections = connectedTiltak.length > 1;
    
    if (hasHierarchicalParent && hasMultipleBusinessConnections) {
      relationships.multiParentEntities.add(`krav-${krav.id}`);
    }
  });

  // Find standalone entities (no parent, no business connections)
  relationships.standaloneKrav = allKravEntities.filter((krav) => !krav.parentId);
  
  relationships.standaloneTiltak = allTiltakEntities.filter((tiltak) => {
    const hasParent = tiltak.parentId;
    const hasKravConnection = allKravEntities.some((krav) => 
      isTiltakConnectedToKrav(tiltak, krav)
    );
    return !hasParent && !hasKravConnection;
  });

  console.log(`[LOGBACKEND] Relationships built: ${relationships.multiParentEntities.size} multi-parent entities`);
  return relationships;
}