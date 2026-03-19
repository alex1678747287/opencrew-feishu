# TID-20260318-1400-runtime-example

TID: TID-20260318-1400-runtime-example
Type: P
Priority: P1
Owner: HQ(Builder)
Goal: Surface task state, owner, and audit history in the runtime board
Acceptance: The board shows owner, state, dependencies, recent events, and next step
DependsOn: none
HumanGate: none
State: active
CreatedAt: 2026-03-18T14:00:00+08:00
UpdatedAt: 2026-03-18T14:14:00+08:00

## Context

- One visible CoS bot supervises internal roles through task files.
- The runtime board should stay useful even if the latest header snapshot becomes stale.

## Plan

- [x] Define the task header and initial checklist
- [x] Handoff planning to CTO
- [x] Move execution to Builder
- [ ] Render the latest audit event in the board

## Latest Progress

Handoff:
- From: CoS
- To: CTO
- TID: TID-20260318-1400-runtime-example
- Ask: Scope the runtime board changes and write the minimum executable checklist
- Constraints: Keep one visible external bot and short replies
- Done When: A short plan and a clear next owner

Handoff:
- From: CTO
- To: Builder
- TID: TID-20260318-1400-runtime-example
- Ask: Implement the task-card and selected-task runtime details
- Constraints: Keep the task parser backward compatible
- Done When: The board reflects state, owner, dependencies, and recent audit events

TID: TID-20260318-1400-runtime-example
Progress:
- Status: on_track
- Completed: Added event-log parsing and selected-task summaries
- Next: Render recent audit events directly in the runtime board
- Risk: none
- Need From Human: none

## Event Log

{"ts":"2026-03-18T14:00:00+08:00","mode":"create","tid":"TID-20260318-1400-runtime-example","previousState":"none","type":"P","state":"triage","owner":"HQ(CoS)","priority":"P1","goal":"Surface task state, owner, and audit history in the runtime board","acceptance":"The board shows owner, state, dependencies, recent events, and next step","humanGate":"none","dependsOn":[],"planDoneCount":0,"planTotal":4,"summary":"Created task, owner HQ(CoS), priority P1"}
{"ts":"2026-03-18T14:03:00+08:00","mode":"handoff","tid":"TID-20260318-1400-runtime-example","previousState":"triage","type":"P","state":"active","owner":"HQ(CTO)","priority":"P1","goal":"Surface task state, owner, and audit history in the runtime board","acceptance":"The board shows owner, state, dependencies, recent events, and next step","humanGate":"none","dependsOn":[],"planDoneCount":1,"planTotal":4,"summary":"Handoff: CoS -> CTO","from":"CoS","to":"CTO"}
{"ts":"2026-03-18T14:08:00+08:00","mode":"handoff","tid":"TID-20260318-1400-runtime-example","previousState":"active","type":"P","state":"active","owner":"HQ(Builder)","priority":"P1","goal":"Surface task state, owner, and audit history in the runtime board","acceptance":"The board shows owner, state, dependencies, recent events, and next step","humanGate":"none","dependsOn":[],"planDoneCount":2,"planTotal":4,"summary":"Handoff: CTO -> Builder","from":"CTO","to":"Builder"}
{"ts":"2026-03-18T14:14:00+08:00","mode":"checkpoint","tid":"TID-20260318-1400-runtime-example","previousState":"active","type":"P","state":"active","owner":"HQ(Builder)","priority":"P1","goal":"Surface task state, owner, and audit history in the runtime board","acceptance":"The board shows owner, state, dependencies, recent events, and next step","humanGate":"none","dependsOn":[],"planDoneCount":3,"planTotal":4,"summary":"Checkpoint: on_track","status":"on_track"}

## Closeout

_pending_
