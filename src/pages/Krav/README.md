# Krav Workspace - Refactored Architecture

## 📁 Structure

```
pages/Krav/
├── KravWorkspace.jsx          # Main orchestrator component
├── KravCard.jsx              # Display card component
├── KravEditModal.jsx         # Full-screen edit modal
├── KravDetailView.jsx        # Full-screen detail view
├── components/               # UI components
│   ├── KravSearchBar.jsx     # Search functionality
│   └── KravFilters.jsx       # Filters & view controls
├── hooks/                    # Business logic
│   ├── useKravData.js        # Data fetching & processing
│   └── useKravActions.js     # CRUD operations
├── index.js                  # Clean exports
└── README.md                 # This file
```

## 🎯 Key Features

### Performance
- ✅ **Conservative caching** (30s stale time)
- ✅ **Stable query keys** prevent request loops
- ✅ **Button-only search** (no debouncing)
- ✅ **Single data processing** for all calculations

### UX
- ✅ **Full-screen edit modal** (not cramped inline editing)
- ✅ **Hierarchical display** (parents first, then children)
- ✅ **Clear parent relationships** ("Underkrav av X")
- ✅ **Rich text support** (TipTap JSON + HTML)

### Architecture
- ✅ **Separation of concerns** (hooks vs UI)
- ✅ **Custom hooks** for reusable logic
- ✅ **Component composition** over large monoliths
- ✅ **Industry best practices** (React Query, proper state management)

## 🔧 Usage

```jsx
import { KravWorkspace } from "@/pages/Krav";

// Main component - handles everything
<KravWorkspace />

// Or use individual pieces
import { useKravData, useKravActions } from "@/pages/Krav";
```

## 🚀 Migration Benefits

- **500+ lines** → **200 lines** main component
- **Request loops eliminated** → Stable performance
- **Better maintainability** → Focused, testable components
- **Industry standards** → Follows React best practices