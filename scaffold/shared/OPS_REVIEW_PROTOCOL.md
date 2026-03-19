# Ops Review Protocol

Bring in `Ops` only when release, runtime, rollback, or execution-safety risk is real.

## When To Use

- deployment or runtime stability is uncertain
- rollback conditions are unclear
- safety or continuity concerns block execution
- a human needs a sharper risk summary before approval

## Template

```text
Ops Review:
- Verdict: pass | needs_fix
- Main Concern: <primary risk or none>
- Needed Mitigation: <required fix or none>
```

## Rules

- `pass` means the task may continue on the current path.
- `needs_fix` means ownership should return to CoS for re-scope or remediation.
- Keep the review concrete and short.
