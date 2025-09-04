import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { getPaginatedCombinedProsjektEntitiesWithOptions } from "@/api/endpoints/models/combinedProsjektEntities.js";
import { createCombinedEntitiesAdapter } from "./adapters/CombinedEntitiesAdapter.js";
import { createCombinedEntityDTO } from "./adapters/CombinedEntityDTO.js";

/**
 * ProsjektCombined Workspace - Unified view of ProsjektKrav and ProsjektTiltak
 *
 * BACKEND MIXING ARCHITECTURE:
 * - Uses backend's combined-entities API with complex hierarchy handling
 * - CombinedEntityDTO -> CombinedEntitiesAdapter -> Backend API
 * - Backend handles parent-child relationships, leveling, and cross-entity logic
 * - Frontend receives pre-combined, properly structured entities
 * 
 * Features:
 * - Complex hierarchical relationships handled by backend
 * - Proper parent-child leveling and indentation
 * - Cross-entity relationships (ProsjektKrav ↔ ProsjektTiltak)  
 * - Project-scoped filtering and organization
 * - Multiple view modes (krav-first, tiltak-first, grouped by emne)
 * - Unified search across both entity types
 * - Backend-enforced business rules for entity combination
 * 
 * This approach is ideal for:
 * - Complex hierarchical data that requires consistent business logic
 * - Cross-entity relationships that need database-level joins
 * - Performance optimization for large datasets
 * - Ensuring consistent combination rules across all clients
 */
export default function ProsjektCombinedWorkspace() {
  // Create backend adapter that uses the combined-entities API
  const backendAdapter = createCombinedEntitiesAdapter({
    title: "Prosjekt Krav og Tiltak",
    entityTypes: ['prosjektkrav', 'prosjekttiltak'],
    primaryType: 'prosjektkrav',
    secondaryType: 'prosjekttiltak',
    isProjectSpecific: true,
    queryFn: getPaginatedCombinedProsjektEntitiesWithOptions,
    queryFnGrouped: getPaginatedCombinedProsjektEntitiesWithOptions,
    newButtonLabel: "Nytt Prosjekt Krav"
  }, { debug: true });
  
  // Create CombinedEntityDTO using backend mixing strategy
  const combinedDTO = createCombinedEntityDTO(backendAdapter, {
    debug: true,
    title: "Prosjekt Krav og Tiltak",
    strategy: 'backend'
  });

  return (
    <EntityWorkspace
      dto={combinedDTO}
      debug={true}
    />
  );
}