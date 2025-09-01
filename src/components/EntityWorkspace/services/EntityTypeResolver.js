/**
 * EntityTypeResolver - Dynamic entity type handling following OCP
 * Handles entity type resolution, configuration lookup, and API mapping
 */

import { modelConfigs } from "@/modelConfigs";
import { EntityTypeTranslator } from "../utils/entityTypeTranslator";

export class EntityTypeResolver {
  /**
   * Resolve model configuration for entity type
   * Single responsibility: Configuration resolution
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

    // Handle special cases using centralized translator
    const translatedType = EntityTypeTranslator.translate(entityType, "camelCase");
    if (translatedType !== entityType && modelConfigs[translatedType]) {
      return modelConfigs[translatedType];
    }

    // Legacy special mappings for backwards compatibility
    const specialMappings = {
      combined: "combinedEntities",
      combinedEntities: "combinedEntities",
      "prosjekt-combined": "prosjektCombined",
      "prosjekt-krav": "prosjektKrav",
      "prosjekt-tiltak": "prosjektTiltak",
      // Handle backend entity types without hyphens
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
   * Resolve API functions for entity type
   * Single responsibility: API function mapping
   */
  static resolveApiConfig(entityType, modelConfig) {
    // If modelConfig already has API functions, use them
    if (modelConfig.queryFn || modelConfig.queryFnAll) {
      // For project entities, prefer workspace-aware functions if available
      const isProjectEntity = EntityTypeTranslator.isProjectEntity(entityType);

      return {
        queryFn:
          isProjectEntity && modelConfig.queryFnWorkspace ? modelConfig.queryFnWorkspace : modelConfig.queryFn || modelConfig.queryFnAll,
        queryFnGroupedByEmne:
          isProjectEntity && modelConfig.queryFnGroupedByEmneWorkspace
            ? modelConfig.queryFnGroupedByEmneWorkspace
            : modelConfig.queryFnGroupedByEmne,
        createFn: modelConfig.createFn,
        updateFn: modelConfig.updateFn,
        deleteFn: modelConfig.deleteFn,
      };
    }

    // Dynamic API resolution based on entity type
    return this._resolveDynamicApiConfig(entityType);
  }

  /**
   * Get display name for entity type
   * Single responsibility: Display name resolution
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
   * Determine if entity type supports specific features
   * Single responsibility: Feature capability detection
   */
  static supportsFeature(entityType, feature, modelConfig) {
    const defaultFeatures = {
      grouping: true,
      hierarchy: true,
      inlineEdit: true,
      search: true,
      filters: true,
      bulkActions: false,
    };

    // Check workspace config first
    if (modelConfig?.workspace?.features?.[feature] !== undefined) {
      return modelConfig.workspace.features[feature];
    }

    // Feature-specific entity type rules
    const featureRules = {
      hierarchy: this._supportsHierarchy(entityType),
      inlineEdit: this._supportsInlineEdit(entityType),
      bulkActions: this._supportsBulkActions(entityType),
    };

    if (featureRules[feature] !== undefined) {
      return featureRules[feature];
    }

    return defaultFeatures[feature] ?? false;
  }

  /**
   * Get entity type from entity object
   * Single responsibility: Entity type detection from data
   */
  static detectEntityType(entity) {
    if (!entity || typeof entity !== "object") {
      return null;
    }

    // Direct entityType property
    if (entity.entityType) {
      return entity.entityType;
    }

    // Detect based on unique properties
    if (entity.kravUID) return "krav";
    if (entity.tiltakUID) return "tiltak";
    if (entity.prosjektKravUID) return "prosjektKrav";
    if (entity.prosjektTiltakUID) return "prosjektTiltak";

    // Detect based on ID patterns or other properties
    if (entity.id && entity.tittel) {
      // Could implement more sophisticated detection here
      return "unknown";
    }

    return null;
  }

  /**
   * Validate entity type and configuration
   * Single responsibility: Entity type validation
   */
  static validateEntityType(entityType) {
    const errors = [];

    if (!entityType) {
      errors.push("Entity type is required");
    }

    if (typeof entityType !== "string") {
      errors.push("Entity type must be a string");
    }

    const modelConfig = this.resolveModelConfig(entityType);
    if (!modelConfig) {
      errors.push(`No configuration found for entity type: ${entityType}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
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
    // Simple pluralization - extend as needed
    if (str.endsWith("s")) return str;
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

  static _resolveDynamicApiConfig(entityType) {
    // For combined entity types or store-managed entities, return store-compatible config
    const storeBasedTypes = ["combined", "combinedEntities", "prosjekt-combined"];

    if (storeBasedTypes.includes(entityType)) {
      // Return a special config that indicates this should use the store
      return {
        queryFn: null, // Indicates to use store instead of API
        queryFnGroupedByEmne: null,
        createFn: null,
        updateFn: null,
        deleteFn: null,
        useStore: true, // Flag to indicate store-based management
      };
    }

    // For other entity types, warn and return null functions
    console.warn(`No API functions configured for entity type: ${entityType}`);

    return {
      queryFn: null,
      queryFnGroupedByEmne: null,
      createFn: null,
      updateFn: null,
      deleteFn: null,
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
    // Use EntityTypeTranslator for consistent naming
    const normalizedType = EntityTypeTranslator.translate(entityType, "lowercase");
    const groupableTypes = ["krav", "tiltak", "prosjektkrav", "prosjekttiltak"];
    return groupableTypes.includes(normalizedType);
  }
}

export default EntityTypeResolver;
