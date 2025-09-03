import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";
import { createKravTiltakAdapter } from "./adapters/KravTiltakAdapter.js";

/**
 * NewTiltakWorkspace - Domain-specific workspace using adapter injection
 * 
 * NEW ARCHITECTURE:
 * - Creates KravTiltakAdapter with tiltak configuration
 * - Adapter handles all tiltak-specific logic
 * - Generic interface works with abstract entities
 * - Clean separation of concerns
 */
const NewTiltakWorkspace = () => {
  // Create domain-specific adapter with tiltak configuration
  const adapter = createKravTiltakAdapter(tiltakConfig);
  
  return (
    <EntityWorkspace
      adapter={adapter}
      debug={true}
    />
  );
};

export default NewTiltakWorkspace;