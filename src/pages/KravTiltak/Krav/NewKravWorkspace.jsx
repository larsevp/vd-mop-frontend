import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";

/**
 * Simplified KravWorkspace using the generic EntityWorkspace component
 * This demonstrates how the EntityWorkspace reduces complexity:
 * 
 * OLD: 600+ lines of complex state management and UI logic
 * NEW: ~15 lines - just configuration!
 * 
 * Benefits:
 * - Consistent behavior across all entity types
 * - Automatic workspace features (grouping, search, filters, etc.)
 * - Less code to maintain
 * - Easier to test and debug
 * - Better separation of concerns
 */
const NewKravWorkspace = () => {
  return (
    <EntityWorkspace
      modelConfig={kravConfig}
      entityType="krav"
      // Optional workspace-specific overrides
      workspaceConfig={{
        // Override any default workspace settings if needed
        ui: {
          showMerknader: false,
          showStatus: true,
          showVurdering: true,
          showPrioritet: true,
        }
      }}
    />
  );
};

export default NewKravWorkspace;