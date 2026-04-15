/**
 * Transforms a flat interleaved entity list into merged table rows
 * for the environmental management plan table view.
 *
 * Input: flat array from combined API [krav1, tiltak1a, tiltak1b, krav2, tiltak2a, orphanTiltak]
 * Output: array of row objects where krav + first tiltak share a row
 *
 * Each row: { krav, tiltak, kravRowSpan, depth, isOrphan }
 */

/**
 * Calculate hierarchy depth for an entity based on parentId chain
 */
function getDepth(entity, allEntities, maxDepth = 5) {
  let depth = 0;
  let current = entity;
  while (current?.parentId && depth < maxDepth) {
    current = allEntities.find(e => e.id === current.parentId && e.entityType === current.entityType);
    if (current) depth++;
    else break;
  }
  return depth;
}

/**
 * Build table rows from a flat interleaved entity list within a single emne group.
 *
 * @param {Array} entities - Flat interleaved list (krav followed by related tiltak)
 * @param {Array} allEntities - All entities for depth calculation
 * @returns {Array<{krav: object|null, tiltak: object|null, kravRowSpan: number, depth: number, isOrphan: boolean}>}
 */
export function buildTableRows(entities, allEntities = []) {
  const rows = [];
  const all = allEntities.length > 0 ? allEntities : entities;

  // Walk through entities and group krav with their tiltak
  let i = 0;
  while (i < entities.length) {
    const entity = entities[i];
    const isKrav = entity.entityType?.toLowerCase().includes('krav');
    const isTiltak = entity.entityType?.toLowerCase().includes('tiltak');

    if (isKrav) {
      // Collect all tiltak that follow and are related to this krav
      const krav = entity;
      const kravDepth = getDepth(krav, all);
      const relatedTiltak = [];

      let j = i + 1;
      while (j < entities.length) {
        const next = entities[j];
        const nextIsKrav = next.entityType?.toLowerCase().includes('krav');
        if (nextIsKrav) break; // Next krav block starts
        if (next._relatedToKrav === krav.id) {
          relatedTiltak.push(next);
        }
        j++;
      }

      if (relatedTiltak.length === 0) {
        // Krav with no tiltak — single row, empty tiltak columns
        rows.push({
          krav,
          tiltak: null,
          kravRowSpan: 1,
          depth: kravDepth,
          isOrphan: false,
        });
      } else {
        // First tiltak shares row with krav
        rows.push({
          krav,
          tiltak: relatedTiltak[0],
          kravRowSpan: relatedTiltak.length,
          depth: kravDepth,
          isOrphan: false,
        });

        // Additional tiltak get continuation rows (krav = null)
        for (let k = 1; k < relatedTiltak.length; k++) {
          rows.push({
            krav: null, // Continuation — krav columns spanned from above
            tiltak: relatedTiltak[k],
            kravRowSpan: 0,
            depth: kravDepth,
            isOrphan: false,
          });
        }
      }

      // Skip past the tiltak we consumed
      i = j;
    } else if (isTiltak) {
      // Orphaned tiltak — own row with empty krav cells
      rows.push({
        krav: null,
        tiltak: entity,
        kravRowSpan: 1, // Render empty krav cells (not spanned from above)
        depth: 0,
        isOrphan: entity._orphaned || !entity._relatedToKrav,
      });
      i++;
    } else {
      i++;
    }
  }

  return rows;
}
