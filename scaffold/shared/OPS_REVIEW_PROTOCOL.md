# Ops Review Protocol

Run this review when the task is risky enough to justify an `Ops` pass.

## Review Points

1. Scope
   Is the change bounded and explained?
2. Rollback
   Can the change be reverted safely?
3. Data and Secrets
   Does the work expose, move, or depend on sensitive data?
4. User Impact
   Could the change affect live users or shared channels?
5. Operability
   Is there enough evidence to know whether it worked?

## Output Shape

```text
Ops Review:
- Verdict: pass | pass_with_caution | hold
- Main concern: <one line>
- Needed mitigation: <one line or none>
```

