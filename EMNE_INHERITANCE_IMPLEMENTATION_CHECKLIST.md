# Emne Inheritance - Implementation Checklist

**Date**: 2025-10-22
**Status**: READY TO IMPLEMENT ✅

---

## Requirements Confirmed ✅

- ✅ Mutual exclusivity = XOR (parent OR krav, NOT both)
- ✅ Send inherited emneId to backend (explicit value)
- ✅ Recompute inheritance on edit mode
- ✅ Tiltak ↔ Krav connections with mutual exclusivity
- ✅ ProsjektTiltak ↔ ProsjektKrav connections with mutual exclusivity
- ✅ Frontend + Backend validation (defense in depth)
- ✅ Null inheritance supported
- ✅ No user override (disabled field)

---

## Implementation Phases

### Phase 1: Adapter Layer (Business Logic)
**Effort**: 2-3 hours

#### 1.1 KravAdapter
**File**: `/src/pages/KravTiltak/krav/adapter/KravAdapter.js`

```javascript
// Add method
getEffectiveEmneId(entity, parentData) {
  // Only one source: parent
  if (entity.parentId && parentData) {
    return {
      emneId: parentData.emneId || null,
      source: 'parent',
      sourceData: parentData,
      isInherited: true,
      hasParentConnection: true,
      hasKravConnection: false,
      parentDisabled: false,
      kravDisabled: false,  // Krav has no krav connections
    };
  }

  return {
    emneId: entity.emneId || null,
    source: null,
    sourceData: null,
    isInherited: false,
    hasParentConnection: false,
    hasKravConnection: false,
    parentDisabled: false,
    kravDisabled: false,
  };
}
```

#### 1.2 TiltakAdapter
**File**: `/src/pages/KravTiltak/tiltak/adapter/TiltakAdapter.js`

```javascript
// Add method
getEffectiveEmneId(entity, parentData, kravData) {
  const hasParent = !!entity.parentId;
  const hasKrav = !!(entity.kravIds?.length > 0);

  // Priority 1: Parent (if exists)
  if (hasParent && parentData) {
    return {
      emneId: parentData.emneId || null,
      source: 'parent',
      sourceData: parentData,
      isInherited: true,
      hasParentConnection: true,
      hasKravConnection: false,
      parentDisabled: false,
      kravDisabled: true,  // ← Mutual exclusivity: krav disabled
    };
  }

  // Priority 2: Krav (if exists)
  if (hasKrav && kravData) {
    return {
      emneId: kravData.emneId || null,
      source: 'krav',
      sourceData: kravData,
      isInherited: true,
      hasParentConnection: false,
      hasKravConnection: true,
      parentDisabled: true,  // ← Mutual exclusivity: parent disabled
      kravDisabled: false,
    };
  }

  // No inheritance
  return {
    emneId: entity.emneId || null,
    source: null,
    sourceData: null,
    isInherited: false,
    hasParentConnection: false,
    hasKravConnection: false,
    parentDisabled: false,
    kravDisabled: false,
  };
}
```

#### 1.3 ProsjektKravAdapter
**File**: `/src/pages/KravTiltak/combined/prosjektkravtiltak/adapter/ProsjektKravAdapter.js`

```javascript
// Same logic as KravAdapter (only parent, no krav connections)
getEffectiveEmneId(entity, parentData) {
  // ... same as Krav
}
```

#### 1.4 ProsjektTiltakAdapter
**File**: `/src/pages/KravTiltak/combined/prosjektkravtiltak/adapter/ProsjektTiltakAdapter.js`

```javascript
// Same logic as TiltakAdapter (parent OR prosjektKrav, mutual exclusivity)
getEffectiveEmneId(entity, parentData, prosjektKravData) {
  const hasParent = !!entity.parentId;
  const hasKrav = !!(entity.prosjektKravIds?.length > 0);

  // Priority 1: Parent
  if (hasParent && parentData) {
    return {
      emneId: parentData.emneId || null,
      source: 'parent',
      sourceData: parentData,
      isInherited: true,
      hasParentConnection: true,
      hasKravConnection: false,
      parentDisabled: false,
      kravDisabled: true,  // ← Mutual exclusivity
    };
  }

  // Priority 2: ProsjektKrav
  if (hasKrav && prosjektKravData) {
    return {
      emneId: prosjektKravData.emneId || null,
      source: 'prosjektKrav',
      sourceData: prosjektKravData,
      isInherited: true,
      hasParentConnection: false,
      hasKravConnection: true,
      parentDisabled: true,  // ← Mutual exclusivity
      kravDisabled: false,
    };
  }

  // No inheritance
  return {
    emneId: entity.emneId || null,
    source: null,
    sourceData: null,
    isInherited: false,
    hasParentConnection: false,
    hasKravConnection: false,
    parentDisabled: false,
    kravDisabled: false,
  };
}
```

#### 1.5 Combined Adapters
**Files**:
- `/src/pages/KravTiltak/combined/kravtiltak/adapter/KravTiltakCombinedAdapter.js`
- `/src/pages/KravTiltak/combined/prosjektkravtiltak/adapter/ProsjektKravTiltakCombinedAdapter.js`

```javascript
// Delegate to individual adapters
getEffectiveEmneId(entity, parentData, kravData) {
  const entityType = this.detectEntityType(entity);

  if (entityType === 'krav') {
    return this.kravAdapter.getEffectiveEmneId(entity, parentData);
  }

  if (entityType === 'tiltak') {
    return this.tiltakAdapter.getEffectiveEmneId(entity, parentData, kravData);
  }

  // Fallback
  return {
    emneId: entity.emneId || null,
    source: null,
    isInherited: false,
    hasParentConnection: false,
    hasKravConnection: false,
    parentDisabled: false,
    kravDisabled: false,
  };
}
```

**Checklist**:
- [ ] Add `getEffectiveEmneId()` to KravAdapter
- [ ] Add `getEffectiveEmneId()` to TiltakAdapter (with mutual exclusivity)
- [ ] Add `getEffectiveEmneId()` to ProsjektKravAdapter
- [ ] Add `getEffectiveEmneId()` to ProsjektTiltakAdapter (with mutual exclusivity)
- [ ] Add `getEffectiveEmneId()` to KravTiltakCombinedAdapter
- [ ] Add `getEffectiveEmneId()` to ProsjektKravTiltakCombinedAdapter

---

### Phase 2: Data Fetching Hook
**Effort**: 3-4 hours

#### 2.1 Create useEmneInheritance Hook
**File**: `/src/pages/KravTiltak/shared/components/EntityDetailPane/helpers/useEmneInheritance.js` (NEW)

```javascript
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Hook for computing emne inheritance with reactive parent/krav data fetching
 *
 * @param {Object} entity - Current entity being edited
 * @param {Object} formData - Current form state
 * @param {Object} dto - DTO instance with adapter
 * @returns {Object} Inheritance info + mutual exclusivity flags
 */
export const useEmneInheritance = (entity, formData, dto) => {
  const entityType = entity?.entityType || formData?.__entityType;

  // Determine which parent/krav fetchers to use based on entity type
  const parentFetcher = useMemo(() => {
    switch (entityType) {
      case 'krav': return fetchKrav;
      case 'tiltak': return fetchTiltak;
      case 'prosjektKrav': return fetchProsjektKrav;
      case 'prosjektTiltak': return fetchProsjektTiltak;
      default: return null;
    }
  }, [entityType]);

  const kravFetcher = useMemo(() => {
    switch (entityType) {
      case 'tiltak': return fetchKrav;
      case 'prosjektTiltak': return fetchProsjektKrav;
      default: return null;
    }
  }, [entityType]);

  // Fetch parent data (if parentId exists)
  const { data: parentData, isLoading: parentLoading } = useQuery({
    queryKey: ['parent', entityType, formData.parentId],
    queryFn: () => parentFetcher(formData.parentId),
    enabled: !!formData.parentId && !!parentFetcher,
  });

  // Fetch krav data (if kravIds exists) - first krav only
  const firstKravId = formData.kravIds?.[0] || formData.prosjektKravIds?.[0];
  const { data: kravData, isLoading: kravLoading } = useQuery({
    queryKey: ['krav', entityType, firstKravId],
    queryFn: () => kravFetcher(firstKravId),
    enabled: !!firstKravId && !!kravFetcher,
  });

  // Compute inheritance info using adapter business logic
  const inheritanceInfo = useMemo(() => {
    if (!dto?.adapter?.getEffectiveEmneId) {
      return {
        emneId: formData.emneId || null,
        source: null,
        isInherited: false,
        hasParentConnection: false,
        hasKravConnection: false,
        parentDisabled: false,
        kravDisabled: false,
      };
    }

    return dto.adapter.getEffectiveEmneId(
      formData,
      parentData,
      kravData
    );
  }, [
    formData.parentId,
    formData.kravIds,
    formData.prosjektKravIds,
    formData.emneId,
    parentData?.emneId,
    kravData?.emneId,
    dto,
  ]);

  return {
    ...inheritanceInfo,
    parentLoading,
    kravLoading,
    isLoading: parentLoading || kravLoading,
  };
};
```

**Import fetchers** (need to verify these exist):
```javascript
import { getKrav } from '@/api/endpoints/models/krav';
import { getTiltak } from '@/api/endpoints/models/tiltak';
import { getProsjektKrav } from '@/api/endpoints/models/prosjektKrav';
import { getProsjektTiltak } from '@/api/endpoints/models/prosjektTiltak';

const fetchKrav = (id) => getKrav(id).then(res => res.data);
// ... etc
```

**Checklist**:
- [ ] Create `useEmneInheritance.js` hook
- [ ] Import entity fetcher functions
- [ ] Add parent data fetching with TanStack Query
- [ ] Add krav data fetching with TanStack Query (first krav only)
- [ ] Call adapter.getEffectiveEmneId() with proper memoization
- [ ] Return inheritance info + loading states
- [ ] Test with different entity types

---

### Phase 3: Form Component Integration
**Effort**: 2-3 hours

#### 3.1 Update EntityDetailPane
**File**: `/src/pages/KravTiltak/shared/components/EntityDetailPane/EntityDetailPane.jsx`

```javascript
import { useEmneInheritance } from './helpers/useEmneInheritance';

const EntityDetailPane = ({ entity, modelConfig, onSave, onDelete, dto }) => {
  const [formData, setFormData] = useState(initializeFormData(entity, modelConfig));

  // Get inheritance info
  const inheritanceInfo = useEmneInheritance(entity, formData, dto);

  // Sync inherited emneId to form when it changes
  useEffect(() => {
    // Only sync if:
    // 1. Field is inherited
    // 2. Not currently loading parent/krav data
    // 3. Value actually changed
    if (
      inheritanceInfo.isInherited &&
      !inheritanceInfo.isLoading &&
      formData.emneId !== inheritanceInfo.emneId
    ) {
      setFormData(prev => ({
        ...prev,
        emneId: inheritanceInfo.emneId,
      }));
    }
  }, [
    inheritanceInfo.emneId,
    inheritanceInfo.isInherited,
    inheritanceInfo.isLoading,
  ]);

  // Render form with inheritance-aware field props
  return (
    <form>
      {/* Render fields using FieldResolver */}
      {visibleFields.map(field => {
        // Special handling for emneId field
        if (field.name === 'emneId') {
          return (
            <FieldComponent
              key={field.name}
              field={field}
              value={formData.emneId}
              onChange={handleFieldChange}
              disabled={inheritanceInfo.isInherited}
              placeholder={
                inheritanceInfo.isLoading
                  ? "Laster emne..."
                  : inheritanceInfo.isInherited
                    ? `Arves fra ${inheritanceInfo.sourceData?.tittel || inheritanceInfo.source}`
                    : field.placeholder
              }
            />
          );
        }

        // Special handling for parentId field (Tiltak/ProsjektTiltak)
        if (field.name === 'parentId') {
          return (
            <FieldComponent
              key={field.name}
              field={field}
              value={formData.parentId}
              onChange={handleFieldChange}
              disabled={inheritanceInfo.parentDisabled}
              placeholder={
                inheritanceInfo.parentDisabled
                  ? "Deaktivert - fjern krav-tilknytning først"
                  : field.placeholder
              }
            />
          );
        }

        // Special handling for kravIds/prosjektKravIds field
        if (field.name === 'kravIds' || field.name === 'prosjektKravIds') {
          return (
            <FieldComponent
              key={field.name}
              field={field}
              value={formData[field.name]}
              onChange={handleFieldChange}
              disabled={inheritanceInfo.kravDisabled}
              placeholder={
                inheritanceInfo.kravDisabled
                  ? "Deaktivert - fjern overordnet tiltak først"
                  : field.placeholder
              }
            />
          );
        }

        // Default field rendering
        return (
          <FieldComponent
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={handleFieldChange}
          />
        );
      })}
    </form>
  );
};
```

**Checklist**:
- [ ] Import `useEmneInheritance` hook
- [ ] Call hook with entity, formData, dto
- [ ] Add useEffect to sync inheritance → formData
- [ ] Add loading state check to useEffect
- [ ] Pass disabled/placeholder to emneId field
- [ ] Pass disabled/placeholder to parentId field (mutual exclusivity)
- [ ] Pass disabled/placeholder to kravIds field (mutual exclusivity)
- [ ] Test sync behavior

---

### Phase 4: Visual Indicators
**Effort**: 1-2 hours

#### 4.1 Add Inheritance Indicator Component (Optional)
**File**: `/src/pages/KravTiltak/shared/components/InheritanceIndicator.jsx` (NEW)

```javascript
export const InheritanceIndicator = ({ source, sourceData }) => {
  if (!source || !sourceData) return null;

  const getSourceLabel = (source) => {
    switch (source) {
      case 'parent': return 'overordnet element';
      case 'krav': return 'tilknyttet krav';
      case 'prosjektKrav': return 'tilknyttet prosjektkrav';
      default: return source;
    }
  };

  return (
    <div className="text-sm text-blue-600 mt-1 flex items-center gap-1">
      <span>↳</span>
      <span>
        Arves fra {getSourceLabel(source)}: <strong>{sourceData.tittel}</strong>
      </span>
    </div>
  );
};
```

**Usage in EntityDetailPane**:
```javascript
{field.name === 'emneId' && inheritanceInfo.isInherited && (
  <InheritanceIndicator
    source={inheritanceInfo.source}
    sourceData={inheritanceInfo.sourceData}
  />
)}
```

**Checklist**:
- [ ] Create InheritanceIndicator component
- [ ] Add to emneId field when inherited
- [ ] Style with blue color + arrow icon
- [ ] Show source entity title

---

### Phase 5: Testing
**Effort**: 3-4 hours

#### 5.1 Unit Tests (Adapter Methods)
```javascript
describe('TiltakAdapter.getEffectiveEmneId', () => {
  it('should inherit from parent when parentId exists', () => {
    const entity = { parentId: 5, kravIds: [] };
    const parentData = { id: 5, emneId: 3 };

    const result = adapter.getEffectiveEmneId(entity, parentData, null);

    expect(result.emneId).toBe(3);
    expect(result.source).toBe('parent');
    expect(result.isInherited).toBe(true);
    expect(result.kravDisabled).toBe(true); // Mutual exclusivity
  });

  it('should inherit from krav when kravIds exists', () => {
    const entity = { parentId: null, kravIds: [10] };
    const kravData = { id: 10, emneId: 7 };

    const result = adapter.getEffectiveEmneId(entity, null, kravData);

    expect(result.emneId).toBe(7);
    expect(result.source).toBe('krav');
    expect(result.isInherited).toBe(true);
    expect(result.parentDisabled).toBe(true); // Mutual exclusivity
  });

  it('should handle null inheritance', () => {
    const entity = { parentId: 5, kravIds: [] };
    const parentData = { id: 5, emneId: null };

    const result = adapter.getEffectiveEmneId(entity, parentData, null);

    expect(result.emneId).toBe(null);
    expect(result.isInherited).toBe(true);
  });
});
```

#### 5.2 Manual E2E Testing Scenarios

**Test 1: Krav with Parent**
- [ ] Create new Krav
- [ ] Select parentId → verify emne inherits
- [ ] Verify emneSelect is disabled
- [ ] Change parentId → verify emne updates
- [ ] Remove parentId → verify emneSelect enabled

**Test 2: Tiltak with Parent (Mutual Exclusivity)**
- [ ] Create new Tiltak
- [ ] Select parentId → verify emne inherits
- [ ] Verify kravIds selector is disabled
- [ ] Remove parentId → verify kravIds enabled

**Test 3: Tiltak with Krav (Mutual Exclusivity)**
- [ ] Create new Tiltak
- [ ] Select kravIds → verify emne inherits from first
- [ ] Verify parentId selector is disabled
- [ ] Remove kravIds → verify parentId enabled

**Test 4: ProsjektTiltak with Parent**
- [ ] Same as Test 2 but for ProsjektTiltak

**Test 5: ProsjektTiltak with ProsjektKrav**
- [ ] Same as Test 3 but for ProsjektTiltak + ProsjektKrav

**Test 6: Null Inheritance**
- [ ] Select parent that has emneId = null
- [ ] Verify child gets null
- [ ] Verify field still disabled

**Test 7: Edit Mode**
- [ ] Open existing entity with parent
- [ ] Verify inheritance recomputed on load
- [ ] Change parent → verify emne updates

**Test 8: Loading States**
- [ ] Select parent with slow API
- [ ] Verify loading placeholder shows
- [ ] Verify no flashing values

---

## Backend TODOs (Separate Tasks)

### TODO 1: Mutual Exclusivity Validation (P1)
**Backend validation** in Tiltak and ProsjektTiltak save endpoints

```typescript
// Add to backend
if (data.parentId && (data.kravIds?.length > 0 || data.prosjektKravIds?.length > 0)) {
  throw new ValidationError(
    "Kan ikke ha både overordnet tiltak og krav-tilknytning samtidig"
  );
}
```

### TODO 2: Cascading emneId Updates (P2)
**When parent emneId changes**, optionally update all children

```sql
-- Example: Update all children when parent changes
UPDATE krav
SET emneId = NEW.emneId
WHERE parentId = NEW.id
```

### TODO 3: Circular Reference Prevention (P1)
**Prevent circular parent chains**

```typescript
function validateParentId(entityId, parentId) {
  // Check for circular references
  let current = parentId;
  const visited = new Set([entityId]);

  while (current) {
    if (visited.has(current)) {
      throw new ValidationError("Circular parent reference");
    }
    visited.add(current);
    current = getEntity(current).parentId;
  }
}
```

---

## Completion Checklist

### Phase 1: Adapters ✅
- [ ] KravAdapter.getEffectiveEmneId()
- [ ] TiltakAdapter.getEffectiveEmneId()
- [ ] ProsjektKravAdapter.getEffectiveEmneId()
- [ ] ProsjektTiltakAdapter.getEffectiveEmneId()
- [ ] CombinedAdapters delegation

### Phase 2: Hook ✅
- [ ] Create useEmneInheritance hook
- [ ] TanStack Query parent fetching
- [ ] TanStack Query krav fetching
- [ ] Proper memoization
- [ ] Loading states

### Phase 3: Form ✅
- [ ] Import and use hook in EntityDetailPane
- [ ] useEffect sync with loading check
- [ ] Pass disabled to emneId field
- [ ] Pass disabled to parentId field (mutual exclusivity)
- [ ] Pass disabled to kravIds field (mutual exclusivity)
- [ ] Proper placeholders

### Phase 4: Visual ✅
- [ ] InheritanceIndicator component
- [ ] Show inheritance source
- [ ] Loading state placeholders
- [ ] Mutual exclusivity messages

### Phase 5: Testing ✅
- [ ] Unit tests for adapter methods
- [ ] E2E test all scenarios
- [ ] Test mutual exclusivity
- [ ] Test loading states
- [ ] Test edit mode

### Documentation ✅
- [ ] Add code comments
- [ ] Document business rules
- [ ] Create backend TODO tickets

---

## Ready to Implement! 🚀

All requirements are clear, architecture is designed, critical fixes identified.

**Estimated Total Effort**: 12-16 hours
**Recommended Approach**: Implement phase by phase, test each phase before moving to next.

Proceed?
