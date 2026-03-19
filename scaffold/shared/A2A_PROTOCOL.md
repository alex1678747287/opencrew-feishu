# A2A Protocol

Use this when work moves from one internal role to another.

## Rules

- Keep one active owner at a time.
- Handoff only when the next role can act on a concrete ask.
- Pass the minimum summary needed to continue, not the full transcript.
- Every handoff must include `TID`, `Ask`, `Constraints`, and `Done When`.

## Template

```text
Handoff:
- From: <current role>
- To: <next role>
- TID: <tid>
- Ask: <what the receiver should do now>
- Constraints: <scope, dependency, risk, or style guardrail>
- Done When: <observable exit condition>
```

## Good Handoff

- names one owner
- contains one clear next action
- states the boundary
- tells the receiver when to return control
