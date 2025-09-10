/**
 * useWorkspaceUI - Combined UI state hook
 * 
 * Provides a clean interface to the UI state store.
 * Returns stable selectors to prevent re-render loops.
 */

import { useWorkspaceUIStore } from '../stores/workspaceUIStore';

/**
 * Main UI state hook - provides stable selectors
 */
export const useWorkspaceUI = () => {
  // Selection state
  const selectedEntity = useWorkspaceUIStore(state => state.selectedEntity);
  const selectedEntities = useWorkspaceUIStore(state => state.selectedEntities);
  const focusedEntity = useWorkspaceUIStore(state => state.focusedEntity);
  
  // Search & filter state  
  const searchInput = useWorkspaceUIStore(state => state.searchInput);
  const activeSearchQuery = useWorkspaceUIStore(state => state.activeSearchQuery);
  const filters = useWorkspaceUIStore(state => state.filters);
  
  // UI state
  const showFilters = useWorkspaceUIStore(state => state.showFilters);
  const showBulkActions = useWorkspaceUIStore(state => state.showBulkActions);
  const viewMode = useWorkspaceUIStore(state => state.viewMode);
  
  // Expansion state
  const expandedEntities = useWorkspaceUIStore(state => state.expandedEntities);
  const collapsedSections = useWorkspaceUIStore(state => state.collapsedSections);
  
  // Actions (these are stable from Zustand)
  const setSelectedEntity = useWorkspaceUIStore(state => state.setSelectedEntity);
  const clearSelection = useWorkspaceUIStore(state => state.clearSelection);
  const setSelectedEntities = useWorkspaceUIStore(state => state.setSelectedEntities);
  const toggleEntitySelection = useWorkspaceUIStore(state => state.toggleEntitySelection);
  const setFocusedEntity = useWorkspaceUIStore(state => state.setFocusedEntity);
  
  const setSearchInput = useWorkspaceUIStore(state => state.setSearchInput);
  const setActiveSearchQuery = useWorkspaceUIStore(state => state.setActiveSearchQuery);
  const executeSearch = useWorkspaceUIStore(state => state.executeSearch);
  const setFilters = useWorkspaceUIStore(state => state.setFilters);
  const resetFilters = useWorkspaceUIStore(state => state.resetFilters);
  
  const setShowFilters = useWorkspaceUIStore(state => state.setShowFilters);
  const toggleFilters = useWorkspaceUIStore(state => state.toggleFilters);
  const setShowBulkActions = useWorkspaceUIStore(state => state.setShowBulkActions);
  const setViewMode = useWorkspaceUIStore(state => state.setViewMode);
  
  const toggleEntityExpansion = useWorkspaceUIStore(state => state.toggleEntityExpansion);
  const expandEntity = useWorkspaceUIStore(state => state.expandEntity);
  const collapseEntity = useWorkspaceUIStore(state => state.collapseEntity);
  const toggleSectionCollapse = useWorkspaceUIStore(state => state.toggleSectionCollapse);
  
  const reset = useWorkspaceUIStore(state => state.reset);
  const getState = useWorkspaceUIStore(state => state.getState);
  const getDebugInfo = useWorkspaceUIStore(state => state.getDebugInfo);

  return {
    // State
    selectedEntity,
    selectedEntities,
    focusedEntity,
    searchInput,
    activeSearchQuery,
    filters,
    showFilters,
    showBulkActions,
    viewMode,
    expandedEntities,
    collapsedSections,
    
    // Selection actions
    setSelectedEntity,
    clearSelection,
    setSelectedEntities,
    toggleEntitySelection,
    setFocusedEntity,
    
    // Search & filter actions
    setSearchInput,
    setActiveSearchQuery,
    executeSearch,
    setFilters,
    resetFilters,
    
    // UI state actions
    setShowFilters,
    toggleFilters,
    setShowBulkActions,
    setViewMode,
    
    // Expansion actions
    toggleEntityExpansion,
    expandEntity,
    collapseEntity,
    toggleSectionCollapse,
    
    // Utility actions
    reset,
    getState,
    getDebugInfo,
    
    // Computed state helpers
    hasSelectedEntities: selectedEntities.size > 0,
    hasActiveFilters: filters.filterBy !== 'all' || Object.keys(filters.additionalFilters || {}).length > 0,
    selectedEntitiesCount: selectedEntities.size,
    expandedEntitiesCount: expandedEntities.size
  };
};

/**
 * Hook for just selection state (lighter)
 */
export const useEntitySelection = () => {
  const selectedEntity = useWorkspaceUIStore(state => state.selectedEntity);
  const selectedEntities = useWorkspaceUIStore(state => state.selectedEntities);
  const setSelectedEntity = useWorkspaceUIStore(state => state.setSelectedEntity);
  const clearSelection = useWorkspaceUIStore(state => state.clearSelection);
  
  return {
    selectedEntity,
    selectedEntities,
    setSelectedEntity,
    clearSelection,
    hasSelection: !!selectedEntity || selectedEntities.size > 0
  };
};

/**
 * Hook for just search/filter state (lighter)
 */
export const useSearchFilters = () => {
  const searchQuery = useWorkspaceUIStore(state => state.searchQuery);
  const filters = useWorkspaceUIStore(state => state.filters);
  const setSearchQuery = useWorkspaceUIStore(state => state.setSearchQuery);
  const setFilters = useWorkspaceUIStore(state => state.setFilters);
  const resetFilters = useWorkspaceUIStore(state => state.resetFilters);
  
  return {
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
    hasActiveFilters: filters.filterBy !== 'all' || Object.keys(filters.additionalFilters || {}).length > 0
  };
};

export default useWorkspaceUI;