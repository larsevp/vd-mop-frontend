/**
 * EntityWorkspaceNew - Minimal implementation us  const entities = result?.items || [];
  const entityType = dto?.entityType || dto?.getPrimaryEntityType?.() || "entities"; components  const handleSearch = useCallback(() => {
    ui.executeSearch(); // Update activeSearchQuery from searchInput
    // TanStack Query will automatically refetch when activeSearchQuery changes
  }, [ui.executeSearch]);nst handleSearch = useCallback(() => {
    ui.executeSearch(); // Update activeSearchQuery from searchInput
    // TanStack Query will automatically refetch when activeSearchQuery changes
  }, [ui.executeSearch]);k Query
 *
 * This component reuses existing EntitySplitView, SearchBar, and EntityListPane
 * but replaces complex state management with TanStack Query + simple Zustand UI state.
 */

import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ArrowLeft, LayoutGrid, Columns } from "lucide-react";

// Existing components (reuse these)
import EntitySplitView from "./interface/components/EntitySplitView";
import EntityListPane from "./interface/components/EntityListPane/index.js";
import SearchBarPlaceholder from "./interface/components/SearchBarPlaceholder";

// New hooks (TanStack Query + simple state)
import { useEntityData } from "./interface/hooks/useEntityData";
import { useWorkspaceUI } from "./interface/hooks/useWorkspaceUI";

// DTO Interface validation
import { validateEntityDTO } from "./interface/data/EntityDTOInterface";

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
  renderSearchBar, // NEW: Allow domains to provide their own search implementation
  renderActionButtons, // NEW: Allow domains to provide custom action buttons
  viewOptions = {},
  debug = false,
}) => {
  const navigate = useNavigate();
  const cardsContainerRef = useRef(null);

  // Validate DTO implements required interface
  useEffect(() => {
    if (dto) {
      try {
        validateEntityDTO(dto);
        if (debug) {
          //console.log("EntityWorkspace: DTO validation passed", dto.getDebugInfo());
        }
      } catch (error) {
        console.error("EntityWorkspace: DTO validation failed", error.message);
        throw error;
      }
    }
  }, [dto, debug]);

  // Get UI state (search, filters, selection)
  const ui = useWorkspaceUI();

  // Get server data via TanStack Query + DTO
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useEntityData(dto, {
    searchQuery: ui.activeSearchQuery,
    filters: ui.filters,
    enabled: !!dto,
  });


  const entities = result?.items || [];
  const entityType = dto?.entityType || dto?.getPrimaryEntityType?.() || "entities";

  // Reset filters when entityType changes (switching workspaces)
  useEffect(() => {
    ui.resetFilters();
  }, [entityType, ui.resetFilters]);

  // Clear selections and scroll to top when entering workspace (fresh page load)
  useEffect(() => {
    // Read selected id from URL once on mount
    const urlParams = new URLSearchParams(window.location.search);
    const desiredSelectedId = urlParams.get("selected");

    // Helper to try restore from loaded entities
    const tryRestoreFromEntities = () => {
      if (!desiredSelectedId) return false;
      if (entities.length === 0) return false;
      const found = entities.find((entity) => {
        // Support both numeric id and uid fields
        return (entity.id && entity.id.toString() === desiredSelectedId) || (entity.uid && entity.uid.toString() === desiredSelectedId);
      });
      if (found) {
        // Only set if we don't already have this entity selected (avoid overriding recent selections)
        if (ui.selectedEntity?.id?.toString() !== found.id?.toString()) {
          ui.setSelectedEntity(found);
        }
        return true;
      }
      return false;
    };

    // If no selection in URL, just clear any existing selection
    if (!desiredSelectedId) {
      // Clear selection if user navigated without specific entity selection
      if (ui.selectedEntity) {
        ui.setSelectedEntity(null);
      }

      // Scroll all containers to top
      setTimeout(() => {
        const scrollContainers = document.querySelectorAll(".overflow-y-auto");
        scrollContainers.forEach((container) => {
          container.scrollTop = 0;
        });
      }, 100);
      return;
    } // If entities are already loaded, try restore immediately
    if (tryRestoreFromEntities()) return;

    // Add a small delay before trying to fetch single entity (give time for recent refetch to complete)
    const delayedRestore = setTimeout(() => {
      if (tryRestoreFromEntities()) return;

      // If still not found locally, attempt to fetch single entity using DTO adapter if available
      const fetchSingle = async () => {
        try {
          // Try common locations/names for a single-entity fetch function
          const candidates = [];
          if (dto) candidates.push(dto);
          if (dto?.adapter?.config) candidates.push(dto.adapter.config);
          // Collect common fn names from candidates
          const names = ["getByIdFn", "getById", "fetchById", "getOne", "getByUID", "getByIdFn"];
          let fetchFn = null;
          for (const c of candidates) {
            for (const n of names) {
              if (typeof c?.[n] === "function") {
                fetchFn = c[n];
                break;
              }
            }
            if (fetchFn) break;
          }
          if (fetchFn) {
            const fetchedRaw = await fetchFn(desiredSelectedId);
            // Some functions return { data: entity } while others return entity directly
            const fetched = fetchedRaw && fetchedRaw.data ? fetchedRaw.data : fetchedRaw;
            if (fetched) {
              ui.setSelectedEntity(fetched);
              return;
            }
          }
        } catch (err) {
          // Non-fatal — selection restore failing shouldn't break page
          // eslint-disable-next-line no-console
          console.warn("Failed to fetch entity for initial selection:", err);
        }
      };

      fetchSingle();
    }, 200); // 200ms delay to let refetch complete

    return () => clearTimeout(delayedRestore);

    // Also try to restore whenever entities change (in case they load later)
  }, [/* run once + when entities change */ entities.length, ui.setSelectedEntity, dto]);

  // Event handlers
  const handleEntitySelect = useCallback(
    (entity) => {
      // Ensure entity goes through DTO enhancement before selection
      const enhancedEntity = entity ? dto.enhanceEntity(entity) : null;
      ui.setSelectedEntity(enhancedEntity);

      // Update URL with selected entity ID
      if (entity && entity.id) {
        const currentPath = window.location.pathname;
        const newUrl = `${currentPath}?selected=${entity.id}`;
        // Use replaceState so we don't add a history entry for selecting an item.
        // This keeps the browser back button behavior intuitive (one press to leave the workspace).
        window.history.replaceState(null, "", newUrl);
      } else if (entity === null || (entity && !entity.__isNew)) {
        // Clear URL for null selection or existing entities (but preserve URL for __isNew entities)
        const currentPath = window.location.pathname;
        window.history.replaceState(null, "", currentPath);
      }
    },
    [ui.setSelectedEntity, debug]
  );

  const handleSearch = useCallback(() => {
    ui.executeSearch(); // Update activeSearchQuery from searchInput
    // TanStack Query will automatically refetch when activeSearchQuery changes
  }, [ui.executeSearch]);

  const handleCreateNew = useCallback(
    (entityType = null) => {
      // Use DTO to create properly structured new entity
      const newEntity = dto.createNewEntity(entityType);
      // Enhance the new entity through DTO normalization
      const enhancedNewEntity = dto.enhanceEntity(newEntity);
      ui.setSelectedEntity(enhancedNewEntity);
    },
    [ui.setSelectedEntity, dto]
  );

  const handleDetailClose = useCallback(async () => {
    // Check if we're closing a new entity creation
    if (ui.selectedEntity?.__isNew) {
      // Restore selection from URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const selectedFromUrl = urlParams.get("selected");

      if (selectedFromUrl && dto) {
        try {
          // Use the DTO adapter to fetch the entity by ID
          const adapter = dto.adapter;
          const config = adapter?.config;

          // Try to fetch the entity using the DTO's getById methods
          let fetchFn = null;
          const candidates = [config, dto];
          const fnNames = ["getByIdFn", "getById", "fetchById", "getOne"];

          for (const candidate of candidates) {
            for (const fnName of fnNames) {
              if (typeof candidate?.[fnName] === "function") {
                fetchFn = candidate[fnName];
                break;
              }
            }
            if (fetchFn) break;
          }

          if (fetchFn) {
            const fetchedRaw = await fetchFn(selectedFromUrl);
            const fetchedEntity = fetchedRaw?.data ? fetchedRaw.data : fetchedRaw;

            if (fetchedEntity) {
              ui.setSelectedEntity(fetchedEntity);
              return;
            }
          }
        } catch (error) {
          console.warn("Failed to fetch entity for restoration:", error);
        }
      }

      // Fallback: try to find in current entities array (handle grouped structure)
      if (selectedFromUrl && entities.length > 0) {
        // Check if entities are grouped (have items arrays)
        const hasGroupedData = entities[0]?.items && Array.isArray(entities[0].items);

        let flatEntities = [];
        if (hasGroupedData) {
          // Flatten grouped entities
          flatEntities = entities.flatMap((group) => group.items || []);
        } else {
          flatEntities = entities;
        }

        const found = flatEntities.find((entity) => entity?.id?.toString() === selectedFromUrl);
        if (found) {
          ui.setSelectedEntity(found);
          return;
        }
      }

      // If no URL selection or entity not found, clear selection
      ui.setSelectedEntity(null);
    } else {
      // For existing entities, just clear selection
      ui.setSelectedEntity(null);
    }
  }, [ui.selectedEntity, ui.setSelectedEntity, entities, dto]);

  // CRUD handlers via DTO interface methods
  const handleSave = useCallback(
    async (entityData, isUpdate) => {
      try {
        // For new entities, preserve entity type information from selected entity
        let entityDataToSave = { ...entityData };
        if (!isUpdate && ui.selectedEntity?.__entityType) {
          entityDataToSave.__entityType = ui.selectedEntity.__entityType;
        } else if (isUpdate && ui.selectedEntity?.entityType) {
          entityDataToSave.entityType = ui.selectedEntity.entityType;
        }

        // Validate that DTO can determine entity type (DTO handles normalization)
        const entityType = dto.getEntityType(entityDataToSave);

        // Use DTO's save method (DTO handles the complexity)
        const result = await dto.save(entityDataToSave, isUpdate);

        // Refresh the list after successful save
        await refetch();

        // Let DTO handle post-save logic (selection, scrolling, etc.)
        // Pass the entity type context for proper dependency injection (DTO normalized)
        dto.onSaveComplete(result, !isUpdate, handleEntitySelect, entityType);

        return result;
      } catch (error) {
        throw error;
      }
    },
    [dto, refetch, handleEntitySelect]
  );

  const handleDelete = useCallback(
    async (entity) => {
      try {
        // Use DTO's delete method (DTO handles the complexity)
        await dto.delete(entity);

        // Refresh the list after successful delete
        await refetch();

        // Let DTO handle post-delete logic (deselection, etc.)
        dto.onDeleteComplete(entity, () => ui.setSelectedEntity(null));
      } catch (error) {
        console.error("Delete error:", error);
        throw error;
      }
    },
    [dto, ui.setSelectedEntity, refetch]
  );

  // Click outside handler for cards mode to deselect
  useEffect(() => {
    if (ui.viewMode !== "cards" || !ui.selectedEntity) return;

    const handleClickOutside = (event) => {
      // Only deselect if clicking outside the cards container
      if (cardsContainerRef.current && !cardsContainerRef.current.contains(event.target)) {
        ui.setSelectedEntity(null);
        // Clear URL selection as well
        const currentPath = window.location.pathname;
        window.history.replaceState(null, "", currentPath);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ui.viewMode, ui.selectedEntity, ui.setSelectedEntity]);

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

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1 bg-neutral-50">
                <Button
                  variant={ui.viewMode === "split" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => ui.setViewMode("split")}
                  className="h-8 w-8 p-0"
                  title="Split View"
                >
                  <Columns className="w-4 h-4" />
                </Button>
                <Button
                  variant={ui.viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => ui.setViewMode("cards")}
                  className="h-8 w-8 p-0"
                  title="Cards View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <SearchBarPlaceholder
                searchInput={ui.searchInput}
                onSearchInputChange={ui.setSearchInput}
                onSearch={handleSearch}
                onClearSearch={() => {
                  ui.setSearchInput("");
                  ui.setActiveSearchQuery("");
                  ui.resetFilters();
                }}
                isLoading={isLoading}
                placeholder={`Søk i ${entityType}...`}
                renderSearchBar={renderSearchBar}
                // Pass through additional props for domain-specific search
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
                availableFilters={result?.availableFilters || {}}
                viewOptions={viewOptions}
              />
            </div>

            {renderActionButtons ? (
              renderActionButtons({ handleCreateNew })
            ) : (
              <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Opprett ny
              </Button>
            )}
          </div>
        </div>

        {/* Main content - conditional rendering based on viewMode */}
        <div className="flex-1" style={{ height: "calc(100vh - 120px)" }}>
          {ui.viewMode === "cards" ? (
            /* Cards Mode - Full width grid */
            <div ref={cardsContainerRef} className="h-full bg-neutral-50 pt-4">
              <EntityListPane
                items={entities}
                entityType={entityType}
                selectedEntity={ui.selectedEntity}
                onEntitySelect={(entity) => {
                  handleEntitySelect(entity);
                  // Single click just selects - don't auto-switch to split view
                }}
                onEntityDoubleClick={(entity) => {
                  handleEntitySelect(entity);
                  // Double-click switches to split view for details
                  ui.setViewMode("split");
                }}
                isLoading={isLoading}
                adapter={dto}
                EntityListCard={renderEntityCard}
                EntityListGroupHeader={renderGroupHeader}
                EntityListHeading={renderListHeading}
                viewOptions={{ ...viewOptions, viewMode: "cards" }}
                onSave={handleSave} // Pass onSave for card editing
              />
            </div>
          ) : (
            /* Split Mode - EntitySplitView */
            <EntitySplitView
              entities={entities}
              entityType={entityType}
              selectedEntity={ui.selectedEntity}
              onEntitySelect={handleEntitySelect}
              onSave={handleSave}
              onDelete={handleDelete}
              onClose={handleDetailClose}
              renderListPane={({ entities, selectedEntity, onEntitySelect }) => (
                <EntityListPane
                  items={entities}
                  entityType={entityType}
                  selectedEntity={selectedEntity}
                  onEntitySelect={onEntitySelect}
                  isLoading={isLoading}
                  adapter={dto}
                  EntityListCard={renderEntityCard}
                  EntityListGroupHeader={renderGroupHeader}
                  EntityListHeading={renderListHeading}
                  viewOptions={{ ...viewOptions, viewMode: "split" }}
                  onSave={handleSave} // Pass onSave for split mode editing too
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
          )}
        </div>

        {/* Debug info */}
        {debug && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded text-xs max-w-sm">
            <div>Entity Type: {entityType}</div>
            <div>Entities: {entities.length}</div>
            <div>Loading: {isLoading.toString()}</div>
            <div>Error: {(!!error).toString()}</div>
            <div>Selected: {ui.selectedEntity?.id || "none"}</div>
            <div>Search Input: {ui.searchInput || "none"}</div>
            <div>Active Search: {ui.activeSearchQuery || "none"}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityWorkspaceNew;
