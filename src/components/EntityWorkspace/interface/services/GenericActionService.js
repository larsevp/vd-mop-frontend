/**
 * Generic Action Service
 * 
 * Handles CRUD operations with integrated cache management, optimistic updates,
 * and permission checking for entity workspaces.
 */

import { createEntityInterface } from '../utils/EntityInterface.js';
import { createGenericCacheManager } from './GenericCacheManager.js';
import { createGenericPermissionService } from './GenericPermissionService.js';

export class GenericActionService {
  constructor(entityType, queryClient, config = {}) {
    this.entityType = entityType;
    this.queryClient = queryClient;
    this.config = {
      enableOptimistic: true,
      validatePermissions: true,
      debug: false,
      ...config
    };
    
    // Initialize services
    this.entityInterface = createEntityInterface(entityType, config);
    this.cacheManager = createGenericCacheManager(entityType, queryClient, config);
    this.permissionService = createGenericPermissionService(entityType, config);
    
    // Set user context if provided
    if (config.userContext) {
      this.permissionService.setUserContext(config.userContext);
    }
  }

  /**
   * Set user context for permission checks
   */
  setUserContext(userContext) {
    this.permissionService.setUserContext(userContext);
    return this;
  }

  /**
   * Create a new entity
   */
  async createEntity(entityData, options = {}) {
    const actionOptions = {
      enableOptimistic: this.config.enableOptimistic,
      validatePermissions: this.config.validatePermissions,
      ...options
    };

    // Permission check
    if (actionOptions.validatePermissions) {
      const hasPermission = this.permissionService.hasPermission('canCreate', {
        entity: entityData,
        ...options.context
      });
      
      if (!hasPermission) {
        throw new Error(`Permission denied: Cannot create ${this.entityInterface.adapter.getDisplayName(this.entityType)}`);
      }
    }

    // Transform entity data using adapter
    const transformedData = this.entityInterface.adapter.transformRequest(entityData);
    
    let optimisticUpdate = null;
    
    try {
      // Apply optimistic update if enabled
      if (actionOptions.enableOptimistic) {
        optimisticUpdate = await this.cacheManager.applyOptimisticUpdate('create', transformedData);
        
        if (this.config.debug) {
          console.log(`GenericActionService[${this.entityType}]: Applied optimistic create`);
        }
      }

      // Execute API call - would be replaced with actual API integration
      const apiResult = await this.executeApiCall('POST', `/api/${this.entityType}`, transformedData, options);
      
      // Transform response using adapter
      const transformedResult = this.entityInterface.adapter.transformEntity(apiResult);

      // Commit optimistic update or invalidate cache
      if (optimisticUpdate) {
        await optimisticUpdate.commit();
      } else {
        await this.cacheManager.invalidateByPattern('create', transformedResult);
      }

      if (this.config.debug) {
        console.log(`GenericActionService[${this.entityType}]: Created entity`, transformedResult.id);
      }

      // Call success callback if provided
      if (options.onSuccess) {
        options.onSuccess(transformedResult, entityData);
      }

      return {
        success: true,
        data: transformedResult,
        operation: 'create',
        optimistic: !!optimisticUpdate
      };

    } catch (error) {
      // Rollback optimistic update on error
      if (optimisticUpdate) {
        optimisticUpdate.rollback();
      }

      if (this.config.debug) {
        console.error(`GenericActionService[${this.entityType}]: Create failed`, error);
      }

      // Call error callback if provided
      if (options.onError) {
        options.onError(error, entityData);
      }

      return {
        success: false,
        error: error.message || 'Create operation failed',
        operation: 'create',
        optimistic: !!optimisticUpdate
      };
    }
  }

  /**
   * Update an existing entity
   */
  async updateEntity(entityId, updates, options = {}) {
    const actionOptions = {
      enableOptimistic: this.config.enableOptimistic,
      validatePermissions: this.config.validatePermissions,
      ...options
    };

    // Get existing entity for permission check
    const existingEntity = await this.getEntityFromCache(entityId);
    
    if (!existingEntity) {
      return {
        success: false,
        error: 'Entity not found',
        operation: 'update'
      };
    }
    
    // Permission check
    if (actionOptions.validatePermissions) {
      const hasPermission = this.permissionService.hasPermission('canEdit', {
        entity: existingEntity,
        ...options.context
      });
      
      if (!hasPermission) {
        throw new Error(`Permission denied: Cannot edit ${this.entityInterface.adapter.getDisplayName(this.entityType)}`);
      }
    }

    // Merge updates with existing entity
    const updatedEntity = { ...existingEntity, ...updates };
    
    // Transform entity data using adapter
    const transformedData = this.entityInterface.adapter.transformRequest(updatedEntity);
    
    let optimisticUpdate = null;
    
    try {
      // Apply optimistic update if enabled
      if (actionOptions.enableOptimistic) {
        optimisticUpdate = await this.cacheManager.applyOptimisticUpdate('update', updatedEntity);
        
        if (this.config.debug) {
          console.log(`GenericActionService[${this.entityType}]: Applied optimistic update`, entityId);
        }
      }

      // Execute API call
      const apiResult = await this.executeApiCall('PUT', `/api/${this.entityType}/${entityId}`, transformedData, options);
      
      // Transform response using adapter
      const transformedResult = this.entityInterface.adapter.transformEntity(apiResult);

      // Commit optimistic update or invalidate cache
      if (optimisticUpdate) {
        await optimisticUpdate.commit();
      } else {
        await this.cacheManager.invalidateByPattern('update', transformedResult);
      }

      if (this.config.debug) {
        console.log(`GenericActionService[${this.entityType}]: Updated entity`, entityId);
      }

      // Call success callback if provided
      if (options.onSuccess) {
        options.onSuccess(transformedResult, updates);
      }

      return {
        success: true,
        data: transformedResult,
        operation: 'update',
        optimistic: !!optimisticUpdate
      };

    } catch (error) {
      // Rollback optimistic update on error
      if (optimisticUpdate) {
        optimisticUpdate.rollback();
      }

      if (this.config.debug) {
        console.error(`GenericActionService[${this.entityType}]: Update failed`, entityId, error);
      }

      // Call error callback if provided
      if (options.onError) {
        options.onError(error, updates);
      }

      return {
        success: false,
        error: error.message || 'Update operation failed',
        operation: 'update',
        optimistic: !!optimisticUpdate
      };
    }
  }

  /**
   * Delete an entity
   */
  async deleteEntity(entityId, options = {}) {
    const actionOptions = {
      enableOptimistic: this.config.enableOptimistic,
      validatePermissions: this.config.validatePermissions,
      ...options
    };

    // Get existing entity for permission check
    const existingEntity = await this.getEntityFromCache(entityId);
    
    if (!existingEntity) {
      return {
        success: false,
        error: 'Entity not found',
        operation: 'delete'
      };
    }

    // Permission check
    if (actionOptions.validatePermissions) {
      const hasPermission = this.permissionService.hasPermission('canDelete', {
        entity: existingEntity,
        ...options.context
      });
      
      if (!hasPermission) {
        throw new Error(`Permission denied: Cannot delete ${this.entityInterface.adapter.getDisplayName(this.entityType)}`);
      }
    }

    let optimisticUpdate = null;
    
    try {
      // Apply optimistic update if enabled
      if (actionOptions.enableOptimistic) {
        optimisticUpdate = await this.cacheManager.applyOptimisticUpdate('delete', existingEntity);
        
        if (this.config.debug) {
          console.log(`GenericActionService[${this.entityType}]: Applied optimistic delete`, entityId);
        }
      }

      // Execute API call
      await this.executeApiCall('DELETE', `/api/${this.entityType}/${entityId}`, null, options);

      // Commit optimistic update or invalidate cache
      if (optimisticUpdate) {
        await optimisticUpdate.commit();
      } else {
        await this.cacheManager.invalidateByPattern('delete', existingEntity);
      }

      if (this.config.debug) {
        console.log(`GenericActionService[${this.entityType}]: Deleted entity`, entityId);
      }

      // Call success callback if provided
      if (options.onSuccess) {
        options.onSuccess(existingEntity);
      }

      return {
        success: true,
        data: existingEntity,
        operation: 'delete',
        optimistic: !!optimisticUpdate
      };

    } catch (error) {
      // Rollback optimistic update on error
      if (optimisticUpdate) {
        optimisticUpdate.rollback();
      }

      if (this.config.debug) {
        console.error(`GenericActionService[${this.entityType}]: Delete failed`, entityId, error);
      }

      // Call error callback if provided
      if (options.onError) {
        options.onError(error, existingEntity);
      }

      return {
        success: false,
        error: error.message || 'Delete operation failed',
        operation: 'delete',
        optimistic: !!optimisticUpdate
      };
    }
  }

  /**
   * Bulk operations
   */
  async bulkUpdate(entityIds, updates, options = {}) {
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Disable optimistic updates for bulk operations by default
    const bulkOptions = {
      ...options,
      enableOptimistic: options.enableOptimistic ?? false
    };

    for (const entityId of entityIds) {
      try {
        const result = await this.updateEntity(entityId, updates, bulkOptions);
        results.push({ entityId, ...result });
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        results.push({
          entityId,
          success: false,
          error: error.message,
          operation: 'update'
        });
        errorCount++;
      }
    }

    // Invalidate cache after bulk operation
    await this.cacheManager.invalidateByPattern('bulk_update');

    if (this.config.debug) {
      console.log(`GenericActionService[${this.entityType}]: Bulk update completed`, {
        total: entityIds.length,
        success: successCount,
        errors: errorCount
      });
    }

    return {
      success: errorCount === 0,
      results,
      summary: {
        total: entityIds.length,
        success: successCount,
        errors: errorCount
      },
      operation: 'bulk_update'
    };
  }

  async bulkDelete(entityIds, options = {}) {
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Disable optimistic updates for bulk operations by default
    const bulkOptions = {
      ...options,
      enableOptimistic: options.enableOptimistic ?? false
    };

    for (const entityId of entityIds) {
      try {
        const result = await this.deleteEntity(entityId, bulkOptions);
        results.push({ entityId, ...result });
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        results.push({
          entityId,
          success: false,
          error: error.message,
          operation: 'delete'
        });
        errorCount++;
      }
    }

    // Invalidate cache after bulk operation
    await this.cacheManager.invalidateByPattern('bulk_delete');

    if (this.config.debug) {
      console.log(`GenericActionService[${this.entityType}]: Bulk delete completed`, {
        total: entityIds.length,
        success: successCount,
        errors: errorCount
      });
    }

    return {
      success: errorCount === 0,
      results,
      summary: {
        total: entityIds.length,
        success: successCount,
        errors: errorCount
      },
      operation: 'bulk_delete'
    };
  }

  /**
   * Validation helpers
   */
  validateEntity(entityData, operation = 'create') {
    const errors = [];

    // Basic validation - can be extended based on entity type
    if (!entityData.tittel && !entityData.title) {
      errors.push('Title is required');
    }

    if (operation === 'update' && !entityData.id) {
      errors.push('Entity ID is required for updates');
    }

    // Entity-specific validation using adapter
    try {
      this.entityInterface.adapter.transformRequest(entityData);
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get entity from cache (used internally)
   */
  async getEntityFromCache(entityId) {
    return this.cacheManager.getCachedData('detail', { entityId });
  }

  /**
   * Execute API call (mock implementation - replace with actual API integration)
   */
  async executeApiCall(method, url, data, options = {}) {
    // Mock API call - replace with actual implementation
    if (this.config.debug) {
      console.log(`GenericActionService[${this.entityType}]: API ${method} ${url}`, data);
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, options.delay || 100));

    // Mock response based on method
    switch (method) {
      case 'POST':
        return { ...data, id: Date.now(), createdAt: new Date().toISOString() };
      case 'PUT':
        return { ...data, updatedAt: new Date().toISOString() };
      case 'DELETE':
        return null;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Create mutation callbacks for React Query/Zustand integration
   */
  createMutationCallbacks(operation, options = {}) {
    return this.cacheManager.createMutationCallbacks(operation, {
      ...options,
      onSuccess: (data, variables, context) => {
        // Additional success handling
        if (options.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        // Additional error handling
        if (options.onError) {
          options.onError(error, variables, context);
        }
      }
    });
  }

  /**
   * Get action service debug info
   */
  getDebugInfo() {
    return {
      entityType: this.entityType,
      config: this.config,
      hasQueryClient: !!this.queryClient,
      services: {
        entityInterface: !!this.entityInterface,
        cacheManager: !!this.cacheManager,
        permissionService: !!this.permissionService
      },
      permissions: this.permissionService.getPermissionDebugInfo()
    };
  }
}

/**
 * Factory function for creating GenericActionService instances
 */
export const createGenericActionService = (entityType, queryClient, config = {}) => {
  return new GenericActionService(entityType, queryClient, config);
};

/**
 * Pre-configured action services for common entity types
 */
export const createTiltakActionService = (queryClient, config = {}) => {
  return new GenericActionService('tiltak', queryClient, config);
};

export const createKravActionService = (queryClient, config = {}) => {
  return new GenericActionService('krav', queryClient, config);
};

export const createProsjektTiltakActionService = (queryClient, config = {}) => {
  return new GenericActionService('prosjektTiltak', queryClient, config);
};

export const createProsjektKravActionService = (queryClient, config = {}) => {
  return new GenericActionService('prosjektKrav', queryClient, config);
};

export default GenericActionService;