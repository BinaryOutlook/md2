---
author: 
id: B_251
internalId: 74c0373d-337f-4b51-92d8-9bc336528275
title: split conversation incorrectly disabled
status: ready
owner: 
affects:
agents:
  - design/releases/0_7_0/card__74c0373d-337f-4b51-92d8-9bc336528275.json
policy:
changedFiles:
  - app/src/components/actions/conversation/messages/action_conversation_item_commands.test.tsx
  - app/src/components/actions/conversation/messages/action_conversation_message.tsx
  - app/src/components/actions/conversation/messages/action_conversation_message_commands.tsx
  - app/src/components/actions/conversation/transcript/action_conversation_chatlog_tracker.node.test.ts
  - app/src/components/actions/conversation/transcript/action_conversation_chatlog_tracker.ts
  - app/src/components/actions/conversation/transcript/action_conversation_rendering.test.tsx
---
A previously split conversation is currently waiting for input. yet all 'split' buttons in the conversation are disabled.

see the conversations for the 'review' action of [F\_383\_prompts\_need\_to\_be\_shown\_faster.md](design/feature_descriptions/F_383_prompts_need_to_be_shown_faster.md)

## Current state

Split is disabled for a read-only project, while a command is pending, or when the displayed conversation has `running` status. Both the renderer command service and desktop storage reject a running source. A `waitingForInput` source is allowed, including one created by an earlier split.

The transcript keeps message components mounted while status changes. `ActionConversationMessage` is memoized, and the tracker keeps unchanged message groups stable. The tracker does not notify message controls when the displayed conversation status changes, so buttons rendered during `running` can stay disabled after the source reaches `waitingForInput`. This explains the reported symptom on a writable project; the referenced conversation data was not inspected.

## implementation details

* Expose the displayed conversation's status as a primitive tracker snapshot. Dispatch a scoped status event when that value changes, including `running` to `waitingForInput` and conversation selection changes. Have message Split controls subscribe with `useSyncExternalStore` so their disabled state updates without rebuilding unchanged transcript groups.
* Keep existing read-only and pending-command guards. Keep the renderer and desktop restrictions on splitting a genuinely `running` source. The split command still sends the selected conversation's persistence reference and message ID; the backend creates a new `waitingForInput` conversation with entries through that message, and the store selects it by conversation ID.
* Add a regression test that mounts messages while the source is `running`, then changes the same displayed conversation to `waitingForInput` without replacing message entries. Verify Split enables and invokes the command. Cover a previously split source, switching between live and historical conversations, and continued disablement for running, read-only, and pending-command states. Keep existing backend split tests for waiting sources and running-source rejection.

## acceptance criteria

* In a writable project, every message's Split button becomes enabled when its displayed conversation changes from `running` to `waitingForInput`, without reopening the transcript. This includes conversations created by an earlier split.
* Clicking Split on a waiting conversation creates and selects one new conversation ending at the chosen message. The source remains unchanged.
* Split remains disabled while the displayed source is running, the project is read-only, or a message command is pending. A backend race that makes the source ineligible reports the existing error.
* Switching between live and historical conversations shows Split availability for the conversation currently displayed.
