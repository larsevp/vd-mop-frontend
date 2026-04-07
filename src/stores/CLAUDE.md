# Stores

## Zustand Stores

### userStore.js
- User auth state + project selection (persisted to localStorage)
- `id`, `rolle`, `navn`, `enhetId`, `fagomradeId`, `isManualLogin`
- `currentProject` — selected project context
- `fetchUserInfo()` — loads backend user data once
- Migration v3: force reset on auth change

### editingStateStore.js
- Tracks which entities are being edited (Set of IDs)
- Selector hooks: `useIsAnyEntityEditing()`, `useEditingCount()`
- Action hooks: `useEditingActions()` (non-reactive)

### navigationHistoryStore.js / recentProjectsStore.js
- Navigation and recent project tracking

## State Architecture
- **Zustand** — client UI state (user, project, editing, navigation)
- **TanStack Query** — server state (entity data, caching, refetching)
- **Hexagonal layer** (`/src/state/`) — EntityPort/WorkspacePort pattern exists but is dormant. Not actively used in current routing.
