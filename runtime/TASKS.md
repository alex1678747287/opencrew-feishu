# HQ Task Files

Task files live under `runtime/tasks/`.

## Purpose

They replace the missing Slack-style thread isolation with a durable local record keyed by `TID`.

## File Shape

Each task file should keep:

- the current task block
- the current plan
- the latest checkpoint
- the final closeout

Keep the file compact. Avoid pasting full chat history.

## Naming

Use:

```text
TID-YYYYMMDD-HHMM-shortslug.md
```

## Recommended Workflow

1. create a task file with `new-hq-task.ps1`
2. update the visible reply using a task block
3. add a checkpoint only when needed
4. finish with a closeout

## Notes

- `Q` items can often skip task files
- `S` items should stop at approval boundaries even if a task file exists
- a closeout should tell the next operator what matters without reopening the whole conversation

