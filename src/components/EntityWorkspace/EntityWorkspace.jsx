/**
 * EntityWorkspace - Clean entry point with backward compatibility
 * 
 * This component serves as the public API for EntityWorkspace while internally
 * using the refactored EntityWorkspaceCore following SOLID principles.
 */

import EntityWorkspaceCore from './EntityWorkspaceCore';

// Export the refactored core as the main component
export { default as EntityWorkspaceCore } from './EntityWorkspaceCore';

// Export individual hooks and services for advanced usage
export { useEntityData } from './hooks/useEntityData';
export { useEntityPermissions } from './hooks/useEntityPermissions';

export { EntityFilterService } from './services/EntityFilterService';
export { EntityPermissionService } from './services/EntityPermissionService';
export { EntityTypeResolver } from './services/EntityTypeResolver';

// Main component export (backward compatible)
const EntityWorkspace = EntityWorkspaceCore;

export default EntityWorkspace;