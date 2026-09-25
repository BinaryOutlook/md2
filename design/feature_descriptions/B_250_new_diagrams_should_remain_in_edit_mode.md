---
author: 
id: B_250
internalId: 8ae19b2f-3463-4fe3-9303-6e8101cf9ab6
title: new diagrams should remain in edit mode
status: ready for implementation
owner: 
affects:
agents:
  - design/activity/card__8ae19b2f-3463-4fe3-9303-6e8101cf9ab6.json
policy:
branch: b_250_new_diagrams_should_remain_in_edit_mode
worktree: 3
---

After creating a new diagram and the user closes the app and opens it again. if he then goes back to the diagram, it appears as if it is read-only. if the user starts the edit, a new edit appears to be created. this is not correct. a diagram should remain in edit mode for as long as it has not yet been implemented.&#x20;

the 'implemented' state will be set after the agent has run. this is not yet on the menu. just leave mind maps in the edit mode for now

## Current state

`New diagram` writes a user-created root record and starts a creation edit session. `DiagramEditSessionService` keeps that session only in memory; project close clears it. On reopen, `DiagramViewService.open()` loads the saved active diagram, but does not restore editing. `DiagramView` therefore shows a read-only surface. Pressing `Edit diagram` starts an ordinary session, with `Current` and `New` surfaces; saving that session creates another edited copy.

The index records diagram identity, source-copy links, and the active path, but no pending-implementation state. A creation session is identified by `creationSourceDiagramId`, which also controls the single editable surface. `DiagramSaveService` saves changes as a separate copy and reuses that copy for later saves in the same session. No implemented-state transition exists yet.

## implementation details

* Persist a pending-implementation marker on each root record created by `New diagram`, regardless of diagram type. Parse and serialize it in `diagram_index.ts`. Existing agent-created records have no marker. Keep `DiagramRecord.id` as identity; paths remain file locations.
* After `DiagramViewService.open()` loads the active record, and after navigation to a pending root, restore a creation session in the service layer. Use the root record as its source. Find its latest saved copy through `sourceDiagramId` and index order, load that copy as editable content, and restore its record as the save target. With no saved copy, clone the root diagram. Set `creationSourceDiagramId` so the single `New` surface and creation controls remain visible.
* Keep current save-copy behavior: first save creates one copy; later saves overwrite that copy. On reopen, restored session starts clean from the latest saved content. Unsaved in-memory changes are not recovered after app close. Do not write the editable copy over the original root file.
* Avoid replacing a dirty session during navigation. If restoration cannot load or validate its referenced copy, report the error through `dialogService` and keep a safe fallback view; do not silently start from the empty root and risk overwriting saved work. Do not auto-start editing in read-only projects.
* Leave transition to `implemented` for the later agent-run work. This feature does not add an implementation command or mark any diagram implemented.
* Add focused index, view-service, edit-session, save, and UI regression tests for reopen, navigation back, latest saved copy, repeated save, read-only access, agent-created diagrams, and missing or malformed saved copies.

## acceptance criteria

* After creating a diagram, closing and reopening the app restores that diagram in creation edit mode when its project is writable. Returning to it through diagram navigation does the same.
* Restored creation mode shows the editable `New` surface and tools without `Current` comparison controls, for every user-created diagram type.
* After a saved edit and restart, editable content matches the latest saved copy. Saving again updates that copy and creates no additional diagram record.
* Existing agent-created diagrams retain their read-only initial view and explicit `Edit diagram` flow. Read-only projects do not enter editing.
* Missing or invalid saved-copy data produces a visible error and never silently resets the diagram to its original empty content.
* Focused tests pass; app type checking and `npm run lint` pass during implementation.
