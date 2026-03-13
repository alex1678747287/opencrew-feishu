# HQ Playbook

This is the operational playbook for the current single visible HQ bot.

## Goal

Run the OpenCrew pattern in Feishu without requiring dedicated role agents yet.

## Default Shape

- one visible HQ bot
- internal logical roles only
- `TID` for non-trivial tasks
- compact checkpoints
- one closeout per finished task

## Internal Role Order

Use the smallest sufficient sequence:

1. `CoS`
   Clarify the ask, name the outcome, set acceptance.
2. `CTO`
   Scope the work and define the next owner.
3. `Builder`
   Execute, validate, and record evidence.
4. `Ops`
   Only when the change is risky enough to justify review.
5. `KO`
   Only when something durable is worth saving.

## When To Create A Task File

Create a task file for:

- any `A`, `P`, or `S` item
- anything that will survive more than one visible reply
- anything likely to need a checkpoint

You usually do not need a task file for a pure `Q`.

## Local Commands

Create a task file:

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\new-hq-task.ps1' -Type A -Goal 'Summarize the latest deployment issue' -Acceptance 'One clear summary and next step'
```

Emit a checkpoint block:

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\emit-hq-block.ps1' -Mode checkpoint -Tid 'TID-20260313-1600-demo' -Status on_track -Completed 'Read logs and isolated the failing step' -Next 'Patch the config and re-run the health check'
```

Emit a closeout block:

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\emit-hq-block.ps1' -Mode closeout -Tid 'TID-20260313-1600-demo' -Outcome done -Changed 'Added the Feishu HQ scaffold' -Evidence 'Script syntax checked and generator dry-run passed'
```

## Human-Facing Discipline

- never stage fake internal chatter in front of users
- prefer a short task block to a long explanation
- show checkpoints only when they add coordination value
- always finish non-trivial work with a closeout

