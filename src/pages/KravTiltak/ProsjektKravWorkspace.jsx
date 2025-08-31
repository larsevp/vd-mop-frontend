import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav.js";
import { useProjectStore } from "@/stores/userStore";
import { Link } from "react-router-dom";
import { ArrowLeft, Building } from "lucide-react";

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
  const { currentProject } = useProjectStore();

  // Show message if no project is selected
  if (!currentProject) {
    return (
      <div className="bg-background-primary min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
              <Building className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Ingen prosjekt valgt</h3>
              <p className="text-yellow-700 mb-4">
                Du må velge et prosjekt for å se prosjektspesifikke krav.
              </p>
              <Link 
                to="/"
                className="inline-flex items-center text-yellow-800 hover:text-yellow-900 font-medium"
              >
                <ArrowLeft size={16} className="mr-2" />
                Gå til prosjektliste
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create dynamic title with current project info
  const dynamicConfig = {
    ...prosjektKravConfig,
    title: `${currentProject.navn} - Krav`,
    desc: `Krav for prosjekt: ${currentProject.prosjektnummer || currentProject.navn}`,
  };

  return (
    <EntityWorkspace
      modelConfig={dynamicConfig}
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