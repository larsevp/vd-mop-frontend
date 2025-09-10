import { renderEntityCard as kravRenderEntityCard } from "../../../krav/renderer/KravRenderer.jsx";
import { renderEntityCard as tiltakRenderEntityCard } from "../../../tiltak/renderer/TiltakRenderer.jsx";
import { renderDetailPane as kravRenderDetailPane } from "../../../krav/renderer/KravDetailRenderer.jsx";
import { renderDetailPane as tiltakRenderDetailPane } from "../../../tiltak/renderer/TiltakDetailRenderer.jsx";
import { createKravAdapter } from "../../../krav/adapter";
import { createTiltakAdapter } from "../../../tiltak/adapter";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";
import { createCombinedRenderer } from "../../shared/CombinedRenderer.jsx";

/**
 * KravTiltakCombined-specific renderer functions
 * 
 * Uses the shared CombinedRenderer factory to create domain-specific renderers
 * for combined Krav/Tiltak entities while maintaining consistency with the EntityWorkspace pattern.
 */

// Configuration for KravTiltak combined renderer
const config = {
  entityTypes: {
    primary: "krav",
    secondary: "tiltak"
  },
  components: {
    primaryCard: kravRenderEntityCard,
    secondaryCard: tiltakRenderEntityCard
  },
  renderers: {
    primaryDetailRenderer: kravRenderDetailPane,
    secondaryDetailRenderer: tiltakRenderDetailPane
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
    workspaceType: "combined"
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