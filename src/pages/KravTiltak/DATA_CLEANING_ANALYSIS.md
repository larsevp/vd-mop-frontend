# Data Cleaning Analysis - KravTiltak System

## Problem Statement
When creating a "tilknyttet tiltak" from the combined Krav/Tiltak workspace, the following error occurs:
```
Lagringsfeil
Invalid fields: Field 'kravIds' is not allowed for create operation on Tiltak,
Field '__entityType' is not allowed for create operation on Tiltak
```

## Current Architecture

### Layer 1: API Endpoints (`/src/api/endpoints/models/*.js`)
**Location**: Individual model endpoint files
**Responsibility**: Clean auto-generated backend fields

**Current Implementation**:
```javascript
// krav.js:50-54
export const createKrav = (kravData) => {
  const { kravUID, id, createdAt, updatedAt, createdBy, updatedBy, ...cleanData } = kravData;
  return API.post("krav", cleanData);
};

// tiltak.js:58-62
export const createTiltak = (tiltakData) => {
  const { tiltakUID, id, createdAt, updatedAt, createdBy, updatedBy, ...cleanData } = tiltakData;
  return API.post("/tiltak", cleanData);
};

// prosjektKrav.js:61-81
export const createProsjektKrav = async (prosjektKravData) => {
  const { kravUID, id, createdAt, updatedAt, createdBy, updatedBy, ...cleanData } = prosjektKravData;
  const dataWithProjectId = { ...cleanData, projectId: Number(projectId) };
  return API.post("prosjekt-krav", dataWithProjectId);
};

// prosjektTiltak.js:61-81
export const createProsjektTiltak = async (prosjektTiltakData) => {
  const { tiltakUID, id, createdAt, updatedAt, createdBy, updatedBy, ...cleanData } = prosjektTiltakData;
  const dataWithProjectId = { ...cleanData, projectId: Number(projectId) };
  return API.post("/prosjekt-tiltak", dataWithProjectId);
};
```

**What it cleans**: Auto-generated backend fields (id, UID, timestamps, audit fields)
**What it misses**: Frontend-added fields (__entityType, __isNew, kravIds, etc.)

### Layer 2: Combined Adapters (`/src/pages/KravTiltak/combined/**/adapter/*.js`)
**Location**: Combined adapter save methods
**Responsibility**: Delegate to correct API endpoint based on entity type

**Current Implementation**:

#### KravTiltakCombinedAdapter (NEWLY FIXED):
```javascript
// KravTiltakCombinedAdapter.js:302-338
async save(entityData, isUpdate) {
  const entityType = this.detectEntityType(entityData);

  // Clean entity data by filtering out internal/UI fields
  const cleanEntityData = {};
  const internalFields = [
    'entityType', 'renderId', 'displayType', 'badgeColor',
    'kravIds', 'prosjektKravIds'
  ];

  Object.keys(entityData).forEach((key) => {
    if (!key.startsWith('__') && !internalFields.includes(key)) {
      cleanEntityData[key] = entityData[key];
    }
  });

  // Delegate to individual adapter's API functions
  if (entityType === "krav") return await config.createFn(cleanEntityData);
  if (entityType === "tiltak") return await config.createFn(cleanEntityData);
}
```

**What it cleans**:
- Fields starting with `__` (__entityType, __isNew, __sourceKrav)
- UI metadata (entityType, renderId, displayType, badgeColor)
- Junction table fields (kravIds, prosjektKravIds)

#### ProsjektKravTiltakCombinedAdapter (EXISTING):
```javascript
// ProsjektKravTiltakCombinedAdapter.js:353-395
async save(entityData, isUpdate) {
  const entityType = this.detectEntityType(entityData);

  // More explicit stripping - create completely clean object
  const cleanEntityData = {};
  Object.keys(entityData).forEach((key) => {
    if (key !== "entityType" && key !== "__entityType") {
      cleanEntityData[key] = entityData[key];
    }
  });

  // Delegate to individual adapter
  if (entityType === "prosjektkrav") {
    return await config.save(cleanEntityData, isUpdate);  // Uses modelConfig.save handler
  }
}
```

**What it cleans**: Only `entityType` and `__entityType`
**Note**: This works because it uses `config.save()` handler which may have additional validation

### Layer 3: Single Entity Adapters (`/src/pages/KravTiltak/{entity}/adapter/*.js`)
**Location**: Individual entity adapters (KravAdapter, TiltakAdapter, etc.)
**Responsibility**: Business logic, enhancement, filtering, sorting

**Current State**: These adapters do NOT have save methods - they only provide:
- `enhanceEntity()` - adds UI metadata (entityType, renderId, displayType, badgeColor)
- `getEffectiveEmneId()` - inheritance logic
- `filterEntities()` / `sortEntities()` - data manipulation
- Configuration methods

They delegate CRUD operations to modelConfig functions (createFn, updateFn)

## Data Flow Analysis

### Successful Path (Single Entity Workspace):
```
User Form
  → EntityDetailPane (gathers form data)
  → DTO.save(entityData)
  → modelConfig.createFn(entityData)
  → API endpoint (createKrav/createTiltak)
    → Strips: id, UID, timestamps, audit fields
  → Backend (receives clean data)
```

### Broken Path (Combined Workspace - Before Fix):
```
User Form (creating tilknyttet tiltak)
  → EntityDetailPane (adds __sourceKrav, kravIds for UI)
  → Adapter.enhanceEntity() (adds __entityType, entityType, renderId, etc.)
  → CombinedDTO.save(entityData)
  → CombinedAdapter.save(entityData)  [PROBLEM: Only stripped entityType]
  → modelConfig.createFn(entityData)
  → API endpoint (createTiltak)
    → Strips: id, tiltakUID, timestamps, audit fields
    → Still has: __entityType, __isNew, kravIds
  → Backend (rejects invalid fields)
```

### Fixed Path (Combined Workspace - After Fix):
```
User Form (creating tilknyttet tiltak)
  → EntityDetailPane (adds __sourceKrav, kravIds for UI)
  → Adapter.enhanceEntity() (adds __entityType, entityType, renderId, etc.)
  → CombinedDTO.save(entityData)
  → CombinedAdapter.save(entityData)  [FIXED: Strips all __ fields and kravIds]
  → modelConfig.createFn(cleanEntityData)
  → API endpoint (createTiltak)
    → Strips: id, tiltakUID, timestamps, audit fields
  → Backend (receives clean data)
```

## Field Categories

### 1. Backend Auto-Generated Fields (Already Handled)
**Where cleaned**: API endpoint layer
**Fields**:
- `id` - Primary key
- `kravUID` / `tiltakUID` - Auto-generated unique identifiers
- `createdAt`, `updatedAt` - Timestamps
- `createdBy`, `updatedBy` - Audit fields

### 2. Frontend Internal Fields (NEW - Fixed in KravTiltakCombinedAdapter)
**Where cleaned**: Combined adapter layer
**Fields starting with `__`**:
- `__entityType` - Entity type marker for combined views
- `__isNew` - New entity flag
- `__sourceKrav` - Source krav when creating tilknyttet tiltak
- Any other __ prefixed fields

### 3. Frontend UI Metadata (NEW - Fixed in KravTiltakCombinedAdapter)
**Where cleaned**: Combined adapter layer
**Fields**:
- `entityType` - Display entity type
- `renderId` - React key generation
- `displayType` - UI label
- `badgeColor` - Styling

### 4. Junction Table Relationships (NEW - Fixed in KravTiltakCombinedAdapter)
**Where cleaned**: Combined adapter layer
**Fields**:
- `kravIds` - Array of connected krav IDs (for Tiltak)
- `prosjektKravIds` - Array of connected prosjekt krav IDs (for ProsjektTiltak)

**Note**: These relationships are managed through join tables (TiltakKrav, ProsjektTiltakKrav) and should NOT be sent in create/update operations. The backend handles these separately.

## Why ProsjektKravTiltakCombined Works

The ProsjektKravTiltakCombinedAdapter works despite only filtering `entityType` and `__entityType` because:
1. It uses `config.save()` handler which may include additional validation/cleaning
2. The prosjekt entities might have different field requirements
3. Needs investigation to confirm if it's actually safe or just hasn't been tested with these fields

## Solution Implemented

### Immediate Fix (DONE)
Updated `KravTiltakCombinedAdapter.save()` to filter out:
1. All fields starting with `__`
2. UI metadata fields
3. Junction table relationship fields

### Why This Layer?
**Combined Adapter is the correct place** because:
- ✅ Sits between frontend entities (with UI fields) and backend APIs
- ✅ Only combined views add these frontend-specific fields
- ✅ Single entity workspaces don't need this cleaning
- ✅ Centralized location for combined workspace logic
- ✅ Can be duplicated to ProsjektKravTiltakCombinedAdapter

### Why NOT the API Endpoint Layer?
- ❌ API endpoints are generated/shared across workspace types
- ❌ Would require changing 4 different files (krav, tiltak, prosjektKrav, prosjektTiltak)
- ❌ Single workspaces don't have these fields, so endpoints shouldn't know about them
- ❌ Breaks separation of concerns (API layer shouldn't know about workspace UI concerns)

## Recommendation: Shared Utility

### Option 1: Shared Utility Function (BETTER)
**File**: `/src/pages/KravTiltak/shared/utils/dataCleaningUtils.js`
**Usage**: Import and use in both combined adapters

**Pros**:
- ✅ Single source of truth for field cleaning logic
- ✅ Consistency across both combined adapters
- ✅ Easy to maintain and extend
- ✅ Clear documentation of what fields are filtered and why
- ✅ Can be unit tested independently

**Cons**:
- Adds one more file

### Option 2: Keep Duplicated (CURRENT)
**Status**: Fixed in KravTiltakCombinedAdapter, needs copying to ProsjektKravTiltakCombinedAdapter

**Pros**:
- No new files

**Cons**:
- ❌ Code duplication (same logic in 2 places)
- ❌ Easy to forget to update both
- ❌ Inconsistent if lists diverge

## Recommended Next Steps

1. ✅ **DONE**: Fix KravTiltakCombinedAdapter
2. **TODO**: Create shared utility function in `dataCleaningUtils.js`
3. **TODO**: Refactor KravTiltakCombinedAdapter to use shared utility
4. **TODO**: Refactor ProsjektKravTiltakCombinedAdapter to use shared utility
5. **TODO**: Add unit tests for data cleaning logic
6. **TODO**: Document in architecture docs

## Industry Best Practices

**Separation of Concerns**:
- ✅ UI layer adds fields for display/state management
- ✅ Adapter layer translates between UI and API
- ✅ API layer handles backend-specific concerns

**Single Responsibility**:
- ✅ Each layer handles one type of cleaning
- ✅ Clear boundaries between layers

**DRY Principle**:
- ⚠️ Currently violated with duplicated logic
- ✅ Fixed by shared utility

**Defensive Programming**:
- ✅ Clean data at boundary (adapter layer)
- ✅ Backend validation catches issues
- ✅ Clear error messages guide fixes
