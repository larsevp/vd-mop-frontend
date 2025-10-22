# Emne Inheritance Backend Gap Analysis

## Current State (After Frontend Refactor)

### ✅ Frontend Implementation (Complete)
The frontend now properly handles emne inheritance:

1. **Computation on Load**: When opening edit form, frontend fetches parent/krav data and computes inherited emneId
2. **Explicit Value Sent**: Frontend sends the computed inherited emneId value explicitly to backend
3. **Field Disabling**: UI disables emne field when inherited, showing clear visual indicator
4. **Mutual Exclusivity**: UI prevents selecting both parent AND krav (for Tiltak/ProsjektTiltak)

### ❌ Backend Gaps (Not Implemented)

The backend currently has **NO** automatic inheritance handling:

#### Gap 1: No Cascading Updates (Priority: P2)
**Problem**: If a parent Krav's emneId changes, children still have old emneId

**Example Scenario**:
1. Parent Krav (ID=1) has emneId=5
2. Child Krav (ID=2) inherits emneId=5 (saved explicitly by frontend)
3. User updates Parent Krav emneId to 10
4. Child Krav still has emneId=5 ❌ (should be 10)

**Current Behavior**: Backend just updates the parent, no cascade
```typescript
// backend/services/kravService.ts line 291
await item.update(dataWithAudit); // Just updates this entity
```

**What's Missing**:
- No hook/trigger to update children when parent emneId changes
- No recursive cascade for deeply nested hierarchies
- No handling when parent changes (parentId updated)

#### Gap 2: No Mutual Exclusivity Validation (Priority: P1)
**Problem**: Backend allows creating Tiltak with BOTH parentId AND kravIds

**Example Scenario**:
1. Frontend prevents this via UI (mutual exclusivity)
2. But direct API call could bypass: `POST /tiltak { parentId: 1, kravIds: [2, 3] }`
3. Backend would accept it ❌

**What's Missing**:
- No validation rule: `if (parentId) { assert kravIds.length === 0 }`
- No validation rule: `if (kravIds.length > 0) { assert !parentId }`

#### Gap 3: No Circular Reference Prevention (Priority: P1)
**Problem**: Backend could allow circular parent relationships

**Example Scenario**:
1. Krav A has parent = Krav B
2. Update Krav B to have parent = Krav A
3. Infinite loop ❌

**What's Missing**:
- No validation to detect circular references
- No check for parent-child loops

## Recommended Backend Implementation

### Priority 1: Add Validation (Immediate)

Add to `kravService.ts` and `tiltakService.ts` update/create:

```typescript
// Mutual exclusivity validation (for Tiltak/ProsjektTiltak only)
if (updateData.parentId && updateData.kravIds?.length > 0) {
  throw new Error('Cannot have both parentId and kravIds - mutual exclusivity violation');
}

// Circular reference prevention
if (updateData.parentId) {
  const ancestors = await getAncestorChain(item.id);
  if (ancestors.includes(updateData.parentId)) {
    throw new Error('Circular parent reference detected');
  }
}
```

### Priority 2: Add Cascading Updates (Later)

Add hook/trigger for emneId cascading:

```typescript
// After parent emneId update, cascade to children
async function cascadeEmneIdToChildren(parentId: string, newEmneId: number) {
  const children = await Krav.findAll({ where: { parentId } });

  for (const child of children) {
    // Only cascade if child has no explicit emneId override
    if (child.emneId === oldParentEmneId) {
      await child.update({ emneId: newEmneId });
      // Recursively cascade to grandchildren
      await cascadeEmneIdToChildren(child.id, newEmneId);
    }
  }
}
```

**Note**: This is complex because:
- Need to distinguish "inherited" vs "explicitly set" emneId
- Currently no flag to track this
- Alternative: Always cascade (simpler but loses user overrides)

## Frontend Protection (Defense in Depth)

The frontend implementation provides the first line of defense:
1. ✅ UI prevents mutual exclusivity violations
2. ✅ Computes and sends correct inherited emneId
3. ✅ Recomputes on edit (handles stale data)

But backend validation is still **critical** for:
- API security (direct calls bypassing UI)
- Data integrity
- Multi-client scenarios
- Import/migration tools

## Current Backend Investigation

**File**: `/Users/larsevp/Code/MOP/backend/services/kravService.ts`

**Update Function** (line 270):
```typescript
async update(req: Request, id: string, updateData: any): Promise<any> {
  const item = await Krav.findOne(withRequest(req, { where: { id } }));

  // Validation
  const validation = await validateEntityUpdate(req, item, updateData, "Krav");

  // Update
  await item.update(dataWithAudit);

  // NO CASCADING LOGIC ❌
  // NO MUTUAL EXCLUSIVITY CHECK ❌
  // NO CIRCULAR REFERENCE CHECK ❌
}
```

**Parent Include** (line 61):
```typescript
{
  model: Krav,
  as: "parent",
  attributes: ["id", "kravUID", "tittel", "beskrivelse", "emneId"], // emneId is inherited to children
  required: false,
}
```
Comment says "emneId is inherited" but no actual inheritance logic implemented.

## Action Items

### Immediate (This Session)
- [x] Document backend gaps
- [ ] Create GitHub issue for backend validation (P1)
- [ ] Create GitHub issue for cascading updates (P2)

### Backend Team (Future Work)
1. **Add validation** in create/update services:
   - Mutual exclusivity (Tiltak/ProsjektTiltak)
   - Circular reference prevention
   - emneId consistency checks

2. **Add cascading** (decide on strategy first):
   - Option A: Always cascade (simple, loses user overrides)
   - Option B: Add `emneIdSource` flag to track inheritance
   - Option C: Only cascade if emneId matches old parent value

3. **Add database constraints** (optional):
   - Check constraints for mutual exclusivity
   - Recursive CTE for circular reference detection

## Testing Scenarios for Backend

Once backend is implemented, test:

1. **Mutual Exclusivity**:
   - Try creating Tiltak with both parentId and kravIds → Should fail
   - Try updating Tiltak to add kravIds when has parentId → Should fail

2. **Cascading**:
   - Update parent Krav emneId → Children should update
   - Deeply nested: Grandparent → Parent → Child cascade

3. **Circular Reference**:
   - Try A.parent = B, B.parent = A → Should fail
   - Try A.parent = B, B.parent = C, C.parent = A → Should fail

4. **Edge Cases**:
   - Null inheritance (parent has null emneId)
   - Change parent to different parent
   - Remove parent (parentId → null)
