# Requirements Gap Analysis - Missing Cases & Ambiguities

**Date**: 2025-10-22
**Status**: ANALYSIS

---

## What's Clear ✅

### Entity Types & Inheritance Sources
- ✅ Krav → inherits from parent Krav (via `parentId`)
- ✅ Tiltak → inherits from parent Tiltak (via `parentId`)
- ✅ ProsjektKrav → inherits from parent ProsjektKrav (via `parentId`)
- ✅ ProsjektTiltak → inherits from parent ProsjektTiltak OR connected ProsjektKrav

### Behavior
- ✅ Select parent/krav → emne inherits + field disabled
- ✅ Change parent/krav → emne updates immediately
- ✅ Remove parent/krav → field enabled, keeps last value
- ✅ Null inheritance allowed (parent has null → child gets null)
- ✅ No user override (disabled field enforces this)
- ✅ Mutual exclusivity for ProsjektTiltak (parent OR krav, not both)

---

## Missing Cases / Ambiguities ⚠️

### 1. Tiltak with Connected Krav ❓

**Your requirements**:
> "For prosjekttiltak we can select both a parent tiltak OR a connected krav"

**Question**: What about **base Tiltak** (not ProsjektTiltak)?

**Current system check**:
- Does base `Tiltak` have a `kravIds` field?
- Can base `Tiltak` be connected to base `Krav`?

**Scenarios**:

**Scenario A**: Base Tiltak CANNOT connect to Krav
- Only ProsjektTiltak can connect to ProsjektKrav
- Base Tiltak only inherits from parent Tiltak
- ✅ Simpler, clear inheritance rules

**Scenario B**: Base Tiltak CAN connect to Krav
- Similar to ProsjektTiltak logic
- Tiltak can have `kravIds` field
- Mutual exclusivity: parent Tiltak OR connected Krav
- ⚠️ You didn't mention this case

**Recommendation**: Clarify if base Tiltak has krav connections

---

### 2. ProsjektKrav with Connected Tiltak ❓

**Current requirements**: ProsjektKrav only inherits from parent ProsjektKrav

**Question**: Can ProsjektKrav be connected to Tiltak/ProsjektTiltak?

**Typical relationship structure**:
```
ProsjektKrav ←→ ProsjektTiltak (many-to-many)
```

**Scenarios**:

**Scenario A**: ProsjektKrav has `tiltakIds` field
- Similar mutual exclusivity as ProsjektTiltak
- ProsjektKrav inherits from parent OR connected ProsjektTiltak
- ⚠️ You didn't mention this case

**Scenario B**: ProsjektKrav does NOT connect to Tiltak
- Only inherits from parent ProsjektKrav
- ✅ Matches your stated requirements

**Recommendation**: Clarify the data model relationships

---

### 3. Multiple Parents ❓

**Current requirements**: Entities have ONE parent via `parentId`

**Question**: Can an entity have multiple parents?

**Assumption**: NO - `parentId` is singular, not `parentIds[]`

**But what if**:
- User tries to create hierarchy: Krav A → Krav B → Krav C
- Krav B has parentId = Krav A
- Krav C has parentId = Krav B
- Does Krav C inherit from Krav B only, or transitively from Krav A?

**Current plan**: Inherit from direct parent only (one level)

**Clarify**:
- ✅ One level inheritance (direct parent)
- ❓ Multi-level inheritance (grandparent, great-grandparent, etc.)

**Recommendation**: Assume one-level unless you specify otherwise

---

### 4. Circular Parent References ❓

**Question**: What if user creates circular parent relationships?

**Scenario**:
```
Krav A.parentId = Krav B
Krav B.parentId = Krav A  (circular!)
```

**Should this be**:
- ❌ Blocked by backend validation?
- ❌ Blocked by frontend validation?
- ⚠️ Allowed but breaks inheritance?

**Same for**:
```
Tiltak A.parentId = Tiltak B
Tiltak B.parentId = Tiltak C
Tiltak C.parentId = Tiltak A  (circular!)
```

**Recommendation**: Backend should validate and prevent circular refs

**Frontend impact**: If backend allows it, infinite loop risk!

---

### 5. Parent from Different Workspace ❓

**Question**: Can entities cross workspace boundaries?

**Scenario A**: Krav references Tiltak as parent
```
Krav.parentId = Tiltak.id  // ❌ Wrong entity type!
```

**Assumption**: NO - parent must be same type
- Krav parent must be Krav
- Tiltak parent must be Tiltak
- ProsjektKrav parent must be ProsjektKrav
- ProsjektTiltak parent must be ProsjektTiltak

**Scenario B**: ProsjektKrav references base Krav as parent
```
ProsjektKrav.parentId = Krav.id  // ❌ Cross-workspace!
```

**Assumption**: NO - parent must be same workspace
- ProsjektKrav parent must be ProsjektKrav (not base Krav)
- ProsjektTiltak parent must be ProsjektTiltak (not base Tiltak)

**Backend validation**: Should enforce entity type matching

**Frontend impact**: If user somehow selects wrong type, inheritance breaks

**Recommendation**: Parent selector should only show same entity type

---

### 6. Save Behavior When Inherited ❓

**Requirement**: When emne is inherited, field is disabled

**Question**: What gets saved to backend?

**Option A**: Save inherited value explicitly
```javascript
// POST/PUT request body
{
  id: 1,
  tittel: "My Krav",
  parentId: 5,
  emneId: 3  // ✅ Explicitly save inherited value
}
```

**Option B**: Don't save emneId, backend computes it
```javascript
// POST/PUT request body
{
  id: 1,
  tittel: "My Krav",
  parentId: 5
  // emneId omitted - backend should compute from parent
}
```

**Current system check**: Does backend API expect `emneId` in request?

**Recommendation**: Save inherited value explicitly (safer, backend doesn't need to compute)

---

### 7. Parent Deleted While Child Exists ❓

**Scenario**:
```
1. Krav A (id=1, emneId=5)
2. Krav B (id=2, parentId=1) → inherits emneId=5
3. User deletes Krav A
4. What happens to Krav B?
```

**Options**:

**Option A**: Backend blocks delete
```
Error: "Cannot delete Krav A - has children"
```

**Option B**: Backend cascades delete
```
Deletes Krav A AND Krav B
```

**Option C**: Backend orphans child
```
Deletes Krav A
Krav B.parentId = null
Krav B.emneId = 5 (keeps value)
```

**Frontend impact**:
- If editing Krav B when parent gets deleted, parentData becomes null
- Inheritance hook should handle missing parent gracefully

**Recommendation**: Backend handles this, frontend just needs to handle null parent

---

### 8. Updating Parent's emneId ❓

**Scenario**:
```
1. Krav A (id=1, emneId=5)
2. Krav B (id=2, parentId=1) → inherits emneId=5
3. User updates Krav A.emneId = 7
4. Should Krav B automatically update to emneId=7?
```

**If Krav B form is open while parent updates**:
- Current plan: parentData from TanStack Query might be stale
- Need to refetch parent to get new emneId

**Options**:

**Option A**: Real-time updates (WebSocket/SSE)
- Parent changes → all children get notified
- ⚠️ Complex, requires backend support

**Option B**: Refetch on focus
- TanStack Query's `refetchOnWindowFocus`
- User sees stale data until they refocus tab
- 🟡 Acceptable

**Option C**: No auto-update
- Child keeps old inherited value until user refreshes
- ❌ Can lead to data inconsistency

**Recommendation**: Use TanStack Query's refetch on focus (Option B)

---

### 9. Creating Child Before Parent Saved ❓

**Scenario**:
```
1. User creates new Krav A (not saved yet, __isNew: true)
2. User tries to create child Krav B with parentId = Krav A
3. Krav A has no ID yet (not saved to backend)
4. How to reference unsaved parent?
```

**Current system check**: Can you select unsaved entities as parent?

**Assumption**: NO - parent must be saved first

**Frontend behavior**:
- Parent selector should only show saved entities (have ID)
- Disabled for __isNew entities

**Recommendation**: Block parent selection until entity is saved

---

### 10. Edit Mode vs Create Mode ❓

**Requirements state**: "When I create a Krav..."

**Question**: Does inheritance work differently in edit mode?

**Assumption**: Same behavior for create and edit

**Scenarios**:

**Create mode**:
```
1. User creates new Krav
2. Selects parentId → emne inherits
✅ Works as described
```

**Edit mode**:
```
1. User opens existing Krav (already has parentId=5, emneId=3)
2. User changes parentId from 5 to 8
3. Should emneId update from 3 to parent 8's emneId?
```

**Expected**: YES - same reactive behavior

**But what if**:
```
1. Existing Krav has parentId=5, emneId=3
2. Parent 5 has emneId=10 (different!)
3. User opens edit form
4. Should emneId update from 3 to 10 on load?
```

**This means**: Existing data might be inconsistent (old inheritance rules?)

**Options**:

**Option A**: Fix on load
- When opening edit form, recompute inherited emneId
- Update if different
- ⚠️ Changes data without user action

**Option B**: Show warning
- "Emne does not match parent - may be outdated"
- Let user manually update

**Option C**: Don't touch existing data
- Only apply inheritance to new changes

**Recommendation**: Clarify expected behavior for existing entities

---

### 11. Inheritance Chain Depth ❓

**Scenario**:
```
Krav A (emneId=5)
  ↓ parent
Krav B (inherits emneId=5)
  ↓ parent
Krav C (inherits emneId=5 from Krav B)
```

**Question**: Does Krav C inherit from:
- ✅ Direct parent (Krav B)
- ❓ Original root (Krav A)

**Current plan**: Direct parent only

**But what if Krav B has no parent, but has explicit emneId=7**:
```
Krav A (emneId=5)
  ↓ parent
Krav B (parentId=null, emneId=7) // User manually set
  ↓ parent
Krav C (inherits emneId=7 from Krav B) ✅
```

This works with current plan - inherit from direct parent's emneId, regardless of where it came from.

**Recommendation**: One-level inheritance (direct parent) is clear ✅

---

### 12. Multiple Krav Selection Order ❓

**Requirement**: "Inherit from first krav"

**Question**: What determines "first"?

**Scenario**:
```
ProsjektTiltak.prosjektKravIds = [10, 5, 8]
```

**Options**:

**Option A**: First in array (index 0)
```javascript
prosjektKravIds[0] // 10
```
✅ Simplest

**Option B**: Lowest ID
```javascript
Math.min(...prosjektKravIds) // 5
```

**Option C**: Most recently added
```javascript
// Need timestamp or insertion order
```

**Option D**: User explicitly marks "primary" krav
```javascript
{
  prosjektKravIds: [10, 5, 8],
  primaryKravId: 5  // User chooses
}
```

**Current plan**: First in array (Option A)

**Edge case**: What if user reorders array?
```
User drags krav 8 to first position
prosjektKravIds = [8, 5, 10]
→ Inherited emneId changes from krav 10 to krav 8
```

**Recommendation**: First in array is clear, document that order matters

---

### 13. Backend Validation vs Frontend Validation ❓

**Question**: Which validations happen where?

**Validations needed**:
1. Mutual exclusivity (parent XOR krav for ProsjektTiltak)
2. Circular parent references
3. Parent entity type matching
4. Inherited emneId matches parent

**Options**:

**Option A**: Frontend only
- ✅ Fast user feedback
- ❌ Can be bypassed (API calls)

**Option B**: Backend only
- ✅ Secure, can't bypass
- ❌ Slower feedback (API roundtrip)

**Option C**: Both (recommended)
- Frontend: Fast UX, disable conflicting fields
- Backend: Security, final validation

**Recommendation**: Frontend prevents, backend enforces

---

### 14. Visual Feedback During Transitions ❓

**Scenario**:
```
1. User changes parentId from 5 to 8
2. TanStack Query fetches parent 8
3. Takes 200ms to load
4. What does emneSelect show during loading?
```

**Options**:

**Option A**: Keep old value until new loads
```
emneId=3 (from parent 5) → stays 3 → jumps to 7 (from parent 8)
```

**Option B**: Clear to null during loading
```
emneId=3 → null (loading) → 7
```

**Option C**: Show loading state
```
emneId=3 → "Laster..." → 7
disabled=true during loading
```

**Recommendation**: Option C - show loading state

---

## Summary: Missing Cases

| # | Case | Severity | Status |
|---|------|----------|--------|
| 1 | Base Tiltak with Krav connections | 🟡 Medium | ❓ Unclear |
| 2 | ProsjektKrav with Tiltak connections | 🟡 Medium | ❓ Unclear |
| 3 | Multi-level inheritance (grandparent) | 🟢 Low | Assume one-level |
| 4 | Circular parent references | 🟡 Medium | Backend validation |
| 5 | Cross-workspace parent references | 🟡 Medium | Assume same type |
| 6 | Save behavior (include emneId?) | 🔴 High | ❓ Unclear |
| 7 | Parent deleted (orphan children?) | 🟢 Low | Backend handles |
| 8 | Parent emneId updated (cascade?) | 🟡 Medium | Refetch on focus |
| 9 | Child before parent saved | 🟢 Low | Block unsaved parents |
| 10 | Edit mode vs create mode | 🔴 High | ❓ Unclear |
| 11 | Inheritance chain depth | 🟢 Low | One-level ✅ |
| 12 | Multiple krav selection order | 🟡 Medium | First in array ✅ |
| 13 | Frontend vs backend validation | 🟡 Medium | Both recommended |
| 14 | Loading state UX | 🟢 Low | Show loading ✅ |

---

## Critical Questions for You

### 🔴 High Priority

1. **Save Behavior**: When emneId is inherited, do we send it in the API request body, or does backend compute it?

2. **Edit Mode**: When editing existing entity with parentId, should we:
   - A) Recompute inherited emneId on load (might change data)
   - B) Only apply inheritance when user changes parentId
   - C) Show warning if inherited emneId doesn't match actual emneId

### 🟡 Medium Priority

3. **Base Tiltak**: Can base Tiltak connect to base Krav (like ProsjektTiltak → ProsjektKrav)?

4. **ProsjektKrav**: Can ProsjektKrav connect to Tiltak/ProsjektTiltak?

5. **Mutual Exclusivity Validation**: Should backend also validate mutual exclusivity, or trust frontend?

### 🟢 Low Priority (Assumptions OK)

6. **Multi-level inheritance**: Assume one-level (direct parent only) ✅

7. **Parent deletion**: Assume backend handles orphaning/cascading ✅

8. **Unsaved parents**: Assume cannot select unsaved entities as parent ✅

9. **Multiple krav order**: Assume first in array ✅

---

## Recommendations

### For Implementation

1. **Start with clear cases**: Krav/Tiltak/ProsjektKrav with parent-only inheritance
2. **Test with real data**: Check if Tiltak actually has `kravIds` field
3. **Backend API check**: Does it expect `emneId` in request when parent exists?
4. **Document assumptions**: Write them in code comments
5. **Add validation**: Both frontend (UX) and backend (security)

### For Requirements

1. **Clarify save behavior**: Critical for implementation
2. **Clarify edit mode**: Changes behavior significantly
3. **Document data model**: Which entities can connect to which
4. **Add backend validation rules**: Prevent data inconsistency

---

## Final Assessment

**Requirements Clarity**: 🟡 **70% Clear**

**What's crystal clear** ✅:
- Basic inheritance flow (select parent → inherit emne)
- Reactive updates (change parent → update emne)
- Mutual exclusivity for ProsjektTiltak
- Null inheritance allowed
- No user override

**What needs clarification** ❓:
- Save API behavior (include inherited emneId or not?)
- Edit mode behavior (recompute on load or not?)
- Base Tiltak/Krav connection relationship
- Backend validation rules

**Can we implement now?**: 🟡 **YES, with assumptions**
- Assume save includes emneId
- Assume edit mode same as create mode
- Assume one-level inheritance
- Document all assumptions
- Add TODO comments for unclear cases

Would you like me to proceed with implementation using these assumptions, or clarify the critical questions first?
