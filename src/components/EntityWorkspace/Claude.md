# EntityWorkspace

## Architecture (4-Layer)
```
EntityWorkspace (generic orchestrator, ~1000 lines)
    ↓ render props
DTO (interface contract, data normalization)
    ↓ delegates
Adapter (business logic, entity-specific)
    ↓ render props
Renderer (domain-specific UI components)
```

**Critical rule:** EntityWorkspace → DTO → Adapter (never skip layers).
DO NOT LOOK AT TableComponents for things other than displayValues and fieldTypes.

## View Modes

### Article View (`viewMode: "cards"`)
Lesemodus. To paner:
```
┌─ TOC (w-80, sticky) ─────┐  ┌─ Hovedvisning (flex-1) ──────────────┐
│ Kompakt navigasjonsliste  │  │ Fulle entity-kort med all innhold    │
│ - Kun tittel              │  │ - mainContentFields (rich text)       │
│ - Klikk → scroll til kort │  │ - statusFields (ikoner/badges)       │
│ - Ingen badges/ikoner     │  │ - merknadField (italic fotnote)      │
│ isTOCMode = true          │  │ viewMode = "cards"                    │
└───────────────────────────┘  └───────────────────────────────────────┘
```

### Split View (`viewMode: "split"`)
Redigeringsmodus. To paner:
```
┌─ Kortliste (420px, resizable) ─┐  ┌─ Detaljpanel (flex-1) ──────────┐
│ Kompakte kort med snippet      │  │ Visning: read-only felt           │
│ - Tittel + beskrivelse-snippet │  │ Redigering: form-inputs           │
│ - Status-badges (minimal)      │  │ - Kollapsbare seksjoner           │
│ - Klikk → vis i detaljpanel    │  │ - Lagre/Avbryt/Slett              │
│ viewMode = "split"             │  │ - Validerings-feil øverst         │
└────────────────────────────────┘  └───────────────────────────────────┘
         ↑ Resizer (12px, drag for å endre bredde, kollaps-knapp)
```

### Flow View (`viewMode: "flow"`)
Grafvisualisering med React Flow. Alternativ modus, ikke del av cards/split toggle.

## Navngivning

| Begrep | Kode-verdi / Komponent | Brukes i | Betydning |
|--------|----------------------|----------|-----------|
| **Article View** | `viewMode: "cards"` | Hovedmodus | Lesemodus med TOC + fulle kort |
| **Split View** | `viewMode: "split"` | Hovedmodus | Redigeringsmodus med liste + detaljpanel |
| **TOC** | `isTOCMode: true` | Article View venstre | Table of Contents — kompakt navigasjon |
| **Hovedvisning** | EntityListPane | Article View høyre | Fulle entity-kort |
| **Kortliste** | EntityListPane | Split View venstre | Kompakte kort for valg |
| **Detaljpanel** | EntityDetailPane | Split View høyre | Form for visning/redigering |
| **EmneGruppe** | EmneGroupHeader | Begge | Sticky gruppehode med emne-info |
| **Entity-kort** | EntityCard | Begge | Enkelt entity — responsive layout per modus |
| **RowListHeading** | RowListHeading | Begge | Listehodet med antall, visningsvalg, multi-select |

## Felt-synlighet per visningmodus

| Område | Hva vises | Konfigurasjon |
|--------|----------|---------------|
| **TOC** | Kun tittel | Hardkodet — alltid bare tittel |
| **Article View kort** | mainContentFields + statusFields + merknad | `workspace.articleView` i workspaceConfig |
| **Split View kortliste** | Snippet + status-badges | Hardkodet: `beskrivelseSnippet` osv. |
| **Detaljpanel (visning)** | Alle felt i seksjoner | `workspaceConfig.sections` — config-drevet |
| **Detaljpanel (redigering)** | Alle felt unntatt hidden | `workspaceConfig.sections` + `workspaceHiddenEdit` |

### Hva styrer hva
- **Detaljpanel:** Fullt config-drevet fra `workspaceConfig.sections[].layout`
- **Article kort:** Delvis config — `articleView.mainContentFields` array
- **Split kortliste:** Hardkodet i EntityCard — kun snippets + status
- **TOC:** Hardkodet — kun tittel

## Core Files

### EntityWorkspaceNew.jsx (~1000 lines)
Main orchestrator. Manages view modes, CRUD through DTO, URL state (`?selected=<id>`).
Race condition refs: `isCreatingNewRef`, `hasRestoredSelectionRef`, `uiRef`.

### DTO Layer (`interface/data/`)
- `EntityDTOInterface.js` — abstract contract: transformResponse, save, delete, enhanceEntity, createNewEntity, getEntityType, getUIKey
- `SingleEntityDTO.js` — wraps one adapter. Normalizes grouped/paginated responses. Handles post-save scroll/selection.
- `CombinedEntityDTO.js` — wraps combined adapter. Uses `renderId` for unique keys across types (prevents ID collisions).

### UI State (`interface/stores/`)
- `createWorkspaceUIStore(name)` — factory for workspace-scoped Zustand stores (selection, search, filters, viewMode persisted per workspace)
- `createWorkspaceUIHook(store)` — factory wrapping store in selectors: useWorkspaceUI, useEntitySelection, useSearchFilters

Server state via TanStack Query (`useEntityData.js`), UI state via Zustand — never mixed.

### Render Props Contract
- `renderEntityCard({ entity, isSelected, onSelect, viewOptions })`
- `renderDetailPane({ selectedEntity, onSave, onDelete, onClose, dto })`
- `renderGroupHeader({ group, onToggle, isCollapsed })`
- `renderSearchBar(props)`, `renderActionButtons(props)` — optional

### BaseAdapter (`backendAdapter/core/BaseAdapter.js`)
Abstract base. Required: `transformResponse`, `transformEntity`, `transformRequest`.
Utilities: `extractTextFromTipTap`, `normalizeDescription`, `detectEntityType`, `extractAvailableFilters`.

## Key Components
- **EntitySplitView.jsx** — split view layout with resizable panes
- **EntityListPane.jsx** — generic list (used in both view modes)
- Domain-specific components at `pages/KravTiltak/shared/components/` (EntityCard, EntityDetailPane)