# Utils

## Key Files
- **entityTypeTranslator.js** — camelCase ↔ kebab-case ↔ lowercase ↔ API format conversion
- **fieldSuppression.js** — field filtering for index/create/edit views, generates X-Exclude-Fields headers
- **cacheInvalidationUtils.js** — Norwegian-aware plural forms, TanStack Query cache invalidation after CRUD
- **tempImageStorage.js** — localStorage-based temp image management for TipTap (50MB limit, orphan cleanup)
- **uidUtilsPipeline.js** — 5-step UID resolution pipeline (explicit → type mapping → nested → parent → fallback)
- **kravFieldVisibility.js** — Krav-specific field hiding rules + useKravFieldVisibility hook
- **pdfExport.js** — HTML2PDF article view export
- **authUtils.js** — MSAL + manual login user extraction
- **msalUtils.js** — MSAL instance registry (singleton)
- **entityFilters.js** — client-side entity filtering
- **booleanParser.ts** — boolean → "Ja"/"Nei"
