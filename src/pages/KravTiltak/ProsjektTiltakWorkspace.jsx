import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak.js";
import { createKravTiltakAdapter } from "./old/adapters/KravTiltakAdapter.js";
import { createSingleEntityDTO } from "./old/adapters/SingleEntityDTO.js";
import { useProjectStore } from "@/stores/userStore";
import { Link } from "react-router-dom";
import { ArrowLeft, Building } from "lucide-react";

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
                Du må velge et prosjekt for å se prosjektspesifikke tiltak.
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

  // Create dynamic config with current project info
  const dynamicConfig = {
    ...prosjektTiltakConfig,
    title: `${currentProject.navn} - Tiltak`,
    desc: `Tiltak for prosjekt: ${currentProject.prosjektnummer || currentProject.navn}`,
  };

  // Create domain-specific adapter for prosjekt-tiltak
  const adapter = createKravTiltakAdapter(dynamicConfig);
  
  // Wrap adapter in DTO for unified interface
  const dto = createSingleEntityDTO(adapter);

  return (
    <EntityWorkspace
      dto={dto}
      debug={true}
    />
  );
};

export default ProsjektTiltakWorkspace;