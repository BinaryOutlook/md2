---
author: 
id: F_383
internalId: c0629e16-a603-4a9c-b19d-5c7cac9772ec
title: Prompts need to be shown faster
status: ready for implementation
owner: 
affects:
agents:
  - design/activity/card__c0629e16-a603-4a9c-b19d-5c7cac9772ec.json
policy:
after: eb1707b3-15c4-4a42-b86e-db35fbfd9060
---
We generated a squence diagram (json file), of the action popup and its interactions. There, you can see that input sent by the user to the agent, first goes to backend and back to frontend before it is shown in the chatlog. This is too late.

How it should work:&#x20;

* User sends input
* Prompt is immediatly shown in chatlog, but as an ´in transmission´ text.
* Once the frontend gets the prompt back from backend, we show text as we do now, sent.

## Current state

`runPopupAction` reads the editor draft. For an active agent run, it waits for `enqueueActionPrompt` to return before clearing the draft. The desktop backend validates the prompt, returns a queued entry, and publishes `agentPromptQueued`; `ActionRunRegistry` then exposes it as a `Queued` row in the chatlog. When the agent accepts the prompt, `agentUserMessage` adds the normal sent message. For a new or restarted run, the chatlog likewise waits for backend run events before showing the user message. The submit action itself creates no chatlog row.

## implementation details

* On Send or the keyboard shortcut, capture the exact submitted editor text and add a temporary chatlog row marked `In transmission` immediately, before awaiting the bridge. Apply this to new, restarted, and active agent runs. Keep temporary submission data in a service owned by the popup action/context, and render it through the chatlog tracker; do not insert it into `AgentConversation.entries` or persist it.
* Scope each temporary row to the submitted action, card identity (`cardInternalId`) or project context, and conversation/run binding. Keep a local submission ID so identical prompts and rapid submissions stay distinct. Paths identify persistence locations, not the submission's domain identity.
* Reconcile each temporary row with its corresponding backend update: replace it with the existing `Queued` row when `agentPromptQueued` arrives, or with the normal sent user message when `agentUserMessage` arrives. Match submissions by run and submission order, not prompt text; the bridge response supplies the backend queue ID for later queue updates. Keep an accepted row visible when `agentPromptRemoved` precedes `agentUserMessage`, until the sent message replaces it. Handle events arriving before the bridge promise resolves without duplicates.
* If submission fails before backend acceptance, remove only that temporary row, retain or restore its editor text without overwriting newer edits, and report the error through `dialogService`. Clear temporary rows when their run ends without accepting them, or when the popup action/context changes. Historical conversations must never show another run's temporary rows.
* Cover immediate display, queue and user-message reconciliation, new and restarted runs, duplicate prompt text, backend rejection, newer editor edits, and historical selection in focused service and popup/chatlog tests.

## acceptance criteria

* Pressing Send or Ctrl/Cmd+Enter shows submitted text in the chatlog as `In transmission` before the backend responds, for new, restarted, and active agent runs.
* Backend queue acceptance replaces the temporary row with one `Queued` row; agent acceptance replaces it with one normal sent user message. No duplicate row appears if events and bridge response arrive in either order.
* Failed submission removes the temporary row, preserves unsent text, and shows an error. Later editor changes remain intact.
* Rapid or identical submissions each reconcile with their own backend result. Switching to a historical conversation hides pending rows from the live run.
* Temporary rows never enter persisted conversations. Existing queued-prompt editing and deletion still work after backend acceptance.
