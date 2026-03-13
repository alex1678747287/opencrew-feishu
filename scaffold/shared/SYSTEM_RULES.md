# Shared System Rules

These rules are shared by all OpenCrew-Feishu workspaces in this scaffold.

## Working Model

- One task has one `TID`.
- One visible reply should represent the current best state.
- The system should prefer clarity over theater.
- In Feishu, task isolation is achieved by structured summaries, not by assuming perfect thread isolation.

## QAPS

- `Q`: explain, read, summarize, answer
- `A`: perform a bounded action in one working session
- `P`: handle a multi-step or multi-artifact effort
- `S`: treat as sensitive, strategic, public-facing, or irreversible

## Autonomy Ladder

- `L0`: read, inspect, summarize
- `L1`: make reversible internal changes
- `L2`: perform bounded execution with clear rollback
- `L3`: require explicit human approval before external, destructive, or irreversible action

Default mapping:

- `Q` -> `L0` or `L1`
- `A` -> `L1` or `L2`
- `P` -> `L1` or `L2`, with checkpoints
- `S` -> `L3`

## Feishu Adaptation

- Use `TID` in the first visible status block.
- Keep one active owner at a time.
- If dedicated role groups are introduced later, keep one active task per role group unless your own routing discipline is proven stable.

## Token Discipline

- Start with the smallest capable role.
- Summaries should be passed forward, not raw history.
- Review only when risk or complexity justifies it.
- Do not multiply agents for appearance.

