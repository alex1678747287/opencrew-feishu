# OpenCrew Feishu

Local control studio for running an OpenCrew-style workflow on top of OpenClaw and Feishu.

Chinese documentation: [`docs/README.zh-CN.md`](docs/README.zh-CN.md)

This repo gives you:

- a local UI for role configuration and scaffold generation
- a single-HQ operating mode for shared Feishu groups
- a `TID`-based task workflow with handoff, checkpoint, approval, and closeout actions
- a runtime board that derives current state from task files and append-only audit events

## Why This Exists

OpenCrew assumes `channel = role` and `thread = task`.
That model does not map cleanly onto a Feishu setup where one visible bot may need to coordinate multiple internal roles inside shared groups.

This project keeps the external surface simple:

- one visible HQ speaker in Feishu
- internal roles such as `CoS`, `CTO`, `Builder`, `KO`, and `Ops`
- explicit task isolation through `runtime/tasks/<TID>.md`
- a local control studio for generating workspaces, bindings, and runtime views

## What It Implements

- OpenCrew-style coordination rules: QAPS, autonomy levels, checkpoints, closeouts, and A2A handoffs
- a Feishu-first task model that uses `TID` files instead of chat-thread state
- a local runtime board for active, blocked, approval-waiting, and closed work
- a shared task engine used by both the UI and PowerShell scripts
- append-only task event logs for audit and recovery
- a later split-agent path for `CoS`, `CTO`, and `Builder`

## Quick Start

Requirements:

- Windows PowerShell
- Node.js
- OpenClaw installed locally

Start the local UI:

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:3210
```

Run tests:

```powershell
npm test
```

Health check:

```text
GET http://127.0.0.1:3210/api/health
```

Common API error semantics:

- `400` invalid request payload or validation failure
- `404` missing API route or task file does not exist
- `409` workflow conflict such as approving a task that is not in `waiting_approval`

## What The UI Can Do

- define built-in and custom roles
- assign Feishu group IDs
- save a local project config
- generate custom role workspaces under `roles/`
- generate a portable apply script under `generated/`
- visualize live task orchestration from `runtime/tasks/`
- inspect task dependencies, audit events, and current role ownership
- create and advance `TID` tasks directly in the UI
- manually refresh the runtime board and see the latest successful refresh time
- review work in a GitHub Projects-style state board

The generated apply script uses repo-relative paths so the same repository can be moved to another Windows machine and reused there.

## Workflow Model

The safest rollout shape for Feishu is:

1. Keep one visible HQ bot now.
2. Run OpenCrew roles as internal logic.
3. Use `TID` files plus handoff, checkpoint, approval, and closeout blocks for task isolation.
4. Split into dedicated agents only after the flow is stable.

Key runtime upgrades already included here:

- `Priority`, `DependsOn`, and `HumanGate` task headers
- checklist-based `## Plan` sections
- append-only `## Event Log` audit trails
- explicit `approve` and `reject` actions for `waiting_approval`
- closed-task guardrails that block further workflow mutation
- dependency and downstream visibility in the runtime board

## Repository Layout

- `app/`
  Local server, generator, task engine, and runtime board logic.
- `ui/`
  Browser UI for configuration, generation, and runtime operations.
- `runtime/`
  HQ protocol, playbook, supervision notes, and task-file conventions.
- `scaffold/`
  Shared prompt assets plus built-in role workspaces.
- `scripts/`
  PowerShell entrypoints for task creation, updates, and scaffold emission.
- `config/`
  Sample configuration and local config output.
- `test/`
  Regression tests for generation, runtime timeline, workflow, and guardrails.

## Main Files

- [`runtime/HQ_PROTOCOL.md`](runtime/HQ_PROTOCOL.md)
  Shared protocol for the current single-HQ operating mode.
- [`runtime/HQ_PLAYBOOK.md`](runtime/HQ_PLAYBOOK.md)
  Practical operating notes for day-to-day use.
- [`runtime/HQ_SUPERVISION.md`](runtime/HQ_SUPERVISION.md)
  How one visible bot supervises internal roles and what the local board should expose.
- [`runtime/TASKS.md`](runtime/TASKS.md)
  Task file conventions and event-log rules.
- [`scripts/emit-opencrew-feishu-core.ps1`](scripts/emit-opencrew-feishu-core.ps1)
  Generates an apply script that adds and binds split agents once Feishu group IDs are known.
- [`scripts/new-hq-task.ps1`](scripts/new-hq-task.ps1)
  Creates a `TID` and a task file for the HQ workflow.
- [`scripts/update-hq-task.ps1`](scripts/update-hq-task.ps1)
  Routes CLI actions into the shared workflow engine.

## Repo Portability

Suggested setup on another Windows machine:

1. Clone the repo.
2. Run `npm start`.
3. Open the UI.
4. Adjust the local OpenClaw command if needed.
5. Generate the apply script.
6. Run the generated script after confirming the Feishu group IDs.

## Model Strategy

This scaffold is model-agnostic by design.
Do not bind roles to a fixed vendor model.

Prefer a capability split like this:

- router: cheap and fast
- worker: default execution
- deep: planning, review, and difficult cases
- vision: only when image reasoning is required

## Current Status

- local UI works
- runtime board and task engine are implemented
- runtime server now exposes `/api/health` and structured API error codes
- shared workflow guardrails are covered by tests
- repository is public under the MIT License

The runtime board also shows an explicit manual refresh entry and latest-refresh feedback so operators can tell whether the local view is current.

## Sources

- OpenCrew README
- OpenCrew concepts and architecture docs
- OpenCrew Feishu setup and deploy docs
