import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import { createKravTiltakAdapter } from "./old/adapters/KravTiltakAdapter.js";
import { createSingleEntityDTO } from "./old/adapters/SingleEntityDTO.js";

/**
 * NewKravWorkspace - Unified DTO architecture
 * 
 * UNIFIED ARCHITECTURE:
 * - Creates KravTiltakAdapter with krav configuration
 * - Wraps adapter in SingleEntityDTO for consistent interface
 * - EntityWorkspace always receives dto prop (never adapter directly)
 * - Clean, consistent pattern across all workspaces
 * 
 * Benefits:
 * - Consistent interface: all workspaces use dto prop
 * - Clear separation: DTOs coordinate, Adapters handle domain logic
 * - Future-proof: easy to add new DTO types (cached, filtered, etc.)
 * - No interface inconsistencies between single and combined views
 */
const NewKravWorkspace = () => {
  // Create domain-specific adapter with krav configuration
  const adapter = createKravTiltakAdapter(kravConfig);
  
  // Wrap adapter in DTO for unified interface
  const dto = createSingleEntityDTO(adapter, { debug: true });
  
  return (
    <EntityWorkspace
      dto={dto}
      debug={true}
    />
  );
};

export default NewKravWorkspace;