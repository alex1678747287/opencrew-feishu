# HQ Task Files

Task files live under `runtime/tasks/`.

## Purpose

These files are the local source of truth for HQ-style task coordination.
They replace chat-thread isolation with explicit `TID` files that can be parsed,
edited, audited, and recovered later.

## Required Sections

Each task file should keep these sections:

- task header metadata
- `## Context`
- `## Plan`
- `## Latest Progress`
- `## Event Log`
- `## Closeout`

Keep the file compact. Do not paste long chat history into it.

## Block Names

Use ASCII block titles and field names for compatibility with Windows PowerShell:

- `Handoff`
- `Progress`
- `Ops Review`
- `Closeout`

Values may still be written in Chinese or English, but the block and field labels
should stay in the default script format when possible.

## Naming

```text
TID-YYYYMMDD-HHMM-shortslug.md
```

## Recommended Flow

1. Create the task with `new-hq-task.ps1` or the local UI.
2. Keep the header current for goal, acceptance, dependencies, and human gate.
3. Append workflow actions through the shared task engine instead of manual edits when possible.
4. Close the task with an explicit closeout block.

## Notes

- `Q` tasks can often skip a task file.
- `S` tasks may still use a task file, but should pause at approval boundaries.
- A good task file should let the next operator continue without rereading the whole history.

## Extended Metadata

- `Priority:` uses `P0` to `P3`.
- `DependsOn:` is a comma-separated list of upstream TIDs, or `none`.
- `HumanGate:` describes the exact human approval or decision gate, or `none`.
- In `## Plan`, prefer checklist lines such as `- [ ] scope the task` and `- [x] validate output`.
- The board derives the next step from the latest checkpoint first, then from the next unchecked plan item.

## Event Log

- Keep an append-only `## Event Log` section in each task file.
- Each line should be a JSON event written by the shared task engine.
- Use it for audit and recovery; do not rewrite old event lines when current task state changes.
- The runtime board reduces workflow fields such as `State`, `Owner`, and `HumanGate` from the event log first.
- Task metadata such as `Goal`, `Acceptance`, and `DependsOn` still comes from the current header snapshot.
