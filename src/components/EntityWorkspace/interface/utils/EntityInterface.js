/**
 * EntityInterface Utility Class
 * 
 * Provides unified interface patterns and utilities for entity components.
 * Based on the INTERFACE-ANALYSIS.md recommendations and kravTiltak implementation.
 */

import { EntityTypeResolver } from '@/components/EntityWorkspace/interface/contracts/EntityTypeResolver.js';
import { createEntityWorkspaceAdapter } from '@/components/EntityWorkspace/adapter/index.js';

export class EntityInterface {
  constructor(entityType, config = {}) {
    this.entityType = entityType;
    this.config = config;
    this.modelConfig = config.modelConfig || EntityTypeResolver.getWorkspaceConfig(entityType);
    
    // Create adapter for proper entity handling
    this.adapter = createEntityWorkspaceAdapter(entityType);
  }

  /**
   * Create unified configuration object
   */
  createUnifiedConfig(overrides = {}) {
    return {
      modelConfig: this.modelConfig,
      entityType: this.entityType,
      ...overrides
    };
  }

  /**
   * Create unified display options
   */
  createDisplayOptions(options = {}) {
    const defaultViewOptions = {
      showHierarchy: true,
      showVurdering: true,
      showStatus: true,
      showPrioritet: true,
      showObligatorisk: true,
      showMerknad: true,
      showRelations: true,
    };

    return {
      isSelected: false,
      isFocused: false,
      ...options,
      viewOptions: {
        ...defaultViewOptions,
        ...options.viewOptions
      }
    };
  }

  /**
   * Create unified action callbacks
   */
  createActions(callbacks = {}) {
    return {
      onClick: callbacks.onSelect || (() => {}),
      onFocus: callbacks.onFocus || (() => {}),
      onSave: callbacks.onSave || callbacks.onEdit || (() => {}),
      onDelete: callbacks.onDelete || (() => {}),
      onClose: callbacks.onClose || (() => {}),
      onEdit: callbacks.onEdit || (() => {}),
      ...callbacks
    };
  }

  /**
   * Create unified context object
   */
  createContext(contextData = {}) {
    const defaultPermissions = {
      canEdit: true,
      canDelete: true,
      canCreate: true,
      canSave: true,
    };

    return {
      user: null,
      ...contextData,
      permissions: {
        ...defaultPermissions,
        ...contextData.permissions
      }
    };
  }

  /**
   * Get entity UID using adapter
   */
  getEntityUID(entity) {
    // Use adapter to extract UID properly
    return this.adapter.extractUID(entity, this.entityType);
  }

  /**
   * Get entity display name using adapter
   */
  getEntityDisplayName(entity) {
    // Use adapter to extract title properly
    return this.adapter.extractTitle(entity);
  }

  /**
   * Get entity type display name using adapter
   */
  getEntityTypeDisplayName(plural = false) {
    // This would need to be added to the adapter, for now use fallback
    const displayNames = {
      krav: plural ? 'Krav' : 'Krav',
      tiltak: plural ? 'Tiltak' : 'Tiltak',
      prosjektKrav: plural ? 'Prosjektkrav' : 'Prosjektkrav',
      prosjektTiltak: plural ? 'Prosjekttiltak' : 'Prosjekttiltak'
    };
    return displayNames[this.entityType] || this.entityType;
  }

  /**
   * Resolve entity type from entity data
   */
  resolveEntityType(entity) {
    return entity.entityType || this.entityType;
  }

  /**
   * Check if entity type supports group by emne
   */
  supportsGroupByEmne(entityType = null) {
    return EntityTypeResolver.supportsGroupByEmne(entityType || this.entityType);
  }

  /**
   * Get field configuration for entity type
   */
  getFieldConfig(fieldName) {
    return this.modelConfig?.workspace?.cardFields?.includes(fieldName);
  }

  /**
   * Transform entity for display using adapter
   */
  transformEntityForDisplay(entity) {
    // Handle null/undefined entities
    if (!entity) {
      return null;
    }

    // Use adapter to transform the entity properly
    const transformedEntity = this.adapter.transformEntity(entity);
    
    // If adapter returns null, handle gracefully
    if (!transformedEntity) {
      return null;
    }
    
    // Extract standardized data using adapter
    return {
      id: entity.id,
      entityType: this.resolveEntityType(entity),
      uid: this.getEntityUID(entity),
      title: this.getEntityDisplayName(entity),
      description: transformedEntity.description || '',
      status: transformedEntity.status,
      vurdering: transformedEntity.vurdering,
      emne: transformedEntity.emne,
      prioritet: transformedEntity.prioritet,
      obligatorisk: transformedEntity.obligatorisk,
      // Include all adapter-transformed data
      ...transformedEntity,
      // Preserve original
      _original: entity
    };
  }

  /**
   * Create props for GenericEntityListRow
   */
  createListRowProps(entity, options = {}) {
    return {
      entity: this.transformEntityForDisplay(entity),
      config: this.createUnifiedConfig(options.config),
      display: this.createDisplayOptions(options.display),
      actions: this.createActions(options.actions),
      context: this.createContext(options.context),
      renderIcon: options.renderIcon
    };
  }

  /**
   * Create props for GenericEntityDetailPane
   */
  createDetailPaneProps(entity, options = {}) {
    return {
      entity,
      config: this.createUnifiedConfig(options.config),
      actions: this.createActions(options.actions),
      context: this.createContext(options.context),
      mode: options.mode || 'view',
      renderIcon: options.renderIcon
    };
  }
}

/**
 * Factory function for creating EntityInterface instances
 */
export const createEntityInterface = (entityType, config = {}) => {
  return new EntityInterface(entityType, config);
};

/**
 * Factory function for creating generic entity workspace components
 */
export const createGenericEntityComponents = (entityType, options = {}) => {
  const entityInterface = createEntityInterface(entityType, options.config);
  
  return {
    createListRowProps: (entity, opts = {}) => entityInterface.createListRowProps(entity, opts),
    createDetailPaneProps: (entity, opts = {}) => entityInterface.createDetailPaneProps(entity, opts),
    entityInterface
  };
};