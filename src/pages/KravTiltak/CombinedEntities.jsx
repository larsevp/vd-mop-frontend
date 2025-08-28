import React from "react";
import CombinedEntityWorkspace from "@/components/EntityWorkspace/CombinedEntityWorkspace";
import { combinedEntityService } from "@/api/endpoints/models/combinedEntities";

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
    <CombinedEntityWorkspace
      combinedEntityService={combinedEntityService}
      entityType="combined"
      viewOptions={{
        primaryView: "krav-first",
        showHierarchy: true,
        showCrossRelations: true,
        includeChildren: true,
        includeRelated: true,
        groupByEmne: false,
      }}
    />
  );
}
