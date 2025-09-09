import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import { createSingleEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createKravAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderDetailPane, getAvailableViewOptions } from "./renderer";
import { useKravViewStore } from "./store";
import { RowListHeading } from "../shared";

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
  // Create Krav adapter
  const adapter = createKravAdapter(kravConfig);
  
  // Wrap adapter in DTO for unified interface
  const dto = createSingleEntityDTO(adapter);

  // Get view options state
  const { viewOptions, setViewOptions } = useKravViewStore();

  return (
    <EntityWorkspace
      key={`${dto.entityType || 'krav-workspace'}`}
      dto={dto}
      renderEntityCard={renderEntityCard}
      renderGroupHeader={renderGroupHeader}
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

export default KravWorkspace;