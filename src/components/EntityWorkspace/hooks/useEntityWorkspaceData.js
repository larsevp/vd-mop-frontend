import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Generic hook for managing entity workspace data fetching and processing
 * Works with any entity type based on model configuration
 */
export const useEntityWorkspaceData = ({
  modelConfig,
  entityType,
  page = 1,
  pageSize = 50,
  searchQuery = "",
  sortBy = "updatedAt",
  sortOrder = "desc",
  filterBy = "all",
  additionalFilters = {},
  groupByEmne = false,
}) => {
  // Build query key for stable caching
  const queryKey = [
    entityType,
    "workspace",
    "paginated",
    page,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    filterBy,
    additionalFilters,
    groupByEmne,
  ];

  // Choose the appropriate query function based on grouping
  const queryFunction =
    groupByEmne && modelConfig.queryFnGroupedByEmne ? modelConfig.queryFnGroupedByEmne : modelConfig.queryFnAll || modelConfig.queryFn;

  // Fetch data with React Query
  const {
    data: rawData,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => queryFunction(page, pageSize, searchQuery, sortBy, sortOrder),
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
    keepPreviousData: true, // Keep showing old data while fetching new
  });

  // Process data consistently
  const processedData = useMemo(() => {
    if (!rawData) return { items: [], stats: {}, totalPages: 0 };

    // Extract data from axios response if needed
    const responseData = rawData.data || rawData;
    let items = responseData.items || responseData.rows || [];
    const total = responseData.totalCount || responseData.count || 0;

    // Apply additional filters client-side
    if (additionalFilters && Object.keys(additionalFilters).length > 0) {
      const filterItems = (itemsList) => {
        return itemsList.filter((item) => {
          // Status filter
          if (additionalFilters.status && additionalFilters.status !== "all") {
            let itemStatus;
            if (typeof item.status === "string") {
              itemStatus = item.status;
            } else if (typeof item.status === "object" && item.status !== null) {
              itemStatus =
                item.status.navn ||
                item.status.name ||
                item.status.label ||
                item.status.value ||
                item.status.title ||
                item.status.text ||
                item.status.displayName;
            }
            if (itemStatus !== additionalFilters.status) {
              return false;
            }
          }

          // Vurdering filter
          if (additionalFilters.vurdering && additionalFilters.vurdering !== "all") {
            let itemVurdering;
            if (typeof item.vurdering === "string") {
              itemVurdering = item.vurdering;
            } else if (typeof item.vurdering === "object" && item.vurdering !== null) {
              itemVurdering =
                item.vurdering.navn ||
                item.vurdering.name ||
                item.vurdering.label ||
                item.vurdering.value ||
                item.vurdering.title ||
                item.vurdering.text ||
                item.vurdering.displayName;
            }
            if (itemVurdering !== additionalFilters.vurdering) {
              return false;
            }
          }

          // Priority filter
          if (additionalFilters.priority && additionalFilters.priority !== "all") {
            const priorityValue = item.prioritet || item.priority;
            if (priorityValue) {
              let priorityCategory;
              if (priorityValue <= 2) {
                priorityCategory = "høy";
              } else if (priorityValue === 3) {
                priorityCategory = "medium";
              } else {
                priorityCategory = "lav";
              }

              if (priorityCategory !== additionalFilters.priority) {
                return false;
              }
            } else if (additionalFilters.priority !== "all") {
              // Item has no priority but filter is set
              return false;
            }
          }

          return true;
        });
      };

      if (groupByEmne) {
        // For grouped data, filter within each group
        items = items.map((group) => {
          const newGroup = { ...group };
          if (group[entityType]) {
            newGroup[entityType] = filterItems(group[entityType]);
          } else if (group.entities) {
            // Support for combined entities with "entities" property
            newGroup.entities = filterItems(group.entities);
          } else if (group.krav) {
            // Legacy support for krav
            newGroup.krav = filterItems(group.krav);
          } else if (group.tiltak) {
            // Legacy support for tiltak
            newGroup.tiltak = filterItems(group.tiltak);
          }
          return newGroup;
        });
      } else {
        // For flat data, filter directly
        items = filterItems(items);
      }
    }

    // Apply main filterBy filtering client-side
    if (filterBy && filterBy !== "all") {
      const mainFilterItems = (itemsList) => {
        return itemsList.filter((item) => {
          if (filterBy === "obligatorisk") {
            return item.obligatorisk === true;
          } else if (filterBy === "optional") {
            return item.obligatorisk === false || item.obligatorisk === null || item.obligatorisk === undefined;
          }
          return true;
        });
      };

      if (groupByEmne) {
        // For grouped data, filter within each group
        items = items.map((group) => {
          const newGroup = { ...group };
          if (group[entityType]) {
            newGroup[entityType] = mainFilterItems(group[entityType]);
          } else if (group.entities) {
            // Support for combined entities with "entities" property
            newGroup.entities = mainFilterItems(group.entities);
          } else if (group.krav) {
            newGroup.krav = mainFilterItems(group.krav);
          } else if (group.tiltak) {
            newGroup.tiltak = mainFilterItems(group.tiltak);
          }
          return newGroup;
        });
      } else {
        // For flat data, filter directly
        items = mainFilterItems(items);
      }
    }

    const totalPages = responseData.totalPages || Math.ceil(total / pageSize);

    // Calculate statistics based on entity type
    const stats = {
      total,
    };

    // Add obligatory stats if the entity supports it
    if (items.length > 0 && items[0].obligatorisk !== undefined) {
      if (groupByEmne) {
        // For grouped data, count across all groups
        let obligatoriskCount = 0;
        items.forEach((group) => {
          if (group[entityType]) {
            obligatoriskCount += group[entityType].filter((item) => item.obligatorisk).length;
          } else if (group.entities) {
            // Support for combined entities with "entities" property
            obligatoriskCount += group.entities.filter((item) => item.obligatorisk).length;
          } else if (group.krav) {
            // Legacy support for krav
            obligatoriskCount += group.krav.filter((item) => item.obligatorisk).length;
          } else if (group.tiltak) {
            // Legacy support for tiltak
            obligatoriskCount += group.tiltak.filter((item) => item.obligatorisk).length;
          }
        });
        stats.obligatorisk = obligatoriskCount;
        stats.optional = total - obligatoriskCount;
      } else {
        // For flat data
        stats.obligatorisk = items.filter((item) => item.obligatorisk).length;
        stats.optional = total - stats.obligatorisk;
      }
    }

    return { items, stats, totalPages };
  }, [rawData, pageSize, groupByEmne, entityType, additionalFilters, filterBy]);

  return {
    items: processedData.items,
    stats: processedData.stats,
    totalPages: processedData.totalPages,
    isLoading,
    error,
    isFetching,
    refetch,
  };
};
