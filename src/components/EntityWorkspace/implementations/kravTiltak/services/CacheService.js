/**
 * CacheService - Centralized cache invalidation and management
 * Handles complex relationships between krav, tiltak, prosjektKrav, prosjektTiltak, emne
 */

import { useQueryClient } from '@tanstack/react-query';

export class CacheService {
  static queryClient = null;

  static initialize(queryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Invalidate related caches based on entity type and operation
   */
  static async invalidateRelatedCaches(entityType, operation, entityData) {
    if (!this.queryClient) {
      console.warn('CacheService not initialized');
      return;
    }

    const invalidationMap = {
      krav: ['krav', 'emne', 'prosjektKrav'], // Krav affects emne inheritance and prosjektKrav
      tiltak: ['tiltak', 'prosjektTiltak'],
      prosjektKrav: ['prosjektKrav', 'krav', 'prosjekt'],
      prosjektTiltak: ['prosjektTiltak', 'tiltak', 'prosjekt'],
      emne: ['emne', 'krav'] // Emne changes affect krav inheritance
    };

    const cachesToInvalidate = invalidationMap[entityType] || [entityType];

    // Invalidate all related query keys
    for (const cacheType of cachesToInvalidate) {
      await this.queryClient.invalidateQueries({ 
        queryKey: [cacheType],
        exact: false // Invalidate all queries starting with this key
      });
    }

    // Special handling for inheritance-related invalidations
    if (entityType === 'krav' || entityType === 'emne') {
      await this.invalidateInheritanceCache(entityData);
    }

    // Invalidate grouped queries
    await this.invalidateGroupedQueries(entityType);
  }

  /**
   * Handle inheritance-specific cache invalidation
   */
  static async invalidateInheritanceCache(entityData) {
    // Invalidate emne hierarchy queries
    await this.queryClient.invalidateQueries({ 
      queryKey: ['emne-hierarchy'],
      exact: false 
    });

    // Invalidate grouped krav queries
    await this.queryClient.invalidateQueries({ 
      queryKey: ['krav-grouped'],
      exact: false 
    });

    // If entity has emneId, invalidate that specific emne's krav
    if (entityData?.emneId) {
      await this.queryClient.invalidateQueries({ 
        queryKey: ['krav', 'by-emne', entityData.emneId]
      });
    }

    // If entity has parentId (for emne), invalidate children
    if (entityData?.parentId) {
      await this.queryClient.invalidateQueries({ 
        queryKey: ['emne', 'children', entityData.parentId]
      });
    }
  }

  /**
   * Invalidate grouped queries (like kravGroupedByEmne)
   */
  static async invalidateGroupedQueries(entityType) {
    const groupedQueries = {
      krav: ['krav-grouped-by-emne', 'krav-by-emne'],
      tiltak: ['tiltak-grouped'],
      prosjektKrav: ['prosjekt-krav-grouped'],
      prosjektTiltak: ['prosjekt-tiltak-grouped']
    };

    const queries = groupedQueries[entityType] || [];
    for (const query of queries) {
      await this.queryClient.invalidateQueries({ 
        queryKey: [query],
        exact: false 
      });
    }
  }

  /**
   * Optimistic update with rollback capability
   */
  static async optimisticUpdate(queryKey, updater, rollbackData = null) {
    if (!this.queryClient) return;

    // Store previous data for rollback
    const previousData = this.queryClient.getQueryData(queryKey);

    // Apply optimistic update
    this.queryClient.setQueryData(queryKey, updater);

    return {
      rollback: () => {
        if (rollbackData !== null) {
          this.queryClient.setQueryData(queryKey, rollbackData);
        } else if (previousData !== undefined) {
          this.queryClient.setQueryData(queryKey, previousData);
        }
      },
      previousData
    };
  }

  /**
   * Prefetch related data for better UX
   */
  static async prefetchRelated(entityType, entityData) {
    if (!this.queryClient) return;

    // Prefetch emne data when working with krav
    if (entityType === 'krav' && entityData?.emneId) {
      await this.queryClient.prefetchQuery({
        queryKey: ['emne', entityData.emneId],
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
    }

    // Prefetch prosjekt data when working with prosjektKrav/prosjektTiltak
    if ((entityType === 'prosjektKrav' || entityType === 'prosjektTiltak') && entityData?.prosjektId) {
      await this.queryClient.prefetchQuery({
        queryKey: ['prosjekt', entityData.prosjektId],
        staleTime: 5 * 60 * 1000
      });
    }
  }

  /**
   * Clear all caches (nuclear option)
   */
  static async clearAllCaches() {
    if (!this.queryClient) return;
    await this.queryClient.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    if (!this.queryClient) return null;

    const cache = this.queryClient.getQueryCache();
    return {
      totalQueries: cache.getAll().length,
      staleQueries: cache.getAll().filter(q => q.isStale()).length,
      activeQueries: cache.getAll().filter(q => q.observers.length > 0).length
    };
  }
}

/**
 * React hook for using cache service
 */
export const useCacheService = () => {
  const queryClient = useQueryClient();

  // Initialize on first use
  if (!CacheService.queryClient) {
    CacheService.initialize(queryClient);
  }

  return {
    invalidateRelated: (entityType, operation, entityData) => 
      CacheService.invalidateRelatedCaches(entityType, operation, entityData),
    
    optimisticUpdate: (queryKey, updater, rollbackData) => 
      CacheService.optimisticUpdate(queryKey, updater, rollbackData),
    
    prefetchRelated: (entityType, entityData) => 
      CacheService.prefetchRelated(entityType, entityData),
    
    clearAll: () => CacheService.clearAllCaches(),
    
    getStats: () => CacheService.getCacheStats()
  };
};