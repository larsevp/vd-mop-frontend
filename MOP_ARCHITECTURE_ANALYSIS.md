# MOP Project Architecture Analysis

## Executive Summary

The MOP project demonstrates a sophisticated, layered architecture that separates concerns between generic UI orchestration, data management, domain-specific business logic, and rendering. The system uses a **4-layer pattern with clean dependency flow** where each layer has well-defined responsibilities and minimal coupling.

---

## 1. EntityWorkspace Pattern: The Generic Interface Layer

### Overview
**EntityWorkspace** is a generic, reusable interface component that provides a unified CRUD interface for ANY entity type (Krav, Tiltak, ProsjektKrav, ProsjektTiltak, etc.). It's completely agnostic to domain-specific logic.

**Location**: `/src/components/EntityWorkspace/`

### Architecture Layers (4-Layer Pattern)

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: EntityWorkspace (Generic Interface)            │
│  - Manages: UI state (search, filters, selection)        │
│  - Orchestrates: data flow between layers                │
│  - Delegates: rendering to domain-specific renderers     │
│  - Uses: DTO interface (never calls adapter directly)    │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 2: DTO (Data Transfer Object)                     │
│  - Normalizes: case, structure (lowercase entityType)    │
│  - Implements: EntityDTOInterface contract               │
│  - Delegates: business logic to Adapter                  │
│  - Handles: UI concerns (selection, scrolling)           │
│  - Single source of truth for data consistency           │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Adapter (Business Logic & API)                 │
│  - Manages: API calls, data fetching                     │
│  - Implements: business rules, validation                │
│  - Returns: raw data (NOT normalized)                    │
│  - Provides: domain-specific post-save hooks             │
│  - Never: handles UI concerns (scrolling, selection)     │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Renderer (Domain-Specific UI)                  │
│  - Renders: entity cards, detail forms                   │
│  - Uses: both DTO (normalized data) and Adapter (configs)│
│  - Implements: domain-specific interactions              │
│  - Never: handles generic interface operations           │
└─────────────────────────────────────────────────────────┘
```

### Key Design Principle: Data Flow

**Read Operations**:
```
EntityWorkspace → DTO → Adapter → API
      ↓
EntityWorkspace ← (normalized data) ← DTO ← Adapter ← API Response
      ↓
Renderer → Display on UI
```

**Write Operations**:
```
Domain UI (Renderer) → EntityWorkspace → DTO → Adapter → API
                              ↓
                    DTO normalizes response
                              ↓
                    EntityWorkspace selects entity
                              ↓
                    UI reflects changes
```

---

## 2. Form Management & Control Patterns

### Form Strategy: Controlled Components with modelConfig

The project uses **controlled components** (React state-managed forms) with field definitions from **modelConfig**.

**Key Files**:
- `/src/pages/KravTiltak/shared/components/EntityDetailPane/EntityDetailPane.jsx` - Main form component
- `/src/pages/KravTiltak/shared/components/EntityDetailPane/helpers/useEntityForm.js` - Form state hook
- `/src/modelConfigs/models/krav/fields.js` - Field definitions

### Form Data Management Pattern

```javascript
// 1. Initialize form from entity + modelConfig
const formData = initializeFormData(allFields, entity, modelName);

// 2. Store in component state
const [formData, setFormData] = useState({});

// 3. Controlled input changes
const handleFieldChange = (fieldName, value) => {
  setFormData(prev => ({ ...prev, [fieldName]: value }));
};

// 4. Validation on submit
const validateForm = (visibleFields, formData) => {
  // Validates against field.required and custom rules
};

// 5. Save through modelConfig or DTO
const result = onSave ? 
  onSave(formData, isUpdate) :  // Use passed handler (DTO.save)
  modelConfig.updateFn(id, formData);  // Or fallback to modelConfig
```

### NOT Using React Hook Form or Formik

The project **deliberately avoids** form libraries (React Hook Form, Formik) because:
1. **Simplicity**: modelConfig fields are already well-structured
2. **Control**: Easy validation hooks into FieldResolver
3. **Integration**: Works seamlessly with EntityWorkspace DTO pattern

### Field Configuration Structure

```javascript
{
  name: "tittel",
  label: "Tittel",
  type: "text",           // Resolved by FieldResolver
  required: true,
  placeholder: "...",
  field_info: "...",
  hiddenEdit: false,      // Hidden in edit mode
  hiddenIndex: false,     // Hidden in list view
  disabled: false,
  order: 1,
  section: "main"         // Which section in detail pane
}
```

### Field Resolution Pipeline

The **FieldResolver** maps field definitions to React components:

```javascript
FieldResolver.getFieldComponent(field, modelName)
  1. Check model-specific field name override
  2. Check model-specific field type override  
  3. Check global entity field type (emneselect, statusselect, etc.)
  4. Check basic field type (text, number, bool, etc.)
  5. Fallback to text input
```

**Resolved Components** exist in:
- `/src/components/tableComponents/fieldTypes/basicTypes.jsx` - Text, number, bool, select
- `/src/components/tableComponents/fieldTypes/entityTypes.jsx` - Dropdowns, multiselects
- `/src/components/tableComponents/fieldTypes/modelSpecific.jsx` - Model-specific renderers

---

## 3. State Management Architecture

### Three-Tier State Strategy

#### Tier 1: Server State (TanStack Query)
Manages: API data, caching, synchronization
```javascript
const { data, isLoading, error, refetch } = useEntityData(dto, {
  searchQuery, filters, enabled
});
```

#### Tier 2: UI State (Zustand - Simple)
Manages: search input, selected entities, view mode
```javascript
// Simple Zustand store - UI only, never touches server state
export const useWorkspaceUIStore = create((set) => ({
  selectedEntity: null,
  searchInput: '',
  viewMode: 'split',
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  // ... other UI actions
}));
```

#### Tier 3: Domain State (Zustand - Inheritance)
Manages: Cross-workspace inheritance (emne inheritance between krav/tiltak)
```javascript
// Separate stores per workspace - complete isolation
export const useKravTiltakInheritanceStore = createInheritanceStore(
  'tiltak',      // Parent type
  'krav',        // Related entity type
  'tiltak'       // Fallback source type
);

export const useProsjektKravTiltakInheritanceStore = createInheritanceStore(
  'prosjektTiltak',
  'prosjektKrav',
  'prosjektTiltak'
);
```

### NO Complex State Pattern

The project **explicitly avoids**:
- Redux or Redux Toolkit
- Complex nested store hierarchies
- Global application state management

**Why**: TanStack Query + minimal Zustand handles everything needed

### Key Stores

**File**: `/src/stores/formInheritanceStore.js`

```javascript
// Factory pattern eliminates duplication
const createInheritanceStore = (parentType, relatedType, fallbackSourceType) => {
  return create((set, get) => ({
    inheritedEmne: null,
    source: null,           // 'parent' | 'krav' | null
    sourceType: null,       // Which entity type this inheritance is from
    parentData: null,
    relatedEntityData: null,
    
    setParentInheritance: (data, type) => { /* ... */ },
    setRelatedEntityInheritance: (data, type) => { /* ... */ },
    clearParentConnection: () => { /* ... */ },
    // ... other actions
  }));
};
```

---

## 4. Zustand Store Pattern

### UIStore (Workbench)

**File**: `/src/components/EntityWorkspace/interface/stores/workspaceUIStore.js`

```javascript
// Single unified UI state store for EntityWorkspace
export const useWorkspaceUIStore = create(
  devtools((set, get) => ({
    // Selection state
    selectedEntity: null,
    selectedEntities: new Set(),
    
    // Search & filter
    searchInput: '',
    activeSearchQuery: '',
    filters: { filterBy, sortBy, sortOrder, additionalFilters },
    
    // UI state
    viewMode: 'split',  // Persisted to localStorage
    showFilters: false,
    
    // Actions (all simple setters)
    setSelectedEntity: (entity) => set({ selectedEntity: entity }),
    setViewMode: (mode) => {
      localStorage.setItem('entityWorkspace-viewMode', mode);
      set({ viewMode: mode });
    },
    // ... 20+ simple action methods
  }))
);
```

**Characteristics**:
- Single responsibility: UI state only
- No async operations
- Persists viewMode to localStorage
- Used by all EntityWorkspace instances

---

## 5. KravTiltak Implementation Pattern

### Overview
KravTiltak is the **reference implementation** of how to use EntityWorkspace with a combined entity type (Krav + Tiltak).

**File Structure**:
```
/src/pages/KravTiltak/
├── combined/
│   ├── kravtiltak/
│   │   ├── adapter/
│   │   │   └── KravTiltakCombinedAdapter.js    (Business logic)
│   │   ├── renderer/
│   │   │   └── KravTiltakCombinedRenderer.jsx  (UI components)
│   │   ├── store/
│   │   │   ├── KravTiltakCombinedViewStore.js
│   │   │   └── KravTiltakCombinedUIStore.js
│   │   └── KravTiltakCombinedWorkspace.jsx     (Main page)
│   └── prosjektkravtiltak/
│       └── ... (same pattern)
├── krav/
│   ├── adapter/KravAdapter.js
│   ├── renderer/KravDetailRenderer.jsx
│   ├── store/
│   └── KravWorkspace.jsx
├── tiltak/
│   └── ... (same pattern)
└── shared/
    ├── components/
    │   ├── EntityDetailPane/    (Shared form component)
    │   └── EntityCard/
    └── utils/
```

### KravTiltakCombinedAdapter - Bridge Layer

**File**: `/src/pages/KravTiltak/combined/kravtiltak/adapter/KravTiltakCombinedAdapter.js`

The adapter is the **smart router** that knows how to:
1. Detect entity type dynamically
2. Delegate to individual adapters (KravAdapter, TiltakAdapter)
3. Apply business rules per entity type

```javascript
export class KravTiltakCombinedAdapter {
  constructor(options) {
    this.kravAdapter = createKravAdapter(kravConfig);
    this.tiltakAdapter = createTiltakAdapter(tiltakConfig);
  }

  // 1. Entity type detection
  detectEntityType(rawEntity) {
    if (rawEntity?.kravUID) return 'krav';
    if (rawEntity?.tiltakUID) return 'tiltak';
    // ... fallback detection
  }

  // 2. Business logic delegation
  async save(entityData, isUpdate) {
    const entityType = this.detectEntityType(entityData);
    
    if (entityType === 'krav' && this.kravAdapter?.config) {
      return isUpdate ? 
        this.kravAdapter.config.updateFn(data.id, data) :
        this.kravAdapter.config.createFn(data);
    }
    
    if (entityType === 'tiltak' && this.tiltakAdapter?.config) {
      // ... same pattern
    }
  }

  // 3. Post-save domain logic
  onSaveComplete(result, isCreate, handleEntitySelect, entityType) {
    // Delegate to specific adapter for domain business logic
    if (entityType === 'krav' && this.kravAdapter?.onSaveComplete) {
      this.kravAdapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
    }
    // Add combined-specific business logic here
  }
}
```

### DTO Layer - CombinedEntityDTO

**File**: `/src/components/EntityWorkspace/interface/data/CombinedEntityDTO.js`

Wraps the adapter and provides the standardized interface:

```javascript
export class CombinedEntityDTO extends EntityDTOInterface {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.entityTypes = adapter.getDisplayConfig().entityTypes;
  }

  // DTO responsibility: Normalize entity type (ALWAYS lowercase)
  enhanceEntity(rawEntity) {
    let enhanced = this.adapter.enhanceEntity(rawEntity);
    
    // CRITICAL: DTO enforces normalization (single source of truth)
    if (enhanced?.entityType) {
      enhanced.entityType = enhanced.entityType.toLowerCase();
      enhanced.renderId = `${enhanced.entityType}-${enhanced.id}`;
    }
    
    return enhanced;
  }

  // DTO responsibility: Save through adapter
  async save(entityData, isUpdate) {
    return await this.adapter.save(entityData, isUpdate);
  }

  // DTO responsibility: Post-save UI operations + delegate to adapter
  onSaveComplete(result, isCreate, handleEntitySelect, entityType) {
    const enhancedEntity = this.enhanceEntity(result.data || result);
    
    if (isCreate) {
      // DTO handles scrolling for creates
      setTimeout(() => {
        const element = document.querySelector(`[data-entity-id="${renderId}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // AFTER UI operations, delegate to adapter for business logic
        if (this.adapter.onSaveComplete) {
          this.adapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
        }
      }, 300);
    } else {
      // For updates, run business logic immediately
      if (this.adapter.onSaveComplete) {
        this.adapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
      }
    }
  }
}
```

### Domain Renderer - Separation of Concerns

**File**: `/src/pages/KravTiltak/combined/kravtiltak/renderer/KravTiltakCombinedRenderer.jsx`

The renderer is **domain-aware** and uses domain-specific components:

```javascript
export const createCombinedRenderer = ({ renderers, adapters }) => {
  return {
    renderDetailPane: (entity, props) => {
      const { onSave, onDelete } = props;
      
      // Route to domain-specific renderer based on entity type
      if (entity.entityType === 'krav') {
        return (
          <EntityDetailPane
            entity={entity}
            modelConfig={kravConfig}  // Domain-specific config
            onSave={onSave}
            onDelete={onDelete}
          />
        );
      }
      
      if (entity.entityType === 'tiltak') {
        return (
          <EntityDetailPane
            entity={entity}
            modelConfig={tiltakConfig}  // Domain-specific config
            onSave={onSave}
            onDelete={onDelete}
          />
        );
      }
    },
    
    renderEntityCard: (entity, props) => {
      // ... render domain-specific cards
    }
  };
};
```

---

## 6. Data Flow Patterns

### Complete Read Flow

```
1. User enters KravTiltakCombinedWorkspace
   └─ Creates: KravTiltakCombinedAdapter
   └─ Creates: CombinedEntityDTO(adapter)
   └─ Passes DTO to: EntityWorkspaceNew

2. EntityWorkspaceNew initializes
   └─ Gets UI state from: useWorkspaceUI() (Zustand)
   └─ Fetches data via: useEntityData(dto, { searchQuery, filters })

3. useEntityData hook (TanStack Query)
   └─ Calls: dto.loadData(queryParams)
   └─ DTO calls: adapter.getQueryFunctions().combined.grouped()
   └─ Adapter calls: API endpoint
   └─ API returns: Raw grouped data

4. Response transformation
   └─ DTO.transformResponse(rawData)
   └─ Normalizes structure
   └─ Calls: enhanceEntity(entity) for each item
   └─ Adapter enhances: adds entityType, renderId, colors
   └─ DTO normalizes: forces entityType lowercase

5. EntityWorkspace renders
   └─ Passes normalized data to: EntityListPane
   └─ EntityListPane maps over entities
   └─ For each entity:
     └─ Renders: renderEntityCard(entity)
     └─ Uses renderer's domain-specific KravCard or TiltakCard
```

### Complete Write Flow (Create)

```
1. User clicks "Create new" in EntityWorkspace
   └─ Calls: handleCreateNew(entityType = 'krav')
   └─ DTO creates: newEntity = createNewEntity('krav')
   └─ newEntity { __isNew: true, __entityType: 'krav' }
   └─ UI selects: setSelectedEntity(newEntity)

2. EntityWorkspace renders detail pane
   └─ Passes entity to: renderDetailPane(newEntity)
   └─ Renderer detects __isNew and shows form in edit mode

3. EntityDetailPane form component
   └─ Uses modelConfig (krav) to get fields
   └─ User fills form
   └─ handleFieldChange updates: setFormData(...)

4. User clicks "Lagre"
   └─ EntityDetailPane validates form
   └─ Calls: onSave(formData, isUpdate=false)
   └─ onSave is EntityWorkspace.handleSave
   └─ handleSave validates entity type via DTO
   └─ handleSave calls: dto.save(formData, false)

5. DTO.save delegates to adapter
   └─ CombinedEntityDTO.save(formData, false)
   └─ DTO calls: adapter.save(formData, false)
   └─ Adapter detects: entityType = 'krav'
   └─ Adapter calls: kravAdapter.config.createFn(formData)

6. API creates entity
   └─ Backend returns: { id: 1, kravUID: 'GK1', tittel: '...', ... }
   └─ EntityWorkspace receives result

7. Post-save operations
   └─ EntityWorkspace calls: refetch() (TanStack Query)
   └─ EntityWorkspace calls: dto.onSaveComplete(result, true, handleEntitySelect, 'krav')

8. DTO post-save
   └─ DTO enhances: entity = enhanceEntity(result)
   └─ DTO normalizes: entity.entityType = 'krav' (lowercase)
   └─ DTO scrolls: document.scrollIntoView for new entity
   └─ DTO delegates: adapter.onSaveComplete(result, true, ..., 'krav')
   └─ Adapter handles: domain-specific business logic

9. UI updates
   └─ TanStack Query refetch completes
   └─ New data triggers: EntityWorkspace re-render
   └─ New entity appears in list
   └─ DTO selected new entity automatically
```

---

## 7. Model Configuration System

### modelConfig Structure (Barrel Pattern)

**Location**: `/src/modelConfigs/models/[entityType]/`

```
krav/
├── index.js                 (Barrel export - combines all parts)
├── metadata.js              (title, modelPrintName, CRUD functions)
├── fields.js                (Field definitions for forms)
├── queryFunctions.js        (API endpoints)
└── workspaceConfig.js       (UI configuration for EntityWorkspace)
```

### Example: Krav modelConfig Structure

```javascript
// /src/modelConfigs/models/krav/index.js
export const krav = {
  ...metadata,              // title, createFn, updateFn, deleteFn
  ...queryFunctions,        // queryFn, queryFnGroupedByEmne
  ...workspaceConfig,       // UI sections, field overrides
  fields                    // All field definitions
};
```

### Field Definitions

```javascript
// /src/modelConfigs/models/krav/fields.js
export const fields = [
  {
    name: "kravUID",
    label: "Krav UID",
    type: "text",
    required: false,
    disabled: true,
    show_in_list: true,
    show_in_form: true,
  },
  {
    name: "tittel",
    label: "Tittel",
    type: "text",
    required: true,
    field_info: "A short descriptive title"
  },
  {
    name: "beskrivelse",
    label: "Beskrivelse",
    type: "basicrichtext",     // Resolved by FieldResolver
    required: true,
    hiddenIndex: true,        // Hidden in list view
  },
  {
    name: "emneId",
    label: "Emne",
    type: "emneselect",        // Custom entity selector
    required: false,
  },
  // ... 20+ more fields
];
```

### Workspace Configuration

```javascript
// /src/modelConfigs/models/krav/workspaceConfig.js
export const workspaceConfig = {
  workspace: {
    enabled: true,
    layout: "split",
    groupBy: "emne",
    features: {
      grouping: true,
      hierarchy: true,
      inlineEdit: true,
      search: true,
      filters: true,
    },
    ui: {
      showStatus: false,
      showVurdering: false,
      showObligatorisk: true,
      showRelations: true,
    },
    cardFields: ["kravUID", "tittel", "beskrivelse", "obligatorisk"],
  },
  
  // Fields hidden in different modes
  workspaceHiddenIndex: ["versjon", "updatedBy", "createdBy", ...],
  workspaceHiddenEdit: ["kravUID", "updatedBy", "createdBy", ...],
  workspaceHiddenCreate: [...],
  
  // Form sections for detail pane
  sections: {
    info: {
      title: "Grunnleggende informasjon",
      defaultExpanded: true,
      fieldOverrides: {
        beskrivelse: { order: 2 },
      },
      rows: {
        "merknad-row": {
          kravreferanse: { order: 3 },
          emneId: { order: 3 },
        },
      },
    },
    status: {
      title: "Status og vurdering",
      defaultExpanded: true,
      fieldOverrides: {},
    },
    // ... more sections
  }
};
```

---

## 8. Architectural Best Practices

### CORRECT Patterns ✅

```javascript
// 1. EntityWorkspace → DTO → Adapter
const result = await dto.save(entityData, isUpdate);

// 2. DTO normalizes case (lowercase entityType)
if (enhanced?.entityType) {
  enhanced.entityType = enhanced.entityType.toLowerCase();
}

// 3. Adapter returns raw data
detectEntityType(rawEntity) {
  return rawEntity.entityType;  // As-is from API
}

// 4. DTO handles UI concerns
onSaveComplete(result, isCreate, handleEntitySelect, entityType) {
  const enhanced = this.enhanceEntity(result);
  handleEntitySelect(enhanced);  // Update UI selection
  scrollToElement(element);       // Handle scrolling
  
  // THEN delegate to adapter for business logic
  this.adapter.onSaveComplete(result, isCreate, handleEntitySelect, entityType);
}

// 5. Renderer uses both DTO and domain adapters
const renderer = createCombinedRenderer({
  adapters: { primaryAdapter, secondaryAdapter }  // Configs
});

// 6. Factory pattern for DRY state creation
const createInheritanceStore = (parentType, relatedType, fallback) => {
  return create((set, get) => ({
    // Reusable store logic
  }));
};
```

### ANTI-PATTERNS to Avoid ❌

```javascript
// 1. DTO should NOT call adapter directly in UI operations
// ❌ WRONG
dto.onSaveComplete(() => {
  const entity = this.adapter.getLastSavedEntity();  // Direct adapter call
  handleEntitySelect(entity);
});

// 2. Adapter should NOT handle UI normalization
// ❌ WRONG
adapter.enhanceEntity(entity) {
  entity.entityType = entity.entityType.toLowerCase();  // Adapter shouldn't normalize
  return entity;
}

// 3. EntityWorkspace should NOT call adapter directly
// ❌ WRONG
const result = await this.adapter.save(data);  // Skip DTO layer

// 4. Renderer should NOT handle generic interface operations
// ❌ WRONG
renderer.handleEntitySelect = (entity) => {
  // This is EntityWorkspace's job, not renderer's
};

// 5. Form should NOT be coupled to specific APIs
// ❌ WRONG
const handleSave = async (formData) => {
  const result = await kravApi.update(formData.id, formData);
  setSelectedEntity(result);  // Form shouldn't manage selection
};
```

---

## 9. Inheritance Pattern (emne)

### Challenge
Multiple entity types (Krav, Tiltak, ProsjektKrav, ProsjektTiltak) need to inherit `emneId` from parent relationships while staying isolated.

### Solution: Dual Inheritance Stores

**File**: `/src/stores/formInheritanceStore.js`

```javascript
// Factory creates identical store logic for different workspace pairs
const createInheritanceStore = (parentType, relatedType, fallbackSourceType) => {
  return create((set, get) => ({
    inheritedEmne: null,
    source: null,
    sourceType: null,
    parentData: null,
    relatedEntityData: null,
    hasParentConnection: false,
    hasRelatedEntityConnection: false,
    
    setParentInheritance: (parentData, parentType) => {
      set({
        inheritedEmne: parentData?.emneId || null,
        source: 'parent',
        sourceType: parentType,
        parentData,
        hasParentConnection: !!parentData,
      });
    },
    
    setRelatedEntityInheritance: (entityData, entityType) => {
      set({
        inheritedEmne: entityData?.emneId || null,
        source: entityType,
        sourceType: fallbackSourceType,
        relatedEntityData: entityData,
        hasRelatedEntityConnection: !!entityData,
      });
    },
    
    clearAllInheritance: () => {
      set(createInitialState());
    }
  }));
};

// Two completely separate store instances
export const useKravTiltakInheritanceStore = createInheritanceStore('tiltak', 'krav', 'tiltak');
export const useProsjektKravTiltakInheritanceStore = createInheritanceStore('prosjektTiltak', 'prosjektKrav', 'prosjektTiltak');
```

### Why This Works
1. **Complete isolation**: Each workspace pair has its own store
2. **No cross-contamination**: Switching workspaces clears the store
3. **DRY principle**: Factory pattern eliminates duplication
4. **Clean semantics**: parentType vs. relatedType is explicit

---

## 10. Key Files Reference

### Core EntityWorkspace
- `/src/components/EntityWorkspace/EntityWorkspaceNew.jsx` - Main component
- `/src/components/EntityWorkspace/ARCHITECTURE.md` - Architecture docs
- `/src/components/EntityWorkspace/interface/data/EntityDTOInterface.js` - Interface contract
- `/src/components/EntityWorkspace/interface/data/CombinedEntityDTO.js` - DTO implementation
- `/src/components/EntityWorkspace/interface/stores/workspaceUIStore.js` - UI state

### DTO & Adapter
- `/src/components/EntityWorkspace/interface/data/SingleEntityDTO.js` - Single entity DTO
- `/src/components/EntityWorkspace/interface/data/CombinedEntityDTO.js` - Combined DTO
- `/src/components/EntityWorkspace/backendAdapter/core/BaseAdapter.js` - Base adapter class
- `/src/pages/KravTiltak/combined/kravtiltak/adapter/KravTiltakCombinedAdapter.js` - Reference implementation

### Forms & Components
- `/src/pages/KravTiltak/shared/components/EntityDetailPane/EntityDetailPane.jsx` - Main form
- `/src/pages/KravTiltak/shared/components/EntityDetailPane/helpers/useEntityForm.js` - Form hook
- `/src/components/tableComponents/fieldTypes/fieldResolver.jsx` - Field resolution pipeline
- `/src/pages/KravTiltak/shared/components/EntityCard/EntityCard.jsx` - List cards

### Model Configuration
- `/src/modelConfigs/models/krav/index.js` - Krav barrel export
- `/src/modelConfigs/models/krav/fields.js` - Field definitions
- `/src/modelConfigs/models/krav/workspaceConfig.js` - Workspace UI config
- `/src/modelConfigs/models/tiltak/` - Tiltak (same structure)

### State Management
- `/src/stores/formInheritanceStore.js` - Inheritance stores
- `/src/stores/userStore.js` - User/auth state
- `/src/stores/navigationHistoryStore.js` - Navigation history
- `/src/stores/recentProjectsStore.js` - Recent projects

---

## 11. Comparison: Single vs. Combined Views

### Single Entity Workspace (Krav only)

```
KravWorkspace
  └─ KravAdapter (handles krav-only logic)
  └─ SingleEntityDTO(kravAdapter)
  └─ EntityWorkspaceNew(dto)
  └─ KravRenderer
```

**Simpler**: One entity type, one adapter, one renderer

### Combined Entity Workspace (Krav + Tiltak)

```
KravTiltakCombinedWorkspace
  └─ KravTiltakCombinedAdapter
    ├─ KravAdapter (reused)
    └─ TiltakAdapter (reused)
  └─ CombinedEntityDTO(combinedAdapter)
  └─ EntityWorkspaceNew(dto)
  └─ KravTiltakCombinedRenderer
    ├─ KravDetailRenderer
    └─ TiltakDetailRenderer
```

**Powerful**: Leverages DRY by reusing KravAdapter + TiltakAdapter

---

## 12. Performance & Scalability Considerations

### Data Fetching
- **TanStack Query** handles caching and invalidation
- Query keys: `['krav', 'combined']`, `['tiltak']`, etc.
- Automatic refetch on focus, manual via `refetch()`

### Form Performance
- **Lazy field resolution**: FieldResolver only called on render
- **Memoization**: useMemo for sections, fields, validation
- **No re-renders**: Changes only trigger affected section re-renders

### State Updates
- **Zustand devtools** enabled for debugging
- **No serialization** of Set/Map objects (custom middleware)
- **localStorage** persistence for viewMode only

### Rendering Performance
- **EntityListPane**: Virtual scrolling for large lists (shadcn/ui)
- **Split view**: List and detail pane separate, no coupled re-renders
- **Cards view**: Grid layout, lazy image loading

---

## 13. Recommendations for Emne Inheritance Solution

Based on this architecture, the emne inheritance solution should:

1. **Use the inheritance store pattern** (already in place)
   - Create new stores for emne parent/related relationships
   - Factory pattern for DRY

2. **Leverage DTO for normalization**
   - DTO pre-populates inherited emneId before rendering form
   - Entity has `__inheritedEmneId` marker

3. **Keep adapter business-logic-only**
   - Adapter detects and applies inheritance rules
   - Adapter validates inherited field constraints

4. **Store inheritance context in form**
   - Show "inherited from X" UI indicator
   - Allow override with validation

5. **Respect workspace isolation**
   - Each workspace has separate inheritance state
   - Switching workspaces clears inheritance

---

## Conclusion

The MOP project demonstrates enterprise-grade React architecture with:
- ✅ Clear separation of concerns (EntityWorkspace → DTO → Adapter → Renderer)
- ✅ Minimal coupling with explicit contracts
- ✅ Reusable components (KravAdapter used in both single and combined views)
- ✅ Controlled form patterns with modelConfig
- ✅ Sophisticated state management (TanStack Query + minimal Zustand)
- ✅ Domain-aware rendering with render props
- ✅ Factory patterns for DRY store creation

This architecture scales well and provides a solid foundation for complex features like emne inheritance.
