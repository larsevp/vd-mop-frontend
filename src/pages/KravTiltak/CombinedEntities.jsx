import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { combined as combinedConfig } from "@/modelConfigs/models/combined";

/**
 * Combined Entities Page - Shows unified view of Krav and Tiltak
 *
 * Features:
 * - Mixed entity display with proper type detection
 * - Hierarchical relationships based on level
 * - Cross-entity relationships (Krav ↔ Tiltak)
 * - Multiple view modes (krav-first, tiltak-first, grouped by emne)
 */
export default function CombinedEntities() {
  return (
    <EntityWorkspace
      modelConfig={combinedConfig}
      entityType="combined"
      debug={true}
      workspaceConfig={{
        ui: {
          showMerknader: true,
          showStatus: true,
          showVurdering: true,
          showPrioritet: true,
          showEntityType: true, // Show entity type badges for Krav/Tiltak
        }
      }}
    />
  );
}
