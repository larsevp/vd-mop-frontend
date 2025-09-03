// Model config for Combined Entities (Krav + Tiltak unified view)
import { combinedEntityService } from "@/api/endpoints/models/combinedEntities";

export const combined = {
  queryKey: ["combined"],
  queryFn: combinedEntityService.getPaginatedCombinedView,
  queryFnGroupedByEmne: combinedEntityService.getGroupedByEmne,
  modelPrintName: "kombinert enhet",
  title: "Krav & Tiltak",
  desc: "Unified view of Krav and Tiltak entities with cross-relationships",
  newButtonLabel: "Ny kombinert enhet",

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
      primaryView: "krav-first",
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
      showPrioritet: true,
      showEntityType: true, // Show entity type badges (Krav/Tiltak)
    }
  }
};