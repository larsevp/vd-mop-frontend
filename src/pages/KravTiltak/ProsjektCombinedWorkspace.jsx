import React from "react";
import CombinedEntityWorkspace from "@/components/EntityWorkspace/CombinedEntityWorkspace";
import { combinedProsjektEntityService } from "@/api/endpoints/models/combinedProsjektEntities";

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
    <CombinedEntityWorkspace
      combinedEntityService={combinedProsjektEntityService}
      entityType="prosjekt-combined"
      viewOptions={{
        primaryView: "prosjektkrav-first",  // Start with requirements view
        showHierarchy: true,                // Show parent-child relationships
        showCrossRelations: true,           // Show ProsjektKrav ↔ ProsjektTiltak links
        includeChildren: true,              // Include child entities in display
        includeRelated: true,               // Include related entities
        groupByEmne: false,                 // Start ungrouped, allow user to toggle
      }}
      // Workspace title and description
      title="Prosjekt Krav & Tiltak"
      description="Unified workspace for managing project-specific requirements and implementation measures"
    />
  );
}