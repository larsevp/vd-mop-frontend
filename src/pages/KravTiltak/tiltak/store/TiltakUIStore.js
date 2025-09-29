/**
 * TiltakUIStore - Workspace-scoped UI state store for Tiltak workspace
 *
 * Provides isolated UI state management for the Tiltak workspace,
 * preventing cross-workspace contamination while maintaining reusable logic.
 */

import { createWorkspaceUIStore } from '@/components/EntityWorkspace/interface/stores/createWorkspaceUIStore';

/**
 * Tiltak workspace UI store instance
 * Handles selection, search, filters, and UI state specific to Tiltak entities
 */
export const useTiltakUIStore = createWorkspaceUIStore('tiltak');

export default useTiltakUIStore;