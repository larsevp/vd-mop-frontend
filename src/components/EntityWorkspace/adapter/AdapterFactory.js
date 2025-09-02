/**
 * Adapter Factory - Creates appropriate adapter instances
 * Centralized factory for different adapter types with configuration
 */

import { EntityWorkspaceAdapter } from './models/EntityWorkspaceAdapter.js';
import { SimpleAdapter } from './models/SimpleAdapter.js';
import { EntityTypeTranslator } from '../shared/utils/entityTypeTranslator.js';

export class AdapterFactory {
  /**
   * Create adapter instance based on type and configuration
   */
  static create(adapterType, entityType, config = {}) {
    const normalizedEntityType = EntityTypeTranslator.translate(entityType, "camelCase");
    
    switch (adapterType) {
      case 'entityWorkspace':
      case 'complex':
        return new EntityWorkspaceAdapter(normalizedEntityType, config);
        
      case 'simple':
      case 'basic':
        return new SimpleAdapter(normalizedEntityType, config);
        
      default:
        throw new Error(`Unknown adapter type: ${adapterType}. Available types: 'entityWorkspace', 'simple'`);
    }
  }

  /**
   * Create EntityWorkspace adapter (handles complex MOP patterns)
   */
  static createEntityWorkspace(entityType, config = {}) {
    return this.create('entityWorkspace', entityType, config);
  }

  /**
   * Create Simple adapter (for basic REST APIs)
   */
  static createSimple(entityType, config = {}) {
    return this.create('simple', entityType, config);
  }

  /**
   * Create adapter based on entity type conventions
   */
  static createByEntityType(entityType, config = {}) {
    const normalizedType = EntityTypeTranslator.translate(entityType, "camelCase");
    
    // Use EntityWorkspace adapter for known MOP entity types
    const mopEntityTypes = ['krav', 'tiltak', 'prosjektKrav', 'prosjektTiltak', 'combinedEntities'];
    
    if (mopEntityTypes.includes(normalizedType)) {
      return this.createEntityWorkspace(normalizedType, config);
    }
    
    // Use simple adapter for unknown types
    return this.createSimple(normalizedType, config);
  }

  /**
   * Get list of available adapter types
   */
  static getAvailableTypes() {
    return ['entityWorkspace', 'simple'];
  }

  /**
   * Validate adapter configuration
   */
  static validateConfig(adapterType, config = {}) {
    const errors = [];
    
    if (!adapterType) {
      errors.push("Adapter type is required");
    }
    
    if (!this.getAvailableTypes().includes(adapterType)) {
      errors.push(`Invalid adapter type: ${adapterType}. Available types: ${this.getAvailableTypes().join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}