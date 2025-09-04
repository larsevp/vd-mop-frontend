# Legacy Complex State Management

This folder contains the complex state management files that were replaced by the simple TanStack Query + Zustand approach.

## Files moved here:

- **StateHandler.js** - Complex unified state handler with command patterns
- **WorkspaceStateManager.js** - Centralized workspace state manager
- **GenericStoreHook.js** - Generic store hook wrapper

## Replacement:

These complex files were replaced with:
- `interface/hooks/useEntityData.js` - TanStack Query for server state
- `interface/hooks/useWorkspaceUI.js` - Simple UI state hook
- `interface/stores/workspaceUIStore.js` - Simple Zustand UI store

## Reason for change:

The complex architecture was causing infinite re-render loops due to unstable dependencies and over-engineering. The new approach follows industry standards:
- TanStack Query for server state management
- Zustand for simple UI state management
- Separation of concerns between server and UI state

These files are kept for reference but should not be used in the new implementation.