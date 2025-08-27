# EntityWorkspace UX Roadmap

## Current State vs Suggested Improvements

### Current Implementation (v1)
- ✅ Card-based layout with expansion
- ✅ Grouping by Emne with collapsible sections
- ✅ Search, filters, view options
- ✅ Inline editing in expanded cards

### Suggested UX Improvements (v2)

## 1. Master-Detail Split View

### Structure
```
┌─────────────────┬──────────────────────────────┐
│                 │                              │
│   Entity List   │      Detail Pane            │
│                 │                              │
│   [Search/Filt] │  ┌─ Sticky Header ────────┐   │
│                 │  │ Title + Status + Edit  │   │
│   • Krav 1      │  └─────────────────────────┘   │
│   • Krav 2 ●    │                              │
│   • Krav 3      │  Content Area (65-75ch)     │
│                 │                              │
│   [Load More]   │  ▼ Detaljert informasjon    │
│                 │  ▼ Merknader                │
│                 │  ▼ Juridisk grunnlag        │
│                 │  ▼ Vedlegg                  │
│                 │                              │
│                 │  Right Rail:                │
│                 │  • Linked Tiltak            │
│                 │  • Add Link [+]             │
└─────────────────┴──────────────────────────────┘
```

### Implementation Plan

#### Phase 1: Core Split View
- [ ] Create `EntitySplitView` component
- [ ] Create `EntityListPane` component  
- [ ] Create `EntityDetailPane` component
- [ ] Implement URL deep-linking with React Router
- [ ] Add responsive mobile drawer mode

#### Phase 2: Compact List Items
- [ ] Create `EntityListRow` component with two-line design
- [ ] Implement status pill condensing status + quality + risk
- [ ] Add keyboard navigation (↑/↓, Enter, E, L)
- [ ] Add kebab menu for actions

#### Phase 3: Progressive Disclosure
- [ ] Create accordion components for detail sections
- [ ] Implement "Vis mer" expandable text
- [ ] Add Focus mode for distraction-free reading
- [ ] Create expandable content with smooth animations

#### Phase 4: Bidirectional Linking
- [ ] Create relationship sidebar component
- [ ] Implement typeahead link picker drawer
- [ ] Add inline link metadata editing
- [ ] Create optimistic UI for link/unlink with undo

## 2. Component Architecture

### New Components Needed

```
EntityWorkspace/
├── layouts/
│   ├── EntitySplitView.jsx          # Master-detail layout
│   └── EntityMobileView.jsx         # Mobile stack layout
├── list/
│   ├── EntityListPane.jsx           # Left pane container
│   ├── EntityListRow.jsx            # Two-line compact row
│   ├── EntityListHeader.jsx         # Search/filter bar
│   └── EntityListKeyboard.jsx       # Keyboard navigation logic
├── detail/
│   ├── EntityDetailPane.jsx         # Right pane container
│   ├── EntityDetailHeader.jsx       # Sticky header with actions
│   ├── EntityDetailContent.jsx      # Main content area
│   ├── EntityDetailAccordions.jsx   # Collapsible sections
│   └── EntityDetailSidebar.jsx      # Relations sidebar
├── editing/
│   ├── EntityEditDrawer.jsx         # Full edit drawer
│   ├── EntityInlineEdit.jsx         # Quick inline edits
│   └── EntityVersionHistory.jsx     # Version tracking
├── linking/
│   ├── EntityLinkDrawer.jsx         # Link picker with typeahead
│   ├── EntityLinkRow.jsx            # Mini-row in sidebar
│   └── EntityLinkMetadata.jsx       # Inline link editing
└── shared/
    ├── StatusPill.jsx               # Condensed status display
    ├── EntityKebabMenu.jsx          # Actions menu
    └── FocusMode.jsx                # Distraction-free reading
```

## 3. Detailed Feature Specifications

### EntityListRow Design
```jsx
<div className="entity-list-row">
  {/* Line 1 */}
  <div className="flex items-center gap-2">
    <span className="entity-code">[GK123]</span>
    <span className="entity-title">Tittel</span>
    <span className="entity-category">Emne/Kategori</span>
    <StatusPill status="ferdig" quality="bra" priority="lav" />
  </div>
  
  {/* Line 2 */}
  <div className="text-muted truncate">
    First 120-160 chars of content...
  </div>
  
  {/* Footer */}
  <div className="flex justify-between text-xs text-muted">
    <span>5 lenker • Sist oppdatert</span>
    <span>AB</span> {/* Owner initials */}
  </div>
</div>
```

### StatusPill Logic
```jsx
// Condense multiple status dimensions into single pill
const getStatusPill = (entity) => {
  if (entity.status === 'completed' && entity.quality === 'good') {
    return { icon: '✓', text: 'Ferdig', color: 'green' };
  }
  if (entity.priority === 'high' && entity.status === 'pending') {
    return { icon: '!', text: 'Høy prioritet', color: 'red' };
  }
  // ... more logic
};
```

### Keyboard Navigation
```jsx
// Key bindings for EntityListPane
const keyBindings = {
  'ArrowUp': () => selectPrevious(),
  'ArrowDown': () => selectNext(), 
  'Enter': () => openDetail(),
  'e': () => startEdit(),
  'l': () => openLinkDrawer(),
  'Escape': () => clearSelection()
};
```

## 4. Technical Implementation Details

### URL Deep-linking
```jsx
// Route structure for deep-linking
/krav-workspace/:kravId?          // Opens specific krav in detail
/tiltak-workspace/:tiltakId?      // Opens specific tiltak in detail

// State sync with URL
const [selectedEntityId, setSelectedEntityId] = useState();
const navigate = useNavigate();

// Update URL when selection changes
useEffect(() => {
  if (selectedEntityId) {
    navigate(`/${entityType}-workspace/${selectedEntityId}`);
  }
}, [selectedEntityId]);
```

### Performance Optimizations
```jsx
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

// Optimistic updates with undo
const optimisticLink = (entityId, linkedEntityId) => {
  // Update UI immediately
  updateLocalState(entityId, linkedEntityId);
  
  // Make API call
  linkEntities(entityId, linkedEntityId)
    .catch(() => {
      // Revert on failure with undo toast
      revertLocalState(entityId, linkedEntityId);
      showUndoToast();
    });
};
```

### Mobile Responsiveness
```jsx
const EntityWorkspace = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return isMobile ? (
    <EntityMobileView />  // Stack layout with drawer
  ) : (
    <EntitySplitView />   // Side-by-side layout
  );
};
```

## 5. Migration Strategy

### Phase 1: Parallel Implementation
- Keep existing EntityCardList for backwards compatibility
- Implement new split view as opt-in feature
- Add workspace config option: `layout: 'cards' | 'split'`

### Phase 2: A/B Testing
- Allow users to switch between layouts
- Gather feedback on usability improvements
- Monitor performance metrics

### Phase 3: Full Migration  
- Make split view the default
- Deprecate card-based layout
- Clean up legacy components

## 6. Configuration

### Model Config Extensions
```js
export const krav = {
  // ... existing config
  
  // New workspace layout options
  workspace: {
    layout: 'split', // 'cards' | 'split'
    
    // Split view configuration
    splitView: {
      listWidth: '40%',
      enableKeyboardNav: true,
      compactRows: true,
      showPreview: true
    },
    
    // Detail pane configuration
    detailPane: {
      readingWidth: '65ch',
      focusMode: true,
      accordionSections: [
        'detaljert_informasjon',
        'merknader', 
        'juridisk_grunnlag',
        'vedlegg'
      ]
    },
    
    // Relationship configuration
    relationships: [
      {
        type: 'tiltak',
        label: 'Tilknyttede tiltak',
        allowCreate: true,
        metadata: ['rolle', 'styrke', 'begrunnelse']
      }
    ]
  }
};
```

This roadmap provides a comprehensive plan for evolving the EntityWorkspace from the current card-based approach to a modern, efficient master-detail interface with all the suggested UX improvements.