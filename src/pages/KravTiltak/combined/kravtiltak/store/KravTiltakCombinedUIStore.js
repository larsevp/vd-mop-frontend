/**
 * KravTiltakCombinedUIStore - Workspace-scoped UI state store for KravTiltak Combined workspace
 *
 * Provides isolated UI state management for the combined KravTiltak workspace,
 * preventing cross-workspace contamination while maintaining reusable logic.
 */

import { createWorkspaceUIStore } from '@/components/EntityWorkspace/interface/stores/createWorkspaceUIStore';

/**
 * KravTiltak Combined workspace UI store instance
 * Handles selection, search, filters, and UI state for both Krav and Tiltak entities in combined view
 */
export const useKravTiltakCombinedUIStore = createWorkspaceUIStore('krav-tiltak-combined');

export default useKravTiltakCombinedUIStore;