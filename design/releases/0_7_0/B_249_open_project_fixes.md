---
author: 
id: B_249
internalId: c8ca7e43-f909-4a9a-8bc4-3c3f1c305219
title: open project fixes
status: ready
owner: 
affects:
agents:
  - design/releases/0_7_0/card__c8ca7e43-f909-4a9a-8bc4-3c3f1c305219.json
policy:
after: f8f360b8-6713-4dfb-bb1c-8f695d46bf8d
---

* when running in browser (not electron), don't show the repository - folder buttons, only repository is allowed.
* show message that local folders can't be opened from browser
* if no credentials available, show message to inform user we can't load repositories without auth token

## Current state

Terms:

* **Browser mode**: app runs without Electron bridge; `isDesktopProjectMode()` returns false because `getElectronDataBridge()` is null.
* **Remote form**: fields `Endpoint`, `Project root path`, `Branch` and button `Load remote branches` in the open-project dialog. Opens a project served by a remote md2 desktop app (source `remote`).
* **Credentials**: GitHub access token. `isGithubAuthenticated` comes from `useGithubAuth` → `useProjectToolbarMenuActions` → `projectOpenFlowService.setAuthentication(...)`.

Behavior today:

* `ProjectOpenDialog` (`app/src/components/shell/project/project_open_dialog.tsx`) always renders the `Project kind` toggle (`Repository` / `Folder`), both modes.
* In browser mode, `Folder` switches source to `remote` and shows the remote form. In desktop mode, `Folder` switches to `local`.
* Browser mode shows no hint that local folders need the desktop app.
* Without credentials, repository fields (`Filter repositories`, `Repository`, `Owner`, `Repository`, `Load branches`) render disabled, Open stays disabled, no explanation shown. Applies to `Personal` and `Public`, both modes.
* `RemoteConnectButton` (`app/src/components/shell/remote_connect_button.tsx`) renders only in browser mode (`RemoteControlButton` returns it when no bridge). After connect, `openRemoteProject`:
  * remote server has active project → `projectSessionService.openProject('remote', ...)`; if it returns a folder-setup resolution → `requestOpenProjectDialog('remote', activeProject, resolution)`.
  * no active project → `requestOpenProjectDialog('remote')` → dialog opens on remote form.
  * `openProject` throws → `requestOpenProjectDialog('remote', activeProject)` → dialog opens on remote form. Error already reported by `ProjectSessionService.withLoading` through `dialogService`.
* Remote form is reachable only in browser mode, so after this fix it has no entry point.

## Implementation details

### Decisions (confirmed with user)

* Browser mode: open-project dialog shows only GitHub repository sources. Remote form removed from dialog and its code deleted.
* Connect with no active remote project: no dialog; show info message.
* Missing-credentials message: shown whenever repository view is shown (`Personal` and `Public`), browser and desktop.

### `project_open_dialog.tsx`

* Render `Project kind` toggle only when `isDesktopMode && !projectOpenResolution`.
* `handleProjectKindChange`: folder kind → `'local'` (remove browser `'remote'` branch).
* Browser mode, no resolution: render MUI `Alert severity="info"` above repository fields: `Local folders can't be opened from the browser. Use the md2 desktop app to open a local folder.`
* Repository view (`source` is `personal` or `public`, no resolution) and `!isGithubAuthenticated`: render `Alert severity="warning"`: `Repositories can't be loaded without a GitHub access token. Sign in with a personal access token first.` Existing disabled states stay.
* Remove remote form: `remoteEndpoint`, `remoteRootPath` state, `isRemoteComplete`, `isRemoteOpenDisabled`, handlers `handleRemoteEndpointChange`, `handleRemoteRootPathChange`, `handleLoadRemoteBranchesClick`, remote branch in `handleOpenClick`, remote JSX block, imports `savedRemoteProjectEndpoint`.
* `selectedBranch` initial value → `''` (no `flow.remoteProject`). Drop `flow` snapshot read if unused.

### `project_open_flow_service.ts`

* `ProjectOpenSource` → `'local' | 'personal' | 'public'`.
* `ProjectOpenRequest`: remove `remote` variant; `submit` drops remote validation and remote branch.
* Remove `loadRemoteBranches`, `savedRemoteProjectEndpoint`, `remoteProject` state field, `ProjectOpenEntry.project`.
* `show`: `source: entry.source ?? null` (no `'remote'` derivation from resolution). Remote folder-setup resolution still works: dialog folder-setup path ignores `source`, `confirmFolders` uses `state.resolution`.

### `project_command_events.ts`

* `ProjectDialogSource` → `'personal' | 'public'`.
* `OpenProjectDialogDetail` drops `project`; `requestOpenProjectDialog(source?, resolution?)`.

### `remote_connect_button.tsx` (`openRemoteProject`)

* No active project → `dialogService.info('The remote md2 server has no open project. Open a project in the md2 desktop app first.')`, no dialog.
* Folder-setup resolution → `requestOpenProjectDialog(undefined, resolution)`.
* `openProject` throws → do nothing (error already reported); remove dialog request.

### Edge cases

* Browser, dialog opened with folder-setup resolution (remote): toggle and both alerts hidden (`projectOpenResolution` set); folder setup unchanged.
* Credentials arrive while dialog open: `setAuthentication` dispatches `isGithubAuthenticated`; warning disappears, repositories load (existing behavior).
* Desktop, no credentials, `Folder` kind: no warning (repository view not shown).

### Tests

* `project_open_dialog.test.tsx`:
  * update `shows repository sources in browser mode and folder sources in desktop mode`: browser → no `Project kind` group, info alert shown; desktop → toggle present, `Folder` pressed, no info alert.
  * new: warning shown for `Personal` and `Public` when `isGithubAuthenticated: false`; hidden when authenticated.
  * remove remote-form tests (`prefills the endpoint...`, `loads and opens a remote project...`).
* `project_open_flow_service.test.ts`: remove/replace remote submit test (line ~100).
* `main_window.test.tsx`: test at line ~180 uses remote submit only to drive a loading phase; switch it to a `personal` or `local` submit.
* `remote_connect_button.grouped.test.tsx`: no active project → `dialogService.info` called, no open-dialog event; resolution → detail `{ resolution, source: undefined }`; openProject failure → no event.

## Acceptance criteria

1. Browser mode: Open project dialog shows no `Repository` / `Folder` toggle; repository sources only.
2. Browser mode: dialog shows info message that local folders can't be opened from the browser.
3. Browser mode: remote form (`Endpoint`, `Project root path`, `Load remote branches`) never shown; remote form code removed.
4. Desktop mode: toggle unchanged; `Folder` shows local folder field and recent folders; no browser info message.
5. Repository view (`Personal` or `Public`) without GitHub credentials, either mode: warning message says repositories can't be loaded without auth token. Message hides once authenticated.
6. Connect button, remote server without active project: info message via `dialogService`, open-project dialog not opened.
7. Connect button, remote project needing folder setup: `Project folders` dialog still shown and confirm works.
8. Connect button, remote project load failure: error shown once (by `ProjectSessionService`), open-project dialog not opened.
9. Updated/new tests pass; `npm run lint` and `npm run typecheck` in `app/` clean.