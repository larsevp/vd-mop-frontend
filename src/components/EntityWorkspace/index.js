// Main exports for EntityWorkspace system
export { default as EntityWorkspace } from "./EntityWorkspace.jsx";
export { default as EntityWorkspaceModern } from "./EntityWorkspaceModern.jsx";

// Export simplified interface components (DTO architecture stubs)
export { useGenericWorkspace } from "./interface/hooks/GenericStoreHook.js";
export { createGenericWorkspaceStore } from "./interface/stores/GenericWorkspaceStore.js";