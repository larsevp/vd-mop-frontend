// Model config for Prosjekt Combined Entities (ProsjektKrav + ProsjektTiltak unified view)
import { combinedProsjektEntityService } from "@/api/endpoints/models/combinedProsjektEntities";

export const prosjektCombined = {
  queryKey: ["prosjekt-combined"],
  queryFn: combinedProsjektEntityService.getPaginatedCombinedView,
  queryFnGroupedByEmne: combinedProsjektEntityService.getGroupedByEmne,
  modelPrintName: "prosjekt kombinert enhet",
  title: "Prosjekt Krav & Tiltak",
  desc: "Unified view of ProsjektKrav and ProsjektTiltak entities with cross-relationships",
  newButtonLabel: "Ny prosjekt kombinert enhet",

  // EntityWorkspace configuration
  workspace: {
    enabled: true,
    layout: "split", // Use split view layout
    groupBy: "emne",

    // Layout configuration
    layoutConfig: {
      listWidth: "40%", // Slightly wider for combined view
      enableKeyboardNav: true,
    },

    features: {
      grouping: true,
      hierarchy: true,
      inlineEdit: false, // Disable inline edit for combined entities
      search: true,
      filters: true,
      bulkActions: false,
    },

    // Combined entity specific options
    viewOptions: {
      primaryView: "prosjektkrav-first",
      showHierarchy: true,
      showCrossRelations: true,
      includeChildren: true,
      includeRelated: true,
      groupByEmne: false,
    },

    // UI customization
    ui: {
      showMerknader: true,
      showStatus: true,
      showVurdering: true,
      showPrioritet: false, // ProsjektTiltak might not use priority
      showEntityType: true, // Show entity type badges (ProsjektKrav/ProsjektTiltak)
    }
  }
};