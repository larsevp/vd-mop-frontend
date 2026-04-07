# Model Configs

Single source of truth for frontend field definitions and API mappings.

## Structure
```
modelConfigs/
  index.js          — getModelConfig(name) lookup
  models/
    krav/
      index.js       — barrel export
      metadata.js    — display name, title, descriptions
      fields.js      — field definitions (mirrors model-schema.json)
      queryFunctions.js — API endpoint mappings
      workspaceConfig.js — workspace UI config (sections, layout, features)
```

Simple models are single files. Complex models (krav, tiltak, prosjektKrav, prosjektTiltak) use directory structure.

## Config Shape
```js
{ modelPrintName, title, titlePlural, desc, newButtonLabel,
  queryKey, queryFn, queryFnAll, queryFnGroupedByEmne,
  getByIdFn, createFn, updateFn, deleteFn,
  workspace: { enabled, layout, groupBy, features, sections },
  fields: [...] }
```

## Usage
- TableComponents (RowForm/RowList) read fields for form generation
- EntityWorkspace adapters read queryFunctions and workspace config
- Field suppression: `hideIndex`, `hideCreate`, `hideEdit` per field

## Adding New Fields
Se `/docs/ADDING_MODELS_AND_FIELDS.md` for komplett oppskrift (backend + frontend + migrering).
