/**
 * ProsjektKravUIStore - Workspace-scoped UI state store for ProsjektKrav workspace
 *
 * Provides isolated UI state management for the ProsjektKrav workspace,
 * preventing cross-workspace contamination while maintaining reusable logic.
 */

import { createWorkspaceUIStore } from '@/components/EntityWorkspace/interface/stores/createWorkspaceUIStore';

/**
 * ProsjektKrav workspace UI store instance
 * Handles selection, search, filters, and UI state specific to ProsjektKrav entities
 */
export const useProsjektKravUIStore = createWorkspaceUIStore('prosjektKrav');

export default useProsjektKravUIStore;