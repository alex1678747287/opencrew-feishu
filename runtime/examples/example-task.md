# Example HQ Task

TID: TID-20260313-1600-feishu-opencrew
Type: A
Owner: HQ(CoS/Builder)
Goal: Prepare the minimal Feishu adaptation scaffold
Acceptance: Files exist, helper scripts validate, and live routing remains untouched
State: done
CreatedAt: 2026-03-13T16:00:00+08:00

## Context

- starting from a single-agent local OpenClaw setup
- Feishu channel already configured
- no dedicated role group IDs yet

## Plan

- add shared protocol files
- add role workspace templates
- add a future binding generator
- patch the main workspace to read the HQ protocol in shared Feishu contexts

## Latest Checkpoint

TID: TID-20260313-1600-feishu-opencrew
Checkpoint:
- Status: on_track
- Completed: Shared protocol files and role templates created
- Next: Add helper scripts and run a dry-run verification
- Risk: PowerShell execution policy may block direct script invocation
- Need from human: none

## Closeout

TID: TID-20260313-1600-feishu-opencrew
Closeout:
- Outcome: done
- What changed: Scaffold created, generator added, HQ protocol linked from the main workspace
- Evidence: Script syntax parse passed and generator dry-run produced an apply script
- Risk: Real split-agent binding still needs actual Feishu role group IDs
- Next: Bind `CoS`, `CTO`, and `Builder` once those IDs are known

