import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";

/**
 * Custom hook for fetching and processing Krav data
 * Separates data concerns from UI logic
 * @param {Object} params - Query parameters
 * @param {boolean} includeAllFields - Whether to include all fields (for detail views) or exclude heavy fields (for list views)
 */
export const useKravData = (params, includeAllFields = false) => {
  const { page, pageSize, searchQuery, sortBy, sortOrder, filterBy, groupByEmne } = params;

  // Ensure parameters are the correct types
  const normalizedPage = Number(page) || 1;
  const normalizedPageSize = Number(pageSize) || 10;
  const normalizedSearchQuery = searchQuery || "";
  const normalizedSortBy = sortBy || "";
  const normalizedSortOrder = sortOrder || "asc";

  // Choose query function based on grouping preference and field requirements
  const queryFunction = groupByEmne ? kravConfig.queryFnGroupedByEmne : includeAllFields ? kravConfig.queryFnAll : kravConfig.queryFn;

  // Main data query with very conservative fetching
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: [
      "krav-workspace",
      {
        page: normalizedPage,
        pageSize: normalizedPageSize,
        searchQuery: normalizedSearchQuery,
        sortBy: normalizedSortBy,
        sortOrder: normalizedSortOrder,
        filterBy,
        groupByEmne, // Include in query key for proper caching
        includeAllFields, // Include this in query key so cached data is separate
      },
    ],
    queryFn: async () => {
      const response = await queryFunction(
        normalizedPage,
        normalizedPageSize,
        normalizedSearchQuery,
        normalizedSortBy,
        normalizedSortOrder
      );

      // Return the data portion of the axios response
      return response?.data;
    },
    retry: (failureCount, error) => {
      // Don't retry 429 errors immediately
      if (error?.response?.status === 429) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Process data
  const processedData = useMemo(() => {
    const rawData = data?.items || [];

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return {
        items: [],
        stats: { total: 0, obligatorisk: 0, optional: 0 },
      };
    }

    if (groupByEmne) {
      // Process grouped data structure: [ { emne: {...}, krav: [...] } ]
      let allKrav = [];

      // Extract all krav from all groups
      rawData.forEach((group) => {
        if (group.krav && Array.isArray(group.krav)) {
          allKrav = allKrav.concat(group.krav);
        }
      });

      // Apply filtering to all krav
      let filteredKrav = allKrav;
      if (filterBy === "obligatorisk") {
        filteredKrav = allKrav.filter((k) => k.obligatorisk === true);
      } else if (filterBy === "optional") {
        filteredKrav = allKrav.filter((k) => k.obligatorisk === false);
      }

      // Re-group filtered krav by emne
      const filteredGroups = rawData
        .map((group) => {
          const filteredGroupKrav = group.krav.filter((krav) => filteredKrav.some((filtered) => filtered.id === krav.id));

          return {
            ...group,
            krav: filteredGroupKrav.map((krav) => ({
              ...krav,
              childrenCount: allKrav.filter((k) => k.parentId === krav.id).length,
              filesCount: krav.files?.length || 0,
              parentKrav: krav.parentId ? allKrav.find((k) => k.id === krav.parentId) : null,
            })),
          };
        })
        .filter((group) => group.krav.length > 0); // Remove empty groups

      const stats = {
        total: allKrav.length,
        obligatorisk: allKrav.filter((k) => k.obligatorisk === true).length,
        optional: allKrav.filter((k) => k.obligatorisk === false).length,
      };

      return { items: filteredGroups, stats };
    } else {
      // Process flat data structure: [ krav, krav, ... ]
      // Client-side filtering
      let filtered = rawData;
      if (filterBy === "obligatorisk") {
        filtered = rawData.filter((k) => k.obligatorisk === true);
      } else if (filterBy === "optional") {
        filtered = rawData.filter((k) => k.obligatorisk === false);
      }

      // Hierarchical sort
      const sorted = [...filtered].sort((a, b) => {
        if (!a.parentId && !b.parentId) return (a.id || 0) - (b.id || 0);
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;
        if (a.parentId && b.parentId) {
          if (a.parentId !== b.parentId) return a.parentId - b.parentId;
          return (a.id || 0) - (b.id || 0);
        }
        return 0;
      });

      // Add calculated fields
      const enriched = sorted.map((krav) => ({
        ...krav,
        childrenCount: rawData.filter((k) => k.parentId === krav.id).length,
        filesCount: krav.files?.length || 0,
        parentKrav: krav.parentId ? rawData.find((k) => k.id === krav.parentId) : null,
      }));

      const stats = {
        total: rawData.length,
        obligatorisk: rawData.filter((k) => k.obligatorisk === true).length,
        optional: rawData.filter((k) => k.obligatorisk === false).length,
      };

      return { items: enriched, stats };
    }
  }, [data?.items, filterBy, groupByEmne]);

  return {
    isLoading,
    error,
    isFetching,
    ...processedData,
    totalPages: data?.totalPages || 1,
  };
};
