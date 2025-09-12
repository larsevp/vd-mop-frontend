/**
 * Data Collection Module
 * Handles collecting and deduplicating entities from emne groups
 */

/**
 * Collect all unique entities from emne groups with source emne tracking
 */
export function collectAllUniqueEntities(emneGroups) {
  const allKravEntities = [];
  const allTiltakEntities = [];
  const seenKravIds = new Set();
  const seenTiltakIds = new Set();

  emneGroups.forEach((groupData) => {
    const emne = groupData.emne;
    const kravEntities = groupData.kravEntities || [];
    const tiltakEntities = groupData.tiltakEntities || [];

    if (!emne) return;

    // Deduplicate and add source emne reference
    const uniqueKravEntities = kravEntities.filter((krav) => {
      if (seenKravIds.has(krav.id)) return false;
      seenKravIds.add(krav.id);
      krav._sourceEmne = emne; // Track which emne this entity belongs to
      return true;
    });

    const uniqueTiltakEntities = tiltakEntities.filter((tiltak) => {
      if (seenTiltakIds.has(tiltak.id)) return false;
      seenTiltakIds.add(tiltak.id);
      tiltak._sourceEmne = emne; // Track which emne this entity belongs to
      return true;
    });

    allKravEntities.push(...uniqueKravEntities);
    allTiltakEntities.push(...uniqueTiltakEntities);
  });

  return {
    allKravEntities,
    allTiltakEntities
  };
}

/**
 * Get entities that belong to a specific emne
 */
export function getEntitiesForEmne(allKravEntities, allTiltakEntities, emneId) {
  const kravEntities = allKravEntities.filter(krav => krav._sourceEmne.id === emneId);
  const tiltakEntities = allTiltakEntities.filter(tiltak => tiltak._sourceEmne.id === emneId);
  
  return { kravEntities, tiltakEntities };
}