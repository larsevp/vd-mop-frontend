/**
 * createWorkspaceUIHook - Factory for workspace-scoped UI hooks
 *
 * Creates workspace-specific UI hooks that provide a clean interface to the UI state store.
 * Returns stable selectors to prevent re-render loops.
 */

/**
 * Factory function to create workspace-scoped UI hooks
 *
 * @param {Function} useUIStore - The workspace-specific UI store hook
 * @returns {Object} Object containing UI hooks for the specific workspace
 */
export const createWorkspaceUIHook = (useUIStore) => {
  /**
   * Main UI state hook - provides stable selectors
   */
  const useWorkspaceUI = () => {
    // Selection state
    const selectedEntity = useUIStore(state => state.selectedEntity);
    const selectedEntities = useUIStore(state => state.selectedEntities);
    const selectedEntitiesMetadata = useUIStore(state => state.selectedEntitiesMetadata);
    const focusedEntity = useUIStore(state => state.focusedEntity);
    const selectionMode = useUIStore(state => state.selectionMode);

    // Search & filter state
    const searchInput = useUIStore(state => state.searchInput);
    const activeSearchQuery = useUIStore(state => state.activeSearchQuery);
    const filters = useUIStore(state => state.filters);

    // UI state
    const showFilters = useUIStore(state => state.showFilters);
    const showBulkActions = useUIStore(state => state.showBulkActions);
    const viewMode = useUIStore(state => state.viewMode);

    // Expansion state
    const expandedEntities = useUIStore(state => state.expandedEntities);
    const collapsedSections = useUIStore(state => state.collapsedSections);

    // Actions (these are stable from Zustand)
    const setSelectedEntity = useUIStore(state => state.setSelectedEntity);
    const clearSelection = useUIStore(state => state.clearSelection);
    const setSelectedEntities = useUIStore(state => state.setSelectedEntities);
    const toggleEntitySelection = useUIStore(state => state.toggleEntitySelection);
    const setFocusedEntity = useUIStore(state => state.setFocusedEntity);
    const setSelectionMode = useUIStore(state => state.setSelectionMode);
    const toggleSelectionMode = useUIStore(state => state.toggleSelectionMode);
    const selectAll = useUIStore(state => state.selectAll);

    const setSearchInput = useUIStore(state => state.setSearchInput);
    const setActiveSearchQuery = useUIStore(state => state.setActiveSearchQuery);
    const executeSearch = useUIStore(state => state.executeSearch);
    const setFilters = useUIStore(state => state.setFilters);
    const resetFilters = useUIStore(state => state.resetFilters);

    const setShowFilters = useUIStore(state => state.setShowFilters);
    const toggleFilters = useUIStore(state => state.toggleFilters);
    const setShowBulkActions = useUIStore(state => state.setShowBulkActions);
    const setViewMode = useUIStore(state => state.setViewMode);

    const toggleEntityExpansion = useUIStore(state => state.toggleEntityExpansion);
    const expandEntity = useUIStore(state => state.expandEntity);
    const collapseEntity = useUIStore(state => state.collapseEntity);
    const toggleSectionCollapse = useUIStore(state => state.toggleSectionCollapse);

    const reset = useUIStore(state => state.reset);
    const getState = useUIStore(state => state.getState);
    const getDebugInfo = useUIStore(state => state.getDebugInfo);

    return {
      // State
      selectedEntity,
      selectedEntities,
      selectedEntitiesMetadata,
      focusedEntity,
      selectionMode,
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
      setSelectionMode,
      toggleSelectionMode,
      selectAll,

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
  const useEntitySelection = () => {
    const selectedEntity = useUIStore(state => state.selectedEntity);
    const selectedEntities = useUIStore(state => state.selectedEntities);
    const setSelectedEntity = useUIStore(state => state.setSelectedEntity);
    const clearSelection = useUIStore(state => state.clearSelection);

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
  const useSearchFilters = () => {
    const searchInput = useUIStore(state => state.searchInput);
    const activeSearchQuery = useUIStore(state => state.activeSearchQuery);
    const filters = useUIStore(state => state.filters);
    const setSearchInput = useUIStore(state => state.setSearchInput);
    const setActiveSearchQuery = useUIStore(state => state.setActiveSearchQuery);
    const executeSearch = useUIStore(state => state.executeSearch);
    const setFilters = useUIStore(state => state.setFilters);
    const resetFilters = useUIStore(state => state.resetFilters);

    return {
      searchInput,
      activeSearchQuery,
      filters,
      setSearchInput,
      setActiveSearchQuery,
      executeSearch,
      setFilters,
      resetFilters,
      hasActiveFilters: filters.filterBy !== 'all' || Object.keys(filters.additionalFilters || {}).length > 0
    };
  };

  return {
    useWorkspaceUI,
    useEntitySelection,
    useSearchFilters
  };
};

export default createWorkspaceUIHook;