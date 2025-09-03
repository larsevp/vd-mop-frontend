import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import { createKravTiltakAdapter } from "./adapters/KravTiltakAdapter.js";

/**
 * NewKravWorkspace - Domain-specific workspace using adapter injection
 * 
 * NEW ARCHITECTURE:
 * - Domain creates and configures adapter (KravTiltakAdapter)
 * - Adapter contains all krav-specific logic (filters, sorting, display)
 * - Generic interface receives adapter and works with abstract entities
 * - Clean separation: Domain logic in KravTiltak, Generic logic in Interface
 * 
 * Benefits:
 * - True reusability of interface components
 * - Domain encapsulation (all krav logic here)
 * - Easy testing (mock adapters)
 * - No magic string resolvers
 */
const NewKravWorkspace = () => {
  // Create domain-specific adapter with krav configuration
  const adapter = createKravTiltakAdapter(kravConfig);
  
  return (
    <EntityWorkspace
      // Inject adapter instead of raw modelConfig/entityType
      adapter={adapter}
      debug={true}
    />
  );
};

export default NewKravWorkspace;