import { useMemo } from "react";
import { EntityPermissionService } from "../services/EntityPermissionService";

/**
 * useEntityPermissions - Permission management hook following SRP
 * Single responsibility: Resolve and manage entity permissions
 */
export const useEntityPermissions = ({
  entityType,
  modelConfig,
  workspaceConfig = {},
  user = null
}) => {
  // Resolve workspace-level permissions
  const workspacePermissions = useMemo(() => {
    return EntityPermissionService.resolveWorkspacePermissions(
      entityType,
      modelConfig,
      workspaceConfig
    );
  }, [entityType, modelConfig, workspaceConfig]);

  // Create entity-specific permission resolver
  const resolveEntityPermissions = useMemo(() => {
    return (entity) => {
      return EntityPermissionService.resolveEntityPermissions(
        entity,
        entityType,
        modelConfig,
        workspaceConfig
      );
    };
  }, [entityType, modelConfig, workspaceConfig]);

  // Permission checker functions
  const canPerformAction = useMemo(() => {
    return (action, entity = null) => {
      return EntityPermissionService.canPerformAction(
        action,
        entity,
        entityType,
        modelConfig,
        workspaceConfig
      );
    };
  }, [entityType, modelConfig, workspaceConfig]);

  // Action button text resolver
  const getActionButtonText = useMemo(() => {
    return (action, entity = null) => {
      return EntityPermissionService.getActionButtonText(
        action,
        entity,
        entityType,
        modelConfig,
        workspaceConfig
      );
    };
  }, [entityType, modelConfig, workspaceConfig]);

  // Entity operation validator
  const validateEntityOperation = useMemo(() => {
    return (operation, entity, context = {}) => {
      return EntityPermissionService.validateEntityOperation(
        operation,
        entity,
        { ...context, user }
      );
    };
  }, [user]);

  // Batch permission resolver for lists of entities
  const resolveEntityListPermissions = useMemo(() => {
    return (entities) => {
      if (!Array.isArray(entities)) return [];
      
      return entities.map(entity => ({
        entity,
        permissions: resolveEntityPermissions(entity)
      }));
    };
  }, [resolveEntityPermissions]);

  // Check if specific features are available
  const hasFeature = useMemo(() => {
    return (feature) => {
      switch (feature) {
        case 'create':
          return workspacePermissions.canCreate;
        case 'edit':
          return workspacePermissions.canEdit;
        case 'delete':
          return workspacePermissions.canDelete;
        case 'bulkActions':
          return workspacePermissions.canBulkActions;
        default:
          return false;
      }
    };
  }, [workspacePermissions]);

  // Get permission summary for debugging/display
  const getPermissionSummary = useMemo(() => {
    return (entity = null) => {
      const permissions = entity 
        ? resolveEntityPermissions(entity)
        : workspacePermissions;
      
      return {
        canCreate: permissions.canCreate,
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
        canBulkActions: permissions.canBulkActions,
        isReadOnly: !permissions.canEdit && !permissions.canDelete && !permissions.canCreate,
        restrictedActions: Object.entries(permissions)
          .filter(([key, value]) => key.startsWith('can') && !value)
          .map(([key]) => key.replace('can', '').toLowerCase())
      };
    };
  }, [workspacePermissions, resolveEntityPermissions]);

  // Permission-aware action handlers
  const createPermissionAwareHandler = useMemo(() => {
    return (action, handler) => {
      return (entity, ...args) => {
        const entityPermissions = resolveEntityPermissions(entity);
        
        // Check permission based on action
        let hasPermission = false;
        switch (action) {
          case 'edit':
            hasPermission = entityPermissions.canEdit;
            break;
          case 'delete':
            hasPermission = entityPermissions.canDelete;
            break;
          case 'create':
            hasPermission = entityPermissions.canCreate;
            break;
          default:
            hasPermission = true;
        }
        
        if (!hasPermission) {
          console.warn(`Action '${action}' not permitted for entity:`, entity);
          return Promise.reject(new Error(`Permission denied: Cannot ${action} this entity`));
        }
        
        return handler(entity, ...args);
      };
    };
  }, [resolveEntityPermissions]);

  // Utility for filtering entities based on permissions
  const filterEntitiesByPermission = useMemo(() => {
    return (entities, requiredPermission) => {
      if (!Array.isArray(entities)) return [];
      
      return entities.filter(entity => {
        const permissions = resolveEntityPermissions(entity);
        return permissions[`can${requiredPermission.charAt(0).toUpperCase()}${requiredPermission.slice(1)}`];
      });
    };
  }, [resolveEntityPermissions]);

  return {
    // Core permission objects
    workspacePermissions,
    resolveEntityPermissions,
    
    // Permission checker functions
    canPerformAction,
    hasFeature,
    getActionButtonText,
    validateEntityOperation,
    
    // Batch operations
    resolveEntityListPermissions,
    filterEntitiesByPermission,
    
    // Utility functions
    getPermissionSummary,
    createPermissionAwareHandler,
    
    // Quick access to common permissions
    canCreate: workspacePermissions.canCreate,
    canEdit: workspacePermissions.canEdit,
    canDelete: workspacePermissions.canDelete,
    canBulkActions: workspacePermissions.canBulkActions,
    isReadOnly: !workspacePermissions.canEdit && !workspacePermissions.canDelete && !workspacePermissions.canCreate,
    
    // Button texts
    createButtonText: workspacePermissions.createButtonText,
    editButtonText: workspacePermissions.editButtonText
  };
};

export default useEntityPermissions;