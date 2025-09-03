/**
 * EntityTypeResolver - Modern implementation for interface system
 * 
 * Standalone implementation that works directly with modelConfigs
 * and provides the interface contract for the new system.
 */

import { modelConfigs } from "@/modelConfigs";

/**
 * Modern EntityTypeResolver implementation
 */
export class EntityTypeResolver {
  /**
   * Resolve model configuration for entity type
   */
  static resolveModelConfig(entityType) {
    // Direct lookup first
    if (modelConfigs[entityType]) {
      return modelConfigs[entityType];
    }

    // Handle kebab-case to camelCase conversion
    const camelCaseType = this._toCamelCase(entityType);
    if (modelConfigs[camelCaseType]) {
      return modelConfigs[camelCaseType];
    }

    // Handle special cases
    const specialMappings = {
      combined: "combinedEntities",
      combinedEntities: "combinedEntities",
      "prosjekt-combined": "prosjektCombined",
      "prosjekt-krav": "prosjektKrav",
      "prosjekt-tiltak": "prosjektTiltak",
      prosjektkrav: "prosjektKrav",
      prosjekttiltak: "prosjektTiltak",
    };

    if (specialMappings[entityType] && modelConfigs[specialMappings[entityType]]) {
      return modelConfigs[specialMappings[entityType]];
    }

    // Fallback: Create minimal config
    return this._createFallbackConfig(entityType);
  }

  /**
   * Get display name for entity type
   */
  static getDisplayName(entityType, modelConfig, plural = false) {
    if (modelConfig?.title) {
      return plural ? this._pluralize(modelConfig.title) : modelConfig.title;
    }

    const displayNames = {
      krav: plural ? "Krav" : "Krav",
      tiltak: plural ? "Tiltak" : "Tiltak",
      prosjektKrav: plural ? "Prosjekt Krav" : "Prosjekt Krav",
      prosjektTiltak: plural ? "Prosjekt Tiltak" : "Prosjekt Tiltak",
      combined: plural ? "Krav og Tiltak" : "Krav og Tiltak",
      combinedEntities: plural ? "Krav og Tiltak" : "Krav og Tiltak",
    };

    return displayNames[entityType] || this._capitalize(entityType);
  }

  /**
   * Check if entity type supports group by emne
   */
  static supportsGroupByEmne(entityType) {
    return this._supportsGroupByEmne(entityType);
  }

  /**
   * Get workspace configuration for entity type
   */
  static getWorkspaceConfig(entityType) {
    const modelConfig = this.resolveModelConfig(entityType);
    
    // Return workspace config from modelConfig if available
    if (modelConfig?.workspace) {
      return modelConfig.workspace;
    }
    
    // Generate workspace config based on entity type capabilities
    return {
      enabled: true,
      layout: 'split', // Default layout
      features: {
        search: true,
        filters: true,
        grouping: this.supportsGroupByEmne(entityType),
        hierarchy: this._supportsHierarchy(entityType),
        inlineEdit: this._supportsInlineEdit(entityType),
        bulkActions: this._supportsBulkActions(entityType)
      }
    };
  }

  // Private helper methods
  static _toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  static _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static _pluralize(str) {
    if (!str) return str;
    
    const lowerStr = str.toLowerCase();
    
    // Words that don't change in plural
    if (lowerStr.includes("krav") || lowerStr.includes("tiltak")) {
      return str;
    }
    
    // Already plural (ends with 's')
    if (str.endsWith("s")) return str;
    
    // Default Norwegian pluralization
    return str + "er";
  }

  static _createFallbackConfig(entityType) {
    return {
      title: this._capitalize(entityType),
      modelPrintName: entityType,
      queryKey: [entityType],
      workspace: {
        enabled: true,
        features: {
          grouping: true,
          hierarchy: false,
          inlineEdit: true,
          search: true,
          filters: true,
          bulkActions: false,
        },
      },
      fields: [],
    };
  }

  static _supportsHierarchy(entityType) {
    const hierarchicalTypes = ["tiltak", "prosjektTiltak", "krav"];
    return hierarchicalTypes.includes(entityType);
  }

  static _supportsInlineEdit(entityType) {
    const readOnlyTypes = ["combined", "combinedEntities"];
    return !readOnlyTypes.includes(entityType);
  }

  static _supportsBulkActions(entityType) {
    const bulkActionTypes = ["krav", "tiltak"];
    return bulkActionTypes.includes(entityType);
  }

  static _supportsGroupByEmne(entityType) {
    const normalizedType = entityType.toLowerCase().replace(/-/g, '');
    const groupableTypes = ["krav", "tiltak", "prosjektkrav", "prosjekttiltak"];
    return groupableTypes.includes(normalizedType);
  }
}

