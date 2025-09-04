/**
 * State Ports - React Integration
 * 
 * This file provides the main React hooks for accessing the port-based
 * state management system. It creates singleton instances of the stores
 * and ports to ensure stable references across re-renders.
 */

import React, { useEffect, useRef } from 'react';
import { useEntityStore } from '../stores/EntityStore.js';
import { useWorkspaceStore } from '../stores/WorkspaceStore.js';
import { EntityPort } from './EntityPort.js';
import { WorkspacePort } from './WorkspacePort.js';

// ============ SINGLETON INSTANCES ============
// These ensure stable references across all components

let entityStoreInstance = null;
let workspaceStoreInstance = null;
let entityPortInstance = null;
let workspacePortInstance = null;

// ============ STORE INITIALIZATION ============

/**
 * Initialize stores - call once in app
 */
export const initializeStores = (config = {}) => {
  const { debug = false } = config;
  
  // Create stores if they don't exist
  if (!entityStoreInstance) {
    entityStoreInstance = useEntityStore(debug);
  }
  
  if (!workspaceStoreInstance) {
    workspaceStoreInstance = useWorkspaceStore(debug);
  }
  
  // Create ports with store dependencies
  if (!entityPortInstance && entityStoreInstance && workspaceStoreInstance) {
    entityPortInstance = new EntityPort(
      entityStoreInstance,
      workspaceStoreInstance,
      config.services || {}
    );
    entityPortInstance.setDebug(debug);
  }
  
  if (!workspacePortInstance && workspaceStoreInstance && entityPortInstance) {
    workspacePortInstance = new WorkspacePort(
      workspaceStoreInstance,
      entityPortInstance,
      config.services || {}
    );
    workspacePortInstance.setDebug(debug);
  }
  
  return {
    entityStore: entityStoreInstance,
    workspaceStore: workspaceStoreInstance,
    entityPort: entityPortInstance,
    workspacePort: workspacePortInstance
  };
};

// ============ REACT HOOKS ============

/**
 * Main hook for entity operations
 * Provides stable reference to EntityPort
 */
export const useEntityOperations = (config = {}) => {
  const initRef = useRef(false);
  
  // Initialize on first use
  if (!initRef.current) {
    initializeStores(config);
    initRef.current = true;
  }
  
  // Return stable port reference
  return entityPortInstance;
};

/**
 * Main hook for workspace operations
 * Provides stable reference to WorkspacePort
 */
export const useWorkspaceOperations = (config = {}) => {
  const initRef = useRef(false);
  
  // Initialize on first use
  if (!initRef.current) {
    initializeStores(config);
    initRef.current = true;
  }
  
  // Return stable port reference
  return workspacePortInstance;
};

/**
 * Hook for accessing entity state directly
 * Use this for reactive UI updates
 */
export const useEntityState = (selector) => {
  // Ensure stores are initialized
  if (!entityStoreInstance) {
    initializeStores();
  }
  
  return entityStoreInstance(selector);
};

/**
 * Hook for accessing workspace state directly
 * Use this for reactive UI updates
 */
export const useWorkspaceState = (selector) => {
  // Ensure stores are initialized
  if (!workspaceStoreInstance) {
    initializeStores();
  }
  
  return workspaceStoreInstance(selector);
};

/**
 * Combined hook for entity workspace operations
 * Most common use case - provides both entity and workspace operations
 */
export const useEntityWorkspace = (entityType, dto = null, config = {}) => {
  const entityOps = useEntityOperations(config);
  const workspaceOps = useWorkspaceOperations(config);
  
  // Auto-register DTO if provided
  useEffect(() => {
    if (entityType && dto) {
      workspaceOps.registerDTO(entityType, dto);
    }
  }, [entityType, dto, workspaceOps]);
  
  // Auto-switch workspace if different from current
  const currentEntityType = useWorkspaceState(state => state.currentEntityType);
  
  useEffect(() => {
    if (entityType && entityType !== currentEntityType) {
      workspaceOps.switchWorkspace(entityType, dto);
    }
  }, [entityType, currentEntityType, dto, workspaceOps]);
  
  // Return stable operations object
  return React.useMemo(() => ({
    // Entity operations
    loadEntities: (options) => entityOps.loadEntities(entityType, options),
    createEntity: (data) => entityOps.createEntity(entityType, data),
    updateEntity: (id, updates) => entityOps.updateEntity(entityType, id, updates),
    deleteEntity: (id) => entityOps.deleteEntity(entityType, id),
    updateSearchQuery: (query) => entityOps.updateSearchQuery(entityType, query),
    updateFilters: (filters) => entityOps.updateFilters(entityType, filters),
    updatePagination: (pagination) => entityOps.updatePagination(entityType, pagination),
    setSelectedEntity: (entity) => entityOps.setSelectedEntity(entity),
    clearSelection: () => entityOps.clearSelection(),
    refreshEntities: () => entityOps.refreshEntities(entityType),
    reset: () => entityOps.reset(),
    
    // Workspace operations
    switchWorkspace: (toType, toDTO) => workspaceOps.switchWorkspace(toType, toDTO),
    saveWorkspaceState: () => workspaceOps.saveCurrentWorkspaceState(entityType),
    resetWorkspace: () => workspaceOps.resetCurrentWorkspace(),
    clearWorkspaceCache: () => workspaceOps.clearWorkspaceCache(entityType),
    
    // State access helpers
    getState: () => entityOps.getState(entityType),
    getCurrentWorkspace: () => workspaceOps.getCurrentWorkspace(),
    
    // Debug helpers
    getDebugInfo: () => ({
      entity: entityOps.getState(entityType),
      workspace: workspaceOps.getDebugInfo()
    })
  }), [entityType, entityOps, workspaceOps]);
};

/**
 * Hook for entity state selectors with automatic type handling
 */
export const useEntityData = (entityType, selector = (state) => state) => {
  // Ensure workspace is set for the entity type
  const currentEntityType = useWorkspaceState(state => state.currentEntityType);
  const workspaceOps = useWorkspaceOperations();
  
  useEffect(() => {
    if (entityType && entityType !== currentEntityType) {
      workspaceOps.switchWorkspace(entityType);
    }
  }, [entityType, currentEntityType, workspaceOps]);
  
  // Return selected entity state
  return useEntityState(selector);
};

/**
 * Hook for simplified read-only entity access
 */
export const useEntityList = (entityType) => {
  return useEntityData(entityType, (state) => ({
    entities: state.entities,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    stats: state.stats
  }));
};

/**
 * Hook for entity selection state
 */
export const useEntitySelection = (entityType) => {
  const entityOps = useEntityOperations();
  
  const selectionState = useEntityData(entityType, (state) => ({
    selectedEntity: state.selectedEntity,
    selectedEntities: state.selectedEntities,
    focusedEntity: state.focusedEntity
  }));
  
  return React.useMemo(() => ({
    ...selectionState,
    setSelectedEntity: (entity) => entityOps.setSelectedEntity(entity),
    clearSelection: () => entityOps.clearSelection()
  }), [selectionState, entityOps]);
};

// ============ UTILITIES ============

/**
 * Get all initialized instances (for debugging)
 */
export const getInstances = () => ({
  entityStore: entityStoreInstance,
  workspaceStore: workspaceStoreInstance,
  entityPort: entityPortInstance,
  workspacePort: workspacePortInstance
});

/**
 * Reset all instances (for testing)
 */
export const resetInstances = () => {
  entityStoreInstance = null;
  workspaceStoreInstance = null;
  entityPortInstance = null;
  workspacePortInstance = null;
};

/**
 * Provider component for port configuration
 */
export const PortProvider = ({ children, config = {} }) => {
  useEffect(() => {
    initializeStores(config);
  }, [config]);
  
  return children;
};

export default {
  useEntityOperations,
  useWorkspaceOperations,
  useEntityState,
  useWorkspaceState,
  useEntityWorkspace,
  useEntityData,
  useEntityList,
  useEntitySelection,
  PortProvider
};