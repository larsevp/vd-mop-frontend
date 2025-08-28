import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav.js";

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
  return (
    <EntityWorkspace
      modelConfig={prosjektKravConfig}
      entityType="prosjekt-krav"
      // Workspace-specific configuration for project requirements
      workspaceConfig={{
        ui: {
          showHierarchy: true,    // Project requirements can have hierarchies
          showMerknader: true,    // Show notes/comments for project context
          showStatus: true,       // Track status of project requirements
          showVurdering: true,    // Assessment relevant for project requirements
          showPrioritet: true,    // Priority important in project context
          showObligatorisk: true, // Mandatory vs optional requirements
          showRelations: true,    // Show relationships to ProsjektTiltak
        },
        features: {
          grouping: true,         // Group by subject/topic
          hierarchy: true,        // Support parent-child relationships
          search: true,           // Full text search capabilities
          filters: true,          // Advanced filtering options
          inlineEdit: true,       // Quick editing without navigation
        }
      }}
    />
  );
};

export default ProsjektKravWorkspace;