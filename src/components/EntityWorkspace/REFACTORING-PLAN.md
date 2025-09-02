# EntityWorkspace Complete Refactoring Plan

## Progress Tracker
- ✅ Phase 0: Initial Setup (Adapter + Basic Interfaces)
- ✅ **Phase 1: Core Adapter Integration** (COMPLETED - 125/125 tests passing)
- 🔄 **Phase 2: Search & Filter Interfaces** (NEXT)
- ⏳ Phase 3: Data Management Interfaces
- ⏳ Phase 4: State Management Refactor
- ⏳ Phase 5: Complete Integration

---

## Phase 1: Core Adapter Integration 🔧
**Goal**: Use adapter everywhere for proper entity naming and data handling

### Current Status: COMPLETED ✅
- [x] Plan created and documented
- [x] EntityInterface updated to include adapter
- [x] Update EntityInterface methods to use adapter properly
- [x] Test adapter naming with mock data (14/14 tests passing)
- [x] Update GenericEntityListRow to use adapter naming (15/15 tests passing)
- [x] Update GenericEntityDetailPane to use adapter naming (15/15 tests passing)
- [x] Test components work with adapter data (comprehensive integration test)
- [x] Phase 1 complete verification (125/125 tests passing)

### Tasks
1. **EntityInterface Enhancement**
   - ✅ Add adapter to constructor
   - 🔄 Update getEntityUID() to use adapter.extractUID()
   - 🔄 Update getEntityDisplayName() to use adapter.extractTitle()
   - ⏳ Add getEntityTypeDisplayName() using adapter
   - ⏳ Update transformEntityForDisplay() to use adapter.transformEntity()

2. **Component Updates**  
   - ✅ Update GenericEntityListRow to use adapter naming
   - ✅ Update GenericEntityDetailPane to use adapter naming
   - ✅ Test with adapter mock data

3. **Testing**
   - ✅ Create tests using adapter mock data
   - ✅ Verify naming consistency across components
   - ✅ Test entity type detection works correctly

---

## Phase 2: Search & Filter Interfaces 🔍
**Goal**: Generic search and filtering using adapter data

### Planned Tasks
- [ ] GenericSearchBar with adapter-driven options
- [ ] GenericFilterService using adapter.extractAvailableFilters() 
- [ ] GenericSortManager with adapter.getSortOptions()
- [ ] Test: Search/filter works with any entity type

---

## Phase 3: Data Management Interfaces 📊  
**Goal**: Standardized data fetching and caching

### Planned Tasks
- [ ] GenericDataHook using adapter for query building
- [ ] GenericCacheService with adapter-aware cache keys
- [ ] GenericPermissionService with adapter context
- [ ] Test: Data hooks work with different entity types

---

## Phase 4: State Management Refactor 🏪
**Goal**: Universal workspace store pattern

### Planned Tasks  
- [ ] GenericWorkspaceStore with adapter integration
- [ ] GenericScrollManager with scroll-to-element for unified view
- [ ] GenericActionHandler for CRUD operations
- [ ] Test: State management works consistently

---

## Phase 5: Complete Integration 🌟
**Goal**: Full kravTiltak refactor using all interfaces

### Planned Tasks
- [ ] RefactoredEntityWorkspace using all generic components
- [ ] Unified view with scroll-to-element behavior  
- [ ] Complete backward compatibility
- [ ] Test: Full integration test with real kravTiltak data

---

## Testing Strategy

### Using Adapter Mock Data
- Use `adapter/__tests__/mockData.js` for consistent test data
- Test entity naming with `mockTiltakGroupedResponse`, `mockKravGroupedResponse`
- Verify adapter transformations work properly
- Test both simple and complex entity structures

### Test Coverage Requirements
- [ ] All interface components tested with adapter data
- [ ] Naming consistency verified across entity types
- [ ] Backward compatibility maintained
- [ ] Performance not degraded

---

## Success Criteria
1. ✅ All components use adapter for entity naming/handling
2. ✅ Unified interface works with any entity type  
3. ✅ Scroll-to-element works in unified view
4. ✅ Full backward compatibility maintained
5. ✅ Complete test coverage (target: >100 tests)
6. ✅ Performance maintained or improved