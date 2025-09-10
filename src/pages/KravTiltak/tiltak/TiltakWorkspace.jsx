import React from "react";
import { EntityWorkspaceNew } from "@/components/EntityWorkspace";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";
import { createSingleEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createTiltakAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderSearchBar, renderDetailPane, getAvailableViewOptions } from "./renderer";
import { useTiltakViewStore } from "./store";
import { RowListHeading } from "../shared";

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
 */
const TiltakWorkspace = () => {
  // Create Tiltak adapter
  const adapter = createTiltakAdapter(tiltakConfig);

  // Wrap adapter in DTO for unified interface
  const dto = createSingleEntityDTO(adapter);

  // Get view options state
  const { viewOptions, setViewOptions } = useTiltakViewStore();

  return (
    <EntityWorkspaceNew
      key={`${dto.entityType || "tiltak-workspace"}`}
      dto={dto}
      renderEntityCard={renderEntityCard}
      renderGroupHeader={renderGroupHeader}
      renderSearchBar={renderSearchBar}
      renderDetailPane={renderDetailPane}
      renderListHeading={(props) => (
        <RowListHeading
          {...props}
          viewOptions={viewOptions}
          onViewOptionsChange={setViewOptions}
          availableViewOptions={getAvailableViewOptions()}
        />
      )}
      viewOptions={viewOptions}
      debug={true}
    />
  );
};

export default TiltakWorkspace;
