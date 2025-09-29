import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { createCombinedEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createKravTiltakCombinedAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderSearchBar, renderDetailPane, renderActionButtons, getAvailableViewOptions } from "./renderer";
import { createWorkspaceUIHook } from "@/components/EntityWorkspace/interface/hooks/createWorkspaceUIHook";
import { useKravTiltakCombinedViewStore, useKravTiltakCombinedUIStore } from "./store";
import { RowListHeading } from "../../shared";
import { useKravTiltakInheritanceStore, useProsjektKravTiltakInheritanceStore } from "@/stores/formInheritanceStore";

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
  // Clear both inheritance stores when this workspace mounts (only once)
  React.useEffect(() => {
    useKravTiltakInheritanceStore.getState().clearAllInheritance();
    useProsjektKravTiltakInheritanceStore.getState().clearAllInheritance();
  }, []); // Empty dependency array - only run once on mount

  // Create combined adapter
  const adapter = createKravTiltakCombinedAdapter({ debug: true });

  // Create combined DTO with workspace-specific cleanup
  const dto = createCombinedEntityDTO(adapter, {
    debug: true,
    onCreateNew: () => {
      // Clear KravTiltak inheritance store when creating new entities
      useKravTiltakInheritanceStore.getState().clearAllInheritance();
    }
  });

  // Get view options state
  const { viewOptions, setViewOptions } = useKravTiltakCombinedViewStore();

  // Create workspace-specific UI hook
  const { useWorkspaceUI } = createWorkspaceUIHook(useKravTiltakCombinedUIStore);

  return (
    <EntityWorkspace
      key="krav-tiltak-combined-workspace-fixed"
      dto={dto}
      renderEntityCard={(entity, props) => renderEntityCard(entity, props, dto)}
      renderGroupHeader={renderGroupHeader}
      renderDetailPane={renderDetailPane}
      renderSearchBar={renderSearchBar}
      renderActionButtons={renderActionButtons}
      renderListHeading={(props) => (
        <RowListHeading
          {...props}
          viewOptions={viewOptions}
          onViewOptionsChange={setViewOptions}
          availableViewOptions={getAvailableViewOptions()}
        />
      )}
      useWorkspaceUIHook={useWorkspaceUI}
      viewOptions={viewOptions}
      debug={false}
    />
  );
};

export default KravTiltakCombinedWorkspace;
