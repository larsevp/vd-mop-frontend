import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";

/**
 * Simplified TiltakWorkspace using the generic EntityWorkspace component
 * Same ~15 lines of code as KravWorkspace, but for Tiltak entities
 * 
 * The EntityWorkspace automatically handles:
 * - Data fetching based on tiltak model config
 * - Search, filtering, sorting
 * - Grouping by emne (if configured)
 * - CRUD operations (create, update, delete)
 * - Responsive UI layout
 * - Loading and error states
 */
const NewTiltakWorkspace = () => {
  return (
    <EntityWorkspace
      modelConfig={tiltakConfig}
      entityType="tiltak"
      // Enable debug mode to test new interface system
      debug={true}
      // Optional workspace-specific overrides
      workspaceConfig={{
        ui: {
          showMerknader: true, // Tiltak might want to show notes by default
          showStatus: true,
          showVurdering: true,
          showPrioritet: false, // Maybe tiltak doesn't use priority
        }
      }}
    />
  );
};

export default NewTiltakWorkspace;