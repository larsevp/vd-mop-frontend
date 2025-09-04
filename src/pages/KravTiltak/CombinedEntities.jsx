import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";
import { createKravTiltakAdapter } from "./adapters/KravTiltakAdapter.js";
import { createSingleEntityDTO } from "./adapters/SingleEntityDTO.js";
import { createCombinedEntityDTO } from "./adapters/CombinedEntityDTO.js";

/**
 * CombinedEntities - Krav + Tiltak unified workspace using NEW Combined DTO Architecture
 *
 * NEW ARCHITECTURE:
 * - CombinedEntityDTO -> SingleEntityDTOs -> KravTiltakAdapters
 * - Each entity type gets its own SingleEntityDTO wrapping a KravTiltakAdapter
 * - CombinedEntityDTO coordinates the SingleEntityDTOs for unified interface
 * - Proper separation of concerns with dependency injection
 * 
 * Features:
 * - Mixed entity display with type badges  
 * - Cross-model filtering and sorting
 * - Unified search across both entity types
 * - Proper type-specific configurations
 */
export default function CombinedEntities() {
  // Create individual adapters for each entity type
  const kravAdapter = createKravTiltakAdapter(kravConfig);
  const tiltakAdapter = createKravTiltakAdapter(tiltakConfig);
  
  // Wrap adapters in SingleEntityDTOs
  const kravDTO = createSingleEntityDTO(kravAdapter, { debug: true });
  const tiltakDTO = createSingleEntityDTO(tiltakAdapter, { debug: true });
  
  // Create CombinedEntityDTO that coordinates the SingleEntityDTOs
  const combinedDTO = createCombinedEntityDTO([kravDTO, tiltakDTO], {
    debug: true,
    title: "Krav og Tiltak"
  });
  
  return (
    <EntityWorkspace
      // Use unified DTO prop (new architecture)
      dto={combinedDTO}
      debug={true}
    />
  );
}
