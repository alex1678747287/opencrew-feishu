# Closeout Template

Use this when the task is finished or cancelled.

```text
TID: <tid>
Closeout:
- Outcome: done | cancelled
- Changed: <what changed>
- Evidence: <file, check, log, or output>
- Risk: <remaining risk or none>
- Next: <follow-up task or none>
```

Notes:

- Every non-trivial task should end with an explicit closeout.
- If more work is needed, open a new `TID` instead of silently extending the old one.
