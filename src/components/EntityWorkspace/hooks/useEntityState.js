import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * useEntityState - UI state management hook following SRP
 * Single responsibility: Manage UI state for entity workspace
 */
export const useEntityState = ({
  entityType,
  initialConfig = {}
}) => {
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialConfig.pageSize || 50);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Sorting state
  const [sortBy, setSortBy] = useState(initialConfig.sortBy || "updatedAt");
  const [sortOrder, setSortOrder] = useState(initialConfig.sortOrder || "desc");

  // Filtering state
  const [filterBy, setFilterBy] = useState("all");
  const [additionalFilters, setAdditionalFilters] = useState({});

  // View mode state
  const [viewMode, setViewMode] = useState(initialConfig.viewMode || "grid");

  // Grouping and display options (with localStorage persistence)
  const [groupByEmne, setGroupByEmne] = useState(() => {
    try {
      const saved = localStorage.getItem(`${entityType}-groupByEmne`);
      if (!saved || saved === "undefined" || saved === "null") {
        return initialConfig.groupByEmne ?? true;
      }
      return JSON.parse(saved);
    } catch (error) {
      console.warn("Failed to parse groupByEmne from localStorage:", error);
      return initialConfig.groupByEmne ?? true;
    }
  });

  const [showMerknader, setShowMerknader] = useState(() => {
    try {
      const saved = localStorage.getItem(`${entityType}-showMerknader`);
      if (!saved || saved === "undefined" || saved === "null") {
        return initialConfig.showMerknader ?? false;
      }
      return JSON.parse(saved);
    } catch (error) {
      console.warn("Failed to parse showMerknader from localStorage:", error);
      return initialConfig.showMerknader ?? false;
    }
  });

  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  // Card/entity expansion states
  const [expandedCards, setExpandedCards] = useState(new Map());
  const [activeEntity, setActiveEntity] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(`${entityType}-groupByEmne`, JSON.stringify(groupByEmne));
  }, [entityType, groupByEmne]);

  useEffect(() => {
    localStorage.setItem(`${entityType}-showMerknader`, JSON.stringify(showMerknader));
  }, [entityType, showMerknader]);

  // Search handlers
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
    setPage(1); // Reset to first page on search
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }, []);

  const handleSearchInputChange = useCallback((value) => {
    setSearchInput(value);
  }, []);

  // Filter handlers
  const handleFilterChange = useCallback((newFilterBy) => {
    setFilterBy(newFilterBy);
    setPage(1); // Reset to first page on filter change
  }, []);

  const handleAdditionalFiltersChange = useCallback((newFilters) => {
    setAdditionalFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  }, []);

  // Sorting handlers
  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    setPage(1); // Reset to first page on sort change
  }, []);

  const handleSortOrderChange = useCallback((newSortOrder) => {
    setSortOrder(newSortOrder);
    setPage(1); // Reset to first page on sort change
  }, []);

  // Group collapse handlers
  const toggleGroupCollapse = useCallback((groupKey) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const collapseAllGroups = useCallback((groupKeys) => {
    setCollapsedGroups(new Set(groupKeys));
  }, []);

  const expandAllGroups = useCallback(() => {
    setCollapsedGroups(new Set());
  }, []);

  // Card expansion handlers
  const handleExpandCard = useCallback((entity, mode = "view") => {
    setExpandedCards((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(entity.id) && newMap.get(entity.id) === mode) {
        // If already expanded in same mode, collapse it
        newMap.delete(entity.id);
        // If we're collapsing and this was the active entity, clear it
        if (activeEntity?.id === entity.id) {
          setActiveEntity(null);
        }
      } else {
        // Expand in specified mode
        newMap.set(entity.id, mode);
        // Only set as active if it's not just a view expansion
        if (mode === "edit" || mode === "create" || !activeEntity) {
          setActiveEntity(entity);
        }
      }
      return newMap;
    });
  }, [activeEntity]);

  const handleCollapseCard = useCallback((entityId) => {
    setExpandedCards((prev) => {
      const newMap = new Map(prev);
      newMap.delete(entityId);
      return newMap;
    });
    // If we're collapsing the active entity, clear it
    if (activeEntity?.id === entityId) {
      setActiveEntity(null);
    }
  }, [activeEntity]);

  const handleCreateNew = useCallback((user) => {
    const createEntity = { id: "create-new", enhetId: user?.enhetId };
    setExpandedCards((prev) => {
      const newMap = new Map(prev);
      newMap.set("create-new", "create");
      return newMap;
    });
    setActiveEntity(createEntity);
  }, []);

  // Toast handlers
  const showToast = useCallback((message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Reset handlers
  const resetFilters = useCallback(() => {
    setFilterBy("all");
    setAdditionalFilters({});
    setPage(1);
  }, []);

  const resetSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }, []);

  const resetSorting = useCallback(() => {
    setSortBy(initialConfig.sortBy || "updatedAt");
    setSortOrder(initialConfig.sortOrder || "desc");
    setPage(1);
  }, [initialConfig]);

  // Computed state
  const hasActiveSearch = searchQuery.trim() !== "";
  const hasActiveFilters = filterBy !== "all" || Object.keys(additionalFilters).length > 0;
  const hasActiveSettings = hasActiveSearch || hasActiveFilters;

  const isCardExpanded = useCallback((entityId) => {
    return expandedCards.has(entityId);
  }, [expandedCards]);

  const getCardExpandMode = useCallback((entityId) => {
    return expandedCards.get(entityId) || null;
  }, [expandedCards]);

  return {
    // Pagination
    page,
    setPage,
    pageSize,

    // Search
    searchQuery,
    searchInput,
    handleSearch,
    handleClearSearch,
    handleSearchInputChange,
    hasActiveSearch,

    // Sorting
    sortBy,
    sortOrder,
    handleSortChange,
    handleSortOrderChange,

    // Filtering
    filterBy,
    additionalFilters,
    handleFilterChange,
    handleAdditionalFiltersChange,
    hasActiveFilters,

    // View options
    viewMode,
    setViewMode,
    groupByEmne,
    setGroupByEmne,
    showMerknader,
    setShowMerknader,

    // Group management
    collapsedGroups,
    toggleGroupCollapse,
    collapseAllGroups,
    expandAllGroups,

    // Entity/card management
    expandedCards,
    activeEntity,
    setActiveEntity,
    handleExpandCard,
    handleCollapseCard,
    handleCreateNew,
    isCardExpanded,
    getCardExpandMode,

    // Toast
    toast,
    showToast,
    hideToast,

    // Reset functions
    resetFilters,
    resetSearch,
    resetSorting,

    // Computed state
    hasActiveSettings,

    // Raw state for advanced usage
    state: useMemo(() => ({
      page,
      pageSize,
      searchQuery,
      searchInput,
      sortBy,
      sortOrder,
      filterBy,
      additionalFilters,
      viewMode,
      groupByEmne,
      showMerknader,
      collapsedGroups,
      expandedCards,
      activeEntity,
      toast
    }), [
      page, pageSize, searchQuery, searchInput, sortBy, sortOrder,
      filterBy, additionalFilters, viewMode, groupByEmne, showMerknader,
      collapsedGroups, expandedCards, activeEntity, toast
    ])
  };
};

export default useEntityState;