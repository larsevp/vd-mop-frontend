import React, { useMemo } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { useIsAnyEntityEditing } from "@/stores/editingStateStore";

// Refactored hooks following SRP
import { useEntityData } from "./hooks/useEntityData";
import { useEntityState } from "./hooks/useEntityState";
import { useEntityFiltering } from "./hooks/useEntityFiltering";
import { useEntityActions } from "./hooks/useEntityActions";
import { useEntityPermissions } from "./hooks/useEntityPermissions";

// Services
import { EntityTypeResolver } from "./services/EntityTypeResolver";

// Components (keeping existing UI components)
import { SearchBar, HeaderSearchBar, EntityFilters, ViewOptionsMenu } from "./shared";
import EntityCardList from "./components/EntityCardList";
import EntitySplitView from "./layouts/EntitySplitView";
import { Toast } from "@/components/ui/editor/components/Toast.jsx";

/**
 * EntityWorkspaceCore - Refactored component following SOLID principles
 *
 * SOLID Compliance:
 * - Single Responsibility: Pure orchestration, delegates to specialized hooks/services
 * - Open/Closed: Easy to extend with new entity types via configuration
 * - Liskov Substitution: All entity types work through same interface
 * - Interface Segregation: Hooks are focused and cohesive
 * - Dependency Inversion: Depends on abstractions (services) not implementations
 */
const EntityWorkspaceCore = ({ modelConfig, entityType, workspaceConfig = {} }) => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  
  // Track if any entity is currently being edited (to disable create button)
  const isAnyEntityEditing = useIsAnyEntityEditing();

  // Resolve configuration and capabilities
  // If modelConfig is explicitly passed, use it. Otherwise try to resolve from entityType
  const resolvedModelConfig = useMemo(() => {
    if (modelConfig && Object.keys(modelConfig).length > 0) {
      return modelConfig;
    }
    return EntityTypeResolver.resolveModelConfig(entityType);
  }, [entityType, modelConfig]);

  const config = useMemo(
    () => ({
      // Default configuration
      layout: "cards",
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
      // Merge with model and prop configs
      ...resolvedModelConfig.workspace,
      ...workspaceConfig,
    }),
    [resolvedModelConfig.workspace, workspaceConfig]
  ); // UI State Management (Single Responsibility)
  const state = useEntityState({
    entityType,
    initialConfig: {
      groupByEmne: config.features?.grouping,
      showMerknader: config.ui?.showMerknader,
      sortBy: "updatedAt",
      sortOrder: "desc",
      viewMode: config.layout === "split" ? "list" : "grid",
      pageSize: 50,
    },
  });

  // Data Fetching (Single Responsibility)
  const data = useEntityData({
    entityType,
    modelConfig: resolvedModelConfig,
    page: state.page,
    pageSize: state.pageSize,
    searchQuery: state.searchQuery,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    groupByEmne: config.features.grouping ? state.groupByEmne : false,
  });

  // Filtering Logic (Single Responsibility)
  const filtering = useEntityFiltering({
    items: data.items,
    entityType,
    groupByEmne: config.features.grouping ? state.groupByEmne : false,
    filters: { filterBy: state.filterBy },
    additionalFilters: state.additionalFilters,
  });

  // CRUD Actions (Single Responsibility)
  const actions = useEntityActions({
    entityType,
    modelConfig: resolvedModelConfig,
    onSuccess: state.showToast,
    onError: state.showToast,
  });

  // Permission Resolution (Single Responsibility)
  const permissions = useEntityPermissions({
    entityType,
    modelConfig: resolvedModelConfig,
    workspaceConfig: config,
    user,
  });

  // Icon renderer utility
  const renderLucideIcon = (iconName, size = 20) => {
    if (!iconName) return null;
    const formattedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    const IconComponent = LucideIcons[formattedIconName] || LucideIcons[iconName];
    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in Lucide icons`);
      return null;
    }
    return <IconComponent size={size} />;
  };

  // Create new entity handler
  const handleCreateNew = () => {
    state.handleCreateNew(user);
  };

  // Display names
  const entityDisplayName = EntityTypeResolver.getDisplayName(entityType, resolvedModelConfig);
  const entityPluralName = EntityTypeResolver.getDisplayName(entityType, resolvedModelConfig, true);

  // Loading state
  if (data.isLoading && !data.hasData) {
    return (
      <div className={config.layout === "split" ? "bg-neutral-50" : "min-h-screen bg-neutral-50 p-6"}>
        <div className="max-w-[1600px] mx-auto"
             style={{
               minHeight: config.layout === "split" ? "100vh" : "auto",
               width: "100%",
               maxWidth: config.layout === "split" ? "1600px" : "80rem"
             }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Laster {entityDisplayName.toLowerCase()}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (data.isError && !data.hasData) {
    return (
      <div className={config.layout === "split" ? "bg-neutral-50" : "min-h-screen bg-neutral-50 p-6"}>
        <div className="max-w-[1600px] mx-auto"
             style={{
               minHeight: config.layout === "split" ? "100vh" : "auto",
               width: "100%",
               maxWidth: config.layout === "split" ? "1600px" : "80rem"
             }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-600 mb-4">Feil ved lasting av {entityDisplayName.toLowerCase()}</p>
              <Button onClick={() => window.location.reload()}>Prøv igjen</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={config.layout === "split" ? "bg-neutral-50" : "min-h-screen bg-neutral-50 p-6"}>
      <div className="max-w-[1600px] mx-auto"
           style={{
             minHeight: config.layout === "split" ? "100vh" : "auto",
             width: "100%",
             maxWidth: config.layout === "split" ? "1600px" : "80rem" // 80rem = max-w-7xl
           }}>
        {/* Header - Responsive based on layout */}
        {config.layout === "split" ? (
          <div className="sticky top-0 z-20 flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 p-1.5 text-neutral-600 hover:text-blue-600 transition-colors"
                  title="Tilbake"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Tilbake</span>
                </button>

                <h1 className="text-xl font-semibold text-neutral-900">{entityDisplayName}</h1>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span>{filtering.filteredStats.total} totalt</span>
                  {filtering.filteredStats.obligatorisk !== undefined && <span>{filtering.filteredStats.obligatorisk} obligatoriske</span>}
                </div>
              </div>

              {/* Compact search for split view */}
              {config.features.search && (
                <HeaderSearchBar
                  searchInput={state.searchInput}
                  onSearchInputChange={state.handleSearchInputChange}
                  onSearch={state.handleSearch}
                  onClearSearch={state.handleClearSearch}
                  isLoading={data.isFetching}
                  placeholder={`Søk i ${entityPluralName.toLowerCase()}...`}
                  filterBy={state.filterBy}
                  onFilterChange={state.handleFilterChange}
                  sortBy={state.sortBy}
                  sortOrder={state.sortOrder}
                  onSortChange={state.handleSortChange}
                  onSortOrderChange={state.handleSortOrderChange}
                  entityType={entityType}
                  additionalFilters={state.additionalFilters}
                  onAdditionalFiltersChange={state.handleAdditionalFiltersChange}
                  availableStatuses={filtering.availableStatuses}
                  availableVurderinger={filtering.availableVurderinger}
                />
              )}

              {permissions.canCreate && (
                <Button 
                  onClick={handleCreateNew} 
                  size="default" 
                  className="flex items-center gap-2"
                  disabled={isAnyEntityEditing}
                  title={isAnyEntityEditing ? "Kan ikke opprette ny mens du redigerer" : undefined}
                >
                  <Plus className="h-4 w-4" />
                  {permissions.createButtonText}
                </Button>
              )}
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
                    {filtering.filteredStats.total} {entityPluralName.toLowerCase()} totalt
                  </span>
                  {filtering.filteredStats.obligatorisk !== undefined && (
                    <span className="flex items-center gap-1">
                      {renderLucideIcon("CheckCircle", 16)}
                      {filtering.filteredStats.obligatorisk} obligatoriske
                    </span>
                  )}
                  {filtering.filteredStats.optional !== undefined && (
                    <span className="flex items-center gap-1">
                      {renderLucideIcon("Clock", 16)}
                      {filtering.filteredStats.optional} valgfrie
                    </span>
                  )}
                </div>
              </div>
              {permissions.canCreate && (
                <Button 
                  onClick={handleCreateNew} 
                  className="flex items-center gap-2"
                  disabled={isAnyEntityEditing}
                  title={isAnyEntityEditing ? "Kan ikke opprette ny mens du redigerer" : undefined}
                >
                  <Plus className="h-4 w-4" />
                  {permissions.createButtonText}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Controls - Only show for card layout */}
        {config.layout !== "split" && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {config.features.search && (
                <SearchBar
                  searchInput={state.searchInput}
                  onSearchInputChange={state.handleSearchInputChange}
                  onSearch={state.handleSearch}
                  onClear={state.handleClearSearch}
                  isLoading={data.isFetching}
                  placeholder={`Søk i ${entityPluralName.toLowerCase()}...`}
                />
              )}

              {config.features.filters && (
                <EntityFilters
                  filterBy={state.filterBy}
                  onFilterChange={state.handleFilterChange}
                  viewMode={state.viewMode}
                  onViewModeChange={state.setViewMode}
                  sortBy={state.sortBy}
                  onSortChange={state.handleSortChange}
                  sortOrder={state.sortOrder}
                  onSortOrderChange={state.handleSortOrderChange}
                  entityType={entityType}
                  additionalFilters={state.additionalFilters}
                  onAdditionalFiltersChange={state.handleAdditionalFiltersChange}
                  availableStatuses={filtering.availableStatuses}
                  availableVurderinger={filtering.availableVurderinger}
                />
              )}

              {/* View Options Menu */}
              {(config.features.grouping || state.showMerknader) && (
                <ViewOptionsMenu
                  groupByEmne={state.groupByEmne}
                  onGroupByEmneChange={state.setGroupByEmne}
                  showMerknader={state.showMerknader}
                  onShowMerknaderChange={state.setShowMerknader}
                />
              )}
            </div>
          </div>
        )}

        {/* Content - Conditional layout based on config */}
        <div className={config.layout === "split" ? "sticky top-0" : ""}>
          {config.layout === "split" ? (
            <EntitySplitView
              items={filtering.filteredItems}
              modelConfig={resolvedModelConfig}
              entityType={entityType}
              config={config}
              actionPermissions={permissions}
              searchQuery={state.searchQuery}
              filterBy={state.filterBy}
              sortBy={state.sortBy}
              sortOrder={state.sortOrder}
              searchInput={state.searchInput}
              onSearchInputChange={state.handleSearchInputChange}
              onSearch={state.handleSearch}
              onClearSearch={state.handleClearSearch}
              onFilterChange={state.handleFilterChange}
              onSortChange={state.handleSortChange}
              onSortOrderChange={state.handleSortOrderChange}
              // Additional props needed for EntityFilters
              viewMode={state.viewMode}
              onViewModeChange={state.setViewMode}
              additionalFilters={state.additionalFilters}
              onAdditionalFiltersChange={state.handleAdditionalFiltersChange}
              availableStatuses={filtering.availableStatuses}
              availableVurderinger={filtering.availableVurderinger}
              isLoading={data.isLoading}
              isFetching={data.isFetching}
              onCreateNew={handleCreateNew}
              onSave={actions.handleSave}
              onDelete={actions.handleDelete}
              renderIcon={renderLucideIcon}
              user={user}
              activeEntity={state.activeEntity}
              setActiveEntity={state.setActiveEntity}
              listWidth={config.layoutConfig?.listWidth}
              enableKeyboardNav={config.layoutConfig?.enableKeyboardNav}
            />
          ) : (
            <EntityCardList
              items={filtering.filteredItems}
              modelConfig={resolvedModelConfig}
              entityType={entityType}
              config={config}
              actionPermissions={permissions}
              groupByEmne={state.groupByEmne}
              collapsedGroups={state.collapsedGroups}
              expandedCards={state.expandedCards}
              activeEntity={state.activeEntity}
              showMerknader={state.showMerknader}
              searchQuery={state.searchQuery}
              filterBy={state.filterBy}
              onCreateNew={handleCreateNew}
              onToggleGroupCollapse={state.toggleGroupCollapse}
              setExpandedCards={state.setExpandedCards}
              setActiveEntity={state.setActiveEntity}
              onSave={actions.handleSave}
              onDelete={actions.handleDelete}
              renderIcon={renderLucideIcon}
              user={user}
            />
          )}
        </div>

        {/* Results count - Only show for card layout */}
        {config.layout !== "split" && filtering.filteredItems.length > 0 && (
          <div className="mt-8 text-center text-sm text-neutral-500">
            {state.groupByEmne && config.features.grouping
              ? `Viser ${filtering.filteredItems.length} ${filtering.filteredItems.length === 1 ? "gruppe" : "grupper"} med totalt ${
                  filtering.filteredStats.total
                } ${entityPluralName.toLowerCase()}`
              : `Viser ${filtering.filteredItems.length} av ${filtering.filteredStats.total} ${entityPluralName.toLowerCase()}`}
            {state.searchQuery && ` (søkte etter "${state.searchQuery}")`}
            {filtering.hasActiveFilters && ` med ${filtering.activeFilterCount} filter${filtering.activeFilterCount !== 1 ? "" : ""}`}
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast show={state.toast.show} message={state.toast.message} type={state.toast.type} onClose={state.hideToast} />
    </div>
  );
};

export default EntityWorkspaceCore;
