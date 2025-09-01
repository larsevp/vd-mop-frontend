/**
 * Optimistic update utilities for EntityWorkspace
 * Handles immediate UI updates while waiting for backend sync
 */

/**
 * Sort items by emne for optimistic updates
 * @param {Array} items - Array of entities
 * @returns {Array} - Sorted array
 */
export const sortItemsByEmne = (items) => {
  return [...items].sort((a, b) => {
    // Sort by emne.sortIt first (manual ordering), then fallbacks
    const aSortIt = a.emne?.sortIt;
    const bSortIt = b.emne?.sortIt;

    // Handle null/undefined/0 sortIt values - put them at the end (match backend logic)
    const aHasValidSort = aSortIt !== null && aSortIt !== undefined && aSortIt !== 0;
    const bHasValidSort = bSortIt !== null && bSortIt !== undefined && bSortIt !== 0;

    if (!aHasValidSort) {
      if (!bHasValidSort) {
        // Both are null, sort by tittel or put "Ingen emne" last
        const aTitle = a.emne?.tittel || "Ingen emne";
        const bTitle = b.emne?.tittel || "Ingen emne";

        if (aTitle === "Ingen emne" && bTitle !== "Ingen emne") return 1;
        if (bTitle === "Ingen emne" && aTitle !== "Ingen emne") return -1;

        if (aTitle !== bTitle) {
          return aTitle.localeCompare(bTitle, "no", { sensitivity: "base" });
        }

        // Secondary sort by ID when emne titles are same
        const idDiff = (a.id || 0) - (b.id || 0);
        if (idDiff !== 0) return idDiff;

        // Tertiary sort by UID as additional fallback
        const aUID = a.kravUID || a.tiltakUID || a.prosjektKravUID || a.prosjektTiltakUID || "";
        const bUID = b.kravUID || b.tiltakUID || b.prosjektKravUID || b.prosjektTiltakUID || "";
        return aUID.localeCompare(bUID);
      }
      return 1; // a has no valid sort, b has valid sort - a goes after b
    }

    if (!bHasValidSort) {
      return -1; // b has no valid sort, a has valid sort - a goes before b
    }

    // Both have sortIt values - sort by sortIt, then by emne id as tiebreaker
    if (aSortIt !== bSortIt) {
      return aSortIt - bSortIt;
    }

    // Same sortIt value - sort by emne id as tiebreaker
    const aId = a.emne?.id || 0;
    const bId = b.emne?.id || 0;
    if (aId !== bId) {
      return aId - bId;
    }

    // Secondary sort by ID when emne is identical
    const idDiff = (a.id || 0) - (b.id || 0);
    if (idDiff !== 0) return idDiff;

    // Tertiary sort by UID as additional fallback
    const aUID = a.kravUID || a.tiltakUID || a.prosjektKravUID || a.prosjektTiltakUID || "";
    const bUID = b.kravUID || b.tiltakUID || b.prosjektKravUID || b.prosjektTiltakUID || "";
    return aUID.localeCompare(bUID);
  });
};

import { EntityTypeTranslator } from "./entityTypeTranslator";

/**
 * Map entityType to the actual property name in grouped data (same as EntityFilterService)
 */
const getGroupedDataPropertyName = (entityType) => {
  // Use centralized translator for consistent naming
  return EntityTypeTranslator.translate(entityType, "lowercase");
};

/**
 * Re-group entities by emne after an update
 * @param {Array} flatItems - Flat array of entities
 * @param {string} entityType - Type of entity (tiltak, krav, combinedEntities, etc.)
 * @returns {Array} - Array of grouped objects sorted by emne.sortIt
 */
export const regroupByEmne = (flatItems, entityType) => {
  // Get the correct property name for this entity type
  const propertyName = getGroupedDataPropertyName(entityType);

  const grouped = flatItems.reduce((acc, item) => {
    const emneId = item.emne?.id || "no-emne";
    const emneKey = item.emne?.id ? `emne-${emneId}` : "no-emne";

    if (!acc[emneKey]) {
      acc[emneKey] = {
        emne: item.emne || { id: null, tittel: "Ingen emne", icon: null, color: null },
      };

      // For combined entities, we need multiple arrays
      if (entityType === "combinedEntities" || entityType === "combined") {
        acc[emneKey].entities = [];
        acc[emneKey].krav = [];
        acc[emneKey].tiltak = [];
      } else {
        acc[emneKey][propertyName] = [];
      }
    }

    // For combined entities, sort into appropriate arrays
    if (entityType === "combinedEntities" || entityType === "combined") {
      acc[emneKey].entities.push(item);

      // Also add to specific type arrays for compatibility
      if (item.entityType === "krav") {
        acc[emneKey].krav.push(item);
      } else if (item.entityType === "tiltak") {
        acc[emneKey].tiltak.push(item);
      }
    } else {
      acc[emneKey][propertyName].push(item);
    }

    return acc;
  }, {});

  // Convert to array and sort groups by emne.sortIt (matching backend groupingHelper logic)
  return Object.values(grouped)
    .filter((group) => {
      // Filter out empty groups - check different property structures
      if (entityType === "combinedEntities" || entityType === "combined") {
        return group.entities && group.entities.length > 0;
      } else {
        const propertyArray = group[propertyName];
        return propertyArray && propertyArray.length > 0;
      }
    })
    .sort((a, b) => {
      const aSortIt = a.emne?.sortIt;
      const bSortIt = b.emne?.sortIt;

      // Handle null/undefined/0 sortIt values - put them at the end (match backend logic)
      const aHasValidSort = aSortIt !== null && aSortIt !== undefined && aSortIt !== 0;
      const bHasValidSort = bSortIt !== null && bSortIt !== undefined && bSortIt !== 0;

      if (!aHasValidSort) {
        if (!bHasValidSort) {
          // Both have no valid sortIt, sort by emne.id, then by tittel
          const aId = a.emne?.id || 0;
          const bId = b.emne?.id || 0;
          
          if (aId !== bId) {
            return aId - bId;
          }

          // Same ID (or both 0), sort by tittel or put "Ingen emne" last
          const aTitle = a.emne?.tittel || "Ingen emne";
          const bTitle = b.emne?.tittel || "Ingen emne";

          if (aTitle === "Ingen emne" && bTitle !== "Ingen emne") return 1;
          if (bTitle === "Ingen emne" && aTitle !== "Ingen emne") return -1;

          return aTitle.localeCompare(bTitle, "no", { sensitivity: "base" });
        }
        return 1; // a has no valid sort, b has valid sort - a goes after b
      }

      if (!bHasValidSort) {
        return -1; // b has no valid sort, a has valid sort - a goes before b
      }

      // Both have sortIt values - sort by sortIt, then by id as tiebreaker
      if (aSortIt !== bSortIt) {
        return aSortIt - bSortIt;
      }

      // Same sortIt value - sort by emne id as tiebreaker
      const aId = a.emne?.id || 0;
      const bId = b.emne?.id || 0;
      return aId - bId;
    });
};

/**
 * Apply optimistic update to query cache for flat data
 * @param {Object} queryClient - React Query client
 * @param {Array} queryKey - Query key for cache
 * @param {Object} updatedData - Updated entity data
 * @param {Object} originalData - Original entity data (for comparison)
 * @param {string} entityType - Type of entity
 */
export const applyOptimisticUpdateFlat = (queryClient, queryKey, updatedData, originalData, entityType) => {
  const emneChanged = updatedData.emneId !== originalData?.emneId;

  queryClient.setQueryData(queryKey, (oldData) => {
    if (oldData?.items) {
      let updatedItems = oldData.items.map((item) => (item.id === updatedData.id ? { ...item, ...updatedData } : item));

      // If emne changed, apply client-side re-sorting for immediate feedback
      if (emneChanged) {
        updatedItems = sortItemsByEmne(updatedItems);
      }

      return { ...oldData, items: updatedItems };
    }
    return oldData;
  });
};

/**
 * Apply optimistic update to query cache for grouped data (EntityWorkspace)
 * @param {Object} queryClient - React Query client
 * @param {Array} baseQueryKey - Base query key for workspace cache
 * @param {Object} updatedData - Updated entity data
 * @param {Object} originalData - Original entity data (for comparison)
 * @param {string} entityType - Type of entity
 */
export const applyOptimisticUpdateGrouped = (queryClient, baseQueryKey, updatedData, originalData, entityType) => {
  const emneChanged = updatedData.emneId !== originalData?.emneId;

  if (emneChanged) {
    const groupedQueryKey = [...baseQueryKey, "workspace", "paginated"];

    queryClient.setQueryData(groupedQueryKey, (oldGroupedData) => {
      if (oldGroupedData?.items) {
        // Extract all flat items from groups
        let flatItems = [];

        // Handle different group structures
        if (entityType === "combinedEntities" || entityType === "combined") {
          // Combined entities can have entities, krav, or tiltak arrays
          flatItems = oldGroupedData.items.flatMap((group) => group.entities || group.krav || group.tiltak || []);
        } else {
          // Single entity type
          flatItems = oldGroupedData.items.flatMap((group) => group.tiltak || group.krav || group.entities || []);
        }

        // Update the specific item
        const updatedFlatItems = flatItems.map((item) => (item.id === updatedData.id ? { ...item, ...updatedData } : item));

        // Re-group by emne
        const regroupedData = regroupByEmne(updatedFlatItems, entityType);

        return { ...oldGroupedData, items: regroupedData };
      }
      return oldGroupedData;
    });
  }
};

/**
 * Apply optimistic update specifically for combined entities
 * @param {Object} queryClient - React Query client
 * @param {Object} updatedData - Updated entity data
 * @param {Object} originalData - Original entity data (for comparison)
 */
export const applyOptimisticUpdateCombined = (queryClient, updatedData, originalData) => {
  const emneChanged = updatedData.emneId !== originalData?.emneId;
  const kravChanged = JSON.stringify(updatedData.krav || []) !== JSON.stringify(originalData?.krav || []);

  if (emneChanged || kravChanged) {
    // Update the combined entities workspace cache
    const combinedQueryKey = ["combinedEntities", "workspace", "paginated"];

    queryClient.setQueryData(combinedQueryKey, (oldData) => {
      if (oldData?.items) {
        let needsComplexUpdate = false;

        if (kravChanged && updatedData.entityType === "tiltak") {
          // For krav changes in combined view, we need to restructure the nested relationships
          // This is complex because tiltak need to move between krav.relatedTiltak arrays

          // Extract all krav from all groups
          const allKrav = oldData.items.flatMap((group) => group.entities?.filter((entity) => entity.entityType === "krav") || []);

          // Remove the updated tiltak from all krav.relatedTiltak arrays
          allKrav.forEach((krav) => {
            if (krav.relatedTiltak) {
              krav.relatedTiltak = krav.relatedTiltak.filter((tiltak) => tiltak.id !== updatedData.id);
            }
          });

          // Add the updated tiltak to the correct krav.relatedTiltak arrays
          const newKravIds = (updatedData.krav || []).map((k) => k.id);
          allKrav.forEach((krav) => {
            if (newKravIds.includes(krav.id)) {
              if (!krav.relatedTiltak) {
                krav.relatedTiltak = [];
              }
              // Add the updated tiltak with the correct metadata
              const tiltakWithMetadata = {
                ...updatedData,
                _relatedToKrav: krav.id,
                _displayedUnderKrav: true,
              };
              krav.relatedTiltak.push(tiltakWithMetadata);
            }
          });

          needsComplexUpdate = true;
        }

        if (emneChanged && !needsComplexUpdate) {
          // Handle emne changes with the existing logic
          const allEntities = oldData.items.flatMap((group) => group.entities || []);
          const updatedEntities = allEntities.map((entity) =>
            entity.id === updatedData.id && entity.entityType === updatedData.entityType ? { ...entity, ...updatedData } : entity
          );
          const regroupedData = regroupByEmne(updatedEntities, "combinedEntities");
          return { ...oldData, items: regroupedData };
        } else if (needsComplexUpdate) {
          // For krav relationship changes, return the modified data structure
          return { ...oldData };
        }
      }
      return oldData;
    });

    // Also update individual entity type caches
    const specificEntityType = updatedData.entityType || "unknown";
    if (specificEntityType === "krav" || specificEntityType === "tiltak") {
      const specificQueryKey = [specificEntityType, "workspace", "paginated"];
      applyOptimisticUpdateGrouped(queryClient, [specificEntityType], updatedData, originalData, specificEntityType);
    }
  }
};

/**
 * Apply silent cache updates for emne propagation
 * Attempts to update tiltak entities in cache that are connected to the changed krav
 * @param {Object} queryClient - React Query client
 * @param {Object} updatedKravData - Updated krav/prosjektKrav data
 * @param {string} kravEntityType - 'krav' or 'prosjektKrav'
 */
const applySilentEmnePropagationUpdates = (queryClient, updatedKravData, kravEntityType) => {
  const newEmneId = updatedKravData.emneId;
  const kravId = updatedKravData.id;

  //console.log(`🔄 Silent propagation: Updating tiltak caches for ${kravEntityType} ${kravId} emneId change to ${newEmneId}`);

  // Helper to update tiltak entities in a query data structure
  const updateTiltakInQueryData = (oldData, tiltakType) => {
    if (!oldData) return oldData;

    let updated = false;

    // Handle flat data structure (items array)
    if (oldData.items && Array.isArray(oldData.items)) {
      const updatedItems = oldData.items.map((item) => {
        // Check if this tiltak is connected to the changed krav
        const isConnectedToKrav = item.krav?.some((k) => k.id === kravId);
        const shouldUpdate =
          isConnectedToKrav &&
          item.parentId === null && // Only update if no parent override
          item.emneId !== newEmneId; // Only if actually changing

        if (shouldUpdate) {
          //console.log(`🔄 Silent update: ${tiltakType} ${item.id} emneId ${item.emneId} → ${newEmneId} (via ${kravEntityType} ${kravId})`);
          updated = true;
          return { ...item, emneId: newEmneId };
        }
        return item;
      });

      if (updated) {
        return { ...oldData, items: updatedItems };
      }
    }

    // Handle grouped data structure (array of groups)
    if (Array.isArray(oldData.items) && oldData.items[0]?.tiltak) {
      const updatedGroups = oldData.items.map((group) => {
        if (!group.tiltak) return group;

        const updatedTiltak = group.tiltak.map((tiltak) => {
          const isConnectedToKrav = tiltak.krav?.some((k) => k.id === kravId);
          const shouldUpdate = isConnectedToKrav && tiltak.parentId === null && tiltak.emneId !== newEmneId;

          if (shouldUpdate) {
            updated = true;
            return { ...tiltak, emneId: newEmneId };
          }
          return tiltak;
        });

        return { ...group, tiltak: updatedTiltak };
      });

      if (updated) {
        return { ...oldData, items: updatedGroups };
      }
    }

    // Handle combined entities structure
    if (Array.isArray(oldData.items) && oldData.items[0]?.entities) {
      const updatedGroups = oldData.items.map((group) => {
        if (!group.entities) return group;

        const updatedEntities = group.entities.map((entity) => {
          if (entity.entityType !== "tiltak") return entity;

          const isConnectedToKrav = entity.krav?.some((k) => k.id === kravId);
          const shouldUpdate = isConnectedToKrav && entity.parentId === null && entity.emneId !== newEmneId;

          if (shouldUpdate) {
            // console.log(`🔄 Silent update: tiltak ${entity.id} emneId ${entity.emneId} → ${newEmneId} (via ${kravEntityType} ${kravId})`);
            updated = true;
            return { ...entity, emneId: newEmneId };
          }
          return entity;
        });

        return { ...group, entities: updatedEntities };
      });

      if (updated) {
        return { ...oldData, items: updatedGroups };
      }
    }

    return oldData;
  };

  // Apply silent updates to various query caches
  const queriesToUpdate = [
    { queryKey: ["tiltak"], tiltakType: "tiltak" },
    { queryKey: ["tiltak", "workspace"], tiltakType: "tiltak" },
    { queryKey: ["tiltak", "workspace", "paginated"], tiltakType: "tiltak" },
    { queryKey: ["prosjektTiltak"], tiltakType: "prosjektTiltak" },
    { queryKey: ["prosjektTiltak", "workspace"], tiltakType: "prosjektTiltak" },
    { queryKey: ["prosjektTiltak", "workspace", "paginated"], tiltakType: "prosjektTiltak" },
    { queryKey: ["combinedEntities"], tiltakType: "tiltak" },
    { queryKey: ["combinedEntities", "workspace"], tiltakType: "tiltak" },
    { queryKey: ["combinedEntities", "workspace", "paginated"], tiltakType: "tiltak" },
  ];

  let totalUpdated = 0;

  queriesToUpdate.forEach(({ queryKey, tiltakType }) => {
    queryClient.setQueryData(queryKey, (oldData) => {
      const newData = updateTiltakInQueryData(oldData, tiltakType);
      if (newData !== oldData) {
        totalUpdated++;
      }
      return newData;
    });
  });

  //console.log(`🔄 Silent propagation: Updated ${totalUpdated} cache entries for ${kravEntityType} ${kravId}`);

  return totalUpdated > 0;
};

/**
 * Apply optimistic regrouping to workspace queries after emne propagation
 * This ensures tiltak are properly sorted by their new emneId after backend propagation
 * @param {Object} queryClient - React Query client
 * @param {string} entityType - Type of entity that was updated (krav/prosjektKrav)
 */
const applyOptimisticRegroupingAfterPropagation = (queryClient, entityType) => {
  //console.log(`🔄 Applying optimistic regrouping after ${entityType} emne propagation`);

  // Target the workspace queries that display grouped data
  const workspaceQueries = [
    ["tiltak", "workspace", "paginated"],
    ["prosjektTiltak", "workspace", "paginated"],
    ["combinedEntities", "workspace", "paginated"],
  ];

  workspaceQueries.forEach((queryKey) => {
    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData?.items) return oldData;

      // Check if this is grouped data that needs regrouping
      const isGroupedData = Array.isArray(oldData.items) && oldData.items[0]?.tiltak;
      const isCombinedData = Array.isArray(oldData.items) && oldData.items[0]?.entities;

      if (isGroupedData) {
        // Extract flat tiltak from all groups
        const flatTiltak = oldData.items.flatMap((group) => group.tiltak || []);

        // Regroup by emne with proper sorting
        const regroupedData = regroupByEmne(flatTiltak, "tiltak");

        //console.log(`✅ Regrouped tiltak data after ${entityType} propagation`);
        return { ...oldData, items: regroupedData };
      }

      if (isCombinedData) {
        // Extract flat entities from all groups
        const flatEntities = oldData.items.flatMap((group) => group.entities || []);

        // Regroup by emne with proper sorting
        const regroupedData = regroupByEmne(flatEntities, "combinedEntities");

        //console.log(`✅ Regrouped combined entities after ${entityType} propagation`);
        return { ...oldData, items: regroupedData };
      }

      return oldData;
    });
  });
};

/**
 * Clean React Query pattern for related entity cache invalidation
 * Standard approach: invalidate related queries when parent entity changes
 * @param {Object} queryClient - React Query client
 * @param {Object} updatedData - Updated entity data
 * @param {Object} originalData - Original entity data
 * @param {string} entityType - Type of entity that was updated
 */
export const handleEmnePropagationInvalidation = (queryClient, updatedData, originalData, entityType) => {
  const emneChanged = updatedData.emneId !== originalData?.emneId;

  // Convert kebab-case to camelCase for consistent checking
  const camelCaseEntityType = entityType.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

  // Only handle propagation for krav and prosjektKrav emneId changes (handle both kebab-case and camelCase)
  if (emneChanged && (camelCaseEntityType === "krav" || camelCaseEntityType === "prosjektKrav")) {
    //console.log(`🔄 Emne propagation: ${entityType} ${updatedData.id} emneId changed, invalidating tiltak queries`);

    // Invalidate tiltak queries - this marks them as stale and forces refetch when accessed
    queryClient.invalidateQueries({
      queryKey: ["tiltak"],
      exact: false,
    });

    queryClient.invalidateQueries({
      queryKey: ["prosjektTiltak"],
      exact: false,
    });

    // Also invalidate with kebab-case format used in project workspaces
    queryClient.invalidateQueries({
      queryKey: ["prosjekt-tiltak"],
      exact: false,
    });

    queryClient.invalidateQueries({
      queryKey: ["combinedEntities"],
      exact: false,
    });

    // For immediate feedback, also trigger refetch of active tiltak and prosjektTiltak workspace queries
    queryClient.refetchQueries({
      queryKey: ["tiltak", "workspace"],
      exact: false,
      type: "active", // Only refetch if currently being viewed
    });

    queryClient.refetchQueries({
      queryKey: ["prosjektTiltak", "workspace"],
      exact: false,
      type: "active", // Only refetch if currently being viewed
    });

    // Also refetch with kebab-case format used in project workspaces
    queryClient.refetchQueries({
      queryKey: ["prosjekt-tiltak", "workspace"],
      exact: false,
      type: "active", // Only refetch if currently being viewed
    });
  }
};

/**
 * Complete optimistic update handler for entity updates
 * Handles both flat and grouped data caches, including combined entities
 * @param {Object} params - Parameters object
 * @param {Object} params.queryClient - React Query client
 * @param {Array} params.queryKey - Query key for the current context
 * @param {Object} params.updatedData - Updated entity data from server
 * @param {Object} params.originalData - Original entity data before update
 * @param {string} params.entityType - Type of entity (tiltak, krav, combinedEntities, etc.)
 */
export const handleOptimisticEntityUpdate = ({ queryClient, queryKey, updatedData, originalData, entityType }) => {
  // Apply to flat data cache
  applyOptimisticUpdateFlat(queryClient, queryKey, updatedData, originalData, entityType);

  // Apply to grouped data cache (EntityWorkspace)
  const baseQueryKey = [entityType];
  applyOptimisticUpdateGrouped(queryClient, baseQueryKey, updatedData, originalData, entityType);

  // Special handling for combined entities
  if (entityType === "combinedEntities" || entityType === "combined" || updatedData.entityType) {
    applyOptimisticUpdateCombined(queryClient, updatedData, originalData);
  }

  // Handle emne propagation for krav and prosjektKrav updates
  //console.log(`🔍 DEBUG: About to call handleEmnePropagationInvalidation for ${entityType}`);
  handleEmnePropagationInvalidation(queryClient, updatedData, originalData, entityType);

  // Always invalidate queries to sync with backend eventually
  queryClient.invalidateQueries({ queryKey });

  // Also invalidate the workspace queries
  queryClient.invalidateQueries({ queryKey: [entityType, "workspace"] });

  // For combined entities, also invalidate the combined workspace
  if (entityType === "combinedEntities" || entityType === "combined" || updatedData.entityType) {
    queryClient.invalidateQueries({ queryKey: ["combinedEntities", "workspace"] });

    // And invalidate the specific entity type workspace
    const specificEntityType = updatedData.entityType;
    if (specificEntityType === "krav" || specificEntityType === "tiltak") {
      queryClient.invalidateQueries({ queryKey: [specificEntityType, "workspace"] });
    }
  }
};
