# Search Bar Architecture

This document explains the new search bar architecture where each domain provides its own search implementation while the interface layer remains generic.

## Architecture Overview

### Before (Problematic)
```
interface/components/SearchBar.jsx (400 lines)
├── Hardcoded KravTiltak business logic
├── Hardcoded filter options (obligatorisk, status, vurdering)
├── Hardcoded sort fields
└── Mixed concerns (UI + domain logic)
```

### After (Clean)
```
interface/components/SearchBarPlaceholder.jsx (80 lines)
├── Generic container with fallback
├── Render prop pattern
└── No domain logic

pages/KravTiltak/shared/components/KravTiltakSearchBar.jsx (300 lines)
├── All KravTiltak-specific logic
├── Domain-aware filtering
├── Model-specific customization hooks
└── API-aware implementation
```

## Implementation Pattern

### 1. Domain Search Component
Each domain creates its own search component in their shared folder:

```jsx
// pages/KravTiltak/shared/components/KravTiltakSearchBar.jsx
export const KravTiltakSearchBar = ({
  searchInput, onSearchInputChange, onSearch, onClearSearch,
  // ... standard search props
  filterConfig, availableFilters,
  // ... domain-specific props
  customFilterFields = [], // Allow models to extend
}) => {
  // Domain-specific search logic
  // KravTiltak-specific filters: status, vurdering, emne, prioritet
  // Model-aware API calls
  // Domain-specific keyboard shortcuts
};
```

### 2. Model-Specific Renderer
Each model provides its own search renderer that can customize the domain search:

```jsx
// pages/KravTiltak/prosjektkrav/renderer/ProsjektKravRenderer.jsx
export const renderSearchBar = (props) => {
  return (
    <KravTiltakSearchBar
      {...props}
      customFilterFields={[
        {
          key: 'milestone',
          label: 'Milepæl', 
          render: ({ value, onChange }) => (
            <MilestoneSelect value={value} onChange={onChange} />
          )
        }
      ]}
    />
  );
};
```

### 3. Workspace Integration
Workspaces pass the render function to EntityWorkspace:

```jsx
// pages/KravTiltak/prosjektkrav/ProsjektKravWorkspace.jsx
import { renderSearchBar } from "./renderer";

<EntityWorkspace
  renderSearchBar={renderSearchBar}
  // ... other props
/>
```

### 4. Interface Layer
The interface uses render props for flexibility:

```jsx
// components/EntityWorkspace/EntityWorkspaceNew.jsx
<SearchBarPlaceholder
  renderSearchBar={renderSearchBar}
  // ... search props
/>
```

## Benefits

### ✅ Clean Separation of Concerns
- Interface: Generic container + fallback
- Domain: Business logic + API awareness  
- Model: Specific customizations

### ✅ API Awareness
Each domain knows its own API endpoints and search behavior:
- KravTiltak: Status/vurdering-based filtering
- Other domains: Completely different search patterns

### ✅ Model Flexibility
Models can extend domain search with specific fields:
- ProsjektKrav: Add milestone filters
- Krav: Add regulatory category filters
- Tiltak: Add resource type filters

### ✅ Maintainability
- Domain logic lives with domain code
- Interface remains generic and reusable
- No hardcoded business rules in interface

### ✅ Testability
- Domain search components can be tested independently
- Mock different APIs easily
- Isolated business logic

## Model-Specific Customization Examples

### ProsjektKrav (Project Requirements)
```jsx
customFilterFields={[
  {
    key: 'milestone',
    label: 'Milepæl',
    render: ({ value, onChange }) => (
      <MilestoneSelect value={value} onChange={onChange} />
    )
  },
  {
    key: 'workstream', 
    label: 'Arbeidsstrøm',
    render: ({ value, onChange }) => (
      <WorkstreamSelect value={value} onChange={onChange} />
    )
  }
]}
```

### Krav (General Requirements)
```jsx
customFilterFields={[
  {
    key: 'regulatory',
    label: 'Regulatorisk kategori', 
    render: ({ value, onChange }) => (
      <RegulatorySelect value={value} onChange={onChange} />
    )
  },
  {
    key: 'complexity',
    label: 'Kompleksitet',
    render: ({ value, onChange }) => (
      <ComplexitySlider value={value} onChange={onChange} />
    )
  }
]}
```

### Tiltak (Measures)
```jsx
customFilterFields={[
  {
    key: 'resourceType',
    label: 'Ressurstype',
    render: ({ value, onChange }) => (
      <ResourceTypeSelect value={value} onChange={onChange} />
    )
  },
  {
    key: 'budget',
    label: 'Budsjettområde', 
    render: ({ value, onChange }) => (
      <BudgetRangeSlider value={value} onChange={onChange} />
    )
  }
]}
```

## Migration Guide

### For New Domains
1. Create `DomainSearchBar.jsx` in your shared components
2. Add `renderSearchBar` to your model renderers
3. Pass `renderSearchBar` to EntityWorkspace

### For Existing Domains
1. Copy relevant logic from old SearchBar to your domain component
2. Remove hardcoded logic from interface SearchBar
3. Update workspaces to use renderSearchBar prop

This architecture ensures each domain controls its own search UX while maintaining consistency and reusability.
