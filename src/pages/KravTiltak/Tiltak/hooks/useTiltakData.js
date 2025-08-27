import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";

/**
 * Custom hook for managing Tiltak data fetching and processing
 * Provides consistent data structure and performance optimizations
 */
export const useTiltakData = ({ 
  page = 1, 
  pageSize = 50, 
  searchQuery = "", 
  sortBy = "updatedAt", 
  sortOrder = "desc", 
  filterBy = "all",
  groupByEmne = false 
}) => {
  // Build query key for stable caching
  const queryKey = [
    "tiltak",
    "paginated", 
    page, 
    pageSize, 
    searchQuery, 
    sortBy, 
    sortOrder, 
    filterBy,
    groupByEmne
  ];

  // Choose the appropriate query function
  const queryFunction = groupByEmne ? tiltakConfig.queryFnGroupedByEmne : tiltakConfig.queryFnAll;

  // Fetch data with React Query
  const {
    data: rawData,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => queryFunction(
      page, 
      pageSize, 
      searchQuery, 
      sortBy, 
      sortOrder
    ),
    staleTime: 30 * 1000, // 30 seconds - conservative caching
    keepPreviousData: true, // Keep showing old data while fetching new
  });

  // Process data consistently
  const processedData = useMemo(() => {
    console.log("useTiltakData DEBUG - rawData:", rawData);
    
    if (!rawData) return { items: [], stats: {}, totalPages: 0 };

    // Extract data from axios response
    const responseData = rawData.data || rawData;
    const items = responseData.items || responseData.rows || [];
    const total = responseData.totalCount || responseData.count || 0;
    
    console.log("useTiltakData DEBUG - processed:", { responseData, items, itemsLength: items.length, total, groupByEmne });
    const totalPages = responseData.totalPages || Math.ceil(total / pageSize);

    // Calculate statistics
    const stats = {
      total,
      obligatorisk: items.filter(item => 
        groupByEmne 
          ? item.krav?.some(k => k.obligatorisk) 
          : item.obligatorisk
      ).length,
      optional: total - (items.filter(item => 
        groupByEmne 
          ? item.krav?.some(k => k.obligatorisk) 
          : item.obligatorisk
      ).length),
    };

    return { items, stats, totalPages };
  }, [rawData, pageSize, groupByEmne]);

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