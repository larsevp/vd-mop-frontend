/**
 * ProsjektKravRenderer - Render functions for ProsjektKrav entities
 *
 * This module uses the createKravTiltakRenderer factory to generate
 * render functions that the EntityWorkspace interface calls to generate
 * the actual JSX for ProsjektKrav entities and groups.
 *
 * By using the factory pattern, we eliminate code duplication across
 * all KravTiltak entity types (krav, tiltak, prosjektkrav, prosjekttiltak).
 */

import { createKravTiltakRenderer } from "../../shared/renderers";
import ProsjektKravCard from "./components/ProsjektKravCard.jsx";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav";

export const {
  renderEntityCard,
  renderGroupHeader,
  renderListHeading,
  renderSearchBar,
  renderActionButtons,
  getAvailableViewOptions,
  getDefaultViewOptions,
} = createKravTiltakRenderer({
  entityType: 'prosjektKrav',
  CardComponent: ProsjektKravCard,
  modelConfig: prosjektKravConfig,
  createLabel: 'Opprett prosjektkrav',
});
