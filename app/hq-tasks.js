const fs = require("fs");
const path = require("path");

const {
  EVENT_LOG_HEADINGS,
  parseTaskEventLogSection,
  reduceTaskEventSnapshot,
  serializeTaskEvent
} = require("./task-event-log");

const TASK_TYPES = new Set(["Q", "A", "P", "S"]);
const TASK_STATES = new Set([
  "triage",
  "active",
  "blocked",
  "waiting_approval",
  "scope_changed",
  "done",
  "cancelled"
]);
const ACTION_MODES = new Set([
  "handoff",
  "checkpoint",
  "ops-review",
  "closeout",
  "edit-metadata",
  "toggle-plan",
  "approve",
  "reject"
]);
const CHECKPOINT_STATUSES = new Set(["on_track", "blocked", "waiting_approval", "scope_changed"]);
const CLOSEOUT_OUTCOMES = new Set(["done", "cancelled"]);
const OPS_REVIEW_VERDICTS = new Set(["pass", "needs_fix"]);
const PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);
const PLAN_HEADINGS = ["## Plan", "## 计划"];
const PROGRESS_HEADINGS = ["## Latest Progress", "## 最新进度"];
const CLOSEOUT_HEADINGS = ["## Closeout", "## 结项"];

function ensureTasksDir(projectRoot) {
  const tasksDir = path.join(projectRoot, "runtime", "tasks");
  fs.mkdirSync(tasksDir, { recursive: true });
  return tasksDir;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function normalizeNewlines(value) {
  return String(value || "").replace(/\r\n/g, "\n");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeInline(value, fallback = "") {
  const normalized = String(value ?? fallback)
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || String(fallback || "").trim();
}

function meaningfulText(value) {
  const normalized = normalizeInline(value, "");
  return normalized && normalized.toLowerCase() !== "none" ? normalized : "";
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => normalizeInline(item)).filter(Boolean)));
  }

  return Array.from(
    new Set(
      String(value || "")
        .split(/\r?\n|[,;，；]/)
        .map((item) => normalizeInline(item))
        .filter(Boolean)
        .filter((item) => item.toLowerCase() !== "none")
    )
  );
}

function normalizePlanLines(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);

  const normalized = [];
  for (const rawLine of source) {
    const line = String(rawLine || "").trim();
    if (!line) {
      continue;
    }

    const checkboxMatch = /^[-*]\s*\[(x| )\]\s*(.+)$/i.exec(line);
    if (checkboxMatch) {
      const marker = checkboxMatch[1].toLowerCase() === "x" ? "x" : " ";
      normalized.push(`- [${marker}] ${normalizeInline(checkboxMatch[2])}`);
      continue;
    }

    const bulletMatch = /^[-*]\s+(.+)$/.exec(line);
    if (bulletMatch) {
      normalized.push(`- [ ] ${normalizeInline(bulletMatch[1])}`);
      continue;
    }

    normalized.push(`- [ ] ${normalizeInline(line)}`);
  }

  return normalized;
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "done", "x"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "todo", " "].includes(normalized)) {
    return false;
  }

  return fallback;
}

function validateInSet(label, value, allowedSet, fallback) {
  const normalized = normalizeInline(value, fallback);
  if (!allowedSet.has(normalized)) {
    throw new Error(`${label} is invalid: ${normalized}`);
  }
  return normalized;
}

function normalizePriority(value) {
  const normalized = normalizeInline(value || "P2", "P2").toUpperCase();
  if (!PRIORITIES.has(normalized)) {
    throw new Error(`priority is invalid: ${normalized}`);
  }
  return normalized;
}

function serializeList(values, fallback = "none") {
  return values.length > 0 ? values.join(", ") : fallback;
}

function serializePlanItems(items) {
  return items
    .map((item) => ({ text: normalizeInline(item?.text), done: Boolean(item?.done) }))
    .filter((item) => item.text)
    .map((item) => `- [${item.done ? "x" : " "}] ${item.text}`);
}

function newSlug(text) {
  const value = normalizeInline(text, "task")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!value) {
    return "task";
  }

  return value.length > 32 ? value.slice(0, 32).replace(/-+$/g, "") : value;
}

function nowIso() {
  const value = new Date();
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, "0");
  const minutes = String(absMinutes % 60).padStart(2, "0");

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}T${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}:${String(value.getSeconds()).padStart(2, "0")}${sign}${hours}:${minutes}`;
}

function nowTidStamp() {
  const value = new Date();
  return `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, "0")}${String(value.getDate()).padStart(2, "0")}-${String(value.getHours()).padStart(2, "0")}${String(value.getMinutes()).padStart(2, "0")}`;
}

function resolveUniqueTid(projectRoot, baseTid) {
  const tasksDir = ensureTasksDir(projectRoot);
  let tid = baseTid;
  let suffix = 2;

  while (fs.existsSync(path.join(tasksDir, `${tid}.md`))) {
    tid = `${baseTid}-${suffix}`;
    suffix += 1;
  }

  return tid;
}

function buildTaskContent(task, eventLog = []) {
  const planLines = task.planLines.length > 0
    ? task.planLines
    : ["- [ ] Define the first executable step"];
  const eventLines = eventLog.length > 0
    ? eventLog.map((event) => serializeTaskEvent(event))
    : ["_none_"];

  return [
    `# ${task.tid}`,
    "",
    `TID: ${task.tid}`,
    `Type: ${task.type}`,
    `Priority: ${task.priority}`,
    `Owner: ${task.owner}`,
    `Goal: ${task.goal}`,
    `Acceptance: ${task.acceptance}`,
    `DependsOn: ${serializeList(task.dependsOn)}`,
    `HumanGate: ${task.humanGate}`,
    `State: ${task.state}`,
    `CreatedAt: ${task.createdAt}`,
    "",
    "## Context",
    "",
    "- ",
    "",
    "## Plan",
    "",
    ...planLines,
    "",
    "## Latest Progress",
    "",
    "_none_",
    "",
    "## Event Log",
    "",
    ...eventLines,
    "",
    "## Closeout",
    "",
    "_pending_",
    ""
  ].join("\n");
}

function emitBlock(mode, payload) {
  if (mode === "checkpoint") {
    const status = validateInSet("checkpoint status", payload.status, CHECKPOINT_STATUSES, "on_track");
    return [
      `TID: ${payload.tid}`,
      "Progress:",
      `- Status: ${status}`,
      `- Completed: ${normalizeInline(payload.completed, "none")}`,
      `- Next: ${normalizeInline(payload.next, "none")}`,
      `- Risk: ${normalizeInline(payload.risk, "none")}`,
      `- Need From Human: ${normalizeInline(payload.needFromHuman, "none")}`
    ].join("\n");
  }

  if (mode === "handoff") {
    return [
      "Handoff:",
      `- From: ${normalizeInline(payload.from, "CoS")}`,
      `- To: ${normalizeInline(payload.to, "CTO")}`,
      `- TID: ${payload.tid}`,
      `- Ask: ${normalizeInline(payload.ask, "none")}`,
      `- Constraints: ${normalizeInline(payload.constraints, "none")}`,
      `- Done When: ${normalizeInline(payload.doneWhen, "none")}`
    ].join("\n");
  }

  if (mode === "ops-review") {
    const verdict = validateInSet("ops verdict", payload.verdict, OPS_REVIEW_VERDICTS, "pass");
    return [
      "Ops Review:",
      `- Verdict: ${verdict}`,
      `- Main Concern: ${normalizeInline(payload.mainConcern, "none")}`,
      `- Needed Mitigation: ${normalizeInline(payload.neededMitigation, "none")}`
    ].join("\n");
  }

  const outcome = validateInSet("closeout outcome", payload.outcome, CLOSEOUT_OUTCOMES, "done");
  return [
    `TID: ${payload.tid}`,
    "Closeout:",
    `- Outcome: ${outcome}`,
    `- Changed: ${normalizeInline(payload.changed, "none")}`,
    `- Evidence: ${normalizeInline(payload.evidence, "none")}`,
    `- Risk: ${normalizeInline(payload.risk, "none")}`,
    `- Next: ${normalizeInline(payload.next, "none")}`
  ].join("\n");
}

function extractField(text, label) {
  const pattern = new RegExp(`^${escapeRegExp(label)}:\\s*(.+)$`, "m");
  return pattern.exec(text)?.[1]?.trim() || "";
}

function getSectionBounds(content, headings) {
  const normalized = normalizeNewlines(content);
  const candidates = Array.isArray(headings) ? headings : [headings];
  const heading = candidates.find((item) => normalized.includes(item));

  if (!heading) {
    return null;
  }

  const headingIndex = normalized.indexOf(heading);
  const bodyStart = headingIndex + heading.length;
  const bodyEnd = normalized.indexOf("\n## ", bodyStart);

  return {
    normalized,
    heading,
    headingIndex,
    bodyStart,
    bodyEnd: bodyEnd === -1 ? normalized.length : bodyEnd
  };
}

function replaceMetadata(content, label, value) {
  const normalized = normalizeNewlines(content);
  const pattern = new RegExp(`^${escapeRegExp(label)}:\\s*.*$`, "m");

  if (pattern.test(normalized)) {
    return normalized.replace(pattern, `${label}: ${value}`);
  }

  const headingIndex = normalized.search(/\n##\s+/);
  if (headingIndex === -1) {
    return `${normalized.trimEnd()}\n${label}: ${value}\n`;
  }

  return `${normalized.slice(0, headingIndex)}${label}: ${value}\n${normalized.slice(headingIndex + 1)}`;
}

function setUpdatedAt(content) {
  const updatedAt = nowIso();
  if (/^UpdatedAt:\s*.*$/m.test(content)) {
    return content.replace(/^UpdatedAt:\s*.*$/m, `UpdatedAt: ${updatedAt}`);
  }

  if (/^CreatedAt:\s*.*$/m.test(content)) {
    return content.replace(/^CreatedAt:\s*.*$/m, (line) => `${line}\nUpdatedAt: ${updatedAt}`);
  }

  return `${content.trimEnd()}\nUpdatedAt: ${updatedAt}\n`;
}

function replaceSectionBody(content, headings, body) {
  const bounds = getSectionBounds(content, headings);
  if (!bounds) {
    throw new Error(`section not found: ${Array.isArray(headings) ? headings[0] : headings}`);
  }

  const bodyText = Array.isArray(body) ? body.join("\n") : String(body || "").trim();
  const nextBody = bodyText || "_none_";

  return `${bounds.normalized.slice(0, bounds.bodyStart)}\n\n${nextBody}\n${bounds.normalized.slice(bounds.bodyEnd)}`;
}

function insertSectionBefore(content, beforeHeadings, heading, body = "_none_") {
  const normalized = normalizeNewlines(content).trimEnd();
  const bodyText = Array.isArray(body) ? body.join("\n") : String(body || "").trim() || "_none_";
  const bounds = getSectionBounds(normalized, beforeHeadings);

  if (!bounds) {
    return `${normalized}\n\n${heading}\n\n${bodyText}\n`;
  }

  const prefix = normalized.slice(0, bounds.headingIndex).trimEnd();
  const suffix = normalized.slice(bounds.headingIndex).trimStart();
  return `${prefix}\n\n${heading}\n\n${bodyText}\n\n${suffix}\n`;
}

function appendToSection(content, headings, block) {
  const bounds = getSectionBounds(content, headings);
  if (!bounds) {
    throw new Error(`section not found: ${Array.isArray(headings) ? headings[0] : headings}`);
  }

  const currentBody = bounds.normalized.slice(bounds.bodyStart, bounds.bodyEnd).trim();
  const nextBody = !currentBody || currentBody.startsWith("_")
    ? block
    : `${currentBody}\n\n${block}`;

  return replaceSectionBody(bounds.normalized, headings, nextBody);
}

function ensureEventLogSection(content) {
  if (getSectionBounds(content, EVENT_LOG_HEADINGS)) {
    return normalizeNewlines(content);
  }

  return insertSectionBefore(content, CLOSEOUT_HEADINGS, EVENT_LOG_HEADINGS[0], "_none_");
}

function appendTaskEvent(content, event) {
  const withSection = ensureEventLogSection(content);
  const line = serializeTaskEvent(event);
  const bounds = getSectionBounds(withSection, EVENT_LOG_HEADINGS);
  const currentBody = withSection.slice(bounds.bodyStart, bounds.bodyEnd).trim();
  const nextBody = !currentBody || currentBody.startsWith("_")
    ? line
    : `${currentBody}\n${line}`;

  return replaceSectionBody(withSection, EVENT_LOG_HEADINGS, nextBody);
}

function parsePlanItems(sectionBody) {
  const lines = normalizeNewlines(sectionBody)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("_"));

  const items = [];
  for (const line of lines) {
    const checkboxMatch = /^[-*]\s*\[(x| )\]\s*(.+)$/i.exec(line);
    if (checkboxMatch) {
      items.push({
        text: normalizeInline(checkboxMatch[2]),
        done: checkboxMatch[1].toLowerCase() === "x"
      });
      continue;
    }

    const bulletMatch = /^[-*]\s+(.+)$/.exec(line);
    if (bulletMatch) {
      items.push({
        text: normalizeInline(bulletMatch[1]),
        done: false
      });
    }
  }

  return items.filter((item) => item.text);
}

function parseTaskDocument(content, taskPath, options = {}) {
  const normalized = normalizeNewlines(content);
  const headerEnd = content.search(/\n##\s+/);
  const header = headerEnd === -1 ? normalized : normalized.slice(0, headerEnd);
  const planBounds = getSectionBounds(normalized, PLAN_HEADINGS);
  const planItems = parsePlanItems(planBounds ? normalized.slice(planBounds.bodyStart, planBounds.bodyEnd) : "");
  const eventLogBounds = getSectionBounds(normalized, EVENT_LOG_HEADINGS);
  const eventLog = parseTaskEventLogSection(eventLogBounds ? normalized.slice(eventLogBounds.bodyStart, eventLogBounds.bodyEnd) : "");
  const headerSnapshot = {
    type: extractField(header, "Type") || "A",
    priority: extractField(header, "Priority") || "P2",
    owner: normalizeInline(extractField(header, "Owner"), "HQ(CoS)"),
    goal: normalizeInline(extractField(header, "Goal"), path.basename(taskPath, ".md")),
    acceptance: normalizeInline(extractField(header, "Acceptance"), "Define a clear done condition"),
    dependsOn: normalizeList(extractField(header, "DependsOn")),
    humanGate: normalizeInline(extractField(header, "HumanGate"), "none") || "none",
    state: normalizeInline(extractField(header, "State"), "triage") || "triage"
  };
  const reducedSnapshot = reduceTaskEventSnapshot(headerSnapshot, eventLog, options);

  return {
    content: normalized,
    header,
    taskPath,
    tid: extractField(header, "TID") || path.basename(taskPath, ".md"),
    type: validateInSet("task type", headerSnapshot.type || "A", TASK_TYPES, "A"),
    priority: normalizePriority(headerSnapshot.priority || "P2"),
    owner: normalizeInline(reducedSnapshot.owner, "HQ(CoS)"),
    goal: normalizeInline(headerSnapshot.goal, path.basename(taskPath, ".md")),
    acceptance: normalizeInline(headerSnapshot.acceptance, "Define a clear done condition"),
    dependsOn: normalizeList(headerSnapshot.dependsOn),
    humanGate: normalizeInline(reducedSnapshot.humanGate, "none") || "none",
    state: normalizeInline(reducedSnapshot.state, "triage") || "triage",
    createdAt: normalizeInline(extractField(header, "CreatedAt")),
    updatedAt: normalizeInline(extractField(header, "UpdatedAt")),
    planItems,
    planLines: serializePlanItems(planItems),
    planNextItem: planItems.find((item) => !item.done)?.text || "",
    eventLog,
    eventCount: eventLog.length,
    lastEvent: reducedSnapshot.lastEvent || eventLog.at(-1) || null,
    eventStateSource: reducedSnapshot.source
  };
}

function readTaskDocument(taskPath) {
  return parseTaskDocument(fs.readFileSync(taskPath, "utf8"), taskPath);
}

function getTaskFiles(projectRoot) {
  const tasksDir = ensureTasksDir(projectRoot);
  return fs.readdirSync(tasksDir)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .map((name) => path.join(tasksDir, name));
}

function buildDependencyGraph(projectRoot, overrideTask) {
  const graph = new Map();

  for (const filePath of getTaskFiles(projectRoot)) {
    const task = readTaskDocument(filePath);
    graph.set(task.tid, task.dependsOn);
  }

  if (overrideTask?.tid) {
    graph.set(overrideTask.tid, normalizeList(overrideTask.dependsOn));
  }

  return graph;
}

function validateDependencies(projectRoot, tid, dependsOn) {
  const normalized = normalizeList(dependsOn);

  if (normalized.includes(tid)) {
    throw new Error(`task cannot depend on itself: ${tid}`);
  }

  const graph = buildDependencyGraph(projectRoot, { tid, dependsOn: normalized });
  const missing = normalized.filter((dependencyTid) => !graph.has(dependencyTid));

  if (missing.length > 0) {
    throw new Error(`dependencies must exist before linking: ${missing.join(", ")}`);
  }

  const marks = new Map();
  const stack = [];

  function visit(node) {
    const mark = marks.get(node) || 0;
    if (mark === 1) {
      const cycleStart = stack.indexOf(node);
      const cycle = cycleStart === -1
        ? [...stack, node]
        : [...stack.slice(cycleStart), node];
      throw new Error(`dependency cycle detected: ${cycle.join(" -> ")}`);
    }
    if (mark === 2 || !graph.has(node)) {
      return;
    }

    marks.set(node, 1);
    stack.push(node);
    for (const dependencyTid of graph.get(node) || []) {
      if (!graph.has(dependencyTid)) {
        continue;
      }
      visit(dependencyTid);
    }
    stack.pop();
    marks.set(node, 2);
  }

  visit(tid);
  return normalized;
}

function applyHeaderUpdates(content, updates) {
  let nextContent = content;
  nextContent = replaceMetadata(nextContent, "Type", updates.type);
  nextContent = replaceMetadata(nextContent, "Priority", updates.priority);
  nextContent = replaceMetadata(nextContent, "Owner", updates.owner);
  nextContent = replaceMetadata(nextContent, "Goal", updates.goal);
  nextContent = replaceMetadata(nextContent, "Acceptance", updates.acceptance);
  nextContent = replaceMetadata(nextContent, "DependsOn", serializeList(updates.dependsOn));
  nextContent = replaceMetadata(nextContent, "HumanGate", updates.humanGate);
  return nextContent;
}

function formatDecisionLine(prefix, actor, detail) {
  const actorLabel = normalizeInline(actor, "Human");
  const detailText = meaningfulText(detail);
  return detailText ? `${prefix} by ${actorLabel}: ${detailText}` : `${prefix} by ${actorLabel}`;
}

function buildApprovalCheckpoint(task, payload) {
  return emitBlock("checkpoint", {
    tid: task.tid,
    status: "on_track",
    completed: formatDecisionLine("Approved", payload.actor, payload.note),
    next: normalizeInline(payload.next, task.planNextItem || "Continue execution"),
    risk: "none",
    needFromHuman: "none"
  });
}

function buildRejectionCheckpoint(task, payload) {
  const fallbackGate = task.humanGate !== "none" ? task.humanGate : "re-approval required";
  const nextGate = normalizeInline(payload.humanGate, fallbackGate) || fallbackGate;
  const reason = meaningfulText(payload.reason) || "Approval was rejected";

  return {
    humanGate: nextGate,
    block: emitBlock("checkpoint", {
      tid: task.tid,
      status: "scope_changed",
      completed: formatDecisionLine("Rejected", payload.actor, payload.reason),
      next: normalizeInline(payload.next, "CoS re-scope and resubmit"),
      risk: reason,
      needFromHuman: nextGate
    })
  };
}

function taskPlanProgress(task) {
  const planItems = Array.isArray(task?.planItems) ? task.planItems : [];
  return {
    done: planItems.filter((item) => item.done).length,
    total: planItems.length
  };
}

function collectChangedFields(previousTask, nextTask) {
  if (!previousTask) {
    return [];
  }

  const comparisons = [
    ["type", previousTask.type, nextTask.type],
    ["priority", previousTask.priority, nextTask.priority],
    ["owner", previousTask.owner, nextTask.owner],
    ["goal", previousTask.goal, nextTask.goal],
    ["acceptance", previousTask.acceptance, nextTask.acceptance],
    ["dependsOn", previousTask.dependsOn, nextTask.dependsOn],
    ["humanGate", previousTask.humanGate, nextTask.humanGate],
    ["plan", previousTask.planLines, nextTask.planLines],
    ["state", previousTask.state, nextTask.state]
  ];

  return comparisons
    .filter(([, before, after]) => JSON.stringify(before) !== JSON.stringify(after))
    .map(([field]) => field);
}

function summarizeTaskEvent(mode, previousTask, nextTask, input, changedFields) {
  if (mode === "create") {
    return `创建任务，负责人 ${nextTask.owner}，优先级 ${nextTask.priority}`;
  }
  if (mode === "edit-metadata") {
    return changedFields.length > 0
      ? `更新任务头：${changedFields.join(", ")}`
      : "更新任务头，字段未发生变化";
  }
  if (mode === "toggle-plan") {
    const index = Number.parseInt(String(input.index ?? ""), 10);
    const item = nextTask.planItems[index] || null;
    return item
      ? `切换清单第 ${index + 1} 项为 ${item.done ? "done" : "todo"}`
      : `切换清单项 ${String(input.index ?? "")}`;
  }
  if (mode === "handoff") {
    return `交接：${normalizeInline(input.from, "CoS")} -> ${normalizeInline(input.to, "CTO")}`;
  }
  if (mode === "checkpoint") {
    return `进度回写：${validateInSet("checkpoint status", input.status, CHECKPOINT_STATUSES, "on_track")}`;
  }
  if (mode === "approve") {
    return `批准：${normalizeInline(input.actor, "Human")}`;
  }
  if (mode === "reject") {
    return `驳回：${normalizeInline(input.actor, "Human")}`;
  }
  if (mode === "ops-review") {
    return `运维审查：${validateInSet("ops verdict", input.verdict, OPS_REVIEW_VERDICTS, "pass")}`;
  }
  if (mode === "closeout") {
    return `任务结项：${validateInSet("closeout outcome", input.outcome, CLOSEOUT_OUTCOMES, "done")}`;
  }
  return `记录任务动作：${mode}`;
}

function buildTaskEvent(mode, previousTask, nextTask, input = {}) {
  const changedFields = collectChangedFields(previousTask, nextTask);
  const plan = taskPlanProgress(nextTask);
  const event = {
    ts: nowIso(),
    mode,
    tid: nextTask.tid,
    previousState: previousTask?.state || "none",
    type: nextTask.type,
    state: nextTask.state,
    owner: nextTask.owner,
    priority: nextTask.priority,
    goal: nextTask.goal,
    acceptance: nextTask.acceptance,
    humanGate: nextTask.humanGate,
    dependsOn: nextTask.dependsOn,
    planDoneCount: plan.done,
    planTotal: plan.total,
    summary: summarizeTaskEvent(mode, previousTask, nextTask, input, changedFields)
  };

  if (changedFields.length > 0) {
    event.changedFields = changedFields;
  }

  if (mode === "handoff") {
    event.from = normalizeInline(input.from, "CoS");
    event.to = normalizeInline(input.to, "CTO");
  } else if (mode === "checkpoint") {
    event.status = validateInSet("checkpoint status", input.status, CHECKPOINT_STATUSES, "on_track");
  } else if (mode === "approve" || mode === "reject") {
    event.actor = normalizeInline(input.actor, "Human");
  } else if (mode === "ops-review") {
    event.verdict = validateInSet("ops verdict", input.verdict, OPS_REVIEW_VERDICTS, "pass");
  } else if (mode === "closeout") {
    event.outcome = validateInSet("closeout outcome", input.outcome, CLOSEOUT_OUTCOMES, "done");
  }

  return event;
}

function resolveTaskPath(projectRoot, tid) {
  const taskPath = path.join(ensureTasksDir(projectRoot), `${normalizeInline(tid)}.md`);
  if (!fs.existsSync(taskPath)) {
    throw new Error(`task does not exist: ${tid}`);
  }
  return taskPath;
}

function isClosedTaskState(state) {
  return ["done", "cancelled"].includes(normalizeInline(state));
}

function assertTaskOpenForWorkflow(task, mode) {
  if (isClosedTaskState(task?.state)) {
    throw new Error(`cannot ${mode} a closed task: ${task.state}`);
  }
}

function assertTaskWaitingApproval(task, mode) {
  if (isClosedTaskState(task?.state)) {
    throw new Error(`cannot ${mode} a closed task: ${task.state}`);
  }
  if (task?.state !== "waiting_approval") {
    throw new Error(`${mode} requires waiting_approval state; current state: ${task?.state || "unknown"}`);
  }
}

function assertClosedTaskPlanNotChanged(task, input) {
  if (!isClosedTaskState(task?.state) || !hasOwn(input, "plan")) {
    return;
  }

  const nextPlanLines = normalizePlanLines(input.plan);
  const currentPlanLines = Array.isArray(task?.planLines) ? task.planLines : [];
  if (JSON.stringify(nextPlanLines) !== JSON.stringify(currentPlanLines)) {
    throw new Error(`cannot edit plan for a closed task: ${task.state}`);
  }
}

function createTask(projectRoot, input = {}) {
  const tasksDir = ensureTasksDir(projectRoot);
  const type = validateInSet("task type", input.type || "A", TASK_TYPES, "A");
  const goal = normalizeInline(input.goal);
  const acceptance = normalizeInline(input.acceptance, "Define a clear done condition");
  const owner = normalizeInline(input.owner, "HQ(CoS)");
  const priority = normalizePriority(input.priority || "P2");
  const humanGate = normalizeInline(input.humanGate, "none") || "none";
  const planLines = normalizePlanLines(input.plan);
  const state = validateInSet("task state", input.state || "triage", TASK_STATES, "triage");

  if (!goal) {
    throw new Error("task goal is required");
  }

  const tid = resolveUniqueTid(projectRoot, `TID-${nowTidStamp()}-${newSlug(input.slug || goal)}`);
  const dependsOn = validateDependencies(projectRoot, tid, input.dependsOn);
  const task = {
    tid,
    type,
    priority,
    goal,
    acceptance,
    owner,
    dependsOn,
    humanGate,
    planLines,
    state,
    createdAt: nowIso()
  };
  const filePath = path.join(tasksDir, `${tid}.md`);
  const taskSnapshot = parseTaskDocument(buildTaskContent(task), filePath);
  const createEvent = buildTaskEvent("create", null, taskSnapshot, input);

  fs.writeFileSync(filePath, buildTaskContent(task, [createEvent]), "utf8");

  return {
    ...task,
    path: filePath
  };
}

function updateTask(projectRoot, input = {}) {
  const tid = normalizeInline(input.tid);
  const mode = validateInSet("action mode", input.mode, ACTION_MODES);

  if (!tid) {
    throw new Error("task TID is required");
  }

  const taskPath = resolveTaskPath(projectRoot, tid);
  const task = readTaskDocument(taskPath);
  let content = task.content;

  if (mode === "edit-metadata") {
    assertClosedTaskPlanNotChanged(task, input);
    const nextTask = {
      type: hasOwn(input, "type") ? validateInSet("task type", input.type || task.type, TASK_TYPES, task.type) : task.type,
      priority: hasOwn(input, "priority") ? normalizePriority(input.priority || task.priority) : task.priority,
      owner: hasOwn(input, "owner") ? normalizeInline(input.owner, task.owner || "HQ(CoS)") : task.owner,
      goal: hasOwn(input, "goal") ? normalizeInline(input.goal, task.goal) : task.goal,
      acceptance: hasOwn(input, "acceptance") ? normalizeInline(input.acceptance, task.acceptance || "Define a clear done condition") : task.acceptance,
      dependsOn: hasOwn(input, "dependsOn") ? normalizeList(input.dependsOn) : task.dependsOn,
      humanGate: hasOwn(input, "humanGate") ? normalizeInline(input.humanGate, "none") || "none" : task.humanGate
    };

    if (!nextTask.goal) {
      throw new Error("task goal is required");
    }

    nextTask.dependsOn = validateDependencies(projectRoot, tid, nextTask.dependsOn);
    content = applyHeaderUpdates(content, nextTask);

    if (hasOwn(input, "plan")) {
      const nextPlanLines = normalizePlanLines(input.plan);
      content = replaceSectionBody(content, PLAN_HEADINGS, nextPlanLines.length > 0 ? nextPlanLines.join("\n") : "_none_");
    }
  } else if (mode === "toggle-plan") {
    assertTaskOpenForWorkflow(task, mode);
    const planItems = task.planItems.map((item) => ({ ...item }));
    if (planItems.length === 0) {
      throw new Error("task has no checklist items to toggle");
    }

    const index = Number.parseInt(String(input.index ?? ""), 10);
    if (!Number.isInteger(index) || index < 0 || index >= planItems.length) {
      throw new Error(`plan item index is invalid: ${input.index}`);
    }

    const nextDone = hasOwn(input, "done")
      ? parseBoolean(input.done, planItems[index].done)
      : !planItems[index].done;
    planItems[index].done = nextDone;
    content = replaceSectionBody(content, PLAN_HEADINGS, serializePlanItems(planItems).join("\n"));
  } else if (mode === "approve") {
    assertTaskWaitingApproval(task, mode);

    content = appendToSection(content, PROGRESS_HEADINGS, buildApprovalCheckpoint(task, input));
    content = replaceMetadata(content, "State", "active");
    content = replaceMetadata(content, "HumanGate", "none");
  } else if (mode === "reject") {
    assertTaskWaitingApproval(task, mode);

    const rejection = buildRejectionCheckpoint(task, input);
    content = appendToSection(content, PROGRESS_HEADINGS, rejection.block);
    content = replaceMetadata(content, "State", "scope_changed");
    content = replaceMetadata(content, "Owner", "HQ(CoS)");
    content = replaceMetadata(content, "HumanGate", rejection.humanGate);
  } else if (mode === "checkpoint") {
    assertTaskOpenForWorkflow(task, mode);
    const status = validateInSet("checkpoint status", input.status, CHECKPOINT_STATUSES, "on_track");
    const block = emitBlock("checkpoint", {
      tid,
      status,
      completed: input.completed,
      next: input.next,
      risk: input.risk,
      needFromHuman: input.needFromHuman
    });

    content = appendToSection(content, PROGRESS_HEADINGS, block);
    const topState = status === "blocked"
      ? "blocked"
      : status === "waiting_approval"
        ? "waiting_approval"
        : status === "scope_changed"
          ? "scope_changed"
          : "active";
    content = replaceMetadata(content, "State", topState);

    if (topState === "waiting_approval") {
      const gate = meaningfulText(input.needFromHuman) || task.humanGate;
      if (gate && gate !== "none") {
        content = replaceMetadata(content, "HumanGate", gate);
      }
    } else if (topState === "scope_changed") {
      content = replaceMetadata(content, "Owner", "HQ(CoS)");
    }
  } else if (mode === "handoff") {
    assertTaskOpenForWorkflow(task, mode);
    const block = emitBlock("handoff", {
      tid,
      from: input.from,
      to: input.to,
      ask: input.ask,
      constraints: input.constraints,
      doneWhen: input.doneWhen
    });

    content = appendToSection(content, PROGRESS_HEADINGS, block);
    content = replaceMetadata(content, "State", "active");
    content = replaceMetadata(content, "Owner", `HQ(${normalizeInline(input.to, "CTO")})`);
  } else if (mode === "ops-review") {
    assertTaskOpenForWorkflow(task, mode);
    const verdict = validateInSet("ops verdict", input.verdict, OPS_REVIEW_VERDICTS, "pass");
    const block = emitBlock("ops-review", {
      verdict,
      mainConcern: input.mainConcern,
      neededMitigation: input.neededMitigation
    });

    content = appendToSection(content, PROGRESS_HEADINGS, block);
    if (verdict === "needs_fix") {
      content = replaceMetadata(content, "State", "scope_changed");
      content = replaceMetadata(content, "Owner", "HQ(CoS)");
    }
  } else if (mode === "closeout") {
    assertTaskOpenForWorkflow(task, mode);
    const outcome = validateInSet("closeout outcome", input.outcome, CLOSEOUT_OUTCOMES, "done");
    const block = emitBlock("closeout", {
      tid,
      outcome,
      changed: input.changed,
      evidence: input.evidence,
      risk: input.risk,
      next: input.next
    });

    content = appendToSection(content, CLOSEOUT_HEADINGS, block);
    content = replaceMetadata(content, "State", outcome === "cancelled" ? "cancelled" : "done");
  }

  const nextTask = parseTaskDocument(content, taskPath, { preferHeaderSnapshot: true });
  content = appendTaskEvent(content, buildTaskEvent(mode, task, nextTask, input));
  content = setUpdatedAt(content);
  fs.writeFileSync(taskPath, content, "utf8");

  return {
    tid,
    mode,
    path: taskPath
  };
}

module.exports = {
  createTask,
  updateTask
};
