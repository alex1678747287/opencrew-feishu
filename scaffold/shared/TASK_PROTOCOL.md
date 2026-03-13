# Task Protocol

## TID Format

Use:

```text
TID-YYYYMMDD-HHMM-shortslug
```

Example:

```text
TID-20260313-1530-feishu-opencrew
```

## Required Fields

```text
TID:
Type:
Owner:
Goal:
Acceptance:
State:
```

## State Values

- `triage`
- `active`
- `blocked`
- `waiting_approval`
- `done`
- `cancelled`

## Minimal Task Record

```text
TID: TID-YYYYMMDD-HHMM-shortslug
Type: A
Owner: Builder
Goal: Apply the agreed minimal Feishu adaptation
Acceptance: Files created and script validates
State: active
```

## Storage Guidance

If you need a durable local record, create one file per task under a dedicated task folder and keep only:

- the latest summary
- the current blocker
- the final closeout

