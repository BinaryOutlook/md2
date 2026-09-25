---
author: 
id: B_204
internalId: 334525ff-6818-4450-8c04-b63d4c9886f1
title: next conversation on same action only starts if previous ended
status: ready
owner: 
affects:
agents:
  - design/activity/card__334525ff-6818-4450-8c04-b63d4c9886f1.json
policy:
after: cb27b171-7487-436d-ad9c-ed07ce7dd6f1
branch: b_204_next_conversation_on_same_action_only_starts_if_previous_ended
worktree: 1
changedFiles:
  - app/src/components/actions/conversation/picker/action_conversation_picker.grouped.test.tsx
  - app/src/components/actions/conversation/picker/action_conversation_picker.tsx
  - app/src/components/actions/conversation/picker/action_conversation_picker_owner.tsx
  - app/src/components/actions/conversation/state/action_conversation_store.node.test.ts
  - app/src/components/actions/conversation/state/action_conversation_store.ts
  - app/src/components/actions/run/popup/action_popup.test.tsx
  - app/src/components/actions/run/popup/action_popup_bottom_row.grouped.test.tsx
  - app/src/components/actions/run/popup/action_popup_operations.ts
  - desktop/src/actions/action/action_run.js
  - desktop/src/actions/action/action_run.test.mjs
  - desktop/src/actions/action/action_worktree_run_service.js
  - desktop/src/actions/action/action_worktree_run_service.test.mjs
---
When the user goes to a new conversation and the previous conversation on the same or another  action (especially the 'custom' or '+' one) has not been closed completely, then the new one wont start. Is there a technical reason for this, otherwise we need to remove restriction.

So meanwhile, we can already start a conversation on another action, but not on the same action. this should be possible

## Current state

* Selecting `New conversation` clears the popup's run binding. Sending starts a distinct run; selecting an older conversation can continue it. The run registry can hold several runs for one action and context.
* `ActionRun.runWithContext` holds `ActionWorktreeRunService.runWithCardLock` for the whole run. Its key is repository root plus `cardInternalId`, so every action on the same card waits, even across worktrees. A streaming run keeps the lock during `waitingForInput` until it finishes or stops.
* Project and diagram contexts have no `cardInternalId`, so this card lock does not apply. Activity files already queue updates by file, and Git commits queue index mutations. Agent edits to the same working copy can still conflict.

## Implementation details

* Allow independent runs on the same card to execute concurrently, regardless of action ID or assigned worktree. Do not hold a card-wide exclusive lock across agent turns or `waitingForInput`.
* Preserve release safety: a release targeting a card must reject while any run on that card is active, and new runs must reject while that card's release lock is held. Track concurrent card runs without serializing them against each other; release each run's claim on completion, failure, or cancellation.
* Keep each run and conversation bound by run ID and `AgentConversation.id`. `New conversation` starts a distinct conversation; selecting a previous conversation continues that selected conversation without finishing unrelated runs. Do not use conversation paths as identity.
* Keep project and diagram runs independent of card identity. Do not add a synthetic card lock for these contexts. Preserve existing activity-file and Git-index write coordination; concurrent edits to the same working file remain a possible conflict.

## Acceptance criteria

* Two conversations on the same action and card can run at once. Starting the second while the first is `running` or `waitingForInput` does not queue behind the first. Both retain separate run and conversation IDs and can receive input or finish independently.
* Another action on the same card can start while an earlier action runs or waits. Selecting and continuing an older conversation also works while another conversation remains active.
* Project and diagram agents can each run multiple conversations without requiring a card. Their popup selection, input, and completion remain scoped to the selected run or conversation.
* Concurrent card runs retain both activity and conversation records. Release locking still rejects a release with any active target-card run and rejects new target-card runs during a release.
* Tests cover concurrent same-card runs, independent conversation selection and continuation, cardless project and diagram runs, and release-lock behavior.