import React, { useMemo, useCallback, useEffect, useState } from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { krav as kravConfig } from "@/modelConfigs/models/krav";
import { createSingleEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createKravAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderSearchBar, renderDetailPane, renderActionButtons, getAvailableViewOptions } from "./renderer";
import { createWorkspaceUIHook } from "@/components/EntityWorkspace/interface/hooks/createWorkspaceUIHook";
import { useKravViewStore, useKravUIStore } from "./store";
import { RowListHeading } from "../shared";
import { Trash2, Copy } from "lucide-react";
import { CopyToProjectModal } from "../shared/components/CopyToProjectModal";
import { copyKravToProject } from "@/api/endpoints/models/prosjektKrav";
import { useWorkspaceParams } from "@/hooks/useWorkspaceParams";

/**
 * Krav Workspace using the generic EntityWorkspace component
 *
 * This workspace handles general requirements (Krav) which are:
 * - Base-level requirements not tied to specific projects
 * - Templates that can be used to create ProsjektKrav
 * - Can have relationships to general Tiltak
 * - Support rich text content, file attachments, and hierarchical structure
 *
 * Features automatically provided by EntityWorkspace:
 * - General data fetching and filtering (no project context)
 * - Search, filtering, sorting across all general requirements
 * - Grouping by emne (if configured)
 * - CRUD operations for general requirements
 * - Responsive UI layout
 * - Loading and error states
 * - File attachments and rich text editing
 */
const KravWorkspace = () => {
  // Read and apply workspace context from URL params (fagområdeId, projectId)
  useWorkspaceParams();

  // Modal state for copy to project
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Wrapper function to adapt copyKravToProject signature to match CopyToProjectModal expectations
  // Modal expects: (entityIds, targetProjectId, sourceProjectId)
  // API expects: (projectId, kravIds, filters)
  const handleCopyKravToProject = useCallback((kravIds, targetProjectId, sourceProjectId) => {
    // sourceProjectId is not needed for Krav → ProsjektKrav (Krav are not project-specific)
    return copyKravToProject(targetProjectId, kravIds, null);
  }, []);

  // Create Krav adapter (memoized - expensive operation)
  const adapter = useMemo(() => createKravAdapter(kravConfig), []);

  // Wrap adapter in DTO for unified interface (memoized - depends on stable adapter)
  const dto = useMemo(() => createSingleEntityDTO(adapter), [adapter]);

  // Get view options state
  const { viewOptions, setViewOptions } = useKravViewStore();

  // Get UI store for multi-select state
  const ui = useKravUIStore();

  // Create workspace-specific UI hook (memoized)
  const { useWorkspaceUI } = useMemo(() => createWorkspaceUIHook(useKravUIStore), []);

  // Reset UI state on mount and when navigating away from workspace
  useEffect(() => {
    // Reset on mount
    ui.setSelectionMode('single');
    ui.clearSelection();

    return () => {
      // Reset on unmount
      ui.setSelectionMode('single');
      ui.clearSelection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Memoize renderEntityCard to prevent recreation on every render
  const renderEntityCardMemoized = useCallback((entity, props) => {
    // Pass multi-select props to EntityCard
    return renderEntityCard(entity, {
      ...props,
      selectionMode: ui.selectionMode,
      isItemSelected: ui.selectedEntities.has(entity.id),
      onToggleSelection: ui.toggleEntitySelection,
    });
  }, [ui.selectionMode, ui.selectedEntities, ui.toggleEntitySelection]);

  // Memoize renderListHeading to prevent recreation on every render
  const renderListHeadingMemoized = useCallback((props) => {
    // Get all IDs from entities in props
    const allIds = props.entities ? props.entities.map(e => e.id) : [];

    // Define bulk actions (shown in dropdown menu)
    const bulkActions = [
      {
        label: 'Kopier til prosjekt',
        icon: Copy,
        onClick: (selectedIds) => {
          setShowCopyModal(true);
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
        bulkActions={bulkActions}
      />
    );
  }, [viewOptions, setViewOptions, ui.selectionMode, ui.selectedEntities, ui.toggleSelectionMode, ui.selectAll, ui.clearSelection]);

  return (
    <>
      <EntityWorkspace
        key={`${dto.entityType || "krav-workspace"}`}
        dto={dto}
        renderEntityCard={renderEntityCardMemoized}
        renderGroupHeader={renderGroupHeader}
        renderSearchBar={renderSearchBar}
        renderDetailPane={renderDetailPane}
        renderActionButtons={renderActionButtons}
        renderListHeading={renderListHeadingMemoized}
        useWorkspaceUIHook={useWorkspaceUI}
        viewOptions={viewOptions}
        debug={false}
      />

      {/* Copy to Project Modal */}
      <CopyToProjectModal
        open={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          ui.clearSelection();
        }}
        selectedEntities={ui.selectedEntities}
        entityType="krav"
        copyFunction={handleCopyKravToProject}
        isGenerelleEntities={true}
      />
    </>
  );
};

export default KravWorkspace;
