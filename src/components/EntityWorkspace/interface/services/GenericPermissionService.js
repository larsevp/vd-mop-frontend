/**
 * Generic Permission Service Interface
 * 
 * Provides adapter-aware permission checking for entity workspaces.
 * Handles role-based access control, entity-specific permissions, and context awareness.
 */

import { createEntityInterface } from '../utils/EntityInterface.js';

export class GenericPermissionService {
  constructor(entityType, config = {}) {
    this.entityInterface = createEntityInterface(entityType, config);
    this.entityType = entityType;
    this.config = config;
    
    // Permission configuration
    this.permissionConfig = {
      defaultPermissions: {
        canView: true,
        canEdit: false,
        canDelete: false,
        canCreate: false
      },
      roleHierarchy: ['user', 'editor', 'admin', 'superadmin'],
      ...config.permissionConfig
    };
    
    // Current user context
    this.userContext = config.userContext || null;
  }

  /**
   * Set current user context for permission checks
   */
  setUserContext(userContext) {
    this.userContext = userContext;
    return this;
  }

  /**
   * Get current user context
   */
  getUserContext() {
    return this.userContext;
  }

  /**
   * Check if user has a specific permission for entity type
   */
  hasPermission(permission, context = {}) {
    if (!this.userContext) {
      return this.permissionConfig.defaultPermissions[permission] ?? false;
    }

    // Build permission key using adapter for consistent naming
    const permissionKey = this.buildPermissionKey(permission, context);
    
    // Check direct permission
    if (this.checkDirectPermission(permissionKey)) {
      return true;
    }
    
    // Check role-based permissions
    if (this.checkRolePermission(permission, context)) {
      return true;
    }
    
    // Check entity-specific permissions
    if (context.entity) {
      return this.checkEntityPermission(permission, context.entity, context);
    }
    
    return this.permissionConfig.defaultPermissions[permission] ?? false;
  }

  /**
   * Build permission key using adapter context
   */
  buildPermissionKey(permission, context = {}) {
    const parts = [];
    
    // Entity type from adapter
    const displayName = this.entityInterface.adapter.getDisplayName(this.entityType).toLowerCase();
    parts.push(displayName);
    
    // Permission action
    parts.push(permission);
    
    // Context modifiers
    if (context.projectId) {
      parts.push(`project:${context.projectId}`);
    }
    
    if (context.emneId) {
      parts.push(`emne:${context.emneId}`);
    }
    
    if (context.scope) {
      parts.push(`scope:${context.scope}`);
    }
    
    return parts.join('.');
  }

  /**
   * Check direct permission assignment
   */
  checkDirectPermission(permissionKey) {
    if (!this.userContext?.permissions) {
      return false;
    }
    
    // Check exact match
    if (this.userContext.permissions.includes(permissionKey)) {
      return true;
    }
    
    // Check wildcard patterns
    const wildcardPatterns = this.userContext.permissions.filter(p => p.includes('*'));
    
    return wildcardPatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(permissionKey);
    });
  }

  /**
   * Check role-based permissions
   */
  checkRolePermission(permission, context = {}) {
    if (!this.userContext?.role) {
      return false;
    }
    
    const userRole = this.userContext.role;
    const roleIndex = this.permissionConfig.roleHierarchy.indexOf(userRole);
    
    if (roleIndex === -1) {
      return false;
    }
    
    // Define role-based permissions for entity operations
    const rolePermissions = {
      user: ['canView'],
      editor: ['canView', 'canEdit', 'canCreate'],
      admin: ['canView', 'canEdit', 'canCreate', 'canDelete'],
      superadmin: ['canView', 'canEdit', 'canCreate', 'canDelete', 'canManage']
    };
    
    // Check if user's specific role has the permission
    if (rolePermissions[userRole]?.includes(permission)) {
      return this.checkRoleContextConstraints(userRole, permission, context);
    }
    
    return false;
  }

  /**
   * Check context constraints for role-based permissions
   */
  checkRoleContextConstraints(role, permission, context) {
    // Admins and superadmins bypass most constraints
    if (['admin', 'superadmin'].includes(role)) {
      return true;
    }
    
    // Project-specific constraints
    if (context.projectId && this.userContext?.projectAccess) {
      const projectAccess = this.userContext.projectAccess[context.projectId];
      if (!projectAccess) {
        return false;
      }
      
      // Check project-specific permission level
      const projectPermissions = {
        read: ['canView'],
        write: ['canView', 'canEdit', 'canCreate'],
        admin: ['canView', 'canEdit', 'canCreate', 'canDelete']
      };
      
      return projectPermissions[projectAccess]?.includes(permission) ?? false;
    }
    
    // Unit/organization constraints
    if (this.userContext?.unitIds && context.entity?.enhet?.id) {
      return this.userContext.unitIds.includes(context.entity.enhet.id);
    }
    
    return true;
  }

  /**
   * Check entity-specific permissions
   */
  checkEntityPermission(permission, entity, context = {}) {
    if (!entity) return false;
    
    // Transform entity for consistent access
    const transformedEntity = this.entityInterface.transformEntityForDisplay(entity);
    
    // Check ownership
    if (this.isEntityOwner(transformedEntity)) {
      return this.getOwnerPermissions().includes(permission);
    }
    
    // Check if entity is locked/readonly
    if (this.isEntityLocked(transformedEntity)) {
      return ['canView'].includes(permission);
    }
    
    // Check status-based permissions
    if (this.hasStatusBasedPermissions(transformedEntity, permission)) {
      return true;
    }
    
    // Check relationship-based permissions
    if (this.hasRelationshipPermissions(transformedEntity, permission, context)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user owns the entity
   */
  isEntityOwner(entity) {
    if (!this.userContext?.userId || !entity) return false;
    
    // Check creator
    if (entity.createdBy === this.userContext.userId) {
      return true;
    }
    
    // Check assigned user
    if (entity.assignedTo === this.userContext.userId) {
      return true;
    }
    
    // Check creator object
    if (entity.creator?.id === this.userContext.userId) {
      return true;
    }
    
    return false;
  }

  /**
   * Get permissions for entity owners
   */
  getOwnerPermissions() {
    return ['canView', 'canEdit'];
  }

  /**
   * Check if entity is locked from editing
   */
  isEntityLocked(entity) {
    if (!entity) return false;
    
    // Check if entity has a locked status
    const lockedStatuses = ['ferdig', 'completed', 'archived', 'locked'];
    const statusName = entity.status?.name || entity.status?.navn || '';
    
    if (lockedStatuses.includes(statusName.toLowerCase())) {
      return true;
    }
    
    // Check explicit lock flag
    if (entity.isLocked || entity.locked) {
      return true;
    }
    
    // Check if entity is obligatorisk and user doesn't have admin role
    if (entity.obligatorisk && !['admin', 'superadmin'].includes(this.userContext?.role)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check status-based permissions
   */
  hasStatusBasedPermissions(entity, permission) {
    if (!entity?.status) return false;
    
    const statusName = entity.status.name || entity.status.navn || '';
    
    // Define status-based permission rules
    const statusPermissions = {
      'draft': ['canView', 'canEdit', 'canDelete'],
      'in_progress': ['canView', 'canEdit'],
      'review': ['canView'],
      'completed': ['canView'],
      'archived': ['canView']
    };
    
    const normalizedStatus = statusName.toLowerCase().replace(/\s+/g, '_');
    return statusPermissions[normalizedStatus]?.includes(permission) ?? false;
  }

  /**
   * Check relationship-based permissions
   */
  hasRelationshipPermissions(entity, permission, context) {
    if (!entity || !this.userContext) return false;
    
    // If user has permission on parent entities
    if (entity.parent && context.checkParentPermissions) {
      return this.hasPermission(permission, {
        ...context,
        entity: entity.parent,
        checkParentPermissions: false // Prevent infinite recursion
      });
    }
    
    // If user has permission on related entities (krav <-> tiltak)
    if (context.checkRelatedPermissions) {
      const relatedEntities = [
        ...(entity.krav || []),
        ...(entity.tiltak || []),
        ...(entity.prosjektKrav || []),
        ...(entity.prosjektTiltak || [])
      ];
      
      return relatedEntities.some(related => 
        this.hasPermission(permission, {
          ...context,
          entity: related,
          checkRelatedPermissions: false // Prevent infinite recursion
        })
      );
    }
    
    return false;
  }

  /**
   * Batch check permissions for multiple entities
   */
  checkBatchPermissions(permission, entities, context = {}) {
    if (!Array.isArray(entities)) {
      return [];
    }
    
    return entities.map(entity => ({
      entity,
      hasPermission: this.hasPermission(permission, {
        ...context,
        entity
      }),
      permissions: this.getEntityPermissions(entity, context)
    }));
  }

  /**
   * Get all permissions for a specific entity
   */
  getEntityPermissions(entity, context = {}) {
    const permissions = {};
    const permissionTypes = ['canView', 'canEdit', 'canDelete', 'canCreate', 'canManage'];
    
    permissionTypes.forEach(permission => {
      permissions[permission] = this.hasPermission(permission, {
        ...context,
        entity
      });
    });
    
    return permissions;
  }

  /**
   * Create permission context for UI components
   */
  createPermissionContext(entity = null, additionalContext = {}) {
    const baseContext = {
      entityType: this.entityType,
      displayName: this.entityInterface.adapter.getDisplayName(this.entityType),
      ...additionalContext
    };
    
    if (entity) {
      const transformedEntity = this.entityInterface.transformEntityForDisplay(entity);
      const permissions = this.getEntityPermissions(transformedEntity, baseContext);
      
      return {
        ...baseContext,
        entity: transformedEntity,
        permissions,
        isOwner: this.isEntityOwner(transformedEntity),
        isLocked: this.isEntityLocked(transformedEntity),
        canEdit: permissions.canEdit && !this.isEntityLocked(transformedEntity),
        canDelete: permissions.canDelete && !this.isEntityLocked(transformedEntity)
      };
    }
    
    return {
      ...baseContext,
      permissions: this.getEntityPermissions(null, baseContext)
    };
  }

  /**
   * Get permission debug information
   */
  getPermissionDebugInfo(entity = null) {
    const context = entity ? { entity } : {};
    
    return {
      entityType: this.entityType,
      userContext: this.userContext,
      permissionConfig: this.permissionConfig,
      currentPermissions: this.getEntityPermissions(entity, context),
      permissionKey: entity ? this.buildPermissionKey('canEdit', context) : null,
      isOwner: entity ? this.isEntityOwner(entity) : null,
      isLocked: entity ? this.isEntityLocked(entity) : null
    };
  }
}

/**
 * Factory function for creating GenericPermissionService instances
 */
export const createGenericPermissionService = (entityType, config = {}) => {
  return new GenericPermissionService(entityType, config);
};

/**
 * Pre-configured permission services for common entity types
 */
export const createTiltakPermissionService = (config = {}) => {
  return new GenericPermissionService('tiltak', config);
};

export const createKravPermissionService = (config = {}) => {
  return new GenericPermissionService('krav', config);
};

export const createProsjektTiltakPermissionService = (config = {}) => {
  return new GenericPermissionService('prosjektTiltak', config);
};

export const createProsjektKravPermissionService = (config = {}) => {
  return new GenericPermissionService('prosjektKrav', config);
};

export default GenericPermissionService;