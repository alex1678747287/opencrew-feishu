# Task Protocol

## TID Format

```text
TID-YYYYMMDD-HHMM-shortslug
```

Example:

```text
TID-20260318-1400-runtime-board
```

## Minimum Header

```text
TID: TID-YYYYMMDD-HHMM-shortslug
Type: Q | A | P | S
Priority: P0 | P1 | P2 | P3
Owner: HQ(CoS/CTO/Builder/KO/Ops)
Goal: one-sentence objective
Acceptance: short done condition
DependsOn: none | TID-...
HumanGate: none | exact approval gate
State: triage | active | blocked | waiting_approval | scope_changed | done | cancelled
```

## Required Sections

- `## Context`
- `## Plan`
- `## Latest Progress`
- `## Event Log`
- `## Closeout`

## Block Names

Keep these headings and labels in ASCII for PowerShell compatibility:

- `Handoff`
- `Progress`
- `Ops Review`
- `Closeout`

Values may still be written in Chinese or English, but the block labels should stay stable.

## Handoff Template

```text
Handoff:
- From: CoS
- To: CTO
- TID: TID-YYYYMMDD-HHMM-shortslug
- Ask: scope the request and write the minimum executable checklist
- Constraints: key boundary, risk, or delivery constraint
- Done When: concrete exit condition for the receiver
```

## Progress Template

```text
TID: TID-YYYYMMDD-HHMM-shortslug
Progress:
- Status: on_track | blocked | waiting_approval | scope_changed
- Completed: what is already true
- Next: immediate next step
- Risk: current risk or none
- Need From Human: approval or decision needed, or none
```

## Event Log

- Keep `## Event Log` append-only.
- Each line should be one JSON event written by the shared task engine.
- Use it for audit and recovery.
- Current workflow fields can be reduced from the event log even when header fields become stale.
