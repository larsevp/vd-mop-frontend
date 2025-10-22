# Emne Inheritance - Final Requirements (APPROVED)

**Date**: 2025-10-22
**Status**: APPROVED FOR IMPLEMENTATION

---

## Critical Questions ANSWERED ✅

### 1. Save Behavior
**Answer**: We send the inherited `emneId` in the API request body
- Frontend computes inherited value
- Frontend sends explicit `emneId` to backend
- Backend saves it as-is (doesn't recompute)

**Rationale**: Simpler, explicit, no backend computation needed

---

### 2. Edit Mode Behavior
**Answer**: We recompute inheritance when opening edit form
- Load existing entity from backend
- Fetch parent/krav data
- Recompute inherited `emneId`
- If different from saved value, update it
- **Reason**: User may have changed parent's emneId since child was created

**New Case Discovered**: Parent emneId changes after children exist
- **TODO**: Backend should handle cascading updates (future work)
- For Krav: If Krav A.emneId changes, all children should update
- For ProsjektKrav: If ProsjektKrav A.emneId changes, all children should update
- **Frontend**: Just shows current computed value in edit mode

---

### 3. Entity Connection Matrix

**APPROVED Structure**:

```
┌─────────────────────────────────────────────────────────────┐
│  BASE WORKSPACE (Krav/Tiltak)                                │
├─────────────────────────────────────────────────────────────┤
│  Krav:                                                        │
│    - parentId → Krav (same type)                             │
│                                                               │
│  Tiltak:                                                      │
│    - parentId → Tiltak (same type)                           │
│    - kravIds → Krav (many-to-many)                           │
│    - Mutual exclusivity: parentId XOR kravIds                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PROJECT WORKSPACE (ProsjektKrav/ProsjektTiltak)             │
├─────────────────────────────────────────────────────────────┤
│  ProsjektKrav:                                                │
│    - parentId → ProsjektKrav (same type)                     │
│                                                               │
│  ProsjektTiltak:                                              │
│    - parentId → ProsjektTiltak (same type)                   │
│    - prosjektKravIds → ProsjektKrav (many-to-many)           │
│    - Mutual exclusivity: parentId XOR prosjektKravIds        │
└─────────────────────────────────────────────────────────────┘

❌ NO CROSS-WORKSPACE CONNECTIONS:
  - Krav ≠ ProsjektKrav
  - Tiltak ≠ ProsjektTiltak
  - Krav cannot connect to ProsjektKrav
  - Tiltak cannot connect to ProsjektTiltak
```

---

## Complete Inheritance Rules

### 1. Krav
**Inheritance Source**: Parent Krav ONLY (via `parentId`)
**No mutual exclusivity** (only one source)

---

### 2. Tiltak ⚠️ UPDATED
**Inheritance Sources**:
- Parent Tiltak (via `parentId`), OR
- Connected Krav (via `kravIds`)

**Mutual Exclusivity**: ✅ YES
- User can select EITHER parentId OR kravIds, NOT both
- If parentId exists → kravIds selector disabled
- If kravIds exists → parentId selector disabled

**Behavior** (same as ProsjektTiltak):
- Select parentId → inherit from parent Tiltak
- Select kravIds → inherit from **first** Krav
- Remove parentId → enable kravIds selector + emneSelect
- Remove kravIds → enable parentId selector + emneSelect

---

### 3. ProsjektKrav
**Inheritance Source**: Parent ProsjektKrav ONLY (via `parentId`)
**No mutual exclusivity** (only one source)

---

### 4. ProsjektTiltak
**Inheritance Sources**:
- Parent ProsjektTiltak (via `parentId`), OR
- Connected ProsjektKrav (via `prosjektKravIds`)

**Mutual Exclusivity**: ✅ YES
- Same behavior as Tiltak (see above)

---

## Mutual Exclusivity: Frontend vs Backend

### Question
Should backend validate mutual exclusivity, or is it frontend-only?

### Analysis

#### Option A: Frontend Only ❌
```javascript
// Frontend disables conflicting fields
<ParentSelector disabled={hasKravConnection} />
<KravSelector disabled={hasParentConnection} />

// But user could bypass via API:
POST /tiltak {
  parentId: 5,
  kravIds: [10, 12]  // ❌ Both set - breaks mutual exclusivity!
}
```

**Pros**:
- Fast UX (no API roundtrip)
- Simpler backend

**Cons**:
- ❌ Can be bypassed (curl, Postman, etc.)
- ❌ Data integrity risk
- ❌ No protection against bugs

---

#### Option B: Backend Only ❌
```javascript
// Frontend allows both, backend rejects
POST /tiltak {
  parentId: 5,
  kravIds: [10]
}

// Backend returns:
400 Bad Request: "Cannot have both parentId and kravIds"
```

**Pros**:
- ✅ Secure, can't bypass
- ✅ Data integrity guaranteed

**Cons**:
- ❌ Slow UX (user sees error after submit)
- ❌ Poor user experience

---

#### Option C: Both (RECOMMENDED) ✅
```javascript
// Frontend: Disable conflicting fields (UX)
<ParentSelector disabled={hasKravConnection} />
<KravSelector disabled={hasParentConnection} />

// Backend: Validate and reject if both set (Security)
function validateTiltak(data) {
  if (data.parentId && data.kravIds?.length > 0) {
    throw new ValidationError("Cannot have both parentId and kravIds");
  }
}
```

**Pros**:
- ✅ Fast UX (frontend prevents)
- ✅ Secure (backend enforces)
- ✅ Defense in depth
- ✅ Catches bugs in frontend code

**Cons**:
- Slightly more code (minimal)

---

### Recommendation: Option C (Both)

**Rationale**:
1. **Defense in Depth**: Frontend for UX, backend for security
2. **Data Integrity**: Backend is final authority
3. **Industry Standard**: Never trust frontend validation alone
4. **Bug Protection**: If frontend has bug, backend catches it

**Implementation Priority**:
- **P0 (This PR)**: Frontend mutual exclusivity (disable fields)
- **P1 (Next PR)**: Backend validation (prevent data corruption)

**Backend TODO**: Add mutual exclusivity validation for Tiltak and ProsjektTiltak

---

## Updated Entity Matrix

| Entity | Parent Source | Related Entity Source | Mutual Exclusivity |
|--------|---------------|----------------------|-------------------|
| Krav | parentId → Krav | None | N/A |
| Tiltak | parentId → Tiltak | kravIds → Krav | ✅ YES (parent XOR krav) |
| ProsjektKrav | parentId → ProsjektKrav | None | N/A |
| ProsjektTiltak | parentId → ProsjektTiltak | prosjektKravIds → ProsjektKrav | ✅ YES (parent XOR krav) |

---

## Backend TODOs (Future Work)

### TODO 1: Cascading emneId Updates
**Priority**: P2 (Nice to have)

**Issue**: When parent's emneId changes, children become stale

**Example**:
```
1. Krav A (emneId=5)
2. Krav B (parentId=A, emneId=5) ← inherited
3. User updates Krav A.emneId = 7
4. Krav B still has emneId=5 ← STALE!
```

**Solution Options**:

**Option A**: Real-time cascade update
```sql
-- When Krav A.emneId changes, update all children
UPDATE krav
SET emneId = 7
WHERE parentId = A.id
```

**Pros**: Always consistent
**Cons**: Complex, performance impact for large trees

**Option B**: Recompute on read
```javascript
// Backend computes effective emneId on GET
function getKrav(id) {
  const krav = db.krav.findById(id);
  if (krav.parentId) {
    const parent = db.krav.findById(krav.parentId);
    krav.effectiveEmneId = parent.emneId;
  }
  return krav;
}
```

**Pros**: Always up-to-date
**Cons**: Don't persist, complex queries

**Option C**: Recompute on frontend edit
```javascript
// When user opens edit form, recompute (CURRENT PLAN)
const inheritanceInfo = adapter.getEffectiveEmneId(entity, parentData);
if (entity.emneId !== inheritanceInfo.emneId) {
  // Update to match parent
  entity.emneId = inheritanceInfo.emneId;
}
```

**Pros**: Simple, fixes stale data on edit
**Cons**: Data can be stale between edits

**Recommendation**: Start with Option C (current plan), consider Option A later

---

### TODO 2: Mutual Exclusivity Backend Validation
**Priority**: P1 (Should have)

**Add validation** in Tiltak and ProsjektTiltak save endpoints:

```typescript
// Backend validation (Tiltak)
function validateTiltak(data: TiltakDTO) {
  if (data.parentId && data.kravIds?.length > 0) {
    throw new ValidationError(
      "Kan ikke ha både overordnet tiltak og krav-tilknytning samtidig"
    );
  }
}

// Backend validation (ProsjektTiltak)
function validateProsjektTiltak(data: ProsjektTiltakDTO) {
  if (data.parentId && data.prosjektKravIds?.length > 0) {
    throw new ValidationError(
      "Kan ikke ha både overordnet tiltak og krav-tilknytning samtidig"
    );
  }
}
```

**Add to**: Tiltak and ProsjektTiltak create/update routes

---

### TODO 3: Circular Reference Prevention
**Priority**: P1 (Should have)

**Prevent circular parent chains**:

```typescript
function validateParentId(entityId: number, parentId: number, entityType: string) {
  // Check if parentId creates a circular reference
  let currentId = parentId;
  const visited = new Set([entityId]);

  while (currentId) {
    if (visited.has(currentId)) {
      throw new ValidationError("Circular parent reference detected");
    }
    visited.add(currentId);

    const parent = db[entityType].findById(currentId);
    currentId = parent?.parentId;
  }
}
```

**Add to**: All entity types with parentId (Krav, Tiltak, ProsjektKrav, ProsjektTiltak)

---

## Implementation Plan (Frontend)

### Phase 1: Core Inheritance Logic ✅
1. Add `getEffectiveEmneId()` to adapters (Krav, Tiltak, ProsjektKrav, ProsjektTiltak)
2. Handle mutual exclusivity logic in adapters
3. Return flags: `hasParentConnection`, `hasKravConnection`

### Phase 2: Data Fetching Hook ✅
1. Create `useEmneInheritance` hook
2. Use TanStack Query for parent/krav data fetching
3. Call adapter for business logic
4. Return computed inheritance info + mutual exclusivity flags

### Phase 3: Form Integration ✅
1. Use hook in `EntityDetailPane`
2. Add useEffect to sync inheritance → formData
3. Include loading state check (prevent race condition)
4. Proper dependency array (prevent infinite loop)

### Phase 4: Field Components ✅
1. EmneSelect: disabled when inherited
2. ParentSelector: disabled when kravConnection exists (Tiltak/ProsjektTiltak)
3. KravSelector: disabled when parentConnection exists (Tiltak/ProsjektTiltak)
4. Show proper placeholders

### Phase 5: Visual Indicators ✅
1. Show inheritance source: "Arves fra {parent.tittel}"
2. Show mutual exclusivity block: "Deaktivert - fjern {source} først"
3. Loading states: "Laster overordnet element..."

---

## Success Criteria (Final)

### Functional ✅
- [ ] Krav: Select parent → inherit emne
- [ ] Tiltak: Select parent → inherit emne, krav disabled
- [ ] Tiltak: Select krav → inherit emne, parent disabled
- [ ] ProsjektKrav: Select parent → inherit emne
- [ ] ProsjektTiltak: Select parent → inherit emne, krav disabled
- [ ] ProsjektTiltak: Select krav → inherit emne, parent disabled
- [ ] Change parent/krav → emne updates immediately
- [ ] Remove parent/krav → fields enabled
- [ ] Edit mode: Recompute inheritance on load
- [ ] Null inheritance works
- [ ] Save sends inherited emneId to backend

### Technical ✅
- [ ] No infinite loops
- [ ] No race conditions
- [ ] Loading states handled
- [ ] Follows 4-layer architecture
- [ ] Business logic in adapters
- [ ] Clean separation of concerns

### Backend TODOs 📝
- [ ] TODO 1: Cascading emneId updates (P2)
- [ ] TODO 2: Mutual exclusivity validation (P1)
- [ ] TODO 3: Circular reference prevention (P1)

---

## Final Approval

✅ **Requirements are now 95% clear**
✅ **Ready for implementation**
✅ **Backend TODOs documented**

**Proceed with implementation using**:
- Frontend mutual exclusivity (disable fields)
- Recompute inheritance on edit
- Send inherited emneId to backend
- Backend validation as separate task

Let's build it! 🚀
