# EntityWorkspace Architecture

## Overview

The EntityWorkspace system follows a layered architecture that separates generic interface concerns from domain-specific business logic and rendering.

## Architecture Layers

### Layer 1: EntityWorkspace (Generic Interface)
**Location**: `/src/components/EntityWorkspace/`  
**Responsibility**: Generic UI orchestration and data flow

```javascript
<EntityWorkspaceNew 
  dto={dto}                                    // ← Interface contract
  renderEntityCard={renderer.renderEntityCard}         // ← Domain rendering
  renderDetailPane={renderer.renderDetailPane}         // ← Domain rendering  
  renderActionButtons={renderer.renderActionButtons}   // ← Domain rendering
  renderSearchBar={renderer.renderSearchBar}           // ← Domain rendering
/>
```

**What it does**:
- Manages UI state (search, filters, selection)
- Calls DTO methods for data operations
- Delegates rendering to domain-specific renderers
- Handles generic interface interactions

**What it does NOT do**:
- Domain-specific business logic
- Direct adapter calls
- Entity-specific rendering
- Case normalization (delegates to DTO)

### Layer 2: DTO (Interface Contract)
**Location**: `/src/components/EntityWorkspace/interface/data/`  
**Responsibility**: Interface normalization and contract enforcement

```javascript
// DTO wraps adapter and provides normalized interface
const dto = createCombinedEntityDTO(adapter, { debug: true });
```

**What it does**:
- Normalizes data (case, structure) for UI consistency
- Implements required interface methods (`save`, `delete`, `getEntityType`, etc.)
- Enhances raw entities with UI metadata
- Handles post-operation interface concerns (selection, scrolling)
- Provides consistent API to EntityWorkspace

**What it does NOT do**:
- Domain-specific business logic
- Direct API calls (delegates to adapter)
- Domain-specific UI rendering

### Layer 3: Adapter (Data Management)
**Location**: `/src/pages/KravTiltak/*/adapter/`  
**Responsibility**: Data operations and business rules

```javascript
// Adapter handles API calls and business logic
const adapter = createKravTiltakCombinedAdapter({ debug: true });
```

**What it does**:
- API calls and data fetching
- Business rules and validation
- Raw data transformation
- Entity type detection (raw)
- Domain-specific post-save business logic

**What it does NOT do**:
- UI concerns (scrolling, selection)
- Case normalization (raw data only)
- Generic interface operations

### Layer 4: Renderer (Domain-Specific UI)
**Location**: `/src/pages/KravTiltak/*/renderer/`  
**Responsibility**: Domain-specific rendering logic

```javascript
// Domain creates its own rendering layer
const renderer = createCombinedRenderer({
  renderers: {
    primaryDetailRenderer: KravDetailRenderer,    // ← Domain-specific
    secondaryDetailRenderer: TiltakDetailRenderer // ← Domain-specific  
  },
  adapters: {
    primaryAdapter: createKravAdapter(kravConfig),     // ← Domain configs
    secondaryAdapter: createTiltakAdapter(tiltakConfig) // ← Domain configs
  }
});
```

**What it does**:
- Domain-specific UI components
- Entity-specific rendering logic
- Domain-specific user interactions
- Uses both DTO (for normalized data) and Adapter (for domain configs)

**What it does NOT do**:
- Generic interface operations
- Data normalization
- API calls

## Data Flow

### Read Operations
```
EntityWorkspace → DTO → Adapter → API
                ↓
EntityWorkspace ← DTO ← Adapter ← API Response
                ↓
EntityWorkspace → Renderer → Domain UI Components
```

### Write Operations  
```
Domain UI → EntityWorkspace → DTO → Adapter → API
                                ↓
EntityWorkspace ← DTO.onSaveComplete(normalized entity)
                ↓  
EntityWorkspace → handleEntitySelect(enhanced entity)
```

## Key Principles

### 1. Separation of Concerns
- **EntityWorkspace**: Generic interface orchestration
- **DTO**: Interface normalization and contracts
- **Adapter**: Data and business logic
- **Renderer**: Domain-specific UI

### 2. Dependency Direction
```
EntityWorkspace depends on DTO
DTO depends on Adapter  
Renderer depends on both DTO and Adapter
```

### 3. Interface Boundaries
- **EntityWorkspace ↔ DTO**: Standardized interface methods
- **DTO ↔ Adapter**: Business logic delegation
- **EntityWorkspace ↔ Renderer**: Render prop pattern

### 4. Data Normalization
- **Raw Data**: Adapter returns as-is from API
- **Normalized Data**: DTO handles case normalization, UI metadata
- **Enhanced Data**: DTO provides consistent structure to UI

## Architecture Benefits

### ✅ Scalability
- New domains can plug into existing EntityWorkspace
- Generic interface handles all common operations
- Domain-specific rendering isolated from interface

### ✅ Maintainability  
- Clear separation of concerns
- Single source of truth for normalization (DTO)
- Business logic isolated in adapters

### ✅ Reusability
- EntityWorkspace works with any domain
- DTOs provide consistent interface
- Renderers can be composed and reused

### ✅ Testability
- Each layer can be tested independently
- Clear contracts between layers
- Business logic separated from UI

## Common Anti-Patterns

### ❌ DTO handling domain UI
```javascript
// WRONG - DTO should not handle scrolling
dto.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
```

### ❌ Adapter handling interface normalization
```javascript
// WRONG - Adapter should return raw data
adapter.enhanceEntity(entity).entityType = entityType.toLowerCase();
```

### ❌ EntityWorkspace calling adapter directly
```javascript  
// WRONG - Should go through DTO
const result = adapter.save(entityData);
```

### ✅ Correct Patterns

```javascript
// EntityWorkspace uses DTO
const result = await dto.save(entityData, isUpdate);

// DTO normalizes and delegates
async save(entityData, isUpdate) {
  const normalized = this.normalizeEntityData(entityData);
  return await this.adapter.save(normalized, isUpdate);
}

// Renderer uses both DTO and domain adapters
const renderer = createCombinedRenderer({
  adapters: { primaryAdapter, secondaryAdapter } // Domain configs
});
```

## Summary

This architecture provides a clean separation between:
1. **Generic interface concerns** (EntityWorkspace + DTO)
2. **Domain-specific business logic** (Adapter)  
3. **Domain-specific rendering** (Renderer)

Each layer has clear responsibilities and dependencies flow in one direction, making the system maintainable, testable, and scalable.