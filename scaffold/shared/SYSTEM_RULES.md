# Shared System Rules

These rules apply to every built-in workspace in this scaffold.

## Work Model

- One non-trivial task maps to one `TID`.
- One visible reply should represent the current best state.
- Prefer clarity and recoverability over team-role theater.
- In Feishu, task isolation comes from task files and structured summaries, not from perfect thread separation.

## Visible Reply Format

- The first visible line must include the current role prefix.
- Default form: `[Role] reply`.
- Use the role name defined by `IDENTITY.md`.
- In the shared HQ entrypoint, do not hide behind a generic `[HQ]` label when a concrete role is leading.

## QAPS

- `Q`: read, explain, summarize, answer
- `A`: bounded action within one working loop
- `P`: multi-step or multi-output task
- `S`: sensitive, strategic, public-facing, or irreversible task

## Autonomy Levels

- `L0`: read, inspect, summarize
- `L1`: reversible internal edits
- `L2`: bounded execution with clear rollback
- `L3`: external, destructive, or irreversible action that requires explicit human approval

Default mapping:

- `Q` -> `L0` or `L1`
- `A` -> `L1` or `L2`
- `P` -> `L1` or `L2`, with progress tracking
- `S` -> `L3`

## Feishu Adaptation

- Put the `TID` in the first visible structured status block for non-trivial work.
- Keep one active owner at a time.
- Until routing is truly stable, each role group should handle one active task at a time.

## Token Discipline

- Start with the smallest capable role.
- Pass summaries, not raw history dumps.
- Pull in review only when risk or complexity justifies it.
- Do not add agents just to look like a team.
