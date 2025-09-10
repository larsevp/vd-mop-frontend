# ProsjektKrav EntityWorkspace Implementation

## Overview
This folder implements the ProsjektKrav entity using the clean EntityWorkspace architecture with render prop pattern.

## Architecture

### Core Components
- **`ProsjektKravWorkspace.jsx`** - Main workspace component that connects to EntityWorkspace
- **`adapter/ProsjektKravAdapter.js`** - Business logic layer for data normalization and filtering
- **`renderer/ProsjektKravRenderer.jsx`** - Render functions for cards and headers
- **`renderer/components/ProsjektKravCard.jsx`** - Specific card component with ProsjektKrav styling
- **`store/useProsjektKravViewStore.js`** - Zustand store for view options state

### How it connects to EntityWorkspace

1. **Configuration Flow**:
   ```
   ProsjektKravWorkspace → EntityWorkspace → EntityListPane → ProsjektKravCard
   ```

2. **Key Props Passed**:
   - `dto` - Single entity DTO with ProsjektKrav adapter
   - `renderEntityCard` - Function from ProsjektKravRenderer
   - `renderGroupHeader` - Shared EmneGroupHeader component
   - `viewOptions` - State from ProsjektKrav view store

3. **Data Flow**:
   ```
   API Response → DTO transforms → Adapter enhances → Renderer displays
   ```

### Render Prop Pattern
EntityWorkspace uses render props to keep domain logic separate:
- **Interface**: Handles generic list behavior, selection, loading
- **Domain**: Provides specific render functions and business logic

### Features
- Project-scoped requirements with automatic project filtering
- Grouping by emne (subject areas)
- Rich card display with status indicators and hierarchy
- Child/parent relationship visualization
- Responsive split-view layout with resizable panels

### View Options
Managed by `useProsjektKravViewStore`:
- `showHierarchy` - Parent/child relationships
- `showVurdering` - Assessment indicators
- `showStatus` - Status badges
- `showPrioritet` - Priority levels
- `showObligatorisk` - Required/optional indicators
- `showRelations` - Connected entities

This architecture ensures clean separation between generic interface logic and ProsjektKrav-specific presentation.