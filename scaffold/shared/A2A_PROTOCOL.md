# A2A Protocol

This scaffold supports two A2A modes.

## Mode 1: Logical Handoff

Used now, before dedicated agents exist.

- The handoff stays internal.
- Only the summary moves forward.
- The visible reply remains one voice.

Use this shape internally:

```text
Handoff:
- From: CoS
- To: CTO
- TID: <tid>
- Ask: <exact next decision or action>
- Constraints: <key limits>
- Done when: <clear stop condition>
```

## Mode 2: Split-Agent Handoff

Used later, after dedicated agents are created.

- Each role gets its own Feishu group or routed surface.
- The handoff anchor must include the `TID`.
- Do not bounce the same task back and forth without new information.

## Ping-Pong Guard

- One downstream handoff is normal.
- Two downstream handoffs require a clearer summary.
- Beyond that, stop and rewrite the task definition.

