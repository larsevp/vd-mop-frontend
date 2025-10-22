# Emne Inheritance Refactor - Industry Standard Solution

**Date**: 2025-10-22
**Status**: DESIGN PHASE
**Approach**: Option 2 - Proper Refactor (Industry Standard)

---

## Problem Statement

Current emne inheritance implementation violates the project's 4-layer architecture:
- ❌ Business logic in field component (emneSelect.jsx)
- ❌ useEffect syncing between two sources of truth (form state + inheritance store)
- ❌ Complex timing dependencies (50ms timeout, race conditions)
- ❌ Hook with 25+ properties (violates single responsibility)

---

## Solution: Align with EntityWorkspace → DTO → Adapter Pattern

### Core Principle: Derived State, Not Synced State

```javascript
// CURRENT (wrong): Two sources of truth
formData.emneId = 5;           // Form state
inheritedEmne = 3;             // Inheritance store
// ❌ Which wins? Race conditions!

// CORRECT (industry standard): Single source of truth
const effectiveEmneId = adapter.getEffectiveEmneId(entity, parentData, kravData);
// ✅ Computed on demand, no sync needed
```

---

## Architecture Design

### Layer 1: Adapter (Business Logic)

**File**: `KravTiltakCombinedAdapter.js` (and individual adapters)

**Responsibility**: Compute inherited emneId based on business rules

```javascript
class KravTiltakCombinedAdapter {
  /**
   * Get effective emneId for an entity based on inheritance rules
   * Business rule: Child inherits from parent OR related entity (mutual exclusivity)
   *
   * @param {Object} entity - The entity being edited
   * @param {Object} parentData - Parent entity data (from parentId lookup)
   * @param {Object} relatedEntityData - Related entity data (from krav/prosjektKrav lookup)
   * @returns {Object} { emneId, source, isInherited }
   */
  getEffectiveEmneId(entity, parentData, relatedEntityData) {
    // Priority 1: User has manually set emneId (override inheritance)
    if (entity.__userSetEmneId) {
      return {
        emneId: entity.emneId,
        source: null,
        isInherited: false
      };
    }

    // Priority 2: Inherit from parent (if exists)
    if (parentData) {
      return {
        emneId: parentData.emneId || null,
        source: 'parent',
        sourceData: parentData,
        isInherited: true
      };
    }

    // Priority 3: Inherit from related entity (krav/prosjektKrav)
    if (relatedEntityData) {
      return {
        emneId: relatedEntityData.emneId || null,
        source: 'relatedEntity',
        sourceData: relatedEntityData,
        isInherited: true
      };
    }

    // No inheritance
    return {
      emneId: entity.emneId || null,
      source: null,
      isInherited: false
    };
  }

  /**
   * Validate inheritance rules before save
   * Business rule: Cannot have both parent AND relatedEntity connections
   */
  validateInheritance(entity) {
    const hasParent = !!entity.parentId;
    const hasRelatedEntity = !!(entity.kravIds?.length || entity.prosjektKravIds?.length);

    if (hasParent && hasRelatedEntity) {
      throw new Error('Kan ikke ha både overordnet element og krav-tilknytning samtidig');
    }

    return true;
  }
}
```

### Layer 2: DTO (Entity Enhancement)

**File**: `CombinedEntityDTO.js`

**Responsibility**: Enhance entities with computed inheritance metadata

```javascript
class CombinedEntityDTO extends EntityDTOInterface {
  /**
   * Enhance entity with inheritance metadata
   * DTO pre-computes derived state so components don't have to
   */
  enhanceEntity(rawEntity) {
    let enhanced = this.adapter.enhanceEntity(rawEntity);

    // DTO adds inheritance metadata for UI rendering
    // This is computed once when entity loads, not on every render
    if (enhanced && this.adapter.getEffectiveEmneId) {
      const inheritanceInfo = this.adapter.getEffectiveEmneId(
        enhanced,
        enhanced.__parentData,      // Fetched by form component
        enhanced.__relatedEntityData // Fetched by form component
      );

      enhanced.__inheritedEmneId = inheritanceInfo.emneId;
      enhanced.__inheritanceSource = inheritanceInfo.source;
      enhanced.__inheritanceSourceData = inheritanceInfo.sourceData;
      enhanced.__isEmneInherited = inheritanceInfo.isInherited;
    }

    // DTO responsibility: Force normalize entityType
    if (enhanced?.entityType) {
      enhanced.entityType = enhanced.entityType.toLowerCase();
      enhanced.renderId = `${enhanced.entityType}-${enhanced.id}`;
    }

    return enhanced;
  }

  /**
   * Pre-save: Re-compute inheritance and validate
   */
  async save(entityData, isUpdate) {
    // Validate inheritance rules
    if (this.adapter.validateInheritance) {
      this.adapter.validateInheritance(entityData);
    }

    // If emneId is inherited and user didn't override, use inherited value
    if (entityData.__isEmneInherited && !entityData.__userSetEmneId) {
      entityData.emneId = entityData.__inheritedEmneId;
    }

    // Delegate to adapter for actual save
    return await this.adapter.save(entityData, isUpdate);
  }
}
```

### Layer 3: Form Component (Pure Presentation)

**File**: `EntityDetailPane.jsx` (form component)

**Responsibility**: Fetch parent/krav data, display computed values, handle user interaction

```javascript
// In EntityDetailPane.jsx or a custom hook
const useEntityInheritance = (entity, formData) => {
  // Fetch parent data if parentId exists
  const { data: parentData } = useQuery({
    queryKey: ['parent', formData.parentId],
    queryFn: () => fetchParentEntity(formData.parentId),
    enabled: !!formData.parentId
  });

  // Fetch related entity data if kravIds exist
  const { data: relatedEntityData } = useQuery({
    queryKey: ['relatedEntity', formData.kravIds],
    queryFn: () => fetchFirstKrav(formData.kravIds),
    enabled: !!(formData.kravIds?.length > 0)
  });

  // Attach data to entity for adapter to use
  const enhancedEntity = {
    ...entity,
    ...formData,
    __parentData: parentData,
    __relatedEntityData: relatedEntityData
  };

  // Ask adapter for effective emneId (business logic stays in adapter)
  const inheritanceInfo = dto.adapter.getEffectiveEmneId(
    enhancedEntity,
    parentData,
    relatedEntityData
  );

  return {
    effectiveEmneId: inheritanceInfo.emneId,
    isInherited: inheritanceInfo.isInherited,
    inheritanceSource: inheritanceInfo.source,
    inheritanceSourceData: inheritanceInfo.sourceData,
    parentDisabled: !!relatedEntityData,
    kravDisabled: !!parentData
  };
};

// In form component
const EntityDetailPane = ({ entity, modelConfig, onSave }) => {
  const [formData, setFormData] = useState(initializeFormData(entity));
  const inheritance = useEntityInheritance(entity, formData);

  const handleFieldChange = (fieldName, value) => {
    // Mark if user manually sets emneId (override inheritance)
    if (fieldName === 'emneId') {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value,
        __userSetEmneId: true  // User override flag
      }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }
  };

  // Render form with computed values
  return (
    <form>
      <EmneSelect
        value={inheritance.effectiveEmneId}  // ✅ Derived state
        onChange={(e) => handleFieldChange('emneId', e.target.value)}
        disabled={inheritance.isInherited}
        placeholder={inheritance.isInherited
          ? `Arves fra ${inheritance.inheritanceSourceData?.tittel}`
          : 'Velg emne'
        }
      />
      {inheritance.isInherited && (
        <InheritanceIndicator source={inheritance.inheritanceSource} data={inheritance.inheritanceSourceData} />
      )}
    </form>
  );
};
```

### Layer 4: Field Component (Dumb Component)

**File**: `emneSelect.jsx`

**Responsibility**: Display value, handle onChange - NO business logic

```javascript
export const emneSelectType = {
  emneselect: ({ field, value, onChange, error, disabled, placeholder }) => {
    // ✅ Pure presentation - just display what we're told
    return (
      <EmneSelect
        name={field.name}
        value={value}                    // From parent (computed)
        onChange={onChange}              // Pass through
        disabled={disabled}              // From parent (computed)
        placeholder={placeholder}        // From parent (computed)
        label={field.label}
        required={field.required && !disabled}
        error={error}
      />
    );
  }
};
```

---

## Implementation Plan

### Phase 1: Add Inheritance Methods to Adapters ✅

1. Add `getEffectiveEmneId()` to `KravTiltakCombinedAdapter`
2. Add `validateInheritance()` to `KravTiltakCombinedAdapter`
3. Add same methods to `ProsjektKravTiltakCombinedAdapter`
4. Test adapter methods in isolation

### Phase 2: Update DTO to Use Adapter Methods ✅

1. Modify `CombinedEntityDTO.enhanceEntity()` to add inheritance metadata
2. Modify `CombinedEntityDTO.save()` to validate and apply inheritance
3. Test DTO enhancement with mock data

### Phase 3: Update Form Component ✅

1. Create `useEntityInheritance` hook in `EntityDetailPane/helpers/`
2. Hook fetches parent/krav data using TanStack Query
3. Hook calls adapter's `getEffectiveEmneId()` for business logic
4. Form uses computed values from hook (no sync logic)
5. Form marks `__userSetEmneId` when user overrides

### Phase 4: Simplify emneSelect Field Component ✅

1. Remove all useEffect sync logic
2. Remove sessionStorage tracking
3. Remove inheritance store usage
4. Make it pure: value, onChange, disabled, placeholder (all from props)

### Phase 5: Add Visual Indicators ✅

1. Create `InheritanceIndicator.jsx` component
2. Show "↳ Arves fra: [parent.tittel]" under emneSelect
3. Add visual distinction (blue badge, icon)

### Phase 6: Deprecate Old Inheritance Store (Optional)

1. Keep `formInheritanceStore.js` for now (might be used elsewhere)
2. Document as deprecated
3. Remove if no other usage found

---

## Benefits of This Approach

### ✅ Aligns with Project Architecture
- EntityWorkspace → DTO → Adapter → Renderer pattern
- Business logic in adapter layer
- DTO handles enhancement
- Components are presentational

### ✅ Industry Standard Patterns
- **Derived state** instead of synced state
- **Single source of truth** (adapter computes, components display)
- **No race conditions** (no useEffect timing dependencies)
- **Easier to test** (adapter methods vs component behavior)
- **Separation of concerns** (business logic ≠ UI logic)

### ✅ Simpler Code
- No complex useEffect hooks in components
- No sessionStorage fragility
- No 50ms timeout workarounds
- Hook with focused responsibility (fetch data, call adapter)

### ✅ Better UX
- Clear visual inheritance indicators
- User can override inherited values
- Mutual exclusivity enforced at business logic layer

---

## Migration Strategy

### Backwards Compatibility
- Keep inheritance store (might be used in old TableComponents)
- New EntityWorkspace uses new pattern
- Old code continues to work

### Testing Strategy
1. Unit test adapter methods (`getEffectiveEmneId`, `validateInheritance`)
2. Integration test DTO enhancement
3. E2E test: Create krav with parent → verify emne inherited
4. E2E test: Create tiltak with krav → verify emne inherited
5. E2E test: User override → verify custom emne saved

---

## Success Criteria

- ✅ Creating child entity with parent → emneId inherited correctly
- ✅ Creating child entity with krav → emneId inherited correctly
- ✅ User can override inherited emneId
- ✅ Cannot set both parent AND krav (mutual exclusivity)
- ✅ Visual indicator shows inheritance source
- ✅ No useEffect timing issues
- ✅ No race conditions
- ✅ Code follows project architecture patterns

---

## Files to Modify

### Core Implementation
1. `/src/pages/KravTiltak/combined/kravtiltak/adapter/KravTiltakCombinedAdapter.js` - Add business logic methods
2. `/src/pages/KravTiltak/combined/prosjektkravtiltak/adapter/ProsjektKravTiltakCombinedAdapter.js` - Add business logic methods
3. `/src/components/EntityWorkspace/interface/data/CombinedEntityDTO.js` - Add enhancement logic
4. `/src/pages/KravTiltak/shared/components/EntityDetailPane/helpers/useEntityInheritance.js` - **NEW** hook
5. `/src/pages/KravTiltak/shared/components/EntityDetailPane/EntityDetailPane.jsx` - Use new hook
6. `/src/components/tableComponents/fieldTypes/entityTypes/emneSelect.jsx` - Simplify to pure component

### Visual Indicators
7. `/src/pages/KravTiltak/shared/components/InheritanceIndicator.jsx` - **NEW** component

---

## Next Steps

1. ✅ Get user approval for this design
2. → Implement Phase 1: Add adapter methods
3. → Implement Phase 2: Update DTO
4. → Implement Phase 3: Create useEntityInheritance hook
5. → Implement Phase 4: Simplify emneSelect
6. → Implement Phase 5: Add visual indicators
7. → Test end-to-end
8. → Document for team

---

## Questions for Review

1. Should we keep the inheritance store for backwards compatibility?
2. Do we want user override functionality, or always enforce inheritance?
3. Should null emneId from parent also be inherited (currently: yes)?
4. Visual indicator design preference?
