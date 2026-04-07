# Shared KravTiltak Components

## EntityCard (`components/EntityCard/`)
Dual layout: cards mode (full content) vs split mode (compact).
Multi-select, inline field editing, status/vurdering/prioritet indicators.
Helpers: `textHelpers.js` (truncate, getTitle), `iconHelpers.jsx` (icon lookup), `referenceHelpers.jsx` (parent/general tiltak display).

## EntityDetailPane (`components/EntityDetailPane/`)
Right pane for split view. View + edit modes, collapsible sections, TipTap editors.

### Todelt layout
```
┌─ HEADER (absolutt, z-20, sticky) ─────────────────┐
│ Badge + Emne-tag + Tittel (input i edit)           │
│ Handlingsknapper: Rediger/Lagre/Avbryt/Ny/Slett   │
│ Tastaturhint: "E" for rediger, Ctrl+Enter, Esc    │
│ bg-white (visning) / bg-slate-50 (redigering)      │
│ ScrollPreventWrapper — blokkerer scroll-bobling     │
└─── border-b ──────────────────────────────────────┘
┌─ INNHOLD (scrollbar, top: headerHeight+2px) ──────┐
│ overflow-y: scroll, overscrollBehavior: contain     │
│ ValidationErrorSummary (kun ved feil)               │
│ Kilde-krav kontekst (hvis __sourceKrav)             │
│ Seksjon 1 (kollapsbar) → Felt-rader                │
│ Seksjon 2 (kollapsbar) → Felt-rader                │
│ ...                                                  │
│ mb-16 bunn-padding                                  │
└─────────────────────────────────────────────────────┘
```
Header er absolutt posisjonert med `top: 2px`. Innhold er absolutt med dynamisk `top` basert på målt header-høyde (`headerRef` → `headerHeight`). Begge bruker `left-0 right-0`. Innholdet fyller resten ned til `bottom-0`.
- **FieldRenderer.jsx** — 5-tier component resolution, inheritance disabling, view/edit mode switching
- **FieldSection.jsx** — collapsible section wrapper with chevron toggle
- **ValidationErrorSummary.jsx** — red error box with field labels
- **helpers/fieldHelpers.js** — getVisibleFields, getFieldsBySection, getFieldRowsBySection, initializeFormData
- **helpers/validationHelpers.js** — validateForm, autoExpandErrorSections
- **helpers/useEntityForm.js** — hook: formData, errors, handleFieldChange
- **helpers/useEmneInheritance.js** — emne field inheritance logic (parent priority > krav for tiltak)
- **helpers/actionHelpers.js** — handleSaveAction (with image upload), handleDeleteAction
- **helpers/sectionHelpers.js** — section expand/collapse, scrollToTop

## Renderer Factories
- `createKravTiltakRenderer.jsx` — generates all render props for single entity types (95% code reuse)
- `CombinedRenderer.jsx` (in `combined/shared/`) — dispatches to single renderers by entityType

## Modals
- `CopyToProjectModal/CopyToProjectModal.jsx` — single entity copy (4-step wizard)
- `CopyToProjectModal/CombinedCopyModal.jsx` — mixed krav+tiltak copy (tiltak first, then krav with ID mapping)
- `CopyToProjectModal/ProjectSelector.jsx` — smart sorting: current → recent → alphabetical

## Other Shared Components
- `EmneGroupHeader.jsx` — sticky group header with 3 visual modes (TOC, article, split)
- `StatusIndicator.jsx` — status badge display
- `RowListHeading.jsx` — list heading with view mode toggles
- `BulkActionsMenu.jsx` — multi-select actions dropdown

## Utils
- `dataCleaningUtils.js` — strips `__*`, entityType, renderId before API calls
- `statusHelpers.js` — status/vurdering/prioritet display translation
- `filterUtils.js` — client-side entity filtering
