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
      title: this.config.title || 'Prosjektkrav',
      entityTypes: ['prosjektKrav'],
      supportsGroupByEmne: this.config.workspace?.groupBy === 'emne',
      layout: this.config.workspace?.layout || 'split',
      newButtonLabel: this.config.newButtonLabel || `Ny ${this.config.title}`
    };
  }

  getFilterConfig() {
    return {
      fields: {
        status: {
          enabled: this.config.workspace?.ui?.showStatus !== false,
          label: 'Status',
          placeholder: 'Alle statuser'
        },
        vurdering: {
          enabled: this.config.workspace?.ui?.showVurdering !== false,
          label: 'Vurdering',
          placeholder: 'Alle vurderinger'
        },
        emne: {
          enabled: this.config.workspace?.features?.grouping !== false,
          label: 'Emne',
          placeholder: 'Alle emner'
        }
      },
      sortFields: [
        { key: 'updatedAt', label: 'Sist endret' },
        { key: 'createdAt', label: 'Opprettet' },
        { key: 'title', label: 'Tittel' },
        { key: 'status', label: 'Status' },
        { key: 'emne', label: 'Emne' }
      ],
      defaults: {
        sortBy: 'id',
        sortOrder: 'asc',
        filterBy: 'all'
      }
    };
  }

  getQueryFunctions() {
    return {
      prosjektKrav: {
        standard: this.config.queryFn,
        grouped: this.config.queryFnGroupedByEmne
      }
    };
  }

  /**
   * Get the API property name for grouped responses
   * Maps entity type to API property name
   */
  getGroupedPropertyName() {
    return 'prosjektkrav';
  }

  // === BUSINESS LOGIC METHODS ===

  enhanceEntity(entity) {
    return {
      ...entity,
      entityType: 'prosjektKrav',
      elementId: `prosjektkrav-${entity.id}`,
      displayType: this.getDisplayType('prosjektKrav'),
      badgeColor: this.getBadgeColor('prosjektKrav'),
    };
  }

  getDisplayType() {
    return 'Prosjektkrav';
  }

  getBadgeColor() {
    return 'bg-blue-100 text-blue-700';
  }

  // === ENTITY FIELD EXTRACTION ===

  extractUID(entity) {
    return entity.kravUID || entity.uid || entity.id || '';
  }

  extractTitle(entity) {
    return entity.tittel || entity.title || entity.navn || entity.name || 'Uten tittel';
  }

  // === FILTERING AND SORTING ===

  filterEntities(entities, filters = {}) {
    return entities.filter(entity => {
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const searchable = [
          entity.title,
          entity.descriptionCard,
          entity.uid,
          entity.emne?.navn || entity.emne?.name
        ].join(' ').toLowerCase();
        
        if (!searchable.includes(searchTerm)) return false;
      }

      if (filters.status && filters.status !== 'all') {
        const entityStatus = entity.status?.name || entity.status?.navn || '';
        if (entityStatus !== filters.status) return false;
      }

      if (filters.vurdering && filters.vurdering !== 'all') {
        const entityVurdering = entity.vurdering?.name || entity.vurdering?.navn || '';
        if (entityVurdering !== filters.vurdering) return false;
      }

      return true;
    });
  }

  sortEntities(entities, sortBy = 'updatedAt', sortOrder = 'desc') {
    return entities.sort((a, b) => {
      let aValue = this.getSortValue(a, sortBy);
      let bValue = this.getSortValue(b, sortBy);
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  getSortValue(entity, field) {
    switch (field) {
      case 'title':
        return entity.title || '';
      case 'status':
        return entity.status?.name || entity.status?.navn || '';
      case 'emne':
        return entity.emne?.navn || entity.emne?.name || '';
      default:
        return entity[field] || '';
    }
  }

  extractAvailableFilters(entities = []) {
    const filters = {
      statuses: new Set(),
      vurderinger: new Set(), 
      emner: new Set()
    };

    entities.forEach(entity => {
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
      emner: Array.from(filters.emner).sort()
    };
  }
}

export const createProsjektKravAdapter = (config, options = {}) => {
  return new ProsjektKravAdapter(config, options);
};

export default ProsjektKravAdapter;