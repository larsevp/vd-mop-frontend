/**
 * Generic Filter Service Interface
 * 
 * Provides standardized filtering, sorting, and data processing for entity workspaces.
 * Uses adapter pattern for entity-specific logic while maintaining a unified interface.
 */

import { createEntityInterface } from '../utils/EntityInterface.js';

export class GenericFilterService {
  constructor(entityType, config = {}) {
    this.entityInterface = createEntityInterface(entityType, config);
    this.entityType = entityType;
  }

  /**
   * Apply filters to entity collection using adapter
   */
  applyFilters(items, filters = {}, additionalOptions = {}) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    // Handle null/undefined filters
    const safeFilters = filters || {};
    let filteredItems = [...items];

    // Apply basic filter (all, active, completed, etc.)
    if (safeFilters.filterBy && safeFilters.filterBy !== 'all') {
      filteredItems = this.applyBasicFilter(filteredItems, safeFilters.filterBy);
    }

    // Apply status filter
    if (safeFilters.status && safeFilters.status !== '') {
      filteredItems = filteredItems.filter(item => {
        const transformedItem = this.entityInterface.transformEntityForDisplay(item);
        const statusName = transformedItem?.status?.name || transformedItem?.status?.navn;
        return statusName === safeFilters.status;
      });
    }

    // Apply vurdering filter
    if (safeFilters.vurdering && safeFilters.vurdering !== '') {
      filteredItems = filteredItems.filter(item => {
        const transformedItem = this.entityInterface.transformEntityForDisplay(item);
        const vurderingName = transformedItem?.vurdering?.name || transformedItem?.vurdering?.navn;
        return vurderingName === safeFilters.vurdering;
      });
    }

    // Apply emne filter
    if (safeFilters.emne && safeFilters.emne !== '') {
      filteredItems = filteredItems.filter(item => {
        const transformedItem = this.entityInterface.transformEntityForDisplay(item);
        const emneTitle = transformedItem?.emne?.title || transformedItem?.emne?.tittel;
        return emneTitle === safeFilters.emne;
      });
    }

    // Apply prioritet filter
    if (safeFilters.prioritet !== undefined && safeFilters.prioritet !== null && safeFilters.prioritet !== '') {
      filteredItems = filteredItems.filter(item => {
        const transformedItem = this.entityInterface.transformEntityForDisplay(item);
        return transformedItem?.prioritet === parseInt(safeFilters.prioritet);
      });
    }

    // Apply obligatorisk filter
    if (safeFilters.obligatorisk !== undefined) {
      filteredItems = filteredItems.filter(item => {
        const transformedItem = this.entityInterface.transformEntityForDisplay(item);
        return Boolean(transformedItem?.obligatorisk) === Boolean(safeFilters.obligatorisk);
      });
    }

    return filteredItems;
  }

  /**
   * Apply basic filter categories
   */
  applyBasicFilter(items, filterType) {
    switch (filterType) {
      case 'active':
        return items.filter(item => {
          const transformedItem = this.entityInterface.transformEntityForDisplay(item);
          const statusName = (transformedItem?.status?.name || transformedItem?.status?.navn || '').toLowerCase();
          return !['ferdig', 'completed', 'done', 'avsluttet'].includes(statusName);
        });
      
      case 'completed':
        return items.filter(item => {
          const transformedItem = this.entityInterface.transformEntityForDisplay(item);
          const statusName = (transformedItem?.status?.name || transformedItem?.status?.navn || '').toLowerCase();
          return ['ferdig', 'completed', 'done', 'avsluttet'].includes(statusName);
        });
      
      case 'pending':
        return items.filter(item => {
          const transformedItem = this.entityInterface.transformEntityForDisplay(item);
          const statusName = (transformedItem?.status?.name || transformedItem?.status?.navn || '').toLowerCase();
          return ['venter', 'pending', 'waiting', 'på hold'].includes(statusName);
        });
      
      case 'obligatorisk':
        return items.filter(item => {
          const transformedItem = this.entityInterface.transformEntityForDisplay(item);
          return Boolean(transformedItem?.obligatorisk);
        });
      
      case 'optional':
        return items.filter(item => {
          const transformedItem = this.entityInterface.transformEntityForDisplay(item);
          return !Boolean(transformedItem?.obligatorisk);
        });
      
      default:
        return items;
    }
  }

  /**
   * Apply search filter using adapter
   */
  applySearch(items, searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') {
      return items;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return items.filter(item => {
      const transformedItem = this.entityInterface.transformEntityForDisplay(item);
      
      if (!transformedItem) return false;

      // Search in title
      if (transformedItem.title?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in UID
      if (transformedItem.uid?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in description
      if (transformedItem.description?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in status
      const statusText = transformedItem.status?.name || transformedItem.status?.navn || '';
      if (statusText.toLowerCase().includes(query)) {
        return true;
      }

      // Search in vurdering
      const vurderingText = transformedItem.vurdering?.name || transformedItem.vurdering?.navn || '';
      if (vurderingText.toLowerCase().includes(query)) {
        return true;
      }

      // Search in emne
      const emneText = transformedItem.emne?.title || transformedItem.emne?.tittel || '';
      if (emneText.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Extract available filter options from entity collection using adapter
   */
  extractAvailableFilters(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        statuses: [],
        vurderinger: [],
        emner: [],
        priorities: []
      };
    }

    // Transform all items first
    const transformedItems = items
      .map(item => this.entityInterface.transformEntityForDisplay(item))
      .filter(Boolean);

    // Use adapter's extractAvailableFilters method
    return this.entityInterface.adapter.extractAvailableFilters(transformedItems);
  }

  /**
   * Calculate statistics for filtered items
   */
  calculateStats(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        total: 0,
        obligatorisk: 0,
        optional: 0,
        active: 0,
        completed: 0,
        pending: 0
      };
    }

    const transformedItems = items
      .map(item => this.entityInterface.transformEntityForDisplay(item))
      .filter(Boolean);

    const stats = {
      total: transformedItems.length,
      obligatorisk: 0,
      optional: 0,
      active: 0,
      completed: 0,
      pending: 0
    };

    transformedItems.forEach(item => {
      // Count obligatorisk vs optional
      if (Boolean(item.obligatorisk)) {
        stats.obligatorisk++;
      } else {
        stats.optional++;
      }

      // Count by status category
      const statusName = (item.status?.name || item.status?.navn || '').toLowerCase();
      
      if (['ferdig', 'completed', 'done', 'avsluttet'].includes(statusName)) {
        stats.completed++;
      } else if (['venter', 'pending', 'waiting', 'på hold'].includes(statusName)) {
        stats.pending++;
      } else {
        stats.active++;
      }
    });

    return stats;
  }

  /**
   * Sort items using adapter-based field resolution
   */
  applySorting(items, sortBy, sortOrder = 'asc') {
    if (!Array.isArray(items) || items.length === 0) {
      return items;
    }

    const sortedItems = [...items].sort((a, b) => {
      const aTransformed = this.entityInterface.transformEntityForDisplay(a);
      const bTransformed = this.entityInterface.transformEntityForDisplay(b);

      let aValue, bValue;

      // Get sort values using transformed entities
      switch (sortBy) {
        case 'title':
        case 'tittel':
          aValue = aTransformed?.title || '';
          bValue = bTransformed?.title || '';
          break;
        
        case 'uid':
        case 'kravUID':
        case 'tiltakUID':
          aValue = aTransformed?.uid || '';
          bValue = bTransformed?.uid || '';
          break;
        
        case 'status':
          aValue = aTransformed?.status?.name || aTransformed?.status?.navn || '';
          bValue = bTransformed?.status?.name || bTransformed?.status?.navn || '';
          break;
        
        case 'vurdering':
          aValue = aTransformed?.vurdering?.name || aTransformed?.vurdering?.navn || '';
          bValue = bTransformed?.vurdering?.name || bTransformed?.vurdering?.navn || '';
          break;
        
        case 'emne':
          aValue = aTransformed?.emne?.title || aTransformed?.emne?.tittel || '';
          bValue = bTransformed?.emne?.title || bTransformed?.emne?.tittel || '';
          break;
        
        case 'prioritet':
          aValue = aTransformed?.prioritet || 0;
          bValue = bTransformed?.prioritet || 0;
          break;
        
        case 'createdAt':
        case 'updatedAt':
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
          break;
        
        default:
          // Default to title sorting
          aValue = aTransformed?.title || '';
          bValue = bTransformed?.title || '';
      }

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortOrder === 'asc') {
        return aStr.localeCompare(bStr, 'no');
      } else {
        return bStr.localeCompare(aStr, 'no');
      }
    });

    return sortedItems;
  }

  /**
   * Get available sort options using adapter
   */
  getSortOptions() {
    return this.entityInterface.adapter.getSortOptions(this.entityType);
  }

  /**
   * Get available filter options using adapter
   */
  getFilterOptions() {
    return this.entityInterface.adapter.getFilterOptions(this.entityType);
  }
}

/**
 * Factory function for creating GenericFilterService instances
 */
export const createGenericFilterService = (entityType, config = {}) => {
  return new GenericFilterService(entityType, config);
};

export default GenericFilterService;