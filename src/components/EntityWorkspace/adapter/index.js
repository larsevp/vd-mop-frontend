/**
 * EntityWorkspace Backend Adapters - Main Export
 * Provides clean API for all adapter functionality
 */

// Core exports
export { BaseAdapter } from './core/BaseAdapter.js';

// Model adapters
export { EntityWorkspaceAdapter } from './models/EntityWorkspaceAdapter.js';
export { SimpleAdapter } from './models/SimpleAdapter.js';

// Factory
export { AdapterFactory } from './AdapterFactory.js';

// Import dependencies for convenience functions
import { EntityWorkspaceAdapter } from './models/EntityWorkspaceAdapter.js';
import { SimpleAdapter } from './models/SimpleAdapter.js';
import { AdapterFactory } from './AdapterFactory.js';

// Convenience functions
export const createEntityWorkspaceAdapter = (entityType, config) => 
  new EntityWorkspaceAdapter(entityType, config);

export const createSimpleAdapter = (entityType, config) => 
  new SimpleAdapter(entityType, config);

export const createAdapter = (adapterType, entityType, config) => 
  AdapterFactory.create(adapterType, entityType, config);

export const createAdapterByEntityType = (entityType, config) => 
  AdapterFactory.createByEntityType(entityType, config);