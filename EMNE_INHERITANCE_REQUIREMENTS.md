# Emne Inheritance - Business Requirements

**Date**: 2025-10-22
**Status**: REQUIREMENTS DOCUMENTED

---

## Business Rules

### 1. Krav (Base Entity)

**Inheritance Source**: Parent Krav (via `parentId`)

**Behavior**:
- User selects `parentId` (parent Krav)
- → `emneId` automatically inherits from parent Krav's `emneId`
- → `emneSelect` becomes **disabled**
- → Placeholder shows: "Arves fra {parent.tittel}"

**When parent removed**:
- User removes `parentId`
- → `emneSelect` becomes **enabled** again
- → User can manually select `emneId`

**Null Inheritance**: YES
- If parent has `emneId = null`, child also gets `emneId = null`

**User Override**: NO
- User cannot manually override inherited `emneId` while parent exists
- Must remove parent first to change `emneId`

---

### 2. Tiltak (Base Entity)

**Inheritance Source**: Parent Tiltak (via `parentId`)

**Behavior**:
- User selects `parentId` (parent Tiltak)
- → `emneId` automatically inherits from parent Tiltak's `emneId`
- → `emneSelect` becomes **disabled**
- → Placeholder shows: "Arves fra {parent.tittel}"

**When parent removed**:
- User removes `parentId`
- → `emneSelect` becomes **enabled** again
- → User can manually select `emneId`

**Null Inheritance**: YES
**User Override**: NO

---

### 3. ProsjektKrav (Project Entity)

**Inheritance Source**: Parent ProsjektKrav (via `parentId`)

**Behavior**:
- User selects `parentId` (parent ProsjektKrav)
- → `emneId` automatically inherits from parent ProsjektKrav's `emneId`
- → `emneSelect` becomes **disabled**
- → Placeholder shows: "Arves fra {parent.tittel}"

**When parent removed**:
- User removes `parentId`
- → `emneSelect` becomes **enabled** again
- → User can manually select `emneId`

**Null Inheritance**: YES
**User Override**: NO

---

### 4. ProsjektTiltak (Project Entity) - SPECIAL CASE

**Inheritance Sources**:
1. Parent ProsjektTiltak (via `parentId`), OR
2. Connected ProsjektKrav (via `prosjektKravIds`)

**Mutual Exclusivity**: User can select EITHER parent OR connected krav, NOT both

#### Scenario A: User Selects Parent ProsjektTiltak

**Behavior**:
- User selects `parentId` (parent ProsjektTiltak)
- → `emneId` automatically inherits from parent ProsjektTiltak's `emneId`
- → `emneSelect` becomes **disabled**
- → `prosjektKravIds` selector becomes **disabled** (mutual exclusivity)
- → Placeholder on emneSelect: "Arves fra overordnet tiltak: {parent.tittel}"
- → Placeholder on prosjektKravIds: "Deaktivert - fjern overordnet tiltak først"

**When parent removed**:
- User removes `parentId`
- → `emneSelect` becomes **enabled** again
- → `prosjektKravIds` selector becomes **enabled** again

#### Scenario B: User Selects Connected ProsjektKrav

**Behavior**:
- User selects `prosjektKravIds` (connected ProsjektKrav)
- → `emneId` automatically inherits from **first** ProsjektKrav's `emneId`
- → `emneSelect` becomes **disabled**
- → `parentId` selector becomes **disabled** (mutual exclusivity)
- → Placeholder on emneSelect: "Arves fra tilknyttet krav: {krav.tittel}"
- → Placeholder on parentId: "Deaktivert - fjern krav-tilknytning først"

**When connected krav removed**:
- User removes all `prosjektKravIds`
- → `emneSelect` becomes **enabled** again
- → `parentId` selector becomes **enabled** again

**Null Inheritance**: YES
**User Override**: NO

---

## Reactive Update Requirements

### Critical: Real-time Updates

**User changes parent/krav selection**:
- User changes `parentId` from Krav A → Krav B
- → `emneId` should **immediately** update from Krav A's emneId → Krav B's emneId
- → No page refresh required
- → No manual re-selection required

**Example Flow**:
```
1. User creates new ProsjektTiltak
2. User selects parentId = ProsjektTiltak #5 (emneId = 3)
   → emneSelect shows "Emne 3" (disabled)
3. User changes parentId = ProsjektTiltak #8 (emneId = 7)
   → emneSelect IMMEDIATELY updates to "Emne 7" (still disabled)
4. User removes parentId
   → emneSelect becomes enabled, shows current value (7)
   → User can now change to different emne
```

---

## Data Flow Requirements

### 1. Parent/Krav Data Fetching

**Requirement**: When user selects parentId or kravIds, fetch full entity data to get `emneId`

**Implementation**: TanStack Query
```javascript
const { data: parentData } = useQuery({
  queryKey: ['parent-tiltak', formData.parentId],
  queryFn: () => fetchProsjektTiltak(formData.parentId),
  enabled: !!formData.parentId
});
```

### 2. Inheritance Computation

**Requirement**: Compute effective `emneId` based on parent/krav data

**Implementation**: Adapter business logic
```javascript
adapter.getEffectiveEmneId(formData, parentData, kravData)
// Returns: { emneId, source, isInherited, sourceData }
```

### 3. Form State Sync

**Requirement**: When parent/krav changes, `formData.emneId` must update

**Implementation**: Controlled useEffect
```javascript
useEffect(() => {
  if (inheritanceInfo.isInherited) {
    setFormData(prev => ({ ...prev, emneId: inheritanceInfo.emneId }));
  }
}, [inheritanceInfo.emneId, inheritanceInfo.isInherited]);
```

---

## UI/UX Requirements

### Visual Indicators

**When emne is inherited**:
- ✅ EmneSelect shows inherited value
- ✅ EmneSelect is disabled
- ✅ Placeholder shows inheritance source: "Arves fra {source}: {title}"
- ✅ Optional: Blue badge/icon indicating inheritance

**When mutual exclusivity blocks field**:
- ✅ Blocked field is disabled
- ✅ Placeholder shows: "Deaktivert - fjern {source} først"
- ✅ Visual distinction (gray out, different styling)

### Loading States

**When parent/krav data is loading**:
- ✅ EmneSelect shows loading state
- ✅ Placeholder: "Laster emne fra overordnet element..."
- ✅ Spinner or skeleton loader

---

## Edge Cases to Handle

### 1. Parent Has No Emne (null)
**Behavior**: Child also gets `emneId = null`, field still disabled
**Placeholder**: "Ingen emne på overordnet element"

### 2. Multiple Krav Selected (ProsjektTiltak)
**Behavior**: Inherit from **first** krav in array
**Logic**: `prosjektKravIds[0]`

### 3. Parent Changes While Form Open
**Behavior**:
- Fetch new parent data
- Recompute inherited emneId
- Update form field immediately

### 4. Network Error Fetching Parent
**Behavior**:
- Show error state
- Don't block form, but show warning
- Placeholder: "Kunne ikke laste overordnet element"

### 5. Creating vs Editing Entity
**Both scenarios**: Same inheritance behavior
**New entity**: `__isNew: true` flag, but inheritance logic identical

---

## Technical Constraints

### Must Work With

1. **Current form pattern**: Controlled components with `useState`
2. **No form library**: Plain React, no React Hook Form
3. **EntityWorkspace architecture**: Must follow 4-layer pattern
4. **TanStack Query**: For data fetching and caching
5. **ModelConfig system**: Field definitions from modelConfig

### Must NOT Break

1. **Existing TableComponents**: Old CRUD system might still use inheritance
2. **Other entity types**: Only affect Krav/Tiltak/ProsjektKrav/ProsjektTiltak
3. **Workspace isolation**: KravTiltak vs ProsjektKravTiltak separate stores

---

## Success Criteria

### Functional Requirements ✅

- [ ] Krav: Select parent → emne inherits, field disabled
- [ ] Tiltak: Select parent → emne inherits, field disabled
- [ ] ProsjektKrav: Select parent → emne inherits, field disabled
- [ ] ProsjektTiltak: Select parent → emne inherits, field disabled, krav selector disabled
- [ ] ProsjektTiltak: Select krav → emne inherits, field disabled, parent selector disabled
- [ ] Remove parent/krav → field enabled, can select emne
- [ ] Change parent → emne updates immediately (reactive)
- [ ] Null inheritance works (parent has null → child gets null)
- [ ] Visual indicators show inheritance source
- [ ] Mutual exclusivity enforced (ProsjektTiltak)

### Non-Functional Requirements ✅

- [ ] No race conditions or timing issues
- [ ] No infinite useEffect loops
- [ ] Clean separation: business logic in adapter
- [ ] Follows EntityWorkspace 4-layer architecture
- [ ] Works in both create and edit modes
- [ ] Loading states for async data fetching
- [ ] Error handling for network failures

---

## Implementation Priorities

### P0 (Must Have - Core Functionality)
1. Adapter: `getEffectiveEmneId()` business logic
2. Hook: `useEmneInheritance()` with TanStack Query data fetching
3. Form: useEffect to sync inheritance → formData
4. EmneSelect: Disable when inherited
5. Mutual exclusivity for ProsjektTiltak

### P1 (Should Have - UX)
1. Visual inheritance indicators
2. Loading states
3. Proper placeholders showing source
4. Mutual exclusivity placeholders

### P2 (Nice to Have - Polish)
1. Animations on emne change
2. Better error messages
3. Inheritance indicator component
4. Tooltip explaining inheritance

---

## Open Questions RESOLVED

1. ✅ **Remove parent → clear emneId?** → NO, keep current value, just enable field
2. ✅ **Mutual exclusivity enforcement?** → Disable conflicting field
3. ✅ **User override allowed?** → NO, must remove parent/krav first
4. ✅ **Null inheritance?** → YES, if parent has null, child gets null
5. ✅ **Multiple krav?** → Inherit from first krav in array

---

## Next Steps

1. → Revise implementation plan based on these requirements
2. → Add reactive update mechanism (useEffect with proper dependencies)
3. → Design mutual exclusivity logic for ProsjektTiltak
4. → Implement adapter methods with business rules
5. → Create useEmneInheritance hook with TanStack Query
6. → Update form component to use hook + sync logic
7. → Test all scenarios end-to-end
