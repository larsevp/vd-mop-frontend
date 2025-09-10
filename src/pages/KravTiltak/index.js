// Main exports for KravTiltak module
//export { default as KravWorkspace } from "./Old/Krav_old/old/KravWorkspace.jsx";
//export { default as TiltakWorkspace } from "./Old/Tiltak_old/Old/TiltakWorkspace.jsx";

// Individual entity workspaces
export { default as KravWorkspace } from "./krav/KravWorkspace.jsx";
export { default as TiltakWorkspace } from "./tiltak/TiltakWorkspace.jsx";
export { default as ProsjektKravWorkspace } from "./prosjektkrav/ProsjektKravWorkspace.jsx";
export { default as ProsjektTiltakWorkspace } from "./prosjekttiltak/ProsjektTiltakWorkspace.jsx";

// Combined entity workspaces
export { KravTiltakCombinedWorkspace, ProsjektKravTiltakCombinedWorkspace } from "./combined";

// Shared components
export { RowListHeading, EmneGroupHeader, EntityDetailPane, EntityCard } from "./shared";
