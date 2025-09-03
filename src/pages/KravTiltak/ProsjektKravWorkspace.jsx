import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav.js";
import { createKravTiltakAdapter } from "./adapters/KravTiltakAdapter.js";
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

  // Create dynamic config with current project info
  const dynamicConfig = {
    ...prosjektKravConfig,
    title: `${currentProject.navn} - Krav`,
    desc: `Krav for prosjekt: ${currentProject.prosjektnummer || currentProject.navn}`,
  };

  // Create domain-specific adapter for prosjekt-krav
  const adapter = createKravTiltakAdapter(dynamicConfig);

  return (
    <EntityWorkspace
      adapter={adapter}
      debug={true}
    />
  );
};

export default ProsjektKravWorkspace;