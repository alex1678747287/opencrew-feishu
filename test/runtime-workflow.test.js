const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createTask, updateTask } = require("../app/hq-tasks");
const { buildRuntimeBoard } = require("../app/runtime-board");

function withTempProject(run) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencrew-feishu-test-"));
  try {
    return run(projectRoot);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

test("createTask writes an event log and keeps TIDs unique for repeated Chinese goals", () => withTempProject((projectRoot) => {
  const first = createTask(projectRoot, {
    goal: "梳理协作链路",
    plan: ["确认范围"]
  });
  const second = createTask(projectRoot, {
    goal: "梳理协作链路",
    plan: ["确认范围"]
  });

  assert.notEqual(first.tid, second.tid);

  const content = fs.readFileSync(first.path, "utf8");
  assert.match(content, /## Event Log/);
  assert.match(content, /"mode":"create"/);
}));

test("runtime workflow appends audit events for create, handoff, checkpoint, approve, and plan toggle", () => withTempProject((projectRoot) => {
  const task = createTask(projectRoot, {
    goal: "完善 runtime 审计",
    owner: "HQ(CoS)",
    plan: ["补事件日志", "补回归测试"]
  });

  updateTask(projectRoot, {
    tid: task.tid,
    mode: "handoff",
    from: "CoS",
    to: "CTO",
    ask: "整理最小执行方案",
    constraints: "保持单机器人对外口径",
    doneWhen: "有一份可执行清单"
  });
  updateTask(projectRoot, {
    tid: task.tid,
    mode: "checkpoint",
    status: "waiting_approval",
    completed: "清单已整理",
    next: "等待批准后继续",
    risk: "需要人工确认",
    needFromHuman: "CoS 批准后继续"
  });
  updateTask(projectRoot, {
    tid: task.tid,
    mode: "approve",
    actor: "Human",
    note: "同意继续",
    next: "Builder 开始执行"
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
  assert.equal(runtimeTask.eventCount, 5);
  assert.equal(runtimeTask.lastEvent.mode, "toggle-plan");
  assert.match(runtimeTask.lastEvent.summary, /切换清单/);
  assert.equal(runtimeTask.state, "active");
  assert.equal(runtimeTask.humanGate, "none");
  assert.equal(runtimeTask.planDoneCount, 1);

  const content = fs.readFileSync(task.path, "utf8");
  assert.match(content, /"mode":"handoff"/);
  assert.match(content, /"mode":"checkpoint"/);
  assert.match(content, /"mode":"approve"/);
  assert.match(content, /"mode":"toggle-plan"/);
}));

test("updateTask backfills an event log section for legacy task files", () => withTempProject((projectRoot) => {
  const tasksDir = path.join(projectRoot, "runtime", "tasks");
  fs.mkdirSync(tasksDir, { recursive: true });

  const taskPath = path.join(tasksDir, "TID-LEGACY.md");
  fs.writeFileSync(taskPath, [
    "# TID-LEGACY",
    "",
    "TID: TID-LEGACY",
    "Type: A",
    "Priority: P2",
    "Owner: HQ(CoS)",
    "Goal: Legacy task",
    "Acceptance: Define a clear done condition",
    "DependsOn: none",
    "HumanGate: none",
    "State: triage",
    "CreatedAt: 2026-03-18T12:00:00+08:00",
    "",
    "## Context",
    "",
    "- ",
    "",
    "## Plan",
    "",
    "- [ ] First step",
    "",
    "## Latest Progress",
    "",
    "_none_",
    "",
    "## Closeout",
    "",
    "_pending_",
    ""
  ].join("\n"), "utf8");

  updateTask(projectRoot, {
    tid: "TID-LEGACY",
    mode: "checkpoint",
    status: "on_track",
    completed: "Legacy path updated",
    next: "Keep going",
    risk: "none",
    needFromHuman: "none"
  });

  const content = fs.readFileSync(taskPath, "utf8");
  assert.match(content, /## Event Log/);
  assert.match(content, /"mode":"checkpoint"/);

  const board = buildRuntimeBoard(projectRoot);
  const runtimeTask = board.tasks.find((item) => item.tid === "TID-LEGACY");
  assert.ok(runtimeTask);
  assert.equal(runtimeTask.eventCount, 1);
  assert.equal(runtimeTask.lastEvent.mode, "checkpoint");
}));

test("runtime board keeps dependency summaries and missing-link visibility", () => withTempProject((projectRoot) => {
  const base = createTask(projectRoot, {
    goal: "搭建基础看板",
    slug: "runtime-base",
    plan: ["收敛需求"]
  });
  const dependency = createTask(projectRoot, {
    goal: "补依赖摘要",
    slug: "dependency-view",
    dependsOn: [base.tid],
    plan: ["展示上游下游"]
  });
  const downstream = createTask(projectRoot, {
    goal: "渲染依赖卡片",
    slug: "dependency-panel",
    dependsOn: [dependency.tid],
    plan: ["展示阻塞链路"]
  });
  const missing = createTask(projectRoot, {
    goal: "验证缺失依赖",
    slug: "missing-dependency",
    plan: ["检查统计摘要"]
  });

  const missingContent = fs.readFileSync(missing.path, "utf8").replace(/^DependsOn: .*$/m, "DependsOn: TID-20990101-missing-link");
  fs.writeFileSync(missing.path, missingContent, "utf8");

  const board = buildRuntimeBoard(projectRoot);
  const downstreamTask = board.tasks.find((item) => item.tid === downstream.tid);
  const missingTask = board.tasks.find((item) => item.tid === missing.tid);

  assert.equal(board.summary.tasksWithDependenciesCount, 3);
  assert.equal(board.summary.tasksBlockingOthersCount, 2);
  assert.equal(board.summary.missingDependencyCount, 1);
  assert.deepEqual(downstreamTask.upstreamChain.map((item) => item.tid), [dependency.tid, base.tid]);
  assert.equal(missingTask.directDependencies[0].missing, true);
  assert.equal(missingTask.eventCount, 1);
}));

test("runtime board reduces current state from event log even if task header is manually stale", () => withTempProject((projectRoot) => {
  const task = createTask(projectRoot, {
    goal: "验证事件归约状态",
    owner: "HQ(CoS)",
    plan: ["先交给 CTO", "再等待批准"]
  });

  updateTask(projectRoot, {
    tid: task.tid,
    mode: "handoff",
    from: "CoS",
    to: "CTO",
    ask: "整理执行计划",
    constraints: "保持单机器人对外口径",
    doneWhen: "进入批准前状态"
  });
  updateTask(projectRoot, {
    tid: task.tid,
    mode: "checkpoint",
    status: "waiting_approval",
    completed: "计划已经给出",
    next: "等待批准",
    risk: "需要人工确认",
    needFromHuman: "CoS 批准后继续"
  });
  updateTask(projectRoot, {
    tid: task.tid,
    mode: "approve",
    actor: "Human",
    note: "允许继续",
    next: "继续执行"
  });

  const staleContent = fs.readFileSync(task.path, "utf8")
    .replace(/^State: .*$/m, "State: triage")
    .replace(/^Owner: .*$/m, "Owner: HQ(CoS)")
    .replace(/^HumanGate: .*$/m, "HumanGate: manual override");
  fs.writeFileSync(task.path, staleContent, "utf8");

  const board = buildRuntimeBoard(projectRoot);
  const runtimeTask = board.tasks.find((item) => item.tid === task.tid);

  assert.ok(runtimeTask);
  assert.equal(runtimeTask.eventStateSource, "event-log");
  assert.equal(runtimeTask.state, "active");
  assert.equal(runtimeTask.owner, "HQ(CTO)");
  assert.equal(runtimeTask.humanGate, "none");
  assert.equal(runtimeTask.lastEvent.mode, "approve");
}));

test("runtime board resets current role to CoS after reject or ops-review needs_fix returns ownership", () => withTempProject((projectRoot) => {
  const rejectTask = createTask(projectRoot, {
    goal: "Return rejected work to CoS",
    owner: "HQ(CoS)",
    plan: ["Handoff to Builder", "Wait for approval"]
  });
  updateTask(projectRoot, {
    tid: rejectTask.tid,
    mode: "handoff",
    from: "CoS",
    to: "Builder",
    ask: "Implement the change",
    constraints: "Keep the workflow traceable",
    doneWhen: "Ready for approval"
  });
  updateTask(projectRoot, {
    tid: rejectTask.tid,
    mode: "checkpoint",
    status: "waiting_approval",
    completed: "Implementation is ready",
    next: "Wait for review",
    risk: "Need human approval",
    needFromHuman: "Human approval"
  });
  updateTask(projectRoot, {
    tid: rejectTask.tid,
    mode: "reject",
    actor: "Human",
    reason: "Need to reduce scope",
    next: "CoS should re-scope the task",
    humanGate: "CoS must confirm the new scope"
  });

  const opsTask = createTask(projectRoot, {
    goal: "Return ops findings to CoS",
    owner: "HQ(CoS)",
    plan: ["Handoff to Builder", "Ask Ops to review"]
  });
  updateTask(projectRoot, {
    tid: opsTask.tid,
    mode: "handoff",
    from: "CoS",
    to: "Builder",
    ask: "Prepare the release candidate",
    constraints: "Keep rollback simple",
    doneWhen: "Ready for ops review"
  });
  updateTask(projectRoot, {
    tid: opsTask.tid,
    mode: "ops-review",
    verdict: "needs_fix",
    mainConcern: "Rollback steps are incomplete",
    neededMitigation: "Return to CoS and tighten the release boundary"
  });

  const board = buildRuntimeBoard(projectRoot);
  const rejected = board.tasks.find((item) => item.tid === rejectTask.tid);
  const opsReturned = board.tasks.find((item) => item.tid === opsTask.tid);

  assert.ok(rejected);
  assert.equal(rejected.owner, "HQ(CoS)");
  assert.equal(rejected.currentRoleId, "cos");
  assert.equal(rejected.currentRoleLabel, "协作指挥官");
  assert.equal(rejected.state, "scope_changed");

  assert.ok(opsReturned);
  assert.equal(opsReturned.owner, "HQ(CoS)");
  assert.equal(opsReturned.currentRoleId, "cos");
  assert.equal(opsReturned.currentRoleLabel, "协作指挥官");
  assert.equal(opsReturned.state, "scope_changed");
}));

test("waiting approval shifts the actionable role to CoS and scope-changed checkpoints return ownership to CoS", () => withTempProject((projectRoot) => {
  const waitingTask = createTask(projectRoot, {
    goal: "Pause execution for approval",
    owner: "HQ(CoS)",
    plan: ["Hand off to Builder", "Wait for approval"]
  });
  updateTask(projectRoot, {
    tid: waitingTask.tid,
    mode: "handoff",
    from: "CoS",
    to: "Builder",
    ask: "Implement the change",
    constraints: "Keep the workflow explicit",
    doneWhen: "Ready for approval"
  });
  updateTask(projectRoot, {
    tid: waitingTask.tid,
    mode: "checkpoint",
    status: "waiting_approval",
    completed: "Implementation is ready",
    next: "Wait for approval",
    risk: "Need explicit human approval",
    needFromHuman: "Human approval"
  });

  const scopeTask = createTask(projectRoot, {
    goal: "Return scope changes to CoS",
    owner: "HQ(CoS)",
    plan: ["Hand off to Builder", "Detect scope change"]
  });
  updateTask(projectRoot, {
    tid: scopeTask.tid,
    mode: "handoff",
    from: "CoS",
    to: "Builder",
    ask: "Implement the current scope",
    constraints: "Keep the diff small",
    doneWhen: "Either finish or report scope drift"
  });
  updateTask(projectRoot, {
    tid: scopeTask.tid,
    mode: "checkpoint",
    status: "scope_changed",
    completed: "The requested change is broader than expected",
    next: "CoS should re-scope and re-assign",
    risk: "Current acceptance no longer matches the work",
    needFromHuman: "none"
  });

  const board = buildRuntimeBoard(projectRoot);
  const waiting = board.tasks.find((item) => item.tid === waitingTask.tid);
  const scopeChanged = board.tasks.find((item) => item.tid === scopeTask.tid);

  assert.ok(waiting);
  assert.equal(waiting.owner, "HQ(Builder)");
  assert.equal(waiting.currentRoleId, "cos");
  assert.equal(waiting.currentRoleLabel, "协作指挥官");
  assert.equal(waiting.state, "waiting_approval");
  assert.match(waiting.commandExample, /Approve \/ Reject:/);
  assert.match(waiting.commandExample, /Use approve or reject/);

  assert.ok(scopeChanged);
  assert.equal(scopeChanged.owner, "HQ(CoS)");
  assert.equal(scopeChanged.currentRoleId, "cos");
  assert.equal(scopeChanged.currentRoleLabel, "协作指挥官");
  assert.equal(scopeChanged.state, "scope_changed");
  assert.match(scopeChanged.commandExample, /Rescope:/);
}));
