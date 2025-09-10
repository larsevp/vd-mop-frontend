/**
 * KravTiltakCombinedAdapter - Combined adapter for Krav and Tiltak entities
 *
 * This adapter follows the same interface as single adapters but handles multiple entity types:
 * - Uses backend's combined-entities API endpoint
 * - Detects entity type and applies appropriate logic per entity
 * - Provides the same interface as KravAdapter/TiltakAdapter
 */

import { getPaginatedCombinedEntities, getCombinedEntitiesGroupedByEmne } from "@/api/endpoints";
import { createKravAdapter } from "../../../krav/adapter";
import { createTiltakAdapter } from "../../../tiltak/adapter";
import { krav as kravConfig } from "@/modelConfigs/models/krav";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak";
import { extractAvailableFilters } from "../../../shared/utils/filterUtils.js";

export class KravTiltakCombinedAdapter {
  constructor(options = {}) {
    this.options = { debug: false, ...options };

    // Initialize single entity adapters with their modelConfigs
    this.kravAdapter = createKravAdapter(kravConfig);
    this.tiltakAdapter = createTiltakAdapter(tiltakConfig);
    this.entityType = "combined-krav-tiltak";

    if (this.options.debug) {
      console.log("KravTiltakCombinedAdapter: Initialized", {
        entityType: this.entityType,
        options: this.options,
      });
    }
  }

  // === DISPLAY CONFIGURATION ===

  getDisplayConfig() {
    return {
      title: "Krav og Tiltak",
      entityTypes: ["krav", "tiltak"],
      supportsGroupByEmne: true,
      layout: "split",
      newButtonLabel: "Nytt Krav/Tiltak",
      // Combined view specific
      isCombinedView: true,
      combinedEntityTypes: ["krav", "tiltak"],
      primaryType: "krav",
      secondaryType: "tiltak",
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
          options: [
            { value: "krav", label: "Krav" },
            { value: "tiltak", label: "Tiltak" },
          ],
        },

        // Common filters
        status: { enabled: true, label: "Status", placeholder: "Alle statuser" },
        vurdering: { enabled: true, label: "Vurdering", placeholder: "Alle vurderinger" },
        prioritet: { enabled: true, label: "Prioritet", placeholder: "Alle prioriteter" },
        emne: { enabled: true, label: "Emne", placeholder: "Alle emner" },
      },

      sortFields: [
        { key: "updatedAt", label: "Sist endret" },
        { key: "createdAt", label: "Opprettet" },
        { key: "title", label: "Tittel" },
        { key: "entityType", label: "Type" },
        { key: "status", label: "Status" },
        { key: "prioritet", label: "Prioritet" },
        { key: "emne", label: "Emne" },
      ],

      defaults: {
        sortBy: "updatedAt",
        sortOrder: "desc",
        filterBy: "all",
        entityType: "all",
      },
    };
  }

  // === API QUERY FUNCTIONS ===

  getQueryFunctions() {
    return {
      combined: {
        standard: getPaginatedCombinedEntities,
        grouped: getCombinedEntitiesGroupedByEmne,
      },
    };
  }

  // === BUSINESS LOGIC METHODS ===

  enhanceEntity(entity) {
    if (!entity) return null;

    // Detect entity type dynamically (adapter returns raw data)
    const entityType = this.detectEntityType(entity);

    return {
      ...entity,
      // Adapter provides raw entity type - DTO handles normalization
      entityType,
      renderId: `${entityType}-${entity.id}`,
      displayType: this.getDisplayType(entityType),
      badgeColor: this.getBadgeColor(entityType),
    };
  }

  /**
   * Detect entity type from raw entity data
   * Backend provides explicit entityType field, but fallback to detection
   */
  detectEntityType(rawEntity) {
    // Check for explicit entity type markers (used for new entities)
    if (rawEntity?.__entityType) {
      return rawEntity.__entityType;
    }

    if (rawEntity?.entityType) {
      return rawEntity.entityType;
    }

    // Fallback detection logic for general entities (no projectId)
    if (rawEntity.kravUID || rawEntity.kravreferanse !== undefined) {
      return "krav";
    } else if (rawEntity.tiltakUID || rawEntity.implementasjon !== undefined) {
      return "tiltak";
    }

    // If we can't detect, log for debugging
    console.warn("KravTiltakCombinedAdapter: Could not detect entity type for entity:", rawEntity);
    return "unknown";
  }

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
   * Get the API property names for this combined entity type in grouped responses
   * This returns multiple property names (e.g., ['krav', 'tiltak'])
   */
  getGroupedPropertyNames() {
    return ["krav", "tiltak"];
  }

  // === ENTITY FIELD EXTRACTION ===

  extractUID(entity) {
    const entityType = this.detectEntityType(entity);

    if (entityType?.toLowerCase().includes("krav")) {
      return entity.kravUID || entity.uid || entity.id;
    } else if (entityType?.toLowerCase().includes("tiltak")) {
      return entity.tiltakUID || entity.uid || entity.id;
    }

    return entity.uid || entity.id || "";
  }

  extractTitle(entity) {
    return entity.tittel || entity.title || entity.navn || entity.name || "Uten tittel";
  }

  // === FILTERING AND SORTING ===

  filterEntities(entities, filters = {}) {
    return entities.filter((entity) => {
      // Entity type filter
      if (filters.entityType && filters.entityType !== "all") {
        if (entity.entityType !== filters.entityType) {
          return false;
        }
      }

      // Search filter
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const searchable = [
          entity.title,
          entity.descriptionCard,
          entity.uid,
          entity.emne?.navn || entity.emne?.name,
          entity.beskrivelseSnippet,
          entity.implementasjonSnippet,
          entity.informasjonSnippet,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(searchTerm)) return false;
      }

      // Status filter
      if (filters.status && filters.status !== "all") {
        const entityStatus = entity.status?.name || entity.status?.navn || "";
        if (entityStatus !== filters.status) return false;
      }

      // Vurdering filter
      if (filters.vurdering && filters.vurdering !== "all") {
        const entityVurdering = entity.vurdering?.name || entity.vurdering?.navn || "";
        if (entityVurdering !== filters.vurdering) return false;
      }

      return true;
    });
  }

  sortEntities(entities, sortBy = "updatedAt", sortOrder = "desc") {
    return entities.sort((a, b) => {
      let aValue = this.getSortValue(a, sortBy);
      let bValue = this.getSortValue(b, sortBy);

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }

  getSortValue(entity, field) {
    switch (field) {
      case "title":
        return entity.title || entity.tittel || "";
      case "entityType":
        return entity.entityType || "";
      case "status":
        return entity.status?.name || entity.status?.navn || "";
      case "emne":
        return entity.emne?.navn || entity.emne?.name || "";
      default:
        return entity[field] || "";
    }
  }

  extractAvailableFilters(entities = []) {
    // Use shared logic from utilities with entityTypes for combined views
    return extractAvailableFilters(entities, { includeEntityTypes: true });
  }

  // === CRUD OPERATIONS FOR DTO INTERFACE ===

  /**
   * Save entity (implements DTO interface requirement)
   * Delegates to the appropriate individual adapter based on entity type
   */
  async save(entityData, isUpdate) {
    const entityType = this.detectEntityType(entityData);

    // Strip entityType from data before passing to individual adapters
    // Individual model backends don't allow entityType in update operations
    const { entityType: _, ...cleanEntityData } = entityData;

    // Debug: Check what we're sending to individual adapter
    console.log("KravTiltakCombinedAdapter.save debug:", {
      originalEntityData: entityData,
      detectedEntityType: entityType,
      cleanEntityData: cleanEntityData,
      hasEntityTypeInClean: "entityType" in cleanEntityData,
    });

    if (entityType === "krav" && this.kravAdapter?.config) {
      const config = this.kravAdapter.config;
      if (isUpdate && config.updateFn) {
        return await config.updateFn(cleanEntityData.id, cleanEntityData);
      } else if (!isUpdate && config.createFn) {
        return await config.createFn(cleanEntityData);
      }
      throw new Error(`${isUpdate ? "Update" : "Create"} function not available for krav`);
    }

    if (entityType === "tiltak" && this.tiltakAdapter?.config) {
      const config = this.tiltakAdapter.config;
      if (isUpdate && config.updateFn) {
        return await config.updateFn(cleanEntityData.id, cleanEntityData);
      } else if (!isUpdate && config.createFn) {
        return await config.createFn(cleanEntityData);
      }
      throw new Error(`${isUpdate ? "Update" : "Create"} function not available for tiltak`);
    }

    throw new Error(`Unknown entity type for save: ${entityType}`);
  }

  /**
   * Delete entity (implements DTO interface requirement)
   */
  async delete(entity) {
    const entityType = this.detectEntityType(entity);

    if (entityType === "krav" && this.kravAdapter?.config?.deleteFn) {
      return await this.kravAdapter.config.deleteFn(entity.id);
    }

    if (entityType === "tiltak" && this.tiltakAdapter?.config?.deleteFn) {
      return await this.tiltakAdapter.config.deleteFn(entity.id);
    }

    throw new Error(`Delete function not available for entity type: ${entityType}`);
  }

  // === POST-OPERATION HOOKS ===

  /**
   * onSaveComplete - Domain-specific business logic only
   * UI concerns (selection, scrolling) handled by DTO layer
   *
   * @param {Object} result - API response from save operation
   * @param {boolean} isCreate - Whether this was a create or update operation
   * @param {Function} handleEntitySelect - Function to select the entity after save (unused by adapter)
   * @param {string} entityType - The entity type context from EntityWorkspace (proper DI)
   */
  onSaveComplete(result, isCreate, handleEntitySelect, entityType = null) {
    if (this.options.debug) {
      console.log("KravTiltakCombinedAdapter onSaveComplete - domain business logic:", {
        result,
        entityType,
        isCreate,
      });
    }

    // Adapter responsibility: Domain-specific business logic only
    // Examples: cache invalidation, notifications, analytics, business rules

    // Delegate to specific adapter for domain business logic
    if (entityType === "krav" && this.kravAdapter?.onSaveComplete) {
      this.kravAdapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
    } else if (entityType === "tiltak" && this.tiltakAdapter?.onSaveComplete) {
      this.tiltakAdapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
    }

    // Add any KravTiltak combined-specific business logic here
    // (e.g., update relationship caches, trigger business events, etc.)
  }

  // === MODEL CONFIG ACCESS ===

  /**
   * Combined adapters provide a basic config for the workspace
   * Individual entity detail rendering uses specific modelConfigs via renderers
   */
  get config() {
    return {
      // Provide basic properties that might be needed
      title: "Krav og Tiltak",
      // CRUD operations should go through individual entity renderers
      updateFn: null,
      createFn: null,
      deleteFn: null,
    };
  }

  // === UTILITY METHODS ===

  getDebugInfo() {
    return {
      adapter: "KravTiltakCombinedAdapter",
      entityType: this.entityType,
      supportedTypes: ["krav", "tiltak"],
      options: this.options,
    };
  }
}

/**
 * Factory function for creating KravTiltakCombinedAdapter
 */
export const createKravTiltakCombinedAdapter = (options = {}) => {
  return new KravTiltakCombinedAdapter(options);
};

export default KravTiltakCombinedAdapter;
