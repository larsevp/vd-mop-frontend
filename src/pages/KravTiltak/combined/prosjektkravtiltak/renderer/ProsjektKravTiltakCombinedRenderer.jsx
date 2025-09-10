import { renderEntityCard as prosjektKravRenderEntityCard } from "../../../prosjektkrav/renderer/ProsjektKravRenderer.jsx";
import { renderEntityCard as prosjektTiltakRenderEntityCard } from "../../../prosjekttiltak/renderer/ProsjektTiltakRenderer.jsx";
import { renderDetailPane as prosjektKravRenderDetailPane } from "../../../prosjektkrav/renderer/ProsjektKravDetailRenderer.jsx";
import { renderDetailPane as prosjektTiltakRenderDetailPane } from "../../../prosjekttiltak/renderer/ProsjektTiltakDetailRenderer.jsx";
import { createProsjektKravAdapter } from "../../../prosjektkrav/adapter";
import { createProsjektTiltakAdapter } from "../../../prosjekttiltak/adapter";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav.js";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak.js";
import { createCombinedRenderer } from "../../shared/CombinedRenderer.jsx";

/**
 * ProsjektKravTiltakCombined-specific renderer functions
 * 
 * Uses the shared CombinedRenderer factory to create domain-specific renderers
 * for combined ProsjektKrav/ProsjektTiltak entities while maintaining consistency with the EntityWorkspace pattern.
 */

// Configuration for ProsjektKravTiltak combined renderer
const config = {
  entityTypes: {
    primary: "prosjektKrav",
    secondary: "prosjektTiltak"
  },
  components: {
    primaryCard: prosjektKravRenderEntityCard,
    secondaryCard: prosjektTiltakRenderEntityCard
  },
  renderers: {
    primaryDetailRenderer: prosjektKravRenderDetailPane,
    secondaryDetailRenderer: prosjektTiltakRenderDetailPane
  },
  adapters: {
    primaryAdapter: createProsjektKravAdapter(prosjektKravConfig),
    secondaryAdapter: createProsjektTiltakAdapter(prosjektTiltakConfig)
  },
  labels: {
    primaryCreate: "Opprett ProsjektKrav",
    secondaryCreate: "Opprett ProsjektTiltak",
    primaryCount: "prosjektkrav",
    secondaryCount: "prosjekttiltak",
    workspaceType: "combined-project"
  },
  viewOptions: {
    showHierarchy: "Hierarki og relasjoner",
    showVurdering: "Vurdering",
    showStatus: "Status",
    showPrioritet: "Prioritet",
    showObligatorisk: "Obligatorisk/Valgfri",
    showRelations: "Tilknyttede relasjoner",
    showEntityType: "Vis enhetstype",
  }
};

// Create and export all renderer functions using the shared factory
const {
  renderEntityCard,
  renderGroupHeader,
  renderListHeading,
  renderSearchBar,
  renderActionButtons,
  renderDetailPane,
  getAvailableViewOptions,
} = createCombinedRenderer(config);

export {
  renderEntityCard,
  renderGroupHeader,
  renderListHeading,
  renderSearchBar,
  renderActionButtons,
  renderDetailPane,
  getAvailableViewOptions,
};