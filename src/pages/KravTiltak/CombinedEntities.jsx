import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { getPaginatedCombinedEntities } from "@/api/endpoints/models/combinedEntities.js";
import { createCombinedEntitiesAdapter } from "./adapters/CombinedEntitiesAdapter.js";
import { createCombinedEntityDTO } from "./adapters/CombinedEntityDTO.js";

// FRONTEND MIXING FALLBACK (for reference - currently not used)
// import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
// import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";
// import { createKravTiltakAdapter } from "./adapters/KravTiltakAdapter.js";
// import { createSingleEntityDTO } from "./adapters/SingleEntityDTO.js";

/**
 * CombinedEntities - Krav + Tiltak unified workspace
 *
 * HYBRID ARCHITECTURE:
 * - PRIMARY: Backend mixing via combined-entities API (complex hierarchy)
 * - FALLBACK: Frontend mixing via SingleEntityDTOs (simple combination)
 * 
 * Backend mixing handles:
 * - Complex parent-child relationships and leveling
 * - Cross-entity business rules and constraints
 * - Performance optimization for large datasets
 * - Database-level joins and aggregations
 * 
 * Frontend mixing fallback:
 * - Simple entity combination without complex hierarchy
 * - Better for rapid prototyping and simple use cases
 * - More UI flexibility but less business logic enforcement
 */
export default function CombinedEntities() {
  // APPROACH 1: Backend mixing (preferred for complex hierarchy)
  const backendAdapter = createCombinedEntitiesAdapter({
    title: "Krav og Tiltak",
    entityTypes: ['krav', 'tiltak'],
    primaryType: 'krav',
    secondaryType: 'tiltak',
    isProjectSpecific: false,
    queryFn: getPaginatedCombinedEntities,
    queryFnGrouped: getPaginatedCombinedEntities,
    newButtonLabel: "Nytt Krav"
  }, { debug: true });
  
  const combinedDTO = createCombinedEntityDTO(backendAdapter, {
    debug: true,
    title: "Krav og Tiltak",
    strategy: 'backend'
  });

  // APPROACH 2: Frontend mixing (fallback - commented out)
  // const kravAdapter = createKravTiltakAdapter(kravConfig);
  // const tiltakAdapter = createKravTiltakAdapter(tiltakConfig);
  // const kravDTO = createSingleEntityDTO(kravAdapter, { debug: true });
  // const tiltakDTO = createSingleEntityDTO(tiltakAdapter, { debug: true });
  // const combinedDTO = createCombinedEntityDTO([kravDTO, tiltakDTO], {
  //   debug: true,
  //   title: "Krav og Tiltak",
  //   strategy: 'frontend'
  // });
  
  return (
    <EntityWorkspace
      dto={combinedDTO}
      debug={true}
    />
  );
}
