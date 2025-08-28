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
    // Sort by emne.tittel, then by item.tittel
    const aEmne = a.emne?.tittel || "Ingen emne";
    const bEmne = b.emne?.tittel || "Ingen emne";

    if (aEmne !== bEmne) {
      return aEmne.localeCompare(bEmne);
    }

    // Secondary sort by item title
    return (a.tittel || "").localeCompare(b.tittel || "");
  });
};

/**
 * Re-group entities by emne after an update
 * @param {Array} flatItems - Flat array of entities
 * @param {string} entityType - Type of entity (tiltak, krav, combinedEntities, etc.)
 * @returns {Array} - Array of grouped objects
 */
export const regroupByEmne = (flatItems, entityType) => {
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
        acc[emneKey][entityType.toLowerCase()] = [];
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
      acc[emneKey][entityType.toLowerCase()].push(item);
    }

    return acc;
  }, {});

  return Object.values(grouped);
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
