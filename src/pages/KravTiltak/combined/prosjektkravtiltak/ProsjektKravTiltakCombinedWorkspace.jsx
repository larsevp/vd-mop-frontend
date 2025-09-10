import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { createCombinedEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createProsjektKravTiltakCombinedAdapter } from "./adapter";
import { createCombinedRenderer } from "../shared/CombinedRenderer";
import { useProsjektKravTiltakCombinedViewStore } from "./store";
import { RowListHeading } from "../../shared";

// Import individual renderers
import { renderEntityCard as ProsjektKravCardRenderer } from "../../prosjektkrav/renderer/ProsjektKravRenderer";
import { renderEntityCard as ProsjektTiltakCardRenderer } from "../../prosjekttiltak/renderer/ProsjektTiltakRenderer";
import { renderDetailPane as ProsjektKravDetailRenderer } from "../../prosjektkrav/renderer/ProsjektKravDetailRenderer";
import { renderDetailPane as ProsjektTiltakDetailRenderer } from "../../prosjekttiltak/renderer/ProsjektTiltakDetailRenderer";
import { createProsjektKravAdapter } from "../../prosjektkrav/adapter";
import { createProsjektTiltakAdapter } from "../../prosjekttiltak/adapter";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak";

/**
 * ProsjektKravTiltakCombinedWorkspace - Combined workspace for ProsjektKrav and ProsjektTiltak entities
 *
 * This workspace handles project-specific requirements (ProsjektKrav) and measures (ProsjektTiltak) which are:
 * - Project-specific entities tied to a particular project context
 * - Derived from general Krav/Tiltak templates but customized for project needs
 * - Combined in a unified view showing relationships between project requirements and measures
 * - Support rich text content, file attachments, hierarchical structure, and project-specific data
 *
 * Features automatically provided by EntityWorkspace:
 * - Project-scoped combined data fetching and filtering
 * - Search, filtering, sorting across both entity types within project context
 * - Entity type filtering (ProsjektKrav vs ProsjektTiltak)
 * - Grouping by emne (if configured)
 * - CRUD operations for both entity types
 * - Responsive UI layout
 * - Loading and error states
 * - File attachments and rich text editing
 * - Project context awareness
 */
const ProsjektKravTiltakCombinedWorkspace = () => {
  // Create combined adapter for project entities
  const adapter = createProsjektKravTiltakCombinedAdapter({ debug: true });

  // Create combined DTO
  const dto = createCombinedEntityDTO(adapter, { debug: true });

  // Get view options state
  const { viewOptions, setViewOptions } = useProsjektKravTiltakCombinedViewStore();

  // Create combined renderer with proper configuration
  const renderer = createCombinedRenderer({
    entityTypes: {
      primary: "prosjektKrav",
      secondary: "prosjektTiltak",
    },
    cardRenderers: {
      primaryCardRenderer: ProsjektKravCardRenderer,
      secondaryCardRenderer: ProsjektTiltakCardRenderer,
    },
    renderers: {
      primaryDetailRenderer: ProsjektKravDetailRenderer,
      secondaryDetailRenderer: ProsjektTiltakDetailRenderer,
    },
    adapters: {
      primaryAdapter: createProsjektKravAdapter(prosjektKravConfig),
      secondaryAdapter: createProsjektTiltakAdapter(prosjektTiltakConfig),
    },
    labels: {
      primaryCreate: "Nytt krav",
      secondaryCreate: "Nytt tiltak",
      primaryCount: "prosjektkrav",
      secondaryCount: "prosjekttiltak",
      workspaceType: "prosjektkrav-tiltak-combined",
    },
    viewOptions: {
      showHierarchy: "Vis hierarki",
      showMerknad: "Vis merknader",
      showStatus: "Vis status",
      showVurdering: "Vis vurdering",
      showPrioritet: "Vis prioritet",
      showObligatorisk: "Vis obligatorisk",
      showRelations: "Vis relasjoner",
      showEntityType: "Vis enhetstype",
    },
  });

  return (
    <EntityWorkspace
      key={`${dto.entityType || "prosjekt-krav-tiltak-combined-workspace"}`}
      dto={dto}
      renderEntityCard={renderer.renderEntityCard}
      renderGroupHeader={renderer.renderGroupHeader}
      renderDetailPane={renderer.renderDetailPane}
      renderSearchBar={renderer.renderSearchBar}
      renderActionButtons={renderer.renderActionButtons}
      renderListHeading={(props) => (
        <RowListHeading
          {...props}
          viewOptions={viewOptions}
          onViewOptionsChange={setViewOptions}
          availableViewOptions={renderer.getAvailableViewOptions()}
        />
      )}
      viewOptions={viewOptions}
      debug={false}
    />
  );
};

export default ProsjektKravTiltakCombinedWorkspace;
