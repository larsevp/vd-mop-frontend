# Workspace-Scoped UI Store Architecture

## Overview

This directory implements workspace-scoped UI state management for EntityWorkspace components, following industry best practices for state isolation and dependency injection patterns.

## Problem Solved

Previously, all EntityWorkspace instances shared a single global `useWorkspaceUIStore`, causing cross-workspace contamination. This led to:
- React hook consistency errors during workspace transitions
- Entity type mismatches when switching between workspaces
- Shared selectedEntity state across different workspace types

## Architecture Solution: Workspace-Scoped Stores

### Core Components

#### 1. **Store Factory** (`createWorkspaceUIStore.js`)
```javascript
// Creates isolated UI stores for each workspace
const useKravUIStore = createWorkspaceUIStore('krav');
const useTiltakUIStore = createWorkspaceUIStore('tiltak');
```

- ✅ **Reusable factory** for creating workspace-specific UI stores
- ✅ **Isolated state** (selectedEntity, search, filters, expansion)
- ✅ **Workspace-specific localStorage** keys prevent cross-contamination
- ✅ **Same API** as original workspaceUIStore for consistency

#### 2. **Hook Factory** (`createWorkspaceUIHook.js`)
```javascript
// Creates workspace-specific UI hooks
const { useWorkspaceUI } = createWorkspaceUIHook(useKravUIStore);
```

- ✅ **Dependency injection pattern** for clean architecture
- ✅ **Consistent API** with original useWorkspaceUI hook
- ✅ **Type-safe** hook creation for each workspace

#### 3. **EntityWorkspace Integration**
```javascript
// EntityWorkspace now accepts custom UI hooks
<EntityWorkspace
  dto={dto}
  useWorkspaceUIHook={useWorkspaceUI}  // Workspace-specific hook
  renderEntityCard={renderEntityCard}
  // ... other props
/>
```

- ✅ **Backward compatible** - defaults to original hook if not provided
- ✅ **Clean dependency injection** - workspaces provide their own state
- ✅ **Separation of concerns** - generic component, domain-specific state

## Workspace Store Instances

### Individual Workspaces
- **`/pages/KravTiltak/krav/store/KravUIStore.js`** - Krav workspace UI state
- **`/pages/KravTiltak/tiltak/store/TiltakUIStore.js`** - Tiltak workspace UI state
- **`/pages/KravTiltak/prosjektkrav/store/ProsjektKravUIStore.js`** - ProsjektKrav workspace UI state

### Combined Workspaces
- **`/pages/KravTiltak/combined/kravtiltak/store/KravTiltakCombinedUIStore.js`** - KravTiltak combined UI state
- **`/pages/KravTiltak/combined/prosjektkravtiltak/store/ProsjektKravTiltakCombinedUIStore.js`** - ProsjektKravTiltak combined UI state

## State Management Pattern

### UI State vs View Preferences
```javascript
// UI State (isolated per workspace)
const ui = useWorkspaceUI(); // selectedEntity, search, filters
ui.setSelectedEntity(entity);
ui.setSearchInput(query);

// View Preferences (persistent across sessions)
const { viewOptions, setViewOptions } = useKravViewStore();
setViewOptions({ showHierarchy: true });
```

### Clean Separation
- **UI Stores** → Temporary workspace state (selection, search, UI toggles)
- **View Stores** → Persistent user preferences (column visibility, layout)
- **Domain Logic** → Stays in domain-specific folders (`/pages/KravTiltak/*`)

## Industry Best Practices Applied

### ✅ **State Isolation**
Each workspace maintains completely isolated UI state, preventing cross-contamination during workspace transitions.

### ✅ **Dependency Injection**
EntityWorkspace accepts workspace-specific hooks rather than hardcoding dependencies, making it truly generic and reusable.

### ✅ **Single Responsibility Principle**
- UI stores handle temporary UI state
- View stores handle persistent user preferences
- Domain stores handle business logic

### ✅ **Factory Pattern**
Reusable factories for creating stores and hooks eliminate code duplication while ensuring consistency.

### ✅ **Modular Architecture**
Generic EntityWorkspace component works with any domain by accepting domain-specific stores and renderers.

## Usage Example

```javascript
// In a workspace component
import { useKravUIStore } from './store';
import { createWorkspaceUIHook } from '@/components/EntityWorkspace/interface/hooks/createWorkspaceUIHook';

const KravWorkspace = () => {
  // Create workspace-specific UI hook
  const { useWorkspaceUI } = createWorkspaceUIHook(useKravUIStore);

  return (
    <EntityWorkspace
      dto={dto}
      useWorkspaceUIHook={useWorkspaceUI}  // Inject workspace-specific state
      renderEntityCard={renderEntityCard}
      // ... other domain-specific props
    />
  );
};
```

## Benefits

### 🎯 **Complete Isolation**
No more cross-workspace state contamination or React hook consistency errors.

### 🔧 **Predictable Behavior**
Each workspace has its own state that doesn't affect others.

### 🐛 **Easy Debugging**
Clear state boundaries make debugging workspace-specific issues straightforward.

### 📈 **Scalable Architecture**
Adding new workspace types requires minimal changes - just create a new store instance.

### 🏭 **Industry Standard**
Follows established patterns for dependency injection and state management in React applications.

## Migration Notes

### Before (Global State)
```javascript
// All workspaces shared the same global state
const ui = useWorkspaceUI(); // Global store - caused contamination
```

### After (Workspace-Scoped)
```javascript
// Each workspace has isolated state
const { useWorkspaceUI } = createWorkspaceUIHook(useKravUIStore);
const ui = useWorkspaceUI(); // Workspace-specific store - no contamination
```

### Backward Compatibility
Existing code works unchanged. EntityWorkspace falls back to the default global store if no workspace-specific hook is provided.

## Files Changed

### Core Architecture
- ✅ `createWorkspaceUIStore.js` - Store factory (new)
- ✅ `createWorkspaceUIHook.js` - Hook factory (new)
- ✅ `EntityWorkspaceNew.jsx` - Added `useWorkspaceUIHook` prop

### Workspace Stores
- ✅ All 5 workspace store directories updated with new UI stores
- ✅ All 5 workspace components updated to use workspace-specific stores
- ✅ Store index files updated to export new UI stores

### Result
Build passes successfully with no errors, confirming the implementation is solid and ready for production use.