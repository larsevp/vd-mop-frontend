import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, FileText, CheckCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Model config
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";

// Custom hooks
import { useKravData } from "./hooks/useKravData";
import { useKravActions } from "./hooks/useKravActions";
import { useUserStore } from "@/stores/userStore";

// Components
import KravSearchBar from "./components/KravSearchBar";
import KravFilters from "./components/KravFilters";
import KravCardController from "./components/KravCardController";
import ViewOptionsMenu from "./components/ViewOptionsMenu";
import { Toast } from "@/components/ui/editor/components/Toast.jsx";
import { updateKravStatus, updateKravVurdering, updateKrav } from "@/api/endpoints";

/**
 * Refactored KravWorkspace with proper separation of concerns
 * - Custom hooks for data and actions
 * - Smaller, focused components
 * - Better state management
 * - Cleaner code organization
 */
const KravWorkspace = () => {
  const queryClient = useQueryClient();

  // Helper function to render Lucide icons dynamically
  const renderLucideIcon = useCallback((iconName, size = 20) => {
    if (!iconName) return null;

    // Convert icon name to PascalCase if needed
    const formattedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    const IconComponent = LucideIcons[formattedIconName] || LucideIcons[iconName];

    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in Lucide icons`);
      return null;
    }

    return <IconComponent size={size} />;
  }, []);
  // UI State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [groupByEmne, setGroupByEmne] = useState(() => {
    const saved = localStorage.getItem("krav-groupByEmne");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showMerknader, setShowMerknader] = useState(() => {
    const saved = localStorage.getItem("krav-showMerknader");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [collapsedGroups, setCollapsedGroups] = useState(new Set()); // Track collapsed groups
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  // Card expansion states
  const [expandedCards, setExpandedCards] = useState(new Map()); // Map of kravId -> mode ('view', 'edit')
  const [activeKrav, setActiveKrav] = useState(null);

  // User store
  const { user } = useUserStore();

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("krav-groupByEmne", JSON.stringify(groupByEmne));
  }, [groupByEmne]);

  useEffect(() => {
    localStorage.setItem("krav-showMerknader", JSON.stringify(showMerknader));
  }, [showMerknader]);

  // Data and actions hooks
  const { items, stats, isLoading, error, isFetching, totalPages } = useKravData({
    page,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    filterBy,
    groupByEmne, // Pass grouping option to data hook
  });

  const showToast = useCallback((message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  }, []);

  const { confirmDelete, handleSave } = useKravActions(showToast, showToast);

  // Handler for merknad-only updates
  const handleMerknadUpdate = useCallback((kravId, newMerknader) => {
    // Update the local cache/state to reflect the merknad change
    // This ensures the UI shows the updated value immediately

    // If we have an active krav that matches, update it
    setActiveKrav((prev) => {
      if (prev && prev.id === kravId) {
        return { ...prev, merknader: newMerknader };
      }
      return prev;
    });

    // Note: The items list from useKravData will be updated on next refresh
    // For immediate UI updates, we rely on the krav object mutation in MerknadField
  }, []);

  // Handler for status updates
  const handleStatusChange = useCallback(
    async (kravId, newStatusId) => {
      try {
        // Use dedicated status update endpoint
        await updateKravStatus(kravId, newStatusId);

        // Update local state - find and update the krav in items array
        setActiveKrav((prev) => {
          if (prev && prev.id === kravId) {
            return { ...prev, statusId: newStatusId };
          }
          return prev;
        });

        // Invalidate queries to trigger refetch and update UI
        queryClient.invalidateQueries(["krav"]);
        queryClient.invalidateQueries(["krav", kravId]);

        showToast("Status oppdatert", "success");
      } catch (error) {
        console.error("Error updating status:", error);
        showToast("Kunne ikke oppdatere status", "error");
      }
    },
    [showToast, queryClient]
  );

  // Handler for vurdering updates
  const handleVurderingChange = useCallback(
    async (kravId, newVurderingId) => {
      try {
        // Use dedicated vurdering update endpoint
        await updateKravVurdering(kravId, newVurderingId);

        // Update local state
        setActiveKrav((prev) => {
          if (prev && prev.id === kravId) {
            return { ...prev, vurderingId: newVurderingId };
          }
          return prev;
        });

        // Invalidate queries to trigger refetch and update UI
        queryClient.invalidateQueries(["krav"]);
        queryClient.invalidateQueries(["krav", kravId]);

        showToast("Vurdering oppdatert", "success");
      } catch (error) {
        console.error("Error updating vurdering:", error);
        showToast("Kunne ikke oppdatere vurdering", "error");
      }
    },
    [showToast, queryClient]
  );

  // Handler for prioritet updates
  // Handler for prioritet updates
  const handlePrioritetChange = useCallback(
    async (kravId, newPrioritet) => {
      try {
        // Use general update endpoint for prioritet
        await updateKrav({ id: kravId, prioritet: newPrioritet });

        // Update local state
        setActiveKrav((prev) => {
          if (prev && prev.id === kravId) {
            return { ...prev, prioritet: newPrioritet };
          }
          return prev;
        });

        // Invalidate queries to trigger refetch and update UI
        queryClient.invalidateQueries(["krav"]);
        queryClient.invalidateQueries(["krav", kravId]);

        showToast("Prioritet oppdatert", "success");
      } catch (error) {
        console.error("Error updating prioritet:", error);
        showToast("Kunne ikke oppdatere prioritet", "error");
      }
    },
    [showToast, queryClient]
  );

  // Group krav by Emne for structured display
  const groupedKrav = useMemo(() => {
    if (!items.length) return {};

    return items.reduce((groups, krav) => {
      const emneKey = krav.emne?.navn || "Ingen emne";
      if (!groups[emneKey]) {
        groups[emneKey] = {
          emne: krav.emne,
          krav: [],
        };
      }
      groups[emneKey].krav.push(krav);
      return groups;
    }, {});
  }, [items]);

  // Event handlers
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }, []);

  // Card expansion handlers
  const handleExpandCard = useCallback(
    (krav, mode = "view") => {
      setExpandedCards((prev) => {
        const newMap = new Map(prev);
        if (newMap.has(krav.id) && newMap.get(krav.id) === mode) {
          // If already expanded in same mode, collapse it
          newMap.delete(krav.id);
          // If we're collapsing and this was the active krav, clear it
          setActiveKrav((current) => (current?.id === krav.id ? null : current));
        } else {
          // Expand in specified mode
          newMap.set(krav.id, mode);
          // Only set as active if it's not just a view expansion or if no active krav exists
          if (mode === "edit" || mode === "create" || !activeKrav) {
            setActiveKrav(krav);
          }
        }
        return newMap;
      });
    },
    [activeKrav]
  );

  const handleCollapseCard = useCallback((kravId) => {
    setExpandedCards((prev) => {
      const newMap = new Map(prev);
      newMap.delete(kravId);
      return newMap;
    });
    // If we're collapsing the active krav, clear it
    setActiveKrav((current) => (current?.id === kravId ? null : current));
  }, []);

  const handleCreateNewKrav = useCallback(() => {
    // For create mode, we'll use a special ID
    const createKrav = { id: "create-new", enhetId: user?.enhetId };
    setExpandedCards((prev) => {
      const newMap = new Map(prev);
      newMap.set("create-new", "create");
      return newMap;
    });
    setActiveKrav(createKrav);
  }, [user?.enhetId]);

  const handleSaveKrav = useCallback(
    async (data) => {
      try {
        const savedKrav = await handleSave(data, !!data.id);

        // Update the active krav with saved data
        setActiveKrav(savedKrav);

        // Keep the card expanded but switch to view mode
        if (data.id === "create-new") {
          // For newly created krav, update the expansion map with the real ID
          setExpandedCards((prev) => {
            const newMap = new Map(prev);
            newMap.delete("create-new");
            newMap.set(savedKrav.id, "view");
            return newMap;
          });
        } else {
          // For existing krav, just update the mode to view
          setExpandedCards((prev) => {
            const newMap = new Map(prev);
            newMap.set(data.id, "view");
            return newMap;
          });
        }

        return savedKrav;
      } catch (error) {
        // Error handled by hook
        throw error;
      }
    },
    [handleSave]
  );

  const handleViewById = useCallback(
    async (kravId) => {
      try {
        // Always fetch full krav data to ensure we have all relationships
        // This is more reliable than trying to detect if we have "complete" data
        const fullKrav = await kravConfig.getByIdFn(kravId);
        setActiveKrav(fullKrav);
        handleExpandCard(fullKrav, "view");
      } catch (error) {
        console.error("Error fetching krav details:", error);
        // Fallback to existing data if available
        const fallbackKrav = items.find((k) => k.id === kravId);
        if (fallbackKrav) {
          setActiveKrav(fallbackKrav);
          handleExpandCard(fallbackKrav, "view");
        }
      }
    },
    [items, handleExpandCard]
  );

  // Toggle group collapse state
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

  // Loading state
  if (isLoading && !items.length) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Laster krav...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !items.length) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Feil ved lasting av krav</p>
          <Button onClick={() => window.location.reload()}>Prøv igjen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Kravhåndtering</h1>
              <div className="flex items-center gap-6 mt-1 text-sm text-neutral-600">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {stats.total} krav totalt
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  {stats.obligatorisk} obligatoriske
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {stats.optional} valgfrie
                </span>
              </div>
            </div>
            <Button onClick={handleCreateNewKrav} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nytt krav
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <KravSearchBar
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isLoading={isFetching}
            />

            <KravFilters
              filterBy={filterBy}
              onFilterChange={setFilterBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />

            {/* View Options Menu - replaces the old grouping toggle */}
            <ViewOptionsMenu
              groupByEmne={groupByEmne}
              onGroupByEmneChange={setGroupByEmne}
              showMerknader={showMerknader}
              onShowMerknaderChange={setShowMerknader}
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Create New Krav Card - Always show when in create mode */}
          {expandedCards.has("create-new") && (
            <KravCardController
              key="create-new"
              krav={{ id: "create-new", enhetId: user?.enhetId }}
              isExpanded={true}
              expandedMode="create"
              onExpand={handleExpandCard}
              onCollapse={handleCollapseCard}
              onEdit={() => {}}
              onDelete={() => {}}
              onSave={handleSaveKrav}
              onMerknadUpdate={handleMerknadUpdate}
              onStatusChange={handleStatusChange}
              onVurderingChange={handleVurderingChange}
              onPrioritetChange={handlePrioritetChange}
              onNavigateToKrav={handleViewById}
              showMerknader={showMerknader}
              showStatus={true}
              showVurdering={true}
              showPrioritet={true}
              filesCount={0}
              childrenCount={0}
              parentKrav={null}
            />
          )}

          {items.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 shadow-sm text-center">
              <FileText className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {searchQuery || filterBy !== "all" ? "Ingen krav funnet" : "Ingen krav ennå"}
              </h3>
              <p className="text-neutral-600 mb-6">
                {searchQuery || filterBy !== "all" ? "Prøv å justere søkekriteriene dine" : "Kom i gang ved å opprette ditt første krav"}
              </p>
              {!searchQuery && filterBy === "all" && (
                <Button onClick={handleCreateNewKrav} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Opprett første krav
                </Button>
              )}
            </div>
          ) : groupByEmne ? (
            // Grouped view - show Emne headings with Krav underneath
            <div className="space-y-8">
              {items.map((group) => {
                const groupKey = group.emne?.id || "no-emne";
                const isCollapsed = collapsedGroups.has(groupKey);

                return (
                  <div
                    key={groupKey}
                    className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    {/* Emne Header - Clickable to toggle collapse */}
                    <div
                      className="bg-gradient-to-r from-gray-50 to-white border-b border-neutral-200 p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleGroupCollapse(groupKey)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Collapse/Expand Icon */}
                        <div className="text-gray-500 hover:text-gray-700 transition-colors">
                          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>

                        {/* Emne Icon */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: group.emne?.color || "#6b7280" }}
                        >
                          {group.emne?.icon ? renderLucideIcon(group.emne.icon, 24) : <FileText size={24} />}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-neutral-900 mb-1">{group.emne?.tittel || "Ingen emne"}</h3>
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <span className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4" />
                              {group.krav.length} {group.krav.length === 1 ? "krav" : "krav"}
                            </span>
                            {group.emne?.beskrivelse && (
                              <span className="hidden sm:block">
                                {group.emne.beskrivelse.length > 60
                                  ? `${group.emne.beskrivelse.substring(0, 60)}...`
                                  : group.emne.beskrivelse}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Krav Cards - Collapsible */}
                    {!isCollapsed && (
                      <div className="p-6 space-y-4">
                        {group.krav.map((krav) => (
                          <KravCardController
                            key={krav.id}
                            krav={krav}
                            isExpanded={expandedCards.has(krav.id)}
                            expandedMode={expandedCards.get(krav.id) || "view"}
                            onExpand={handleExpandCard}
                            onCollapse={handleCollapseCard}
                            onEdit={(krav) => handleExpandCard(krav, "edit")}
                            onDelete={confirmDelete}
                            onSave={handleSaveKrav}
                            onMerknadUpdate={handleMerknadUpdate}
                            onStatusChange={handleStatusChange}
                            onVurderingChange={handleVurderingChange}
                            onPrioritetChange={handlePrioritetChange}
                            onNavigateToKrav={handleViewById}
                            showMerknader={showMerknader}
                            showStatus={true}
                            showVurdering={true}
                            showPrioritet={true}
                            filesCount={krav.filesCount}
                            childrenCount={krav.childrenCount}
                            parentKrav={krav.parentKrav}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Flat view - show all Krav as individual cards
            <div className="space-y-4">
              {items.map((krav) => (
                <KravCardController
                  key={krav.id}
                  krav={krav}
                  isExpanded={expandedCards.has(krav.id)}
                  expandedMode={expandedCards.get(krav.id) || "view"}
                  onExpand={handleExpandCard}
                  onCollapse={handleCollapseCard}
                  onEdit={(krav) => handleExpandCard(krav, "edit")}
                  onDelete={confirmDelete}
                  onSave={handleSaveKrav}
                  onMerknadUpdate={handleMerknadUpdate}
                  onStatusChange={handleStatusChange}
                  onVurderingChange={handleVurderingChange}
                  onPrioritetChange={handlePrioritetChange}
                  onNavigateToKrav={handleViewById}
                  showMerknader={showMerknader}
                  showStatus={true}
                  showVurdering={true}
                  showPrioritet={true}
                  filesCount={krav.filesCount}
                  childrenCount={krav.childrenCount}
                  parentKrav={krav.parentKrav}
                />
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        {items.length > 0 && (
          <div className="mt-8 text-center text-sm text-neutral-500">
            {groupByEmne
              ? `Viser ${items.length} ${items.length === 1 ? "emnegruppe" : "emnegrupper"} med totalt ${stats.total} krav`
              : `Viser ${items.length} av ${stats.total} krav`}
            {searchQuery && ` (søkte etter "${searchQuery}")`}
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
};

export default KravWorkspace;
