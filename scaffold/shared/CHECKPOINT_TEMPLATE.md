# Checkpoint Template

Use this for progress updates during execution.

```text
TID: <tid>
Progress:
- Status: on_track | blocked | waiting_approval | scope_changed
- Completed: <what is already done>
- Next: <immediate next action>
- Risk: <main risk or none>
- Need From Human: <approval, decision, or none>
```

Notes:

- Use `waiting_approval` only when execution has actually paused.
- If execution pauses for approval, set `HumanGate` in the header and later close it with explicit `approve` or `reject`.
