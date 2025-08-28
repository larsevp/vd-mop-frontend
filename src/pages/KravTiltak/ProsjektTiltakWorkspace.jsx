import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak.js";

/**
 * ProsjektTiltak Workspace using the generic EntityWorkspace component
 * 
 * This workspace handles project-specific measures/actions (ProsjektTiltak) which are:
 * - Project-scoped versions of general measures 
 * - Linked to specific projects
 * - Can address both general Krav and ProsjektKrav
 * - Include implementation details and feedback specific to the project
 * 
 * Features automatically provided by EntityWorkspace:
 * - Project-specific data fetching and filtering
 * - Search, filtering, sorting within project scope  
 * - Grouping by emne (subject/topic)
 * - CRUD operations for project measures
 * - Rich text editing for implementation and feedback
 * - File attachments and document management
 * - Responsive UI layout with detail panes
 * - Loading and error states
 */
const ProsjektTiltakWorkspace = () => {
  return (
    <EntityWorkspace
      modelConfig={prosjektTiltakConfig}
      entityType="prosjekt-tiltak"
      // Workspace-specific configuration for project measures
      workspaceConfig={{
        ui: {
          showHierarchy: true,    // Project measures can have hierarchies
          showMerknader: true,    // Show notes/comments for project context
          showStatus: true,       // Track implementation status
          showVurdering: true,    // Assessment of measure effectiveness  
          showPrioritet: true,    // Priority important for project planning
          showObligatorisk: true, // Mandatory vs optional measures
          showRelations: true,    // Show relationships to ProsjektKrav and general Krav
        },
        features: {
          grouping: true,         // Group by subject/topic
          hierarchy: false,       // Parent-child relationships for measures
          search: true,           // Full text search across all fields
          filters: true,          // Advanced filtering by status, priority, etc.
          inlineEdit: true,       // Quick editing without navigation
        }
      }}
    />
  );
};

export default ProsjektTiltakWorkspace;