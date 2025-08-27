# EntityWorkspace System

A generic, reusable workspace system for managing any entity type (Krav, Tiltak, Prosjekt, etc.) with consistent behavior and minimal code duplication.

## Overview

The EntityWorkspace system replaces entity-specific workspace components (like KravWorkspace, TiltakWorkspace) with a single, configurable component that can handle any entity type based on model configuration.

### Benefits

- **Dramatic code reduction**: 600+ lines → 15 lines per workspace
- **Consistency**: All entity workspaces behave identically
- **Maintainability**: Single source of truth for workspace logic
- **Flexibility**: Highly configurable per entity type
- **Testability**: Test once, works everywhere

## Architecture

```
EntityWorkspace/
├── EntityWorkspace.jsx          # Main workspace component
├── hooks/
│   ├── useEntityWorkspaceData.js    # Generic data fetching hook
│   └── useEntityWorkspaceActions.js # Generic CRUD operations hook
├── components/
│   └── EntityCardList.jsx       # Generic card list component (WIP)
├── shared/
│   ├── SearchBar.jsx           # Reusable search component
│   ├── EntityFilters.jsx       # Reusable filter component
│   ├── ViewOptionsMenu.jsx     # View configuration menu
│   ├── MerknadField.jsx        # Notes field component
│   └── UnifiedField.jsx        # Generic field component
└── index.js                    # Main exports
```

## Usage

### Basic Implementation

```jsx
import React from "react";
import { EntityWorkspace } from "@/components/EntityWorkspace";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";

const KravWorkspace = () => {
  return (
    <EntityWorkspace
      modelConfig={kravConfig}
      entityType="krav"
    />
  );
};
```

### With Custom Configuration

```jsx
const TiltakWorkspace = () => {
  return (
    <EntityWorkspace
      modelConfig={tiltakConfig}
      entityType="tiltak"
      workspaceConfig={{
        ui: {
          showMerknader: true,
          showStatus: false,
        },
        features: {
          bulkActions: true,
        }
      }}
    />
  );
};
```

## Configuration

The EntityWorkspace is configured through three layers (in order of precedence):

1. **Default Configuration**: Built-in defaults
2. **Model Configuration**: From `modelConfig.workspace`
3. **Component Props**: Via `workspaceConfig` prop

### Workspace Configuration Options

```js
{
  // Grouping configuration
  groupBy: "emne",                    // Field to group by
  
  // Feature flags
  features: {
    grouping: true,                   // Enable grouping toggle
    hierarchy: true,                  // Show parent/child relationships
    inlineEdit: true,                 // Enable inline editing
    search: true,                     // Show search bar
    filters: true,                    // Show filter controls
    bulkActions: false,               // Enable bulk operations
  },
  
  // UI configuration
  ui: {
    showMerknader: false,             // Show notes field
    showStatus: true,                 // Show status controls
    showVurdering: true,              // Show assessment controls
    showPrioritet: true,              // Show priority controls
  },
  
  // Card display configuration
  cardFields: ["id", "title", "desc"], // Fields to show on cards
  relationships: ["files", "lover"],   // Related entities to load
}
```

## Model Configuration Requirements

For EntityWorkspace to work with an entity, the model config must provide:

### Required Functions
```js
export const myEntityConfig = {
  // Data fetching
  queryFn: getPaginatedMyEntity,           // Standard paginated fetch
  queryFnAll: getPaginatedMyEntityAll,     // Fetch with all fields
  queryFnGroupedByEmne: getMyEntityGrouped, // Optional: grouped fetch
  getByIdFn: getMyEntityById,              // Fetch single entity
  
  // CRUD operations
  createFn: createMyEntity,                // Create new entity
  updateFn: updateMyEntity,                // Update existing entity
  deleteFn: deleteMyEntity,                // Delete entity
  
  // Display configuration
  title: "My Entity",                      // Display name
  newButtonLabel: "New My Entity",         // Create button text
  
  // Workspace configuration
  workspace: {
    enabled: true,                         // Enable workspace features
    groupBy: "emne",                       // Default grouping field
    features: { /* ... */ },              // Feature configuration
    ui: { /* ... */ },                    // UI configuration
    cardFields: ["id", "name"],            // Card display fields
    relationships: ["files"],              // Related data to load
  },
  
  // Field definitions
  fields: [ /* ... */ ]                   // Field configuration array
};
```

### API Function Signatures

The EntityWorkspace expects specific function signatures:

```js
// Paginated data fetching
queryFn(page, pageSize, searchQuery, sortBy, sortOrder) => Promise<{
  items: Array,
  totalCount: number,
  totalPages: number
}>

// Grouped data fetching (optional)
queryFnGroupedByEmne(page, pageSize, searchQuery, sortBy, sortOrder) => Promise<{
  items: Array<{
    emne: Object,
    [entityType]: Array  // e.g., krav: [...], tiltak: [...]
  }>,
  totalCount: number,
  totalPages: number
}>

// Single entity fetch
getByIdFn(id) => Promise<Entity>

// CRUD operations
createFn(entityData) => Promise<Entity>
updateFn(entityData) => Promise<Entity>
deleteFn(entityId) => Promise<void>
```

## Migration Guide

### From Legacy Workspace to EntityWorkspace

1. **Identify existing workspace component** (e.g., `KravWorkspace.jsx`)
2. **Create new workspace file** (e.g., `NewKravWorkspace.jsx`)
3. **Import EntityWorkspace and model config**
4. **Replace 600+ lines with EntityWorkspace component**
5. **Configure workspace behavior in model config**
6. **Test and validate behavior**
7. **Replace old component in routes**

### Example Migration

**Before (600+ lines):**
```jsx
const KravWorkspace = () => {
  // 50+ state variables
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  // ... 40+ more state variables
  
  // Complex data fetching logic
  const { data, isLoading } = useQuery(/* ... */);
  
  // Complex event handlers
  const handleSearch = useCallback(/* ... */);
  const handleFilter = useCallback(/* ... */);
  // ... 20+ more handlers
  
  // Complex render logic with conditionals
  return (
    <div>
      {/* 500+ lines of JSX */}
    </div>
  );
};
```

**After (15 lines):**
```jsx
const KravWorkspace = () => {
  return (
    <EntityWorkspace
      modelConfig={kravConfig}
      entityType="krav"
    />
  );
};
```

## Development Status

### ✅ Completed Components
- EntityWorkspace (main component)
- useEntityWorkspaceData hook
- useEntityWorkspaceActions hook
- SearchBar component
- EntityFilters component
- ViewOptionsMenu component

### 🚧 In Progress
- EntityCardList component (generic card rendering)
- Generic EntityCard component
- Bulk actions functionality

### 📋 TODO
- Migrate existing KravCard/TiltakCard logic to generic EntityCard
- Implement table view mode
- Add export functionality
- Performance optimizations for large datasets

## Testing

The EntityWorkspace system can be tested generically:

```js
// Test with any entity type
const testEntityWorkspace = (modelConfig, entityType) => {
  render(
    <EntityWorkspace 
      modelConfig={modelConfig} 
      entityType={entityType} 
    />
  );
  
  // Test generic functionality
  expect(screen.getByRole('searchbox')).toBeInTheDocument();
  expect(screen.getByText('Filter')).toBeInTheDocument();
  // ... generic tests work for all entities
};
```

## Performance Considerations

- Uses React Query for intelligent caching
- Implements pagination to handle large datasets
- Supports keep-previous-data for smooth transitions
- Optimistic updates for better UX
- Debounced search to avoid excessive API calls

## Future Enhancements

1. **Advanced filtering** with multiple criteria
2. **Bulk operations** for selected entities
3. **Export functionality** in multiple formats
4. **Real-time updates** via WebSocket integration
5. **Keyboard shortcuts** for power users
6. **Column customization** in table view
7. **Saved searches** and filters