# KravTiltak Domain

- DO NOT LOOK AT TableComponents for anything else than displayValues or fieldTypes!

## Structure
Each entity type has: `adapter/`, `renderer/`, `store/`, workspace page file.
Shared components in `shared/components/` and `shared/utils/`.

## Entity Types
- `krav/` — General requirements
- `tiltak/` — General measures (supports `?preset=generelle` for read-only mode)
- `prosjektkrav/` — Project-scoped requirements
- `prosjekttiltak/` — Project-scoped measures
- `combined/kravtiltak/` — Combined krav+tiltak view
- `combined/prosjektkravtiltak/` — Combined project krav+tiltak view
- `flow/` — React Flow visualization (graph view of relationships)

## Wiring Pattern (example: Krav)
```
KravWorkspace.jsx
  → creates KravAdapter(kravConfig)
  → wraps in SingleEntityDTO(adapter)
  → passes dto + render functions to EntityWorkspace
```

## Adapters
Extend BaseAdapter. Key methods: `getDisplayConfig()`, `getFilterConfig()`, `getQueryFunctions()`, `enhanceEntity()`, `save()`, `delete()`.
Combined adapters detect entity type and delegate to single adapters.

## Renderers
Factory: `createKravTiltakRenderer()` generates all render prop functions from config.
Combined: `createCombinedRenderer()` dispatches to single renderers based on entityType.

## Shared Components
- `EntityCard.jsx` — card display, dual mode (cards vs split), inline editing
- `EntityDetailPane.jsx` — form editing, collapsible sections, emne inheritance, Tiptap
- `dataCleaningUtils.js` — strips internal fields (`__*`, entityType, renderId) before API

## Emne Inheritance
- Krav: inherits emneId from parent only
- Tiltak: inherits from parent (priority 1) OR first connected krav (priority 2) — mutually exclusive

## Stores (per workspace)
- `UIStore` — selection, search, filters (createWorkspaceUIStore factory)
- `ViewStore` — persisted display preferences (showHierarchy, showMerknad, etc.)