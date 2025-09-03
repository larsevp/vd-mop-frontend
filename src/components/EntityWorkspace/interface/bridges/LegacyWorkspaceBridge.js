/**
 * Legacy Workspace Bridge
 * 
 * Integration layer between the existing EntityWorkspaceCore and new interface system.
 * Allows gradual migration while maintaining backward compatibility.
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createGenericWorkspaceStore } from '../stores/GenericWorkspaceStore.js';
import { useGenericWorkspace } from '../hooks/GenericStoreHook.js';

/**
 * Bridge that connects legacy EntityWorkspaceCore with new interface system
 */
export class LegacyWorkspaceBridge {
  constructor() {
    this.stores = new Map(); // Cache stores by entity type
  }

  /**
   * Get or create a store for the given entity type
   */
  getStore(entityType, config = {}) {
    if (!this.stores.has(entityType)) {
      const store = createGenericWorkspaceStore(entityType, {
        debug: config.debug || false,
        ...config
      });
      this.stores.set(entityType, store);
    }
    return this.stores.get(entityType);
  }

  /**
   * Convert legacy state format to new interface format
   */
  mapLegacyToInterface(legacyState) {
    return {
      // Map legacy fields to interface fields
      entities: legacyState.items || [],
      searchQuery: legacyState.searchQuery || '',
      filters: {
        filterBy: legacyState.filterBy || 'all',
        sortBy: legacyState.sortBy || 'id',
        sortOrder: legacyState.sortOrder || 'asc',
        additionalFilters: legacyState.additionalFilters || {}
      },
      pagination: {
        page: legacyState.page || 1,
        pageSize: legacyState.pageSize || 50,
        totalCount: legacyState.totalCount || 0,
        totalPages: Math.ceil((legacyState.totalCount || 0) / (legacyState.pageSize || 50)),
        hasNextPage: (legacyState.page || 1) < Math.ceil((legacyState.totalCount || 0) / (legacyState.pageSize || 50)),
        hasPreviousPage: (legacyState.page || 1) > 1
      },
      selectedEntities: new Set(legacyState.selectedEntity ? [legacyState.selectedEntity.id] : []),
      focusedEntity: legacyState.activeEntity?.id || null,
      expandedEntities: legacyState.expandedCards || new Set(),
      viewMode: legacyState.viewMode || 'list',
      loading: legacyState.isLoading || false,
      error: legacyState.error || null
    };
  }

  /**
   * Convert interface state back to legacy format
   */
  mapInterfaceToLegacy(interfaceState) {
    return {
      items: interfaceState.entities || [],
      searchQuery: interfaceState.searchQuery || '',
      filterBy: interfaceState.filters?.filterBy || 'all',
      sortBy: interfaceState.filters?.sortBy || 'id',
      sortOrder: interfaceState.filters?.sortOrder || 'asc',
      additionalFilters: interfaceState.filters?.additionalFilters || {},
      page: interfaceState.pagination?.page || 1,
      pageSize: interfaceState.pagination?.pageSize || 50,
      totalCount: interfaceState.pagination?.totalCount || 0,
      selectedEntity: interfaceState.selectedEntities?.size > 0 
        ? interfaceState.entities?.find(e => interfaceState.selectedEntities.has(e.id)) 
        : null,
      activeEntity: interfaceState.focusedEntity 
        ? interfaceState.entities?.find(e => e.id === interfaceState.focusedEntity)
        : null,
      expandedCards: interfaceState.expandedEntities || new Set(),
      viewMode: interfaceState.viewMode || 'list',
      isLoading: interfaceState.loading || false,
      error: interfaceState.error || null
    };
  }
}

// Singleton instance
const bridge = new LegacyWorkspaceBridge();

/**
 * Hook to use the new interface system within legacy components
 */
export const useLegacyWorkspaceBridge = (entityType, legacyStore, options = {}) => {
  const queryClient = useQueryClient();
  const bridgeRef = useRef(bridge);
  
  // Get or create the interface store
  const store = bridgeRef.current.getStore(entityType, options);
  
  // Use the new interface system
  const workspace = useGenericWorkspace(store, {
    enableDataFetching: true,
    enableActions: true,
    autoInitialize: true,
    userContext: options.userContext,
    debug: options.debug,
    ...options
  });

  // Sync with legacy store when interface state changes
  useEffect(() => {
    if (legacyStore && workspace) {
      const legacyState = bridgeRef.current.mapInterfaceToLegacy(workspace);
      
      // Only update legacy store if there are actual changes
      // This prevents infinite update loops
      const currentLegacyState = legacyStore.getState();
      const hasChanges = JSON.stringify(legacyState) !== JSON.stringify(currentLegacyState);
      
      if (hasChanges && options.syncToLegacy) {
        legacyStore.setState(legacyState);
      }
    }
  }, [workspace.entities, workspace.loading, workspace.error, legacyStore, options.syncToLegacy]);

  // Provide bridge utilities
  return {
    // New interface system
    workspace,
    
    // Bridge utilities
    bridge: bridgeRef.current,
    store,
    
    // State transformation utilities
    toLegacy: (interfaceState) => bridgeRef.current.mapInterfaceToLegacy(interfaceState),
    fromLegacy: (legacyState) => bridgeRef.current.mapLegacyToInterface(legacyState),
    
    // Migration helpers
    canUseLegacy: () => !options.forceNewInterface,
    shouldMigrate: () => options.enableMigration === true,
    
    // Debug info
    getDebugInfo: () => ({
      entityType,
      hasLegacyStore: !!legacyStore,
      interfaceState: workspace,
      bridgeOptions: options
    })
  };
};

/**
 * Factory function to create workspace with bridge support
 */
export const createBridgedWorkspace = (entityType, options = {}) => {
  const queryClient = useQueryClient?.() || options.queryClient;
  
  if (!queryClient) {
    throw new Error('createBridgedWorkspace requires queryClient');
  }

  const store = bridge.getStore(entityType, options);
  
  return {
    store,
    bridge,
    
    // Create workspace hook with bridge
    useWorkspace: (hookOptions = {}) => {
      return useGenericWorkspace(store, {
        enableDataFetching: true,
        enableActions: true,
        autoInitialize: true,
        ...options,
        ...hookOptions
      });
    }
  };
};

export default LegacyWorkspaceBridge;