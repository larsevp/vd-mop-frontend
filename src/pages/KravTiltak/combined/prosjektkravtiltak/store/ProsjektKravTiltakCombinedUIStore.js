/**
 * ProsjektKravTiltakCombinedUIStore - Workspace-scoped UI state store for ProsjektKravTiltak Combined workspace
 *
 * Provides isolated UI state management for the combined ProsjektKravTiltak workspace,
 * preventing cross-workspace contamination while maintaining reusable logic.
 */

import { createWorkspaceUIStore } from '@/components/EntityWorkspace/interface/stores/createWorkspaceUIStore';

/**
 * ProsjektKravTiltak Combined workspace UI store instance
 * Handles selection, search, filters, and UI state for both ProsjektKrav and ProsjektTiltak entities in combined view
 */
export const useProsjektKravTiltakCombinedUIStore = createWorkspaceUIStore('prosjektKrav-prosjektTiltak-combined');

export default useProsjektKravTiltakCombinedUIStore;