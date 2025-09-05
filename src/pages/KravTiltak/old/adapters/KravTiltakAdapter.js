/**
 * KravTiltakAdapter - KravTiltak implementation of WorkspaceAdapterContract
 * 
 * This adapter implements the WorkspaceAdapterContract for Krav/Tiltak domain:
 * - Handles krav-specific and tiltak-specific configurations
 * - Provides domain-specific filter and sort logic
 * - Transforms entities according to krav/tiltak business rules
 * - Integrates with existing EntityWorkspaceAdapter for base functionality
 * 
 * The generic interface receives this via dependency injection.
 */

import { WorkspaceAdapterContract } from '@/components/EntityWorkspace/interface/contracts/WorkspaceAdapterContract.js';

export class KravTiltakAdapter {
  constructor(kravConfig, tiltakConfig = null, options = {}) {
    this.kravConfig = kravConfig;
    this.tiltakConfig = tiltakConfig;
    this.isCombinedView = !!tiltakConfig;
    this.options = { debug: false, ...options };
  }

  // === CONFIGURATION METHODS ===

  /**
   * Get display configuration for workspace
   */
  getDisplayConfig() {
    // Detect entity type from config
    const entityType = this._detectEntityType();
    
    return {
      title: this.isCombinedView ? 'Krav og Tiltak' : (this.kravConfig.title || 'Krav'),
      entityTypes: this.isCombinedView ? ['krav', 'tiltak'] : [entityType],
      supportsGroupByEmne: this.kravConfig.workspace?.groupBy === 'emne',
      layout: this.kravConfig.workspace?.layout || 'split',
      newButtonLabel: this.kravConfig.newButtonLabel || `Ny ${this.kravConfig.title}`
    };
  }

  /**
   * Detect entity type from config
   */
  _detectEntityType() {
    // Check model print name or title to determine type
    if (this.kravConfig.modelPrintName === 'prosjektKrav' || 
        this.kravConfig.title?.includes('Prosjekt')) {
      return 'prosjektKrav';
    }
    return 'krav';
  }

  /**
   * Get SearchBar filter configuration
   */
  getFilterConfig() {
    return {
      // Available filter fields
      fields: {
        status: {
          enabled: this.kravConfig.workspace?.ui?.showStatus !== false,
          label: 'Status',
          placeholder: 'Alle statuser'
        },
        vurdering: {
          enabled: this.kravConfig.workspace?.ui?.showVurdering !== false,
          label: 'Vurdering',
          placeholder: 'Alle vurderinger'
        },
        emne: {
          enabled: this.kravConfig.workspace?.features?.grouping !== false,
          label: 'Emne',
          placeholder: 'Alle emner'
        },
        entityType: {
          enabled: this.isCombinedView,
          label: 'Type',
          placeholder: 'Alle typer'
        }
      },
      
      // Available sort options
      sortFields: [
        { key: 'updatedAt', label: 'Sist endret' },
        { key: 'createdAt', label: 'Opprettet' },
        { key: 'title', label: 'Tittel' },
        { key: 'status', label: 'Status' },
        { key: 'emne', label: 'Emne' }
      ],
      
      // Default values
      defaults: {
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        filterBy: 'all'
      }
    };
  }

  /**
   * Get API query functions
   */
  getQueryFunctions() {
    const entityType = this._detectEntityType();
    
    return {
      [entityType]: {
        standard: this.kravConfig.queryFn,
        grouped: this.kravConfig.queryFnGroupedByEmne
      },
      tiltak: this.tiltakConfig ? {
        standard: this.tiltakConfig.queryFn,
        grouped: this.tiltakConfig.queryFnGroupedByEmne
      } : null
    };
  }

  // === BUSINESS LOGIC METHODS ===

  /**
   * Enhance entity with domain-specific fields for UI
   */
  enhanceEntity(entity, entityType) {
    const normalizedEntityType = entity.entityType || entityType;
    
    return {
      ...entity,
      // Ensure entityType for combined views
      entityType: normalizedEntityType,
      
      // Generate consistent elementId for list rendering
      elementId: normalizedEntityType ? 
        `${normalizedEntityType.toLowerCase()}-${entity.id}` : 
        entity.id?.toString(),
      
      // UI display helpers
      displayType: this.getDisplayType(normalizedEntityType),
      badgeColor: this.getBadgeColor(normalizedEntityType),
    };
  }

  getDisplayType(entityType) {
    const types = {
      krav: 'Krav',
      tiltak: 'Tiltak',
      prosjektKrav: 'Prosjektkrav', 
      prosjektTiltak: 'Prosjekttiltak'
    };
    return types[entityType] || entityType;
  }

  getBadgeColor(entityType) {
    const colors = {
      krav: 'bg-blue-100 text-blue-700',
      prosjektKrav: 'bg-blue-100 text-blue-700',
      tiltak: 'bg-green-100 text-green-700',
      prosjektTiltak: 'bg-green-100 text-green-700'
    };
    return colors[entityType] || 'bg-gray-100 text-gray-700';
  }

  // === ENTITY FIELD EXTRACTION ===

  /**
   * Extract UID from entity (DTO contract method)
   */
  extractUID(entity) {
    return entity.kravUID || entity.tiltakUID || entity.uid || entity.id || '';
  }

  /**
   * Extract title from entity (DTO contract method)
   */
  extractTitle(entity) {
    return entity.tittel || entity.title || entity.navn || entity.name || 'Uten tittel';
  }

  // === COMBINED VIEW METHODS ===

  /**
   * Mix krav + tiltak entities for combined view
   */
  combineEntities(kravEntities = [], tiltakEntities = []) {
    if (!this.isCombinedView) {
      return kravEntities;
    }

    return [
      ...kravEntities.map(entity => ({ ...entity, entityType: 'krav' })),
      ...tiltakEntities.map(entity => ({ ...entity, entityType: 'tiltak' }))
    ];
  }

  // === FILTERING AND SORTING ===

  /**
   * Filter entities based on criteria
   */
  filterEntities(entities, filters = {}) {
    return entities.filter(entity => {
      // Text search
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

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const entityStatus = entity.status?.name || entity.status?.navn || '';
        if (entityStatus !== filters.status) return false;
      }

      // Vurdering filter  
      if (filters.vurdering && filters.vurdering !== 'all') {
        const entityVurdering = entity.vurdering?.name || entity.vurdering?.navn || '';
        if (entityVurdering !== filters.vurdering) return false;
      }

      // Entity type filter (for combined view)
      if (filters.entityType && filters.entityType !== 'all') {
        if (entity.entityType !== filters.entityType) return false;
      }

      return true;
    });
  }

  /**
   * Sort entities by field
   */
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
      case 'entityType':
        return entity.entityType || '';
      default:
        return entity[field] || '';
    }
  }

  /**
   * Extract available filter options from entities
   */
  extractAvailableFilters(entities = []) {
    const filters = {
      statuses: new Set(),
      vurderinger: new Set(), 
      emner: new Set(),
      entityTypes: new Set()
    };

    entities.forEach(entity => {
      // Status values
      const status = entity.status?.name || entity.status?.navn;
      if (status) filters.statuses.add(status);
      
      // Vurdering values
      const vurdering = entity.vurdering?.name || entity.vurdering?.navn;
      if (vurdering) filters.vurderinger.add(vurdering);
      
      // Emne values
      const emne = entity.emne?.navn || entity.emne?.name;
      if (emne) filters.emner.add(emne);
      
      // Entity types
      if (entity.entityType) filters.entityTypes.add(entity.entityType);
    });

    return {
      statuses: Array.from(filters.statuses).sort(),
      vurderinger: Array.from(filters.vurderinger).sort(),
      emner: Array.from(filters.emner).sort(),
      entityTypes: Array.from(filters.entityTypes).sort()
    };
  }
}

/**
 * Factory function for KravTiltak workspaces
 */
export const createKravTiltakAdapter = (kravConfig, tiltakConfig = null, options = {}) => {
  return new KravTiltakAdapter(kravConfig, tiltakConfig, options);
};

export default KravTiltakAdapter;