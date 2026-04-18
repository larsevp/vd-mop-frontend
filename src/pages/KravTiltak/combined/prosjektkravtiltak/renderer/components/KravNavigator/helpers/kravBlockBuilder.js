/**
 * Transforms interleaved entity groups into flat krav blocks for navigator view.
 *
 * Input:  grouped entities from combined API (emne groups with interleaved krav + tiltak)
 * Output: flat array of krav blocks with their related tiltak + emne context
 *
 * Each block: { krav, tiltak: [...], emne, emneIndex, globalIndex }
 */

/**
 * @param {Array} entities - Grouped entity list from EntityWorkspace
 *   Each group: { group: { emne }, items: [krav1, tiltak1a, tiltak1b, krav2, ...] }
 *   OR flat array of entities with _emne attached
 * @returns {{ blocks: Array, orphanTiltak: Array, emneList: Array }}
 */
export function buildKravBlocks(entities) {
  const blocks = [];
  const orphanTiltak = [];
  const emneMap = new Map();

  // Handle both grouped and flat entity lists
  const first = entities?.[0];
  const isGrouped = first?.items || first?.group;
  const groups = isGrouped
    ? entities
    : [{ group: { emne: null }, items: entities }];

  for (const group of groups) {
    const emne = group.group?.emne || null;
    const items = group.items || [];

    if (emne && !emneMap.has(emne.id)) {
      emneMap.set(emne.id, { emne, count: 0 });
    }

    let i = 0;
    while (i < items.length) {
      const entity = items[i];
      const isKrav = entity.entityType?.toLowerCase().includes('krav');
      const isTiltak = entity.entityType?.toLowerCase().includes('tiltak');

      if (isKrav) {
        const krav = entity;
        const relatedTiltak = [];

        let j = i + 1;
        while (j < items.length) {
          const next = items[j];
          const nextIsKrav = next.entityType?.toLowerCase().includes('krav');
          if (nextIsKrav) break;
          if (next._relatedToKrav === krav.id) {
            relatedTiltak.push(next);
          }
          j++;
        }

        blocks.push({
          krav,
          tiltak: relatedTiltak,
          emne,
          globalIndex: blocks.length,
        });

        if (emne && emneMap.has(emne.id)) {
          emneMap.get(emne.id).count++;
        }

        i = j;
      } else if (isTiltak) {
        if (!entity._relatedToKrav) {
          orphanTiltak.push(entity);
        }
        i++;
      } else {
        i++;
      }
    }
  }

  // Build emne list with counts and first block index
  const emneList = [];
  let blockIdx = 0;
  for (const [, entry] of emneMap) {
    emneList.push({
      emne: entry.emne,
      count: entry.count,
      firstBlockIndex: blockIdx,
    });
    blockIdx += entry.count;
  }

  return { blocks, orphanTiltak, emneList };
}
