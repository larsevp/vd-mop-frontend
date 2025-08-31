# EntityWorkspace Refactoring Instructions

## Current Situation
The EntityWorkspace refactoring has become too complex and broken. We need to start over from the last working version and do this properly, step by step.

## What Went Wrong
1. **Too aggressive refactoring** - Deleted too many working components at once
2. **Sample data loading** - Added unnecessary sample data instead of using backend data
3. **Over-engineered components** - Made HeaderSearchBar and SplitLayout too complex
4. **Missing data connections** - Lost connection to actual backend data fetching
5. **Styling issues** - Search bar and split line don't match original clean design

## The Right Approach

### Step 1: Restore from Last Working Version
```bash
git checkout 6be588d  # Last working commit
git checkout -b entityworkspace-refactor-v2
```

### Step 2: Analyze What Actually Works
Before changing anything:
- Document the current working architecture
- List the exact components that work well
- Identify only the specific pain points that need fixing
- Note the data flow and backend connections

### Step 3: One-by-One Refactoring (NOT all at once)

#### Phase A: Split Large Files Only
- Keep EntityWorkspaceCore.jsx working
- Only split the 511-line EntityDetailPane.jsx into smaller components
- Keep all hooks and data connections intact
- Test after each split

#### Phase B: Consolidate Hooks (if needed)
- Keep existing hooks working
- Only combine if there's clear benefit
- Test data flow after each change

#### Phase C: Clean Up Shared Components
- Audit what's actually used in /shared/
- Remove only unused components
- Keep working search and filter components

### Step 4: Principles for This Refactor

#### DO:
- ✅ Keep backend data connections working
- ✅ Preserve existing clean styling 
- ✅ Maintain working search/filter functionality
- ✅ Keep resizable split panes as they were
- ✅ Test after each small change
- ✅ Focus on splitting files, not rewriting logic

#### DON'T:
- ❌ Add sample data or mock data loading
- ❌ Rewrite working components from scratch
- ❌ Change data fetching architecture
- ❌ Over-engineer simple styling
- ❌ Delete multiple files at once
- ❌ Change the store architecture unless necessary

### Step 5: Success Criteria
- EntityWorkspace loads real data from backend
- Search and filters work exactly like before
- Split view has clean resizable slider like before
- All existing tests pass
- No "bonkers" display issues
- Performance is same or better

### Step 6: Key Files to Preserve
From the working version, these are critical:
- `EntityWorkspaceCore.jsx` - Main orchestrator (keep working)
- `hooks/useEntityData.js` - Backend data fetching (don't break)
- `hooks/useEntityFiltering.js` - Filter logic (preserve)
- `shared/HeaderSearchBar.jsx` - Working search component
- Backend data connections and React Query integration

### Step 7: Testing Strategy
After each change:
1. Run existing tests
2. Test in browser with actual krav/tiltak data
3. Verify search, filters, and resizing work
4. Check that styling matches original

## Key Lesson
The EntityWorkspace was complex for good reasons - it handles real data, complex filtering, and multiple entity types. The refactoring should reduce complexity by splitting files and organizing code, NOT by rewriting working functionality.

Start small, test often, preserve what works.