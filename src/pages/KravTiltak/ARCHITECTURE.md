# KravTiltak and EntityWorkspace Architecture Analysis

## Executive Summary

This document provides a comprehensive analysis of the KravTiltak and EntityWorkspace architecture in the MOP frontend application. The architecture follows a **4-layer separation pattern** with strict architectural boundaries and dependency injection patterns that enable clean, maintainable, and testable code.

### Key Architectural Principles

1. **Layer Separation**: EntityWorkspace (generic interface) → DTO (interface contract) → Adapter (business logic) → Domain Renderers (UI components)
2. **Dependency Injection**: Domain-specific adapters and renderers are injected into generic EntityWorkspace
3. **Interface Contracts**: All components must implement specific interfaces to ensure compatibility
4. **Single Responsibility**: Each layer has a clear, distinct responsibility

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EntityWorkspace Layer                         │
│  - Generic interface component (EntityWorkspaceNew.jsx)             │
│  - UI state management and event handling                           │
│  - Completely domain-agnostic                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                          Uses via render props
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                           DTO Layer                                 │
│  - Interface contract and normalization (EntityDTOInterface.js)     │
│  - SingleEntityDTO / CombinedEntityDTO implementations             │
│  - Data transformation and UI state management                      │
│  - Handles scrolling, selection, and interface concerns            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                               Wraps and delegates
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                         Adapter Layer                              │
│  - Business logic and data processing                              │
│  - API integration and caching (TanStack Query)                    │
│  - Entity enhancement and filtering                                │
│  - Domain-specific business rules                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                              Used by (parallel)
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                        Renderer Layer                              │
│  - Domain-specific UI components                                   │
│  - Entity cards, detail panes, and forms                          │
│  - Uses both DTO and Adapter for complete functionality           │
│  - Injected into EntityWorkspace via render props                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. EntityWorkspace Layer (`/src/components/EntityWorkspace/`)

**Purpose**: Generic, reusable interface that works with any entity type

**Key Files**:
- `EntityWorkspaceNew.jsx` - Main workspace component
- `interface/hooks/useEntityData.js` - Data fetching hook
- `interface/hooks/useWorkspaceUI.js` - UI state management

**Responsibilities**:
- Render generic workspace layout (search, filters, pagination)
- Manage UI state (selection, search, filters)
- Handle CRUD events and delegate to DTO
- Provide render prop injection points for domain-specific UI
- Never directly call adapters - all operations go through DTO

**Key Rule**: `EntityWorkspace → DTO → Adapter` (never skip layers)

### 2. DTO Layer (`/src/components/EntityWorkspace/interface/data/`)

**Purpose**: Interface contract and data normalization layer

**Key Files**:
- `EntityDTOInterface.js` - Base interface contract
- `SingleEntityDTO.js` - Single entity implementation
- `CombinedEntityDTO.js` - Combined entity implementation
- `index.js` - Factory functions

**Responsibilities**:
- Implement EntityDTOInterface contract
- Normalize data structure and case (e.g., `entityType` always lowercase)
- Handle UI interactions (scrolling, selection after save)
- Transform API responses for EntityWorkspace consumption
- Delegate business logic to adapters
- Cache invalidation and state updates

**Interface Contract** (all DTOs must implement):
```javascript
class EntityDTOInterface {
  // Required properties
  get entityType() // Entity type string
  
  // Required methods
  transformResponse(rawData) // API response transformation
  save(entityData, isUpdate) // Save operations
  delete(entity) // Delete operations
  onSaveComplete(result, isCreate, handleEntitySelect, entityType) // Post-save hooks
  createNewEntity(entityType) // Create new entity structure
  getEntityType(entityData) // Detect entity type
  enhanceEntity(rawEntity) // Add computed fields
}
```

### 3. Adapter Layer (`/src/pages/KravTiltak/{entity}/adapter/`)

**Purpose**: Business logic, data processing, and API integration

**Key Files**:
- `ProsjektKravAdapter.js` - ProsjektKrav business logic
- `ProsjektTiltakAdapter.js` - ProsjektTiltak business logic  
- `ProsjektKravTiltakCombinedAdapter.js` - Combined business logic
- `ProsjektKravTiltakFlowAdapter.js` - Flow-specific processing

**Responsibilities**:
- API integration with TanStack Query
- Entity enhancement (adding computed fields)
- Filtering, sorting, and search logic
- Business rule enforcement
- Data validation and transformation
- CRUD operations through modelConfig
- Cache management

**Adapter Interface**:
```javascript
class EntityAdapter {
  getDisplayConfig() // UI configuration
  getFilterConfig() // Filter/sort configuration
  getQueryFunctions() // API functions
  enhanceEntity(entity) // Business logic enhancement
  filterEntities(entities, filters) // Business filtering
  extractUID(entity) // Entity identification
  save(entityData, isUpdate) // CRUD operations
  delete(entity) // Delete operations
}
```

### 4. Renderer Layer (`/src/pages/KravTiltak/{entity}/renderer/`)

**Purpose**: Domain-specific UI components

**Key Files**:
- `ProsjektKravRenderer.jsx` - ProsjektKrav card renderer
- `ProsjektKravDetailRenderer.jsx` - ProsjektKrav detail form
- `ProsjektTiltakRenderer.jsx` - ProsjektTiltak card renderer
- `CombinedRenderer.jsx` - Combined entity renderer factory

**Responsibilities**:
- Entity-specific card rendering
- Detail pane forms with modelConfig integration
- Validation and field presentation
- Entity-specific icons, colors, and styling
- Form submission and error handling

## Data Flow Patterns

### 1. Data Loading Flow
```
EntityWorkspace → useEntityData → DTO.loadData() → Adapter.getQueryFunctions() → API
                     ↓
EntityWorkspace ← transformResponse() ← DTO ← API Response ← Adapter
```

### 2. Save Operation Flow
```
DetailPane → onSave → EntityWorkspace.handleSave → DTO.save() → Adapter.save()
                                    ↓
EntityWorkspace.handleEntitySelect ← DTO.onSaveComplete() ← API Response
```

### 3. UI Rendering Flow
```
EntityWorkspace → render props → Domain Renderer → Uses DTO + Adapter
                     ↓
              Domain-specific UI components
```

## KravTiltak Domain Implementation

### Entity Types
The KravTiltak domain handles multiple entity types in a hierarchical structure:

```
Base Entities:
├── Krav (krav)
├── Tiltak (tiltak)  
├── ProsjektKrav (prosjektkrav) - extends Krav
└── ProsjektTiltak (prosjekttiltak) - extends Tiltak

Combined Views:
├── KravTiltak (krav + tiltak)
├── ProsjektKravTiltak (prosjektkrav + prosjekttiltak)
└── Flow View (visual relationship mapping)
```

### Folder Structure
```
src/pages/KravTiltak/
├── krav/                          # Base Krav entities
│   ├── adapter/KravAdapter.js
│   └── renderer/KravRenderer.jsx
├── tiltak/                        # Base Tiltak entities
│   ├── adapter/TiltakAdapter.js
│   └── renderer/TiltakRenderer.jsx
├── prosjektkrav/                  # Project-specific Krav
│   ├── adapter/ProsjektKravAdapter.js
│   └── renderer/ProsjektKravRenderer.jsx
├── prosjekttiltak/                # Project-specific Tiltak
│   ├── adapter/ProsjektTiltakAdapter.js
│   └── renderer/ProsjektTiltakRenderer.jsx
├── combined/                      # Combined entity views
│   ├── kravtiltak/               # Base combined view
│   ├── prosjektkravtiltak/       # Project combined view
│   └── shared/CombinedRenderer.jsx # Generic combined renderer factory
├── flow/                         # Flow visualization
│   ├── FlowWorkspace.jsx
│   ├── ProsjektKravTiltakFlowAdapter.js
│   └── flowDataTransformer.js
└── shared/                       # Shared components
    ├── components/EntityDetailPane/
    ├── components/EntityCard/
    └── utils/
```

### Combined Entity Pattern
Combined entities use a factory pattern to eliminate code duplication:

```javascript
// CombinedRenderer.jsx creates reusable renderer functions
const combinedRenderer = createCombinedRenderer({
  entityTypes: { primary: "prosjektkrav", secondary: "prosjekttiltak" },
  cardRenderers: { primaryCardRenderer, secondaryCardRenderer },
  renderers: { primaryDetailRenderer, secondaryDetailRenderer },
  labels: { primaryCreate: "Nytt krav", secondaryCreate: "Nytt tiltak" }
});

// Used in EntityWorkspace via render props
<EntityWorkspace
  dto={dto}
  renderEntityCard={combinedRenderer.renderEntityCard}
  renderDetailPane={combinedRenderer.renderDetailPane}
  renderActionButtons={combinedRenderer.renderActionButtons}
/>
```

## Flow Visualization Architecture

### Flow-Specific Components

**FlowWorkspace** (`/src/pages/KravTiltak/flow/FlowWorkspace.jsx`):
- React Flow integration for visual entity relationships
- Uses EntityWorkspace hooks for consistent data management
- Implements double-click modal pattern for entity details
- Node types: EmneFlowNode, KravFlowNode, TiltakFlowNode

**ProsjektKravTiltakFlowAdapter** (`/src/pages/KravTiltak/flow/ProsjektKravTiltakFlowAdapter.js`):
- Specialized adapter for flow visualization needs
- Processes hierarchical relationships between entities
- Handles parent-child entity relationships
- Provides flow-specific entity enhancement

**flowDataTransformer** (`/src/pages/KravTiltak/flow/flowDataTransformer.js`):
- Transforms flat entity data into React Flow nodes and edges
- Handles entity positioning and relationship mapping
- Manages node handle allocation for connection points
- Implements entity deduplication logic

### Flow Data Processing Pipeline
```
Raw API Data → FlowAdapter.loadData() → flowDataTransformer.transformToFlowData() → React Flow
                     ↓
              Entity deduplication
                     ↓
              Relationship mapping
                     ↓
              Node positioning
                     ↓
              Edge creation
```

## State Management and Caching

### TanStack Query Integration
The architecture uses TanStack Query for caching and state management:

```javascript
// In adapter
getQueryFunctions() {
  return {
    prosjektkrav: {
      standard: getPaginatedProsjektKrav,      // TanStack Query function
      grouped: getProsjektKravGroupedByEmne,  // TanStack Query function
    }
  };
}

// DTO uses these for data loading and cache invalidation
const { data, isLoading, error } = useEntityData(adapter, { searchQuery, filters });
```

### Cache Keys and Invalidation
- Each entity type has specific cache keys
- Save operations trigger cache invalidation
- Combined views aggregate multiple entity cache keys
- Flow views use specialized cache keys for relationship data

## ModelConfig Integration

The architecture integrates with the backend-driven modelConfig system:

### ModelConfig Structure
```javascript
// prosjektKrav modelConfig
{
  title: "Prosjektkrav",
  fields: { /* field definitions */ },
  workspace: {
    layout: "split",
    groupBy: "emne",
    detailForm: {
      rows: {
        "main": ["tittel", "beskrivelse"],
        "details": ["status", "prioritet"]
      }
    }
  },
  queryFn: getPaginatedProsjektKrav,
  createFn: createProsjektKrav,
  updateFn: updateProsjektKrav,
  deleteFn: deleteProsjektKrav
}
```

### ModelConfig Usage Pattern
```javascript
// Adapter wraps modelConfig
const adapter = createProsjektKravAdapter(prosjektKravConfig);

// DTO wraps adapter
const dto = createSingleEntityDTO(adapter);

// EntityWorkspace uses DTO
<EntityWorkspace dto={dto} renderDetailPane={renderer} />
```

## Best Flow DTO Implementation

Based on the architecture analysis, the optimal FlowDTO implementation should:

### 1. Extend CombinedEntityDTO
```javascript
class FlowEntityDTO extends CombinedEntityDTO {
  constructor(flowAdapter, options = {}) {
    super(flowAdapter, options);
    this.flowAdapter = flowAdapter; // Keep reference for flow-specific operations
  }
  
  // Override data loading for flow-specific needs
  async loadData(queryParams = {}) {
    // Use flow adapter's specialized data loading
    const rawData = await this.flowAdapter.loadFlowData(queryParams);
    return this.transformResponse(rawData);
  }
  
  // Add flow-specific methods
  getFlowRelationships() {
    return this.flowAdapter.getFlowRelationships();
  }
}
```

### 2. Implementation Strategy
- **Inherit from CombinedEntityDTO**: Reuse all interface methods and CRUD operations
- **Delegate to FlowAdapter**: Use FlowAdapter for flow-specific data processing
- **Maintain interface compliance**: All EntityDTOInterface methods work correctly
- **Preserve existing patterns**: Save/delete operations work through individual entity adapters

### 3. Flow-Specific Enhancements
- **Relationship mapping**: Handle parent-child entity relationships
- **Node positioning**: Calculate optimal node positions for visualization
- **Connection management**: Manage multiple connection handles per node
- **Entity deduplication**: Handle composite entity keys (entityType + ID)

### 4. Integration with FlowWorkspace
```javascript
// Create flow-specific DTO
const flowAdapter = createProsjektKravTiltakFlowAdapter();
const flowDTO = new FlowEntityDTO(flowAdapter);

// Use in FlowWorkspace with modal pattern
<FlowWorkspace
  flowAdapter={flowAdapter}
  dto={flowDTO}  // For save/delete operations in EntityDetailPane
  renderSearchBar={combinedRenderer.renderSearchBar}
  onFlowToggle={handleFlowToggle}
/>
```

## Key Architectural Benefits

1. **Separation of Concerns**: Each layer has a clear, single responsibility
2. **Testability**: Each layer can be tested in isolation
3. **Reusability**: Generic components work with any entity type
4. **Maintainability**: Changes are localized to specific layers
5. **Extensibility**: New entity types follow established patterns
6. **Industry Standard**: Follows established adapter and repository patterns

## Common Anti-Patterns to Avoid

1. **Layer Skipping**: Never call adapters directly from EntityWorkspace
2. **Mixed Responsibilities**: Don't put business logic in DTOs or UI logic in adapters
3. **Tight Coupling**: Components should depend on interfaces, not concrete implementations
4. **Data Mutation**: DTOs should transform, not mutate, data from adapters

This architecture demonstrates industry-standard practices for complex frontend applications, providing a clean, maintainable, and extensible foundation for entity management systems.