import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav.js";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak.js";
import { createKravTiltakCombinedDTO } from "./adapters/KravTiltakCombinedDTO.js";

/**
 * ProsjektCombined Workspace - Shows unified view of ProsjektKrav and ProsjektTiltak
 *
 * This workspace provides a comprehensive project management view by combining:
 * - ProsjektKrav: Project-specific requirements and constraints
 * - ProsjektTiltak: Project-specific measures and implementation actions
 * 
 * Key Features:
 * - Mixed entity display with proper type detection (ProsjektKrav vs ProsjektTiltak)
 * - Hierarchical relationships within each entity type
 * - Cross-entity relationships (ProsjektKrav ↔ ProsjektTiltak)
 * - Project-scoped filtering and organization
 * - Multiple view modes (requirements-first, measures-first, grouped by subject)
 * - Unified search across both entity types
 * - Consistent CRUD operations for both types in single interface
 * 
 * This is particularly useful for:
 * - Project managers who need to see requirements and their implementation measures together
 * - Understanding which requirements have corresponding measures
 * - Identifying gaps in project coverage
 * - Managing project-specific adaptations of general requirements and measures
 */
export default function ProsjektCombinedWorkspace() {
  // Create combined DTO for ProsjektKrav + ProsjektTiltak
  const dto = createKravTiltakCombinedDTO(prosjektKravConfig, prosjektTiltakConfig, {
    title: "Prosjekt Krav og Tiltak",
    mixingRules: {
      defaultSort: 'updatedAt',
      defaultSortOrder: 'desc',
      separateByType: false, // Mix ProsjektKrav and ProsjektTiltak freely
      searchFields: ['title', 'descriptionCard', 'uid']
    }
  });

  return (
    <EntityWorkspace
      dto={dto}
      debug={true}
    />
  );
}