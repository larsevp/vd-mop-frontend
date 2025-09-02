/**
 * Generic Sort Manager Interface
 * 
 * Provides standardized sorting utilities for entity workspaces.
 * Uses adapter pattern for entity-specific sorting logic while maintaining a unified interface.
 */

import { createEntityInterface } from './EntityInterface.js';

export class GenericSortManager {
  constructor(entityType, config = {}) {
    this.entityInterface = createEntityInterface(entityType, config);
    this.entityType = entityType;
  }

  /**
   * Get available sort options for the entity type
   */
  getSortOptions() {
    return this.entityInterface.adapter.getSortOptions(this.entityType);
  }

  /**
   * Get sort field label for display
   */
  getSortFieldLabel(sortBy) {
    const sortOptions = this.getSortOptions();
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : sortBy;
  }

  /**
   * Validate sort field
   */
  isValidSortField(sortBy) {
    const sortOptions = this.getSortOptions();
    return sortOptions.some(opt => opt.value === sortBy);
  }

  /**
   * Get default sort options for entity type
   */
  getDefaultSort() {
    const sortOptions = this.getSortOptions();
    
    // Priority order for default sort
    const preferredDefaults = ['updatedAt', 'createdAt', 'title', 'tittel', 'id'];
    
    for (const preferred of preferredDefaults) {
      const option = sortOptions.find(opt => opt.value === preferred);
      if (option) {
        return {
          sortBy: option.value,
          sortOrder: preferred === 'title' || preferred === 'tittel' ? 'asc' : 'desc'
        };
      }
    }
    
    // Fallback to first available option
    if (sortOptions.length > 0) {
      return {
        sortBy: sortOptions[0].value,
        sortOrder: 'asc'
      };
    }
    
    return {
      sortBy: 'id',
      sortOrder: 'desc'
    };
  }

  /**
   * Apply sorting to items using EntityInterface
   */
  applySorting(items, sortBy, sortOrder = 'asc') {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    // Validate sort field
    if (!this.isValidSortField(sortBy)) {
      console.warn(`Invalid sort field "${sortBy}" for entity type "${this.entityType}". Using default.`);
      const defaultSort = this.getDefaultSort();
      sortBy = defaultSort.sortBy;
      sortOrder = defaultSort.sortOrder;
    }

    return this.performSort(items, sortBy, sortOrder);
  }

  /**
   * Perform the actual sorting with comprehensive field handling
   */
  performSort(items, sortBy, sortOrder = 'asc') {
    const sortedItems = [...items].sort((a, b) => {
      const aTransformed = this.entityInterface.transformEntityForDisplay(a);
      const bTransformed = this.entityInterface.transformEntityForDisplay(b);

      let aValue, bValue;

      // Get sort values using transformed entities and comprehensive field mapping
      switch (sortBy) {
        // Title fields
        case 'title':
        case 'tittel':
        case 'navn':
          aValue = aTransformed?.title || '';
          bValue = bTransformed?.title || '';
          break;
        
        // UID fields
        case 'uid':
        case 'kravUID':
        case 'tiltakUID':
        case 'prosjektKravUID':
        case 'prosjektTiltakUID':
          aValue = aTransformed?.uid || '';
          bValue = bTransformed?.uid || '';
          break;
        
        // Status fields
        case 'status':
          aValue = aTransformed?.status?.name || aTransformed?.status?.navn || '';
          bValue = bTransformed?.status?.name || bTransformed?.status?.navn || '';
          break;
        
        // Vurdering fields
        case 'vurdering':
          aValue = aTransformed?.vurdering?.name || aTransformed?.vurdering?.navn || '';
          bValue = bTransformed?.vurdering?.name || bTransformed?.vurdering?.navn || '';
          break;
        
        // Emne fields
        case 'emne':
          aValue = aTransformed?.emne?.title || aTransformed?.emne?.tittel || '';
          bValue = bTransformed?.emne?.title || bTransformed?.emne?.tittel || '';
          break;
        
        // Numeric fields
        case 'prioritet':
        case 'priority':
          aValue = aTransformed?.prioritet || 0;
          bValue = bTransformed?.prioritet || 0;
          break;
        
        case 'id':
          aValue = a.id || 0;
          bValue = b.id || 0;
          break;
        
        // Date fields
        case 'createdAt':
        case 'updatedAt':
          aValue = new Date(a[sortBy] || 0);
          bValue = new Date(b[sortBy] || 0);
          break;
        
        // Boolean fields
        case 'obligatorisk':
          aValue = Boolean(aTransformed?.obligatorisk);
          bValue = Boolean(bTransformed?.obligatorisk);
          break;
        
        // Description fields
        case 'beskrivelse':
        case 'description':
          aValue = aTransformed?.description || '';
          bValue = bTransformed?.description || '';
          break;
        
        default:
          // Try to get value directly from transformed entity
          aValue = aTransformed?.[sortBy] || '';
          bValue = bTransformed?.[sortBy] || '';
      }

      return this.compareValues(aValue, bValue, sortOrder);
    });

    return sortedItems;
  }

  /**
   * Compare values with proper type handling
   */
  compareValues(aValue, bValue, sortOrder) {
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
    if (bValue == null) return sortOrder === 'asc' ? 1 : -1;

    // Handle Date objects
    if (aValue instanceof Date && bValue instanceof Date) {
      const diff = aValue.getTime() - bValue.getTime();
      return sortOrder === 'asc' ? diff : -diff;
    }

    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle booleans
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      if (aValue === bValue) return 0;
      if (sortOrder === 'asc') {
        return aValue ? 1 : -1;
      } else {
        return aValue ? -1 : 1;
      }
    }

    // Handle strings (default case)
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    const comparison = aStr.localeCompare(bStr, 'no');
    return sortOrder === 'asc' ? comparison : -comparison;
  }

  /**
   * Create sort configuration object for UI components
   */
  createSortConfig(currentSortBy, currentSortOrder) {
    const sortOptions = this.getSortOptions();
    const defaultSort = this.getDefaultSort();
    
    return {
      sortBy: currentSortBy || defaultSort.sortBy,
      sortOrder: currentSortOrder || defaultSort.sortOrder,
      availableOptions: sortOptions,
      isValidSort: this.isValidSortField(currentSortBy || defaultSort.sortBy),
      currentLabel: this.getSortFieldLabel(currentSortBy || defaultSort.sortBy)
    };
  }

  /**
   * Toggle sort order for a field
   */
  toggleSortOrder(currentSortBy, targetSortBy, currentSortOrder) {
    if (currentSortBy === targetSortBy) {
      // Same field - toggle order
      return currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Different field - use default order for new field
      const fieldDefaults = {
        'title': 'asc',
        'tittel': 'asc',
        'navn': 'asc',
        'uid': 'asc',
        'kravUID': 'asc',
        'tiltakUID': 'asc',
        'status': 'asc',
        'vurdering': 'asc',
        'emne': 'asc',
        'prioritet': 'desc',
        'id': 'desc',
        'createdAt': 'desc',
        'updatedAt': 'desc'
      };
      
      return fieldDefaults[targetSortBy] || 'asc';
    }
  }

  /**
   * Get sort direction indicator for UI
   */
  getSortIndicator(fieldName, currentSortBy, currentSortOrder) {
    if (fieldName !== currentSortBy) {
      return '';
    }
    
    return currentSortOrder === 'asc' ? '↑' : '↓';
  }

  /**
   * Multi-level sorting support
   */
  applyMultiSort(items, sortConfigs) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    if (!Array.isArray(sortConfigs) || sortConfigs.length === 0) {
      return items;
    }

    return [...items].sort((a, b) => {
      for (const { sortBy, sortOrder } of sortConfigs) {
        const aTransformed = this.entityInterface.transformEntityForDisplay(a);
        const bTransformed = this.entityInterface.transformEntityForDisplay(b);
        
        const aValue = this.getFieldValue(aTransformed, a, sortBy);
        const bValue = this.getFieldValue(bTransformed, b, sortBy);
        
        const comparison = this.compareValues(aValue, bValue, sortOrder);
        
        if (comparison !== 0) {
          return comparison;
        }
        // Continue to next sort level if values are equal
      }
      
      return 0;
    });
  }

  /**
   * Helper to get field value for multi-sort
   */
  getFieldValue(transformedEntity, originalEntity, fieldName) {
    switch (fieldName) {
      case 'title':
      case 'tittel':
      case 'navn':
        return transformedEntity?.title || '';
      case 'uid':
      case 'kravUID':
      case 'tiltakUID':
        return transformedEntity?.uid || '';
      case 'status':
        return transformedEntity?.status?.name || transformedEntity?.status?.navn || '';
      case 'vurdering':
        return transformedEntity?.vurdering?.name || transformedEntity?.vurdering?.navn || '';
      case 'emne':
        return transformedEntity?.emne?.title || transformedEntity?.emne?.tittel || '';
      case 'prioritet':
        return transformedEntity?.prioritet || 0;
      case 'id':
        return originalEntity.id || 0;
      case 'createdAt':
      case 'updatedAt':
        return new Date(originalEntity[fieldName] || 0);
      case 'obligatorisk':
        return Boolean(transformedEntity?.obligatorisk);
      case 'beskrivelse':
      case 'description':
        return transformedEntity?.description || '';
      default:
        return transformedEntity?.[fieldName] || '';
    }
  }
}

/**
 * Factory function for creating GenericSortManager instances
 */
export const createGenericSortManager = (entityType, config = {}) => {
  return new GenericSortManager(entityType, config);
};

export default GenericSortManager;