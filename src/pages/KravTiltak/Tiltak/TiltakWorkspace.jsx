import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, Settings, CheckCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Model config
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";

// Custom hooks
import { useTiltakData } from "./hooks/useTiltakData";
import { useTiltakActions } from "./hooks/useTiltakActions";
import { useUserStore } from "@/stores/userStore";

// Components
import TiltakSearchBar from "./components/TiltakSearchBar";
import TiltakFilters from "./components/TiltakFilters";
import TiltakCardController from "./components/TiltakCardController";
import ViewOptionsMenu from "../shared/ViewOptionsMenu";
import { Toast } from "@/components/ui/editor/components/Toast.jsx";
import { updateTiltakStatus, updateTiltakVurdering, updateTiltak } from "@/api/endpoints";

/**
 * TiltakWorkspace with proper separation of concerns
 * - Custom hooks for data and actions
 * - Smaller, focused components  
 * - Better state management
 * - Cleaner code organization
 * - Reuses shared components where possible
 */
const TiltakWorkspace = () => {
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
    const saved = localStorage.getItem("tiltak-groupByEmne");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showMerknader, setShowMerknader] = useState(() => {
    const saved = localStorage.getItem("tiltak-showMerknader");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [collapsedGroups, setCollapsedGroups] = useState(new Set()); // Track collapsed groups
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  // Card expansion states
  const [expandedCards, setExpandedCards] = useState(new Map()); // Map of tiltakId -> mode ('view', 'edit')
  const [activeTiltak, setActiveTiltak] = useState(null);

  // User store
  const { user } = useUserStore();

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("tiltak-groupByEmne", JSON.stringify(groupByEmne));
  }, [groupByEmne]);

  useEffect(() => {
    localStorage.setItem("tiltak-showMerknader", JSON.stringify(showMerknader));
  }, [showMerknader]);

  // Data and actions hooks
  const { items, stats, isLoading, error, isFetching, totalPages } = useTiltakData({
    page,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    filterBy,
    groupByEmne, // Pass grouping option to data hook
  });

  // DEBUG: Log the data to console
  console.log("TiltakWorkspace DEBUG:", {
    items,
    itemsLength: items?.length,
    groupByEmne,
    isLoading,
    error: error?.message,
    stats
  });

  const showToast = useCallback((message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  }, []);

  const { confirmDelete, handleSave } = useTiltakActions(showToast, showToast);

  // Handler for merknad-only updates
  const handleMerknadUpdate = useCallback((tiltakId, newMerknader) => {
    // Update the local cache/state to reflect the merknad change
    setActiveTiltak((prev) => {
      if (prev && prev.id === tiltakId) {
        return { ...prev, merknad: newMerknader };
      }
      return prev;
    });
  }, []);

  // Handler for status updates
  const handleStatusChange = useCallback(
    async (tiltakId, newStatusId) => {
      try {
        // Use dedicated status update endpoint
        await updateTiltakStatus(tiltakId, newStatusId);

        // Update local state
        setActiveTiltak((prev) => {
          if (prev && prev.id === tiltakId) {
            return { ...prev, statusId: newStatusId };
          }
          return prev;
        });

        // Invalidate queries to trigger refetch and update UI
        queryClient.invalidateQueries(["tiltak"]);
        queryClient.invalidateQueries(["tiltak", tiltakId]);

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
    async (tiltakId, newVurderingId) => {
      try {
        // Use dedicated vurdering update endpoint
        await updateTiltakVurdering(tiltakId, newVurderingId);

        // Update local state
        setActiveTiltak((prev) => {
          if (prev && prev.id === tiltakId) {
            return { ...prev, vurderingId: newVurderingId };
          }
          return prev;
        });

        // Invalidate queries to trigger refetch and update UI
        queryClient.invalidateQueries(["tiltak"]);
        queryClient.invalidateQueries(["tiltak", tiltakId]);

        showToast("Vurdering oppdatert", "success");
      } catch (error) {
        console.error("Error updating vurdering:", error);
        showToast("Kunne ikke oppdatere vurdering", "error");
      }
    },
    [showToast, queryClient]
  );

  // Handler for prioritet updates
  const handlePrioritetChange = useCallback(
    async (tiltakId, newPrioritet) => {
      try {
        // Use general update endpoint for prioritet
        await updateTiltak({ id: tiltakId, prioritet: newPrioritet });

        // Update local state
        setActiveTiltak((prev) => {
          if (prev && prev.id === tiltakId) {
            return { ...prev, prioritet: newPrioritet };
          }
          return prev;
        });

        // Invalidate queries to trigger refetch and update UI
        queryClient.invalidateQueries(["tiltak"]);
        queryClient.invalidateQueries(["tiltak", tiltakId]);

        showToast("Prioritet oppdatert", "success");
      } catch (error) {
        console.error("Error updating prioritet:", error);
        showToast("Kunne ikke oppdatere prioritet", "error");
      }
    },
    [showToast, queryClient]
  );

  // Group tiltak by Emne for structured display
  const groupedTiltak = useMemo(() => {
    if (!items.length) return {};

    return items.reduce((groups, tiltak) => {
      const emneKey = tiltak.emne?.navn || "Ingen emne";
      if (!groups[emneKey]) {
        groups[emneKey] = {
          emne: tiltak.emne,
          tiltak: [],
        };
      }
      groups[emneKey].tiltak.push(tiltak);
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
    (tiltak, mode = "view") => {
      setExpandedCards((prev) => {
        const newMap = new Map(prev);
        if (newMap.has(tiltak.id) && newMap.get(tiltak.id) === mode) {
          // If already expanded in same mode, collapse it
          newMap.delete(tiltak.id);
          // If we're collapsing and this was the active tiltak, clear it
          setActiveTiltak((current) => (current?.id === tiltak.id ? null : current));
        } else {
          // Expand in specified mode
          newMap.set(tiltak.id, mode);
          // Only set as active if it's not just a view expansion or if no active tiltak exists
          if (mode === "edit" || mode === "create" || !activeTiltak) {
            setActiveTiltak(tiltak);
          }
        }
        return newMap;
      });
    },
    [activeTiltak]
  );

  const handleCollapseCard = useCallback((tiltakId) => {
    setExpandedCards((prev) => {
      const newMap = new Map(prev);
      newMap.delete(tiltakId);
      return newMap;
    });
    // If we're collapsing the active tiltak, clear it
    setActiveTiltak((current) => (current?.id === tiltakId ? null : current));
  }, []);

  const handleCreateNewTiltak = useCallback(() => {
    // For create mode, we'll use a special ID
    const createTiltak = { id: "create-new", enhetId: user?.enhetId };
    setExpandedCards((prev) => {
      const newMap = new Map(prev);
      newMap.set("create-new", "create");
      return newMap;
    });
    setActiveTiltak(createTiltak);
  }, [user?.enhetId]);

  const handleSaveTiltak = useCallback(
    async (data) => {
      try {
        const savedTiltak = await handleSave(data, !!data.id);

        // Update the active tiltak with saved data
        setActiveTiltak(savedTiltak);

        // Keep the card expanded but switch to view mode
        if (data.id === "create-new") {
          // For newly created tiltak, update the expansion map with the real ID
          setExpandedCards((prev) => {
            const newMap = new Map(prev);
            newMap.delete("create-new");
            newMap.set(savedTiltak.id, "view");
            return newMap;
          });
        } else {
          // For existing tiltak, just update the mode to view
          setExpandedCards((prev) => {
            const newMap = new Map(prev);
            newMap.set(data.id, "view");
            return newMap;
          });
        }

        return savedTiltak;
      } catch (error) {
        // Error handled by hook
        throw error;
      }
    },
    [handleSave]
  );

  const handleViewById = useCallback(
    async (tiltakId) => {
      try {
        // Always fetch full tiltak data to ensure we have all relationships
        const fullTiltak = await tiltakConfig.getByIdFn(tiltakId);
        setActiveTiltak(fullTiltak);
        handleExpandCard(fullTiltak, "view");
      } catch (error) {
        console.error("Error fetching tiltak details:", error);
        // Fallback to existing data if available
        const fallbackTiltak = items.find((t) => t.id === tiltakId);
        if (fallbackTiltak) {
          setActiveTiltak(fallbackTiltak);
          handleExpandCard(fallbackTiltak, "view");
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
          <p className="text-neutral-600">Laster tiltak...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !items.length) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Feil ved lasting av tiltak</p>
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
              <h1 className="text-2xl font-bold text-neutral-900">Tiltakshåndtering</h1>
              <div className="flex items-center gap-6 mt-1 text-sm text-neutral-600">
                <span className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  {stats.total} tiltak totalt
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
            <Button onClick={handleCreateNewTiltak} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nytt tiltak
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <TiltakSearchBar
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isLoading={isFetching}
            />

            <TiltakFilters
              filterBy={filterBy}
              onFilterChange={setFilterBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />

            {/* View Options Menu - reused from shared */}
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
          {/* Create New Tiltak Card - Always show when in create mode */}
          {expandedCards.has("create-new") && (
            <TiltakCardController
              key="create-new"
              tiltak={{ id: "create-new", enhetId: user?.enhetId }}
              isExpanded={true}
              expandedMode="create"
              onExpand={handleExpandCard}
              onCollapse={handleCollapseCard}
              onEdit={() => {}}
              onDelete={() => {}}
              onSave={handleSaveTiltak}
              onMerknadUpdate={handleMerknadUpdate}
              onStatusChange={handleStatusChange}
              onVurderingChange={handleVurderingChange}
              onPrioritetChange={handlePrioritetChange}
              onNavigateToTiltak={handleViewById}
              showMerknader={showMerknader}
              showStatus={true}
              showVurdering={true}
              showPrioritet={true}
              filesCount={0}
              childrenCount={0}
              parentTiltak={null}
            />
          )}

          {items.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 shadow-sm text-center">
              <Settings className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {searchQuery || filterBy !== "all" ? "Ingen tiltak funnet" : "Ingen tiltak ennå"}
              </h3>
              <p className="text-neutral-600 mb-6">
                {searchQuery || filterBy !== "all" ? "Prøv å justere søkekriteriene dine" : "Kom i gang ved å opprette ditt første tiltak"}
              </p>
              {!searchQuery && filterBy === "all" && (
                <Button onClick={handleCreateNewTiltak} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Opprett første tiltak
                </Button>
              )}
            </div>
          ) : groupByEmne ? (
            // Grouped view - show Emne headings with Tiltak underneath
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
                          {group.emne?.icon ? renderLucideIcon(group.emne.icon, 24) : <Settings size={24} />}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-neutral-900 mb-1">{group.emne?.tittel || "Ingen emne"}</h3>
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <span className="flex items-center gap-1.5">
                              <Settings className="h-4 w-4" />
                              {group.tiltak.length} {group.tiltak.length === 1 ? "tiltak" : "tiltak"}
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

                    {/* Tiltak Cards - Collapsible */}
                    {!isCollapsed && (
                      <div className="p-6 space-y-4">
                        {group.tiltak.map((tiltak) => (
                          <TiltakCardController
                            key={tiltak.id}
                            tiltak={tiltak}
                            isExpanded={expandedCards.has(tiltak.id)}
                            expandedMode={expandedCards.get(tiltak.id) || "view"}
                            onExpand={handleExpandCard}
                            onCollapse={handleCollapseCard}
                            onEdit={(tiltak) => handleExpandCard(tiltak, "edit")}
                            onDelete={confirmDelete}
                            onSave={handleSaveTiltak}
                            onMerknadUpdate={handleMerknadUpdate}
                            onStatusChange={handleStatusChange}
                            onVurderingChange={handleVurderingChange}
                            onPrioritetChange={handlePrioritetChange}
                            onNavigateToTiltak={handleViewById}
                            showMerknader={showMerknader}
                            showStatus={true}
                            showVurdering={true}
                            showPrioritet={true}
                            filesCount={tiltak.filesCount}
                            childrenCount={tiltak.childrenCount}
                            parentTiltak={tiltak.parentTiltak}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Flat view - show all Tiltak as individual cards
            <div className="space-y-4">
              {items.map((tiltak) => (
                <TiltakCardController
                  key={tiltak.id}
                  tiltak={tiltak}
                  isExpanded={expandedCards.has(tiltak.id)}
                  expandedMode={expandedCards.get(tiltak.id) || "view"}
                  onExpand={handleExpandCard}
                  onCollapse={handleCollapseCard}
                  onEdit={(tiltak) => handleExpandCard(tiltak, "edit")}
                  onDelete={confirmDelete}
                  onSave={handleSaveTiltak}
                  onMerknadUpdate={handleMerknadUpdate}
                  onStatusChange={handleStatusChange}
                  onVurderingChange={handleVurderingChange}
                  onPrioritetChange={handlePrioritetChange}
                  onNavigateToTiltak={handleViewById}
                  showMerknader={showMerknader}
                  showStatus={true}
                  showVurdering={true}
                  showPrioritet={true}
                  filesCount={tiltak.filesCount}
                  childrenCount={tiltak.childrenCount}
                  parentTiltak={tiltak.parentTiltak}
                />
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        {items.length > 0 && (
          <div className="mt-8 text-center text-sm text-neutral-500">
            {groupByEmne
              ? `Viser ${items.length} ${items.length === 1 ? "emnegruppe" : "emnegrupper"} med totalt ${stats.total} tiltak`
              : `Viser ${items.length} av ${stats.total} tiltak`}
            {searchQuery && ` (søkte etter "${searchQuery}")`}
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
};

export default TiltakWorkspace;