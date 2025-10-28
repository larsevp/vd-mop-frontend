import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak";
import { createSingleEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createTiltakAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderSearchBar, renderDetailPane, getAvailableViewOptions } from "./renderer";
import { createWorkspaceUIHook } from "@/components/EntityWorkspace/interface/hooks/createWorkspaceUIHook";
import { createWorkspaceUIStore } from "@/components/EntityWorkspace/interface/stores/createWorkspaceUIStore";
import { useTiltakViewStore, useTiltakUIStore } from "./store";
import { RowListHeading } from "../shared";
import { Trash2, Copy } from "lucide-react";
import { CopyToProjectModal } from "../shared/components/CopyToProjectModal/CopyToProjectModal";
import { copyTiltakToProject } from "@/api/endpoints/models/prosjektTiltak";

/**
 * Tiltak Workspace using the generic EntityWorkspace component
 *
 * This workspace handles general measures/actions (Tiltak) which are:
 * - Base-level measures not tied to specific projects
 * - Templates that can be used to create ProsjektTiltak
 * - Can have relationships to general Krav
 * - Support rich text for implementation details and feedback
 * - Include file attachments and hierarchical structure
 *
 * Features automatically provided by EntityWorkspace:
 * - General data fetching and filtering (no project context)
 * - Search, filtering, sorting across all general measures
 * - Grouping by emne (if configured)
 * - CRUD operations for general measures
 * - Responsive UI layout
 * - Loading and error states
 * - File attachments and rich text editing
 * - Favorite system integration
 *
 * URL Parameters:
 * - preset=generelle: Shows only generelle tiltak (not obligatory, not linked to krav)
 */
const TiltakWorkspace = () => {
  // Get URL params to check for preset mode
  const [searchParams] = useSearchParams();
  const preset = searchParams.get("preset");
  const isGenerelleMode = preset === "generelle";

  // Create modified config for generelle tiltak mode
  const activeConfig = useMemo(() => {
    if (!isGenerelleMode) return tiltakConfig;

    // Override query functions for generelle tiltak (keep CRUD functions for DTO to work)
    return {
      ...tiltakConfig,
      title: "Generelle Tiltak",
      queryFn: tiltakConfig.queryFnGenerelle,
      queryFnWorkspace: tiltakConfig.queryFnGenerelle,
      queryFnGroupedByEmne: tiltakConfig.queryFnGenerelleGroupedByEmne,
      queryFnGroupedByEmneWorkspace: tiltakConfig.queryFnGenerelleGroupedByEmne,
    };
  }, [isGenerelleMode]);

  // Create Tiltak adapter (memoized - expensive operation)
  const adapter = useMemo(() => createTiltakAdapter(activeConfig), [activeConfig]);

  // Wrap adapter in DTO for unified interface (memoized - depends on stable adapter)
  const dto = useMemo(() => createSingleEntityDTO(adapter), [adapter]);

  // Get view options state
  const { viewOptions: storeViewOptions, setViewOptions } = useTiltakViewStore();

  // Override viewOptions in generelle mode - hide obligatorisk since all are optional
  const viewOptions = useMemo(() => {
    if (!isGenerelleMode) return storeViewOptions;

    return {
      ...storeViewOptions,
      showObligatorisk: false, // Force hide in generelle mode - all are optional
    };
  }, [isGenerelleMode, storeViewOptions]);

  // Use different UI stores for normal and generelle mode to keep viewMode separate
  const normalUIStore = useTiltakUIStore;
  const generelleUIStore = useMemo(() => createWorkspaceUIStore('tiltak-generelle', {
    defaultViewMode: 'cards' // Default to article/card view for generelle tiltak
  }), []);

  // Get UI store based on mode
  const uiStoreHook = isGenerelleMode ? generelleUIStore : normalUIStore;
  const ui = uiStoreHook();

  // Create workspace-specific UI hook (memoized) - use different store based on mode
  const { useWorkspaceUI } = useMemo(() => createWorkspaceUIHook(uiStoreHook), [uiStoreHook]);

  // Reset selection mode on mount AND when switching between normal/generelle mode
  useEffect(() => {
    // Force reset to single mode and clear any selected entity
    ui.setSelectionMode('single');
    ui.clearSelection();

    // Always force cards view for generelle tiltak (read-only browsing mode)
    if (isGenerelleMode) {
      ui.setViewMode('cards');
    }

    // Cleanup on unmount
    return () => {
      ui.setSelectionMode('single');
      ui.clearSelection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerelleMode]); // Reset when switching between normal and generelle mode

  // Copy modal state (reusing existing CopyToProjectModal)
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [entitiesToCopy, setEntitiesToCopy] = useState([]);

  // Copy handler for single entity (used in generelle tiltak card view)
  const handleCopyToProject = useCallback((entity) => {
    setEntitiesToCopy([entity.id]);
    setCopyModalOpen(true);
  }, []);

  // Wrapper for copyTiltakToProject API that matches CopyToProjectModal's expected signature
  const copyFunction = useCallback(async (entityIds, targetProjectId, sourceProjectId) => {
    // Call the API - it expects (projectId, tiltakIds, filters)
    const response = await copyTiltakToProject(targetProjectId, entityIds, null);
    return response;
  }, []);

  // Memoize renderEntityCard to prevent recreation on every render
  const renderEntityCardMemoized = useCallback((entity, props) => {
    // Pass multi-select props to EntityCard
    return renderEntityCard(entity, {
      ...props,
      selectionMode: ui.selectionMode,
      isItemSelected: ui.selectedEntities.has(entity.id),
      onToggleSelection: ui.toggleEntitySelection,
      // Nullify onFieldSave in generelle mode for read-only cards
      onFieldSave: isGenerelleMode ? null : props.onFieldSave,
      // Pass copy handler for generelle mode
      onCopyToProject: isGenerelleMode ? handleCopyToProject : null,
    });
  }, [ui.selectionMode, ui.selectedEntities, ui.toggleEntitySelection, isGenerelleMode, handleCopyToProject]);

  // Memoize renderListHeading to prevent recreation on every render
  const renderListHeadingMemoized = useCallback((props) => {
    // Get all IDs from entities in props
    const allIds = props.entities ? props.entities.map(e => e.id) : [];

    // Define bulk actions (shown in dropdown menu)
    const bulkActions = [
      {
        label: 'Kopier',
        icon: Copy,
        onClick: (selectedIds) => {
          // Open copy modal with selected IDs
          setEntitiesToCopy(Array.from(selectedIds));
          setCopyModalOpen(true);
        },
        disabled: false,
      },
      {
        label: 'Slett',
        icon: Trash2,
        variant: 'destructive',
        separator: true, // Show separator before destructive actions
        onClick: (selectedIds) => props.onBulkDelete?.(selectedIds),
      },
    ];

    return (
      <RowListHeading
        {...props}
        viewOptions={{ ...props.viewOptions, ...viewOptions, viewMode: ui.viewMode }}
        onViewOptionsChange={setViewOptions}
        availableViewOptions={getAvailableViewOptions()}
        // Multi-select props
        selectionMode={ui.selectionMode}
        selectedIds={ui.selectedEntities}
        onToggleSelectionMode={ui.toggleSelectionMode}
        onSelectAll={ui.selectAll}
        onClearSelection={ui.clearSelection}
        allItemIds={allIds}
        bulkActions={bulkActions}
      />
    );
  }, [viewOptions, setViewOptions, ui.selectionMode, ui.selectedEntities, ui.toggleSelectionMode, ui.selectAll, ui.clearSelection, ui.viewMode]);

  // Custom action buttons for generelle tiltak (hide create button)
  const renderActionButtons = useCallback(({ handleCreateNew, currentFilters }) => {
    if (isGenerelleMode) {
      // In generelle mode, render invisible button to keep search bar centered
      return <div className="invisible">
        <button className="px-4 py-2 text-sm font-medium">
          Opprett ny
        </button>
      </div>;
    }
    // In normal mode, show default create button
    return null; // Return null to use default button
  }, [isGenerelleMode]);

  // Wrap detail pane to make it read-only in generelle mode
  const renderDetailPaneMemoized = useMemo(() => {
    if (!isGenerelleMode) {
      // In normal mode, use original render function
      return renderDetailPane;
    }

    // In generelle mode, return wrapper that disables save and delete
    // IMPORTANT: renderDetailPane signature is (entity, props), not just (props)
    return (entity, props) => {
      if (!props || !entity) {
        return null;
      }

      // Create read-only modelConfig: preserve all read functions, nullify write functions
      const readOnlyModelConfig = {
        ...tiltakConfig,
        createFn: null,
        updateFn: null,
        deleteFn: null,
      };

      // Pass read-only config and null callbacks to completely disable write operations
      return renderDetailPane(entity, {
        ...props,
        onSave: null,
        onDelete: null,
        modelConfig: readOnlyModelConfig,
      });
    };
  }, [isGenerelleMode]);

  return (
    <>
      <EntityWorkspace
        key={`tiltak-workspace-${isGenerelleMode ? 'generelle' : 'all'}`}
        dto={dto}
        renderEntityCard={renderEntityCardMemoized}
        renderGroupHeader={renderGroupHeader}
        renderSearchBar={renderSearchBar}
        renderDetailPane={renderDetailPaneMemoized}
        renderListHeading={renderListHeadingMemoized}
        renderActionButtons={isGenerelleMode ? renderActionButtons : undefined}
        useWorkspaceUIHook={useWorkspaceUI}
        viewOptions={viewOptions}
        debug={false}
      />

      {/* Copy to Project Modal - used for both single entity (card button) and bulk selection */}
      <CopyToProjectModal
        open={copyModalOpen}
        onClose={() => {
          setCopyModalOpen(false);
          setEntitiesToCopy([]);
        }}
        selectedEntities={new Set(entitiesToCopy)}
        entityType="prosjekttiltak"
        copyFunction={copyFunction}
        onCopyComplete={() => {
          setCopyModalOpen(false);
          setEntitiesToCopy([]);
          // Clear multi-select if it was used
          if (ui.selectionMode === 'multi') {
            ui.clearSelection();
          }
        }}
      />
    </>
  );
};

export default TiltakWorkspace;
