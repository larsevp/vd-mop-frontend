// Main exports for EntityWorkspace system
export { default as EntityWorkspace } from "./EntityWorkspaceNew.jsx";

// Simple interface hooks  
export { useEntityData, useCombinedEntityData, useProjectEntityData } from "./interface/hooks/useEntityData.js";
export { useWorkspaceUI, useEntitySelection, useSearchFilters } from "./interface/hooks/useWorkspaceUI.js";