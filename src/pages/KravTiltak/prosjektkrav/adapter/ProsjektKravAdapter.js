/**
 * ProsjektKravAdapter - Specific adapter for ProsjektKrav entities
 */

export class ProsjektKravAdapter {
  constructor(config, options = {}) {
    this.config = config;
    this.options = { debug: false, ...options };
  }

  // === CONFIGURATION METHODS ===

  getDisplayConfig() {
    return {
      title: this.config.title || "Prosjektkrav",
      entityTypes: ["prosjektKrav"],
      supportsGroupByEmne: this.config.workspace?.groupBy === "emne",
      layout: this.config.workspace?.layout || "split",
      newButtonLabel: this.config.newButtonLabel || `Ny ${this.config.title}`,
    };
  }

  getFilterConfig() {
    return {
      fields: {
        status: {
          enabled: this.config.workspace?.ui?.showStatus !== false,
          label: "Status",
          placeholder: "Alle statuser",
        },
        vurdering: {
          enabled: this.config.workspace?.ui?.showVurdering !== false,
          label: "Vurdering",
          placeholder: "Alle vurderinger",
        },
        prioritet: {
          enabled: this.config.workspace?.ui?.showPrioritet !== false,
          label: "Prioritet",
          placeholder: "Alle prioriteter",
        },
        emne: {
          enabled: this.config.workspace?.features?.grouping !== false,
          label: "Emne",
          placeholder: "Alle emner",
        },
        obligatorisk: {
          enabled: true,
          label: "Obligatorisk",
          placeholder: "Alle",
        },
      },
      sortFields: [
        { key: "updatedAt", label: "Sist endret" },
        { key: "createdAt", label: "Opprettet" },
        { key: "title", label: "Tittel" },
        { key: "status", label: "Status" },
        { key: "prioritet", label: "Prioritet" },
        { key: "emne", label: "Emne" },
      ],
      defaults: {
        sortBy: "updatedAt",
        sortOrder: "desc",
        filterBy: "all",
      },
    };
  }

  getQueryFunctions() {
    return {
      prosjektKrav: {
        standard: this.config.queryFnWorkspace || this.config.queryFn,
        grouped: this.config.queryFnGroupedByEmneWorkspace || this.config.queryFnGroupedByEmne,
      },
    };
  }

  /**
   * Get the API property name for grouped responses
   * Maps entity type to API property name
   */
  getGroupedPropertyName() {
    return "prosjektkrav";
  }

  // === BUSINESS LOGIC METHODS ===

  enhanceEntity(entity) {
    return {
      ...entity,
      entityType: "prosjektKrav",
      renderId: `prosjektkrav-${entity.id}`,
      displayType: this.getDisplayType("prosjektKrav"),
      badgeColor: this.getBadgeColor("prosjektKrav"),
    };
  }

  getDisplayType() {
    return "Prosjektkrav";
  }

  getBadgeColor() {
    return "bg-green-100 text-green-700";
  }

  // === ENTITY FIELD EXTRACTION ===

  extractUID(entity) {
    return entity.kravUID || entity.uid || entity.id || "";
  }

  extractTitle(entity) {
    return entity.tittel || entity.title || entity.navn || entity.name || "Uten tittel";
  }

  // === FILTERING AND SORTING ===

  filterEntities(entities, filters = {}) {
    return entities.filter((entity) => {
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const searchable = [entity.title, entity.descriptionCard, entity.uid, entity.emne?.navn || entity.emne?.name]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(searchTerm)) return false;
      }

      if (filters.status && filters.status !== "all") {
        const entityStatus = entity.status?.name || entity.status?.navn || "";
        if (entityStatus !== filters.status) return false;
      }

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
        return entity.title || "";
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
      statuses: new Set(),
      vurderinger: new Set(),
      emner: new Set(),
    };

    entities.forEach((entity) => {
      const status = entity.status?.name || entity.status?.navn;
      if (status) filters.statuses.add(status);

      const vurdering = entity.vurdering?.name || entity.vurdering?.navn;
      if (vurdering) filters.vurderinger.add(vurdering);

      const emne = entity.emne?.navn || entity.emne?.name;
      if (emne) filters.emner.add(emne);
    });

    return {
      statuses: Array.from(filters.statuses).sort(),
      vurderinger: Array.from(filters.vurderinger).sort(),
      emner: Array.from(filters.emner).sort(),
    };
  }

  // === POST-OPERATION HOOKS ===

  onSaveComplete(result, isCreate, handleEntitySelect, dto) {
    //console.log('ProsjektKravAdapter.onSaveComplete called with:', { result, isCreate, hasHandleEntitySelect: !!handleEntitySelect, hasDto: !!dto });

    // ProsjektKrav-specific logic: Extract entity from Axios response
    const entity = result?.data || result;
    //console.log('Extracted entity:', entity);
    //console.log('Entity has id?', !!entity?.id, 'ID value:', entity?.id);

    // ProsjektKrav-specific post-save logic for both create and update
    if (entity?.id) {
      //console.log('Processing saved entity:', entity);

      // Apply ProsjektKrav-specific enhancement
      let processedEntity = this.enhanceEntity ? this.enhanceEntity(entity) : entity;
      //console.log('Processed entity:', processedEntity);

      if (processedEntity && handleEntitySelect) {
        //console.log('Calling handleEntitySelect with updated entity:', processedEntity);
        handleEntitySelect(processedEntity);
      }
    }
  }
}

export const createProsjektKravAdapter = (config, options = {}) => {
  return new ProsjektKravAdapter(config, options);
};

export default ProsjektKravAdapter;
