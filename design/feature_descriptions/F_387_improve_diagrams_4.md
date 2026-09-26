---
author: 
id: F_387
internalId: c10708f5-7df7-46ad-97f1-9bac7103e683
title: Improve diagrams 4
status: ready
owner: 
affects:
agents:
  - design/activity/card__c10708f5-7df7-46ad-97f1-9bac7103e683.json
policy:
branch: f_387_improve_diagrams_4
worktree: 2
changedFiles:
  - app/src/components/diagram_view/editing/diagram_coordinate_conversion.test.ts
  - app/src/components/diagram_view/editing/diagram_coordinate_conversion.ts
  - app/src/components/diagram_view/editing/diagram_inline_node_controls.tsx
  - app/src/components/diagram_view/editing/editable_diagram.tsx
  - app/src/components/diagram_view/legend/diagram_legend_entry_row.tsx
  - app/src/components/diagram_view/legend/diagram_session_legend_entries.test.tsx
  - app/src/components/diagram_view/rendering/diagram.tsx
  - app/src/components/diagram_view/surface/diagram_current_viewport.test.tsx
  - app/src/components/diagram_view/surface/diagram_current_viewport.tsx
  - app/src/components/diagram_view/surface/diagram_zoom_viewport.test.tsx
  - app/src/components/diagram_view/surface/diagram_zoom_viewport.tsx
  - app/src/services/diagrams/diagram_edge_drawing_service.test.ts
  - app/src/services/diagrams/diagram_edge_drawing_service.ts
  - app/src/services/diagrams/diagram_edit_session_service.ts
  - app/src/services/diagrams/diagram_geometry_service.test.ts
  - app/src/services/diagrams/diagram_geometry_service.ts
  - app/src/services/diagrams/diagram_layout.node.test.ts
  - app/src/services/diagrams/diagram_layout.ts
  - app/src/services/diagrams/diagram_node_placement_service.test.ts
  - app/src/services/diagrams/diagram_node_placement_service.ts
---

Things we need to improve/fix in diagrams:

* Subtitle should be below title. Both should be sticky, so overlap items on diagram.
* Items on the legend should be selectable, so that add tool can use the selected type. So the service responsible for adding items on the diagram asks the legend service which one is selected, checks if it can be applied to current tool, if so, apply.
* The size of the diagram should automatically expand, in all directions, when a node comes too close to the edge. Only expand in the direction of that edge.
* When drawing connections, the input boxes of the nodes prevent the accept. It should also work while mouse is over text part of node.

## Current state

* Current and New diagrams render `meta.title` above `meta.description`, followed by the drawing surface. Both fields scroll with the diagram; neither overlays nodes.
* Legend rows show a node role or connection kind and offer editing and formatting. They have no selected entry. The Add control chooses a node kind or connection kind from its own menu; node placement and edge drawing use that tool's defaults.
* `surfaceSize` and `DiagramGeometryService` measure right and bottom extents with 40 px padding. The drawing surface has no left or top origin offset, so moving a node toward those edges does not create space there.
* Edge drawing resolves a target through `data-diagram-connection-target` on the node. The inline node label sits above the node and stops pointer events, so a pointer over its input cannot complete a connection.

## implementation details

* Keep title above description. Make both headers sticky at the top of their diagram scroller, above the drawing and its nodes while scrolling. Give the header an opaque theme background and suitable stacking order; keep inline editing on New diagram working.
* Give the New legend one selected semantic entry: node role or connection kind. A semantic entry means the role or kind stored by a legend row, not its display label. Clicking its sample or label selects it; editing, removing, and formatting controls keep their own actions. Show selection visibly and expose it to keyboard users. Keep selection in a service, clear it when the edit session ends or that entry disappears, and do not let the Current legend select a New diagram value.
* At placement or connection creation, read the selected legend entry from that service. Apply a selected node role only to a node tool, and a selected connection kind only when valid for the active diagram and edge tool; otherwise use the tool default. Keep the chosen Add tool active and preserve its node kind, geometry, and other defaults. Preview and created object must use the same resolved role or kind. Existing nodes and connections are unchanged.
* Extend shared surface bounds calculation to include left and top extents and the existing 40 px edge margin. Grow only the edge whose margin a node enters; if a node reaches a corner, grow those two edges. For left or top growth, translate the drawing origin and pointer-to-diagram coordinate conversion together while preserving stored node coordinates and connection attachments. Apply the same bounds to Current rendering and New geometry; avoid repeated growth from one unchanged node position. Keep viewport position stable during growth and preserve scroll access to the added space.
* During edge drawing, resolve the owning node when pointer is over its inline label or text, including entity field text. Let the drawing gesture reach the scroller without making ordinary label editing or details actions unusable. Use the same target for preview and completion; retain existing invalid-target checks.
* Add focused tests for sticky headers, legend selection and tool compatibility, growth on each edge and corner at changed zoom, and connection completion over label and field text. Run affected app tests, typecheck, and lint.

## acceptance criteria

* Title stays above subtitle (`meta.description`). Both remain visible above nodes while a diagram scrolls horizontally or vertically; New title and description remain editable.
* New legend has one clearly selected entry that works by pointer and keyboard. Selection survives a tool change, clears when its entry is removed or edit session ends, and does not alter the Current diagram.
* With a compatible selected entry, Add preview and created node or connection use its role or kind. An incompatible entry leaves the active tool's default intact. Tool choice and existing objects do not change.
* Moving or placing a node within 40 px of any canvas edge adds space at that edge only. Corner proximity adds space at both adjacent edges. Stored node positions and connection endpoints stay correct; pointer placement and viewport remain aligned after left or top growth and at non-default zoom.
* A connection can start or finish while pointer is over node text, inline label input, or entity field text. Preview identifies same target, and label editing and details controls still work outside drawing mode.
