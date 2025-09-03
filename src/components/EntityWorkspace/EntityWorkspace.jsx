/**
 * EntityWorkspace - Modern interface system
 * 
 * This component serves as the public API for EntityWorkspace using the new
 * interface system with improved state management, caching, and architecture.
 */

import React from 'react';
import EntityWorkspaceModern from './EntityWorkspaceModern';
import { WorkspaceCompatibilityWrapper } from './interface/wrappers/WorkspaceCompatibilityWrapper';

// Export the modern implementation as the main component
export { default as EntityWorkspaceModern } from './EntityWorkspaceModern';

// Export new interface system hooks and services
export { useGenericWorkspace } from './interface/hooks/GenericStoreHook';
export { createGenericWorkspaceStore } from './interface/stores/GenericWorkspaceStore';
export { GenericActionService } from './interface/services/GenericActionService';

// Re-export shared components for convenience
export * from './shared';

/**
 * Main EntityWorkspace component using the modern interface system
 */
const EntityWorkspace = ({ entityType, modelConfig, workspaceConfig, debug, ...props }) => {
  // Always use the new interface system with compatibility wrapper
  return (
    <WorkspaceCompatibilityWrapper
      entityType={entityType}
      forceNewInterface={true}
      debug={debug}
    >
      <EntityWorkspaceModern
        entityType={entityType}
        modelConfig={modelConfig}
        workspaceConfig={workspaceConfig}
        debug={debug}
        {...props}
      />
    </WorkspaceCompatibilityWrapper>
  );
};

export default EntityWorkspace;