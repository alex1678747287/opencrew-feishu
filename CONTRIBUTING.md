# Contributing

Thanks for contributing to `opencrew-feishu`.

## Scope

Useful contributions include:

- workflow engine fixes and guardrails
- runtime board UX and state visibility improvements
- OpenClaw scaffold generation fixes
- documentation, examples, and task-flow clarifications
- regression tests for task state, event logs, and bindings

## Before You Open A PR

1. Keep changes focused.
2. Avoid mixing runtime logic, generated output, and unrelated UI cleanup in one PR.
3. Do not commit local generated artifacts or runtime state.
4. Add or update tests when behavior changes.

## Local Checks

Run these before opening a PR:

```powershell
npm test
```

Start the local UI when your change affects runtime or UI behavior:

```powershell
npm start
```

Then verify:

- the local UI loads at `http://127.0.0.1:3210`
- task creation and runtime actions still work
- no local-only files from `generated/`, `runtime/tasks/`, `roles/`, or `scaffold/*/.openclaw/` are included in the PR

## Coding Notes

- Keep prompt and scaffold docs ASCII-safe where possible.
- Prefer using the shared task engine for workflow mutations instead of duplicating logic.
- Preserve task auditability through append-only event log behavior.
- Treat approval, reject, and closed-task guardrails as compatibility-sensitive behavior.

## Pull Request Notes

Please include:

- what changed
- why it changed
- how you validated it
- any workflow, runtime, or backward-compatibility risk
