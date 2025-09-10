/**
 * ProsjektKravTiltakCombinedAdapter - Combined adapter for ProsjektKrav and ProsjektTiltak entities
 *
 * This adapter uses the backend's combined-entities/project API endpoint which:
 * - Pre-combines prosjektkrav and prosjekttiltak entities with proper hierarchy
 * - Handles complex parent-child relationships and leveling
 * - Returns grouped response structure like individual entity adapters
 * - Works for project-specific entities with projectId context
 */

import { getPaginatedCombinedProsjektEntities, getCombinedProsjektEntitiesGroupedByEmne } from "@/api/endpoints";
import { createProsjektKravAdapter } from "../../../prosjektkrav/adapter";
import { createProsjektTiltakAdapter } from "../../../prosjekttiltak/adapter";
import { prosjektKrav as prosjektKravConfig } from "@/modelConfigs/models/prosjektKrav.js";
import { prosjektTiltak as prosjektTiltakConfig } from "@/modelConfigs/models/prosjektTiltak.js";

export class ProsjektKravTiltakCombinedAdapter {
  constructor(options = {}) {
    this.options = { debug: false, ...options };

    // Initialize single entity adapters with their modelConfigs
    this.prosjektKravAdapter = createProsjektKravAdapter(prosjektKravConfig);
    this.prosjektTiltakAdapter = createProsjektTiltakAdapter(prosjektTiltakConfig);

    this.entityType = "combined-prosjektkrav-prosjekttiltak";
    this.isProjectSpecific = true;

    if (this.options.debug) {
    }
  }

  // === DISPLAY CONFIGURATION ===

  getDisplayConfig() {
    return {
      title: "Prosjektkrav og Prosjekttiltak",
      entityTypes: ["prosjektkrav", "prosjekttiltak"],
      supportsGroupByEmne: true,
      layout: "split",
      newButtonLabel: "Nytt Prosjektkrav/Prosjekttiltak",
      // Combined view specific
      isCombinedView: true,
      combinedEntityTypes: ["prosjektkrav", "prosjekttiltak"],
      primaryType: "prosjektkrav",
      secondaryType: "prosjekttiltak",
      // Project context
      isProjectSpecific: true,
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
            { value: "prosjektkrav", label: "Prosjektkrav" },
            { value: "prosjekttiltak", label: "Prosjekttiltak" },
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
        standard: getPaginatedCombinedProsjektEntities,
        grouped: getCombinedProsjektEntitiesGroupedByEmne,
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
   * Backend provides explicit entityType field for project combined queries
   */
  detectEntityType(rawEntity) {
    // Check for explicit entity type markers (used for new entities)
    if (rawEntity?.__entityType) {
      return rawEntity.__entityType;
    }

    if (rawEntity?.entityType) {
      return rawEntity.entityType;
    }

    // Check for meaningful values (not empty strings)
    if (
      (rawEntity.kravUID && rawEntity.kravUID.trim()) ||
      (rawEntity.kravreferanse && rawEntity.kravreferanse.trim()) ||
      rawEntity.generalKravId !== undefined
    ) {
      return "prosjektkrav";
    } else if (
      (rawEntity.tiltakUID && rawEntity.tiltakUID.trim()) ||
      (rawEntity.implementasjon && rawEntity.implementasjon.trim()) ||
      rawEntity.generalTiltakId !== undefined
    ) {
      return "prosjekttiltak";
    }

    // Final fallback: detect by field structure for new entities
    // ProsjektKrav has these distinctive fields
    if ("kravUID" in rawEntity || "kravreferanse" in rawEntity || "kravreferansetypeId" in rawEntity || "kravStatus" in rawEntity) {
      return "prosjektkrav";
    }

    // ProsjektTiltak has these distinctive fields
    if ("tiltakUID" in rawEntity || "implementasjon" in rawEntity) {
      return "prosjekttiltak";
    }

    console.warn("ProsjektKravTiltakCombinedAdapter: Could not detect entity type for entity:", rawEntity);
    return "unknown";
  }

  /**
   * Get display type name for entity type
   */
  getDisplayType(entityType) {
    const types = {
      prosjektkrav: "Prosjektkrav",
      prosjekttiltak: "Prosjekttiltak",
      krav: "Krav",
      tiltak: "Tiltak",
    };
    return types[entityType?.toLowerCase()] || entityType;
  }

  /**
   * Get badge color for entity type
   */
  getBadgeColor(entityType) {
    const colors = {
      prosjektkrav: "bg-blue-100 text-blue-700",
      krav: "bg-blue-100 text-blue-700",
      prosjekttiltak: "bg-green-100 text-green-700",
      tiltak: "bg-green-100 text-green-700",
    };
    return colors[entityType?.toLowerCase()] || "bg-gray-100 text-gray-700";
  }

  /**
   * Get the API property names for this combined entity type in grouped responses
   * This returns multiple property names (e.g., ['prosjektkrav', 'prosjekttiltak'])
   */
  getGroupedPropertyNames() {
    return ["prosjektkrav", "prosjekttiltak"];
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
          entity.tilbakemeldingSnippet,
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
    const filters = {
      entityTypes: new Set(),
      statuses: new Set(),
      vurderinger: new Set(),
      emner: new Set(),
    };

    entities.forEach((entity) => {
      if (entity.entityType) filters.entityTypes.add(entity.entityType);

      const status = entity.status?.name || entity.status?.navn;
      if (status) filters.statuses.add(status);

      const vurdering = entity.vurdering?.name || entity.vurdering?.navn;
      if (vurdering) filters.vurderinger.add(vurdering);

      const emne = entity.emne?.navn || entity.emne?.name;
      if (emne) filters.emner.add(emne);
    });

    return {
      entityTypes: Array.from(filters.entityTypes).sort(),
      statuses: Array.from(filters.statuses).sort(),
      vurderinger: Array.from(filters.vurderinger).sort(),
      emner: Array.from(filters.emner).sort(),
    };
  }

  // === CRUD OPERATIONS FOR DTO INTERFACE ===

  /**
   * Save entity (implements DTO interface requirement)
   * Delegates to the appropriate individual adapter based on entity type
   */
  async save(entityData, isUpdate) {
    const entityType = this.detectEntityType(entityData);

    // More explicit stripping - create completely clean object without entityType
    const cleanEntityData = {};
    Object.keys(entityData).forEach((key) => {
      if (key !== "entityType" && key !== "__entityType") {
        cleanEntityData[key] = entityData[key];
      }
    });

    if (entityType === "prosjektkrav" && this.prosjektKravAdapter?.config) {
      const config = this.prosjektKravAdapter.config;
      if (isUpdate && config.updateFn) {
        return await config.updateFn(cleanEntityData.id, cleanEntityData);
      } else if (!isUpdate && config.createFn) {
        return await config.createFn(cleanEntityData);
      }
      throw new Error(`${isUpdate ? "Update" : "Create"} function not available for prosjektkrav`);
    }

    if (entityType === "prosjekttiltak" && this.prosjektTiltakAdapter?.config) {
      const config = this.prosjektTiltakAdapter.config;
      if (isUpdate && config.updateFn) {
        return await config.updateFn(cleanEntityData.id, cleanEntityData);
      } else if (!isUpdate && config.createFn) {
        return await config.createFn(cleanEntityData);
      }
      throw new Error(`${isUpdate ? "Update" : "Create"} function not available for prosjekttiltak`);
    }

    throw new Error(`Unknown entity type for save: ${entityType}`);
  }

  /**
   * Delete entity (implements DTO interface requirement)
   */
  async delete(entity) {
    const entityType = this.detectEntityType(entity);

    if (entityType === "prosjektkrav" && this.prosjektKravAdapter?.config?.deleteFn) {
      return await this.prosjektKravAdapter.config.deleteFn(entity.id);
    }

    if (entityType === "prosjekttiltak" && this.prosjektTiltakAdapter?.config?.deleteFn) {
      return await this.prosjektTiltakAdapter.config.deleteFn(entity.id);
    }

    throw new Error(`Delete function not available for entity type: ${entityType}`);
  }

  // === POST-OPERATION HOOKS ===

  onSaveComplete(result, isCreate, handleEntitySelect) {
    // Combined adapter handles post-save logic for combined views
    if (!result || !handleEntitySelect) {
      return;
    }

    // Extract the actual entity data from API response
    const actualEntity = result.data || result;
    const entityType = this.detectEntityType(actualEntity);

    if (this.options.debug) {
    }

    // Enhance the entity and select it for both create and update operations
    const enhancedEntity = this.enhanceEntity(actualEntity);

    if (enhancedEntity) {
      // Select the entity (works for both create and update)
      handleEntitySelect(enhancedEntity);

      // For new entities, scroll to them after a brief delay
      if (isCreate) {
        setTimeout(() => {
          const entityId = enhancedEntity.id || enhancedEntity.uid;
          const renderId = enhancedEntity.renderId;

          const entityElement =
            document.querySelector(`[data-entity-id="${renderId}"]`) ||
            document.querySelector(`[data-entity-id="${entityId}"]`) ||
            document.querySelector(`[data-entity-uid="${entityId}"]`);

          if (entityElement) {
            entityElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          } else if (this.options.debug) {
          }
        }, 300);
      }
    }

    // Also delegate to specific adapter if it has additional business logic
    if (entityType === "prosjektkrav" && this.prosjektKravAdapter?.onSaveComplete) {
      this.prosjektKravAdapter.onSaveComplete(result, isCreate, handleEntitySelect);
    } else if (entityType === "prosjekttiltak" && this.prosjektTiltakAdapter?.onSaveComplete) {
      this.prosjektTiltakAdapter.onSaveComplete(result, isCreate, handleEntitySelect);
    }
  }

  // === MODEL CONFIG ACCESS ===

  /**
   * Combined adapters provide a basic config for the workspace
   * Individual entity detail rendering uses specific modelConfigs via renderers
   */
  get config() {
    return {
      // Provide basic properties that might be needed
      title: "Prosjektkrav og Prosjekttiltak",
      // CRUD operations should go through individual entity renderers
      updateFn: null,
      createFn: null,
      deleteFn: null,
    };
  }

  // === UTILITY METHODS ===

  getDebugInfo() {
    return {
      adapter: "ProsjektKravTiltakCombinedAdapter",
      entityType: this.entityType,
      supportedTypes: ["prosjektkrav", "prosjekttiltak"],
      isProjectSpecific: this.isProjectSpecific,
      options: this.options,
    };
  }
}

/**
 * Factory function for creating ProsjektKravTiltakCombinedAdapter
 */
export const createProsjektKravTiltakCombinedAdapter = (options = {}) => {
  return new ProsjektKravTiltakCombinedAdapter(options);
};

export default ProsjektKravTiltakCombinedAdapter;
