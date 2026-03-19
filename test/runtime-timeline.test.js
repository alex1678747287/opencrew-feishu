const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createTask, updateTask } = require("../app/hq-tasks");
const { buildRuntimeBoard } = require("../app/runtime-board");

function withTempProject(run) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencrew-feishu-timeline-"));
  try {
    return run(projectRoot);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

test("runtime timeline folds create, metadata, approval, and checklist audit events into the visible sequence", () => withTempProject((projectRoot) => {
  const task = createTask(projectRoot, {
    goal: "Tighten the runtime timeline",
    owner: "HQ(CoS)",
    plan: ["Define the change", "Verify the board sequence"]
  });

  updateTask(projectRoot, {
    tid: task.tid,
    mode: "edit-metadata",
    priority: "P0",
    humanGate: "Human approval before Builder continues"
  });
  updateTask(projectRoot, {
    tid: task.tid,
    mode: "handoff",
    from: "CoS",
    to: "Builder",
    ask: "Implement the timeline merge",
    constraints: "Keep the task parser backward compatible",
    doneWhen: "The board shows audit-only actions in order"
  });
  updateTask(projectRoot, {
    tid: task.tid,
    mode: "checkpoint",
    status: "waiting_approval",
    completed: "Merged the core logic",
    next: "Wait for approval before the final polish",
    risk: "Need human confirmation before continuing",
    needFromHuman: "Human approval before Builder continues"
  });
  updateTask(projectRoot, {
    tid: task.tid,
    mode: "approve",
    actor: "Human",
    note: "Continue",
    next: "Finish the final timeline polish"
  });
  updateTask(projectRoot, {
    tid: task.tid,
    mode: "toggle-plan",
    index: 0,
    done: true
  });

  const board = buildRuntimeBoard(projectRoot);
  const runtimeTask = board.tasks.find((item) => item.tid === task.tid);

  assert.ok(runtimeTask);
  assert.deepEqual(
    runtimeTask.timeline.map((item) => item.type),
    ["create", "edit-metadata", "handoff", "checkpoint", "approve", "toggle-plan"]
  );
  assert.equal(runtimeTask.timeline.at(-1).type, "toggle-plan");
  assert.equal(runtimeTask.timeline.find((item) => item.type === "approve")?.title, "批准恢复执行");
  assert.match(runtimeTask.timeline.find((item) => item.type === "approve")?.meta || "", /下一步: Finish the final timeline polish/);
}));
