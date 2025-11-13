import React, { useMemo, useCallback, useEffect, useState } from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav";
import { createSingleEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createProsjektKravAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderSearchBar, renderDetailPane, getAvailableViewOptions } from "./renderer";
import { createWorkspaceUIHook } from "@/components/EntityWorkspace/interface/hooks/createWorkspaceUIHook";
import { useProsjektKravViewStore, useProsjektKravUIStore } from "./store";
import { RowListHeading } from "../shared";
import { useProjectStore } from "@/stores/userStore";
import { Link } from "react-router-dom";
import { ArrowLeft, Building, Trash2, Copy } from "lucide-react";
import { CopyToProjectModal } from "../shared/components/CopyToProjectModal";
import { massKopyProsjektKravToProject } from "@/api/endpoints/models/prosjektKrav";
import { useWorkspaceParams } from "@/hooks/useWorkspaceParams";

/**
 * ProsjektKrav Workspace using the generic EntityWorkspace component
 *
 * This workspace handles project-specific requirements (ProsjektKrav) which are:
 * - Project-scoped versions of general requirements
 * - Linked to specific projects
 * - Can have relationships to ProsjektTiltak
 * - Support the same rich features as general Krav but in project context
 *
 * Features automatically provided by EntityWorkspace:
 * - Project-specific data fetching and filtering
 * - Search, filtering, sorting within project scope
 * - Grouping by emne (if configured)
 * - CRUD operations for project requirements
 * - Responsive UI layout
 * - Loading and error states
 * - File attachments and rich text editing
 */
const ProsjektKravWorkspace = () => {
  // Read and apply workspace context from URL params (fagområdeId, projectId)
  useWorkspaceParams();

  const { currentProject } = useProjectStore();
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Show message if no project is selected
  if (!currentProject) {
    return (
      <div className="bg-background-primary min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
              <Building className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Ingen prosjekt valgt</h3>
              <p className="text-yellow-700 mb-4">Du må velge et prosjekt for å se prosjektspesifikke krav.</p>
              <Link to="/" className="inline-flex items-center text-yellow-800 hover:text-yellow-900 font-medium">
                <ArrowLeft size={16} className="mr-2" />
                Gå til prosjektliste
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create dynamic config with current project info
  const dynamicConfig = {
    ...prosjektKravConfig,
    title: `${currentProject.navn} - Krav`,
    desc: `Krav for prosjekt: ${currentProject.prosjektnummer || currentProject.navn}`,
  };

  // Create ProsjektKrav adapter
  const adapter = useMemo(() => createProsjektKravAdapter(dynamicConfig), []);

  // Wrap adapter in DTO for unified interface
  const dto = useMemo(() => createSingleEntityDTO(adapter), [adapter]);

  // Get view options state
  const { viewOptions, setViewOptions } = useProsjektKravViewStore();

  // Get UI store for multi-select state
  const ui = useProsjektKravUIStore();

  // Create workspace-specific UI hook
  const { useWorkspaceUI } = useMemo(() => createWorkspaceUIHook(useProsjektKravUIStore), []);

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

  // Get all visible entity IDs for "select all" functionality
  const getAllVisibleIds = (entities) => {
    return entities.map(e => e.id);
  };

  // Memoize renderEntityCard
  const renderEntityCardMemoized = useCallback((entity, props) => {
    return renderEntityCard(entity, {
      ...props,
      selectionMode: ui.selectionMode,
      isItemSelected: ui.selectedEntities.has(entity.id),
      onToggleSelection: ui.toggleEntitySelection,
    }, dto);
  }, [ui.selectionMode, ui.selectedEntities, ui.toggleEntitySelection, dto]);

  // Memoize renderListHeading
  const renderListHeadingMemoized = useCallback((props) => {
    // Get all IDs from entities in props
    const allIds = props.entities ? getAllVisibleIds(props.entities) : [];

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
        key={`${dto.entityType || "workspace"}-${currentProject?.id || "no-project"}`} // Force remount on project change
        dto={dto}
        renderEntityCard={renderEntityCardMemoized}
        renderGroupHeader={renderGroupHeader}
        renderSearchBar={renderSearchBar}
        renderDetailPane={renderDetailPane}
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
        entityType="prosjektkrav"
        copyFunction={massKopyProsjektKravToProject}
      />
    </>
  );
};

export default ProsjektKravWorkspace;
