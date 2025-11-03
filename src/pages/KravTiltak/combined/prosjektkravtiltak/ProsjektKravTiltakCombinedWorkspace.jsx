import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { createCombinedEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createProsjektKravTiltakCombinedAdapter } from "./adapter";
import { createCombinedRenderer } from "../shared/CombinedRenderer";
import { createWorkspaceUIHook } from "@/components/EntityWorkspace/interface/hooks/createWorkspaceUIHook";
import { useProsjektKravTiltakCombinedViewStore, useProsjektKravTiltakCombinedUIStore } from "./store";
import { RowListHeading } from "../../shared";
import { Trash2, Copy } from "lucide-react";
import { CombinedCopyModal } from "../../shared/components/CopyToProjectModal";
import { massKopyProsjektKravToProject } from "@/api/endpoints/models/prosjektKrav";
import { massKopyProsjektTiltakToProject } from "@/api/endpoints/models/prosjektTiltak";
import { useProjectStore } from "@/stores/userStore";

// Import individual renderers
import { renderEntityCard as ProsjektKravCardRenderer } from "../../prosjektkrav/renderer/ProsjektKravRenderer";
import { renderEntityCard as ProsjektTiltakCardRenderer } from "../../prosjekttiltak/renderer/ProsjektTiltakRenderer";
import { renderDetailPane as ProsjektKravDetailRenderer } from "../../prosjektkrav/renderer/ProsjektKravDetailRenderer";
import { renderDetailPane as ProsjektTiltakDetailRenderer } from "../../prosjekttiltak/renderer/ProsjektTiltakDetailRenderer";
import { createProsjektKravAdapter } from "../../prosjektkrav/adapter";
import { createProsjektTiltakAdapter } from "../../prosjekttiltak/adapter";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak";

/**
 * ProsjektKravTiltakCombinedWorkspace - Combined workspace for ProsjektKrav and ProsjektTiltak entities
 *
 * This workspace handles project-specific requirements (ProsjektKrav) and measures (ProsjektTiltak) which are:
 * - Project-specific entities tied to a particular project context
 * - Derived from general Krav/Tiltak templates but customized for project needs
 * - Combined in a unified view showing relationships between project requirements and measures
 * - Support rich text content, file attachments, hierarchical structure, and project-specific data
 *
 * Features automatically provided by EntityWorkspace:
 * - Project-scoped combined data fetching and filtering
 * - Search, filtering, sorting across both entity types within project context
 * - Entity type filtering (ProsjektKrav vs ProsjektTiltak)
 * - Grouping by emne (if configured)
 * - CRUD operations for both entity types
 * - Responsive UI layout
 * - Loading and error states
 * - File attachments and rich text editing
 * - Project context awareness
 */
const ProsjektKravTiltakCombinedWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject } = useProjectStore();
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Create combined adapter for project entities (memoized - expensive operation)
  const adapter = useMemo(() => createProsjektKravTiltakCombinedAdapter({ debug: true }), []);

  // Create combined DTO (memoized - depends on stable adapter)
  // Inheritance now managed by EntityDetailPane + adapters (no global state cleanup needed)
  const dto = useMemo(() => createCombinedEntityDTO(adapter, {
    debug: true,
  }), [adapter]);

  // Get view options state
  const { viewOptions, setViewOptions } = useProsjektKravTiltakCombinedViewStore();

  // Get UI store for multi-select state - SINGLE SOURCE OF TRUTH
  // Don't create separate hook instances - use the same one everywhere
  const ui = useProsjektKravTiltakCombinedUIStore();

  // Create workspace-specific UI hook (follows standard pattern like other workspaces)
  const { useWorkspaceUI } = createWorkspaceUIHook(useProsjektKravTiltakCombinedUIStore);

  // Reset selection mode on mount
  useEffect(() => {
    // Force reset to single mode and clear any selected entities
    ui.setSelectionMode('single');
    ui.clearSelection();

    // Cleanup on unmount
    return () => {
      ui.setSelectionMode('single');
      ui.clearSelection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Get all visible entity IDs for "select all" functionality
  const getAllVisibleIds = (entities) => {
    return entities.map(e => e.id);
  };

  // Handle Flow toggle - navigate to Flow workspace while preserving state
  const handleFlowToggle = () => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/prosjekt-krav-tiltak-combined')) {
      const flowPath = currentPath.replace('/prosjekt-krav-tiltak-combined', '/prosjekt-krav-tiltak-flow');
      // Preserve the location state (including returnTo)
      navigate(flowPath, { state: location.state });
    }
  };

  // Create combined renderer with proper configuration (memoized - stable config)
  const renderer = useMemo(() => createCombinedRenderer({
    entityTypes: {
      primary: "prosjektKrav",
      secondary: "prosjektTiltak",
    },
    cardRenderers: {
      primaryCardRenderer: ProsjektKravCardRenderer,
      secondaryCardRenderer: ProsjektTiltakCardRenderer,
    },
    renderers: {
      primaryDetailRenderer: ProsjektKravDetailRenderer,
      secondaryDetailRenderer: ProsjektTiltakDetailRenderer,
    },
    adapters: {
      primaryAdapter: createProsjektKravAdapter(prosjektKravConfig),
      secondaryAdapter: createProsjektTiltakAdapter(prosjektTiltakConfig),
    },
    labels: {
      primaryCreate: "Nytt krav",
      secondaryCreate: "Nytt tiltak",
      primaryCount: "prosjektkrav",
      secondaryCount: "prosjekttiltak",
      workspaceType: "prosjektkrav-tiltak-combined",
    },
    viewOptions: {
      showHierarchy: "Vis hierarki",
      showMerknad: "Vis merknader",
      showStatus: "Vis status",
      showVurdering: "Vis vurdering",
      showPrioritet: "Vis prioritet",
      showObligatorisk: "Vis obligatorisk",
      showRelations: "Vis relasjoner",
      showEntityType: "Vis enhetstype",
    },
  }), []);

  // Memoize renderEntityCard to prevent recreation on every render
  const renderEntityCard = useCallback((entity, props) => {
    // Pass multi-select props to EntityCard
    // Use dto.getUIKey() for uniqueness in combined views
    const uiKey = dto.getUIKey(entity);
    return renderer.renderEntityCard(entity, {
      ...props,
      selectionMode: ui.selectionMode,
      isItemSelected: ui.selectedEntities.has(uiKey),
      onToggleSelection: (clickedId, metadata) => ui.toggleEntitySelection(uiKey, metadata),
    });
  }, [dto, renderer, ui.selectionMode, ui.selectedEntities, ui.toggleEntitySelection]);

  // Memoize renderListHeading to prevent recreation on every render
  const renderListHeading = useCallback((props) => {
    // Get all UI keys from entities in props using dto.getUIKey()
    const allIds = props.entities ? props.entities.map(e => dto.getUIKey(e)) : [];

    // Extract entity metadata for combined views (needed for bulk operations)
    const allEntitiesMetadata = props.entities ? props.entities.map(e => {
      const uiKey = dto.getUIKey(e);
      return {
        id: e.id, // Original database ID
        entityType: e.entityType,
        renderId: e.renderId,
        uiKey: uiKey, // UI key for selection tracking
      };
    }) : [];

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
        // NOTE: Don't override props.viewOptions - it contains viewMode from EntityListPane
        // Just provide the change handler and available options
        onViewOptionsChange={setViewOptions}
        availableViewOptions={renderer.getAvailableViewOptions()}
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
  }, [dto, renderer, viewOptions, setViewOptions, ui.selectionMode, ui.selectedEntities, ui.toggleSelectionMode, ui.selectAll, ui.clearSelection]);

  return (
    <>
      <EntityWorkspace
        key="prosjekt-krav-tiltak-combined-workspace-fixed"
        dto={dto}
        renderEntityCard={renderEntityCard}
        renderGroupHeader={renderer.renderGroupHeader}
        renderDetailPane={renderer.renderDetailPane}
        renderSearchBar={renderer.renderSearchBar}
        renderActionButtons={renderer.renderActionButtons}
        renderListHeading={renderListHeading}
        useWorkspaceUIHook={useWorkspaceUI}
        viewOptions={viewOptions}
        debug={false}
        // Pass Flow toggle to EntityWorkspace header
        flowViewMode={null} // Not in flow mode
        onFlowToggle={handleFlowToggle}
      />

      {/* Combined Copy to Project Modal */}
      <CombinedCopyModal
        open={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          ui.clearSelection();
        }}
        selectedEntities={ui.selectedEntitiesMetadata}
        sourceProjectId={currentProject?.id} // Pass source project for project-specific entities
        copyFunctions={{
          prosjektKrav: massKopyProsjektKravToProject,
          prosjektTiltak: massKopyProsjektTiltakToProject,
        }}
      />
    </>
  );
};

export default ProsjektKravTiltakCombinedWorkspace;
