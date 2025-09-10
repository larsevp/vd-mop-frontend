# EntityWorkspace Interface Guide

## Architecture Overview

**EntityWorkspaceModern** is the unified interface for all entity workspaces, using a layered architecture with DTOs, state management, and pluggable adapters.

## Core Components

### 1. Data Layer (DTOs)
- **SingleEntityDTO**: Single entity type (krav, tiltak)
- **CombinedEntityDTO**: Multiple entity types (krav + tiltak)
- **CombinedEntitiesAdapter**: Backend-combined entities with hierarchy

### 2. State Management
- **StateHandler**: Unified state operations (workspace switching, cache clearing)
- **GenericWorkspaceStore**: Zustand store for entity data
- **GenericStoreHook**: React integration with loading/actions

### 3. Interface Layer
- **EntityWorkspaceModern**: Main component
- **EntityListPane**: Entity list with search/filters
- **EntitySplitView**: Split layout management

## KravTiltak Integration

### Single Entity Mode
```javascript
// krav/tiltak individually
<EntityWorkspaceModern 
  dto={new SingleEntityDTO('krav', kravAdapter)} 
/>
```

### Combined Mode
```javascript
// krav + tiltak combined
const combinedDTO = new CombinedEntityDTO([
  new SingleEntityDTO('krav', kravAdapter),
  new SingleEntityDTO('tiltak', tiltakAdapter)
]);

<EntityWorkspaceModern 
  dto={combinedDTO}
/>
```

### Backend Combined Mode
```javascript
// Server-side combined with hierarchy
<EntityWorkspaceModern 
  dto={new CombinedEntitiesAdapter()}
/>
```

## State Flow

1. **Registration**: Store registered with StateHandler on mount
2. **Switching**: StateHandler manages workspace transitions
   - Saves current state
   - Clears target workspace
   - Updates tracking
3. **Loading**: GenericStoreHook handles data fetching via DTO
4. **Updates**: Optimistic updates through store actions

## Configuration

### Model Config Structure (Barrel Pattern)
```
models/
├── krav/
│   ├── index.js          # Barrel export
│   ├── metadata.js       # Titles, descriptions
│   ├── queryFunctions.js # API endpoints  
│   ├── workspaceConfig.js# UI configuration
│   └── fields.js         # Form fields
```

### Workspace Config Features
- **Layout**: Split/full view options
- **Grouping**: Group by relationships (emne)
- **Filtering**: Search, status, priority filters
- **UI**: Show/hide various elements
- **Sections**: Organized form sections with field overrides

## Key Benefits

- **Unified Interface**: Same component for all entity types
- **Smart State**: Prevents cross-contamination between workspaces
- **Flexible DTOs**: Single/combined/backend modes
- **Norwegian Support**: Proper pluralization
- **Extensible**: Easy to add new entity types and state operations