/**
 * EntityTypeResolver Interface Contract
 * 
 * Defines the interface that EntityTypeResolver implementations must follow.
 * This is a proxy/adapter that routes to the actual implementation.
 */

// Import the actual implementation
import { EntityTypeResolver as ActualResolver } from '../../implementations/kravTiltak/services/EntityTypeResolver.js';

/**
 * Interface wrapper for EntityTypeResolver
 * Routes calls to the current implementation
 */
export class EntityTypeResolver {
  /**
   * Resolve model configuration for entity type
   */
  static resolveModelConfig(entityType) {
    return ActualResolver.resolveModelConfig(entityType);
  }

  /**
   * Get display name for entity type
   */
  static getDisplayName(entityType, config, plural = false) {
    return ActualResolver.getDisplayName(entityType, config, plural);
  }

  /**
   * Check if entity type supports group by emne
   */
  static supportsGroupByEmne(entityType) {
    return ActualResolver.supportsGroupByEmne(entityType);
  }

  /**
   * Get workspace configuration for entity type
   */
  static getWorkspaceConfig(entityType) {
    return ActualResolver.getWorkspaceConfig(entityType);
  }
}

/**
 * Interface definition for EntityTypeResolver implementations
 * 
 * Any implementation must provide these methods:
 */
export const IEntityTypeResolver = {
  resolveModelConfig: (entityType) => { throw new Error('Not implemented'); },
  getDisplayName: (entityType, config, plural) => { throw new Error('Not implemented'); },
  supportsGroupByEmne: (entityType) => { throw new Error('Not implemented'); },
  getWorkspaceConfig: (entityType) => { throw new Error('Not implemented'); },
};