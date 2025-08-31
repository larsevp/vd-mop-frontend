import { useMemo } from "react";
import { EntityFilterService } from "../services/EntityFilterService";

/**
 * useEntityFiltering - Specialized filtering hook following SRP
 * Single responsibility: Filter extraction, application, and management
 */
export const useEntityFiltering = ({
  items,
  entityType,
  groupByEmne = false,
  filters = {},
  additionalFilters = {}
}) => {
  // Extract available filter options from data
  const availableFilters = useMemo(() => {
    return EntityFilterService.extractAvailableFilters(items, entityType);
  }, [items, entityType]);

  // Combine all filters
  const combinedFilters = useMemo(() => {
    return {
      ...filters,
      ...additionalFilters
    };
  }, [filters, additionalFilters]);

  // Apply filters to items
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return items;
    
    return EntityFilterService.applyFilters(
      items, 
      combinedFilters, 
      entityType, 
      groupByEmne
    );
  }, [items, combinedFilters, entityType, groupByEmne]);

  // Calculate statistics for filtered items
  const filteredStats = useMemo(() => {
    return EntityFilterService.calculateStats(
      filteredItems, 
      entityType, 
      groupByEmne
    );
  }, [filteredItems, entityType, groupByEmne]);

  // Determine if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(combinedFilters).some(key => {
      const value = combinedFilters[key];
      return value && value !== 'all' && value !== '';
    });
  }, [combinedFilters]);

  // Get filter summary for display
  const filterSummary = useMemo(() => {
    const activeFilters = [];
    
    Object.entries(combinedFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        const filterName = {
          'status': 'Status',
          'vurdering': 'Vurdering',
          'priority': 'Prioritet',
          'filterBy': 'Type'
        }[key] || key;
        
        activeFilters.push(`${filterName}: ${value}`);
      }
    });
    
    return activeFilters;
  }, [combinedFilters]);

  // Helper function to check if a specific filter is active
  const isFilterActive = (filterKey) => {
    const value = combinedFilters[filterKey];
    return value && value !== 'all' && value !== '';
  };

  // Helper function to get filter display value
  const getFilterDisplayValue = (filterKey) => {
    return combinedFilters[filterKey] || 'all';
  };

  return {
    // Processed data
    filteredItems,
    filteredStats,
    
    // Available filter options
    availableStatuses: availableFilters.statuses,
    availableVurderinger: availableFilters.vurderinger,
    availableEmner: availableFilters.emner,
    availablePriorities: availableFilters.priorities,
    
    // Filter state info
    hasActiveFilters,
    filterSummary,
    activeFilterCount: filterSummary.length,
    
    // Helper functions
    isFilterActive,
    getFilterDisplayValue,
    
    // Raw data for advanced usage
    combinedFilters,
    availableFilters
  };
};

export default useEntityFiltering;