# Claude Handoff

## Project

- Repo: `C:\Users\Admin\opencrew-feishu`
- Goal: adapt OpenCrew's multi-agent coordination model to OpenClaw + Feishu, while keeping only one visible external bot (`CoS`) and exposing internal task flow, task state, and role execution state in the local UI.
- Current expectation from user: this is not just a UI clone of OpenCrew. It must behave like a real multi-agent collaboration system with explicit workflow closure, visible orchestration, and recoverable task context.

## User Intent

The user wants:

- multi-agent collaboration inspired by OpenCrew GitHub patterns
- visible task flow
- visible agent execution status
- one visible bot externally, internal role handoff behind the scenes
- fewer fake states and more real workflow closure

The user was specifically dissatisfied that the system previously had rich display but weak actual state transitions.

## Current System Shape

- Single visible speaker: `CoS`
- Internal roles: `CoS`, `CTO`, `Builder`, optional `KO`, `Ops`, plus custom roles
- Task carrier: markdown task files under `runtime/tasks/`
- Runtime board source of truth: task files are parsed into the local UI and API
- UI port: default `3210`
- API server entry: `app/server.js`

## What Was Already In Place Before This Round

These had already been implemented before the latest handoff work:

- richer task headers: `Priority`, `DependsOn`, `HumanGate`
- `## Plan` checklist support using `- [ ]` and `- [x]`
- runtime board parsing for dependencies, human gates, checklist progress, and dependency-vs-real-blocker distinction
- task creation UI support for the richer protocol
- task cards showing priority, dependencies, checklist progress

## What Was Implemented In This Round

### 1. Real workflow closure in task backend

File: `app/hq-tasks.js`

Added action modes:

- `edit-metadata`
- `toggle-plan`
- `approve`
- `reject`

Added backend behaviors:

- edit task header fields from the shared task engine
- toggle checklist items by index
- validate dependency existence on create and edit
- detect dependency cycles on create and edit
- `approve` now explicitly closes a waiting approval state by:
  - appending a progress block
  - restoring `State: active`
  - clearing `HumanGate` to `none`
- `reject` now explicitly closes a waiting approval state by:
  - appending a progress block
  - setting `State: scope_changed`
  - resetting `Owner: HQ(CoS)`
  - preserving or updating `HumanGate`
- `ops-review` with `needs_fix` now forces state back to `scope_changed` and returns ownership to `HQ(CoS)`

### 2. Runtime UI actions expanded

Files:

- `ui/index.html`
- `ui/app.js`
- `ui/styles.css`

Added runtime action panels for:

- metadata editing
- checklist toggling
- approve
- reject

UI behavior added:

- selected task now back-fills metadata editor fields
- selected task checklist is rendered into a dedicated toggle panel
- runtime action form can now update task headers without editing files manually
- waiting tasks can now be explicitly approved or rejected in the UI

### 3. CLI task update path unified with backend engine

File: `scripts/update-hq-task.ps1`

This script now routes actions into the same JS task engine in `app/hq-tasks.js` instead of maintaining a separate PowerShell-only task state machine.

This matters because otherwise UI/API/CLI behavior drifts over time.

### 4. Runtime board guidance updated

File: `app/runtime-board.js`

Updated guidance so `waiting_approval` no longer reads as passive metadata. The board now points operators toward explicit `approve` / `reject` closure.

### 5. Docs updated

Files:

- `README.md`
- `runtime/HQ_SUPERVISION.md`

Docs now mention:

- explicit `approve` / `reject`
- metadata editing
- checklist toggling
- shared workflow engine usage in `update-hq-task.ps1`

## Important Repair Performed

File: `ui/app.js`

This file had pre-existing syntax corruption caused by broken string/template content. During this round it was repaired to a parseable and working state while integrating the new runtime actions.

Do not assume the corruption came from the latest action-only changes; the file already contained malformed lines before the final checks.

## Verification Already Completed

### Syntax checks passed

- `node --check app/hq-tasks.js`
- `node --check app/runtime-board.js`
- `node --check app/server.js`
- `node --check ui/app.js`
- PowerShell parse check for `scripts/update-hq-task.ps1`

### Backend workflow smoke test passed

A temporary isolated test project was created and verified end-to-end for:

- create task
- edit metadata
- toggle checklist item
- checkpoint into `waiting_approval`
- explicit `approve`
- `ops-review needs_fix`
- explicit `reject`
- dependency cycle validation
- missing dependency validation

### Server smoke test passed

Verified local server responses:

- `/api/default-config` -> `200`
- `/api/runtime-board` -> `200`

## What Still Needs Work

The system is much closer to a real multi-agent workflow now, but it is still not fully complete.

### Highest priority gaps

1. Event log vs current state separation
- Right now task markdown still mixes current state and historical action stream in one document.
- A more robust model would explicitly separate:
  - current authoritative task state
  - append-only action/event log
- This would reduce ambiguity when the parser infers status from the latest blocks.

2. Richer dependency visibility
- Dependencies are validated and surfaced, but there is still no dedicated dependency graph view.
- The current board shows dependency blockers, but not a true graph or upstream/downstream relationship browser.

3. Auto-refresh / operator ergonomics
- Runtime board is available, but the operator flow still depends on manual interactions.
- Auto-refresh or polling for task changes would make the board more useful during real collaboration.

4. More explicit approval semantics
- `approve` / `reject` now exist, but there is still room to tighten semantics around:
  - who is allowed to approve
  - multi-stage approvals
  - approval evidence / audit consistency

5. Better task mutation coverage
- The backend can edit metadata and plan, but there is still no dedicated structured event for every mutation type.
- Over time, direct document mutation could become harder to audit than a first-class event model.

## Recommended Next Step For Claude

If continuing immediately, work in this order:

1. Introduce an append-only task event model
- Keep markdown compatibility if necessary, but define a clearer internal event schema.
- Distinguish between:
  - task header snapshot
  - plan snapshot
  - workflow actions
  - approval decisions

2. Add a dependency-centric runtime view
- Show upstream/downstream chains directly.
- Make it obvious why a task is blocked and what would unblock it.

3. Add runtime auto-refresh
- Poll `/api/runtime-board` or add a lightweight refresh strategy.
- Keep it simple; no need for websocket complexity first.

4. Tighten approval UX
- In the UI, make approval actions visually distinct from ordinary progress updates.
- Surface current `HumanGate` more aggressively when a task is waiting.

## Key Files To Read First

Backend:

- `app/hq-tasks.js`
- `app/runtime-board.js`
- `app/server.js`

UI:

- `ui/index.html`
- `ui/app.js`
- `ui/styles.css`

Task tooling and docs:

- `scripts/new-hq-task.ps1`
- `scripts/update-hq-task.ps1`
- `runtime/TASKS.md`
- `runtime/HQ_SUPERVISION.md`
- `README.md`

## Notes About Environment

- Windows + PowerShell environment
- Local repo lives outside the default writable root of the agent environment, so edits were often done with escalated shell commands
- `apply_patch` had repeated sandbox failures in this environment earlier
- User is sensitive to slow progress and prefers direct, concrete updates
- User cares more about real collaboration correctness than UI polish alone

## Short Handoff Summary

The project now has a materially better multi-agent workflow core:

- approvals are explicit
- dependencies are validated
- checklist progress is mutable
- task metadata is editable from UI and CLI
- the runtime board can now represent a more truthful collaboration loop

The next meaningful step is not more decoration. It is to harden the state model further with a clearer event log and better dependency/operator visibility.
