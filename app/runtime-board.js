const fs = require("fs");
const path = require("path");
const { loadExistingConfig } = require("./generator");

const {
  EVENT_LOG_HEADINGS,
  parseTaskEventLogSection,
  reduceTaskEventSnapshot
} = require("./task-event-log");

const BASE_ROLE_DEFS = [
  { id: "cos", name: "CoS", title: "协作指挥官", activeStatus: "supervising" },
  { id: "cto", name: "CTO", title: "技术负责人", activeStatus: "planning" },
  { id: "builder", name: "Builder", title: "执行构建者", activeStatus: "working" },
  { id: "ko", name: "KO", title: "知识运营", activeStatus: "documenting" },
  { id: "ops", name: "Ops", title: "流程运营", activeStatus: "reviewing" }
];
const BASE_ROLE_PATTERNS = {
  cos: [/cos/i, /协作指挥官/, /幕僚长/],
  cto: [/cto/i, /技术负责人/, /技术统筹/],
  builder: [/builder/i, /执行构建者/, /执行者/],
  ko: [/\bko\b/i, /知识运营/, /知识官/],
  ops: [/ops/i, /流程运营/, /运维/]
};
const TASK_STATE_LABELS = { triage: "待分诊", active: "执行中", blocked: "已阻塞", waiting_approval: "待批准", scope_changed: "范围变更", done: "已完成", cancelled: "已取消" };
const TASK_STATE_PRIORITY = { blocked: 60, waiting_approval: 50, scope_changed: 40, active: 30, triage: 20, done: 10, cancelled: 0 };
const PRIORITY_SCORES = { P0: 40, P1: 30, P2: 20, P3: 10 };
const INTERACTION_LOOP = [
  { id: "triage", title: "CoS 发起任务", description: "先创建 TID，写清目标、验收、优先级和人工审批边界。", signal: "new-hq-task.ps1" },
  { id: "plan", title: "CTO 写执行清单", description: "先把最小可执行步骤写进 Plan checklist，再交给 Builder。", signal: "## Plan" },
  { id: "handoff", title: "显式角色接力", description: "Handoff 要带 ask、constraints 和 done-when。", signal: "Handoff" },
  { id: "checkpoint", title: "执行中持续回写", description: "Progress 要说明完成项、下一步、风险和人类输入。", signal: "Progress" },
  { id: "closeout", title: "收口与复盘", description: "完成后写 Closeout，由 CoS 对外统一收口。", signal: "Closeout / KO" }
];
const BOARD_COLUMN_DEFS = [
  { id: "triage", title: "待分诊" },
  { id: "active", title: "执行中" },
  { id: "blocked", title: "已阻塞" },
  { id: "waiting_approval", title: "待批准" },
  { id: "scope_changed", title: "范围变更" },
  { id: "done", title: "已完成" },
  { id: "cancelled", title: "已取消" }
];

function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function normalizeNewlines(value) { return String(value || "").replace(/\r\n/g, "\n"); }
function normalizeInline(value, fallback = "") {
  const normalized = String(value ?? fallback).replace(/\r?\n+/g, " ").replace(/\s+/g, " ").trim();
  return normalized || String(fallback || "").trim();
}
function splitInlineList(value) {
  return Array.from(new Set(String(value || "").split(/\r?\n|[,;，；]/).map((item) => item.trim()).filter(Boolean).filter((item) => item.toLowerCase() !== "none")));
}
function normalizePriority(value) {
  const normalized = normalizeInline(value || "P2", "P2").toUpperCase();
  return PRIORITY_SCORES[normalized] ? normalized : "P2";
}
function buildRoleDefinitions(projectRoot) {
  const roles = BASE_ROLE_DEFS.map((role) => ({ ...role }));
  try {
    const config = loadExistingConfig(projectRoot);
    for (const role of config.roles || []) {
      if (!role?.id || roles.some((item) => item.id === role.id)) continue;
      roles.push({
        id: role.id,
        name: role.name || role.id,
        title: role.role || role.name || role.id,
        activeStatus: role.preset === "cto" ? "planning" : role.preset === "ko" ? "documenting" : role.preset === "ops" ? "reviewing" : "working"
      });
    }
  } catch (error) {
    return roles;
  }
  return roles;
}
function buildRolePatterns(roleDefs) {
  return Object.fromEntries(roleDefs.map((role) => {
    const basePatterns = BASE_ROLE_PATTERNS[role.id] || [];
    const dynamicPatterns = [
      role.id ? new RegExp(`\\b${escapeRegExp(role.id)}\\b`, "i") : null,
      role.name ? new RegExp(escapeRegExp(role.name), "i") : null,
      role.title ? new RegExp(escapeRegExp(role.title), "i") : null
    ].filter(Boolean);
    return [role.id, [...basePatterns, ...dynamicPatterns]];
  }));
}
function extractHeader(content) {
  const normalized = normalizeNewlines(content);
  const headingIndex = normalized.search(/\n##\s+/);
  return headingIndex === -1 ? normalized : normalized.slice(0, headingIndex);
}
function extractField(text, label) {
  const pattern = new RegExp(`^${escapeRegExp(label)}:\\s*(.+)$`, "m");
  return pattern.exec(text)?.[1]?.trim() || "";
}
function extractFirstField(text, labels) {
  for (const label of labels) {
    const value = extractField(text, label);
    if (value) return value;
  }
  return "";
}
function extractBulletValue(text, label) {
  const pattern = new RegExp(`^-\\s*${escapeRegExp(label)}:\\s*(.+)$`, "m");
  return pattern.exec(text)?.[1]?.trim() || "";
}
function extractFirstBulletValue(text, labels) {
  for (const label of labels) {
    const value = extractBulletValue(text, label);
    if (value) return value;
  }
  return "";
}
function getSection(content, headings) {
  const normalized = normalizeNewlines(content);
  const headingText = headings.find((heading) => normalized.includes(heading));
  if (!headingText) return "";
  const start = normalized.indexOf(headingText);
  const from = start + headingText.length;
  const next = normalized.indexOf("\n## ", from);
  return normalized.slice(from, next === -1 ? normalized.length : next).trim();
}
function splitBlocks(section) {
  return normalizeNewlines(section).split(/\n{2,}/).map((item) => item.trim()).filter(Boolean).filter((item) => !/^_/.test(item));
}
function findRoles(text, roleDefs, rolePatterns) {
  const value = String(text || "");
  return roleDefs.filter((role) => (rolePatterns[role.id] || []).some((pattern) => pattern.test(value))).map((role) => role.id);
}
function classifyBlock(block) {
  const normalized = normalizeNewlines(block);
  if (/^(Handoff|交接):/i.test(normalized)) return "handoff";
  if (/^(Ops Review|运维审查):/i.test(normalized)) return "ops-review";
  if (/^TID:.*\n(Progress|进度):/im.test(normalized)) return "checkpoint";
  if (/^TID:.*\n(Closeout|结项):/im.test(normalized)) return "closeout";
  return "text";
}
function parseBlock(block, roleDefs, rolePatterns) {
  const type = classifyBlock(block);
  if (type === "checkpoint") return { type, tid: extractFirstField(block, ["TID"]), status: extractFirstBulletValue(block, ["状态", "Status"]), completed: extractFirstBulletValue(block, ["已完成", "Completed"]), next: extractFirstBulletValue(block, ["下一步", "Next"]), risk: extractFirstBulletValue(block, ["风险", "Risk"]), needFromHuman: extractFirstBulletValue(block, ["Need From Human", "需要的人类输入", "人工依赖"]) };
  if (type === "closeout") return { type, tid: extractFirstField(block, ["TID"]), outcome: extractFirstBulletValue(block, ["结果", "Outcome"]), changed: extractFirstBulletValue(block, ["变更内容", "Changed"]), evidence: extractFirstBulletValue(block, ["证据", "Evidence"]), risk: extractFirstBulletValue(block, ["剩余风险", "Risk"]), next: extractFirstBulletValue(block, ["下一步", "Next"]) };
  if (type === "handoff") {
    const toValue = extractFirstBulletValue(block, ["交给", "To"]);
    return { type, from: extractFirstBulletValue(block, ["来自", "From"]), to: toValue, tid: extractFirstBulletValue(block, ["TID"]), ask: extractFirstBulletValue(block, ["请求", "Ask"]), constraints: extractFirstBulletValue(block, ["约束", "Constraints"]), doneWhen: extractFirstBulletValue(block, ["完成标准", "Done When"]), toRoles: findRoles(toValue, roleDefs, rolePatterns) };
  }
  if (type === "ops-review") return { type, verdict: extractFirstBulletValue(block, ["结论", "Verdict"]), concern: extractFirstBulletValue(block, ["主要关注点", "Main Concern"]), mitigation: extractFirstBulletValue(block, ["需要补救", "Needed Mitigation"]) };
  return { type, raw: block };
}
function parsePlanSection(section) {
  const lines = normalizeNewlines(section).split("\n").map((line) => line.trim()).filter(Boolean).filter((line) => !/^_/.test(line));
  const items = [];
  const notes = [];
  for (const line of lines) {
    const checkboxMatch = /^[-*]\s*\[(x| )\]\s*(.+)$/i.exec(line);
    if (checkboxMatch) {
      items.push({ text: normalizeInline(checkboxMatch[2]), done: checkboxMatch[1].toLowerCase() === "x" });
      continue;
    }
    const bulletMatch = /^[-*]\s+(.+)$/.exec(line);
    if (bulletMatch) {
      items.push({ text: normalizeInline(bulletMatch[1]), done: false });
      continue;
    }
    notes.push(normalizeInline(line));
  }
  return { items, notes };
}
function parseTimestamp(text) {
  const value = Date.parse(text);
  return Number.isNaN(value) ? 0 : value;
}
function getStatePriority(task) {
  if (task.runtimeState === "blocked" && task.dependencyBlocked && !task.explicitBlock) return 25;
  return TASK_STATE_PRIORITY[task.runtimeState] || 0;
}
function getPriorityScore(task) { return PRIORITY_SCORES[task.priority] || 0; }
function compareTasks(left, right) {
  return getStatePriority(right) - getStatePriority(left) || getPriorityScore(right) - getPriorityScore(left) || right.sortKey - left.sortKey;
}
function deriveBaseTaskState(task, lastCheckpoint, lastCloseout, lastEvent) {
  if (lastEvent?.state) return lastEvent.state;
  if (lastCloseout?.outcome === "done") return "done";
  if (lastCloseout?.outcome === "cancelled") return "cancelled";
  if (lastCheckpoint?.status === "blocked") return "blocked";
  if (lastCheckpoint?.status === "waiting_approval") return "waiting_approval";
  if (lastCheckpoint?.status === "scope_changed") return "scope_changed";
  if (task.state === "triage" && lastCheckpoint?.status === "on_track") return "active";
  return task.state || "triage";
}
function inferRoleIdFromText(value, roleDefs) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  return roleDefs.find((role) => {
    const candidates = [role.id, role.name, role.title].filter(Boolean).map((item) => String(item).trim().toLowerCase());
    return candidates.some((candidate) => candidate && (normalized === candidate || normalized.includes(candidate)));
  })?.id || "";
}
function getRoleDisplayName(roleId, roleDefs) {
  return roleDefs.find((role) => role.id === roleId)?.title || String(roleId || "").toUpperCase();
}
function getCheckpointTone(status) {
  if (status === "blocked") return "danger";
  if (status === "waiting_approval") return "warning";
  if (status === "scope_changed") return "accent";
  return "working";
}
function formatDependencyLabel(blockedBy) {
  if (!Array.isArray(blockedBy) || blockedBy.length === 0) return "none";
  return blockedBy.map((item) => item.missing ? `${item.tid} (missing)` : `${item.tid} (${item.stateLabel})`).join(", ");
}
function summarizeLinkedTask(tid, depth, tasksById) {
  const task = tasksById.get(tid);
  if (!task) {
    return {
      tid,
      depth,
      goal: "未找到对应任务文件",
      state: "missing",
      stateLabel: "缺失",
      currentRoleLabel: "未知",
      nextStep: "补齐缺失任务后再继续",
      missing: true,
      dependencyBlocked: false
    };
  }
  return {
    tid,
    depth,
    goal: task.goal,
    state: task.runtimeState,
    stateLabel: task.stateLabel,
    currentRoleLabel: task.currentRoleLabel,
    nextStep: task.nextStep,
    missing: false,
    dependencyBlocked: task.dependencyBlocked
  };
}
function buildDependentsMap(tasks) {
  const dependentsMap = new Map(tasks.map((task) => [task.tid, []]));
  for (const task of tasks) {
    for (const dependencyTid of task.dependsOn) {
      if (!dependentsMap.has(dependencyTid)) {
        dependentsMap.set(dependencyTid, []);
      }
      dependentsMap.get(dependencyTid).push(task.tid);
    }
  }
  return dependentsMap;
}
function collectDependencyChain(startTid, nextTidsForTid, tasksById) {
  const queue = (nextTidsForTid(startTid) || []).map((tid) => ({ tid, depth: 1 }));
  const visited = new Set([startTid]);
  const chain = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.tid)) continue;
    visited.add(current.tid);
    chain.push(summarizeLinkedTask(current.tid, current.depth, tasksById));
    if (!tasksById.has(current.tid)) continue;
    for (const nextTid of nextTidsForTid(current.tid) || []) {
      if (!visited.has(nextTid)) {
        queue.push({ tid: nextTid, depth: current.depth + 1 });
      }
    }
  }

  return chain;
}
function annotateDependencyGraph(tasks) {
  const tasksById = new Map(tasks.map((task) => [task.tid, task]));
  const dependentsMap = buildDependentsMap(tasks);

  for (const task of tasks) {
    task.directDependencies = task.dependsOn.map((tid) => summarizeLinkedTask(tid, 1, tasksById));
    task.directDependents = (dependentsMap.get(task.tid) || []).map((tid) => summarizeLinkedTask(tid, 1, tasksById));
    task.upstreamChain = collectDependencyChain(task.tid, (tid) => tasksById.get(tid)?.dependsOn || [], tasksById);
    task.downstreamChain = collectDependencyChain(task.tid, (tid) => dependentsMap.get(tid) || [], tasksById);
    task.dependencySummary = {
      directDependencyCount: task.directDependencies.length,
      directDependentCount: task.directDependents.length,
      upstreamCount: task.upstreamChain.length,
      downstreamCount: task.downstreamChain.length,
      missingDependencyCount: task.directDependencies.filter((item) => item.missing).length,
      activeDependentCount: task.directDependents.filter((item) => !["done", "cancelled"].includes(item.state)).length
    };
  }
}
function deriveCurrentRoleId(task, latestProgressBlocks, roleDefs) {
  if (task.runtimeState === "done" || task.runtimeState === "cancelled") return null;
  if (task.runtimeState === "triage") return "cos";
  if (task.runtimeState === "waiting_approval") return "cos";
  const ownerRoleId = task.ownerRoles[0] || inferRoleIdFromText(task.owner, roleDefs);
  if (ownerRoleId) return ownerRoleId;
  let currentRoleId = "cos";
  for (const block of latestProgressBlocks) {
    if (block.type === "handoff" && block.toRoles.length > 0) currentRoleId = block.toRoles[0];
  }
  return currentRoleId || "cos";
}
function deriveNextStep(task) {
  if (task.dependencyBlocked && task.blockedBy.length > 0) return `等待依赖 ${task.blockedBy[0].tid} 完成`;
  if (task.runtimeState === "waiting_approval") {
    return task.lastCheckpoint?.needFromHuman && task.lastCheckpoint.needFromHuman !== "none" ? task.lastCheckpoint.needFromHuman : (task.humanGate !== "none" ? task.humanGate : "等待人工批准");
  }
  return task.lastCheckpoint?.next || task.planNextItem || task.lastHandoff?.doneWhen || task.lastCloseout?.next || (task.runtimeState === "triage" ? "由 CoS 发起第一条 handoff" : "等待下一步");
}
function buildSuggestedAction(task, roleDefs) {
  if (task.dependencyBlocked && task.blockedBy.length > 0) return `等待依赖任务完成：${formatDependencyLabel(task.blockedBy)}。CoS 可以收缩范围、拆出并行子任务，或移除无效依赖。`;
  if (task.runtimeState === "triage") return task.planTotal > 0 ? "CoS 确认边界和依赖后，发第一条 handoff，让 CTO 或 Builder 接棒。" : "CoS 先明确目标、验收、优先级，再让 CTO 补一份最小可执行清单。";
  if (task.runtimeState === "waiting_approval") return task.humanGate !== "none" ? `暂停执行，由 CoS 请求人工确认：${task.humanGate}。批准后用 approve 恢复，驳回则用 reject 退回重收敛。` : "暂停执行，由 CoS 向人工请求明确批准；批准后用 approve 恢复，驳回则用 reject 退回重收敛。";
  if (task.runtimeState === "blocked") return task.explicitBlock ? "当前负责人先补全阻塞证据，CoS 负责消障或缩小范围。" : "这项任务被依赖阻塞，不要继续推进，先让上游任务出结果。";
  if (task.runtimeState === "scope_changed") return "CTO 重新收敛范围，CoS 重新确认验收后再继续。";
  if (task.currentRoleId === "cto") return task.planTotal > 0 ? "CTO 核对清单、依赖和验收后，再把下一步交给 Builder。" : "CTO 先写最小可执行 checklist，再进行 handoff，避免 Builder 接到模糊任务。";
  if (task.currentRoleId === "builder") return task.planNextItem ? `Builder 先完成清单中的下一项：${task.planNextItem}。` : "Builder 按约定执行任务、补证据，并持续回写 Progress。";
  if (task.currentRoleId === "ops") return "Ops 审查风险、回滚条件和上线边界，给出 pass 或需要补救。";
  if (task.currentRoleId === "ko") return "KO 只在任务稳定或完成后沉淀可复用知识，不介入中途执行。";
  if (task.currentRoleId && !BASE_ROLE_DEFS.some((role) => role.id === task.currentRoleId)) return `${getRoleDisplayName(task.currentRoleId, roleDefs)} 正在处理中，CoS 继续监督并等待下次回写。`;
  return "CoS 持续监督当前任务，并根据状态决定继续 handoff、催回写或收口。";
}
function buildCommandExample(task, roleDefs) {
  if (task.dependencyBlocked && task.blockedBy.length > 0) {
    return [`TID: ${task.tid}`, "Progress:", "- Status: blocked", `- Completed: Waiting for dependency ${task.blockedBy[0].tid}`, `- Next: Resume after ${task.blockedBy[0].tid} is done`, "- Risk: Dependency chain is not ready", "- Need From Human: none"].join("\n");
  }
  if (task.runtimeState === "triage") {
    return ["Handoff:", "- From: CoS", "- To: CTO", `- TID: ${task.tid}`, "- Ask: Scope the request and write the minimum executable checklist", "- Constraints: Keep one visible Feishu bot and short external replies", "- Done When: A short plan, clear acceptance, and the next owner"].join("\n");
  }
  if (task.currentRoleId === "cto" && task.planTotal === 0) {
    return ["## Plan", "", "- [ ] Clarify the exact scope and constraints", "- [ ] Define the minimum executable slice", "- [ ] State the evidence needed before closeout"].join("\n");
  }
  if (task.runtimeState === "waiting_approval") {
    return [
      `TID: ${task.tid}`,
      "Approve / Reject:",
      `- Need From Human: ${task.lastCheckpoint?.needFromHuman || task.humanGate || "explicit approval"}`,
      `- Approve Next: ${task.lastCheckpoint?.next || "Continue execution"}`,
      "- Reject Next: CoS re-scope and resubmit",
      "- Action: Use approve or reject in the runtime action panel"
    ].join("\n");
  }
  if (task.runtimeState === "scope_changed") {
    return [
      `TID: ${task.tid}`,
      "Rescope:",
      `- Owner: ${task.owner || "HQ(CoS)"}`,
      `- Next: ${task.lastCheckpoint?.next || "CoS re-scope and re-assign"}`,
      "- Action: Update metadata, tighten acceptance, and send a fresh handoff"
    ].join("\n");
  }
  if (["blocked", "waiting_approval", "scope_changed"].includes(task.runtimeState)) {
    return [`TID: ${task.tid}`, "Progress:", `- Status: ${task.runtimeState}`, `- Completed: ${task.lastCheckpoint?.completed || "Current blocker documented"}`, `- Next: ${task.lastCheckpoint?.next || "Wait for CoS decision or approval"}`, `- Risk: ${task.lastCheckpoint?.risk || "none"}`, `- Need From Human: ${task.lastCheckpoint?.needFromHuman || task.humanGate || "decision required"}`].join("\n");
  }
  if (task.currentRoleId === "builder") {
    return [`TID: ${task.tid}`, "Progress:", `- Status: ${task.lastCheckpoint?.status || "on_track"}`, `- Completed: ${task.lastCheckpoint?.completed || "Implementation started"}`, `- Next: ${task.planNextItem || task.lastCheckpoint?.next || "Continue execution and add evidence"}`, `- Risk: ${task.lastCheckpoint?.risk || "none"}`, `- Need From Human: ${task.lastCheckpoint?.needFromHuman || "none"}`].join("\n");
  }
  if (task.currentRoleId === "ops") {
    return ["Ops Review:", `- Verdict: ${task.lastOpsReview?.verdict || "pass"}`, `- Main Concern: ${task.lastOpsReview?.concern || "none"}`, `- Needed Mitigation: ${task.lastOpsReview?.mitigation || "none"}`].join("\n");
  }
  if (task.lastHandoff?.type === "handoff") {
    return ["Handoff:", `- From: ${task.lastHandoff.from || "CoS"}`, `- To: ${task.lastHandoff.to || getRoleDisplayName(task.currentRoleId, roleDefs)}`, `- TID: ${task.tid}`, `- Ask: ${task.lastHandoff.ask || "Continue the current phase"}`, `- Constraints: ${task.lastHandoff.constraints || "none"}`, `- Done When: ${task.lastHandoff.doneWhen || "Produce the next executable result"}`].join("\n");
  }
  return [`TID: ${task.tid}`, "Closeout:", "- Outcome: done", "- Changed: Current task is complete and ready for external closeout", "- Evidence: Deliverables, logs, or checks are attached", "- Risk: none", "- Next: Open a new TID if more work is needed"].join("\n");
}
function buildTimeline(task, roleDefs) {
  const events = [];
  let currentRoleId = inferRoleIdFromText(task.eventLog[0]?.owner, roleDefs) || task.ownerRoles[0] || "cos";
  const handoffBlocks = task.latestProgressBlocks.filter((block) => block.type === "handoff");
  const checkpointBlocks = task.latestProgressBlocks.filter((block) => block.type === "checkpoint");
  const opsReviewBlocks = task.latestProgressBlocks.filter((block) => block.type === "ops-review");
  const closeoutBlocks = task.closeoutBlocks.filter((block) => block.type === "closeout");
  let handoffIndex = 0;
  let checkpointIndex = 0;
  let opsReviewIndex = 0;
  let closeoutIndex = 0;

  function isDecisionCheckpoint(block) {
    const completed = String(block?.completed || "").trim().toLowerCase();
    return completed.startsWith("approved by") || completed.startsWith("rejected by");
  }

  function pushCreateEvent(event) {
    events.push({
      type: "create",
      tone: "working",
      title: "任务创建",
      detail: event.summary || `已创建 ${event.tid || "新任务"}`,
      meta: `负责人: ${event.owner || "HQ(CoS)"} | 优先级: ${event.priority || "P2"}`
    });
    currentRoleId = inferRoleIdFromText(event.owner, roleDefs) || currentRoleId;
  }

  function pushMetadataEvent(event) {
    const changedFields = Array.isArray(event.changedFields) && event.changedFields.length > 0
      ? event.changedFields.join(", ")
      : "头字段未变化";
    events.push({
      type: "edit-metadata",
      tone: "accent",
      title: "任务头更新",
      detail: event.summary || "已更新任务头字段",
      meta: `字段: ${changedFields}`
    });
    currentRoleId = inferRoleIdFromText(event.owner, roleDefs) || currentRoleId;
  }

  function pushPlanToggleEvent(event) {
    const doneCount = Number.isFinite(event.planDoneCount) ? event.planDoneCount : task.planDoneCount;
    const totalCount = Number.isFinite(event.planTotal) ? event.planTotal : task.planTotal;
    events.push({
      type: "toggle-plan",
      tone: "working",
      title: "执行清单更新",
      detail: event.summary || "已切换 checklist 项",
      meta: `清单: ${doneCount}/${totalCount}`
    });
  }

  function pushDecisionEvent(event) {
    const isApprove = event.mode === "approve";
    const decisionCheckpoint = isDecisionCheckpoint(checkpointBlocks[checkpointIndex]) ? checkpointBlocks[checkpointIndex++] : null;
    const metaParts = [];
    if (decisionCheckpoint?.next) metaParts.push(`下一步: ${decisionCheckpoint.next}`);
    if (decisionCheckpoint?.needFromHuman && decisionCheckpoint.needFromHuman !== "none") metaParts.push(`人工依赖: ${decisionCheckpoint.needFromHuman}`);
    events.push({
      type: event.mode,
      tone: isApprove ? "done" : "warning",
      title: isApprove ? "批准恢复执行" : "驳回并重收敛",
      detail: event.summary || (isApprove ? "任务已获批准" : "任务被驳回"),
      meta: metaParts.join(" | ") || `执行人: ${event.actor || "Human"}`
    });
    currentRoleId = inferRoleIdFromText(event.owner, roleDefs) || currentRoleId;
  }

  function pushHandoff(block, event = null) {
    const nextRoleId = block?.toRoles?.[0] || inferRoleIdFromText(block?.to || event?.to, roleDefs) || currentRoleId;
    const fromLabel = block?.from || event?.from || getRoleDisplayName(currentRoleId, roleDefs);
    const toLabel = block?.to || event?.to || getRoleDisplayName(nextRoleId, roleDefs);
    events.push({
      type: "handoff",
      tone: "accent",
      title: `${fromLabel} -> ${toLabel}`,
      detail: block?.ask || event?.summary || "继续当前阶段工作",
      meta: `完成标准: ${block?.doneWhen || "给出下一步可执行结果"}`
    });
    currentRoleId = nextRoleId;
  }

  function pushCheckpoint(block, event = null) {
    const metaParts = [];
    if (block?.next) metaParts.push(`下一步: ${block.next}`);
    if (block?.needFromHuman && block.needFromHuman !== "none") metaParts.push(`人工依赖: ${block.needFromHuman}`);
    events.push({
      type: "checkpoint",
      tone: getCheckpointTone(block?.status || event?.status),
      title: `${getRoleDisplayName(currentRoleId, roleDefs)} 进度回写`,
      detail: block?.completed || event?.summary || "已更新进度",
      meta: metaParts.join(" | ") || `状态: ${block?.status || event?.status || "on_track"}`
    });
    currentRoleId = inferRoleIdFromText(event?.owner, roleDefs) || currentRoleId;
  }

  function pushOpsReview(block, event = null) {
    events.push({
      type: "ops-review",
      tone: (block?.verdict || event?.verdict) === "pass" ? "working" : "warning",
      title: "Ops 审查",
      detail: block?.concern || event?.summary || "已完成风险检查",
      meta: `结论: ${block?.verdict || event?.verdict || "pass"}`
    });
  }

  function pushCloseout(block, event = null) {
    events.push({
      type: "closeout",
      tone: (block?.outcome || event?.outcome) === "cancelled" ? "danger" : "done",
      title: "任务收口",
      detail: block?.changed || event?.summary || "任务已完成",
      meta: `结果: ${block?.outcome || event?.outcome || "done"}`
    });
  }

  if (task.planTotal > 0) {
    events.push({ type: "plan", tone: task.planDoneCount === task.planTotal ? "done" : "working", title: "执行清单", detail: `已完成 ${task.planDoneCount}/${task.planTotal} 项`, meta: task.planNextItem ? `下一项: ${task.planNextItem}` : "当前清单已全部勾完" });
  }
  if (task.dependencyBlocked && task.blockedBy.length > 0) {
    events.push({ type: "dependency", tone: "warning", title: "依赖阻塞", detail: `等待 ${task.blockedBy.map((item) => item.tid).join(", ")} 完成`, meta: formatDependencyLabel(task.blockedBy) });
  }
  for (const event of task.eventLog) {
    if (!event || event.invalid) continue;
    if (event.mode === "create") {
      pushCreateEvent(event);
      continue;
    }
    if (event.mode === "edit-metadata") {
      pushMetadataEvent(event);
      continue;
    }
    if (event.mode === "toggle-plan") {
      pushPlanToggleEvent(event);
      continue;
    }
    if (event.mode === "approve" || event.mode === "reject") {
      pushDecisionEvent(event);
      continue;
    }
    if (event.mode === "handoff") {
      pushHandoff(handoffBlocks[handoffIndex++] || null, event);
      continue;
    }
    if (event.mode === "checkpoint") {
      pushCheckpoint(checkpointBlocks[checkpointIndex++] || null, event);
      continue;
    }
    if (event.mode === "ops-review") {
      pushOpsReview(opsReviewBlocks[opsReviewIndex++] || null, event);
      continue;
    }
    if (event.mode === "closeout") {
      pushCloseout(closeoutBlocks[closeoutIndex++] || null, event);
    }
  }

  while (handoffIndex < handoffBlocks.length) {
    pushHandoff(handoffBlocks[handoffIndex++] || null);
  }
  while (checkpointIndex < checkpointBlocks.length) {
    const nextBlock = checkpointBlocks[checkpointIndex++] || null;
    if (isDecisionCheckpoint(nextBlock)) continue;
    pushCheckpoint(nextBlock);
  }
  while (opsReviewIndex < opsReviewBlocks.length) {
    pushOpsReview(opsReviewBlocks[opsReviewIndex++] || null);
  }
  while (closeoutIndex < closeoutBlocks.length) {
    pushCloseout(closeoutBlocks[closeoutIndex++] || null);
  }

  for (const block of task.latestProgressBlocks) {
    if (block.type === "text") {
      events.push({ type: "text", tone: "neutral", title: "附加说明", detail: block.raw, meta: "" });
    }
  }
  return events.slice(-6);
}
function parseTaskFile(filePath, roleDefs, rolePatterns) {
  const raw = fs.readFileSync(filePath, "utf8");
  const header = extractHeader(raw);
  const latestProgressBlocks = splitBlocks(getSection(raw, ["## 最新进度", "## Latest Progress"])).map((block) => parseBlock(block, roleDefs, rolePatterns));
  const closeoutBlocks = splitBlocks(getSection(raw, ["## 结项", "## Closeout"])).map((block) => parseBlock(block, roleDefs, rolePatterns));
  const eventLog = parseTaskEventLogSection(getSection(raw, EVENT_LOG_HEADINGS));
  const plan = parsePlanSection(getSection(raw, ["## 计划", "## Plan"]));
  const lastCheckpoint = latestProgressBlocks.filter((item) => item.type === "checkpoint").at(-1) || null;
  const lastHandoff = latestProgressBlocks.filter((item) => item.type === "handoff").at(-1) || null;
  const lastOpsReview = latestProgressBlocks.filter((item) => item.type === "ops-review").at(-1) || null;
  const lastCloseout = closeoutBlocks.filter((item) => item.type === "closeout").at(-1) || null;
  const headerSnapshot = {
    type: extractFirstField(header, ["类型", "Type"]) || "P",
    priority: normalizePriority(extractFirstField(header, ["Priority", "优先级"]) || "P2"),
    owner: extractFirstField(header, ["负责人", "Owner"]) || "HQ(CoS)",
    goal: extractFirstField(header, ["目标", "Goal"]) || path.basename(filePath, ".md"),
    acceptance: extractFirstField(header, ["验收", "Acceptance"]) || "待定义",
    dependsOn: splitInlineList(extractFirstField(header, ["DependsOn", "依赖任务"])),
    humanGate: extractFirstField(header, ["HumanGate", "人工审批点"]) || "none",
    state: extractFirstField(header, ["状态", "State"]) || "triage"
  };
  const reducedSnapshot = reduceTaskEventSnapshot(headerSnapshot, eventLog);
  const lastEvent = reducedSnapshot.lastEvent || eventLog.at(-1) || null;
  const task = {
    tid: extractFirstField(header, ["TID"]) || path.basename(filePath, ".md"),
    type: headerSnapshot.type || "P",
    priority: normalizePriority(headerSnapshot.priority || "P2"),
    owner: reducedSnapshot.owner || "HQ(CoS)",
    goal: headerSnapshot.goal || path.basename(filePath, ".md"),
    acceptance: headerSnapshot.acceptance || "待定义",
    dependsOn: splitInlineList(headerSnapshot.dependsOn),
    humanGate: reducedSnapshot.humanGate || "none",
    state: reducedSnapshot.state || "triage",
    createdAt: extractFirstField(header, ["CreatedAt"]),
    updatedAt: extractFirstField(header, ["UpdatedAt"]),
    filePath,
    ownerRoles: findRoles(reducedSnapshot.owner || extractFirstField(header, ["负责人", "Owner"]), roleDefs, rolePatterns),
    latestProgressBlocks,
    closeoutBlocks,
    eventLog,
    eventCount: eventLog.length,
    lastEvent,
    eventStateSource: reducedSnapshot.source,
    lastCheckpoint,
    lastHandoff,
    lastOpsReview,
    lastCloseout,
    baseState: "triage",
    runtimeState: "triage",
    explicitBlock: false,
    dependencyBlocked: false,
    blockedBy: [],
    planItems: plan.items,
    planNotes: plan.notes,
    planDoneCount: plan.items.filter((item) => item.done).length,
    planTotal: plan.items.length,
    planNextItem: plan.items.find((item) => !item.done)?.text || "",
    sortKey: parseTimestamp(extractFirstField(header, ["UpdatedAt"])) || parseTimestamp(lastEvent?.ts) || parseTimestamp(extractFirstField(header, ["CreatedAt"])) || fs.statSync(filePath).mtimeMs
  };
  task.baseState = deriveBaseTaskState(task, lastCheckpoint, lastCloseout, lastEvent);
  task.runtimeState = task.baseState;
  task.explicitBlock = task.baseState === "blocked";
  return task;
}
function applyDependencyState(tasks) {
  const tasksById = new Map(tasks.map((task) => [task.tid, task]));
  for (const task of tasks) {
    task.blockedBy = task.dependsOn.map((tid) => {
      const dependency = tasksById.get(tid);
      if (!dependency) return { tid, missing: true, state: "missing", stateLabel: "缺失" };
      if (dependency.runtimeState !== "done") return { tid, missing: false, state: dependency.runtimeState, stateLabel: TASK_STATE_LABELS[dependency.runtimeState] || dependency.runtimeState };
      return null;
    }).filter(Boolean);
    task.dependencyBlocked = task.blockedBy.length > 0 && !["done", "cancelled"].includes(task.baseState);
    task.runtimeState = task.dependencyBlocked && ["triage", "active"].includes(task.baseState) ? "blocked" : task.baseState;
  }
}
function finalizeTask(task, roleDefs) {
  task.currentRoleId = deriveCurrentRoleId(task, task.latestProgressBlocks, roleDefs);
  task.currentRoleLabel = task.currentRoleId ? getRoleDisplayName(task.currentRoleId, roleDefs) : "已完成";
  task.stateLabel = TASK_STATE_LABELS[task.runtimeState] || task.runtimeState;
  task.planLabel = task.planTotal > 0 ? `${task.planDoneCount}/${task.planTotal} 清单项` : "暂无清单";
  task.nextStep = deriveNextStep(task);
  task.suggestedAction = buildSuggestedAction(task, roleDefs);
  task.commandExample = buildCommandExample(task, roleDefs);
  task.timeline = buildTimeline(task, roleDefs);
  task.timelineNote = task.timeline.at(-1)?.detail || task.lastEvent?.summary || task.lastCheckpoint?.completed || task.lastHandoff?.ask || task.lastCloseout?.changed || "暂无更新";
}
function severityScore(task, roleId) {
  if (roleId === "cos") {
    if (task.runtimeState === "waiting_approval") return 7;
    if (task.runtimeState === "blocked" && task.explicitBlock) return 6;
    if (task.runtimeState === "scope_changed") return 5;
    if (task.runtimeState === "triage") return 4;
    if (task.dependencyBlocked) return 2;
    return 3;
  }
  if (task.currentRoleId !== roleId) return 0;
  if (task.runtimeState === "waiting_approval") return 5;
  if (task.runtimeState === "blocked" && task.explicitBlock) return 6;
  if (task.runtimeState === "scope_changed") return 4;
  if (task.dependencyBlocked) return 1;
  return 3;
}
function getRoleStatus(roleId, dominantTask, activeTaskCount, supervisingCount, roleDefs) {
  if (roleId === "cos") {
    if (supervisingCount === 0) return { status: "idle", statusLabel: "空闲", phase: "暂无活跃任务" };
    if (dominantTask?.runtimeState === "waiting_approval" || (dominantTask?.runtimeState === "blocked" && dominantTask?.explicitBlock)) return { status: "alert", statusLabel: "监工告警", phase: `正在处理 ${supervisingCount} 个任务中的异常` };
    if (dominantTask?.runtimeState === "scope_changed") return { status: "scope", statusLabel: "范围重收敛", phase: `正在重排 ${supervisingCount} 个任务中的范围变化` };
    return { status: "supervising", statusLabel: "监工中", phase: `正在编排 ${supervisingCount} 个活跃任务` };
  }
  if (!dominantTask) return { status: "idle", statusLabel: "空闲", phase: "等待 CoS 分派" };
  if (dominantTask.runtimeState === "blocked") return { status: "blocked", statusLabel: dominantTask.dependencyBlocked ? "等待依赖" : "阻塞", phase: dominantTask.dependencyBlocked ? `任务 ${dominantTask.tid} 正在等待上游` : `任务 ${dominantTask.tid} 已阻塞` };
  if (dominantTask.runtimeState === "waiting_approval") return { status: "waiting", statusLabel: "待批准", phase: `任务 ${dominantTask.tid} 等待人工确认` };
  if (dominantTask.runtimeState === "scope_changed") return { status: "scope", statusLabel: "范围变更", phase: `任务 ${dominantTask.tid} 需要重定边界` };
  const activeStatus = roleDefs.find((role) => role.id === roleId)?.activeStatus || "working";
  const labels = { planning: "规划中", working: "执行中", documenting: "沉淀中", reviewing: "审查中" };
  return { status: activeStatus, statusLabel: labels[activeStatus] || "处理中", phase: `当前处理 ${activeTaskCount} 个任务` };
}
function buildRoleCards(tasks, roleDefs) {
  const sortedTasks = tasks.slice().sort(compareTasks);
  return roleDefs.map((role) => {
    const relevantTasks = sortedTasks.filter((task) => task.currentRoleId === role.id);
    const activeTasks = relevantTasks.filter((task) => !["done", "cancelled"].includes(task.runtimeState));
    const supervisingTasks = role.id === "cos" ? sortedTasks.filter((task) => !["done", "cancelled"].includes(task.runtimeState)) : [];
    const candidateTasks = role.id === "cos" ? supervisingTasks : activeTasks;
    const dominantTask = candidateTasks.slice().sort((left, right) => severityScore(right, role.id) - severityScore(left, role.id) || compareTasks(left, right))[0] || null;
    const roleStatus = getRoleStatus(role.id, dominantTask, activeTasks.length, supervisingTasks.length, roleDefs);
    return { id: role.id, name: role.name, title: role.title, status: roleStatus.status, statusLabel: roleStatus.statusLabel, phase: roleStatus.phase, activeTaskCount: activeTasks.length, supervisingCount: supervisingTasks.length, currentTid: dominantTask?.tid || "", currentGoal: dominantTask?.goal || "暂无任务", currentStateLabel: dominantTask?.stateLabel || "空闲", nextAction: dominantTask?.suggestedAction || "等待新的任务。", commandExample: dominantTask?.commandExample || "", timeline: dominantTask?.timeline || [], queue: activeTasks.slice(0, 3).map((task) => ({ tid: task.tid, goal: task.goal, state: task.runtimeState, stateLabel: task.stateLabel })) };
  });
}
function buildBoardColumns(tasks) {
  return BOARD_COLUMN_DEFS.map((column) => ({
    id: column.id,
    title: column.title,
    count: tasks.filter((task) => task.runtimeState === column.id).length,
    tasks: tasks.filter((task) => task.runtimeState === column.id).slice(0, 8).map((task) => ({ tid: task.tid, goal: task.goal, state: task.runtimeState, stateLabel: task.stateLabel, priority: task.priority, currentRoleLabel: task.currentRoleLabel, nextStep: task.nextStep, suggestedAction: task.suggestedAction, planLabel: task.planLabel, dependencyLabel: formatDependencyLabel(task.blockedBy) }))
  })).filter((column) => column.count > 0 || ["triage", "active", "blocked", "waiting_approval"].includes(column.id));
}
function buildRuntimeBoard(projectRoot) {
  const roleDefs = buildRoleDefinitions(projectRoot);
  const rolePatterns = buildRolePatterns(roleDefs);
  const tasksDir = path.join(projectRoot, "runtime", "tasks");
  const taskFiles = fs.existsSync(tasksDir) ? fs.readdirSync(tasksDir).filter((name) => name.toLowerCase().endsWith(".md")).map((name) => path.join(tasksDir, name)) : [];
  const tasks = taskFiles.map((filePath) => parseTaskFile(filePath, roleDefs, rolePatterns));
  applyDependencyState(tasks);
  tasks.forEach((task) => finalizeTask(task, roleDefs));
  annotateDependencyGraph(tasks);
  tasks.sort(compareTasks);
  const activeTasks = tasks.filter((task) => !["done", "cancelled"].includes(task.runtimeState));
  const blockedTasks = activeTasks.filter((task) => task.runtimeState === "blocked");
  const waitingTasks = activeTasks.filter((task) => task.runtimeState === "waiting_approval");
  const scopeChangedTasks = activeTasks.filter((task) => task.runtimeState === "scope_changed");
  const dependencyBlockedTasks = blockedTasks.filter((task) => task.dependencyBlocked);
  const tasksWithDependencies = tasks.filter((task) => task.dependencySummary.directDependencyCount > 0);
  const tasksBlockingOthers = tasks.filter((task) => task.dependencySummary.directDependentCount > 0);
  const missingDependencyCount = tasks.reduce((sum, task) => sum + task.dependencySummary.missingDependencyCount, 0);
  const focusTask = activeTasks.slice().sort(compareTasks)[0] || null;
  const activeRoleIds = Array.from(new Set(activeTasks.map((task) => task.currentRoleId).filter(Boolean).filter((roleId) => roleId !== "cos")));
  return {
    mode: "single-visible-bot",
    summary: { taskCount: tasks.length, activeTaskCount: activeTasks.length, blockedTaskCount: blockedTasks.length, waitingApprovalCount: waitingTasks.length, scopeChangedCount: scopeChangedTasks.length, dependencyBlockedCount: dependencyBlockedTasks.length, roleInFlightCount: activeRoleIds.length, tasksWithDependenciesCount: tasksWithDependencies.length, tasksBlockingOthersCount: tasksBlockingOthers.length, missingDependencyCount },
    hq: { visibleSpeaker: "CoS", currentFocusTid: focusTask?.tid || "", currentFocusRoleLabel: focusTask?.currentRoleLabel || "暂无", currentFocusStateLabel: focusTask?.stateLabel || "空闲", currentDirective: focusTask?.suggestedAction || "等待新的任务。", activeRoleCount: activeRoleIds.length, activeRoles: activeRoleIds.map((roleId) => ({ id: roleId, title: getRoleDisplayName(roleId, roleDefs) })) },
    interactionLoop: INTERACTION_LOOP,
    supervision: ["CoS 只保留一个对外声音，内部按角色接力。", "CTO 先把任务收敛成最小可执行 checklist，再交给 Builder。", "任务文件除了状态块，还要携带 priority、dependsOn 和 humanGate，方便恢复上下文。", "待批准不再只是元数据；waiting_approval 需要用 approve 或 reject 显式收口。", "看板优先暴露待批准、显式阻塞和范围变化；纯依赖阻塞会被标记，但不会抢走真正可推进任务的焦点。"],
    tasks: tasks.map((task) => ({ tid: task.tid, type: task.type, goal: task.goal, acceptance: task.acceptance, owner: task.owner, priority: task.priority, dependsOn: task.dependsOn, humanGate: task.humanGate, blockedBy: task.blockedBy, dependencyBlocked: task.dependencyBlocked, state: task.runtimeState, stateLabel: task.stateLabel, currentRoleId: task.currentRoleId, currentRoleLabel: task.currentRoleLabel, timelineNote: task.timelineNote, nextStep: task.nextStep, suggestedAction: task.suggestedAction, commandExample: task.commandExample, createdAt: task.createdAt, updatedAt: task.updatedAt, filePath: task.filePath, planLabel: task.planLabel, planDoneCount: task.planDoneCount, planTotal: task.planTotal, planNextItem: task.planNextItem, planItems: task.planItems, timeline: task.timeline, eventCount: task.eventCount, lastEvent: task.lastEvent, eventLog: task.eventLog, eventStateSource: task.eventStateSource, directDependencies: task.directDependencies, directDependents: task.directDependents, upstreamChain: task.upstreamChain, downstreamChain: task.downstreamChain, dependencySummary: task.dependencySummary })),
    boardColumns: buildBoardColumns(tasks),
    roleCards: buildRoleCards(tasks, roleDefs),
    hqStageStatus: blockedTasks.some((task) => task.explicitBlock) || waitingTasks.length > 0 ? "alert" : activeTasks.length > 0 ? "working" : "idle"
  };
}

module.exports = { buildRuntimeBoard };

