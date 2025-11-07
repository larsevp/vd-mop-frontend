# EntityWorkspace Architecture

## View Mode Nomenclature

EntityWorkspace supports two distinct view modes:

### 1. ARTICLE VIEW (viewMode: "cards")
**Purpose:** Reading and viewing entities in full detail

**Layout:**
- **TOC (Table of Contents)** - Left sidebar (w-64)
  - Compact entity list for navigation
  - Minimal styling: small fonts, no badges/icons/arrows
  - Click to navigate and scroll to entity in main view
  - Flags: `viewOptions.isTOCMode = true`

- **Main Article View** - Right content area (flex-1)
  - Full entity cards displayed inline
  - All fields visible, rich content, expandable sections
  - Scrollable vertical list
  - Flags: `viewOptions.viewMode = "cards"`

### 2. SPLIT VIEW (viewMode: "split")
**Purpose:** Editing and managing entities with CRUD operations

**Layout:**
- **Card List** - Left pane (resizable, collapsible, default 420px)
  - Compact entity cards for browsing and selection
  - Summary information only
  - Click to select and edit in detail pane
  - Flags: `viewOptions.viewMode = "split"`

- **Detail Pane** - Right pane (flex-1)
  - Full entity form for editing
  - Create, read, update, delete operations
  - Sectioned form layout
  - Scrollable content area

## Key Components

- **EntityWorkspaceNew.jsx** - Main orchestrator for both view modes
- **EntitySplitView.jsx** - Split view layout with resizable panes
- **EntityListPane.jsx** - Generic list component (used in both modes)
- **EntityDetailPane.jsx** - Detail pane for split view (domain-specific)
- **EntityCard.jsx** - Entity card renderer (domain-specific)

## Architecture Notes
- This is an interface - it uses DTOs, current implementation is from pages/KravTiltak
- Remember the DTOs and what should be there, avoid having many options to find things
- Everything connected to EntityWorkspace should be in this folder, domain logic is in KravTiltak
- There are contracts for things in EntityWorkspace - but these contracts should work with other models as well
- DO NOT LOOK AT TableComponents for things other than displayValues and fieldTypes