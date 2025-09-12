import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak";
import { createSingleEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createProsjektTiltakAdapter } from "./adapter";
import { renderEntityCard, renderGroupHeader, renderDetailPane, renderSearchBar, getAvailableViewOptions } from "./renderer";
import { useProsjektTiltakViewStore } from "./store";
import { RowListHeading } from "../shared";
import { useProjectStore } from "@/stores/userStore";
import { Link } from "react-router-dom";
import { ArrowLeft, Building } from "lucide-react";

/**
 * ProsjektTiltak Workspace using the generic EntityWorkspace component
 *
 * This workspace handles project-specific measures/actions (ProsjektTiltak) which are:
 * - Project-scoped versions of general measures
 * - Linked to specific projects
 * - Can reference general Tiltak (generalTiltakId)
 * - Can address both general Krav and ProsjektKrav
 * - Support project-specific implementation details and feedback
 *
 * Features automatically provided by EntityWorkspace:
 * - Project-specific data fetching and filtering
 * - Search, filtering, sorting within project scope
 * - Grouping by emne (if configured)
 * - CRUD operations for project measures
 * - Responsive UI layout
 * - Loading and error states
 * - File attachments and rich text editing
 */
const ProsjektTiltakWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
              <p className="text-yellow-700 mb-4">Du må velge et prosjekt for å se prosjektspesifikke tiltak.</p>
              <Link to="/" className="inline-flex items-center text-yellow-800 hover:text-yellow-900 font-medium">
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

  // Create ProsjektTiltak adapter
  const adapter = createProsjektTiltakAdapter(dynamicConfig);

  // Wrap adapter in DTO for unified interface
  const dto = createSingleEntityDTO(adapter);

  // Get view options state
  const { viewOptions, setViewOptions } = useProsjektTiltakViewStore();

  // Handle Flow toggle - navigate to Flow workspace while preserving state
  const handleFlowToggle = () => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/prosjekt-tiltak-workspace')) {
      const flowPath = currentPath.replace('/prosjekt-tiltak-workspace', '/prosjekt-tiltak-flow');
      navigate(flowPath, { state: location.state });
    } else if (currentPath.includes('/prosjekt-tiltak')) {
      const flowPath = currentPath.replace('/prosjekt-tiltak', '/prosjekt-tiltak-flow');
      navigate(flowPath, { state: location.state });
    }
  };

  return (
    <EntityWorkspace
      key={`${dto.entityType || "prosjekttiltak-workspace"}-${currentProject?.id || "no-project"}`} // Force remount on project change
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
      // Pass Flow toggle to EntityWorkspace header
      flowViewMode={null} // Not in flow mode
      onFlowToggle={handleFlowToggle}
    />
  );
};

export default ProsjektTiltakWorkspace;
