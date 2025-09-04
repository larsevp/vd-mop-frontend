/**
 * KravTiltakCombinedDTO - KravTiltak implementation of CombinedEntityContract
 * 
 * This DTO implements the CombinedEntityContract for Krav + Tiltak mixing:
 * 1. Mix krav and tiltak entities into unified view
 * 2. Handle krav/tiltak specific sorting/filtering rules
 * 3. Maintain proper entity type distinction
 * 4. Provide cross-entity search capabilities
 */

import { CombinedEntityContract } from '@/components/EntityWorkspace/interface/contracts/CombinedEntityContract.js';

/**
 * @typedef {Object} CombinedEntityConfig
 * @property {Object} primaryModel - Primary model config (e.g., krav)
 * @property {Object} secondaryModel - Secondary model config (e.g., tiltak)
 * @property {string} combinedTitle - Display title for combined view
 * @property {Object} mixingRules - Rules for how to combine entities
 */

/**
 * @typedef {Object} MixingRules
 * @property {string} defaultSort - Default sort field for combined view
 * @property {string} defaultSortOrder - Default sort order ('asc' | 'desc')
 * @property {boolean} separateByType - Whether to visually separate by entity type
 * @property {Object} typeWeights - Sorting weights for entity types
 * @property {string[]} searchFields - Fields to include in cross-type search
 */

export class KravTiltakCombinedDTO {
  constructor(primaryModel, secondaryModel, options = {}) {
    this.config = {
      primaryModel,
      secondaryModel,
      combinedTitle: options.title || `${primaryModel.title} og ${secondaryModel.title}`,
      mixingRules: {
        defaultSort: 'updatedAt',
        defaultSortOrder: 'desc',
        separateByType: false,
        typeWeights: {
          [primaryModel.modelPrintName]: 1,
          [secondaryModel.modelPrintName]: 2
        },
        searchFields: ['title', 'descriptionCard', 'uid'],
        ...options.mixingRules
      }
    };
  }

  /**
   * Generate combined display configuration
   */
  getDisplayConfig() {
    return {
      title: this.config.combinedTitle,
      entityTypes: [
        this.config.primaryModel.modelPrintName,
        this.config.secondaryModel.modelPrintName
      ],
      supportsGroupByEmne: this.config.primaryModel.workspace?.groupBy === 'emne',
      layout: 'split',
      isCombinedView: true,
      newButtonLabel: `Ny ${this.config.primaryModel.title}`, // Default to primary
      
      // Combined-specific config
      primaryType: this.config.primaryModel.modelPrintName,
      secondaryType: this.config.secondaryModel.modelPrintName,
      separateByType: this.config.mixingRules.separateByType
    };
  }

  /**
   * Generate combined filter configuration
   */
  getFilterConfig() {
    const primaryFeatures = this.config.primaryModel.workspace?.features || {};
    const secondaryFeatures = this.config.secondaryModel.workspace?.features || {};

    return {
      fields: {
        // Entity type filter (specific to combined view)
        entityType: {
          enabled: true,
          label: 'Type',
          placeholder: 'Alle typer',
          options: [
            { value: this.config.primaryModel.modelPrintName, label: this.config.primaryModel.title },
            { value: this.config.secondaryModel.modelPrintName, label: this.config.secondaryModel.title }
          ]
        },
        
        // Common filters (if both models support them)
        status: {
          enabled: primaryFeatures.showStatus && secondaryFeatures.showStatus,
          label: 'Status',
          placeholder: 'Alle statuser'
        },
        vurdering: {
          enabled: primaryFeatures.showVurdering && secondaryFeatures.showVurdering,
          label: 'Vurdering', 
          placeholder: 'Alle vurderinger'
        },
        emne: {
          enabled: primaryFeatures.grouping && secondaryFeatures.grouping,
          label: 'Emne',
          placeholder: 'Alle emner'
        }
      },

      sortFields: [
        { key: 'updatedAt', label: 'Sist endret' },
        { key: 'createdAt', label: 'Opprettet' },
        { key: 'title', label: 'Tittel' },
        { key: 'entityType', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'emne', label: 'Emne' }
      ],

      defaults: {
        sortBy: this.config.mixingRules.defaultSort,
        sortOrder: this.config.mixingRules.defaultSortOrder,
        filterBy: 'all',
        entityType: 'all'
      }
    };
  }

  /**
   * Get API query functions for both models
   */
  getQueryFunctions() {
    return {
      primary: {
        entityType: this.config.primaryModel.modelPrintName,
        standard: this.config.primaryModel.queryFn,
        grouped: this.config.primaryModel.queryFnGroupedByEmne
      },
      secondary: {
        entityType: this.config.secondaryModel.modelPrintName,
        standard: this.config.secondaryModel.queryFn,
        grouped: this.config.secondaryModel.queryFnGroupedByEmne
      }
    };
  }

  /**
   * Mix two entity arrays into unified view
   */
  combineEntities(primaryEntities = [], secondaryEntities = []) {
    const combined = [
      ...primaryEntities.map(entity => ({
        ...entity,
        entityType: this.config.primaryModel.modelPrintName,
        _typeWeight: this.config.mixingRules.typeWeights[this.config.primaryModel.modelPrintName] || 1
      })),
      ...secondaryEntities.map(entity => ({
        ...entity,
        entityType: this.config.secondaryModel.modelPrintName,
        _typeWeight: this.config.mixingRules.typeWeights[this.config.secondaryModel.modelPrintName] || 2
      }))
    ];

    return this.sortCombinedEntities(combined);
  }

  /**
   * Sort combined entities using mixing rules
   */
  sortCombinedEntities(entities, sortBy = null, sortOrder = null) {
    const actualSortBy = sortBy || this.config.mixingRules.defaultSort;
    const actualSortOrder = sortOrder || this.config.mixingRules.defaultSortOrder;

    return entities.sort((a, b) => {
      let comparison = 0;

      switch (actualSortBy) {
        case 'entityType':
          comparison = a._typeWeight - b._typeWeight;
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'updatedAt':
        case 'createdAt':
          const aDate = new Date(a[actualSortBy] || 0);
          const bDate = new Date(b[actualSortBy] || 0);
          comparison = aDate - bDate;
          break;
        default:
          comparison = String(a[actualSortBy] || '').localeCompare(String(b[actualSortBy] || ''));
      }

      return actualSortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Filter combined entities across both types
   */
  filterCombinedEntities(entities, filters = {}) {
    return entities.filter(entity => {
      // Entity type filter
      if (filters.entityType && filters.entityType !== 'all') {
        if (entity.entityType !== filters.entityType) {
          return false;
        }
      }

      // Cross-type text search
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = this.config.mixingRules.searchFields
          .map(field => entity[field] || '')
          .join(' ')
          .toLowerCase();
          
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Common field filters (status, vurdering, emne)
      const commonFilters = ['status', 'vurdering', 'emne'];
      for (const filterKey of commonFilters) {
        if (filters[filterKey] && filters[filterKey] !== 'all') {
          const entityValue = entity[filterKey]?.name || entity[filterKey]?.navn || '';
          if (entityValue !== filters[filterKey]) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Extract available filter values from combined entities
   */
  extractAvailableFilters(entities = []) {
    const filters = {
      entityTypes: new Set(),
      statuses: new Set(),
      vurderinger: new Set(),
      emner: new Set()
    };

    entities.forEach(entity => {
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
      emner: Array.from(filters.emner).sort()
    };
  }

  /**
   * Load data for both entity types and combine them
   */
  async loadData(queryParams = {}) {
    try {
      const queryFunctions = this.getQueryFunctions();
      
      // Load data from both primary and secondary models
      const [primaryData, secondaryData] = await Promise.all([
        queryFunctions.primary.grouped(queryParams),
        queryFunctions.secondary.grouped(queryParams)
      ]);

      // Extract actual data from Axios responses
      const primaryRawData = primaryData.data || primaryData;
      const secondaryRawData = secondaryData.data || secondaryData;
      
      // Transform both responses (assuming grouped format)
      const primaryItems = this.extractItemsFromGroupedResponse(primaryRawData);
      const secondaryItems = this.extractItemsFromGroupedResponse(secondaryRawData);
      
      // Combine the entities
      const combinedItems = this.combineEntities(primaryItems, secondaryItems);
      
      // Return in standard format
      return {
        items: combinedItems,
        total: combinedItems.length,
        page: queryParams.page || 1,
        pageSize: queryParams.pageSize || 50,
        totalPages: Math.ceil(combinedItems.length / (queryParams.pageSize || 50)),
        hasNextPage: false,
        hasPreviousPage: false
      };
      
    } catch (error) {
      console.error('KravTiltakCombinedDTO: Load data error:', error);
      throw error;
    }
  }

  /**
   * Extract items from grouped response format
   */
  extractItemsFromGroupedResponse(rawData) {
    if (!rawData?.items) return [];
    
    const allItems = [];
    rawData.items.forEach(group => {
      // Extract entities from all possible entity arrays in the group
      const entityKeys = ['entities', 'krav', 'tiltak', 'prosjektkrav', 'prosjekttiltak'];
      
      entityKeys.forEach(key => {
        if (group[key] && Array.isArray(group[key])) {
          group[key].forEach(entity => {
            // Add emne information to each entity
            if (group.emne) {
              entity.emne = group.emne;
              entity._emneId = group.emne.id;
              entity._emneName = group.emne.navn || group.emne.name;
            }
            allItems.push(entity);
          });
        }
      });
    });
    
    return allItems;
  }

  /**
   * Get debug information for troubleshooting
   */
  getDebugInfo() {
    return {
      dto: 'CombinedEntityDTO',
      config: this.config,
      models: {
        primary: this.config.primaryModel.modelPrintName,
        secondary: this.config.secondaryModel.modelPrintName
      }
    };
  }

  /**
   * Get mixing rules (implementing CombinedEntityContract)
   */
  getMixingRules() {
    return this.config.mixingRules;
  }
}

/**
 * Factory function for creating KravTiltakCombinedDTO
 */
export const createKravTiltakCombinedDTO = (primaryModel, secondaryModel, options = {}) => {
  return new KravTiltakCombinedDTO(primaryModel, secondaryModel, options);
};

export default KravTiltakCombinedDTO;