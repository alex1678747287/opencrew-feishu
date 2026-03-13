# OpenCrew Feishu V1

This scaffold adapts the OpenCrew operating model to OpenClaw plus Feishu with the smallest safe change set.

## Local UI

This repo now includes a local configuration UI.

Start it with:

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:3210
```

The UI lets you:

- define built-in and custom roles
- assign Feishu group IDs
- save a local project config
- generate custom role workspaces under `roles/`
- generate a portable apply script under `generated/`

The generated apply script uses paths relative to the repo, so the same repo can be copied to another Windows machine and reused there.

## What This Implements

- OpenCrew-style coordination rules: QAPS, autonomy levels, checkpoints, closeouts, and A2A handoffs
- A Feishu-first task model that uses `TID` instead of Slack threads
- A single visible HQ bot mode for immediate use
- A later split-agent path for `CoS`, `CTO`, and `Builder`

## Why This Shape

OpenCrew assumes `channel = role` and `thread = task`.
Feishu in your current OpenClaw setup can handle role routing, but it does not give you the same thread isolation.
The safest minimal path is:

1. Keep one visible HQ bot now
2. Run OpenCrew roles as internal logic
3. Use `TID` plus checkpoint and closeout blocks for task isolation
4. Split into real agents only after the flow is stable

## Layout

- `runtime/HQ_PROTOCOL.md`
  Used by the current main bot in shared Feishu contexts
- `runtime/HQ_PLAYBOOK.md`
  Practical single-HQ operating notes for day-to-day use
- `runtime/TASKS.md`
  Task file convention and script usage
- `scaffold/shared/`
  Shared rules and templates derived from OpenCrew concepts
- `scaffold/hq-single/`
  A ready workspace template for one visible HQ bot
- `scaffold/cos/`, `scaffold/cto/`, `scaffold/builder/`
  Ready workspace templates for the later split-agent path
- `scripts/emit-opencrew-feishu-core.ps1`
  Generates an apply script that adds and binds split agents once Feishu chat IDs are known
- `scripts/new-hq-task.ps1`
  Creates a `TID` and a task file for the current HQ workflow
- `scripts/emit-hq-block.ps1`
  Emits checkpoint, closeout, handoff, or ops review blocks

## Recommended Rollout

### Phase 1

- Keep the current main bot
- Load `runtime/HQ_PROTOCOL.md` in shared Feishu contexts
- Use logical roles only: `CoS`, `CTO`, `Builder`, with optional `KO` and `Ops`

### Phase 2

- Create dedicated agents for `CoS`, `CTO`, and `Builder`
- Bind each one to a dedicated Feishu group
- Keep the same shared protocol files

## Repo Portability

Commit this repo and carry it to other machines.

Suggested setup on another Windows machine:

1. clone the repo
2. run `npm start`
3. open the UI
4. adjust the local OpenClaw command if needed
5. generate the apply script
6. run the generated script after confirming the Feishu group IDs

## Model Strategy

This scaffold is model-agnostic by design.
Do not bind roles to a fixed vendor model.
Prefer this capability split instead:

- router: cheap and fast
- worker: default execution
- deep: planning, review, and difficult cases
- vision: only when image reasoning is required

## Sources

- OpenCrew README
- OpenCrew concepts and architecture docs
- OpenCrew Feishu setup and deploy docs
