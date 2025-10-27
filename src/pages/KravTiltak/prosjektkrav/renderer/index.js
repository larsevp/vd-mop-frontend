/**
 * ProsjektKrav renderer exports
 *
 * These functions are passed to EntityWorkspace to render ProsjektKrav-specific UI components
 */

export {
  renderEntityCard,
  renderGroupHeader,
  renderSearchBar,
  renderActionButtons,
  getAvailableViewOptions,
  getDefaultViewOptions,
} from "./ProsjektKravRenderer.jsx";

export { renderDetailPane } from "./ProsjektKravDetailRenderer.jsx";

// Export components for advanced usage
export { default as ProsjektKravCard } from "./components/ProsjektKravCard.jsx";
