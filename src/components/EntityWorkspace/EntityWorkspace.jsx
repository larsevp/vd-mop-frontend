import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Generic hooks
import { useEntityWorkspaceData } from "./hooks/useEntityWorkspaceData";
import { useEntityWorkspaceActions } from "./hooks/useEntityWorkspaceActions";
import { useUserStore } from "@/stores/userStore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
// Generic components
import { SearchBar, HeaderSearchBar, EntityFilters, ViewOptionsMenu } from "./shared";
import EntityCardList from "./components/EntityCardList";
import EntitySplitView from "./layouts/EntitySplitView";
import { Toast } from "@/components/ui/editor/components/Toast.jsx";

/**
 * Generic EntityWorkspace component
 * Can be used for any entity type (krav, tiltak, prosjekt, etc.)
 * Behavior is driven by model configuration
 *
 * @param {Object} props
 * @param {Object} props.modelConfig - Model configuration (from modelConfigs)
 * @param {string} props.entityType - Type of entity ("krav", "tiltak", etc.)
 * @param {Object} props.workspaceConfig - Optional workspace-specific overrides
 */
const EntityWorkspace = ({ modelConfig, entityType, workspaceConfig = {} }) => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const navigate = useNavigate();
  // Merge default workspace config with model-specific and prop overrides
  const config = useMemo(
    () => ({
      // Default workspace configuration
      layout: "cards", // "cards" | "split"
      groupBy: "emne",
      features: {
        grouping: true,
        hierarchy: true,
        inlineEdit: true,
        search: true,
        filters: true,
        bulkActions: false,
      },
      ui: {
        showMerknader: false,
        showStatus: true,
        showVurdering: true,
        showPrioritet: true,
      },
      // Override with model workspace config
      ...modelConfig.workspace,
      // Override with component props
      ...workspaceConfig,
    }),
    [modelConfig.workspace, workspaceConfig]
  );

  // Helper function to render Lucide icons dynamically
  const renderLucideIcon = useCallback((iconName, size = 20) => {
    if (!iconName) return null;

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

  // Additional filters for status, vurdering, prioritet
  const [additionalFilters, setAdditionalFilters] = useState({});

  // Group and display options
  const [groupByEmne, setGroupByEmne] = useState(() => {
    const saved = localStorage.getItem(`${entityType}-groupByEmne`);
    return saved !== null ? JSON.parse(saved) : config.features.grouping;
  });
  const [showMerknader, setShowMerknader] = useState(() => {
    const saved = localStorage.getItem(`${entityType}-showMerknader`);
    return saved !== null ? JSON.parse(saved) : config.ui.showMerknader;
  });
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  // Card expansion states
  const [expandedCards, setExpandedCards] = useState(new Map());
  const [activeEntity, setActiveEntity] = useState(null);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(`${entityType}-groupByEmne`, JSON.stringify(groupByEmne));
  }, [entityType, groupByEmne]);

  useEffect(() => {
    localStorage.setItem(`${entityType}-showMerknader`, JSON.stringify(showMerknader));
  }, [entityType, showMerknader]);

  // Data and actions hooks
  const { items, stats, isLoading, error, isFetching, totalPages } = useEntityWorkspaceData({
    modelConfig,
    entityType,
    page,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    filterBy,
    additionalFilters,
    groupByEmne: config.features.grouping ? groupByEmne : false,
  });

  // Extract available filter options from data
  const availableStatuses = useMemo(() => {
    if (!items?.length) return [];
    const statuses = new Set();

    const extractFromItems = (itemList) => {
      itemList.forEach((item) => {
        if (item.status) {
          // Handle both string and object status
          let statusValue;
          if (typeof item.status === "string") {
            statusValue = item.status;
          } else if (typeof item.status === "object" && item.status !== null) {
            // Debug: log the structure of status objects

            // Try common property names for status objects
            statusValue =
              item.status.navn ||
              item.status.name ||
              item.status.label ||
              item.status.value ||
              item.status.title ||
              item.status.text ||
              item.status.displayName;
            // If no common property found, skip this item
            if (!statusValue) {
              return;
            }
          }
          if (statusValue && typeof statusValue === "string") {
            statuses.add(statusValue);
          }
        }
        // Handle grouped data structure
        if (item[entityType]) {
          extractFromItems(item[entityType]);
        }
        if (item.tiltak) {
          extractFromItems(item.tiltak);
        }
        if (item.krav) {
          extractFromItems(item.krav);
        }
      });
    };

    extractFromItems(items);
    return Array.from(statuses).filter(Boolean);
  }, [items, entityType]);

  const availableVurderinger = useMemo(() => {
    if (!items?.length) return [];
    const vurderinger = new Set();

    const extractFromItems = (itemList) => {
      itemList.forEach((item) => {
        if (item.vurdering) {
          // Handle both string and object vurdering
          let vurderingValue;
          if (typeof item.vurdering === "string") {
            vurderingValue = item.vurdering;
          } else if (typeof item.vurdering === "object" && item.vurdering !== null) {
            // Debug: log the structure of vurdering objects
            //console.log("Vurdering object structure:", item.vurdering, "Keys:", Object.keys(item.vurdering));
            // Try common property names for vurdering objects
            vurderingValue =
              item.vurdering.navn ||
              item.vurdering.name ||
              item.vurdering.label ||
              item.vurdering.value ||
              item.vurdering.title ||
              item.vurdering.text ||
              item.vurdering.displayName;
            // If no common property found, skip this item
            if (!vurderingValue) {
              //console.warn("Vurdering object without recognizable property:", item.vurdering);
              return;
            }
          }
          if (vurderingValue && typeof vurderingValue === "string") {
            vurderinger.add(vurderingValue);
          }
        }
        // Handle grouped data structure
        if (item[entityType]) {
          extractFromItems(item[entityType]);
        }
        if (item.tiltak) {
          extractFromItems(item.tiltak);
        }
        if (item.krav) {
          extractFromItems(item.krav);
        }
      });
    };

    extractFromItems(items);
    return Array.from(vurderinger).filter(Boolean);
  }, [items, entityType]);

  const showToast = useCallback((message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  }, []);

  const { confirmDelete, handleSave } = useEntityWorkspaceActions(modelConfig, entityType, showToast, showToast);

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

  const handleCreateNew = useCallback(() => {
    const createEntity = { id: "create-new", enhetId: user?.enhetId };
    setExpandedCards((prev) => {
      const newMap = new Map(prev);
      newMap.set("create-new", "create");
      return newMap;
    });
    setActiveEntity(createEntity);
  }, [user?.enhetId]);

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
          <p className="text-neutral-600">Laster {modelConfig.title.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !items.length) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Feil ved lasting av {modelConfig.title.toLowerCase()}</p>
          <Button onClick={() => window.location.reload()}>Prøv igjen</Button>
        </div>
      </div>
    );
  }

  // Entity type display name (capitalize first letter)
  const entityDisplayName = modelConfig.title || entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const entityPluralName = modelConfig.title || `${entityDisplayName.toLowerCase()}`;

  return (
    <div className={config.layout === "split" ? "bg-neutral-50" : "min-h-screen bg-neutral-50 p-6"} style={{ scrollBehavior: "auto" }}>
      <div className={config.layout === "split" ? "max-w-[1600px] mx-auto" : "max-w-7xl mx-auto"}>
        {/* Header - Compact for split view */}
        {config.layout === "split" ? (
          <div className="sticky top-0 z-20 flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 p-1.5  text-neutral-600 hover:text-blue-600 transition-colors"
                  title="Tilbake"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium ">Tilbake</span>
                </button>

                <h1 className="text-xl font-semibold text-neutral-900">{entityDisplayName}</h1>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span>{stats.total} totalt</span>
                  {stats.obligatorisk !== undefined && <span>{stats.obligatorisk} obligatoriske</span>}
                </div>
              </div>

              {/* Search bar aligned with title */}
              {config.features.search && (
                <HeaderSearchBar
                  searchInput={searchInput}
                  onSearchInputChange={setSearchInput}
                  onSearch={handleSearch}
                  onClearSearch={handleClearSearch}
                  isLoading={isFetching}
                  placeholder={`Søk i ${entityPluralName.toLowerCase()}...`}
                  filterBy={filterBy}
                  onFilterChange={setFilterBy}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={setSortBy}
                  onSortOrderChange={setSortOrder}
                  entityType={entityType}
                  additionalFilters={additionalFilters}
                  onAdditionalFiltersChange={setAdditionalFilters}
                  availableStatuses={availableStatuses}
                  availableVurderinger={availableVurderinger}
                />
              )}

              <Button onClick={handleCreateNew} size="default" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {modelConfig.newButtonLabel || `Nytt ${entityType}`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{entityDisplayName}håndtering</h1>
                <div className="flex items-center gap-6 mt-1 text-sm text-neutral-600">
                  <span className="flex items-center gap-1">
                    {renderLucideIcon("FileText", 16)}
                    {stats.total} {entityPluralName.toLowerCase()} totalt
                  </span>
                  {stats.obligatorisk !== undefined && (
                    <span className="flex items-center gap-1">
                      {renderLucideIcon("CheckCircle", 16)}
                      {stats.obligatorisk} obligatoriske
                    </span>
                  )}
                  {stats.optional !== undefined && (
                    <span className="flex items-center gap-1">
                      {renderLucideIcon("Clock", 16)}
                      {stats.optional} valgfrie
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={handleCreateNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {modelConfig.newButtonLabel || `Nytt ${entityType}`}
              </Button>
            </div>
          </div>
        )}

        {/* Controls - Only show for card layout */}
        {config.layout !== "split" && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {config.features.search && (
                <SearchBar
                  searchInput={searchInput}
                  onSearchInputChange={setSearchInput}
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  isLoading={isFetching}
                  placeholder={`Søk i ${entityPluralName.toLowerCase()}...`}
                />
              )}

              {config.features.filters && (
                <EntityFilters
                  filterBy={filterBy}
                  onFilterChange={setFilterBy}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                  entityType={entityType}
                  additionalFilters={additionalFilters}
                  onAdditionalFiltersChange={setAdditionalFilters}
                  availableStatuses={availableStatuses}
                  availableVurderinger={availableVurderinger}
                />
              )}

              {/* View Options Menu */}
              {(config.features.grouping || showMerknader) && (
                <ViewOptionsMenu
                  groupByEmne={groupByEmne}
                  onGroupByEmneChange={setGroupByEmne}
                  showMerknader={showMerknader}
                  onShowMerknaderChange={setShowMerknader}
                />
              )}
            </div>
          </div>
        )}

        {/* Content - Conditional layout based on config */}
        <div className={config.layout === "split" ? "sticky top-0" : ""}>
          {config.layout === "split" ? (
            <EntitySplitView
              items={items}
              modelConfig={modelConfig}
              entityType={entityType}
              config={config}
              searchQuery={searchQuery}
              filterBy={filterBy}
              sortBy={sortBy}
              sortOrder={sortOrder}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              onFilterChange={setFilterBy}
              onSortChange={setSortBy}
              onSortOrderChange={setSortOrder}
              isLoading={isLoading}
              isFetching={isFetching}
              onCreateNew={handleCreateNew}
              onSave={handleSave}
              onDelete={confirmDelete}
              renderIcon={renderLucideIcon}
              user={user}
              activeEntity={activeEntity}
              listWidth={config.layoutConfig?.listWidth}
              enableKeyboardNav={config.layoutConfig?.enableKeyboardNav}
            />
          ) : (
            <EntityCardList
              items={items}
              modelConfig={modelConfig}
              entityType={entityType}
              config={config}
              groupByEmne={groupByEmne}
              collapsedGroups={collapsedGroups}
              expandedCards={expandedCards}
              activeEntity={activeEntity}
              showMerknader={showMerknader}
              searchQuery={searchQuery}
              filterBy={filterBy}
              onCreateNew={handleCreateNew}
              onToggleGroupCollapse={toggleGroupCollapse}
              setExpandedCards={setExpandedCards}
              setActiveEntity={setActiveEntity}
              onSave={handleSave}
              onDelete={confirmDelete}
              renderIcon={renderLucideIcon}
              user={user}
            />
          )}
        </div>

        {/* Results count - Only show for card layout */}
        {config.layout !== "split" && items.length > 0 && (
          <div className="mt-8 text-center text-sm text-neutral-500">
            {groupByEmne && config.features.grouping
              ? `Viser ${items.length} ${items.length === 1 ? "gruppe" : "grupper"} med totalt ${
                  stats.total
                } ${entityPluralName.toLowerCase()}`
              : `Viser ${items.length} av ${stats.total} ${entityPluralName.toLowerCase()}`}
            {searchQuery && ` (søkte etter "${searchQuery}")`}
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
};

export default EntityWorkspace;
