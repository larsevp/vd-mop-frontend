import React, { useMemo, useCallback, useEffect } from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { createCombinedEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createKravTiltakCombinedAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderSearchBar, renderDetailPane, renderActionButtons, getAvailableViewOptions } from "./renderer";
import { createWorkspaceUIHook } from "@/components/EntityWorkspace/interface/hooks/createWorkspaceUIHook";
import { useKravTiltakCombinedViewStore, useKravTiltakCombinedUIStore } from "./store";
import { RowListHeading } from "../../shared";
import { Trash2, Copy } from "lucide-react";

/**
 * KravTiltakCombinedWorkspace - Combined workspace for Krav and Tiltak entities
 *
 * This workspace handles both general requirements (Krav) and general measures (Tiltak) which are:
 * - Base-level entities not tied to specific projects
 * - Can be used as templates to create project-specific versions
 * - Combined in a unified view showing relationships between requirements and measures
 * - Support rich text content, file attachments, and hierarchical structure
 *
 * Features automatically provided by EntityWorkspace:
 * - Combined data fetching and filtering (no project context)
 * - Search, filtering, sorting across both entity types
 * - Entity type filtering (Krav vs Tiltak)
 * - Grouping by emne (if configured)
 * - CRUD operations for both entity types
 * - Responsive UI layout
 * - Loading and error states
 * - File attachments and rich text editing
 */
const KravTiltakCombinedWorkspace = () => {
  // Create combined adapter
  const adapter = useMemo(() => createKravTiltakCombinedAdapter({ debug: true }), []);

  // Create combined DTO
  // Inheritance now managed by EntityDetailPane + adapters (no global state cleanup needed)
  const dto = useMemo(() => createCombinedEntityDTO(adapter, {
    debug: true,
  }), [adapter]);

  // Get view options state
  const { viewOptions, setViewOptions } = useKravTiltakCombinedViewStore();

  // Get UI store for multi-select state
  const ui = useKravTiltakCombinedUIStore();

  // Create workspace-specific UI hook
  const { useWorkspaceUI } = useMemo(() => createWorkspaceUIHook(useKravTiltakCombinedUIStore), []);

  // Reset UI state when navigating away from workspace
  useEffect(() => {
    return () => {
      ui.clearSelection();
      if (ui.selectionMode) {
        ui.toggleSelectionMode();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Get all visible entity IDs for "select all" functionality
  const getAllVisibleIds = (entities) => {
    return entities.map(e => dto.getUIKey(e));
  };

  // Memoize renderEntityCard
  const renderEntityCardMemoized = useCallback((entity, props) => {
    // Use dto.getUIKey() for uniqueness in combined views
    const uiKey = dto.getUIKey(entity);
    return renderEntityCard(entity, {
      ...props,
      selectionMode: ui.selectionMode,
      isItemSelected: ui.selectedEntities.has(uiKey),
      onToggleSelection: (_, metadata) => ui.toggleEntitySelection(uiKey, metadata),
    }, dto);
  }, [ui.selectionMode, ui.selectedEntities, ui.toggleEntitySelection, dto]);

  // Memoize renderListHeading
  const renderListHeadingMemoized = useCallback((props) => {
    // Get all UI keys from entities in props using dto.getUIKey()
    const allIds = props.entities ? getAllVisibleIds(props.entities) : [];

    // Extract entity metadata for combined views (needed for bulk operations)
    const allEntitiesMetadata = props.entities ? props.entities.map(e => ({
      id: e.id,
      entityType: e.entityType,
      renderId: e.renderId,
      uiKey: dto.getUIKey(e)
    })) : [];

    // Define bulk actions (shown in dropdown menu)
    const bulkActions = [
      {
        label: 'Kopier',
        icon: Copy,
        onClick: (selectedIds) => {
          // TODO: Implement copy functionality
          alert(`Kopier funksjonalitet kommer snart! (${selectedIds.size} valgt)`);
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
        viewOptions={viewOptions}
        onViewOptionsChange={setViewOptions}
        availableViewOptions={getAvailableViewOptions()}
        // Multi-select props
        selectionMode={ui.selectionMode}
        selectedIds={ui.selectedEntities}
        onToggleSelectionMode={ui.toggleSelectionMode}
        onSelectAll={ui.selectAll}
        onClearSelection={ui.clearSelection}
        allItemIds={allIds}
        allEntitiesMetadata={allEntitiesMetadata}
        bulkActions={bulkActions}
      />
    );
  }, [viewOptions, setViewOptions, ui.selectionMode, ui.selectedEntities, ui.toggleSelectionMode, ui.selectAll, ui.clearSelection, dto]);

  return (
    <EntityWorkspace
      key="krav-tiltak-combined-workspace-fixed"
      dto={dto}
      renderEntityCard={renderEntityCardMemoized}
      renderGroupHeader={renderGroupHeader}
      renderDetailPane={renderDetailPane}
      renderSearchBar={renderSearchBar}
      renderActionButtons={renderActionButtons}
      renderListHeading={renderListHeadingMemoized}
      useWorkspaceUIHook={useWorkspaceUI}
      viewOptions={viewOptions}
      debug={false}
    />
  );
};

export default KravTiltakCombinedWorkspace;
