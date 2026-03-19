# HQ Supervision

Use this when Feishu shows one visible bot, but work is still coordinated through internal roles.

## Core Principles

- Only one visible external speaker.
- Internal roles do not act like separate public bots.
- Role-to-role work is carried by `runtime/tasks/<TID>.md`.
- The local board derives current owner, state, and next step from those task files.

## Internal Blocks

Use four durable block types:

1. `Handoff`
   Route work to the next owner with ask, constraints, and done-when.
2. `Progress`
   Write back status, completed work, next step, risk, and human input needs.
3. `Ops Review`
   Record runtime or release review only when needed.
4. `Closeout`
   Finish the task and give CoS the final external summary anchor.

## What CoS Actually Supervises

CoS should not execute every step personally. CoS should:

1. create the `TID` and define goal, acceptance, dependencies, and human gate
2. send the first `Handoff`
3. read the latest `Progress` and react to status:
   - `on_track`: let execution continue
   - `blocked`: remove the blocker or reduce scope
   - `waiting_approval`: stop execution and pull in the human
   - `scope_changed`: re-scope and reset acceptance
4. request `Ops Review` when runtime risk is real
5. close the task and give the final visible answer

## What The Runtime Board Should Show

The local UI should make these visible without rereading the file manually:

- active, blocked, waiting, and scope-changed counts
- the current focused `TID`
- the current internal owner and role state
- the recent timeline of handoffs, checkpoints, approvals, and closeout
- dependency chains and missing links
- recent append-only audit events from `## Event Log`

## Operating Notes

- Treat explicit blockers and waiting approvals as first-class alerts.
- Keep dependency-only blockers visible, but do not let them displace genuinely ready work from the main focus slot.
- CTO is responsible for the minimum executable checklist before Builder starts.
- Record approval boundaries through `HumanGate`, then close them with explicit `approve` or `reject` events once execution actually pauses.
