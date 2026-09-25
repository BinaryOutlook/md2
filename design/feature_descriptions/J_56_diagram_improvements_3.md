---
author: 
id: J_56
internalId: da8a9e63-eeee-4911-a83c-5f1f9a38d911
title: diagram improvements 3
status: ready for implementation
owner: 
affects:
agents:
  - design/activity/card__da8a9e63-eeee-4911-a83c-5f1f9a38d911.json
policy:
branch: j_56_diagram_improvements_3
worktree: 2
---
* when working with the add tool:
  * in desktop mode, when the mouse hovers over the diagram area, we show a node that can be inserted. this is ok, however, it is not in the correct position, it does not do a transformation I think to local coordinates. the node is always below to the left,
  * when user presses 'esc' 'add tool' should switch to 'select diagram objects'
* when using the 'select diagram objects' tool, we can now select multiple items, we can drag them around. it is however not obvious that they are selected. When a single item is selected, we draw resize grips round the node. We should do the same when multiple objects are selected; so 1 selection box that is around all selected objects.
* When an error is shown or a warning, the zoom sliders are still over the popover. this is no good. they should not be on top of everything.
* tried to add a second new diagram, got warning that current diagram would be discarded. this makes no sense
* no way to save the diagram. diagrams should follow the same save method as cards: put them on the commit-batcher.
* when we change the title of the diagram, it does not appear to update the label in the bread crumbs, so most likely also not the filename. this is wrong.
* for mindmaps: when creating a new diagram, the 'add tool' should have the 'root' already selected. once the root is placed, it should automatically go to 'topic'
* the label is editable, this is good, but it is not centered and has a white background. it should be transparent and centered.
* the breadcrumbs are overlapping the title&#x20;
  * the div with aria label 'new diagram editor', give it a padding-bottom of 16px
* on 'node details' popup, 'cancel' and 'save' buttons do not work, all input appears disabled

## Current state

* Add preview uses pointer coordinates converted through the New viewport, yet desktop preview is reported below and left of the pointer. Escape cancels placement but leaves Add active. A new mindmap starts without Root selected; placing Root switches to Select.
* Selection supports multiple objects and movement. Resize grips render only for one selected node or group; no common boundary marks a multiple selection.
* Zoom sliders use tooltip stacking level, so they can cover warnings and popovers. The New editor has no bottom padding; its breadcrumb overlay can cover the title. Inline node label uses a left-offset, opaque input instead of centered, transparent text.
* Creating another diagram while the edit session is dirty shows a discard warning and stops. New diagrams are already written before editing starts. Edited diagrams can be saved only through Review: saving creates or updates a copy, queues diagram JSON and index, then flushes immediately.
* Inline title edits update `meta.title` only. Breadcrumbs read `DiagramRecord.label`; generated JSON paths keep their original names. Node details dialog contains editable fields and Cancel/Save actions, but the reported interaction is blocked.

## implementation details

* Fix Add preview positioning at the viewport coordinate boundary: convert client pointer position through viewport bounds, scroll offset, and zoom exactly once, then use diagram-local coordinates for both preview and placement. Cover desktop scroll and non-default zoom. Escape cancels the active Add gesture and selects Select; do not intercept Escape from an inline field or dialog.
* Render one selection boundary around the union of selected node, group, and routed edge bounds when more than one object is selected. Keep it in diagram coordinates, update it on selection or geometry changes, and make it pointer-transparent. Preserve single-object resize and existing multiple-object movement; shared boundary does not introduce multiple-object resizing.
* Lower zoom slider stacking below popovers and dialogs. Add 16px bottom padding to the element labeled `New diagram editor`; keep breadcrumb and title from overlapping at supported viewport widths. Center inline node label within its node and remove its opaque input background while keeping focus, validation, and text legible.
* Give mindmap creation session Root as its initial Add choice. After Root placement, select Topic automatically. Keep Root unavailable while one exists; other diagram types keep their current initial tool.
* Queue edited diagram data through the existing commit batcher as edits occur, with the diagram JSON and `diagram-view.json` in one persistence batch when index changes. Preserve the editable-diagram contract: first save creates a copy, later saves update that copy, and original record/file stay intact. Keep Review for review and agent handoff, but make ordinary saving and save state available without opening Review. Do not mark changes saved until persistence succeeds; report failures and retain pending work.
* Before creating another diagram, finish persistence of current dirty edit session. Continue creation only after that succeeds; on failure keep current diagram, edit session, and view active. Remove the misleading discard warning for this path.
* When title changes, show draft title in current breadcrumb. On persistence, update saved copy record label and give its JSON a title-based, collision-safe filename while keeping record ID stable. Move file and index together through batcher; update path-based loading and navigation references after successful move. Preserve original file and record for existing-diagram edit sessions.
* Reproduce blocked Node details controls in the New pane and comparison layouts. Fix dialog interaction or overlay stacking so inputs accept keyboard and pointer input, Cancel closes without mutation, and Save validates and applies changes through the edit session.
* Add focused regression tests for pointer conversion, Escape and mindmap tool transition, mixed-object selection bounds, overlay order and layout, save batching and failure, second-diagram creation, title propagation and rename, inline label presentation, and Node details actions. Run affected app tests, typecheck, and lint.

## acceptance criteria

* On desktop, Add preview follows pointer at default and changed zoom and after scrolling; placed node appears at preview location. Escape from Add selects Select, except when an inline editor or dialog owns Escape.
* Multiple selected objects have one visible boundary enclosing all selected geometry. Boundary follows moves, zoom, and selection changes; it does not block interaction. Single-object resize and multiple-object movement still work.
* Warning and error popovers and dialogs cover zoom sliders. Breadcrumbs do not overlap New title; `New diagram editor` has 16px bottom padding. Inline node label is centered with transparent background and remains editable and readable.
* New mindmap starts with Root ready to place. Once Root is placed, Topic becomes active and can be placed repeatedly; a second Root cannot be added.
* Diagram edits save through commit batcher without Review. First persistence creates one copy; subsequent edits update that copy. Diagram JSON and index stay consistent. Save failures remain visible and retryable, without claiming changes were saved.
* Creating a second diagram saves pending edits first and opens the second diagram in edit mode. Persistence failure leaves first diagram and edits available and does not create the second.
* Renaming diagram title updates breadcrumb promptly and saved copy label and filename after persistence. Reload and navigation resolve renamed path, and original diagram stays unchanged.
* Node details inputs accept typing; Cancel closes without changes; Save applies valid changes and closes. Invalid values remain in dialog with validation feedback.
