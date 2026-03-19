# HQ Playbook

This playbook is for the current single-visible-bot mode.

## Default Shape

- one visible HQ bot in Feishu
- internal roles still follow the OpenCrew operating model
- non-trivial work uses `TID` task files
- progress is written back into `runtime/tasks/`
- every finished task gets an explicit closeout

## Role Order

Use the smallest capable role first:

1. `CoS` for triage, scope, approval, and closeout
2. `CTO` for plan, technical boundary, and dependencies
3. `Builder` for execution and evidence
4. `Ops` only when runtime or release risk is material
5. `KO` only when the result is worth turning into reusable knowledge

## When To Create A Task File

Create a task file when any of these are true:

- the work is `A`, `P`, or `S`
- the work will span multiple visible replies
- you need durable progress, approvals, or closeout

Pure `Q` work can usually stay as a direct answer.

## Local Commands

Task files use ASCII block names for PowerShell compatibility:

- `Handoff`
- `Progress`
- `Ops Review`
- `Closeout`

Create a task:

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\new-hq-task.ps1' -Type A -Goal 'Summarize the latest deployment issue' -Acceptance 'One clear summary and next step'
```

Write a handoff:

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\update-hq-task.ps1' -Tid 'TID-20260318-1400-demo' -Mode handoff -From 'CoS' -To 'CTO' -Ask 'Scope the request and write the minimum executable checklist' -Constraints 'Keep one visible external bot and short replies' -DoneWhen 'A short plan, clear acceptance, and the next owner'
```

Write a checkpoint:

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\update-hq-task.ps1' -Tid 'TID-20260318-1400-demo' -Mode checkpoint -Status on_track -Completed 'Read logs and isolated the failing step' -Next 'Patch the config and re-run the health check'
```

Write a closeout:

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\update-hq-task.ps1' -Tid 'TID-20260318-1400-demo' -Mode closeout -Outcome done -Changed 'Added the Feishu HQ scaffold' -Evidence 'Script syntax checked and generator dry-run passed'
```

## External Discipline

- Do not stage fake internal chat in front of the user.
- Use short structured task blocks instead of long raw transcripts.
- Keep one current owner at a time.
- Close every non-trivial task with an explicit closeout.
- Let the local UI read `runtime/tasks/` and surface the current role, state, blockers, and next step.
