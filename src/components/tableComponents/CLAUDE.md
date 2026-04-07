# Table Components

Traditional CRUD system for admin pages. Driven by modelConfigs.

## Core Components
- **RowList.jsx** — table display, pagination, search, 3-state sorting, delete confirmation
- **RowForm.jsx** — unified create/edit form, uses FieldResolver for field type resolution
- **RowNew.jsx** / **RowEdit.jsx** — lightweight wrappers
- **AdminPage.jsx** — layout wrapper for admin pages

## Field Resolution (5-tier priority)
1. Model-specific field name component (highest)
2. Model-specific field type component
3. Global entity field type
4. Basic field type (text, number, bool, select, richtext, etc.)
5. Fallback text input (lowest)

Files: `fieldTypes/fieldResolver.jsx`, `fieldTypes/basicTypes.jsx`, `fieldTypes/entityTypes/`

## Display Resolution (same priority order)
Files: `displayValues/DisplayValueResolver.jsx`, `displayValues/basicDisplayTypes.jsx`, `displayValues/entityDisplayTypes.jsx`

## Basic Field Types (basicTypes.jsx)
text, textarea, number, bool (BooleanSelect), select, email, password, color (ColorPicker), icon (IconPicker), date, datetime, richtext (TiptapEditor full), basicrichtext (TiptapEditor basic), fileupload (FileUpload)

## Entity Field Types (entityTypes/)
Global: statusselect, vurderingselect, kravreferansetypeselect, prioritetselect, enhetselect, fagomradeselect, kravstatusselect
Entity: emneselect, kravselect, tiltakselect, prosjektKravselect, prosjektTiltakselect
Multiselect: routes to LovCheckboxGroup, KravpakkerCheckboxGroup, or GenericMultiSelect

## Model-Specific Overrides (modelSpecific.jsx)
- Krav: tittel min 3 chars validation
- Enhet: parentId → ParentSelectField
- ProsjektKrav: tittel min 3 chars validation

## Display Types
Basic: bool (Ja/Nei), text, number, date (nb-NO), richtext (ExpandableRichText), fileupload (file list), multiselect (UID badges), color, icon
Entity: FK field display (enhetId→enhet.navn, statusId→status icon, etc.)
Model-specific: Krav kravStatus enum translation, parent/relationship enhanced displays

## FieldResolver Key Methods
- `getFieldComponent(field, modelName)` — 5-tier component resolution
- `validateField(field, value, modelName)` — required + type-specific + model-specific validation
- `initializeFieldValue(field, row, editing, modelName)` — form init with type awareness
- `resetFieldValue(field, modelName)` — post-create reset

## Used For
Admin routes: `/admin`, `/prosjekter`, `/enheter`, `/emner`, `/status`, `/vurderinger`, etc.
Not used for workspace routes (those use EntityWorkspace).
**Also used by EntityDetailPane** — FieldRenderer delegates to FieldResolver for component resolution and DisplayValueResolver for view mode.
