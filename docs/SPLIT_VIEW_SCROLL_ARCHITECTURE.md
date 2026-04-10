# Split View Scroll Architecture

## Current Layout Chain (top → bottom)

```
<body>
│
├── <header> HeaderNav
│   CSS: sticky top-0 z-[70]
│   Height: auto (~60px)
│   Purpose: Global app header, stays at viewport top
│
├── <div> EntityWorkspaceNew outer
│   CSS: bg-white min-h-screen
│   Height: min-h-screen
│
│   ├── <ScrollPreventWrapper> Workspace header (search, title, view toggle)
│   │   CSS: sticky z-50 top-85px
│   │   Height: auto (~60px)
│   │   Purpose: Workspace controls, stays below HeaderNav
│   │
│   └── <div> Main content container
│       CSS: flex-1
│       Height: calc(100vh - 120px)  ← EXPLICIT PIXEL HEIGHT (the anchor)
│
│       └── <div> EntitySplitView
│           CSS: flex h-full bg-slate-50 relative
│           Direction: ROW (horizontal)
│           Height: h-full = calc(100vh - 120px)
│
│           ├── LEFT PANEL
│           │   CSS: bg-white border-r, width: 420px (resizable)
│           │   Height: stretched by flex (cross-axis)
│           │
│           │   └── <div> h-full wrapper
│           │       └── EntityListPane
│           │           CSS: flex flex-col h-full bg-white relative
│           │           ├── HEADER: flex-shrink-0 z-40
│           │           ├── CONTENT: flex-1 min-h-0 overflow-y-auto
│           │           └── FADE: absolute bottom-0 (overlay)
│           │
│           ├── RESIZER (12px)
│           │
│           └── RIGHT PANEL
│               CSS: flex-1 bg-white min-w-0 h-full min-h-0
│
│               └── EntityDetailPane
│                   CSS: flex flex-col h-full bg-white
│                   ├── HEADER: flex-shrink-0 z-20
│                   └── CONTENT: flex-1 min-h-0 overflow-y-auto
```

## Height Chain (must be unbroken for scroll to work)

For `overflow-y-auto` to create a scroll container, the element MUST have a
constrained height. This height flows down through the chain:

```
calc(100vh - 120px)                    ← explicit pixels (main content)
  → h-full on EntitySplitView         ← 100% of parent = calc(100vh - 120px)
  → LEFT: flex cross-axis stretch      ← same height as flex container
    → h-full wrapper                   ← 100% of parent
      → h-full on EntityListPane       ← 100% of parent
        → flex-1 on content            ← remaining space after header
          → min-h-0                    ← allows shrinking below content
            → overflow-y-auto          ← SCROLL HAPPENS HERE
  → RIGHT: flex-1 + h-full + min-h-0  ← remaining width, constrained height
    → h-full on EntityDetailPane       ← 100% of parent
      → flex-1 on content              ← remaining space after header
        → min-h-0                      ← allows shrinking below content
          → overflow-y-auto            ← SCROLL HAPPENS HERE
```

**Critical rule:** Every `h-full` in the chain must resolve to an actual pixel
value. If ANY parent has `height: auto`, the chain breaks and overflow never
triggers — content grows instead of scrolling.

## Key CSS Properties

### flex-shrink-0 (on headers)
Prevents the header from being compressed when content overflows.
The header always takes its natural height.

### flex-1 (on content areas)
`flex: 1 1 0%` — grow to fill remaining space, shrink if needed, basis 0.
This gives the content div exactly the remaining height after the header.

### min-h-0 (on content areas)
Override `min-height: auto` (the flexbox default). Without this, a flex child
cannot shrink below its content size, so overflow-y-auto never triggers.
This is the #1 most common flexbox scroll pitfall.

### overflow-y-auto (on content areas)
Only creates a scroll container if the element has a constrained height.
Combined with flex-1 + min-h-0, the height IS constrained, so scrolling works.

## What NOT to do

1. **No absolute positioning for headers.** Absolute headers require JS measurement
   of header height and dynamic `top` offset on content. Fragile, causes re-render
   loops, and breaks in Safari when height chain isn't pixel-perfect.

2. **No nested scroll containers.** FlexScrollableContainer + EntityDetailPane both
   had overflow-y, creating ambiguity about which one scrolls. One scroll container
   per pane.

3. **No JS height measurement for layout.** The old `headerHeight` state + useEffect
   caused re-render loops (effect depended on its own output). Flex layout handles
   this with pure CSS.

4. **No DOM walking in scrollToTop.** With flex layout, `detailViewRef` IS the scroll
   container. No need to walk up the DOM looking for overflow-y parents.

## scrollToTop

```js
export const scrollToTop = (detailViewRef) => {
  if (detailViewRef.current) {
    detailViewRef.current.scrollTo({ top: 0, behavior: 'auto' });
  }
};
```

`detailViewRef` points to the `flex-1 min-h-0 overflow-y-auto` content div.
This is the scroll container. Direct scroll, no DOM walking, no setTimeout.

## Left Pane headerHeight cleanup

The left pane (EntityListPane) still has `headerHeight` state + measurement effect.
This is vestigial from the absolute positioning era. With flex layout, it's unused.
Should be removed to prevent unnecessary re-renders.

## Safari-specific notes

- Safari on http://localhost does NOT support Secure cookies. MSAL v4 encrypts
  localStorage cache with a key stored in a Secure cookie. Auth doesn't persist
  across refreshes on localhost. Works fine in prod (HTTPS).
- flex + min-h-0 works identically in Chrome and Safari.
- The old absolute positioning pattern worked in Chrome but was unreliable in Safari
  due to stricter height resolution in flex contexts.
