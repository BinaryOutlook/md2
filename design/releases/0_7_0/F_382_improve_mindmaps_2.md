---
author: 
id: F_382
internalId: cb27b171-7487-436d-ad9c-ed07ce7dd6f1
title: improve mindmaps 2
status: ready
owner: 
affects:
agents:
  - design/releases/0_7_0/card__cb27b171-7487-436d-ad9c-ed07ce7dd6f1.json
policy:
after: 6b01f79a-7950-42c5-b09b-4f77086aa427
changedFiles:
  - app/f382_touch_check.html
  - app/f382_touch_check.tsx
  - app/src/components/diagram_view/editing/diagram_selection_rectangle.tsx
  - app/src/components/diagram_view/editing/editable_diagram.tsx
  - app/src/components/diagram_view/editing/editable_diagram_selection.test.tsx
  - app/src/components/diagram_view/surface/diagram_current_viewport.test.tsx
  - app/src/components/diagram_view/surface/diagram_current_viewport.tsx
  - app/src/components/diagram_view/surface/diagram_zoom_slider.test.tsx
  - app/src/components/diagram_view/surface/diagram_zoom_slider.tsx
  - app/src/components/diagram_view/surface/diagram_zoom_viewport.test.tsx
  - app/src/components/diagram_view/surface/diagram_zoom_viewport.tsx
  - app/src/components/diagram_view/surface/use_diagram_pinch_zoom.ts
  - app/src/components/diagram_view/surface/use_preserve_diagram_zoom_center.ts
  - app/src/services/diagrams/diagram_node_placement_service.test.ts
  - app/src/services/diagrams/diagram_rectangle_selection.test.ts
  - app/src/services/diagrams/diagram_rectangle_selection.ts
  - app/src/services/diagrams/diagram_selection_service.test.ts
  - app/src/services/diagrams/diagram_selection_service.ts
  - f382_browser_check.js
---
Things that need to be fixed/improved on the diagram editing in general and mind maps in particular:

* the select tool does not work:
  * on desktop, it draws a rectangle, but it is not transparent, user can't see what he is trying to select
  * after drawing a rectangle, nothing gets selected
  * what does work: clicking on a single item
  * on mobile, using touch does not work: user can not draw a selection box.
* on mobile: touch should be supported to zoom in and out. we should not show the zoom slider in the bottom left corner on mobile. only zoom with pinch touch move.

## Current state

`EditableDiagramSurface` starts a selection rectangle on empty space. `DiagramSelectionService` owns its bounds and replaces selection with intersecting nodes, edges, and groups on pointer release. Existing pointer-event tests cover this path, but the reported desktop gesture leaves nothing selected. `DiagramSelectionRectangle` uses an opaque fill. The Select surface allows browser touch gestures, which can cancel a finger drag. Mindmap edges render as quadratic curves, but rectangle hit testing receives only their two endpoints, so it tests the straight chord instead of the visible curve.

Current and New viewports each show `DiagramZoomSlider`. Both use service-owned scale; Ctrl-wheel zoom and center-preserving scroll already exist. Neither viewport handles a two-finger pinch.

## implementation details

* Make the selection rectangle fill translucent while keeping its border visible and letting pointer events pass through. Keep rectangle bounds and selected identities in `DiagramSelectionService`; do not change diagram data or dirty state.
* Trace the live desktop pointer path and fix why release leaves nothing selected despite existing tests. In Select mode, let a single mouse or touch pointer drag from empty New-diagram space. Prevent native touch scrolling during selection while preserving ordinary scrolling outside that gesture. Convert pointer positions through the current viewport scale, complete selection on release, and cancel without changing selection on pointer cancellation, tool change, or a second touch. Preserve single-object click and tap selection.
* Test rectangle overlap against the visible mindmap quadratic curve, using its derived control point; keep existing straight-route hit testing for other diagrams. Select intersecting nodes, edges, and groups in either drag direction, and do not clear the completed selection with the trailing click.
* Add two-touch pinch handling to both Current and New diagram scrollers. Track the two touch pointers, derive scale from their distance, clamp it to the existing zoom range, and update the corresponding viewport service. Keep the diagram point under the gesture midpoint stable by adjusting scroll. A pinch cancels any active single-pointer edit or pan gesture without committing it; lifting or cancelling a finger ends the pinch cleanly. Preserve mouse Ctrl-wheel zoom and desktop sliders.
* Hide `DiagramZoomSlider` in both viewports at the app's mobile breakpoint (`theme.breakpoints.down('md')`). On mobile, pinch is the diagram zoom control. Keep ordinary one-finger tap, selection, editing, and Pan-tool behavior available.
* Add focused selection-service tests for curved-edge intersection and unchanged selection on cancellation; component tests for mouse and touch rectangle selection, translucent overlay, and pinch gesture conflicts; and viewport tests for pinch zoom, scale limits, midpoint stability, and mobile slider visibility. Verify gestures in a real touch browser because synthetic pointer tests do not exercise native scrolling. Run affected app tests, type checking, and app lint.

## acceptance criteria

* With Select active, dragging from empty New-diagram space shows diagram content through a visible selection rectangle. Releasing selects every intersecting node, visible edge, and group, including curved mindmap edges, and the selection remains visible after release. Clicking or tapping one item still selects it.
* A one-finger drag draws and completes the same rectangle on mobile. Cancelling the drag, changing tools, or starting a second touch removes the rectangle without changing selection or diagram content.
* In Current and New viewports, moving two fingers apart zooms in and moving them together zooms out within the existing zoom limits. Content under the gesture midpoint stays in place, and pinch does not create, move, resize, pan, or select diagram objects.
* Mobile layouts show no zoom slider in either viewport. Desktop layouts retain their sliders and Ctrl-wheel zoom. Selection and zoom do not mark the edit session dirty.
