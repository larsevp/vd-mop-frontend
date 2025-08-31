/**
 * EntityPermissionService - Centralized permission resolution following SRP
 * Handles all permission logic for entities and workspaces
 */

import { modelConfigs } from "@/modelConfigs";

export class EntityPermissionService {
  /**
   * Resolve permissions for a workspace
   * Single responsibility: Workspace-level permission calculation
   */
  static resolveWorkspacePermissions(entityType, modelConfig, workspaceConfig = {}) {
    const basePermissions = {
      canEdit: true,
      canDelete: true,
      canCreate: true,
      canBulkActions: false,
      editButtonText: "Rediger",
      createButtonText: modelConfig.newButtonLabel || modelConfig.newButtonLabelText || `Nytt ${entityType}`,
      deleteConfirmText: (entity) => 
        `Er du sikker på at du vil slette "${entity?.tittel || entity?.navn || 'denne oppføringen'}"?`,
    };

    // Apply model-level restrictions
    if (modelConfig.readOnly) {
      basePermissions.canEdit = false;
      basePermissions.canDelete = false;
      basePermissions.canCreate = false;
    }

    // Apply workspace feature restrictions
    if (workspaceConfig.features?.inlineEdit === false) {
      basePermissions.canEdit = false;
    }
    
    if (workspaceConfig.features?.bulkActions === false) {
      basePermissions.canBulkActions = false;
    }

    // Apply special rules for combined views
    if (this._isCombinedView(entityType)) {
      basePermissions.canCreate = false; // Ambiguous which type to create
    }

    return basePermissions;
  }

  /**
   * Resolve permissions for a specific entity
   * Single responsibility: Entity-level permission calculation
   */
  static resolveEntityPermissions(entity, entityType, modelConfig, workspaceConfig = {}) {
    const workspacePermissions = this.resolveWorkspacePermissions(entityType, modelConfig, workspaceConfig);
    const entityPermissions = { ...workspacePermissions };

    // For combined views, resolve permissions per entity type
    if (this._isCombinedView(entityType) && entity?.entityType) {
      return this._resolveCombinedEntityPermissions(entity, entityPermissions);
    }

    // Apply entity-specific business rules
    return this._applyEntityBusinessRules(entity, entityPermissions, entityType);
  }

  /**
   * Check if user can perform specific action on entity
   * Single responsibility: Action permission validation
   */
  static canPerformAction(action, entity, entityType, modelConfig, workspaceConfig = {}) {
    const permissions = this.resolveEntityPermissions(entity, entityType, modelConfig, workspaceConfig);
    
    switch (action) {
      case 'create':
        return permissions.canCreate;
      case 'edit':
      case 'update':
        return permissions.canEdit;
      case 'delete':
        return permissions.canDelete;
      case 'bulkActions':
        return permissions.canBulkActions;
      default:
        return false;
    }
  }

  /**
   * Get permission-aware action button text
   * Single responsibility: Action button text resolution
   */
  static getActionButtonText(action, entity, entityType, modelConfig, workspaceConfig = {}) {
    const permissions = this.resolveEntityPermissions(entity, entityType, modelConfig, workspaceConfig);
    
    switch (action) {
      case 'create':
        return permissions.createButtonText;
      case 'edit':
        return permissions.editButtonText;
      case 'delete':
        return typeof permissions.deleteConfirmText === 'function' 
          ? permissions.deleteConfirmText(entity)
          : permissions.deleteConfirmText;
      default:
        return '';
    }
  }

  /**
   * Validate entity operation constraints
   * Single responsibility: Business rule validation
   */
  static validateEntityOperation(operation, entity, context = {}) {
    const validationErrors = [];

    // Example business rules - customize based on your requirements
    if (operation === 'create' || operation === 'update') {
      // Prevent emne assignment if entity has krav relationships
      if (this._hasKravRelationship(entity) && entity.emneId) {
        validationErrors.push('Cannot assign emne when entity has krav relationships');
      }

      // Validate required fields
      if (!entity.tittel?.trim()) {
        validationErrors.push('Tittel is required');
      }
    }

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  }

  // Private helper methods
  static _isCombinedView(entityType) {
    return entityType === 'combinedEntities' || 
           entityType === 'combined' || 
           entityType === 'prosjekt-combined';
  }

  static _resolveCombinedEntityPermissions(entity, basePermissions) {
    const targetModelName = this._mapEntityTypeToModelName(entity.entityType);
    
    if (targetModelName && modelConfigs[targetModelName]) {
      const targetConfig = modelConfigs[targetModelName];
      
      return {
        ...basePermissions,
        canEdit: targetConfig.workspace?.features?.inlineEdit !== false,
        editButtonText: `Rediger ${targetConfig.title || entity.entityType}`,
        deleteConfirmText: (e) => 
          `Er du sikker på at du vil slette "${e?.tittel || e?.navn || 'denne oppføringen'}"?`,
      };
    }
    
    return basePermissions;
  }

  static _mapEntityTypeToModelName(entityType) {
    const mapping = {
      'krav': 'krav',
      'tiltak': 'tiltak',
      'prosjektkrav': 'prosjektKrav',
      'prosjekttiltak': 'prosjektTiltak'
    };
    
    return mapping[entityType?.toLowerCase()];
  }

  static _applyEntityBusinessRules(entity, permissions, entityType) {
    // Apply specific business rules based on entity state
    
    // Example: Disable editing for certain statuses
    if (entity?.status?.navn === 'Låst' || entity?.status?.navn === 'Arkivert') {
      permissions.canEdit = false;
      permissions.canDelete = false;
    }

    // Example: Restrict editing based on user role or entity ownership
    // This would typically use user context passed in
    
    return permissions;
  }

  static _hasKravRelationship(entity) {
    return entity?.krav && Array.isArray(entity.krav) && entity.krav.length > 0;
  }
}

export default EntityPermissionService;