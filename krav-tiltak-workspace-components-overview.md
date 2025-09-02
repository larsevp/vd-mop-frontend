# Krav/Tiltak Workspace Components Overview

## **Architecture Overview**

Your MOP system implements a **dual display architecture** with two complementary approaches:

### 1. **EntityWorkspace System** (Modern)
**Path**: `/src/components/EntityWorkspace/`
- Modern workspace interface with split-view layout
- Driven by `workspace` config in modelConfigs
- Used for krav and tiltak entities

### 2. **TableComponents System** (Traditional CRUD)
**Path**: `/src/components/tableComponents/`
- Traditional CRUD interface with displayValues
- Driven by `fields` config in modelConfigs  
- Universal system for all entities

---

## **Configuration Hub**

### **Model Configuration Files**
- **Krav**: `/src/modelConfigs/models/krav.js`
- **Tiltak**: `/src/modelConfigs/models/tiltak.js`

These files define:
- Field definitions with types and validation
- Workspace layout and behavior
- Display/edit rules for different contexts
- Section organization and field grouping

---

## **EntityWorkspace Components (Krav/Tiltak Specific)**

### **Core Workspace Structure**
```
/src/components/EntityWorkspace/
├── EntityWorkspace.jsx                    # Main wrapper component
├── EntityWorkspaceCore.jsx                # Core logic handler
├── CombinedEntityWorkspace.jsx            # Combined view handler
└── layouts/
    ├── EntitySplitView.jsx                # Split layout (35% list, 65% detail)
    ├── EntityListPane.jsx                 # List pane component
    └── EntityDetailPane.jsx               # Detail pane component
```

### **Display Components**
```
components/
├── EntityCard.jsx                         # Card view for krav/tiltak items
├── EntityCardList.jsx                     # Collection of cards
├── EntityList/
│   ├── EntityListPane.jsx                 # List container
│   ├── EntityListRow.jsx                  # Individual row display
│   └── EntityListViewOptions.jsx          # View switching controls
└── EntityDetail/
    ├── EntityDetailPane.jsx               # Detail container
    └── EntityDetailForm.jsx               # Form for edit/create
```

### **Edit Components**
```
components/EntityDetail/
└── EntityDetailForm.jsx                   # Main edit form
shared/
├── UnifiedField.jsx                       # Universal field component
├── MerknadField.jsx                       # Notes field component
└── EntityFilters.jsx                      # Filter controls
```

---

## **TableComponents System (Universal)**

### **Field Resolution System**
```
/src/components/tableComponents/fieldTypes/
├── fieldResolver.jsx                      # Field type resolver
├── basicTypes.jsx                         # Text, number, boolean fields
├── entityTypes.jsx                        # Foreign key selects
├── modelSpecific.jsx                      # Model-specific overrides
└── entityTypes/
    ├── globalSelects.jsx                  # Status, vurdering selects
    ├── emneSelect.jsx                     # Subject selection
    ├── entityRelationshipSelects.jsx     # Krav/tiltak selects
    └── multiselect.jsx                    # Many-to-many relationships
```

### **Display Value System**
```
/src/components/tableComponents/displayValues/
├── DisplayValueResolver.jsx               # Display value resolver
├── basicDisplayTypes.jsx                 # Basic type displays
├── entityDisplayTypes.jsx                # Foreign key displays
├── modelSpecificDisplay.jsx              # Model-specific displays
├── ExpandableRichText.jsx                # Rich text display
└── DynamicDisplayValueResolver.jsx       # Dynamic resolver
```

### **Form Components**
```
/src/components/tableComponents/
├── RowForm.jsx                           # Generic form component
├── RowEdit.jsx                           # Edit mode wrapper
├── RowNew.jsx                            # Create mode wrapper
└── RowList.jsx                           # List display wrapper
```

---

## **Type Resolver System**

### **FieldResolver** (`/src/components/tableComponents/fieldTypes/fieldResolver.jsx`)

**Resolution Priority Order:**
1. **Model-specific field name override** (highest priority)
2. **Model-specific field type override**
3. **Global entity field type**
4. **Basic field type**
5. **Fallback to text input** (lowest priority)

### **Available Field Type Names**

#### **Basic Field Types** (`basicTypes.jsx`)
```javascript
BASIC_FIELD_TYPES = {
  text:           // Standard text input
  textarea:       // Multi-line text input
  number:         // Number input with validation
  bool:           // Boolean select (Yes/No)
  select:         // Generic dropdown select
  email:          // Email input with validation
  password:       // Password input
  date:           // Date picker
  datetime:       // Date/time picker
  richtext:       // Full rich text editor (TipTap)
  basicrichtext:  // Basic rich text editor
  fileupload:     // File upload component
}
```

#### **Global Entity Types** (`entityTypes/globalSelects.jsx`)
```javascript
globalSelectTypes = {
  statusselect:              // Status dropdown
  vurderingselect:           // Assessment dropdown
  kravreferansetypeselect:   // Krav reference type dropdown
  prioritetselect:           // Priority dropdown
  kravstatusselect:          // Krav status dropdown
  enhetselect:              // Organization unit dropdown
}
```

#### **Entity Relationship Types** (`entityTypes/entityRelationshipSelects.jsx`)
```javascript
entityRelationshipSelects = {
  kravselect:          // Krav selection dropdown
  prosjektKravselect:  // Project-krav relationship
  tiltakselect:        // Tiltak selection dropdown
  prosjektTiltakselect: // Project-tiltak relationship
}
```

#### **Additional Entity Types**
```javascript
// From emneSelect.jsx
emneselect:     // Subject/topic selection

// From multiselect.jsx  
multiselect:    // Many-to-many relationship selector
```

### **DisplayValueResolver** (`/src/components/tableComponents/displayValues/DisplayValueResolver.jsx`)

**Resolution Priority Order:**
1. **Model-specific field name override** (highest priority)  
2. **Model-specific field type override**
3. **Computed field evaluation**
4. **Global entity field type**
5. **Basic field type**
6. **Default text display** (lowest priority)

#### **Display Type Names**

```javascript
BASIC_DISPLAY_TYPES = {
  bool:           // Boolean display (Yes/No/Not specified)
  text:           // Text display with object handling
  number:         // Number display with formatting
  date:           // Date display with formatting
  richtext:       // Rich text display (expandable)
  basicrichtext:  // Basic rich text display
  fileupload:     // File attachment display
}

ENTITY_DISPLAY_TYPES = {
  statusselect:              // Status name display
  vurderingselect:           // Assessment name display
  kravreferansetypeselect:   // Reference type display
  prioritetselect:           // Priority display
  kravstatusselect:          // Krav status display
  enhetselect:              // Organization unit display
  emneselect:               // Subject/topic display
  kravselect:               // Krav title display
  tiltakselect:             // Tiltak title display
  multiselect:              // Multi-value display with badges
}
```

---

## **Specialized Field Components**

### **Krav-Specific Fields**
```
/src/components/ui/form/
├── KravSelect.tsx                        # Krav selection dropdown
├── ProsjektKravSelect.tsx                # Project-krav relationship
└── Kravreferansetype.tsx                 # Krav reference type
```

### **Tiltak-Specific Fields**
```
/src/components/ui/form/
├── TiltakSelect.tsx                      # Tiltak selection dropdown
└── ProsjektTiltakSelect.tsx              # Project-tiltak relationship

/src/components/tiltak/
├── TiltakCard.jsx                        # Tiltak card component
├── TiltakList.jsx                        # Tiltak list component
└── /forms/TiltakForm.jsx                 # Dedicated tiltak form
```

---

## **Configuration-Driven Behavior**

### **Krav Workspace Configuration**
- **Layout**: Split view (35% list width)
- **Grouping**: By `emne` (subject)
- **Sections**: 7 collapsible sections (info, status, details, references, admin, metadata, annet)
- **Features**: Grouping, hierarchy, inline edit, search, filters
- **Hidden Fields**: Different sets for index/edit/create contexts

### **Tiltak Workspace Configuration**
- **Layout**: Split view (40% list width)
- **Grouping**: By `emne` (subject)
- **Sections**: 6 collapsible sections (info, status, implementation, references, admin, metadata, annet)
- **Features**: Grouping, search, filters (no hierarchy)
- **Rich Text**: Implementation and feedback fields

---

## **Resolver Component Locations**

### **Field Components Used by Resolvers**

| Field Type | Component Location | Component Name |
|------------|-------------------|----------------|
| `text` | Built-in | `<input>` |
| `number` | `../NumberInput.jsx` | `NumberInput` |
| `bool` | `@/components/ui/form/BooleanSelect` | `BooleanSelect` |
| `richtext` | `@/components/ui/editor/TiptapEditor` | `TiptapEditor` |
| `fileupload` | `@/components/forms` | `FileUpload` |
| `statusselect` | `../../../ui/form/StatusSelect` | `StatusSelect` |
| `vurderingselect` | `../../../ui/form/VurderingSelect` | `VurderingSelect` |
| `kravreferansetypeselect` | `../../../ui/form/Kravreferansetype` | `KravreferansetypeSelect` |
| `prioritetselect` | `../../../ui/form/PrioritetSelect` | `PrioritetSelect` |
| `kravstatusselect` | `../../../ui/form/EnumSelect` | `KravStatusSelect` |
| `enhetselect` | `../../EnhetSelect` | `EnhetSelect` |
| `emneselect` | `../../../ui/form/EmneSelect` | `EmneSelect` |
| `kravselect` | `../../../ui/form/KravSelect` | `KravSelect` |
| `tiltakselect` | `../../../ui/form/TiltakSelect` | `TiltakSelect` |
| `prosjektKravselect` | `../../../ui/form/ProsjektKravSelect` | `ProsjektKravSelect` |
| `prosjektTiltakselect` | `../../../ui/form/ProsjektTiltakSelect` | `ProsjektTiltakSelect` |
| `multiselect` | `./multiselect` | Custom multiselect handler |

---

## **Key Integration Points**

### **Workspace ↔ TableComponents**
- **UnifiedField.jsx** bridges both systems
- **DisplayValueResolver** handles display formatting
- **FieldResolver** manages edit field types
- Both systems share the same modelConfig definitions

### **Data Flow**
1. **ModelConfigs** define field structure and behavior
2. **EntityWorkspace** provides modern UI layout
3. **FieldResolver** determines edit components based on field `type` property
4. **DisplayValueResolver** formats display values for different contexts
5. **UnifiedField** renders the appropriate component

### **Resolver Architecture**
```
ModelConfig Field Definition
         ↓
    FieldResolver
         ↓
Component Resolution Chain:
1. Model-specific name override
2. Model-specific type override  
3. Global entity type
4. Basic type
5. Text fallback
         ↓
    Rendered Component
```

This dual system gives you both modern workspace UX (EntityWorkspace) and traditional CRUD flexibility (TableComponents), all driven by the same configuration files in `/src/modelConfigs/` and resolved through a sophisticated type resolution system.