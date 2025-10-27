/**
 * ProsjektTiltakUIStore - Workspace-scoped UI state store for ProsjektTiltak workspace
 *
 * Provides isolated UI state management for the ProsjektTiltak workspace,
 * preventing cross-workspace contamination while maintaining reusable logic.
 */

import { createWorkspaceUIStore } from '@/components/EntityWorkspace/interface/stores/createWorkspaceUIStore';

/**
 * ProsjektTiltak workspace UI store instance
 * Handles selection, search, filters, and UI state specific to ProsjektTiltak entities
 */
export const useProsjektTiltakUIStore = createWorkspaceUIStore('prosjektTiltak');

export default useProsjektTiltakUIStore;
