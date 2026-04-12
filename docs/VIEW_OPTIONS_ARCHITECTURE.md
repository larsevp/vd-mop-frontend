# View Options (Visning) Architecture

## Two-Source Pattern

View options use TWO separate data sources:

1. **LABELS** (what toggles appear in the Visning dropdown)
   - Defined in the WORKSPACE file's `viewOptions` config
   - Example: `{ showKontroll: "Kontrollikon", showStatus: "Vis status" }`
   - Passed to `createCombinedRenderer(config)` or `createKravTiltakRenderer(config)`
   - Returned by `renderer.getAvailableViewOptions()`

2. **VALUES** (which toggles are on/off)
   - Stored in the entity's ViewStore (Zustand + localStorage persist)
   - Example: `{ showKontroll: true, showStatus: false }`
   - Flows: Store → Workspace → EntityWorkspace → EntityListPane → EntityCard

## Where to edit

### To ADD a new toggle (e.g. `showKontroll`):

1. **ViewStore** — add to `viewOptions` defaults + reset + bump version + add to migrate
   - `combined/prosjektkravtiltak/store/ProsjektKravTiltakCombinedViewStore.js`
   - (and equivalent for other workspaces: tiltak, krav, etc.)

2. **Workspace file** — add label to `viewOptions` config passed to `createCombinedRenderer`
   - `combined/prosjektkravtiltak/ProsjektKravTiltakCombinedWorkspace.jsx` (line ~129)
   - `combined/prosjektkravtiltak/ProsjektKravTiltakFlowWorkspace.jsx` (line ~87)
   - These are the ACTUAL source of Visning dropdown items

3. **EntityCard.jsx** — add conditional render using `viewOptions.showXxx`

4. **workspace ui config** (optional) — set default in `workspaceConfig.js` → `ui` section
   - Only needed for single-entity renderers that use `createKravTiltakRenderer`

### To REMOVE a toggle (e.g. `showObligatorisk`):

- Remove from workspace file's `viewOptions` config (step 2 above)
- Set to `false` in ViewStore defaults (step 1)
- The EntityCard conditional render becomes dead code but doesn't break anything

### Common mistake

Editing `ProsjektKravTiltakCombinedRenderer.jsx` viewOptions has NO EFFECT
because `ProsjektKravTiltakCombinedWorkspace.jsx` passes its OWN viewOptions
directly to `createCombinedRenderer()`, overriding the renderer config.

## Data Flow

```
ViewStore (Zustand + localStorage)
  ↓ viewOptions = { showKontroll: true, ... }  (VALUES)

ProsjektKravTiltakCombinedWorkspace
  ↓ renderer.getAvailableViewOptions()  (LABELS)
  ↓ viewOptions from store               (VALUES)

EntityWorkspace
  ↓ adds viewMode: "split" or "cards"

EntityListPane
  ├→ RowListHeading (Visning dropdown)
  │   availableViewOptions = LABELS (which toggles exist)
  │   viewOptions = VALUES (which are on/off)
  │   onViewOptionsChange = store setter
  │
  └→ EntityCard
      viewOptions = VALUES (controls conditional rendering)
```

## Visning dropdown only shows in split mode

Line 173 of RowListHeading.jsx: `{viewMode !== 'cards' && ...}`
In article/cards mode, the dropdown is hidden but viewOptions still control rendering.
