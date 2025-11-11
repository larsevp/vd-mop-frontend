/**
 * Columnar Layout Engine - Vertical "Spreadsheet" Style
 *
 * Layout Concept:
 * - Each emne becomes a column
 * - Emne nodes positioned at the top as column headers
 * - Krav/Tiltak entities stacked vertically below their emne
 * - Connected entities aligned in vertical lines
 * - Cross-emne connections drawn horizontally
 *
 * This is a custom positioning algorithm, not Dagre-based.
 */

/**
 * Calculate columnar layout positions
 * Returns Map of node positions compatible with React Flow
 */
export function calculateColumnarLayout(
  allKravEntities,
  allTiltakEntities,
  globalRelationships,
  globalConnections,
  config,
  viewOptions = {}
) {
  const positions = new Map();

  // STEP 1: Group entities by emne
  const emneGroups = groupEntitiesByEmne(allKravEntities, allTiltakEntities);

  // STEP 2: Sort emne groups (by sortIt, with "Ingen emne" last)
  const sortedEmneGroups = sortEmneGroups(emneGroups);

  // STEP 3: Build hierarchical structure for each column
  const columnStructures = sortedEmneGroups.map(group =>
    buildColumnHierarchy(group, globalRelationships)
  );

  // STEP 4: Calculate column positions
  const columnWidth = config.columnWidth || 350;
  const columnSpacing = config.columnSpacing || 150;
  const headerHeight = config.headerHeight || 100;
  const entitySpacing = config.entitySpacing || 100;
  const startX = config.startX || 100;
  const startY = config.startY || 50;

  let currentX = startX;

  // STEP 5: Calculate row-based layout for visual symmetry
  // Find the maximum number of entities across all columns
  const maxEntities = Math.max(...columnStructures.map(col =>
    col.levels.reduce((sum, level) => sum + level.entities.length, 0)
  ));

  // Build a 2D array: rows x columns to map entities
  const entityGrid = [];
  for (let rowIndex = 0; rowIndex < maxEntities; rowIndex++) {
    entityGrid[rowIndex] = [];
  }

  // Fill the grid with entities from each column
  columnStructures.forEach((column, columnIndex) => {
    let rowIndex = 0;
    column.levels.forEach(level => {
      level.entities.forEach(entity => {
        entityGrid[rowIndex][columnIndex] = entity;
        rowIndex++;
      });
    });
  });

  // Calculate the maximum height for each row
  const rowHeights = [];
  for (let rowIndex = 0; rowIndex < maxEntities; rowIndex++) {
    let maxHeightInRow = 120; // Minimum height
    entityGrid[rowIndex].forEach(entity => {
      if (entity) {
        const height = calculateEntityHeight(entity, viewOptions);
        maxHeightInRow = Math.max(maxHeightInRow, height);
      }
    });
    rowHeights.push(maxHeightInRow);
  }

  // Calculate Y positions for each row based on actual max heights
  // Store the TOP edge position for each row (for top-alignment)
  const rowTopPositions = [];
  let currentRowTop = startY + headerHeight + config.emneToEntityGap;

  for (let rowIndex = 0; rowIndex < maxEntities; rowIndex++) {
    const rowHeight = rowHeights[rowIndex];
    // Store the top position for this row
    rowTopPositions.push(currentRowTop);
    // Move to next row (add max height + spacing)
    currentRowTop += rowHeight + entitySpacing;
  }

  // Position nodes using row-based layout
  columnStructures.forEach((column, columnIndex) => {
    // Position emne header at top of column
    const emneNodeKey = `emne-${column.emne.id}`;
    positions.set(emneNodeKey, {
      x: currentX + columnWidth / 2,
      y: startY + headerHeight / 2,
      width: 320,
      height: 65,
      emne: column.emne,
    });

    // Position entities in rows with top-alignment
    let rowIndex = 0;
    column.levels.forEach(level => {
      level.entities.forEach(entity => {
        const nodeKey = entity.entityType?.toLowerCase().includes("krav")
          ? `krav-${entity.id}`
          : `tiltak-${entity.id}`;

        const height = calculateEntityHeight(entity, viewOptions);

        // Calculate center Y based on top position + half of this entity's height
        // This gives top-alignment across columns
        const centerY = rowTopPositions[rowIndex] + height / 2;

        positions.set(nodeKey, {
          x: currentX + columnWidth / 2,
          y: centerY,
          width: 320,
          height: height,
          entity: entity,
        });

        rowIndex++;
      });
    });

    // Move to next column
    currentX += columnWidth + columnSpacing;
  });

  return positions;
}

/**
 * Group all entities by their emne
 */
function groupEntitiesByEmne(allKravEntities, allTiltakEntities) {
  const emneGroups = new Map();

  [...allKravEntities, ...allTiltakEntities].forEach(entity => {
    const emne = entity._sourceEmne;
    const emneId = emne?.id || "null"; // Use "null" for "Ingen emne"

    if (!emneGroups.has(emneId)) {
      emneGroups.set(emneId, {
        emne: emne || { id: null, navn: "Ingen emne", tittel: "Ingen emne" },
        kravEntities: [],
        tiltakEntities: [],
      });
    }

    const group = emneGroups.get(emneId);
    if (entity.entityType?.toLowerCase().includes("krav")) {
      group.kravEntities.push(entity);
    } else {
      group.tiltakEntities.push(entity);
    }
  });

  return emneGroups;
}

/**
 * Sort emne groups by sortIt field, with "Ingen emne" always last
 */
function sortEmneGroups(emneGroups) {
  return [...emneGroups.values()].sort((a, b) => {
    // "Ingen emne" always last
    const aIsIngen = !a.emne.id || a.emne.id === null;
    const bIsIngen = !b.emne.id || b.emne.id === null;

    if (aIsIngen && !bIsIngen) return 1;
    if (bIsIngen && !aIsIngen) return -1;
    if (aIsIngen && bIsIngen) return 0;

    // Sort by sortIt field
    const aSortIt = a.emne.sortIt;
    const bSortIt = b.emne.sortIt;

    if (aSortIt !== undefined && bSortIt !== undefined) {
      return aSortIt - bSortIt;
    }

    if (aSortIt !== undefined) return -1;
    if (bSortIt !== undefined) return 1;

    // Fallback to emne id
    return (a.emne.id || 0) - (b.emne.id || 0);
  });
}

/**
 * Build structure for a column
 * Sorts entities ensuring parents always come before children
 */
function buildColumnHierarchy(emneGroup, globalRelationships) {
  const { kravEntities, tiltakEntities } = emneGroup;

  // Combine all entities
  const allEntities = [...kravEntities, ...tiltakEntities];

  // Build parent-child map for this column
  const parentMap = new Map(); // child id -> parent id
  const childrenMap = new Map(); // parent id -> [child ids]

  // Track hierarchical relationships within this column
  globalRelationships.kravToKrav.forEach(({ parent, child }) => {
    if (allEntities.find(e => e.id === child.id)) {
      const childKey = `${child.entityType}-${child.id}`;
      const parentKey = `${parent.entityType}-${parent.id}`;
      parentMap.set(childKey, parentKey);
      if (!childrenMap.has(parentKey)) {
        childrenMap.set(parentKey, []);
      }
      childrenMap.get(parentKey).push(childKey);
    }
  });

  globalRelationships.tiltakToTiltak.forEach(({ parent, child }) => {
    if (allEntities.find(e => e.id === child.id)) {
      const childKey = `${child.entityType}-${child.id}`;
      const parentKey = `${parent.entityType}-${parent.id}`;
      parentMap.set(childKey, parentKey);
      if (!childrenMap.has(parentKey)) {
        childrenMap.set(parentKey, []);
      }
      childrenMap.get(parentKey).push(childKey);
    }
  });

  // Track business relationships (krav -> tiltak)
  globalRelationships.tiltakToKrav.forEach(({ krav, tiltak }) => {
    if (allEntities.find(e => e.id === tiltak.id)) {
      const childKey = `${tiltak.entityType}-${tiltak.id}`;
      const parentKey = `${krav.entityType}-${krav.id}`;
      parentMap.set(childKey, parentKey);
      if (!childrenMap.has(parentKey)) {
        childrenMap.set(parentKey, []);
      }
      childrenMap.get(parentKey).push(childKey);
    }
  });

  // Depth-first sort: keep parent-child chains together
  const sorted = [];
  const visited = new Set();

  function visitWithChildren(entity) {
    const entityKey = `${entity.entityType}-${entity.id}`;
    if (visited.has(entityKey)) return;

    // Add this entity
    visited.add(entityKey);
    sorted.push(entity);

    // Recursively add all children to keep family together
    const children = childrenMap.get(entityKey) || [];
    children.forEach(childKey => {
      const childEntity = allEntities.find(e => `${e.entityType}-${e.id}` === childKey);
      if (childEntity) {
        visitWithChildren(childEntity);
      }
    });
  }

  // Find root entities (no parents in this column)
  const rootEntities = allEntities.filter(entity => {
    const entityKey = `${entity.entityType}-${entity.id}`;
    return !parentMap.has(entityKey);
  });

  // Visit roots and their descendants depth-first
  // This keeps parent-child chains together
  rootEntities.forEach(entity => visitWithChildren(entity));

  // Catch any orphaned entities (shouldn't happen but be safe)
  allEntities.forEach(entity => visitWithChildren(entity));

  // Wrap in a single level
  const levels = [{ entities: sorted }];

  return {
    emne: emneGroup.emne,
    levels: levels,
  };
}

/**
 * Calculate realistic height for an entity based on content
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
