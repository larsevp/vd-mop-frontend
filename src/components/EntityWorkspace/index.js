// Main exports for EntityWorkspace system
export { default as EntityWorkspace } from "./EntityWorkspaceNew.jsx"; // Updated to use simple TanStack Query + Zustand approach
export { default as EntityWorkspaceNew } from "./EntityWorkspaceNew.jsx";

// Legacy exports (for backwards compatibility during transition)
export { default as EntityWorkspaceOld } from "./EntityWorkspace.jsx";
export { default as EntityWorkspaceModern } from "./EntityWorkspaceModern.jsx";

// New simple interface hooks  
export { useEntityData, useCombinedEntityData, useProjectEntityData } from "./interface/hooks/useEntityData.js";
export { useWorkspaceUI, useEntitySelection, useSearchFilters } from "./interface/hooks/useWorkspaceUI.js";