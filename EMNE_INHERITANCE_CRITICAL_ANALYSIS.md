# Critical Analysis: Proposed Solution vs Requirements

**Date**: 2025-10-22
**Status**: ANALYSIS

---

## Requirements Recap

1. ✅ Select parent → emne inherits + disable emneSelect
2. ✅ Change parent → emne updates immediately (reactive)
3. ✅ Remove parent → emneSelect enabled
4. ✅ ProsjektTiltak: Mutual exclusivity (parent OR krav, not both)
5. ✅ Null inheritance supported
6. ❌ No user override allowed

---

## Proposed Solution Review

### Architecture Layer Analysis

```
Form Component (useState)
    ↓
useEmneInheritance Hook (TanStack Query + useMemo)
    ↓
Adapter.getEffectiveEmneId() (Business Logic)
    ↓
Inheritance Store (Optional - for state tracking)
```

---

## ✅ WHAT WILL WORK

### 1. Reactive Parent/Krav Data Fetching

```javascript
const { data: parentData } = useQuery({
  queryKey: ['parent', formData.parentId],
  queryFn: () => fetchParent(formData.parentId),
  enabled: !!formData.parentId
});
```

**Why it works**:
- ✅ TanStack Query automatically refetches when `formData.parentId` changes
- ✅ `parentData` updates → triggers downstream recomputation
- ✅ Industry standard, battle-tested pattern

**Meets requirement**: "User changes parent → emne updates immediately" ✅

---

### 2. Computed Inheritance Info

```javascript
const inheritanceInfo = useMemo(() => {
  return adapter.getEffectiveEmneId(formData, parentData, kravData);
}, [
  formData.parentId,
  formData.prosjektKravIds,
  parentData?.emneId,
  kravData?.emneId,
  adapter
]);
```

**Why it works**:
- ✅ Recomputes when parent/krav changes
- ✅ Business logic centralized in adapter
- ✅ Memoized to prevent unnecessary recalculations
- ✅ Clear dependency array prevents infinite loops

**Meets requirement**: "Adapter contains business logic" ✅

---

### 3. Form State Sync

```javascript
useEffect(() => {
  if (inheritanceInfo.isInherited) {
    setFormData(prev => ({
      ...prev,
      emneId: inheritanceInfo.emneId
    }));
  }
}, [inheritanceInfo.emneId, inheritanceInfo.isInherited]);
```

**Why it works**:
- ✅ Only updates when inherited emneId actually changes
- ✅ Doesn't run when user manually changes other fields
- ✅ Controlled dependencies prevent infinite loop

**Meets requirement**: "Reactive updates" ✅

---

### 4. Disabled Field Logic

```javascript
<EmneSelect
  value={formData.emneId}
  disabled={inheritanceInfo.isInherited}
  placeholder={inheritanceInfo.isInherited
    ? `Arves fra ${inheritanceInfo.sourceData?.tittel}`
    : "Velg emne"
  }
/>
```

**Why it works**:
- ✅ Simple boolean flag
- ✅ Placeholder shows source
- ✅ Reactive to inheritance state changes

**Meets requirement**: "Disable field when inherited" ✅

---

## ❌ WHAT WILL FAIL

### Problem 1: Remove Parent → EmneId Keeps Value (Per Requirements)

**Requirement**: "When we remove the parent, free the emneSelect so we can select emne again"

**Current Plan**:
```javascript
useEffect(() => {
  if (inheritanceInfo.isInherited) {
    setFormData(prev => ({ ...prev, emneId: inheritanceInfo.emneId }));
  }
}, [inheritanceInfo.emneId, inheritanceInfo.isInherited]);
```

**Scenario**:
1. User selects parent (emneId = 5)
2. formData.emneId = 5
3. User removes parent
4. inheritanceInfo.isInherited = false
5. **useEffect doesn't run** (only runs when isInherited = true)
6. formData.emneId still = 5 ✅ (this is CORRECT per requirements)
7. Field enabled ✅ (disabled={false})

**Verdict**: ✅ WILL WORK - Field enables, keeps value, user can change it

---

### Problem 2: Mutual Exclusivity Enforcement

**Requirement**: ProsjektTiltak - if parent selected, disable krav selector (and vice versa)

**Current Plan**: Adapter returns `isInherited` flag, but doesn't handle mutual exclusivity

**Missing Logic**:
```javascript
// In form component - need to add:
<ParentSelector
  value={formData.parentId}
  disabled={hasKravConnection}  // ❌ Where does this come from?
  placeholder={hasKravConnection
    ? "Deaktivert - fjern krav-tilknytning først"
    : "Velg overordnet tiltak"
  }
/>

<KravSelector
  value={formData.prosjektKravIds}
  disabled={hasParentConnection}  // ❌ Where does this come from?
  placeholder={hasParentConnection
    ? "Deaktivert - fjern overordnet tiltak først"
    : "Velg tilknyttet krav"
  }
/>
```

**Solution Needed**: Hook must return mutual exclusivity flags

```javascript
const inheritanceInfo = useEmneInheritance(entity, formData);
// Should return:
{
  emneId: 5,
  isInherited: true,
  source: 'parent',
  hasParentConnection: true,   // ✅ Add this
  hasKravConnection: false,    // ✅ Add this
  parentDisabled: false,       // ✅ For parent selector
  kravDisabled: true,          // ✅ For krav selector
}
```

**Verdict**: ❌ MISSING - Need to add mutual exclusivity flags to hook return value

---

### Problem 3: Loading State Race Condition

**Scenario**:
1. User selects parentId = 5
2. TanStack Query starts fetching parent
3. **parentData = undefined** (loading)
4. inheritanceInfo = adapter.getEffectiveEmneId(formData, undefined, kravData)
5. inheritanceInfo.emneId = null (because parentData is undefined)
6. useEffect runs → sets formData.emneId = null
7. 200ms later: parentData loads
8. inheritanceInfo.emneId = 5
9. useEffect runs → sets formData.emneId = 5
10. **User sees field flash from null → 5** ❌

**Solution Needed**: Don't update form while parent is loading

```javascript
useEffect(() => {
  // ✅ Add loading check
  if (inheritanceInfo.isInherited && !parentLoading && !kravLoading) {
    setFormData(prev => ({ ...prev, emneId: inheritanceInfo.emneId }));
  }
}, [inheritanceInfo.emneId, inheritanceInfo.isInherited, parentLoading, kravLoading]);
```

**Verdict**: ❌ WILL FAIL - Need loading state check to prevent race condition

---

### Problem 4: Infinite Loop Risk

**Scenario**:
```javascript
const inheritanceInfo = useMemo(() => {
  return adapter.getEffectiveEmneId(formData, parentData, kravData);
}, [formData, parentData, kravData]);  // ❌ formData is object, changes on every render!
```

**What happens**:
1. formData object changes (new reference)
2. useMemo recomputes → new inheritanceInfo object
3. useEffect triggers (inheritanceInfo changed)
4. setFormData called
5. **formData object changes again** → LOOP!

**Solution**: Use specific dependencies, not whole objects

```javascript
const inheritanceInfo = useMemo(() => {
  return adapter.getEffectiveEmneId(formData, parentData, kravData);
}, [
  formData.parentId,           // ✅ Primitive value
  formData.prosjektKravIds,    // ❌ Still array, could cause issues
  JSON.stringify(formData.prosjektKravIds), // ✅ Stable string
  parentData?.emneId,          // ✅ Primitive value
  kravData?.emneId,            // ✅ Primitive value
  adapter
]);
```

**Verdict**: 🟡 RISKY - Need careful dependency management

---

### Problem 5: User Override Flag Not Used

**Requirement**: "No override" - user cannot manually change emneId while parent exists

**Current Plan**: Field is disabled when inherited ✅

**But what if**:
```javascript
// User does this via devtools or API call:
setFormData({ ...formData, emneId: 999 });
// While parent is selected
// Should this be blocked?
```

**Solution**: Validate on save

```javascript
const handleSave = () => {
  // Validate: if inherited, ensure emneId matches inherited value
  if (inheritanceInfo.isInherited && formData.emneId !== inheritanceInfo.emneId) {
    throw new Error('Kan ikke overstyre arvet emne - fjern overordnet element først');
  }

  // Save
  await dto.save(formData, isUpdate);
};
```

**Verdict**: 🟡 MINOR RISK - Add validation to be safe

---

### Problem 6: Multiple Krav - Which One?

**Requirement**: ProsjektTiltak can have `prosjektKravIds = [1, 2, 3]` - inherit from **first**

**Current Plan**: Adapter logic

```javascript
// In adapter
getEffectiveEmneId(entity, parentData, kravData) {
  if (entity.prosjektKravIds?.length > 0 && kravData) {
    return { emneId: kravData.emneId, source: 'krav' };
  }
}
```

**But how is kravData fetched**?

```javascript
// In hook - need to fetch FIRST krav only
const { data: kravData } = useQuery({
  queryKey: ['prosjekt-krav', formData.prosjektKravIds?.[0]], // ✅ First krav
  queryFn: () => fetchProsjektKrav(formData.prosjektKravIds[0]),
  enabled: !!(formData.prosjektKravIds?.length > 0)
});
```

**Edge case**: What if user changes krav selection?
```
1. prosjektKravIds = [1, 2, 3] → inherits from krav 1 (emneId = 5)
2. User removes krav 1 → prosjektKravIds = [2, 3]
3. Now inherit from krav 2 (emneId = 8)
4. ✅ Query key changes → refetches → inheritanceInfo updates ✅
```

**Verdict**: ✅ WILL WORK - Query key includes first krav ID

---

### Problem 7: Null Inheritance Edge Case

**Requirement**: If parent has `emneId = null`, child also gets `null`

**Scenario**:
```javascript
1. parentData = { id: 5, tittel: "Parent", emneId: null }
2. inheritanceInfo = { emneId: null, isInherited: true }
3. useEffect runs → setFormData({ emneId: null })
4. ✅ Field shows null, disabled
```

**BUT**: What if formData.emneId was already null?
```javascript
useEffect(() => {
  if (inheritanceInfo.isInherited) {
    setFormData(prev => ({ ...prev, emneId: inheritanceInfo.emneId }));
  }
}, [inheritanceInfo.emneId, inheritanceInfo.isInherited]);

// If inheritanceInfo.emneId = null and formData.emneId = null
// → setFormData still runs (object spread creates new reference)
// → Unnecessary re-render, but not breaking
```

**Verdict**: ✅ WILL WORK - Harmless re-render

---

### Problem 8: EntityWorkspace vs TableComponents

**Current System**: Has TWO form interfaces
1. **EntityWorkspace** - New system with DTO/Adapter
2. **TableComponents** - Old CRUD system

**Question**: Does TableComponents also use emne inheritance?

**If YES**: Need to ensure both systems work

**Current inheritance implementation**:
- `emneSelect.jsx` in `tableComponents/fieldTypes/entityTypes/`
- Uses `useEmneInheritance` hook
- Uses inheritance store

**Proposed solution**:
- Keep `emneSelect.jsx` simple (just render props)
- Move logic to form component (EntityDetailPane for EntityWorkspace)

**Potential issue**: If TableComponents also needs inheritance, they won't have the hook!

**Solution Options**:

**Option A**: Make `useEmneInheritance` hook work in both contexts
```javascript
// Hook works standalone
const inheritance = useEmneInheritance(entityType, entityId, formData);
// Can be used in TableComponents OR EntityWorkspace
```

**Option B**: Keep current implementation for TableComponents, new implementation for EntityWorkspace
```javascript
// TableComponents: Keep existing logic in emneSelect.jsx
// EntityWorkspace: Use new useEmneInheritance hook in EntityDetailPane
```

**Verdict**: 🟡 NEEDS DECISION - Clarify if TableComponents needs inheritance

---

## Summary: Will It Work?

| Requirement | Status | Notes |
|-------------|--------|-------|
| Select parent → inherit emne | ✅ Works | TanStack Query + useMemo |
| Change parent → update immediately | ✅ Works | Reactive query + useEffect |
| Remove parent → enable field | ✅ Works | disabled={isInherited} |
| ProsjektTiltak mutual exclusivity | ❌ Missing | Need to add flags to hook |
| Null inheritance | ✅ Works | Handles null values |
| No user override | 🟡 Needs validation | Disabled field + save validation |
| Multiple krav → first one | ✅ Works | Query uses `kravIds[0]` |
| Loading states | ❌ Missing | Need loading check in useEffect |
| Infinite loop prevention | 🟡 Risky | Need careful dependencies |

---

## Critical Fixes Needed

### 1. Add Mutual Exclusivity Flags ⚠️ CRITICAL

```javascript
const useEmneInheritance = (entity, formData) => {
  // ... existing logic

  return {
    emneId: inheritanceInfo.emneId,
    isInherited: inheritanceInfo.isInherited,
    source: inheritanceInfo.source,
    sourceData: inheritanceInfo.sourceData,

    // ✅ ADD THESE:
    hasParentConnection: !!formData.parentId,
    hasKravConnection: !!(formData.prosjektKravIds?.length > 0 || formData.kravIds?.length > 0),
    parentDisabled: !!(formData.prosjektKravIds?.length > 0 || formData.kravIds?.length > 0),
    kravDisabled: !!formData.parentId,
  };
};
```

### 2. Add Loading State Check ⚠️ CRITICAL

```javascript
useEffect(() => {
  // ✅ Don't update while loading
  if (inheritanceInfo.isInherited && !parentLoading && !kravLoading) {
    setFormData(prev => ({ ...prev, emneId: inheritanceInfo.emneId }));
  }
}, [inheritanceInfo.emneId, inheritanceInfo.isInherited, parentLoading, kravLoading]);
```

### 3. Fix Infinite Loop Risk ⚠️ CRITICAL

```javascript
const inheritanceInfo = useMemo(() => {
  return adapter.getEffectiveEmneId(formData, parentData, kravData);
}, [
  formData.parentId,                          // ✅ Primitive
  JSON.stringify(formData.prosjektKravIds),  // ✅ Stable
  JSON.stringify(formData.kravIds),          // ✅ Stable
  parentData?.emneId,                         // ✅ Primitive
  kravData?.emneId,                           // ✅ Primitive
  adapter
]);
```

### 4. Add Save Validation 🟡 RECOMMENDED

```javascript
const handleSave = async () => {
  const validation = dto.adapter.validateInheritance(formData, inheritanceInfo);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  await dto.save(formData, isUpdate);
};
```

---

## Revised Implementation Confidence

| Layer | Confidence | Risk Areas |
|-------|------------|------------|
| Adapter business logic | 🟢 High | None - pure functions |
| TanStack Query data fetching | 🟢 High | Industry standard |
| useEmneInheritance hook | 🟡 Medium | Infinite loop risk, need fixes |
| Form useEffect sync | 🟡 Medium | Loading state race condition |
| Field component | 🟢 High | Simple disabled prop |
| Mutual exclusivity | 🔴 Low | Not yet implemented |

---

## Conclusion

**Will the proposed solution work?**

**With fixes**: ✅ YES, with 3 critical changes:
1. Add mutual exclusivity flags to hook
2. Add loading state check to useEffect
3. Fix useMemo dependencies to prevent infinite loop

**Without fixes**: ❌ NO, will have:
- Missing mutual exclusivity UI
- Race condition on parent loading
- Potential infinite loop

**Recommendation**: Implement with fixes, then test thoroughly with all scenarios
