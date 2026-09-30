# Development setup

## Layout

| Folder | What it is |
| --- | --- |
| [`app/`](https://github.com/jan-bogaerts/md2/tree/main/app) | React + Vite web UI. TypeScript. |
| [`desktop/`](https://github.com/jan-bogaerts/md2/tree/main/desktop) | Electron host: file system, Git, action runner, agents, remote control. JavaScript. |
| [`shared/`](https://github.com/jan-bogaerts/md2/tree/main/shared) | Logic and types used by both, as `.mjs` with `.d.mts` declarations. |
| [`design/`](https://github.com/jan-bogaerts/md2/tree/main/design) | md²'s own cards, architecture notes, and release folders. |
| [`docs/`](../) | This documentation. |

`app` and `desktop` each have their own `package.json`; the root `package.json` wires up the common workflows.

## Prerequisites

- Node.js LTS and npm
- Git

## Install

```sh
npm install
npm run install:all
```

## Run

```sh
npm run dev
```

Starts the Vite dev server for `app` and, once it responds, launches the Electron shell against it. Run halves separately with `npm run dev:app` or `npm run dev:desktop`.

### macOS source development

On Apple Silicon, use the ARM64 build of Node.js LTS in a native terminal. Run the install and development commands above from the repository root. Git must be available; Apple's Command Line Tools provide it (`xcode-select --install`).

The desktop install and start scripts ensure that node-pty's macOS `spawn-helper` is executable. This is needed for terminal-based agent usage checks. The repair only adds owner execute permission to that dependency's helper files; it does not require `sudo` or disable macOS security checks.

Use **Open project** to select an existing local Git repository. A repository without `md2.config.json` opens the folder setup form; confirming creates the configuration, folders, and default actions. Setup writes Git commits, so use a disposable repository when testing this flow. Selecting or cancelling a folder alone does not initialize it.

This source workflow does not provide a signed or notarized macOS installer. Agent CLI installation and authentication are separate prerequisites for running agent actions.

## Test and check

Each subproject is standalone:

```sh
cd app
npm run lint
npm run typecheck
npm run test
```

```sh
cd desktop
npm run lint
npm run test
```

Use `npm run typecheck` (`tsc --noEmit`) for type errors — `npm run build` also bundles and is slower for the same answer. Tests run under Vitest.

## Package

```sh
npm run build:windows
```

Builds the React app, packages the Electron shell with electron-builder, and verifies the artifacts in `release/`. Signing configuration and the pre-release checklist are in [`desktop/packaging/BUILDING_WINDOWS.md`](https://github.com/jan-bogaerts/md2/blob/main/desktop/packaging/BUILDING_WINDOWS.md).

## Optional environment

`app/.env.example` and `desktop/.env.example` list optional Sentry and Aptabase keys for error reporting and usage counts. Copy to `.env` if you want them locally. Neither is required to build or run.

See also: [Architecture](architecture.md).
