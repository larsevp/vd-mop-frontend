/**
 * CombinedEntitiesAdapter - Backend adapter for combined entity views
 *
 * This adapter uses the backend's combined-entities API endpoint which:
 * - Pre-combines krav and tiltak entities with proper hierarchy
 * - Handles complex parent-child relationships and leveling
 * - Returns grouped response structure like individual entity adapters
 * - Works for both general entities and project-specific entities
 */

import { EntityWorkspaceAdapter } from "./EntityWorkspaceAdapter.js";

export class CombinedEntitiesAdapter extends EntityWorkspaceAdapter {
  constructor(combinedConfig, options = {}) {
    // Pass a synthetic entityType since we handle mixed entities
    super("combined", {
      debug: false,
      ...options,
    });

    this.combinedConfig = combinedConfig;
    this.isProjectSpecific = combinedConfig.isProjectSpecific || false;
  }

  // === DISPLAY CONFIGURATION ===

  getDisplayConfig() {
    return {
      title: this.combinedConfig.title || "Combined Entities",
      entityTypes: this.combinedConfig.entityTypes || ["krav", "tiltak"],
      supportsGroupByEmne: true,
      layout: "split",
      newButtonLabel: this.combinedConfig.newButtonLabel || "New Entity",
      // Combined view specific
      isCombinedView: true,
      combinedEntityTypes: this.combinedConfig.entityTypes || ["krav", "tiltak"],
      primaryType: this.combinedConfig.primaryType || "krav",
      secondaryType: this.combinedConfig.secondaryType || "tiltak",
    };
  }

  getFilterConfig() {
    return {
      fields: {
        // Entity type filter (specific to combined view)
        entityType: {
          enabled: true,
          label: "Type",
          placeholder: "Alle typer",
          options:
            this.combinedConfig.entityTypes?.map((type) => ({
              value: type,
              label: this.getDisplayType(type),
            })) || [],
        },

        // Common filters
        status: { enabled: true, label: "Status", placeholder: "Alle statuser" },
        vurdering: { enabled: true, label: "Vurdering", placeholder: "Alle vurderinger" },
        emne: { enabled: true, label: "Emne", placeholder: "Alle emner" },
      },

      sortFields: [
        { key: "updatedAt", label: "Sist endret" },
        { key: "createdAt", label: "Opprettet" },
        { key: "title", label: "Tittel" },
        { key: "entityType", label: "Type" },
        { key: "status", label: "Status" },
        { key: "emne", label: "Emne" },
      ],

      defaults: {
        sortBy: "id",
        sortOrder: "asc",
        filterBy: "all",
        entityType: "all",
      },
    };
  }

  // === API QUERY FUNCTIONS ===

  getQueryFunctions() {
    return {
      combined: {
        standard: this.combinedConfig.queryFn,
        grouped: this.combinedConfig.queryFnGrouped || this.combinedConfig.queryFn,
      },
    };
  }

  // === DATA TRANSFORMATION ===

  /**
   * Transform combined entities response
   * The backend already handles the complex hierarchy, so we mainly pass it through
   * while ensuring proper entity type detection and standardization
   */
  transformResponse(rawData) {
    if (this.debug) {
    }

    // Use parent class grouped response handling since backend returns grouped structure
    return super.transformResponse(rawData);
  }

  /**
   * Override entity type detection for combined entities
   * Backend provides explicit entityType field, so use that
   */
  detectEntityType(rawEntity) {
    if (rawEntity?.entityType) {
      return rawEntity.entityType;
    }

    // Fallback to parent detection logic
    return super.detectEntityType(rawEntity);
  }

  /**
   * Enhanced entity transformation that handles both krav and tiltak types
   */
  transformEntity(rawEntity) {
    if (!rawEntity) return null;

    // Let parent class handle the transformation
    const standardEntity = super.transformEntity(rawEntity);

    // Add combined-view specific enhancements
    if (standardEntity) {
      // Ensure proper entity type for combined view
      if (rawEntity.entityType) {
        standardEntity.entityType = rawEntity.entityType;
      }

      // Add combined-view metadata
      standardEntity._isCombinedEntity = true;
      standardEntity._hierarchyLevel = rawEntity._hierarchyLevel || 0;
      standardEntity._displayedUnderKrav = rawEntity._displayedUnderKrav || false;
      standardEntity._orphaned = rawEntity._orphaned || false;

      // Preserve cross-entity relationships
      if (rawEntity.prosjektKrav) standardEntity.prosjektKrav = rawEntity.prosjektKrav;
      if (rawEntity.prosjektTiltak) standardEntity.prosjektTiltak = rawEntity.prosjektTiltak;
      if (rawEntity.generalKrav) standardEntity.generalKrav = rawEntity.generalKrav;
      if (rawEntity.generalTiltak) standardEntity.generalTiltak = rawEntity.generalTiltak;
    }

    return standardEntity;
  }

  // === TYPE-SPECIFIC HELPERS ===

  /**
   * Get display type name for entity type
   */
  getDisplayType(entityType) {
    const types = {
      krav: "Krav",
      tiltak: "Tiltak",
      prosjektkrav: "Prosjekt Krav",
      prosjekttiltak: "Prosjekt Tiltak",
    };
    return types[entityType?.toLowerCase()] || entityType;
  }

  /**
   * Get badge color for entity type
   */
  getBadgeColor(entityType) {
    const colors = {
      krav: "bg-blue-100 text-blue-700",
      prosjektkrav: "bg-blue-100 text-blue-700",
      tiltak: "bg-green-100 text-green-700",
      prosjekttiltak: "bg-green-100 text-green-700",
    };
    return colors[entityType?.toLowerCase()] || "bg-gray-100 text-gray-700";
  }

  /**
   * Extract UID for combined entities
   */
  extractUID(rawEntity, entityType = null) {
    const detectedType = entityType || this.detectEntityType(rawEntity);

    if (detectedType?.toLowerCase().includes("krav")) {
      return rawEntity.kravUID || `K${rawEntity.id}`;
    } else if (detectedType?.toLowerCase().includes("tiltak")) {
      return rawEntity.tiltakUID || `T${rawEntity.id}`;
    }

    return rawEntity.uid || rawEntity.id;
  }
}

/**
 * Factory function for creating CombinedEntitiesAdapter
 */
export const createCombinedEntitiesAdapter = (combinedConfig, options = {}) => {
  return new CombinedEntitiesAdapter(combinedConfig, options);
};

export default CombinedEntitiesAdapter;
