/**
 * Workspace Compatibility Wrapper
 * 
 * Allows EntityWorkspaceCore to optionally use the new interface system
 * while maintaining full backward compatibility.
 */

import React, { useMemo } from 'react';
import { useLegacyWorkspaceBridge } from '../bridges/LegacyWorkspaceBridge.js';
import { useUserStore } from '@/stores/userStore';

/**
 * Feature flag configuration
 */
const FEATURE_FLAGS = {
  USE_NEW_INTERFACE: false, // Set to true to enable new interface system
  ENABLE_BRIDGE_SYNC: true, // Sync between old and new systems
  ENABLE_DEBUG: false, // Enable debug logging
};

/**
 * Wrapper component that provides interface system integration
 */
export const WorkspaceCompatibilityWrapper = ({ 
  children, 
  entityType, 
  legacyStore,
  forceNewInterface = false,
  enableBridgeSync = FEATURE_FLAGS.ENABLE_BRIDGE_SYNC,
  debug = FEATURE_FLAGS.ENABLE_DEBUG
}) => {
  const { user } = useUserStore();
  
  const shouldUseNewInterface = forceNewInterface || FEATURE_FLAGS.USE_NEW_INTERFACE;
  
  // Bridge configuration
  const bridgeOptions = useMemo(() => ({
    userContext: user ? {
      userId: user.id,
      role: user.role,
      permissions: user.permissions || [],
      enhetId: user.enhetId
    } : null,
    syncToLegacy: enableBridgeSync,
    enableMigration: shouldUseNewInterface,
    forceNewInterface: forceNewInterface,
    debug: debug
  }), [user, enableBridgeSync, shouldUseNewInterface, forceNewInterface, debug]);

  // Initialize the bridge if using new interface
  const bridgeHook = shouldUseNewInterface 
    ? useLegacyWorkspaceBridge(entityType, legacyStore, bridgeOptions)
    : null;

  // Provide bridge context to children
  const contextValue = useMemo(() => ({
    // Bridge information
    hasBridge: !!bridgeHook,
    bridge: bridgeHook?.bridge,
    workspace: bridgeHook?.workspace,
    
    // Feature flags
    useNewInterface: shouldUseNewInterface,
    canUseLegacy: bridgeHook?.canUseLegacy() ?? true,
    shouldMigrate: bridgeHook?.shouldMigrate() ?? false,
    
    // Utilities
    toLegacy: bridgeHook?.toLegacy,
    fromLegacy: bridgeHook?.fromLegacy,
    
    // Debug
    debugInfo: bridgeHook?.getDebugInfo(),
    options: bridgeOptions
  }), [bridgeHook, shouldUseNewInterface, bridgeOptions]);

  // Enhanced children with bridge props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        // Inject bridge context as props
        interfaceContext: contextValue,
        // Legacy compatibility
        ...child.props
      });
    }
    return child;
  });

  return (
    <>
      {enhancedChildren}
      
      {/* Debug overlay in development */}
      {debug && process.env.NODE_ENV === 'development' && (
        <WorkspaceDebugOverlay context={contextValue} />
      )}
    </>
  );
};

/**
 * Debug overlay component for development
 */
const WorkspaceDebugOverlay = ({ context }) => {
  if (!context.debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-black/80 text-white text-xs font-mono rounded max-w-sm overflow-auto max-h-96">
      <h3 className="font-bold mb-2">Interface Bridge Debug</h3>
      <div className="space-y-1">
        <div>Entity: {context.debugInfo.entityType}</div>
        <div>New Interface: {context.useNewInterface ? '✅' : '❌'}</div>
        <div>Legacy Store: {context.debugInfo.hasLegacyStore ? '✅' : '❌'}</div>
        <div>Bridge Active: {context.hasBridge ? '✅' : '❌'}</div>
        {context.workspace && (
          <>
            <div>Entities: {context.workspace.entities?.length || 0}</div>
            <div>Loading: {context.workspace.loading ? '⏳' : '✅'}</div>
            <div>Error: {context.workspace.error ? '❌' : '✅'}</div>
          </>
        )}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer">Full Debug Info</summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify(context.debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
};

/**
 * Hook to access workspace interface context
 */
export const useWorkspaceInterface = () => {
  // This would typically use React Context, but for simplicity 
  // we'll use a basic implementation
  return {
    useNewInterface: FEATURE_FLAGS.USE_NEW_INTERFACE,
    canUseLegacy: true,
    shouldMigrate: false
  };
};

/**
 * HOC to wrap existing workspace components
 */
export const withWorkspaceInterface = (WrappedComponent, options = {}) => {
  return function WorkspaceInterfaceWrapper(props) {
    return (
      <WorkspaceCompatibilityWrapper
        entityType={props.entityType}
        legacyStore={options.legacyStore}
        {...options}
      >
        <WrappedComponent {...props} />
      </WorkspaceCompatibilityWrapper>
    );
  };
};

export default WorkspaceCompatibilityWrapper;