import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";
import { createKravTiltakAdapter } from "./adapters/KravTiltakAdapter.js";
import { createSingleEntityDTO } from "./adapters/SingleEntityDTO.js";

/**
 * NewTiltakWorkspace - Unified DTO architecture
 * 
 * UNIFIED ARCHITECTURE:
 * - Creates KravTiltakAdapter with tiltak configuration
 * - Wraps adapter in SingleEntityDTO for consistent interface
 * - EntityWorkspace always receives dto prop
 * - Clean, consistent pattern across all workspaces
 */
const NewTiltakWorkspace = () => {
  // Create domain-specific adapter with tiltak configuration
  const adapter = createKravTiltakAdapter(tiltakConfig);
  
  // Wrap adapter in DTO for unified interface
  const dto = createSingleEntityDTO(adapter);
  
  return (
    <EntityWorkspace
      dto={dto}
      debug={true}
    />
  );
};

export default NewTiltakWorkspace;