import React from "react";
import { EntityWorkspaceNew } from "@/components/EntityWorkspace";
import { createCombinedEntityDTO } from "@/components/EntityWorkspace/interface/data";
import { createKravTiltakCombinedAdapter } from "./adapter";
import { createCombinedRenderer } from "../shared/CombinedRenderer";
import { useKravTiltakCombinedViewStore } from "./store";
import { RowListHeading } from "../../shared";

// Import individual components and renderers
import KravCard from "../../krav/renderer/components/KravCard";
import TiltakCard from "../../tiltak/renderer/components/TiltakCard";
import { renderDetailPane as KravDetailRenderer } from "../../krav/renderer/KravDetailRenderer";
import { renderDetailPane as TiltakDetailRenderer } from "../../tiltak/renderer/TiltakDetailRenderer";
import { createKravAdapter } from "../../krav/adapter";
import { createTiltakAdapter } from "../../tiltak/adapter";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";

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

  // Create combined renderer with proper configuration
  const renderer = createCombinedRenderer({
    entityTypes: {
      primary: "krav",
      secondary: "tiltak"
    },
    components: {
      primaryCard: KravCard,
      secondaryCard: TiltakCard
    },
    renderers: {
      primaryDetailRenderer: KravDetailRenderer,
      secondaryDetailRenderer: TiltakDetailRenderer
    },
    adapters: {
      primaryAdapter: createKravAdapter(kravConfig),
      secondaryAdapter: createTiltakAdapter(tiltakConfig)
    },
    labels: {
      primaryCreate: "Opprett Krav",
      secondaryCreate: "Opprett Tiltak",
      primaryCount: "krav",
      secondaryCount: "tiltak",
      workspaceType: "krav-tiltak-combined"
    },
    viewOptions: {
      showHierarchy: "Vis hierarki",
      showMerknad: "Vis merknader",
      showStatus: "Vis status",
      showVurdering: "Vis vurdering",
      showPrioritet: "Vis prioritet",
      showObligatorisk: "Vis obligatorisk",
      showRelations: "Vis relasjoner",
      showEntityType: "Vis enhetstype"
    }
  });

  return (
    <EntityWorkspaceNew
      key={`${dto.entityType || "krav-tiltak-combined-workspace"}`}
      dto={dto}
      renderEntityCard={renderer.renderEntityCard}
      renderGroupHeader={renderer.renderGroupHeader}
      renderDetailPane={renderer.renderDetailPane}
      renderActionButtons={renderer.renderActionButtons}
      renderSearchBar={renderer.renderSearchBar}
      renderListHeading={(props) => (
        <RowListHeading
          {...props}
          viewOptions={viewOptions}
          onViewOptionsChange={setViewOptions}
          availableViewOptions={renderer.getAvailableViewOptions()}
        />
      )}
      viewOptions={viewOptions}
      debug={true}
    />
  );
};

export default KravTiltakCombinedWorkspace;
