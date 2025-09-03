/**
 * Generic Cache Service Interface
 * 
 * Provides adapter-aware caching utilities for entity workspaces.
 * Handles cache key generation, invalidation patterns, and data consistency.
 */

import { createEntityInterface } from '../utils/EntityInterface.js';

export class GenericCacheService {
  constructor(entityType, config = {}) {
    this.entityInterface = createEntityInterface(entityType, config);
    this.entityType = entityType;
    this.config = config;
    
    // Cache configuration
    this.cacheConfig = {
      defaultStaleTime: 30000, // 30 seconds
      defaultCacheTime: 600000, // 10 minutes
      backgroundRefetchInterval: 120000, // 2 minutes
      ...config.cacheConfig
    };
  }

  /**
   * Generate cache keys using adapter for consistent naming
   */
  generateCacheKey(operation, params = {}) {
    const baseKey = [this.entityType];
    
    switch (operation) {
      case 'list':
      case 'workspace':
        baseKey.push('workspace');
        baseKey.push(this.entityInterface.supportsGroupByEmne() ? 'grouped' : 'paginated');
        
        // Add query parameters that affect results
        const queryParams = this.normalizeQueryParams(params);
        if (Object.keys(queryParams).length > 0) {
          baseKey.push(queryParams);
        }
        break;
        
      case 'detail':
        baseKey.push('detail');
        if (params.entityId) {
          baseKey.push(params.entityId);
        }
        break;
        
      case 'search':
        baseKey.push('search');
        if (params.searchQuery) {
          baseKey.push(params.searchQuery);
        }
        break;
        
      case 'filters':
        baseKey.push('filters');
        baseKey.push('available');
        break;
        
      case 'stats':
        baseKey.push('stats');
        break;
        
      default:
        baseKey.push(operation);
    }
    
    return baseKey;
  }

  /**
   * Normalize query parameters for consistent cache keys
   */
  normalizeQueryParams(params) {
    const normalized = {};
    
    // Standard pagination parameters
    if (params.page && params.page !== 1) {
      normalized.page = params.page;
    }
    if (params.pageSize && params.pageSize !== 50) {
      normalized.pageSize = params.pageSize;
    }
    
    // Sort parameters
    if (params.sortBy) {
      normalized.sortBy = params.sortBy;
    }
    if (params.sortOrder && params.sortOrder !== 'asc') {
      normalized.sortOrder = params.sortOrder;
    }
    
    // Search parameters
    if (params.searchQuery) {
      normalized.search = params.searchQuery;
    }
    
    // Filter parameters
    if (params.filterBy && params.filterBy !== 'all') {
      normalized.filterBy = params.filterBy;
    }
    
    // Additional filters (remove empty values)
    if (params.additionalFilters) {
      const cleanFilters = this.cleanFilters(params.additionalFilters);
      if (Object.keys(cleanFilters).length > 0) {
        normalized.filters = cleanFilters;
      }
    }
    
    // Project context
    if (params.projectId) {
      normalized.projectId = params.projectId;
    }
    
    return normalized;
  }

  /**
   * Clean filter object by removing empty/null values
   */
  cleanFilters(filters) {
    const cleaned = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'all') {
        cleaned[key] = value;
      }
    });
    
    return cleaned;
  }

  /**
   * Generate invalidation patterns for cache updates
   */
  getInvalidationPatterns(operation, data = null) {
    const patterns = [];
    
    switch (operation) {
      case 'create':
      case 'update':
      case 'delete':
        // Invalidate all list queries for this entity type
        patterns.push([this.entityType, 'workspace']);
        
        // Invalidate search queries
        patterns.push([this.entityType, 'search']);
        
        // Invalidate stats
        patterns.push([this.entityType, 'stats']);
        
        // Invalidate available filters
        patterns.push([this.entityType, 'filters']);
        
        // If updating/deleting, invalidate specific detail cache
        if ((operation === 'update' || operation === 'delete') && data?.id) {
          patterns.push([this.entityType, 'detail', data.id]);
        }
        
        // If entity has relationships, invalidate related caches
        if (data) {
          patterns.push(...this.getRelatedInvalidationPatterns(data));
        }
        
        break;
        
      case 'bulk_update':
      case 'bulk_delete':
        // Invalidate everything for bulk operations
        patterns.push([this.entityType]);
        break;
        
      default:
        // Default to invalidating workspace queries
        patterns.push([this.entityType, 'workspace']);
    }
    
    return patterns;
  }

  /**
   * Get invalidation patterns for related entities
   */
  getRelatedInvalidationPatterns(data) {
    const patterns = [];
    
    // If entity has parent/children relationships
    if (data.parentId) {
      patterns.push([this.entityType, 'detail', data.parentId]);
    }
    
    // If entity has cross-relationships (krav <-> tiltak)
    const relationships = this.entityInterface.adapter.normalizeRelationshipArray(
      data.krav || [], 'krav'
    ).concat(
      this.entityInterface.adapter.normalizeRelationshipArray(data.tiltak || [], 'tiltak')
    );
    
    relationships.forEach(related => {
      if (related.entityType && related.id) {
        patterns.push([related.entityType, 'detail', related.id]);
        patterns.push([related.entityType, 'workspace']);
      }
    });
    
    // If entity belongs to project, invalidate project-specific caches
    if (data.projectId) {
      const projectEntityType = this.entityType.startsWith('prosjekt') 
        ? this.entityType 
        : `prosjekt${this.entityType.charAt(0).toUpperCase() + this.entityType.slice(1)}`;
        
      patterns.push([projectEntityType, 'workspace']);
    }
    
    return patterns;
  }

  /**
   * Create cache configuration for React Query
   */
  createCacheConfig(operation, options = {}) {
    const baseConfig = {
      staleTime: this.cacheConfig.defaultStaleTime,
      cacheTime: this.cacheConfig.defaultCacheTime,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    };
    
    // Operation-specific configurations
    switch (operation) {
      case 'list':
      case 'workspace':
        return {
          ...baseConfig,
          staleTime: options.staleTime || this.cacheConfig.defaultStaleTime,
          refetchInterval: options.backgroundRefresh 
            ? this.cacheConfig.backgroundRefetchInterval 
            : false,
          keepPreviousData: true // For pagination
        };
        
      case 'detail':
        return {
          ...baseConfig,
          staleTime: options.staleTime || 60000, // 1 minute for details
          cacheTime: options.cacheTime || 1200000 // 20 minutes for details
        };
        
      case 'search':
        return {
          ...baseConfig,
          staleTime: 0, // Always fresh for search
          cacheTime: 300000 // 5 minutes for search results
        };
        
      case 'stats':
        return {
          ...baseConfig,
          staleTime: options.staleTime || 60000, // 1 minute for stats
          cacheTime: 300000 // 5 minutes for stats
        };
        
      default:
        return baseConfig;
    }
  }

  /**
   * Helper to check if cache key matches invalidation pattern
   */
  matchesCachePattern(cacheKey, pattern) {
    if (!Array.isArray(cacheKey) || !Array.isArray(pattern)) {
      return false;
    }
    
    // Pattern must be subset of cache key
    if (pattern.length > cacheKey.length) {
      return false;
    }
    
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] !== cacheKey[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Create optimistic update helpers
   */
  createOptimisticUpdates(operation, data) {
    const updates = [];
    
    // Guard against null/undefined data
    if (!data) {
      return updates;
    }
    
    switch (operation) {
      case 'create':
        // Add to list caches
        updates.push({
          queryKey: [this.entityType, 'workspace'],
          updater: (old) => {
            if (!old?.items) return old;
            
            // Transform new data using adapter
            const transformed = this.entityInterface.transformEntityForDisplay(data);
            
            return {
              ...old,
              items: [transformed, ...old.items],
              total: (old.total || 0) + 1
            };
          }
        });
        break;
        
      case 'update':
        // Update in list caches
        updates.push({
          queryKey: [this.entityType, 'workspace'],
          updater: (old) => {
            if (!old?.items || !data?.id) return old;
            
            const transformed = this.entityInterface.transformEntityForDisplay(data);
            
            return {
              ...old,
              items: old.items.map(item => 
                item.id === data.id ? { ...item, ...transformed } : item
              )
            };
          }
        });
        
        // Update detail cache
        if (data?.id) {
          updates.push({
            queryKey: [this.entityType, 'detail', data.id],
            updater: () => this.entityInterface.transformEntityForDisplay(data)
          });
        }
        break;
        
      case 'delete':
        // Remove from list caches
        updates.push({
          queryKey: [this.entityType, 'workspace'],
          updater: (old) => {
            if (!old?.items || !data?.id) return old;
            
            return {
              ...old,
              items: old.items.filter(item => item.id !== data.id),
              total: Math.max((old.total || 0) - 1, 0)
            };
          }
        });
        
        // Remove detail cache
        if (data?.id) {
          updates.push({
            queryKey: [this.entityType, 'detail', data.id],
            updater: () => null
          });
        }
        break;
    }
    
    return updates;
  }

  /**
   * Get entity type display name for cache debugging
   */
  getCacheDebugInfo() {
    return {
      entityType: this.entityType,
      displayName: this.entityInterface.adapter.getDisplayName(this.entityType),
      supportsGrouping: this.entityInterface.supportsGroupByEmne(),
      cacheConfig: this.cacheConfig
    };
  }
}

/**
 * Factory function for creating GenericCacheService instances
 */
export const createGenericCacheService = (entityType, config = {}) => {
  return new GenericCacheService(entityType, config);
};

/**
 * Pre-configured cache services for common entity types
 */
export const createTiltakCacheService = (config = {}) => {
  return new GenericCacheService('tiltak', config);
};

export const createKravCacheService = (config = {}) => {
  return new GenericCacheService('krav', config);
};

export const createProsjektTiltakCacheService = (config = {}) => {
  return new GenericCacheService('prosjektTiltak', config);
};

export const createProsjektKravCacheService = (config = {}) => {
  return new GenericCacheService('prosjektKrav', config);
};

export default GenericCacheService;