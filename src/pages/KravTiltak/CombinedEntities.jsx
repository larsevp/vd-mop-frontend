import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";
import { createKravTiltakCombinedDTO } from "./adapters/KravTiltakCombinedDTO.js";

/**
 * CombinedEntities - Krav + Tiltak unified workspace using Combined DTO
 *
 * SPECIALIZED ARCHITECTURE:
 * - Uses CombinedEntityDTO for multi-model data mixing
 * - DTO handles model-specific combination logic
 * - Generates unified view from separate model data
 * - Maintains entity type distinction for UI
 * 
 * Features:
 * - Mixed entity display with type badges  
 * - Cross-model filtering and sorting
 * - Unified search across both entity types
 * - Proper type-specific configurations
 */
export default function CombinedEntities() {
  // Create combined DTO with both model configs
  const combinedDTO = createKravTiltakCombinedDTO(kravConfig, tiltakConfig, {
    title: "Krav og Tiltak",
    mixingRules: {
      defaultSort: 'updatedAt',
      defaultSortOrder: 'desc',
      separateByType: false, // Mix freely
      searchFields: ['title', 'descriptionCard', 'uid']
    }
  });
  
  return (
    <EntityWorkspace
      // Pass combined DTO as specialized adapter
      combinedEntityDTO={combinedDTO}
      debug={true}
    />
  );
}
