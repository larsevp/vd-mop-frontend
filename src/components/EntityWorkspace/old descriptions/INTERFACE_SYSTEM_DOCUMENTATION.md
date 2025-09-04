# EntityWorkspace Interface System Documentation

## Overview

The EntityWorkspace Interface System is a modern, clean architecture for managing entity workspaces in the MOP application. It provides a unified way to display, search, filter, and manage different entity types (krav, tiltak, prosjektKrav, etc.) with consistent UI patterns and behavior.

## Architecture

### Core Components

```
EntityWorkspace (Pure wrapper)
└── EntityWorkspaceModern (Main implementation)
    ├── EntitySplitView (Draggable split layout)
    │   ├── EntityListPane (Left: Entity list with search)
    │   └── GenericEntityDetailPane (Right: Entity details)
    ├── SearchBar (Advanced search with filters)
    └── Debug Interface (Development debugging)
```

### Data Flow

```
ModelConfig → EntityTypeResolver → GenericWorkspaceStore → GenericDataHook → API → EntityWorkspaceAdapter → UI Components
```

## Component Hierarchy

### 1. EntityWorkspace.jsx
**Purpose**: Pure wrapper component that forwards all props
**Responsibility**: None - just passes props to EntityWorkspaceModern
**Props**: All props are forwarded unchanged

```jsx
// Usage
<EntityWorkspace
  entityType="krav"
  modelConfig={kravConfig}
  debug={true}
  workspaceConfig={{
    ui: { showStatus: true }
  }}
/>
```

### 2. EntityWorkspaceModern.jsx
**Purpose**: Main implementation with modern interface system
**Responsibilities**:
- Initialize workspace store
- Handle data loading
- Render split view layout
- Manage search and filtering
- Debug information display

**Key Props**:
- `entityType`: String identifier for the entity ('krav', 'tiltak', etc.)
- `modelConfig`: Configuration object (optional, resolved from entityType)
- `debug`: Boolean to enable debugging
- `workspaceConfig`: Workspace-specific overrides

**State Management**:
- Uses GenericWorkspaceStore via useGenericWorkspace hook
- Manages entities, loading, errors, search, filters
- Handles entity selection and focus

### 3. EntitySplitView.jsx
**Purpose**: Draggable split-pane layout (copied from main branch design)
**Features**:
- Draggable resizer bar between panels
- Collapsible left panel
- Persistent width/collapse state (localStorage)
- Responsive design

**Props**:
- `entities`: Array of entities to display
- `selectedEntity`: Currently selected entity
- `onEntitySelect`: Selection callback
- `renderListPane`: Function to render left pane
- `renderDetailPane`: Function to render right pane

### 4. SearchBar.jsx
**Purpose**: Advanced search with dropdown filters (copied from main branch)
**Features**:
- Text search with keyboard shortcuts
- Dropdown filter panel
- Sort options
- Status/vurdering filters
- Keyboard navigation (/ to focus, Escape to close)

**Modes**:
- `simple`: Basic search input
- `advanced`: Full search with filters dropdown

### 5. EntityListPane.jsx
**Purpose**: Entity list with proper row design
**Features**:
- Two-line entity rows
- Entity type badges for combined views
- Loading states
- View options menu
- Header with controls

## Interface System Architecture

### GenericWorkspaceStore.js
**Purpose**: Zustand store for workspace state
**State**:
```javascript
{
  entities: [],           // Current entity list
  loading: false,         // Loading state
  error: null,           // Error message
  searchQuery: '',       // Current search
  filters: {},           // Active filters
  selectedEntity: null,  // Selected entity
  pagination: {},        // Pagination info
}
```

**Actions**:
- `loadEntities()`: Load entities from API
- `setSearchInput(query)`: Update search
- `setFilters(filters)`: Update filters
- `setSelectedEntity(entity)`: Select entity

### GenericDataHook.js
**Purpose**: Data fetching with React Query integration
**Features**:
- Automatic query key generation
- Adapter-based response transformation
- Error handling with retry limits
- Project-aware API calls for prosjekt entities
- Caching and staletime management

**Special Handling**:
- Project entities (prosjekt-krav, prosjekt-tiltak) automatically get projectId from userStore
- Retry limit: 1 retry with 2-second delay
- No refetch on window focus or mount

### EntityWorkspaceAdapter.js
**Purpose**: Transform backend responses to standardized format
**Key Methods**:
- `transformResponse(rawData)`: Main transformation entry point
- `transformGroupedResponse(rawData)`: Handle emne-grouped data
- `transformEntity(entity)`: Transform individual entities
- `getQueryFunction(entityType)`: Get API function for entity type

**Critical Fix Applied**:
The adapter now **flattens grouped responses** instead of returning groups. This ensures entity rows are displayed instead of emne groups.

```javascript
// OLD (wrong): Return groups
return this.createStandardResponse(transformedGroups, rawData, true);

// NEW (correct): Flatten entities from all groups
const allEntities = [];
rawData.items.forEach(group => {
  const entities = this.extractEntitiesFromGroup(group);
  entities.forEach(entity => {
    const transformedEntity = this.transformEntity(entity);
    if (emne) {
      transformedEntity.emne = emne;
    }
    allEntities.push(transformedEntity);
  });
});
return this.createStandardResponse(allEntities, rawData, false);
```

### EntityTypeResolver.js
**Purpose**: Resolve entity configurations and capabilities
**Methods**:
- `resolveModelConfig(entityType)`: Get model configuration
- `supportsGroupByEmne(entityType)`: Check grouping support
- `getDisplayName(entityType)`: Get display name

## Data Loading Flow

1. **Initialization**: EntityWorkspaceModern creates GenericWorkspaceStore
2. **Hook Integration**: useGenericWorkspace connects store to data fetching
3. **API Resolution**: EntityTypeResolver gets queryFn from modelConfig
4. **Data Fetching**: GenericDataHook calls API with proper parameters
5. **Project Handling**: Project entities automatically include projectId
6. **Response Transform**: EntityWorkspaceAdapter flattens and transforms data
7. **State Update**: Store updates with transformed entities
8. **UI Render**: Components render with new data

## Error Handling

### API Errors
- 429 Too Many Requests: Limited to 1 retry with 2-second delay
- Missing projectId: Clear error message for project entities
- Network errors: Graceful degradation with error display

### User Feedback
- Loading states in debug bar and UI
- Error messages in debug panel
- Toast notifications for actions

## Debugging System

### Debug Bar (when debug={true})
Shows real-time information:
- Entity type and count
- Loading/error status
- Interface system status
- Detailed error messages

### Console Logging
- API call details and results
- State changes and actions
- Configuration resolution
- Error traces

## Model Configuration

### Required Structure
```javascript
export const krav = {
  queryKey: ["krav"],
  queryFn: getPaginatedKrav,                    // Main API function
  queryFnGroupedByEmne: getPaginatedKravGroupedByEmne,  // Grouped API (optional)
  modelPrintName: "krav",
  title: "Krav",
  
  workspace: {
    enabled: true,
    layout: "split",
    groupBy: "emne",
    
    features: {
      grouping: true,
      hierarchy: true,
      search: true,
      filters: true,
    },
    
    ui: {
      showMerknader: false,
      showStatus: true,
      showVurdering: true,
    }
  }
};
```

### API Function Signature
Standard entities:
```javascript
queryFn(page, pageSize, search, sortBy, sortOrder, filterBy, additionalFilters)
```

Project entities:
```javascript
queryFn(page, pageSize, search, sortBy, sortOrder, projectId)
```

## Entity Types Support

### Standard Entities
- `krav`: Requirements
- `tiltak`: Measures  
- `emne`: Subjects
- `status`: Status values
- `vurdering`: Assessment values

### Project Entities (require projectId)
- `prosjekt-krav`: Project-specific requirements
- `prosjekt-tiltak`: Project-specific measures

### Combined Entities
- `combined`: Mixed krav + tiltak view
- `prosjekt-combined`: Mixed prosjektKrav + prosjektTiltak view

## Usage Examples

### Basic Usage
```jsx
import { EntityWorkspace } from '@/components/EntityWorkspace';
import { krav as kravConfig } from '@/modelConfigs/models/krav';

<EntityWorkspace
  modelConfig={kravConfig}
  entityType="krav"
  debug={true}
/>
```

### With Workspace Config Override
```jsx
<EntityWorkspace
  modelConfig={kravConfig}
  entityType="krav"
  debug={true}
  workspaceConfig={{
    ui: {
      showMerknader: true,
      showStatus: false,
    }
  }}
/>
```

### Project Entity
```jsx
<EntityWorkspace
  modelConfig={prosjektKravConfig}
  entityType="prosjekt-krav"
  debug={true}
/>
```

## Migration from Legacy System

### What Was Removed
- EntityWorkspaceCore.jsx (543 lines)
- EntityWorkspace_Legacy.jsx (636 lines)
- CombinedEntityWorkspace.jsx (112 lines)
- Entire implementations/kravTiltak/ folder (~3000 lines)
- Complex state management and feature flags

### What's New
- Pure wrapper architecture
- Standardized adapter pattern
- Unified data loading
- Consistent error handling
- Draggable split view from main branch
- Advanced search from main branch
- Proper entity row design from main branch

### Performance Improvements
- 90% code reduction (6,757 lines removed, 845 added)
- Simplified state management
- Better caching with React Query
- Retry limits prevent API spam
- No unnecessary refetching

## Troubleshooting

### Common Issues

**No entities showing**:
1. Check debug bar for error messages
2. Verify modelConfig has correct queryFn
3. For project entities, ensure a project is selected
4. Check browser console for API errors

**429 Too Many Requests**:
- Fixed with retry limits and proper useEffect dependencies
- No longer causes infinite loops

**Debug bar not showing**:
- Ensure debug={true} is passed to EntityWorkspace
- Check browser console for "EntityWorkspaceModern Debug Check"

**Wrong entity types in combined views**:
- Check adapter's transformGroupedResponse method
- Verify entity.entityType is set correctly

### Debug Checklist

1. Is debug prop reaching EntityWorkspaceModern? (Check console)
2. Is modelConfig resolved correctly? (Check debug bar)
3. Is API function found? (Check debug logs)
4. For project entities: Is projectId available? (Check error messages)
5. Is adapter flattening entities correctly? (Check entity count vs group count)

## Future Enhancements

### Planned Features
- Bulk operations
- Advanced filtering UI
- Export functionality
- Real-time updates
- Offline support

### Architecture Improvements
- Enhanced caching strategies
- Background sync
- Optimistic updates
- Virtual scrolling for large lists

---

*This documentation covers the complete EntityWorkspace Interface System as implemented in the experiment/interface-refactoring branch.*