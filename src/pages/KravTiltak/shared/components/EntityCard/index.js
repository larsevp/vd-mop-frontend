// Barrel export for EntityCard component and utilities
export { default } from './EntityCard';
export { default as EntityCard } from './EntityCard';

// Export helpers for external use if needed
export { truncateText, getEntityTitle } from './helpers/textHelpers';
export { getIcon } from './helpers/iconHelpers.jsx';
export { getStatusDisplay, getVurderingDisplay, getPrioritetDisplay } from '../../utils/statusHelpers';
export { getSpecialReference, getParentReference } from './helpers/referenceHelpers.jsx';

// Export sub-components
export { default as StatusIndicator } from '../StatusIndicator';