/**
 * ProsjektTiltakRenderer - Render functions for ProsjektTiltak entities
 *
 * This module uses the createKravTiltakRenderer factory to generate
 * render functions that the EntityWorkspace interface calls to generate
 * the actual JSX for ProsjektTiltak entities and groups.
 *
 * By using the factory pattern, we eliminate code duplication across
 * all KravTiltak entity types (krav, tiltak, prosjektkrav, prosjekttiltak).
 */

import { createKravTiltakRenderer } from "../../shared/renderers";
import ProsjektTiltakCard from "./components/ProsjektTiltakCard.jsx";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak";

export const {
  renderEntityCard,
  renderGroupHeader,
  renderListHeading,
  renderSearchBar,
  renderActionButtons,
  getAvailableViewOptions,
  getDefaultViewOptions,
} = createKravTiltakRenderer({
  entityType: 'prosjektTiltak',
  CardComponent: ProsjektTiltakCard,
  modelConfig: prosjektTiltakConfig,
  createLabel: 'Opprett prosjekttiltak',
});
