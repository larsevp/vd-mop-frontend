# Flow Visualization

React Flow-based graph visualization of krav/tiltak relationships.

## Architecture
```
FlowWorkspace.jsx (710 lines, main orchestrator)
  → useEntityData(CombinedEntityDTO)
  → transformToFlowData / transformToVerticalFlow
  → React Flow renders nodes + edges
```

## Layout Modes (localStorage-persisted)
- **Horizontal (Dagre):** Left-to-right: Emne → Krav → Tiltak. Uses dagre for hierarchical positioning.
- **Vertical (Columnar):** Each emne = column, entities as rows. Spreadsheet-like.

## Transformation Pipeline (5 steps)
1. `dataCollector.js` — deduplicate entities, add `_sourceEmne`
2. `relationshipBuilder.js` — build hierarchy + business relationships
3. `connectionCalculator.js` — determine edge paths
4. `layoutEngine.js` — Dagre positioning with cluster spreading (452 lines)
5. `nodeEdgeBuilder.js` — create React Flow nodes/edges

## Interaction
- Double-click node → opens EntityDetailPane in modal (viewport saved/restored)
- CRUD via DTO interface (same as regular workspace)
- Search filters entities with cache invalidation

## Node Components
`KravFlowNode`, `TiltakFlowNode`, `EmneFlowNode` — display entity title, merknad, description snippet.
Vertical variants in `layouts/vertical/components/`.
