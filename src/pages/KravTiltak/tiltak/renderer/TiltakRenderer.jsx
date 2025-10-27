/**
 * TiltakRenderer - Render functions for Tiltak entities
 *
 * This module uses the createKravTiltakRenderer factory to generate
 * render functions that the EntityWorkspace interface calls to generate
 * the actual JSX for Tiltak entities and groups.
 *
 * By using the factory pattern, we eliminate code duplication across
 * all KravTiltak entity types (krav, tiltak, prosjektkrav, prosjekttiltak).
 */

import { createKravTiltakRenderer } from "../../shared/renderers";
import TiltakCard from "./components/TiltakCard.jsx";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak";

export const {
  renderEntityCard,
  renderGroupHeader,
  renderListHeading,
  renderSearchBar,
  renderActionButtons,
  getAvailableViewOptions,
  getDefaultViewOptions,
} = createKravTiltakRenderer({
  entityType: 'tiltak',
  CardComponent: TiltakCard,
  modelConfig: tiltakConfig,
  createLabel: 'Opprett tiltak',
});
