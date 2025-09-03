// Main exports for EntityWorkspace system
export { default as EntityWorkspace } from "./EntityWorkspace.jsx";
export { default as EntityWorkspaceModern } from "./EntityWorkspaceModern.jsx";

// Export new interface system hooks and services
export { useGenericWorkspace } from "./interface/hooks/GenericStoreHook.js";
export { createGenericWorkspaceStore } from "./interface/stores/GenericWorkspaceStore.js";
export { GenericActionService } from "./interface/services/GenericActionService.js";

// Re-export shared components for convenience
export * from "./shared";