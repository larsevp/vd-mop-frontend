# Vertical Columnar Flow Layout

## Overview

The vertical columnar layout provides an alternative "spreadsheet-style" visualization for the flow view, where each **Emne** becomes a **column** with entities stacked vertically below it.

This layout is ideal for viewing hierarchical relationships within each subject area at a glance, with clear vertical connections showing parent-child relationships.

## Architecture

### Layout Concept

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   EMNE 1    │  │   EMNE 2    │  │   EMNE 3    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
   ┌───▼────┐      ┌────▼───┐      ┌────▼───┐
   │ Krav A │      │ Krav D │      │ Krav F │
   └───┬────┘      └────┬───┘      └────┬───┘
       │                │                │
   ┌───▼────┐      ┌────▼───┐      ┌────▼───┐
   │ Krav B │      │ Tiltak │      │ Tiltak │
   └───┬────┘      └────────┘      └────────┘
       │
   ┌───▼────┐
   │ Tiltak │
   └────────┘
```

### Key Differences from Horizontal Layout

| Aspect | Horizontal Layout | Vertical Layout |
|--------|------------------|-----------------|
| **Layout Engine** | Dagre (graph library) | Custom columnar algorithm |
| **Column Organization** | Levels (left to right) | Emne (top to bottom per column) |
| **Connection Direction** | Left → Right | Top → Bottom |
| **Handle Positions** | Left (target), Right (source) | Top (target), Bottom (source) |
| **Emne Positioning** | Leftmost column | Column headers at top |
| **Entity Stacking** | Horizontal across levels | Vertical within columns |

## File Structure

```
layouts/vertical/
├── README.md                    # This file
├── components/
│   ├── EmneFlowNode.jsx        # Vertical emne node (bottom handle)
│   ├── KravFlowNode.jsx        # Vertical krav node (top/bottom handles)
│   └── TiltakFlowNode.jsx      # Vertical tiltak node (top/bottom handles)
├── columnarLayoutEngine.js     # Core positioning algorithm
├── verticalLayoutConfig.js     # Layout configuration
├── verticalNodeEdgeBuilder.js  # ReactFlow node/edge creators
└── verticalTransformer.js      # Main transformer entry point
```

## Core Components

### 1. Columnar Layout Engine (`columnarLayoutEngine.js`)

Custom positioning algorithm that:
- Groups entities by their source Emne
- Sorts Emne groups (with "Ingen emne" last)
- Builds hierarchical structure for each column
- Calculates vertical positions within columns
- Positions cross-column connections

**Key Functions:**
- `calculateColumnarLayout()` - Main entry point
- `groupEntitiesByEmne()` - Groups entities by emne
- `sortEmneGroups()` - Sorts with "Ingen emne" last
- `buildColumnHierarchy()` - Creates tree structure per column
- `calculateEntityHeight()` - Dynamic height calculation

### 2. Vertical Node Components

Each node component uses **top/bottom handles** instead of left/right:

**EmneFlowNode:**
- Positioned at column header
- Only has **bottom handle** (source position)
- Connects downward to root entities

**KravFlowNode & TiltakFlowNode:**
- Positioned vertically within column
- **Top handle** for incoming connections (target position)
- **Bottom handle** for outgoing connections (source position)

### 3. Configuration (`verticalLayoutConfig.js`)

Centralized layout parameters:

```javascript
{
  columnWidth: 350,        // Width of each emne column
  columnSpacing: 150,      // Horizontal spacing between columns
  headerHeight: 100,       // Height reserved for emne header
  entitySpacing: 100,      // Vertical spacing between entities
  startX: 100,             // Left margin
  startY: 50,              // Top margin
  // ... more config
}
```

### 4. Vertical Transformer (`verticalTransformer.js`)

Orchestrates the transformation pipeline:
1. Collect unique entities
2. Build global relationships
3. Pre-calculate connections
4. Calculate columnar layout
5. Create ReactFlow nodes with vertical handles
6. Create edges

## Integration with FlowWorkspace

### Layout Toggle

FlowWorkspace now supports switching between layouts:

```javascript
// Layout mode state with localStorage persistence
const [layoutMode, setLayoutMode] = useState(() => {
  const saved = localStorage.getItem('flowLayoutMode');
  return saved || 'horizontal';
});

// Toggle button in header
<Button onClick={handleLayoutToggle}>
  {layoutMode === 'horizontal' ? <Columns2 /> : <Columns3 />}
</Button>
```

### Transformer Dispatch

FlowWorkspace automatically selects the appropriate transformer:

```javascript
const transformer = layoutMode === 'vertical'
  ? transformToVerticalFlow
  : transformToFlowData;

return transformer(flowAdapterData, { dto }, viewOptions);
```

### Node Types

Different node types are used based on layout:

```javascript
const effectiveNodeTypes = layoutMode === 'vertical'
  ? verticalNodeTypes
  : horizontalNodeTypes;
```

## Usage

### User Perspective

1. Open flow view in ProsjektKravTiltak workspace
2. Click the **columns toggle button** in the header
3. Layout switches between horizontal and vertical
4. Preference is saved in localStorage

### Developer Perspective

**To modify vertical layout behavior:**

1. **Spacing adjustments** → Edit `verticalLayoutConfig.js`
2. **Node appearance** → Edit components in `components/`
3. **Positioning algorithm** → Edit `columnarLayoutEngine.js`
4. **Edge styling** → Edit `verticalNodeEdgeBuilder.js`

**To add new features:**

All vertical layout code is isolated in this folder. Changes here won't affect horizontal layout.

## Design Principles

### Separation of Concerns

- **Horizontal layout** → `/flow/engine/layoutEngine.js` (Dagre-based)
- **Vertical layout** → `/flow/layouts/vertical/` (Custom algorithm)
- **Shared utilities** → `/flow/engine/` (data collection, relationships)

### Industry Standard

Following React Flow best practices:
- Centralized node type definitions
- Memoized transformations
- Proper handle positioning
- Clean state management

### Maintainability

- Clear folder structure
- Documented configuration
- Self-contained layout logic
- No mixing of horizontal/vertical code

## Future Enhancements

Potential improvements:

- [ ] Auto-column-width based on entity count
- [ ] Collapse/expand columns
- [ ] Cross-column connection highlighting
- [ ] Column reordering
- [ ] Export to spreadsheet format
- [ ] Print-optimized vertical layout

## Troubleshooting

### Nodes not appearing
- Check console for transformer errors
- Verify `layoutMode === 'vertical'`
- Ensure vertical node types are registered

### Wrong handle positions
- Confirm node components use `Position.Top` and `Position.Bottom`
- Check `sourcePosition` and `targetPosition` in node builder

### Layout too cramped/spacious
- Adjust spacing in `verticalLayoutConfig.js`
- Modify `columnWidth`, `columnSpacing`, or `entitySpacing`

## Technical Notes

### Why Custom Algorithm?

Dagre is optimized for horizontal left-to-right flows. For vertical columnar layout:
- We need precise column-based positioning
- Custom spacing rules within columns
- "Ingen emne" always positioned last
- Emne-specific height calculations

A custom algorithm provides better control and performance for this specific use case.

### ReactFlow Integration

Vertical layout returns the same data structure as horizontal:

```javascript
{
  nodes: [...], // ReactFlow nodes with position/type/data
  edges: [...]  // ReactFlow edges with source/target/style
}
```

This ensures seamless integration with FlowWorkspace.
