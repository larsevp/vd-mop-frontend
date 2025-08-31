// Wrapper component for displaying mixed Krav/Tiltak entities using dynamic field resolution
import React from "react";
import EntityWorkspace from "./EntityWorkspace.jsx";
import { DynamicDisplayValueResolver } from "../tableComponents/displayValues/DynamicDisplayValueResolver.jsx";
import { modelConfigs } from "@/modelConfigs";

/**
 * CombinedEntityWorkspace - A wrapper component that enables EntityWorkspace
 * to display mixed Krav and Tiltak entities in a unified interface.
 *
 * This component handles:
 * - Dynamic field resolution based on row.entityType
 * - Uses existing Krav/Tiltak field configurations
 * - Hierarchical rendering based on row.level
 * - Mixed entity display in cards/lists using DynamicDisplayValueResolver
 */

// Minimal combined model configuration - EntityRow/EntityDisplay will handle the rest
const combinedModelConfig = {
  queryKey: ["combined-entities"],
  modelPrintName: "combined",
  title: "Krav og Tiltak",
  desc: "Unified view of requirements and measures",

  // EntityWorkspace configuration optimized for mixed entity display
  workspace: {
    enabled: true,
    layout: "split",
    groupBy: "emne",

    layoutConfig: {
      listWidth: "40%",
      enableKeyboardNav: true,
    },

    features: {
      grouping: true,
      hierarchy: true,
      inlineEdit: false, // Disable - would need complex logic for mixed types
      search: true,
      filters: true,
      bulkActions: false, // Disable for mixed entity types
    },

    ui: {
      showHierarchy: true,
      showEntityType: true,
      showMerknader: false,
      showStatus: true,
      showVurdering: true,
      showPrioritet: true,
    },
  },

  // Minimal field list - actual fields will be resolved dynamically by EntityRow/EntityDisplay
  fields: [
    {
      name: "entityType",
      label: "Type",
      type: "text",
      show_in_list: true,
      computed: (row) => {
        const typeMap = {
          krav: "Krav",
          tiltak: "Tiltak",
          prosjektkrav: "Prosjekt Krav",
          prosjekttiltak: "Prosjekt Tiltak",
        };
        return typeMap[row.entityType] || row.entityType;
      },
    },
    {
      name: "level",
      label: "Nivå",
      type: "number",
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
    },
  ],
};

export const CombinedEntityWorkspace = ({ combinedEntityService, entityType = "combined", viewOptions = {}, ...props }) => {
  // Create API functions that use the combined entity service (general entities only)
  const combinedApiConfig = {
    ...combinedModelConfig,
    queryFn: combinedEntityService.getPaginatedCombinedView,
    queryFnGroupedByEmne: combinedEntityService.getGroupedByEmne,
    // Disable create/update/delete for combined view
    createFn: null,
    updateFn: null,
    deleteFn: null,
  };

  return (
    <EntityWorkspace
      {...props}
      modelConfig={combinedApiConfig}
      entityType={entityType}
      displayResolver={DynamicDisplayValueResolver}
      customContext={{
        isCombinedView: true,
        entityTypes: entityType === "prosjekt-combined" 
          ? ["prosjekt-krav", "prosjekt-tiltak"] // Project entities
          : ["krav", "tiltak"], // General entities
        ...props.customContext,
      }}
    />
  );
};

export default CombinedEntityWorkspace;
