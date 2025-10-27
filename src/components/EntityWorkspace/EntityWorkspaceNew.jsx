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

import React, { useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Button } from "@/components/ui/primitives/button";
import { Plus, ArrowLeft, LayoutGrid, Columns, Network } from "lucide-react";
import { useUserStore } from "@/stores/userStore";

// Existing components (reuse these)
import EntitySplitView from "./interface/components/EntitySplitView";
import EntityListPane from "./interface/components/EntityListPane/index.js";
import SearchBarPlaceholder from "./interface/components/SearchBarPlaceholder";

// New hooks (TanStack Query + simple state)
import { useEntityData } from "./interface/hooks/useEntityData";
import { useWorkspaceUI as useDefaultWorkspaceUI } from "./interface/hooks/useWorkspaceUI";

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
  useWorkspaceUIHook, // NEW: Allow domains to provide their workspace-specific UI hook
  viewOptions = {},
  debug = false,
  // Optional Flow view support
  flowViewMode = null,
  onFlowToggle = null,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { goBack } = useBackNavigation();
  const cardsContainerRef = useRef(null);
  const isCreatingNewRef = useRef(false); // Track when we're creating new entity to prevent race conditions
  const uiRef = useRef(null); // Store latest UI actions to prevent effect dependency loops
  const hasRestoredSelectionRef = useRef(false); // Track if we've already restored selection from URL

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

  // Get UI state (search, filters, selection) - use provided hook or default
  const ui = useWorkspaceUIHook ? useWorkspaceUIHook() : useDefaultWorkspaceUI();

  // Keep uiRef updated with latest UI actions (avoids dependency loops in effects)
  uiRef.current = ui;

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

  // Memoize entities to prevent creating new array reference on every render
  const entities = useMemo(() => result?.items || [], [result?.items]);
  const entityType = dto?.entityType || dto?.getPrimaryEntityType?.() || "entities";

  // Memoize viewOptions to prevent unnecessary re-renders and effect triggers
  const cardsViewOptions = useMemo(() => ({
    ...viewOptions,
    viewMode: "cards",
    selectionMode: ui.selectionMode
  }), [viewOptions, ui.selectionMode]);

  const splitViewOptions = useMemo(() => ({
    ...viewOptions,
    viewMode: "split",
    selectionMode: ui.selectionMode
  }), [viewOptions, ui.selectionMode]);

  // Reset filters when entityType changes (switching workspaces)
  useEffect(() => {
    ui.resetFilters();
    // Reset selection restoration flag when switching workspaces
    hasRestoredSelectionRef.current = false;
  }, [entityType, ui.resetFilters]);

  // Clear selections and scroll to top when entering workspace (fresh page load)
  useEffect(() => {
    // ARCHITECTURAL FIX: Don't run this effect if we're in the middle of creating a new entity
    // This prevents race condition where effect clears selection right after handleCreateNew sets it
    if (isCreatingNewRef.current) {
      return;
    }

    // Read selected id from URL once on mount
    const urlParams = new URLSearchParams(window.location.search);
    const desiredSelectedId = urlParams.get("selected");

    // ARCHITECTURAL FIX: If we've already successfully restored a selection from URL, don't run again
    // This prevents infinite loop where effect keeps re-setting the same entity
    if (hasRestoredSelectionRef.current && desiredSelectedId) {
      return;
    }

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
        if (uiRef.current.selectedEntity?.id?.toString() !== found.id?.toString()) {
          uiRef.current.setSelectedEntity(found);
        }
        // Mark that we've successfully restored selection to prevent re-running
        hasRestoredSelectionRef.current = true;
        return true;
      }
      return false;
    };

    // If no selection in URL, just clear any existing selection
    if (!desiredSelectedId) {
      // Clear selection if user navigated without specific entity selection
      // BUT: Don't clear if the current entity is a new entity being created (__isNew)
      if (uiRef.current.selectedEntity && !uiRef.current.selectedEntity.__isNew) {
        uiRef.current.setSelectedEntity(null);
      }

      // Scroll all containers to top (only if we're not creating a new entity AND not in multi-select mode)
      if (!ui.selectedEntity?.__isNew && ui.selectionMode !== 'multi') {
        setTimeout(() => {
          const scrollContainers = document.querySelectorAll(".overflow-y-auto");
          scrollContainers.forEach((container) => {
            container.scrollTop = 0;
          });
        }, 100);
      }
      return;
    }

    // If entities list is empty, don't try to fetch - the entity definitely doesn't exist
    if (entities.length === 0) {
      // Only clear selection if there is currently a selection AND it's not a new entity being created
      if (uiRef.current.selectedEntity && !uiRef.current.selectedEntity.__isNew) {
        uiRef.current.setSelectedEntity(null);
      }
      return;
    }

    // If entities are already loaded, try restore immediately
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
              uiRef.current.setSelectedEntity(fetched);
              // Mark that we've successfully restored selection to prevent re-running
              hasRestoredSelectionRef.current = true;
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

    // NOTE: Intentionally NOT including ui.setSelectedEntity in deps to avoid infinite loop
    // The function reference changes on every render but the underlying Zustand action is stable
    // ARCHITECTURAL FIX: Removed entities.length from deps - this effect is for navigation/mount only
    // Entity data changes should NOT trigger this effect (was causing scroll on checkbox click)
  }, [dto, location.pathname]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Event handlers
  const handleEntitySelect = useCallback(
    (entity, action = "select") => {
      if (action === "delete") {
        // Handle delete action - call delete directly to avoid dependency issues
        dto
          .delete(entity)
          .then(() => {
            refetch(); // Refresh the list after successful delete
            // Clear selection if we deleted the selected entity
            if (ui.selectedEntity?.id === entity.id) {
              ui.setSelectedEntity(null);
            }
          })
          .catch((error) => {
            console.error("Delete failed:", error);
            // You might want to show a toast notification here
          });
        return;
      }

      if (action === "edit") {
        // Handle edit action - select entity and switch to split view
        const enhancedEntity = entity ? dto.enhanceEntity(entity) : null;
        ui.setSelectedEntity(enhancedEntity);
        ui.setViewMode("split");

        // Update URL with selected entity ID
        if (entity && entity.id) {
          const currentPath = window.location.pathname;
          const newUrl = `${currentPath}?selected=${entity.id}`;
          window.history.replaceState(null, "", newUrl);
        }
        return;
      }

      if (action === "editCard") {
        // Handle editCard action - select entity and enable inline card editing
        const enhancedEntity = entity ? dto.enhanceEntity(entity) : null;
        ui.setSelectedEntity(enhancedEntity);
        // Stay in current view mode but enable card editing

        // Update URL with selected entity ID
        if (entity && entity.id) {
          const currentPath = window.location.pathname;
          const newUrl = `${currentPath}?selected=${entity.id}&editCard=true`;
          window.history.replaceState(null, "", newUrl);
        }
        return;
      }

      // Default 'select' action - just select without changing view
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
    [ui.setSelectedEntity, ui.setViewMode, dto, refetch, ui.selectedEntity, debug]
  );

  /**
   * Handle bulk delete of multiple entities
   * Deletes entities in parallel and shows feedback
   */
  const handleBulkDelete = useCallback(
    async (uiKeys) => {
      if (!uiKeys || uiKeys.size === 0) return;

      // Confirmation dialog
      const confirmed = window.confirm(
        `Er du sikker på at du vil slette ${uiKeys.size} ${uiKeys.size === 1 ? 'element' : 'elementer'}? Dette kan ikke angres.`
      );

      if (!confirmed) return;

      // Track success/failure
      const results = {
        success: [],
        failed: [],
      };

      // Delete in parallel for better performance
      const deletePromises = Array.from(uiKeys).map(async (uiKey) => {
        try {
          // Find the full entity from the entities list using dto.getUIKey()
          const entity = entities.find(e => dto.getUIKey(e) === uiKey);

          if (entity) {
            // Entity found in current page - pass full entity
            await dto.delete(entity);
          } else {
            // Entity not in current page - extract ID and type from uiKey
            // For combined views: "prosjektkrav-5" -> { id: 5, entityType: "prosjektkrav" }
            // For single views: 5 -> { id: 5 }
            let entityToDelete = { id: uiKey };

            if (typeof uiKey === 'string' && uiKey.includes('-')) {
              // Parse "entityType-id" format
              const parts = uiKey.split('-');
              const numericId = parseInt(parts[parts.length - 1], 10);
              const entityType = parts.slice(0, -1).join('-'); // Handle multi-word types

              entityToDelete = {
                id: numericId,
                entityType: entityType,
                // Add renderId to help adapter detect type
                renderId: uiKey
              };
            }

            // Pass minimal entity with ID and type
            await dto.delete(entityToDelete);
          }

          results.success.push(uiKey);
        } catch (error) {
          // Handle "not found" errors gracefully - entity already deleted
          const isNotFound =
            error.response?.status === 400 &&
            (error.response?.data?.error?.includes('not found') ||
             error.response?.data?.error?.includes('Not found'));

          if (isNotFound) {
            console.log(`LOGBACKEND Entity ${uiKey} already deleted, treating as success`);
            results.success.push(uiKey);
          } else {
            // Log full error details for actual failures
            console.log(`LOGBACKEND Failed to delete item ${uiKey}:`, {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
            });
            results.failed.push({ id: uiKey, error });
          }
        }
      });

      // Wait for all deletes to complete
      await Promise.all(deletePromises);

      // Clear selection
      if (ui.clearSelection) {
        ui.clearSelection();
      }

      // Refetch list
      await refetch();

      // Show feedback only for errors (silent success is better UX)
      if (results.failed.length > 0) {
        if (results.success.length === 0) {
          // All failed - show error
          alert(`❌ Kunne ikke slette noen elementer`);
        } else {
          // Partial success - show warning
          alert(
            `⚠️ ${results.success.length} elementer slettet\n` +
            `${results.failed.length} feilet`
          );
        }
      }
      // Silent success: Items disappear from list = visual confirmation

      // Clear selected entity if it was deleted (compare using UI key)
      if (ui.selectedEntity && results.success.includes(dto.getUIKey(ui.selectedEntity))) {
        ui.setSelectedEntity(null);

        // Also clear URL parameter to prevent trying to fetch deleted entity
        const url = new URL(window.location);
        if (url.searchParams.has('selected')) {
          url.searchParams.delete('selected');
          window.history.replaceState({}, '', url);
        }
      }
    },
    [dto, refetch, ui, entities]
  );

  const handleSearch = useCallback(() => {
    ui.executeSearch(); // Update activeSearchQuery from searchInput
    // TanStack Query will automatically refetch when activeSearchQuery changes
  }, [ui.executeSearch]);

  const handleCreateNew = useCallback(
    (entityType = null, initialData = {}) => {
      // ARCHITECTURAL FIX: Set flag to prevent URL selection effect from interfering
      isCreatingNewRef.current = true;

      // Use DTO to create properly structured new entity
      const newEntity = dto.createNewEntity(entityType, initialData);

      // Allow workspace to handle domain-specific cleanup BEFORE setting entity to avoid race conditions
      if (typeof newEntity?.__onCreateNew === 'function') {
        newEntity.__onCreateNew();
      }

      // Enhance the new entity through DTO normalization
      const enhancedNewEntity = dto.enhanceEntity(newEntity);

      // Set default organisasjonstilhorlighet from user's enhetId (only once, on creation)
      if (!enhancedNewEntity.organisasjonstilhorlighet) {
        const user = useUserStore.getState().user;
        if (user?.enhetId) {
          enhancedNewEntity.organisasjonstilhorlighet = user.enhetId;
        }
      }

      // Set entity AFTER cleanup to ensure store is clear before components render
      ui.setSelectedEntity(enhancedNewEntity);

      // Clear the flag after a brief delay to allow the selection to settle
      setTimeout(() => {
        isCreatingNewRef.current = false;
      }, 100);
    },
    [ui.setSelectedEntity, dto]
  );

  const handleDetailClose = useCallback(async () => {
    // Clear creation flag when closing detail pane
    isCreatingNewRef.current = false;

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

        // Invalidate related query caches to ensure dropdowns are updated
        // This is crucial for parent/child relationships to work immediately
        if (entityType === 'prosjekttiltak' || entityType === 'tiltak') {
          // Invalidate prosjektTiltak queries so parent dropdowns refresh
          queryClient.invalidateQueries({
            queryKey: ["prosjektTiltak", "simple"]
          });
        }
        if (entityType === 'prosjektkrav' || entityType === 'krav') {
          // Invalidate prosjektKrav queries so parent dropdowns refresh
          queryClient.invalidateQueries({
            queryKey: ["prosjektKrav", "simple"]
          });
        }
        if (entityType === 'tiltak') {
          // Also invalidate general tiltak queries
          queryClient.invalidateQueries({
            queryKey: ["tiltak", "simple"]
          });
        }
        if (entityType === 'krav') {
          // Also invalidate general krav queries
          queryClient.invalidateQueries({
            queryKey: ["krav", "simple"]
          });
        }

        // Let DTO handle post-save logic (selection, scrolling, etc.)
        // Pass the entity type context for proper dependency injection (DTO normalized)
        // Check if we're in edit card mode before letting DTO override selection
        const urlParams = new URLSearchParams(window.location.search);
        const isInEditCardMode = urlParams.get("editCard") === "true";

        if (isInEditCardMode) {
          // If we're in edit card mode, preserve it after save by not letting DTO change selection
          // Just refresh the selected entity without changing URL
          // Extract the actual data from the response if it's an Axios response
          const entityData = result?.data || result;
          const updatedEntity = dto.enhanceEntity(entityData);
          ui.setSelectedEntity(updatedEntity);
        } else {
          // Normal post-save behavior
          dto.onSaveComplete(result, !isUpdate, handleEntitySelect, entityType);
        }

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
        dto.onDeleteComplete(entity, () => {
          ui.setSelectedEntity(null);

          // Also clear URL parameter to prevent trying to fetch deleted entity
          const url = new URL(window.location);
          if (url.searchParams.has('selected')) {
            url.searchParams.delete('selected');
            window.history.replaceState({}, '', url);
          }
        });
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
        <div className="max-w-none w-full p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">Feil ved lasting av {entityType}</h3>
            <p className="text-red-700 mb-4">{error.message}</p>
            <div className="flex gap-3">
              <Button onClick={goBack} variant="outline">
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
      <div className="max-w-none w-full" style={{ maxWidth: "none" }}>
        {/* Header with search */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="text-neutral-600 hover:text-neutral-900"
              >
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
                {/* Flow View Toggle - Optional */}
                {onFlowToggle && (
                  <Button
                    variant={flowViewMode === "flow" ? "default" : "ghost"}
                    size="sm"
                    onClick={onFlowToggle}
                    className="h-8 w-8 p-0"
                    title={flowViewMode === "flow" ? "Exit Flow View" : "Flow View"}
                  >
                    <Network className="w-4 h-4" />
                  </Button>
                )}
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
              renderActionButtons({ handleCreateNew, currentFilters: ui.filters })
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
                onEntitySelect={(entity, action) => {
                  handleEntitySelect(entity, action);
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
                viewOptions={cardsViewOptions}
                onSave={handleSave} // Pass onSave for card editing
                onBulkDelete={handleBulkDelete} // Pass bulk delete handler
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
              onCreateNew={handleCreateNew}
              dto={dto}  // NEW: Pass dto for inheritance logic
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
                  viewOptions={splitViewOptions}
                  onSave={handleSave} // Pass onSave for split mode editing too
                  onBulkDelete={handleBulkDelete} // Pass bulk delete handler
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
