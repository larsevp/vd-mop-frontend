/**
 * EntityWorkspaceModern - Port-Based Implementation
 *
 * Clean implementation using the new port-based state management.
 * No more infinite loops, complex state management, or scattered business logic.
 */

import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { useIsAnyEntityEditing } from "@/stores/editingStateStore";

// New port-based state management
import { 
  useEntityWorkspace,
  useEntityState,
  useWorkspaceState 
} from "@/state/ports/index.js";

// UI components (keeping existing design)
import EntitySplitView from "./interface/components/EntitySplitView";
import EntityListPane from "./interface/components/EntityListPane";
import SearchBar from "./interface/components/SearchBar";
import { Toast } from "@/components/ui/editor/components/Toast.jsx";

/**
 * EntityWorkspaceModern - Port-based implementation
 */
const EntityWorkspaceModern = ({
  dto = null,
  entityType = null,
  debug = false,
  // Legacy props for backward compatibility
  adapter = null,
  modelConfig = null,
  combinedEntityDTO = null,
  workspaceConfig = {},
}) => {
  if (debug) {
    console.log("EntityWorkspaceModern: Rendering with props:", {
      hasDTO: !!dto,
      hasAdapter: !!adapter,
      entityType,
      debug,
    });
  }

  const navigate = useNavigate();
  const { user } = useUserStore();
  const isAnyEntityEditing = useIsAnyEntityEditing();

  // Priority: dto > combinedEntityDTO > adapter (for backward compatibility)
  const activeDTO = dto || combinedEntityDTO || (adapter ? { adapter } : null);
  
  // Validate required props
  if (!activeDTO && !entityType) {
    throw new Error("EntityWorkspace requires either dto prop or legacy entityType prop");
  }

  // Get configuration from DTO (with backward compatibility)
  let displayConfig, filterConfig;

  if (activeDTO && activeDTO.getDisplayConfig) {
    // Modern DTO with methods
    displayConfig = activeDTO.getDisplayConfig();
    filterConfig = activeDTO.getFilterConfig();
  } else if (activeDTO && activeDTO.adapter) {
    // Legacy adapter wrapped in object
    displayConfig = activeDTO.adapter.getDisplayConfig();
    filterConfig = activeDTO.adapter.getFilterConfig();
  } else {
    // Legacy fallback
    displayConfig = {
      title: modelConfig?.title || entityType,
      entityTypes: [entityType],
      supportsGroupByEmne: true,
      layout: workspaceConfig?.layout || modelConfig?.workspace?.layout || "split",
    };

    filterConfig = {
      fields: {
        status: { enabled: true, label: "Status", placeholder: "Alle statuser" },
        vurdering: { enabled: true, label: "Vurdering", placeholder: "Alle vurderinger" },
        emne: { enabled: true, label: "Emne", placeholder: "Alle emner" },
      },
      sortFields: [
        { key: "updatedAt", label: "Sist endret" },
        { key: "title", label: "Tittel" },
      ],
      defaults: { sortBy: "updatedAt", sortOrder: "desc", filterBy: "all" },
    };
  }

  // Extract entity type and display info
  const storeEntityType = displayConfig.entityTypes?.[0] || entityType;
  const entityDisplayName = displayConfig.title || "Entities";

  // Helper for Norwegian pluralization
  const getEntityDisplayName = (count) => {
    if (count === 1) {
      return entityDisplayName.toLowerCase();
    } else {
      const plural = displayConfig.titlePlural || (entityDisplayName + "er");
      return plural.toLowerCase();
    }
  };

  // ============ NEW PORT-BASED STATE MANAGEMENT ============
  
  // Main workspace operations (stable reference)
  const workspace = useEntityWorkspace(storeEntityType, activeDTO, { debug });

  // Reactive state subscriptions (no re-render loops!)
  const entities = useEntityState(state => state.entities);
  const loading = useEntityState(state => state.loading);
  const error = useEntityState(state => state.error);
  const selectedEntity = useEntityState(state => state.selectedEntity);
  const searchQuery = useEntityState(state => state.searchQuery);
  const filters = useEntityState(state => state.filters);
  const pagination = useEntityState(state => state.pagination);
  const availableFilters = useEntityState(state => state.availableFilters);

  // Workspace state
  const currentWorkspace = useWorkspaceState(state => state.currentEntityType);

  // ============ EFFECTS (SIMPLIFIED) ============

  // Auto-load data on mount (only once!)
  useEffect(() => {
    if (debug) {
      console.log("EntityWorkspaceModern: Auto-loading data for", storeEntityType);
    }
    
    // Load data through port (handles all complexity internally)
    workspace.loadEntities();
    
    // Scroll to top
    window.scrollTo(0, 0);
  }, []); // Empty deps - run once on mount only!

  // ============ EVENT HANDLERS ============

  const handleEntitySelect = (entity) => {
    if (debug) console.log("EntityWorkspaceModern: Entity selected", entity);
    workspace.setSelectedEntity(entity);
  };

  const handleSearch = (query) => {
    if (debug) console.log("EntityWorkspaceModern: Search query", query);
    workspace.updateSearchQuery(query);
  };

  const handleFiltersChange = (newFilters) => {
    if (debug) console.log("EntityWorkspaceModern: Filters changed", newFilters);
    workspace.updateFilters(newFilters);
  };

  const handlePageChange = (page) => {
    if (debug) console.log("EntityWorkspaceModern: Page changed", page);
    workspace.updatePagination({ page });
  };

  const handleCreateNew = () => {
    if (debug) console.log("EntityWorkspaceModern: Create new entity");
    // Navigate to create page or open create modal
    navigate(`/${storeEntityType}/create`);
  };

  const handleBack = () => {
    if (debug) console.log("EntityWorkspaceModern: Back button clicked");
    navigate(-1);
  };

  const handleRefresh = () => {
    if (debug) console.log("EntityWorkspaceModern: Refresh requested");
    workspace.refreshEntities();
  };

  // ============ RENDER LOGIC ============

  // Loading state
  if (loading) {
    return (
      <div className="bg-neutral-50">
        <div className="max-w-[1600px] mx-auto" style={{ minHeight: "100vh", width: "100%", maxWidth: "1600px" }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Laster {getEntityDisplayName(0)}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-neutral-50">
        <div className="max-w-[1600px] mx-auto" style={{ minHeight: "100vh", width: "100%", maxWidth: "1600px" }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-600 mb-4">Kunne ikke laste {getEntityDisplayName(0)}</p>
              <p className="text-neutral-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                Prøv igjen
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  const entityCount = entities?.length || 0;

  return (
    <div className="bg-neutral-50">
      <div className="max-w-[1600px] mx-auto" style={{ minHeight: "100vh", width: "100%", maxWidth: "1600px" }}>
        
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Tilbake
              </Button>
              
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">
                  {entityDisplayName}
                </h1>
                <p className="text-sm text-neutral-600">
                  {entityCount} {getEntityDisplayName(entityCount)}
                  {searchQuery && ` som matcher "${searchQuery}"`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Oppdater
              </Button>
              
              <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Ny {entityDisplayName.toLowerCase()}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border-b border-neutral-200 px-6 py-3">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableFilters={availableFilters}
            filterConfig={filterConfig}
            placeholder={`Søk i ${getEntityDisplayName(entityCount)}...`}
            showAdvanced={true}
            loading={loading}
          />
        </div>

        {/* Main Content */}
        {displayConfig.layout === "split" ? (
          <EntitySplitView
            entityType={storeEntityType}
            leftPane={
              <EntityListPane
                entities={entities}
                selectedEntity={selectedEntity}
                onEntitySelect={handleEntitySelect}
                onEntityEdit={(entity) => navigate(`/${storeEntityType}/${entity.id}/edit`)}
                onEntityView={(entity) => navigate(`/${storeEntityType}/${entity.id}`)}
                loading={loading}
                error={error}
                pagination={pagination}
                onPageChange={handlePageChange}
                entityDisplayName={entityDisplayName}
                workspaceConfig={workspaceConfig}
                debug={debug}
              />
            }
            rightPane={
              selectedEntity ? (
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">
                    {selectedEntity.title || selectedEntity.name || `${entityDisplayName} #${selectedEntity.id}`}
                  </h3>
                  <pre className="text-sm text-neutral-600 bg-neutral-50 p-4 rounded">
                    {JSON.stringify(selectedEntity, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-500">
                  <p>Velg en {entityDisplayName.toLowerCase()} for å se detaljer</p>
                </div>
              )
            }
          />
        ) : (
          <div className="p-6">
            <EntityListPane
              entities={entities}
              selectedEntity={selectedEntity}
              onEntitySelect={handleEntitySelect}
              onEntityEdit={(entity) => navigate(`/${storeEntityType}/${entity.id}/edit`)}
              onEntityView={(entity) => navigate(`/${storeEntityType}/${entity.id}`)}
              loading={loading}
              error={error}
              pagination={pagination}
              onPageChange={handlePageChange}
              entityDisplayName={entityDisplayName}
              workspaceConfig={workspaceConfig}
              debug={debug}
              fullWidth={true}
            />
          </div>
        )}

        {/* Toast notifications */}
        <Toast />
        
        {/* Debug Info */}
        {debug && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-md">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <pre>{JSON.stringify({
              entityType: storeEntityType,
              currentWorkspace,
              entitiesCount: entityCount,
              loading,
              hasError: !!error,
              hasSelectedEntity: !!selectedEntity,
              searchQuery,
              filtersActive: Object.keys(filters.additionalFilters || {}).length > 0
            }, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityWorkspaceModern;