/**
 * ProsjektKrav - Complete entity workspace exports
 * 
 * This module provides everything needed for ProsjektKrav workspace:
 * - Main workspace component
 * - Data adapter for API integration
 * - Renderer functions for UI
 * - View options store
 */

// Main workspace component
export { default as ProsjektKravWorkspace } from './ProsjektKravWorkspace.jsx';

// Data layer
export * from './adapter';

// Presentation layer
export * from './renderer';

// State management
export * from './store';

// Default export - main workspace
export { default } from './ProsjektKravWorkspace.jsx';