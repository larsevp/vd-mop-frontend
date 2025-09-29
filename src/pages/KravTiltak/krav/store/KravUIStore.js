/**
 * KravUIStore - Workspace-scoped UI state store for Krav workspace
 *
 * Provides isolated UI state management for the Krav workspace,
 * preventing cross-workspace contamination while maintaining reusable logic.
 */

import { createWorkspaceUIStore } from '@/components/EntityWorkspace/interface/stores/createWorkspaceUIStore';

/**
 * Krav workspace UI store instance
 * Handles selection, search, filters, and UI state specific to Krav entities
 */
export const useKravUIStore = createWorkspaceUIStore('krav');

export default useKravUIStore;