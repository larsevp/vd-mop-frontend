# Emne Propagation and Cache Management System

This document explains the emne (topic) propagation system and cache management strategy used in the EntityWorkspace to maintain data consistency across related entities.

## Overview

The system handles automatic emne inheritance and propagation between three main entity types:
- **Krav** (Requirements) - Can have an emneId
- **Tiltak** (Actions) - Inherit emneId from connected krav or parent tiltak
- **ProsjektTiltak** (Project Actions) - Inherit emneId from connected prosjektKrav or parent prosjektTiltak

## Backend Emne Propagation

### Core Service: `emnePropagationService.ts`

The backend automatically propagates emne changes through entity relationships:

#### Krav → Tiltak Propagation
When a krav's emneId changes, connected tiltak are updated via:
1. **KravTiltakJunction hooks** (`afterCreate`, `afterDestroy`) call `reevaluateTiltakEmne`
2. **Krav model hooks** (`afterUpdate`) trigger propagation to all connected tiltak
3. **ProsjektKrav model hooks** similarly handle prosjektTiltak connections

#### Tiltak Hierarchy Propagation
When a tiltak's emneId changes, the system propagates to children:
1. **Parent tiltak emne change** → All child tiltak inherit the new emneId
2. **Recursive propagation** ensures entire hierarchies stay consistent
3. **Conflict resolution** prioritizes parent emne over krav connections

#### Inheritance Priority Rules
1. **Priority 1**: Parent entity emneId (tiltak → child tiltak)
2. **Priority 2**: First connected krav emneId (krav → tiltak)
3. **Priority 3**: null (no connections)

### Implementation Details

```typescript
// When tiltak emneId changes, propagate to all children
await this.propagateEmneToChildren(tiltakId, tiltakType, newEmneId, transaction);

// Recursive propagation through hierarchy
private static async propagateEmneToChildren(
  parentTiltakId: number,
  parentTiltakType: "Tiltak" | "ProsjektTiltak",
  newEmneId: number | null,
  transaction?: Transaction
): Promise<void>
```

## Frontend Cache Management

### React Query Integration

The frontend uses React Query for caching with strategic invalidation:

#### Cache Structure
- **Query Keys**: `["tiltak", "workspace", "paginated", ...params]`
- **Grouping Queries**: `["tiltak", "workspace", "groupedByEmne", ...params]`
- **Project Context**: Project-specific entities include project ID in query key

#### Invalidation Strategy

When emne propagation occurs, affected caches are invalidated:

```javascript
// In optimisticUpdates.js - handleEmnePropagationInvalidation
export const handleEmnePropagationInvalidation = (queryClient, updatedData, originalData, entityType) => {
  const emneChanged = updatedData.emneId !== originalData?.emneId;
  
  if (emneChanged && (entityType === 'krav' || entityType === 'prosjektKrav')) {
    // Invalidate all tiltak queries - marks them stale for refetch
    queryClient.invalidateQueries({ queryKey: ["tiltak"], exact: false });
    queryClient.invalidateQueries({ queryKey: ["prosjektTiltak"], exact: false });
    queryClient.invalidateQueries({ queryKey: ["combinedEntities"], exact: false });
    
    // Force immediate refetch of active workspace views
    queryClient.refetchQueries({ 
      queryKey: ["tiltak", "workspace"], 
      exact: false, 
      type: 'active' 
    });
  }
};
```

#### Trigger Points

Cache invalidation is triggered from:
1. **EntityDetailPane save handler** - When krav/prosjektKrav emneId changes
2. **Optimistic update system** - Integrated into form save flow
3. **Mutation success callbacks** - After successful backend updates

### Form Inheritance Store

The `formInheritanceStore.js` manages form-level inheritance state:

#### Store Structure
```javascript
{
  inheritedEmne: null,           // Currently inherited emneId
  source: null,                  // 'parent' | 'krav' | 'prosjektKrav'
  sourceType: null,              // Context entity type
  parentData: null,              // Parent entity data
  relatedEntityData: null,       // Connected krav/prosjektKrav data
  hasParentConnection: false,    // Mutual exclusivity flags
  hasRelatedEntityConnection: false
}
```

#### Mutual Exclusivity
- **Parent connection** ↔ **Krav connection** are mutually exclusive
- When user selects parent tiltak → krav selection is cleared
- When user selects krav → parent selection is cleared
- Ensures inheritance follows proper priority rules

#### Entity Context Management
- **Context switching** preserves state within same entity
- **New entity creation** always resets inheritance state
- **Entity type switching** resets only when fundamentally different

## Data Flow Examples

### Example 1: Krav Emne Change
1. User changes krav emneId in EntityDetailPane
2. EntityDetailPane calls `handleEmnePropagationInvalidation`
3. React Query invalidates all tiltak queries
4. Backend propagates emneId to connected tiltak + children
5. When user navigates to tiltak workspace, fresh data is fetched
6. Tiltak now appear under correct emne groups

### Example 2: Tiltak Parent Assignment
1. User selects parent tiltak in form
2. `formInheritanceStore` receives parent data
3. Form shows inherited emneId from parent
4. On save, backend ensures consistency
5. Child tiltak hierarchy inherits parent's emneId

### Example 3: Junction Relationship Changes
1. User adds/removes krav connection to tiltak
2. KravTiltakJunction hooks trigger `reevaluateTiltakEmne`
3. Backend recalculates tiltak emneId based on priority rules
4. Frontend cache invalidation ensures UI consistency

## Key Files

### Backend
- `/backend/services/emnePropagationService.ts` - Core propagation logic
- `/backend/models/KravTiltakJunction.ts` - Junction table with propagation hooks
- `/backend/models/Tiltak.ts` - Tiltak model with cleanup hooks
- `/backend/models/Krav.ts` - Krav model with propagation triggers

### Frontend
- `/frontend/src/components/EntityWorkspace/utils/optimisticUpdates.js` - Cache invalidation
- `/frontend/src/components/EntityWorkspace/layouts/EntityDetailPane.jsx` - Trigger point
- `/frontend/src/stores/formInheritanceStore.js` - Form inheritance state
- `/frontend/src/components/EntityWorkspace/hooks/useEntityData.js` - Data fetching

## Performance Considerations

### Backend
- **Transactional consistency** ensures data integrity during propagation
- **Selective updates** only update affected records
- **Async propagation** prevents blocking main operations

### Frontend
- **Stale-while-revalidate** pattern provides immediate feedback
- **Selective invalidation** only affects related query keys
- **Active query refetch** prioritizes currently viewed data
- **Optimistic updates** provide immediate UI feedback

## Troubleshooting

### Common Issues
1. **Stale data in workspace** → Check cache invalidation triggers
2. **Inheritance not working** → Verify store mutual exclusivity logic
3. **Backend propagation failing** → Check transaction handling and hooks
4. **Performance issues** → Review query key structure and invalidation scope

### Debug Tools
- React Query DevTools for cache inspection
- Backend console logs show propagation flow
- Store state can be inspected via browser dev tools

## Future Improvements

1. **WebSocket integration** for real-time updates across users
2. **Background sync** for offline capability
3. **Partial cache updates** instead of full invalidation
4. **Optimistic hierarchy updates** for immediate visual feedback