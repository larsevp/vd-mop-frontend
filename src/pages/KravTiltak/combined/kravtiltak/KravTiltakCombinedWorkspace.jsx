import React from "react";
import { EntityWorkspaceNew } from "@/components/EntityWorkspace";
import { createCombinedEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createKravTiltakCombinedAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderSearchBar, renderDetailPane, getAvailableViewOptions } from "./renderer";
import { useKravTiltakCombinedViewStore } from "./store";
import { RowListHeading } from "../../shared";

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
  const adapter = createKravTiltakCombinedAdapter({ debug: true });

  // Create combined DTO
  const dto = createCombinedEntityDTO(adapter, { debug: true });

  // Get view options state
  const { viewOptions, setViewOptions } = useKravTiltakCombinedViewStore();

  return (
    <EntityWorkspaceNew
      key={`${dto.entityType || "krav-tiltak-combined-workspace"}`}
      dto={dto}
      renderEntityCard={(entity, props) => renderEntityCard(entity, props, dto)}
      renderGroupHeader={renderGroupHeader}
      renderDetailPane={renderDetailPane}
      renderSearchBar={renderSearchBar}
      renderListHeading={(props) => (
        <RowListHeading
          {...props}
          viewOptions={viewOptions}
          onViewOptionsChange={setViewOptions}
          availableViewOptions={getAvailableViewOptions()}
        />
      )}
      viewOptions={viewOptions}
      debug={false}
    />
  );
};

export default KravTiltakCombinedWorkspace;
