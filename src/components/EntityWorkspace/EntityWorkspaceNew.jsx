/**
 * EntityWorkspaceNew - Minimal implementation using existing components + TanStack Query
 *
 * This component reuses existing EntitySplitView, SearchBar, and EntityListPane
 * but replaces complex state management with TanStack Query + simple Zustand UI state.
 */

import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ArrowLeft } from "lucide-react";

// Existing components (reuse these)
import EntitySplitView from "./interface/components/EntitySplitView";
import EntityListPane from "./interface/components/EntityListPane/index.js";
import SearchBar from "./interface/components/SearchBar";

// New hooks (TanStack Query + simple state)
import { useEntityData } from "./interface/hooks/useEntityData";
import { useWorkspaceUI } from "./interface/hooks/useWorkspaceUI";

/**
 * Minimal EntityWorkspace component (~40 lines)
 * Uses existing components, adds TanStack Query integration
 */
const EntityWorkspaceNew = ({
  dto,
  renderEntityCard,
  renderGroupHeader,
  renderListHeading,
  renderDetailPane,
  viewOptions = {},
  debug = false,
}) => {
  const navigate = useNavigate();

  // Get UI state (search, filters, selection)
  const ui = useWorkspaceUI();

  // Get server data via TanStack Query + DTO
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useEntityData(dto, {
    searchQuery: ui.searchQuery,
    filters: ui.filters,
    enabled: !!dto,
  });

  const entities = result?.items || [];
  const entityType = dto?.entityType || dto?.getPrimaryEntityType?.() || "entities";

  // Clear selections and scroll to top when entering workspace (fresh page load)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedId = urlParams.get("selected");

    // If no selection in URL, clear everything and scroll to top
    if (!selectedId) {
      ui.setSelectedEntity(null);
      // Scroll all containers to top
      setTimeout(() => {
        const scrollContainers = document.querySelectorAll('.overflow-y-auto');
        scrollContainers.forEach(container => {
          container.scrollTop = 0;
        });
      }, 100);
    } else if (entities.length > 0) {
      // Restore selected entity from URL
      const selectedEntity = entities.find((entity) => entity.id && entity.id.toString() === selectedId);
      if (selectedEntity && selectedEntity !== ui.selectedEntity) {
        ui.setSelectedEntity(selectedEntity);
      }
    }
  }, [entities.length > 0, ui.setSelectedEntity]);

  // Event handlers
  const handleEntitySelect = useCallback(
    (entity) => {
      ui.setSelectedEntity(entity);
      //console.log('handleEntitySelect called with entity:', entity);
      //console.log('Entity ID:', entity?.id, 'Type:', typeof entity?.id);
      // if (debug) console.log('Selected entity:', entity?.id);

      // Update URL with selected entity ID
      if (entity && entity.id) {
        const currentPath = window.location.pathname;
        const newUrl = `${currentPath}?selected=${entity.id}`;
        // Use replaceState so we don't add a history entry for selecting an item.
        // This keeps the browser back button behavior intuitive (one press to leave the workspace).
        window.history.replaceState(null, "", newUrl);
        //console.log('Updated URL to:', newUrl);
      } else {
        // Clear selection from URL without adding history entries
        const currentPath = window.location.pathname;
        window.history.replaceState(null, "", currentPath);
      }
    },
    [ui.setSelectedEntity, debug]
  );

  const handleSearch = useCallback(() => {
    refetch(); // TanStack Query handles the actual search via DTO
  }, [refetch]);

  const handleCreateNew = useCallback(() => {
    // Set selected entity to null to trigger create mode in detail pane
    ui.setSelectedEntity({ __isNew: true });
  }, [ui.setSelectedEntity]);

  // CRUD handlers via DTO adapter config
  const handleSave = useCallback(
    async (entityData, isUpdate) => {
      //console.log('handleSave called with:', { entityData, isUpdate, selectedEntity: ui.selectedEntity });
      try {
        const adapter = dto.adapter;
        const config = adapter.config; // Access the original modelConfig

        let result;
        if (isUpdate) {
          if (config.updateFn) {
            result = await config.updateFn(entityData.id, entityData);
          } else {
            throw new Error("Update function not available");
          }
        } else {
          if (config.createFn) {
            result = await config.createFn(entityData);
          } else {
            throw new Error("Create function not available");
          }
        }

        // Refresh the list after successful save
        refetch();

        // Let DTO handle post-save logic (DTO receives raw result, decides how to handle it)
        if (dto.onSaveComplete) {
          dto.onSaveComplete(result, !isUpdate, handleEntitySelect);
        }

        return result;
      } catch (error) {
        console.error("Save error:", error);
        throw error;
      }
    },
    [dto, refetch, handleEntitySelect]
  );

  const handleDelete = useCallback(
    async (entity) => {
      try {
        const adapter = dto.adapter;
        const config = adapter.config; // Access the original modelConfig

        if (config.deleteFn) {
          await config.deleteFn(entity.id);
          ui.setSelectedEntity(null); // Clear selection after delete
          refetch(); // Refresh the list
        } else {
          throw new Error("Delete function not available");
        }
      } catch (error) {
        console.error("Delete error:", error);
        throw error;
      }
    },
    [dto, ui.setSelectedEntity, refetch]
  );

  // Simple error handling
  if (error) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">Feil ved lasting av {entityType}</h3>
            <p className="text-red-700 mb-4">{error.message}</p>
            <div className="flex gap-3">
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake
              </Button>
              <Button onClick={() => refetch()} variant="outline">
                Prøv igjen
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render - reuse existing EntitySplitView structure
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto" style={{ maxWidth: "1600px" }}>
        {/* Header with search */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-neutral-600 hover:text-neutral-900">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Tilbake
              </Button>
              <h1 className="text-2xl font-semibold text-neutral-900">{dto?.getDisplayConfig?.()?.title || entityType}</h1>
              <div className="text-sm text-neutral-600">{entities.length} totalt</div>
            </div>

            <div className="flex-1 max-w-md">
              <SearchBar
                searchInput={ui.searchQuery}
                onSearchInputChange={ui.setSearchQuery}
                onSearch={handleSearch}
                onClearSearch={() => {
                  ui.setSearchQuery("");
                  ui.resetFilters();
                }}
                isLoading={isLoading}
                placeholder={`Søk i ${entityType}...`}
                mode="advanced"
                filterBy={ui.filters.filterBy}
                sortBy={ui.filters.sortBy}
                sortOrder={ui.filters.sortOrder}
                onFilterChange={(filterBy) => ui.setFilters({ filterBy })}
                onSortChange={(sortBy) => ui.setFilters({ sortBy })}
                onSortOrderChange={(sortOrder) => ui.setFilters({ sortOrder })}
                entityType={entityType}
                additionalFilters={ui.filters.additionalFilters}
                onAdditionalFiltersChange={(additionalFilters) => ui.setFilters({ additionalFilters })}
                filterConfig={dto?.getFilterConfig?.()}
              />
            </div>

            <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Opprett ny
            </Button>
          </div>
        </div>

        {/* Main content - reuse existing EntitySplitView */}
        <div className="flex-1" style={{ height: "calc(100vh - 120px)" }}>
          <EntitySplitView
            entities={entities}
            entityType={entityType}
            selectedEntity={ui.selectedEntity}
            onEntitySelect={handleEntitySelect}
            onSave={handleSave}
            onDelete={handleDelete}
            renderListPane={({ entities, selectedEntity, onEntitySelect }) => (
              <EntityListPane
                items={entities} // Pass entities as items (reference design pattern)
                entityType={entityType}
                selectedEntity={selectedEntity}
                onEntitySelect={onEntitySelect}
                isLoading={isLoading}
                adapter={dto}
                EntityListCard={renderEntityCard}
                EntityListGroupHeader={renderGroupHeader}
                EntityListHeading={renderListHeading}
                viewOptions={viewOptions}
              />
            )}
            renderDetailPane={
              renderDetailPane
                ? renderDetailPane
                : ({ selectedEntity }) => (
                    <div className="h-full overflow-auto bg-white">
                      {selectedEntity ? (
                        <div className="p-6">
                          <div className="border-b pb-4 mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                              {selectedEntity.title || selectedEntity.tittel || "Detaljer"}
                            </h2>
                            {selectedEntity.uid && <p className="text-sm text-gray-600 mt-1">ID: {selectedEntity.uid}</p>}
                          </div>

                          {/* Simple detail view - fallback when no renderDetailPane provided */}
                          <div className="bg-neutral-50 p-4 rounded-lg">
                            <pre className="text-sm text-neutral-700 whitespace-pre-wrap overflow-auto">
                              {JSON.stringify(selectedEntity, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
                          <div>
                            <h3 className="text-lg font-medium mb-2">Velg et element</h3>
                            <p>Klikk på et element i listen for å se detaljer</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
            }
          />
        </div>

        {/* Debug info */}
        {debug && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded text-xs max-w-sm">
            <div>Entity Type: {entityType}</div>
            <div>Entities: {entities.length}</div>
            <div>Loading: {isLoading.toString()}</div>
            <div>Error: {(!!error).toString()}</div>
            <div>Selected: {ui.selectedEntity?.id || "none"}</div>
            <div>Search: {ui.searchQuery || "none"}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityWorkspaceNew;
