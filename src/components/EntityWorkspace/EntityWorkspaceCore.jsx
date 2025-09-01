import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useIsAnyEntityEditing } from "@/stores/editingStateStore";

// Zustand store
import useEntityWorkspaceStore from "./stores/entityWorkspaceStore";

// Keep only essential hooks for data fetching (React Query)
import { useEntityData } from "./hooks/useEntityData";
import { useEntityPermissions } from "./hooks/useEntityPermissions";

// Services
import { EntityTypeResolver } from "./services/EntityTypeResolver";

// Components (keeping existing UI components)
import { EntityFilters, ViewOptionsMenu } from "./shared";
import SearchBar from "./components/SearchBar";
import EntityCardList from "./components/EntityCardList";
import EntitySplitView from "./layouts/EntitySplitView";
import { Toast } from "@/components/ui/editor/components/Toast.jsx";

/**
 * EntityWorkspaceCore - Zustand-powered component with clean architecture
 *
 * Now uses centralized Zustand store for state management while preserving
 * all existing functionality including optimistic updates and cache invalidation
 */
const EntityWorkspaceCore = ({ modelConfig, entityType, workspaceConfig = {} }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  // Track if any entity is currently being edited (to disable create button)
  const isAnyEntityEditing = useIsAnyEntityEditing();

  // Zustand store state and actions
  const {
    // State
    searchInput,
    searchQuery,
    filterBy,
    sortBy,
    sortOrder,
    viewMode,
    groupByEmne,
    showMerknader,
    page,
    pageSize,
    additionalFilters,
    toast,
    expandedCards,
    collapsedGroups,
    activeEntity,
    selectedEntity,

    // Actions
    initializeWorkspace,
    handleSearchInputChange,
    handleSearch,
    handleClearSearch,
    handleFilterChange,
    handleSortChange,
    handleSortOrderChange,
    handleAdditionalFiltersChange,
    setViewMode,
    setGroupByEmne,
    setShowMerknader,
    setExpandedCards,
    toggleGroupCollapse,
    setActiveEntity,
    handleCreateNew,
    handleSave,
    handleDelete,
    hideToast,

    // Filtering methods
    getFilteringInfo,
  } = useEntityWorkspaceStore();

  // Resolve configuration and capabilities
  const resolvedModelConfig = useMemo(() => {
    if (modelConfig && Object.keys(modelConfig).length > 0) {
      return modelConfig;
    }
    return EntityTypeResolver.resolveModelConfig(entityType);
  }, [entityType, modelConfig]);

  const config = useMemo(
    () => ({
      // Default configuration
      layout: "split", // Changed default to split for better UX
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
  );

  // Initialize workspace when entity type changes (config is handled separately)
  useEffect(() => {
    initializeWorkspace(entityType, resolvedModelConfig, config);
  }, [entityType, resolvedModelConfig.title]);

  // Data Fetching (React Query)
  const data = useEntityData({
    entityType,
    modelConfig: resolvedModelConfig,
    page,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    groupByEmne: config.features.grouping ? groupByEmne : false,
  });

  // Filtering Logic - now handled by Zustand store
  const filtering = useMemo(() => {
    const result = getFilteringInfo(data.items);

    // Debug project entities before passing to display components
    const isProjectEntity = entityType?.includes("prosjekt") || entityType?.includes("project");
    if (isProjectEntity) {
    }

    return result;
  }, [data.items, getFilteringInfo, entityType, groupByEmne]);

  // Permission Resolution
  const permissions = useEntityPermissions({
    entityType,
    modelConfig: resolvedModelConfig,
    workspaceConfig: config,
    user,
  });

  // Create new entity handler with queryClient context
  const handleCreateNewWithContext = () => {
    handleCreateNew(user);
  };

  // Handle creating new entity of specific type (for combined views)
  const handleCreateNewTypeWithContext = (specificEntityType) => {
    try {
      // Get the specific model config for this entity type
      const specificModelConfig = EntityTypeResolver.resolveModelConfig(specificEntityType);
      
      // Create a new entity template for the specific type
      const newEntity = {
        id: "create-new",
        isNew: true,
        entityType: specificEntityType, // Set the specific entity type
        // Add required fields based on the specific entity type
        ...(specificEntityType.includes('Krav') && { tittel: '', beskrivelse: '' }),
        ...(specificEntityType.includes('Tiltak') && { navn: '', beskrivelse: '' }),
      };

      // Set as active entity so it shows in the detail pane
      setActiveEntity(newEntity);
    } catch (error) {
      console.error('Error creating new entity of type', specificEntityType, ':', error);
    }
  };

  // Save handler with queryClient context
  const handleSaveWithContext = (entityData) => {
    return handleSave(entityData, {
      queryClient,
      onSuccess: (message, type) => console.log("Save success:", message),
      onError: (message, type) => console.error("Save error:", message),
    });
  };

  // Delete handler with queryClient context
  const handleDeleteWithContext = (entity) => {
    return handleDelete(entity, {
      queryClient,
      onSuccess: (message, type) => console.log("Delete success:", message),
      onError: (message, type) => console.error("Delete error:", message),
    });
  };

  // Determine if this is a combined view and what entity types to offer
  const getCombinedViewEntityTypes = () => {
    if (entityType === 'combined' || entityType === 'combinedEntities') {
      return [
        { type: 'krav', label: 'Nytt Krav' },
        { type: 'tiltak', label: 'Nytt Tiltak' }
      ];
    } else if (entityType === 'prosjekt-combined' || entityType.includes('combined')) {
      return [
        { type: 'prosjektKrav', label: 'Nytt Krav' },
        { type: 'prosjektTiltak', label: 'Nytt Tiltak' }
      ];
    }
    return null;
  };

  // Render create buttons - multiple for combined views, single for others
  const renderCreateButtons = () => {
    // For combined views, we need to override the permission check since 
    // the system doesn't recognize "prosjekt-combined" as a creatable entity type
    const combinedTypes = getCombinedViewEntityTypes();
    if (combinedTypes) {
      // In combined views, show buttons if user can create any of the component types
      return (
        <div className="flex items-center gap-2">
          {combinedTypes.map(({ type, label }) => (
            <Button
              key={type}
              onClick={() => handleCreateNewTypeWithContext(type)}
              size="default"
              className="flex items-center gap-2"
              disabled={isAnyEntityEditing}
              title={isAnyEntityEditing ? "Kan ikke opprette ny mens du redigerer" : undefined}
            >
              <Plus className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      );
    }

    // Regular views - check permissions normally
    if (!permissions.canCreate) return null;

    // Single button for regular views
    return (
      <Button
        onClick={handleCreateNewWithContext}
        size="default"
        className="flex items-center gap-2"
        disabled={isAnyEntityEditing}
        title={isAnyEntityEditing ? "Kan ikke opprette ny mens du redigerer" : undefined}
      >
        <Plus className="h-4 w-4" />
        {permissions.createButtonText}
      </Button>
    );
  };

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

  // Display names
  const entityDisplayName = EntityTypeResolver.getDisplayName(entityType, resolvedModelConfig);
  const entityPluralName = EntityTypeResolver.getDisplayName(entityType, resolvedModelConfig, true);

  // Loading state
  if (data.isLoading && !data.hasData) {
    return (
      <div className={config.layout === "split" ? "bg-neutral-50" : "min-h-screen bg-neutral-50 p-6"}>
        <div
          className="max-w-[1600px] mx-auto"
          style={{
            minHeight: config.layout === "split" ? "100vh" : "auto",
            width: "100%",
            maxWidth: config.layout === "split" ? "1600px" : "80rem",
          }}
        >
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
        <div
          className="max-w-[1600px] mx-auto"
          style={{
            minHeight: config.layout === "split" ? "100vh" : "auto",
            width: "100%",
            maxWidth: config.layout === "split" ? "1600px" : "80rem",
          }}
        >
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
      <div
        className="max-w-[1600px] mx-auto"
        style={{
          minHeight: config.layout === "split" ? "100vh" : "auto",
          width: "100%",
          maxWidth: config.layout === "split" ? "1600px" : "80rem", // 80rem = max-w-7xl
        }}
      >
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
                <SearchBar
                  mode="advanced"
                  searchInput={searchInput}
                  onSearchInputChange={handleSearchInputChange}
                  onSearch={handleSearch}
                  onClearSearch={handleClearSearch}
                  isLoading={data.isFetching}
                  placeholder={`Søk i ${entityPluralName.toLowerCase()}...`}
                  filterBy={filterBy}
                  onFilterChange={handleFilterChange}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                  onSortOrderChange={handleSortOrderChange}
                  entityType={entityType}
                  additionalFilters={additionalFilters}
                  onAdditionalFiltersChange={handleAdditionalFiltersChange}
                  availableStatuses={filtering.availableStatuses}
                  availableVurderinger={filtering.availableVurderinger}
                />
              )}

              {renderCreateButtons()}
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
              {renderCreateButtons()}
            </div>
          </div>
        )}

        {/* Controls - Only show for card layout */}
        {config.layout !== "split" && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {config.features.search && (
                <SearchBar
                  mode="simple"
                  searchInput={searchInput}
                  onSearchInputChange={handleSearchInputChange}
                  onSearch={handleSearch}
                  onClearSearch={handleClearSearch}
                  isLoading={data.isFetching}
                  placeholder={`Søk i ${entityPluralName.toLowerCase()}...`}
                />
              )}

              {config.features.filters && (
                <EntityFilters
                  filterBy={filterBy}
                  onFilterChange={handleFilterChange}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  sortOrder={sortOrder}
                  onSortOrderChange={handleSortOrderChange}
                  entityType={entityType}
                  additionalFilters={additionalFilters}
                  onAdditionalFiltersChange={handleAdditionalFiltersChange}
                  availableStatuses={filtering.availableStatuses}
                  availableVurderinger={filtering.availableVurderinger}
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
              items={filtering.filteredItems}
              modelConfig={resolvedModelConfig}
              entityType={entityType}
              config={config}
              actionPermissions={permissions}
              searchQuery={searchQuery}
              filterBy={filterBy}
              sortBy={sortBy}
              sortOrder={sortOrder}
              searchInput={searchInput}
              onSearchInputChange={handleSearchInputChange}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onSortOrderChange={handleSortOrderChange}
              // Additional props needed for EntityFilters
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              additionalFilters={additionalFilters}
              onAdditionalFiltersChange={handleAdditionalFiltersChange}
              availableStatuses={filtering.availableStatuses}
              availableVurderinger={filtering.availableVurderinger}
              isLoading={data.isLoading}
              isFetching={data.isFetching}
              onCreateNew={handleCreateNewWithContext}
              onSave={handleSaveWithContext}
              onDelete={handleDeleteWithContext}
              renderIcon={renderLucideIcon}
              user={user}
              activeEntity={activeEntity}
              setActiveEntity={setActiveEntity}
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
              groupByEmne={groupByEmne}
              collapsedGroups={collapsedGroups}
              expandedCards={expandedCards}
              activeEntity={activeEntity}
              showMerknader={showMerknader}
              searchQuery={searchQuery}
              filterBy={filterBy}
              onCreateNew={handleCreateNewWithContext}
              onToggleGroupCollapse={toggleGroupCollapse}
              setExpandedCards={setExpandedCards}
              setActiveEntity={setActiveEntity}
              onSave={handleSaveWithContext}
              onDelete={handleDeleteWithContext}
              renderIcon={renderLucideIcon}
              user={user}
            />
          )}
        </div>

        {/* Results count - Only show for card layout */}
        {config.layout !== "split" && filtering.filteredItems.length > 0 && (
          <div className="mt-8 text-center text-sm text-neutral-500">
            {groupByEmne && config.features.grouping
              ? `Viser ${filtering.filteredItems.length} ${filtering.filteredItems.length === 1 ? "gruppe" : "grupper"} med totalt ${
                  filtering.filteredStats.total
                } ${entityPluralName.toLowerCase()}`
              : `Viser ${filtering.filteredItems.length} av ${filtering.filteredStats.total} ${entityPluralName.toLowerCase()}`}
            {searchQuery && ` (søkte etter "${searchQuery}")`}
            {filtering.hasActiveFilters && ` med ${filtering.activeFilterCount} filter${filtering.activeFilterCount !== 1 ? "" : ""}`}
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );
};

export default EntityWorkspaceCore;
