/**
 * KravRenderer - Render functions for Krav entities
 *
 * This module uses the createKravTiltakRenderer factory to generate
 * render functions that the EntityWorkspace interface calls to generate
 * the actual JSX for Krav entities and groups.
 *
 * By using the factory pattern, we eliminate code duplication across
 * all KravTiltak entity types (krav, tiltak, prosjektkrav, prosjekttiltak).
 */

import { createKravTiltakRenderer } from "../../shared/renderers";
import KravCard from "./components/KravCard.jsx";
import { krav as kravConfig } from "@/modelConfigs/models/krav";

export const {
  renderEntityCard,
  renderGroupHeader,
  renderListHeading,
  renderSearchBar,
  renderActionButtons,
  getAvailableViewOptions,
  getDefaultViewOptions,
} = createKravTiltakRenderer({
  entityType: 'krav',
  CardComponent: KravCard,
  modelConfig: kravConfig,
  createLabel: 'Opprett krav',
});
