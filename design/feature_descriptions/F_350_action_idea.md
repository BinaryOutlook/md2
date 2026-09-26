---
author: 
id: F_350
internalId: eb1707b3-15c4-4a42-b86e-db35fbfd9060
title: Action idea
status: ready
owner: 
affects:
agents:
  - design/activity/card__eb1707b3-15c4-4a42-b86e-db35fbfd9060.json
policy:
after: 96236df6-2c3a-4846-9d52-f29b7ee9041d
changedFiles:
  - app/src/App.tsx
  - app/src/components/actions/editor/action_definition_fields.grouped.test.tsx
  - app/src/components/actions/editor/action_definition_fields.tsx
  - app/src/components/actions/run/action_version_dialog.test.tsx
  - app/src/components/actions/run/action_version_dialog.tsx
  - app/src/components/shell/menu/app_menu.tsx
  - app/src/components/shell/project/complete_release_dialog.tsx
  - app/src/components/shell/project/project_dialogs.test.tsx
  - app/src/data/action_placeholders.ts
  - app/src/data/action_run_types.ts
  - app/src/data/data_types.ts
  - app/src/data/electron_action_bridge.ts
  - app/src/project_template/actions/update-project-version.json
  - app/src/project_template/project_template.node.test.ts
  - app/src/services/actions/action_run_registry.node.test.ts
  - app/src/services/actions/action_run_registry.ts
  - app/src/services/actions/action_service_helpers.ts
  - app/src/services/actions/action_text.ts
  - app/src/services/actions/action_version_request_service.ts
  - app/src/services/config/config_entries.ts
  - app/src/services/config/config_service.service.test.ts
  - app/src/services/config/config_service.ts
  - desktop/src/actions/action/action_agent_executor.js
  - desktop/src/actions/action/action_agent_executor.test.mjs
  - desktop/src/actions/action/action_command_executor.js
  - desktop/src/actions/action/action_definitions.test.mjs
  - desktop/src/actions/action/action_run.js
  - desktop/src/actions/action/action_run_request.js
  - desktop/src/actions/action/action_run_request.test.mjs
  - desktop/src/actions/action/action_runner_service.js
  - desktop/src/actions/action/action_runner_service.test.mjs
  - desktop/src/actions/action/action_text.js
  - desktop/src/actions/action/action_text.test.mjs
  - desktop/src/shell/local_bridge_dispatch.js
  - desktop/src/shell/local_bridge_dispatch.test.mjs
  - desktop/src/shell/preload.js
  - desktop/src/shell/preload.test.mjs
  - docs/actions/action-definition.md
  - docs/actions/placeholders.md
  - shared/action_definitions.d.mts
  - shared/action_definitions.mjs
---
## Goal

Let an action ask the user for a version before it runs. The answer is available as `{{version}}` to command and agent actions and can be reused during release preparation. Provide a script that applies the version to the project's relevant code files, such as the `version` field in `package.json`.

## Current behavior

Action definitions are validated in `shared/action_definitions.mjs` and edited in `app/src/components/actions/editor/action_definition_fields.tsx`. `ActionRunnerService.start()` creates an `ActionRun`, which executes `onBefore`, the main action, matching `on` actions, and `onAfter`. The desktop action text resolver substitutes known placeholders for commands and agent prompts. The action popup can submit an edited prompt, which overrides the definition prompt. There is no action-level input request or `{{version}}` placeholder. Scheduled and state-triggered runs can start without a visible dialog.

The separate release operation currently receives a **release name** through `CompleteReleaseDialog` and `releaseOperations.completeRelease()`; it has no version input from an action run.

## Implementation

1. Add an optional action-definition field for requested user input. Its editor control is a select with **None** and **Version**; `version` is the only supported value. Update shared raw/resolved types, strict validation, graph loading, editable-definition conversion, and editor error routing. Existing actions without the field retain their behavior. Both command and agent definitions may declare it.
2. When an interactive run starts, inspect the root action and its linked `onBefore`, `on`, and `onAfter` actions for a version request. The backend emits a run-scoped input request and waits for the frontend response **before any action in that run executes**. The frontend shows a version dialog with Confirm and Cancel. Correlate the response by run ID; reject empty or invalid values and duplicate or late responses. Cancel, window closure, and run shutdown must settle the wait without leaving a pending run. The validated value belongs to that run and is reused by its linked actions.
3. Extend the Electron action bridge and `ActionRunInput`/run events for this exchange. Validate the response again in the backend. Unattended runs must fail before execution when the action chain needs a version and no version was explicitly supplied; they must never wait for a dialog.
4. Add `{{version}}` to the documented placeholder list and resolve it in command text, definition prompts, and edited popup prompts. Pass the run value through the command and agent executors and through linked phases. Missing `version` must produce a clear error instead of leaving the literal placeholder in executable text. Review all callers of the shared resolver before changing its signature; frontend prompt preparation also needs the same value or must defer version substitution until execution.
5. Add a project-specific version update script and an action that calls it with the supplied version. The script updates each explicitly supported manifest and reports failures without partially writing a file. The target file list and version syntax must be fixed for the project before implementation; do not infer languages from arbitrary repository files.
6. Connect the collected version to the existing release workflow explicitly. The release UI may use it as a proposed release name, but the user still confirms the release. Define how a version from an earlier action run is retained and when it is cleared; do not treat an in-memory run value as durable release state.
7. Document the definition field and placeholder in `docs/actions/action-definition.md` and `docs/actions/placeholders.md`. Add focused tests for validation, editor selection, bridge request/response, cancellation, unattended runs, command and agent substitution, edited prompts, linked-action reuse, and the version script. Run targeted tests and lint.

## Acceptance criteria

* An action author can select Version for either action type, save the definition, reload it, and see the selection preserved. Unknown input types are rejected.
* Starting a qualifying interactive action shows one version dialog before any command or agent starts. A linked action uses the same answer without another dialog.
* Confirming a valid version substitutes every `{{version}}` in commands and agent prompts, including an edited popup prompt. Empty or invalid input cannot start execution.
* Cancelling the dialog or the run starts no action and leaves no pending input request. A late answer cannot resume a cancelled run.
* An unattended action requiring a version fails clearly before side effects unless its start request supplies a validated version.
* The version script updates the agreed files to the exact supplied version; a failed update does not leave a partially written file.
* The release dialog can reuse a collected version as a proposed release name, and the user can review it before completing the release.

## Decisions needed before coding

* Which manifest files and version format does the script support? The description names `package.json` only as an example.
* Should release-name reuse survive an app restart, and when should a previously collected version stop being proposed? The current release API has a release name, not a version field.