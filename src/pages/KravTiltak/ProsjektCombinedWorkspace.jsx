import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { prosjektCombined as prosjektCombinedConfig } from "@/modelConfigs/models/prosjektCombined";

/**
 * ProsjektCombined Workspace - Shows unified view of ProsjektKrav and ProsjektTiltak
 *
 * This workspace provides a comprehensive project management view by combining:
 * - ProsjektKrav: Project-specific requirements and constraints
 * - ProsjektTiltak: Project-specific measures and implementation actions
 * 
 * Key Features:
 * - Mixed entity display with proper type detection (ProsjektKrav vs ProsjektTiltak)
 * - Hierarchical relationships within each entity type
 * - Cross-entity relationships (ProsjektKrav ↔ ProsjektTiltak)
 * - Project-scoped filtering and organization
 * - Multiple view modes (requirements-first, measures-first, grouped by subject)
 * - Unified search across both entity types
 * - Consistent CRUD operations for both types in single interface
 * 
 * This is particularly useful for:
 * - Project managers who need to see requirements and their implementation measures together
 * - Understanding which requirements have corresponding measures
 * - Identifying gaps in project coverage
 * - Managing project-specific adaptations of general requirements and measures
 */
export default function ProsjektCombinedWorkspace() {
  return (
    <EntityWorkspace
      modelConfig={prosjektCombinedConfig}
      entityType="prosjekt-combined"
      debug={true}
      workspaceConfig={{
        ui: {
          showMerknader: true,
          showStatus: true,
          showVurdering: true,
          showPrioritet: false, // ProsjektTiltak might not use priority
          showEntityType: true, // Show entity type badges for ProsjektKrav/ProsjektTiltak
        }
      }}
    />
  );
}