// Main exports for EntityWorkspace system
export { default as EntityWorkspace } from "./EntityWorkspace.jsx";
export { default as EntityWorkspaceCore } from "./EntityWorkspaceCore.jsx";

// Export refactored hooks
export { useEntityData } from "./hooks/useEntityData.js";
export { useEntityState } from "./hooks/useEntityState.js"; 
export { useEntityFiltering } from "./hooks/useEntityFiltering.js";
export { useEntityActions } from "./hooks/useEntityActions.js";
export { useEntityPermissions } from "./hooks/useEntityPermissions.js";

// Export services
export { EntityFilterService } from "./services/EntityFilterService.js";
export { EntityPermissionService } from "./services/EntityPermissionService.js";
export { EntityTypeResolver } from "./services/EntityTypeResolver.js";

// Re-export shared components for convenience
export * from "./shared";