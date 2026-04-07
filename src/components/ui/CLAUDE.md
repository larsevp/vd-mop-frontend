# UI Components

## Editor (`editor/`)
- **TiptapEditor.jsx** — full rich text editor (TipTap + ProseMirror). Basic mode option (B/I/U only).
- **TiptapDisplay.jsx** — read-only renderer
- **TiptapToolbar.jsx** — 928-line toolbar (formatting, headings, lists, tables, links, images, colors)
- Extensions: EntityMention, KeyboardShortcuts, SmartPaste, SafariBulletList

## Form (`form/`)
~22 components. Key ones:
- **ComboBox.tsx** — searchable dropdown with async loading
- **EmneSelect.tsx**, **KravpakkerSelect.tsx**, **LovSelect.tsx** — entity relationship selects
- **MultiSelect.tsx**, **GenericMultiSelect.tsx** — multi-select variants
- **BooleanSelect.tsx**, **StatusSelect.tsx**, **VurderingSelect.tsx**, **PrioritetSelect.tsx** — enum selects
- **ColorPicker.jsx** — full color picker (3534 lines)

## Primitives (`primitives/`)
Shadcn-based: badge, button, command, dialog, heading, input, popover, select, separator.
All use @radix-ui + Tailwind CSS.

## Feedback (`feedback/`)
loading-spinner, skeleton-loader

## Projects (`projects/`)
ImportKravWizard, CreateProjectModal, LastVisitedProjectsList
