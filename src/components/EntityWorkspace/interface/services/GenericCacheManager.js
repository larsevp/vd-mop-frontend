/**
 * Generic Cache Manager Interface
 * 
 * Bridges GenericCacheService patterns with actual React Query queryClient.
 * Provides concrete cache invalidation, optimistic updates, and prefetching.
 */

import { createGenericCacheService } from './GenericCacheService.js';
import { createEntityInterface } from '../utils/EntityInterface.js';

export class GenericCacheManager {
  constructor(entityType, queryClient, config = {}) {
    this.entityType = entityType;
    this.queryClient = queryClient;
    this.cacheService = createGenericCacheService(entityType, config);
    this.entityInterface = createEntityInterface(entityType, config);
    this.config = config;
  }

  /**
   * Invalidate cache using patterns from GenericCacheService
   */
  async invalidateByPattern(operation, data = null) {
    if (!this.queryClient) {
      console.warn('GenericCacheManager: No queryClient available for invalidation');
      return;
    }

    const patterns = this.cacheService.getInvalidationPatterns(operation, data);
    
    const invalidationPromises = patterns.map(pattern => 
      this.queryClient.invalidateQueries({ 
        queryKey: pattern,
        exact: false // Allow partial matching
      })
    );

    await Promise.all(invalidationPromises);
    
    // Debug logging
    if (this.config.debug) {
      console.log(`GenericCacheManager[${this.entityType}]: Invalidated ${patterns.length} patterns for ${operation}`, patterns);
    }
  }

  /**
   * Invalidate specific cache key
   */
  async invalidateKey(queryKey, options = {}) {
    if (!this.queryClient) {
      console.warn('GenericCacheManager: No queryClient available for invalidation');
      return;
    }

    await this.queryClient.invalidateQueries({
      queryKey,
      exact: options.exact ?? false,
      refetchType: options.refetchType ?? 'active'
    });

    if (this.config.debug) {
      console.log(`GenericCacheManager[${this.entityType}]: Invalidated key`, queryKey);
    }
  }

  /**
   * Apply optimistic update using GenericCacheService patterns
   */
  async applyOptimisticUpdate(operation, data, options = {}) {
    if (!this.queryClient || !data) {
      return null;
    }

    const updates = this.cacheService.createOptimisticUpdates(operation, data);
    const rollbacks = [];

    try {
      // Apply all optimistic updates
      for (const update of updates) {
        const previousData = this.queryClient.getQueryData(update.queryKey);
        rollbacks.push({ queryKey: update.queryKey, data: previousData });

        this.queryClient.setQueryData(update.queryKey, update.updater);
        
        if (this.config.debug) {
          console.log(`GenericCacheManager[${this.entityType}]: Applied optimistic update`, update.queryKey);
        }
      }

      // Return rollback function
      return {
        rollback: () => this.rollbackOptimisticUpdates(rollbacks),
        commit: () => this.invalidateByPattern(operation, data)
      };
      
    } catch (error) {
      // Auto-rollback on error
      this.rollbackOptimisticUpdates(rollbacks);
      throw error;
    }
  }

  /**
   * Rollback optimistic updates
   */
  rollbackOptimisticUpdates(rollbacks) {
    if (!this.queryClient || !rollbacks) return;

    rollbacks.forEach(({ queryKey, data }) => {
      this.queryClient.setQueryData(queryKey, data);
      
      if (this.config.debug) {
        console.log(`GenericCacheManager[${this.entityType}]: Rolled back optimistic update`, queryKey);
      }
    });
  }

  /**
   * Prefetch data using cache service configuration
   */
  async prefetch(operation, params = {}, options = {}) {
    if (!this.queryClient) return;

    const queryKey = this.cacheService.generateCacheKey(operation, params);
    const cacheConfig = this.cacheService.createCacheConfig(operation, options);

    // Build query function - would need to be provided by implementation
    const queryFn = options.queryFn || (() => {
      throw new Error(`GenericCacheManager: No queryFn provided for ${operation} prefetch`);
    });

    try {
      await this.queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: cacheConfig.staleTime,
        cacheTime: cacheConfig.cacheTime
      });
      
      if (this.config.debug) {
        console.log(`GenericCacheManager[${this.entityType}]: Prefetched`, queryKey);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error(`GenericCacheManager[${this.entityType}]: Prefetch failed`, queryKey, error);
      }
    }
  }

  /**
   * Get cached data
   */
  getCachedData(operation, params = {}) {
    if (!this.queryClient) return null;

    const queryKey = this.cacheService.generateCacheKey(operation, params);
    return this.queryClient.getQueryData(queryKey);
  }

  /**
   * Set cache data
   */
  setCachedData(operation, params = {}, data, options = {}) {
    if (!this.queryClient) return;

    const queryKey = this.cacheService.generateCacheKey(operation, params);
    
    if (options.transform && data) {
      data = this.entityInterface.transformEntityForDisplay(data);
    }

    this.queryClient.setQueryData(queryKey, data);
    
    if (this.config.debug) {
      console.log(`GenericCacheManager[${this.entityType}]: Set cache data`, queryKey);
    }
  }

  /**
   * Remove cached data
   */
  removeCachedData(operation, params = {}) {
    if (!this.queryClient) return;

    const queryKey = this.cacheService.generateCacheKey(operation, params);
    this.queryClient.removeQueries({ queryKey });
    
    if (this.config.debug) {
      console.log(`GenericCacheManager[${this.entityType}]: Removed cache data`, queryKey);
    }
  }

  /**
   * Create mutation callbacks with automatic cache handling
   */
  createMutationCallbacks(operation, options = {}) {
    return {
      onMutate: async (variables) => {
        // Apply optimistic update if enabled
        if (options.optimistic !== false) {
          const optimisticUpdate = await this.applyOptimisticUpdate(operation, variables);
          return { optimisticUpdate };
        }
        return {};
      },

      onSuccess: async (data, variables, context) => {
        // Commit optimistic update or invalidate
        if (context?.optimisticUpdate) {
          await context.optimisticUpdate.commit();
        } else {
          await this.invalidateByPattern(operation, data || variables);
        }
        
        // Call user success handler
        if (options.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },

      onError: (error, variables, context) => {
        // Rollback optimistic update
        if (context?.optimisticUpdate) {
          context.optimisticUpdate.rollback();
        }
        
        // Call user error handler
        if (options.onError) {
          options.onError(error, variables, context);
        }
      },

      onSettled: async (data, error, variables, context) => {
        // Call user settled handler
        if (options.onSettled) {
          options.onSettled(data, error, variables, context);
        }
      }
    };
  }

  /**
   * Bulk invalidation for multiple patterns
   */
  async bulkInvalidate(patterns) {
    if (!this.queryClient) return;

    const invalidationPromises = patterns.map(pattern => 
      this.queryClient.invalidateQueries({ 
        queryKey: Array.isArray(pattern) ? pattern : [pattern],
        exact: false
      })
    );

    await Promise.all(invalidationPromises);
    
    if (this.config.debug) {
      console.log(`GenericCacheManager[${this.entityType}]: Bulk invalidated ${patterns.length} patterns`);
    }
  }

  /**
   * Clear all cache for entity type
   */
  async clearEntityCache() {
    if (!this.queryClient) return;

    await this.queryClient.removeQueries({ 
      queryKey: [this.entityType],
      exact: false 
    });
    
    if (this.config.debug) {
      console.log(`GenericCacheManager[${this.entityType}]: Cleared all entity cache`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    if (!this.queryClient) return null;

    const queryCache = this.queryClient.getQueryCache();
    const queries = queryCache.findAll({ queryKey: [this.entityType] });
    
    return {
      entityType: this.entityType,
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.isActive()).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
      queries: queries.map(q => ({
        queryKey: q.queryKey,
        state: q.state,
        dataUpdatedAt: q.state.dataUpdatedAt,
        lastFetchedAt: q.state.lastFetchedAt
      }))
    };
  }

  /**
   * Subscribe to cache changes for debugging
   */
  subscribeToCacheChanges(callback) {
    if (!this.queryClient) return () => {};

    return this.queryClient.getQueryCache().subscribe(event => {
      // Filter to only entity-relevant changes
      if (event.query?.queryKey?.[0] === this.entityType) {
        callback({
          type: event.type,
          queryKey: event.query.queryKey,
          state: event.query.state,
          entityType: this.entityType
        });
      }
    });
  }
}

/**
 * Factory function for creating GenericCacheManager instances
 */
export const createGenericCacheManager = (entityType, queryClient, config = {}) => {
  return new GenericCacheManager(entityType, queryClient, config);
};

/**
 * Pre-configured cache managers for common entity types
 */
export const createTiltakCacheManager = (queryClient, config = {}) => {
  return new GenericCacheManager('tiltak', queryClient, config);
};

export const createKravCacheManager = (queryClient, config = {}) => {
  return new GenericCacheManager('krav', queryClient, config);
};

export const createProsjektTiltakCacheManager = (queryClient, config = {}) => {
  return new GenericCacheManager('prosjektTiltak', queryClient, config);
};

export const createProsjektKravCacheManager = (queryClient, config = {}) => {
  return new GenericCacheManager('prosjektKrav', queryClient, config);
};

export default GenericCacheManager;