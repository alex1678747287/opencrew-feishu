const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createTask, updateTask } = require("../app/hq-tasks");
const { buildRuntimeBoard } = require("../app/runtime-board");

function withTempProject(run) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencrew-feishu-guardrails-"));
  try {
    return run(projectRoot);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

test("approve and reject require waiting_approval state", () => withTempProject((projectRoot) => {
  const task = createTask(projectRoot, {
    goal: "Tighten approval semantics",
    owner: "HQ(CoS)",
    plan: ["Wait for explicit approval"]
  });

  assert.throws(
    () => updateTask(projectRoot, {
      tid: task.tid,
      mode: "approve",
      actor: "Human"
    }),
    /approve requires waiting_approval state/
  );

  assert.throws(
    () => updateTask(projectRoot, {
      tid: task.tid,
      mode: "reject",
      actor: "Human"
    }),
    /reject requires waiting_approval state/
  );

  updateTask(projectRoot, {
    tid: task.tid,
    mode: "checkpoint",
    status: "waiting_approval",
    completed: "Plan is ready",
    next: "Wait for approval",
    risk: "Need explicit human approval",
    needFromHuman: "Human approval"
  });

  updateTask(projectRoot, {
    tid: task.tid,
    mode: "approve",
    actor: "Human",
    note: "Approved",
    next: "Continue execution"
  });

  const board = buildRuntimeBoard(projectRoot);
  const runtimeTask = board.tasks.find((item) => item.tid === task.tid);

  assert.ok(runtimeTask);
  assert.equal(runtimeTask.state, "active");
  assert.equal(runtimeTask.lastEvent.mode, "approve");
}));

test("closed tasks reject further workflow mutations but still allow metadata corrections", () => withTempProject((projectRoot) => {
  const task = createTask(projectRoot, {
    goal: "Close and protect workflow state",
    owner: "HQ(CoS)",
    plan: ["Finish the task", "Prevent further workflow writes"]
  });

  updateTask(projectRoot, {
    tid: task.tid,
    mode: "closeout",
    outcome: "done",
    changed: "Completed the target work",
    evidence: "Tests passed",
    risk: "none",
    next: "none"
  });

  for (const action of [
    { mode: "handoff", from: "CoS", to: "CTO", ask: "Should fail", constraints: "none", doneWhen: "none" },
    { mode: "checkpoint", status: "on_track", completed: "Should fail", next: "none", risk: "none", needFromHuman: "none" },
    { mode: "toggle-plan", index: 0, done: true },
    { mode: "ops-review", verdict: "pass", mainConcern: "none", neededMitigation: "none" },
    { mode: "closeout", outcome: "done", changed: "Duplicate closeout", evidence: "none", risk: "none", next: "none" }
  ]) {
    assert.throws(
      () => updateTask(projectRoot, { tid: task.tid, ...action }),
      new RegExp(`cannot ${action.mode} a closed task: done`)
    );
  }

  updateTask(projectRoot, {
    tid: task.tid,
    mode: "edit-metadata",
    goal: "Close and protect workflow state (final title)",
    plan: "- [ ] Finish the task\n- [ ] Prevent further workflow writes"
  });

  const board = buildRuntimeBoard(projectRoot);
  const runtimeTask = board.tasks.find((item) => item.tid === task.tid);

  assert.ok(runtimeTask);
  assert.equal(runtimeTask.goal, "Close and protect workflow state (final title)");
  assert.equal(runtimeTask.state, "done");

  const content = fs.readFileSync(task.path, "utf8");
  assert.match(content, /"mode":"edit-metadata"/);
}));

test("closed tasks reject checklist edits even through edit-metadata", () => withTempProject((projectRoot) => {
  const task = createTask(projectRoot, {
    goal: "Keep closed-task checklist immutable",
    owner: "HQ(CoS)",
    plan: ["Finish the task", "Leave the checklist frozen"]
  });

  updateTask(projectRoot, {
    tid: task.tid,
    mode: "closeout",
    outcome: "done",
    changed: "Completed the work",
    evidence: "Tests passed",
    risk: "none",
    next: "none"
  });

  assert.throws(
    () => updateTask(projectRoot, {
      tid: task.tid,
      mode: "edit-metadata",
      goal: "Keep closed-task checklist immutable",
      plan: "- [x] Finish the task\n- [x] Leave the checklist frozen"
    }),
    /cannot edit plan for a closed task: done/
  );

  const board = buildRuntimeBoard(projectRoot);
  const runtimeTask = board.tasks.find((item) => item.tid === task.tid);

  assert.ok(runtimeTask);
  assert.equal(runtimeTask.planDoneCount, 0);
  assert.equal(runtimeTask.lastEvent.mode, "closeout");
}));
