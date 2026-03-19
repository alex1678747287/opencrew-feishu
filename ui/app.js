/* Legacy mojibake constants removed. */

const PRESET_LABELS = {
  cos: "协作指挥官",
  cto: "技术负责人",
  builder: "执行构建者",
  ko: "知识运营",
  ops: "流程运营"
};

const SCRIPT_PLACEHOLDER = "生成后这里会显示 apply 脚本预览。";
const SCRIPT_IMPORTED_HINT = "已导入配置。重新点击“生成脚本与工作区”后，这里会刷新最新 apply 脚本。";
const SCRIPT_STALE_HINT = "配置已变更。重新点击“生成脚本与工作区”后，这里会刷新最新 apply 脚本。";

const state = {
  config: null,
  configDirty: false,
  defaults: null,
  generated: null,
  runtimeBoard: null,
  runtimeLastRefreshAt: 0,
  runtimeLastRefreshError: "",
  runtimeSelectedTid: "",
  runtimeRefreshInFlight: false,
  runtimeRefreshQueued: false,
  runtimeRefreshQueuedSilent: true
};

const elements = {
  addRole: document.getElementById("addRole"),
  activeRoleList: document.getElementById("activeRoleList"),
  approvalActor: document.getElementById("approvalActor"),
  approvalNext: document.getElementById("approvalNext"),
  approvalNote: document.getElementById("approvalNote"),
  attentionCount: document.getElementById("attentionCount"),
  attentionCountInline: document.getElementById("attentionCountInline"),
  boundCountInline: document.getElementById("boundCountInline"),
  builtinCount: document.getElementById("builtinCount"),
  boundCount: document.getElementById("boundCount"),
  configPreview: document.getElementById("configPreview"),
  coverageRate: document.getElementById("coverageRate"),
  customCount: document.getElementById("customCount"),
  customRate: document.getElementById("customRate"),
  checkpointCompleted: document.getElementById("checkpointCompleted"),
  checkpointNeedFromHuman: document.getElementById("checkpointNeedFromHuman"),
  checkpointNext: document.getElementById("checkpointNext"),
  checkpointRisk: document.getElementById("checkpointRisk"),
  checkpointStatus: document.getElementById("checkpointStatus"),
  closeoutChanged: document.getElementById("closeoutChanged"),
  closeoutEvidence: document.getElementById("closeoutEvidence"),
  closeoutNext: document.getElementById("closeoutNext"),
  closeoutOutcome: document.getElementById("closeoutOutcome"),
  closeoutRisk: document.getElementById("closeoutRisk"),
  createTaskAcceptance: document.getElementById("createTaskAcceptance"),
  createTaskButton: document.getElementById("createTaskButton"),
  createTaskDependsOn: document.getElementById("createTaskDependsOn"),
  createTaskGoal: document.getElementById("createTaskGoal"),
  createTaskHumanGate: document.getElementById("createTaskHumanGate"),
  createTaskOwner: document.getElementById("createTaskOwner"),
  createTaskPlan: document.getElementById("createTaskPlan"),
  createTaskPriority: document.getElementById("createTaskPriority"),
  createTaskType: document.getElementById("createTaskType"),
  downloadConfig: document.getElementById("downloadConfig"),
  downloadScript: document.getElementById("downloadScript"),
  editTaskAcceptance: document.getElementById("editTaskAcceptance"),
  editTaskDependsOn: document.getElementById("editTaskDependsOn"),
  editTaskGoal: document.getElementById("editTaskGoal"),
  editTaskHumanGate: document.getElementById("editTaskHumanGate"),
  editTaskOwner: document.getElementById("editTaskOwner"),
  editTaskPlan: document.getElementById("editTaskPlan"),
  editTaskPriority: document.getElementById("editTaskPriority"),
  editTaskType: document.getElementById("editTaskType"),
  enabledCount: document.getElementById("enabledCount"),
  generateAssets: document.getElementById("generateAssets"),
  handoffAsk: document.getElementById("handoffAsk"),
  handoffConstraints: document.getElementById("handoffConstraints"),
  handoffDoneWhen: document.getElementById("handoffDoneWhen"),
  handoffFrom: document.getElementById("handoffFrom"),
  handoffTo: document.getElementById("handoffTo"),
  hqActiveRoleCount: document.getElementById("hqActiveRoleCount"),
  hqActiveRoles: document.getElementById("hqActiveRoles"),
  hqFocusRole: document.getElementById("hqFocusRole"),
  hqFocusState: document.getElementById("hqFocusState"),
  hqFocusTid: document.getElementById("hqFocusTid"),
  hqStage: document.getElementById("hqStage"),
  hqStageHeadline: document.getElementById("hqStageHeadline"),
  hqStageHint: document.getElementById("hqStageHint"),
  hqVisibleSpeaker: document.getElementById("hqVisibleSpeaker"),
  importConfig: document.getElementById("importConfig"),
  interactionLoop: document.getElementById("interactionLoop"),
  nextAction: document.getElementById("nextAction"),
  openclawCmd: document.getElementById("openclawCmd"),
  opsMainConcern: document.getElementById("opsMainConcern"),
  opsNeededMitigation: document.getElementById("opsNeededMitigation"),
  opsVerdict: document.getElementById("opsVerdict"),
  outputScriptName: document.getElementById("outputScriptName"),
  overviewHint: document.getElementById("overviewHint"),
  planToggleDone: document.getElementById("planToggleDone"),
  planToggleIndex: document.getElementById("planToggleIndex"),
  planToggleList: document.getElementById("planToggleList"),
  projectName: document.getElementById("projectName"),
  readyCount: document.getElementById("readyCount"),
  readyCountInline: document.getElementById("readyCountInline"),
  rejectActor: document.getElementById("rejectActor"),
  rejectHumanGate: document.getElementById("rejectHumanGate"),
  rejectNext: document.getElementById("rejectNext"),
  rejectReason: document.getElementById("rejectReason"),
  resetDefaults: document.getElementById("resetDefaults"),
  roleCount: document.getElementById("roleCount"),
  roleCountInline: document.getElementById("roleCountInline"),
  roleList: document.getElementById("roleList"),
  roleRuntimeBoard: document.getElementById("roleRuntimeBoard"),
  roleTemplate: document.getElementById("roleTemplate"),
  runtimeActiveCount: document.getElementById("runtimeActiveCount"),
  runtimeActionMode: document.getElementById("runtimeActionMode"),
  runtimeAutoTargetHint: document.getElementById("runtimeAutoTargetHint"),
  runtimeAutoTargetTid: document.getElementById("runtimeAutoTargetTid"),
  runtimeBlockedCount: document.getElementById("runtimeBlockedCount"),
  runtimeFollowFocus: document.getElementById("runtimeFollowFocus"),
  runtimeRefreshButton: document.getElementById("runtimeRefreshButton"),
  runtimeRefreshLabel: document.getElementById("runtimeRefreshLabel"),
  runtimeModeApprove: document.getElementById("runtimeModeApprove"),
  runtimeModeBadge: document.getElementById("runtimeModeBadge"),
  runtimeModeCheckpoint: document.getElementById("runtimeModeCheckpoint"),
  runtimeModeCloseout: document.getElementById("runtimeModeCloseout"),
  runtimeModeHandoff: document.getElementById("runtimeModeHandoff"),
  runtimeModeMetadata: document.getElementById("runtimeModeMetadata"),
  runtimeModeOpsReview: document.getElementById("runtimeModeOpsReview"),
  runtimeModePlanToggle: document.getElementById("runtimeModePlanToggle"),
  runtimeModeReject: document.getElementById("runtimeModeReject"),
  runtimeScopeCount: document.getElementById("runtimeScopeCount"),
  runtimeSelectedTaskSummary: document.getElementById("runtimeSelectedTaskSummary"),
  runtimeTaskTargetCount: document.getElementById("runtimeTaskTargetCount"),
  runtimeTaskTargets: document.getElementById("runtimeTaskTargets"),
  runtimeTaskTid: document.getElementById("runtimeTaskTid"),
  runtimeWaitingCount: document.getElementById("runtimeWaitingCount"),
  saveConfig: document.getElementById("saveConfig"),
  scriptPreview: document.getElementById("scriptPreview"),
  statusBar: document.getElementById("statusBar"),
  supervisionList: document.getElementById("supervisionList"),
  taskBoard: document.getElementById("taskBoard"),
  taskCommandList: document.getElementById("taskCommandList"),
  applyRuntimeAction: document.getElementById("applyRuntimeAction")
};
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requestJson(url, options = {}) {
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  }).then(async (response) => {
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error("服务返回了无法识别的响应。");
    }

    if (!response.ok) {
      throw new Error(payload.error || "请求失败。");
    }

    return payload;
  });
}

function setStatus(message, kind = "") {
  elements.statusBar.textContent = message;
  elements.statusBar.className = `status ${kind}`.trim();
}

function formatRuntimeRefreshTime(timestamp) {
  if (!timestamp) {
    return "Not loaded yet";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function renderRuntimeRefreshLabel() {
  if (!elements.runtimeRefreshLabel || !elements.runtimeRefreshButton) {
    return;
  }

  if (state.runtimeRefreshInFlight) {
    elements.runtimeRefreshLabel.textContent = state.runtimeLastRefreshAt
      ? `Refreshing... last ok ${formatRuntimeRefreshTime(state.runtimeLastRefreshAt)}`
      : "Refreshing runtime board...";
    elements.runtimeRefreshButton.disabled = true;
    return;
  }

  elements.runtimeRefreshButton.disabled = false;

  if (state.runtimeLastRefreshError) {
    const suffix = state.runtimeLastRefreshAt
      ? ` Last ok ${formatRuntimeRefreshTime(state.runtimeLastRefreshAt)}`
      : "";
    elements.runtimeRefreshLabel.textContent = `Refresh failed.${suffix}`;
    return;
  }

  if (state.runtimeLastRefreshAt) {
    elements.runtimeRefreshLabel.textContent = `Last updated ${formatRuntimeRefreshTime(state.runtimeLastRefreshAt)}`;
    return;
  }

  elements.runtimeRefreshLabel.textContent = "Not loaded yet";
}

function setScriptPreview(content = SCRIPT_PLACEHOLDER, muted = true) {
  elements.scriptPreview.textContent = content;
  elements.scriptPreview.className = muted ? "code-block muted" : "code-block";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setRoleCardExpanded(card, expanded) {
  const detailBody = card.querySelector(".role-detail-body");
  const toggleButton = card.querySelector(".toggle-role-detail");

  card.classList.toggle("is-expanded", expanded);
  detailBody.hidden = !expanded;
  toggleButton.textContent = expanded ? "收起详情" : "展开详情";
}

function setText(selector, text) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}

function setPlaceholder(element, text) {
  if (element) {
    element.placeholder = text;
  }
}

function setFieldLabel(element, label) {
  const text = element?.closest(".field")?.querySelector("span");
  if (text) {
    text.textContent = label;
  }
}

function normalizeStaticCopy() {
  document.title = "OpenCrew Feishu 控制台";

  setText(".hero-copy .eyebrow", "OpenCrew x 飞书工作台");
  setText(".hero-copy h1", "角色协作控制台");
  setText(".hero-copy .lede", "用更少步骤完成角色编排、飞书会话绑定与脚本生成。先整理项目和角色，再统一生成 apply 脚本并预览结果。");

  const flowCards = document.querySelectorAll(".hero-flow .flow-card");
  if (flowCards[0]) {
    flowCards[0].querySelector("strong").textContent = "整理项目设置";
    flowCards[0].querySelector("p").textContent = "把项目名、OpenClaw 命令路径和输出脚本放到同一块配置。";
  }
  if (flowCards[1]) {
    flowCards[1].querySelector("strong").textContent = "启用目标角色";
    flowCards[1].querySelector("p").textContent = "只保留真正要落地的角色，未启用的角色不会进入生成结果。";
  }
  if (flowCards[2]) {
    flowCards[2].querySelector("strong").textContent = "补齐会话绑定后生成";
    flowCards[2].querySelector("p").textContent = "每个启用角色可填写多个飞书会话 ID，系统会统一生成最终 apply 脚本。";
  }

  const snapshotHead = document.querySelector(".snapshot-panel .panel-head");
  if (snapshotHead) {
    snapshotHead.querySelector("h2").textContent = "运行快照";
    snapshotHead.querySelector("p").textContent = "先看当前完成度和下一步，再决定是否生成。";
    snapshotHead.querySelector(".badge").textContent = "本地工作台";
  }
  const snapshotLabels = document.querySelectorAll(".snapshot-panel .summary-card .summary-label");
  ["角色总数", "已启用", "已配会话", "待处理"].forEach((label, index) => {
    if (snapshotLabels[index]) snapshotLabels[index].textContent = label;
  });
  setText(".snapshot-panel .insight-card .summary-label", "下一步建议");
  setText(".snapshot-panel .focus-strip-head span", "当前启用角色");

  const commandCenterHead = document.querySelector(".command-center-panel .panel-head");
  if (commandCenterHead) {
    commandCenterHead.querySelector("h2").textContent = "单机器人指挥台";
    commandCenterHead.querySelector("p").textContent = "飞书里只有一个可见机器人时，CoS 负责分诊、交接、监工和收口，其他角色作为内部执行阶段存在。";
    const badges = commandCenterHead.querySelectorAll(".badge");
    if (badges[1]) badges[1].textContent = "TID 驱动";
    if (badges[2]) badges[2].textContent = "角色接力";
  }
  const commandMiniLabels = document.querySelectorAll(".command-center-panel .mini-card .summary-label");
  ["活跃任务", "阻塞任务", "待批准", "范围变化"].forEach((label, index) => {
    if (commandMiniLabels[index]) commandMiniLabels[index].textContent = label;
  });
  const commandSubheads = document.querySelectorAll(".command-center-panel .panel-subhead");
  if (commandSubheads[0]) {
    commandSubheads[0].querySelector("h3").textContent = "内部交互链路";
    commandSubheads[0].querySelector("p").textContent = "一个对外机器人，多个内部角色通过任务块接力。网页会把这条接力链直接展开。";
  }
  if (commandSubheads[1]) {
    commandSubheads[1].querySelector("h3").textContent = "监工规则";
    commandSubheads[1].querySelector("p").textContent = "总指挥如何发指令、如何拉起人工、什么时候该收口，都在这里固定下来。";
  }
  if (commandSubheads[2]) {
    commandSubheads[2].querySelector("h3").textContent = "当前指挥动作";
    commandSubheads[2].querySelector("p").textContent = "这里展示 CoS 如何监工、该交给谁，以及下一条结构化指令该怎么发。";
  }

  const robotHead = document.querySelector(".robot-panel .panel-head");
  if (robotHead) {
    robotHead.querySelector("h2").textContent = "HQ 运行态";
    robotHead.querySelector("p").textContent = "机器人动画会跟随当前任务状态切换：空闲、执行、告警。";
  }
  const hqLabels = document.querySelectorAll(".hq-focus-grid .runtime-meta-card span");
  ["对外发言", "焦点任务", "当前执行", "执行状态"].forEach((label, index) => {
    if (hqLabels[index]) hqLabels[index].textContent = label;
  });
  setText(".hq-role-strip .focus-strip-head span", "当前内部执行角色");
  const robotSubhead = document.querySelector(".robot-panel .panel-subhead");
  if (robotSubhead) {
    robotSubhead.querySelector("h3").textContent = "角色执行状态";
    robotSubhead.querySelector("p").textContent = "每张卡都会显示当前角色是否空闲、在规划、执行、阻塞还是待批准。";
  }

  const liveTaskHead = document.querySelector(".live-task-panel .panel-head");
  if (liveTaskHead) {
    liveTaskHead.querySelector("h2").textContent = "任务流";
    liveTaskHead.querySelector("p").textContent = "根据 `runtime/tasks` 下的 TID 文件自动解析当前负责人、最新进度和建议指令。";
  }

  const runtimeWorkbenchHead = document.querySelector(".runtime-workbench-panel .panel-head");
  if (runtimeWorkbenchHead) {
    runtimeWorkbenchHead.querySelector("h2").textContent = "任务操作台";
    runtimeWorkbenchHead.querySelector("p").textContent = "不离开网页，直接创建 TID、交接角色、写进度、标记阻塞和收口任务。";
    const badges = runtimeWorkbenchHead.querySelectorAll(".badge");
    if (badges[0]) badges[0].textContent = "写入 runtime/tasks";
    if (badges[1]) badges[1].textContent = "单机器人调度";
  }

  const runtimeCards = document.querySelectorAll(".runtime-form-card");
  if (runtimeCards[0]) {
    const subhead = runtimeCards[0].querySelector(".panel-subhead");
    subhead.querySelector("h3").textContent = "新建任务";
    subhead.querySelector("p").textContent = "适合 CoS 发起中等及以上任务。创建后会自动进入指挥台。";
  }
  if (runtimeCards[1]) {
    const subhead = runtimeCards[1].querySelector(".panel-subhead");
    subhead.querySelector("h3").textContent = "推进任务";
    subhead.querySelector("p").textContent = "默认跟随 CoS 当前焦点任务。只有在要强制改写其他 TID 时，才需要手动覆盖。";
  }

  setFieldLabel(elements.createTaskType, "任务类型");
  setFieldLabel(elements.createTaskOwner, "初始负责人");
  setFieldLabel(elements.createTaskGoal, "任务目标");
  setFieldLabel(elements.createTaskAcceptance, "验收标准");
  setFieldLabel(elements.createTaskPriority, "优先级");
  setFieldLabel(elements.createTaskDependsOn, "依赖任务");
  setFieldLabel(elements.createTaskHumanGate, "人工审批点");
  setFieldLabel(elements.createTaskPlan, "Checklist");
  setPlaceholder(elements.createTaskGoal, "例如：梳理当前飞书群里的角色协作链路，并给出最小改造方案");
  setPlaceholder(elements.createTaskAcceptance, "例如：网页能看出 CoS、当前执行角色、阻塞原因和下一步");
  setPlaceholder(elements.createTaskDependsOn, "用逗号分隔 TID；没有就留空");
  setPlaceholder(elements.createTaskHumanGate, "例如：Builder 开始前需要 CoS 批准计划");
  setPlaceholder(elements.createTaskPlan, "一行一步，或直接粘贴 - [ ] checklist");
  elements.createTaskButton.textContent = "创建 TID";

  setText(".runtime-auto-target .summary-label", "默认作用到");
  setFieldLabel(elements.runtimeActionMode, "动作类型");
  setText(".runtime-follow-card span", "任务绑定");
  elements.runtimeFollowFocus.textContent = "跟随当前焦点";
  setText(".runtime-target-strip .focus-strip-head span", "覆盖目标任务");

  setFieldLabel(elements.handoffFrom, "来自");
  setFieldLabel(elements.handoffTo, "交给");
  setFieldLabel(elements.handoffAsk, "请求");
  setFieldLabel(elements.handoffConstraints, "约束");
  setFieldLabel(elements.handoffDoneWhen, "完成标准");
  setPlaceholder(elements.handoffAsk, "例如：收敛范围并给出最小执行计划");
  setPlaceholder(elements.handoffConstraints, "例如：保持单机器人对外口径");
  setPlaceholder(elements.handoffDoneWhen, "例如：一份可直接执行的短计划");

  setFieldLabel(elements.checkpointStatus, "状态");
  setFieldLabel(elements.checkpointNeedFromHuman, "人工依赖");
  setFieldLabel(elements.checkpointCompleted, "已完成");
  setFieldLabel(elements.checkpointNext, "下一步");
  setFieldLabel(elements.checkpointRisk, "风险");
  setPlaceholder(elements.checkpointNeedFromHuman, "没有就填 none");
  setPlaceholder(elements.checkpointCompleted, "例如：已确认边界并补全执行证据");
  setPlaceholder(elements.checkpointNext, "例如：交给 Builder 执行");
  setPlaceholder(elements.checkpointRisk, "没有就填 none");

  setFieldLabel(elements.editTaskType, "任务类型");
  setFieldLabel(elements.editTaskPriority, "优先级");
  setFieldLabel(elements.editTaskOwner, "负责人");
  setFieldLabel(elements.editTaskHumanGate, "人工审批点");
  setFieldLabel(elements.editTaskGoal, "任务目标");
  setFieldLabel(elements.editTaskAcceptance, "验收标准");
  setFieldLabel(elements.editTaskDependsOn, "依赖任务");
  setFieldLabel(elements.editTaskPlan, "Plan checklist");
  setPlaceholder(elements.editTaskOwner, "例如：HQ(CTO)");
  setPlaceholder(elements.editTaskHumanGate, "没有就填 none");
  setPlaceholder(elements.editTaskGoal, "直接改写当前任务目标");
  setPlaceholder(elements.editTaskAcceptance, "写清 done condition");
  setPlaceholder(elements.editTaskDependsOn, "多个 TID 用逗号分隔");

  setFieldLabel(elements.planToggleIndex, "清单项");
  setFieldLabel(elements.planToggleDone, "勾选状态");
  setFieldLabel(elements.approvalActor, "批准人");
  setFieldLabel(elements.approvalNext, "批准后下一步");
  setFieldLabel(elements.approvalNote, "批准说明");
  setPlaceholder(elements.approvalActor, "例如：Human / Ops / PM");
  setPlaceholder(elements.approvalNext, "例如：继续交给 Builder 执行");
  setPlaceholder(elements.approvalNote, "记录本次批准的条件或范围");

  setFieldLabel(elements.rejectActor, "驳回人");
  setFieldLabel(elements.rejectHumanGate, "新的人工审批点");
  setFieldLabel(elements.rejectReason, "驳回原因");
  setFieldLabel(elements.rejectNext, "驳回后下一步");
  setPlaceholder(elements.rejectActor, "例如：Human / Ops / PM");
  setPlaceholder(elements.rejectHumanGate, "例如：补证据后重新审批");
  setPlaceholder(elements.rejectReason, "写清为什么不能继续");
  setPlaceholder(elements.rejectNext, "例如：由 CoS 重新收敛并再提交");

  setFieldLabel(elements.opsVerdict, "结论");
  setFieldLabel(elements.opsMainConcern, "主要关注点");
  setFieldLabel(elements.opsNeededMitigation, "需要补救");
  setPlaceholder(elements.opsMainConcern, "例如：回滚条件还不清楚");
  setPlaceholder(elements.opsNeededMitigation, "例如：补一条健康检查与回滚步骤");

  setFieldLabel(elements.closeoutOutcome, "结果");
  setFieldLabel(elements.closeoutRisk, "剩余风险");
  setFieldLabel(elements.closeoutChanged, "变更内容");
  setFieldLabel(elements.closeoutEvidence, "证据");
  setFieldLabel(elements.closeoutNext, "下一步");
  setPlaceholder(elements.closeoutRisk, "没有就填 none");
  setPlaceholder(elements.closeoutChanged, "例如：完成运行态看板、监工链路和动画");
  setPlaceholder(elements.closeoutEvidence, "例如：API 校验通过，页面渲染正常");
  setPlaceholder(elements.closeoutNext, "例如：如需扩展，再由 CoS 开新 TID");

  const runtimeNotes = document.querySelectorAll(".runtime-form-card .runtime-inline-note");
  if (runtimeNotes[0]) runtimeNotes[0].textContent = "创建后任务会直接写入 `runtime/tasks/`，并自动刷新右侧指挥台与任务流。";
  if (runtimeNotes[1]) runtimeNotes[1].textContent = "这里只改任务头和 Plan checklist，不写新的事件块。";
  if (runtimeNotes[2]) runtimeNotes[2].textContent = "只切换 checklist 勾选状态；批量改计划内容请回到 Edit Metadata。";

  const workspacePanels = document.querySelectorAll(".workspace-grid .panel");
  if (workspacePanels[0]) {
    workspacePanels[0].querySelector(".panel-head h2").textContent = "项目设置";
    workspacePanels[0].querySelector(".panel-head p").textContent = "这里保存的是控制台配置，不会直接创建或覆盖现有 agent。";
  }
  if (workspacePanels[1]) {
    workspacePanels[1].querySelector(".panel-head h2").textContent = "操作中心";
    workspacePanels[1].querySelector(".panel-head p").textContent = "保存、导入导出与生成预览都集中在这里。";
    const badges = workspacePanels[1].querySelectorAll(".badge");
    if (badges[0]) badges[0].textContent = "导入 / 导出";
    if (badges[1]) badges[1].textContent = "生成预览";
  }
  setFieldLabel(elements.projectName, "项目名称");
  setFieldLabel(elements.openclawCmd, "OpenClaw 命令");
  setFieldLabel(elements.outputScriptName, "输出脚本名");
  elements.generateAssets.textContent = "生成脚本与工作区";
  elements.saveConfig.textContent = "保存配置";
  elements.resetDefaults.textContent = "恢复默认模板";
  elements.downloadConfig.textContent = "导出配置 JSON";
  elements.downloadScript.textContent = "下载生成脚本";
  const fileButton = document.querySelector(".file-button");
  if (fileButton) {
    fileButton.childNodes[fileButton.childNodes.length - 1].textContent = "导入配置";
  }

  const actionStats = document.querySelectorAll(".action-panel .mini-card .summary-label");
  ["预置模板", "自定义角色", "已就绪角色", "启用覆盖率"].forEach((label, index) => {
    if (actionStats[index]) actionStats[index].textContent = label;
  });

  const rolesHead = document.querySelector(".roles-panel .panel-head");
  if (rolesHead) {
    rolesHead.querySelector("h2").textContent = "角色配置";
    rolesHead.querySelector("p").textContent = "每个角色都是一张独立卡片。先决定是否启用，再补齐会话绑定与职责边界。";
  }
  elements.addRole.textContent = "新增自定义角色";
  const roleSummaryLabels = document.querySelectorAll(".role-summary-bar .mini-card .summary-label");
  ["总角色", "已绑定", "待补会话", "自定义占比"].forEach((label, index) => {
    if (roleSummaryLabels[index]) roleSummaryLabels[index].textContent = label;
  });

  const previewPanels = document.querySelectorAll(".preview-grid .panel");
  if (previewPanels[0]) {
    previewPanels[0].querySelector(".panel-head h2").textContent = "配置预览";
    previewPanels[0].querySelector(".panel-head p").textContent = "保存前先确认 JSON 结构是否符合预期。";
  }
  if (previewPanels[1]) {
    previewPanels[1].querySelector(".panel-head h2").textContent = "脚本预览";
    previewPanels[1].querySelector(".panel-head p").textContent = "生成后这里会显示 apply 脚本，你可以先检查再执行。";
  }
}

function markGeneratedStale() {
  state.configDirty = true;
  if (!state.generated) {
    return;
  }

  state.generated = null;
  setScriptPreview(SCRIPT_STALE_HINT);
}

function getPresetMap() {
  const roles = state.defaults?.roles || [];
  return Object.fromEntries(
    roles
      .filter((role) => role.mode === "builtin")
      .map((role) => [role.preset, clone(role)])
  );
}

function resolveBindingsInput(roleLike) {
  if (!roleLike) {
    return [];
  }

  return Array.isArray(roleLike.bindings)
    ? roleLike.bindings
    : (roleLike.bindings ?? roleLike.binding ?? []);
}

function reconcileBuiltins(config) {
  const presetMap = getPresetMap();
  const roles = Array.isArray(config.roles) ? config.roles : [];

  return {
    ...config,
    roles: roles.map((role) => {
      if (role.mode !== "builtin") {
        return {
          ...role,
          bindings: normalizeBindings(resolveBindingsInput(role)),
          responsibilities: Array.isArray(role.responsibilities) ? role.responsibilities : []
        };
      }

      const presetKey = presetMap[role.preset] ? role.preset : "cos";
      return {
        ...clone(presetMap[presetKey]),
        enabled: role.enabled !== false,
        bindings: normalizeBindings(resolveBindingsInput(role))
      };
    })
  };
}

function updateProjectFields() {
  elements.projectName.value = state.config?.projectName || "";
  elements.openclawCmd.value = state.config?.openclawCmd || "";
  elements.outputScriptName.value = state.config?.outputScriptName || "";
}

function readProjectFields() {
  state.config.projectName = elements.projectName.value.trim();
  state.config.openclawCmd = elements.openclawCmd.value.trim();
  state.config.outputScriptName = elements.outputScriptName.value.trim();
}

function nextCustomSeed() {
  const customRoles = (state.config?.roles || []).filter((role) => role.mode === "custom");
  return customRoles.length + 1;
}

function slugify(value, fallback = "custom-role") {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return slug || fallback;
}

function uniqueRoleId(candidate, ignoreIndex = -1) {
  const base = slugify(candidate, `custom-role-${nextCustomSeed()}`);
  const taken = new Set(
    (state.config?.roles || [])
      .map((role, index) => (index === ignoreIndex ? null : role.id))
      .filter(Boolean)
  );

  let nextId = base;
  let suffix = 2;

  while (taken.has(nextId)) {
    nextId = `${base}-${suffix}`;
    suffix += 1;
  }

  return nextId;
}

function createCustomRole(seed = {}) {
  const index = nextCustomSeed();
  return {
    id: uniqueRoleId(seed.id || `custom-role-${index}`),
    mode: "custom",
    preset: seed.preset || "cos",
    enabled: false,
    name: seed.name || `自定义角色 ${index}`,
    emoji: seed.emoji || "CR",
    role: seed.role || "待定义角色边界",
    vibe: seed.vibe || "先确认输入，再按边界交付结果；出现风险时及时同步。",
    mission: seed.mission || "围绕指定目标输出稳定、可复用、可检查的结果。",
    responsibilities: Array.isArray(seed.responsibilities) && seed.responsibilities.length > 0
      ? clone(seed.responsibilities)
      : [
          "接收明确输入并确认边界",
          "按时产出可交付结果",
          "同步风险、依赖和下一步建议"
        ],
    bindings: normalizeBindings(resolveBindingsInput(seed))
  };
}

function applyPresetToRole(role, presetKey) {
  const presetMap = getPresetMap();
  const preset = presetMap[presetKey] || presetMap.cos;
  const bindings = normalizeBindings(resolveBindingsInput(role));
  const enabled = role.enabled !== false;

  Object.assign(role, clone(preset), {
    enabled,
    bindings
  });
}

function joinResponsibilities(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function splitResponsibilities(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBindings(value) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || "").replace(/^feishu:/i, "").trim())
          .filter(Boolean)
      )
    );
  }

  return Array.from(
    new Set(
      String(value || "")
        .split(/\r?\n|[,;，；]/)
        .map((item) => String(item || "").replace(/^feishu:/i, "").trim())
        .filter(Boolean)
    )
  );
}

function joinBindings(value) {
  return normalizeBindings(value).join("\n");
}

function getPresetLabel(role) {
  return PRESET_LABELS[role.preset] || role.preset || "未选择模板";
}

function hasBinding(role) {
  return normalizeBindings(role.bindings).length > 0;
}

function getBindingCount(role) {
  return normalizeBindings(role.bindings).length;
}

function getBindingSummary(role, maxItems = 2) {
  const bindings = normalizeBindings(role.bindings);
  if (bindings.length === 0) {
    return "未填写";
  }

  if (bindings.length <= maxItems) {
    return bindings.join(" / ");
  }

  return `${bindings.slice(0, maxItems).join(" / ")} 等 ${bindings.length} 个`;
}

function formatRoleSummary(role) {
  const modeLabel = role.mode === "builtin"
    ? `预置模板 / ${getPresetLabel(role)}`
    : "自定义角色";
  const roleLabel = role.role || "待定义角色边界";
  const bindingCount = getBindingCount(role);
  const bindingLabel = bindingCount > 0
    ? `${bindingCount} 个会话`
    : (role.enabled !== false ? "待补会话 ID" : "未绑定");
  return `${modeLabel} / ${roleLabel} / ${bindingLabel}`;
}
function updateStats() {
  const roles = state.config?.roles || [];
  const enabledRoles = roles.filter((role) => role.enabled !== false);
  const boundRoles = roles.filter((role) => hasBinding(role));
  const readyRoles = enabledRoles.filter((role) => hasBinding(role));
  const attentionRoles = enabledRoles.filter((role) => !hasBinding(role));
  const customRoles = roles.filter((role) => role.mode === "custom");
  const builtinRoles = roles.filter((role) => role.mode === "builtin");
  const coverageRate = roles.length > 0
    ? `${Math.round((enabledRoles.length / roles.length) * 100)}%`
    : "0%";
  const customRate = roles.length > 0
    ? `${Math.round((customRoles.length / roles.length) * 100)}%`
    : "0%";

  elements.roleCount.textContent = String(roles.length);
  elements.roleCountInline.textContent = String(roles.length);
  elements.enabledCount.textContent = String(enabledRoles.length);
  elements.boundCount.textContent = String(boundRoles.length);
  elements.boundCountInline.textContent = String(boundRoles.length);
  elements.customCount.textContent = String(customRoles.length);
  elements.builtinCount.textContent = String(builtinRoles.length);
  elements.readyCount.textContent = String(readyRoles.length);
  elements.readyCountInline.textContent = String(readyRoles.length);
  elements.attentionCount.textContent = String(attentionRoles.length);
  elements.attentionCountInline.textContent = String(attentionRoles.length);
  elements.coverageRate.textContent = coverageRate;
  elements.customRate.textContent = customRate;

  if (roles.length === 0) {
    elements.nextAction.textContent = "先新增一个角色";
    elements.overviewHint.textContent = "添加角色卡片后，再决定哪些角色需要启用和绑定。";
  } else if (enabledRoles.length === 0) {
    elements.nextAction.textContent = "启用至少一个角色";
    elements.overviewHint.textContent = "只有启用的角色才会进入最终生成结果。";
  } else if (attentionRoles.length > 0) {
    elements.nextAction.textContent = `补齐 ${attentionRoles.length} 个启用角色的会话 ID`;
    elements.overviewHint.textContent = "缺少会话 ID 的启用角色无法通过生成校验。";
  } else if (!state.generated?.applyScript) {
    elements.nextAction.textContent = "当前配置已可生成";
    elements.overviewHint.textContent = "可以直接生成脚本与工作区，再检查右侧脚本预览。";
  } else {
    elements.nextAction.textContent = "检查脚本预览并执行 apply";
    elements.overviewHint.textContent = "预览无误后可下载脚本，或在终端里同步到 OpenClaw。";
  }

  elements.activeRoleList.innerHTML = "";
  if (enabledRoles.length === 0) {
    const chip = document.createElement("span");
    chip.className = "role-chip is-idle";
    chip.textContent = "暂无启用角色";
    elements.activeRoleList.appendChild(chip);
  } else {
    enabledRoles.forEach((role) => {
      const chip = document.createElement("span");
      chip.className = `role-chip ${hasBinding(role) ? "is-active" : "is-warning"}`;
      chip.textContent = role.name || role.id || "未命名角色";
      elements.activeRoleList.appendChild(chip);
    });
  }
}

function getRuntimeRoleChoices() {
  const configuredRoles = (state.config?.roles || [])
    .filter((role) => role.enabled !== false)
    .map((role) => ({
      id: role.id,
      label: role.name || role.id || "未命名角色"
    }));

  const fallbackRoles = [
    { id: "cos", label: "CoS" },
    { id: "cto", label: "CTO" },
    { id: "builder", label: "Builder" },
    { id: "ops", label: "Ops" },
    { id: "ko", label: "KO" }
  ];

  const choices = configuredRoles.length > 0 ? configuredRoles : fallbackRoles;
  const seen = new Set();

  return choices.filter((role) => {
    const key = `${role.id}:${role.label}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function syncSelectOptions(select, options, fallbackValue) {
  if (!select) {
    return;
  }

  const previousValue = select.value || fallbackValue || "";
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");

  const validValues = new Set(options.map((option) => option.value));
  select.value = validValues.has(previousValue)
    ? previousValue
    : (options[0]?.value || fallbackValue || "");
}

function syncRuntimeRoleOptions() {
  const roleChoices = getRuntimeRoleChoices();
  const ownerOptions = roleChoices.map((role) => ({
    value: `HQ(${role.label})`,
    label: `HQ(${role.label})`
  }));
  const handoffOptions = roleChoices.map((role) => ({
    value: role.label,
    label: role.label
  }));

  syncSelectOptions(elements.createTaskOwner, ownerOptions, "HQ(CoS)");
  syncSelectOptions(elements.handoffFrom, handoffOptions, "CoS");
  syncSelectOptions(elements.handoffTo, handoffOptions, handoffOptions[1]?.value || handoffOptions[0]?.value || "CoS");
}

function updatePreview() {
  readProjectFields();
  elements.configPreview.textContent = JSON.stringify(state.config, null, 2);
}

function runtimePillClass(status) {
  const normalized = String(status || "idle").toLowerCase();
  if (normalized === "active" || normalized === "on_track") {
    return "runtime-pill is-working";
  }
  if (normalized === "triage") {
    return "runtime-pill is-planning";
  }
  if (normalized === "done") {
    return "runtime-pill is-done";
  }
  if (normalized === "scope" || normalized === "scope_changed") {
    return "runtime-pill is-scope";
  }
  if (["working", "planning", "documenting", "reviewing", "supervising"].includes(normalized)) {
    return `runtime-pill is-${normalized}`;
  }
  if (normalized === "waiting_approval") {
    return "runtime-pill is-waiting";
  }
  if (["blocked", "alert", "waiting", "idle", "cancelled"].includes(normalized)) {
    return `runtime-pill is-${normalized}`;
  }
  return "runtime-pill is-idle";
}

function timelineToneClass(tone) {
  const normalized = String(tone || "neutral").toLowerCase();
  if (["working", "warning", "danger", "accent", "done", "neutral"].includes(normalized)) {
    return `runtime-timeline-item is-${normalized}`;
  }
  return "runtime-timeline-item is-neutral";
}

function renderTimeline(items, emptyText) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="runtime-empty compact">${escapeHtml(emptyText)}</div>`;
  }

  return `
    <div class="runtime-timeline">
      ${items.map((item) => `
        <article class="${timelineToneClass(item.tone)}">
          <span class="runtime-timeline-marker"></span>
          <div class="runtime-timeline-copy">
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.detail)}</p>
            ${item.meta ? `<span class="runtime-timeline-meta">${escapeHtml(item.meta)}</span>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function runtimeDependencyPillClass(item) {
  if (item?.missing) {
    return "runtime-pill is-blocked";
  }
  return runtimePillClass(item?.state);
}

function renderDependencyList(title, items, emptyText) {
  return `
    <article class="runtime-dependency-card">
      <div class="runtime-dependency-head">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(String(items.length))}</span>
      </div>
      ${items.length > 0 ? `
        <div class="runtime-dependency-list">
          ${items.map((item) => `
            <article class="runtime-dependency-item ${item.missing ? "is-missing" : ""}">
              <div class="runtime-dependency-copy">
                <div class="runtime-dependency-line">
                  <strong>${escapeHtml(item.tid)}</strong>
                  <span class="${runtimeDependencyPillClass(item)}">${escapeHtml(item.stateLabel || item.state || "unknown")}</span>
                </div>
                <p>${escapeHtml(item.goal || "未提供目标")}</p>
                <span class="runtime-timeline-meta">第 ${escapeHtml(String(item.depth || 1))} 层 · ${escapeHtml(item.currentRoleLabel || "未知角色")} · 下一步：${escapeHtml(item.nextStep || "等待更新")}</span>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<div class="runtime-empty compact">${escapeHtml(emptyText)}</div>`}
    </article>
  `;
}

function renderDependencyPanel(task) {
  if (!task) {
    return "";
  }

  const summary = task.dependencySummary || {};
  const blockerText = task.dependencyBlocked && Array.isArray(task.blockedBy) && task.blockedBy.length > 0
    ? `当前阻塞来源：${task.blockedBy.map((item) => item.tid).join(", ")}`
    : summary.directDependencyCount > 0
      ? "当前任务存在依赖，但现在不处于依赖阻塞。"
      : "当前任务不依赖其他任务。";

  return `
    <div class="runtime-dependency-grid">
      <article class="runtime-dependency-card">
        <div class="runtime-dependency-head">
          <strong>依赖摘要</strong>
          <span>${escapeHtml(task.tid)}</span>
        </div>
        <div class="runtime-meta-grid">
          <article class="runtime-meta-card">
            <span>直接上游</span>
            <strong>${escapeHtml(String(summary.directDependencyCount || 0))}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>直接下游</span>
            <strong>${escapeHtml(String(summary.directDependentCount || 0))}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>上游链路</span>
            <strong>${escapeHtml(String(summary.upstreamCount || 0))}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>下游链路</span>
            <strong>${escapeHtml(String(summary.downstreamCount || 0))}</strong>
          </article>
        </div>
        <p class="runtime-task-meta">${escapeHtml(blockerText)}</p>
      </article>
      ${renderDependencyList("上游链路", Array.isArray(task.upstreamChain) ? task.upstreamChain : [], "没有上游依赖。")}
      ${renderDependencyList("下游影响", Array.isArray(task.downstreamChain) ? task.downstreamChain : [], "当前没有其他任务依赖它。")}
    </div>
  `;
}

function runtimeEventModeLabel(mode) {
  const labels = {
    create: "创建",
    handoff: "交接",
    checkpoint: "进度",
    "edit-metadata": "改任务头",
    "toggle-plan": "改清单",
    approve: "批准",
    reject: "驳回",
    "ops-review": "审查",
    closeout: "结项"
  };

  return labels[mode] || mode || "未知";
}

function renderEventPanel(task) {
  if (!task) {
    return "";
  }

  const events = Array.isArray(task.eventLog) ? task.eventLog.slice(-5).reverse() : [];
  const lastEvent = task.lastEvent || null;
  return `
    <div class="runtime-dependency-grid">
      <article class="runtime-dependency-card">
        <div class="runtime-dependency-head">
          <strong>审计事件</strong>
          <span>${escapeHtml(String(task.eventCount || 0))}</span>
        </div>
        <div class="runtime-meta-grid">
          <article class="runtime-meta-card">
            <span>最近动作</span>
            <strong>${escapeHtml(runtimeEventModeLabel(lastEvent?.mode))}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>最近状态</span>
            <strong>${escapeHtml(lastEvent?.state || task.state || "unknown")}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>状态来源</span>
            <strong>${escapeHtml(task.eventStateSource === "event-log" ? "事件归约" : "头字段")}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>最近时间</span>
            <strong>${escapeHtml(lastEvent?.ts || "暂无")}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>清单进度</span>
            <strong>${escapeHtml(`${task.planDoneCount || 0}/${task.planTotal || 0}`)}</strong>
          </article>
        </div>
        <p class="runtime-task-meta">${escapeHtml(lastEvent?.summary || "当前任务还没有审计事件。")}</p>
      </article>
      <article class="runtime-dependency-card">
        <div class="runtime-dependency-head">
          <strong>最近 5 条事件</strong>
          <span>${escapeHtml(String(events.length))}</span>
        </div>
        ${events.length > 0 ? `
          <div class="runtime-dependency-list">
            ${events.map((event) => `
              <article class="runtime-dependency-item">
                <div class="runtime-dependency-copy">
                  <div class="runtime-dependency-line">
                    <strong>${escapeHtml(runtimeEventModeLabel(event.mode))}</strong>
                    <span class="runtime-pill is-active">${escapeHtml(event.state || "unknown")}</span>
                  </div>
                  <p>${escapeHtml(event.summary || "无摘要")}</p>
                  <span class="runtime-timeline-meta">${escapeHtml(event.ts || "未知时间")}</span>
                </div>
              </article>
            `).join("")}
          </div>
        ` : '<div class="runtime-empty compact">当前还没有事件日志。</div>'}
      </article>
    </div>
  `;
}

function renderTaskSignals(task) {
  if (!task) {
    return "";
  }

  const signals = [
    task.priority || "P2",
    task.planLabel && task.planTotal > 0 ? task.planLabel : "",
    task.dependencySummary?.directDependencyCount > 0 ? `${task.dependencySummary.directDependencyCount} 个上游依赖` : "",
    task.dependencySummary?.directDependentCount > 0 ? `${task.dependencySummary.directDependentCount} 个下游任务` : "",
    task.eventCount > 0 ? `${task.eventCount} 条事件` : "",
    task.eventStateSource === "event-log" ? "事件归约状态" : "",
    task.humanGate && task.humanGate !== "none" ? task.humanGate : "",
    Array.isArray(task.blockedBy) && task.blockedBy.length > 0 ? task.blockedBy.map((item) => item.tid).join(", ") : ""
  ].filter(Boolean);

  if (signals.length === 0) {
    return "";
  }

  return '<div class="runtime-signal-row">' + signals
    .map((signal) => '<span class="runtime-signal">' + escapeHtml(signal) + '</span>')
    .join("") + '</div>';
}

function renderPlanPreview(task, maxItems = 4) {
  if (!Array.isArray(task?.planItems) || task.planItems.length === 0) {
    return "";
  }

  const items = task.planItems.slice(0, maxItems);
  return '<div class="runtime-plan-preview">' + items
    .map((item) => '<span class="runtime-plan-check' + (item.done ? ' is-done' : '') + '">' + (item.done ? 'done' : 'todo') + '</span><span>' + escapeHtml(item.text) + '</span>')
    .join("") + '</div>';
}

function getRuntimeTasks(board = state.runtimeBoard) {
  return Array.isArray(board?.tasks) ? board.tasks : [];
}

function getRuntimeTaskByTid(tid, board = state.runtimeBoard) {
  return getRuntimeTasks(board).find((task) => task.tid === tid) || null;
}

function getRuntimeFocusTid(board = state.runtimeBoard) {
  const tasks = getRuntimeTasks(board);
  const activeTasks = tasks.filter((task) => !["done", "cancelled"].includes(task.state));

  return board?.hq?.currentFocusTid
    || activeTasks[0]?.tid
    || tasks[0]?.tid
    || "";
}

function ensureRuntimeSelectedTid(board = state.runtimeBoard) {
  const tasks = getRuntimeTasks(board);
  const hasSelected = tasks.some((task) => task.tid === state.runtimeSelectedTid);

  if (!hasSelected) {
    state.runtimeSelectedTid = getRuntimeFocusTid(board);
  }

  return state.runtimeSelectedTid;
}

function setRuntimeSelectedTid(tid, { silent = false } = {}) {
  state.runtimeSelectedTid = tid || getRuntimeFocusTid(state.runtimeBoard);

  if (elements.runtimeTaskTid) {
    elements.runtimeTaskTid.value = state.runtimeSelectedTid || "";
  }

  if (state.runtimeBoard) {
    renderRuntimeBoard();
  }

  if (!silent && state.runtimeSelectedTid) {
    setStatus(`当前任务焦点已切换到 ${state.runtimeSelectedTid}。`, "ok");
  }
}

function getRuntimeTargetTask(board = state.runtimeBoard) {
  const selectedTid = ensureRuntimeSelectedTid(board);
  return getRuntimeTaskByTid(selectedTid, board);
}

function runtimeActionLabel(mode) {
  const labels = {
    handoff: "写入交接",
    checkpoint: "写入进度",
    "edit-metadata": "更新任务头",
    "toggle-plan": "更新清单",
    approve: "写入批准",
    reject: "写入驳回",
    "ops-review": "写入审查",
    closeout: "写入结项"
  };

  return labels[mode] || "写入任务动作";
}

function syncRuntimeModePanel() {
  const mode = elements.runtimeActionMode?.value || "handoff";

  elements.runtimeModeHandoff.hidden = mode !== "handoff";
  elements.runtimeModeCheckpoint.hidden = mode !== "checkpoint";
  elements.runtimeModeMetadata.hidden = mode !== "edit-metadata";
  elements.runtimeModePlanToggle.hidden = mode !== "toggle-plan";
  elements.runtimeModeApprove.hidden = mode !== "approve";
  elements.runtimeModeReject.hidden = mode !== "reject";
  elements.runtimeModeOpsReview.hidden = mode !== "ops-review";
  elements.runtimeModeCloseout.hidden = mode !== "closeout";

  if (mode === "toggle-plan") {
    syncPlanToggleSelection();
  }

  elements.applyRuntimeAction.textContent = runtimeActionLabel(mode);
}

function renderRuntimeTargetControls(board = state.runtimeBoard) {
  const tasks = getRuntimeTasks(board);
  const focusTid = getRuntimeFocusTid(board);
  const selectedTid = ensureRuntimeSelectedTid(board);
  const targetTask = getRuntimeTaskByTid(selectedTid, board);
  const focusTask = getRuntimeTaskByTid(focusTid, board);
  const targetPool = tasks.filter((task) => !["done", "cancelled"].includes(task.state));
  const visibleTargets = (targetPool.length > 0 ? targetPool : tasks).slice(0, 6);

  elements.runtimeTaskTid.innerHTML = tasks.length > 0
    ? tasks.map((task) => `<option value="${escapeHtml(task.tid)}">${escapeHtml(task.tid)} 路 ${escapeHtml(task.goal)}</option>`).join("")
    : '<option value="">暂无可用任务</option>';
  elements.runtimeTaskTid.value = selectedTid || "";

  elements.runtimeTaskTargetCount.textContent = String(visibleTargets.length);
  elements.runtimeTaskTargets.innerHTML = visibleTargets.length > 0
    ? visibleTargets.map((task) => `
        <button
          class="role-chip runtime-task-chip ${task.tid === selectedTid ? "is-active" : ""}"
          type="button"
          data-runtime-tid="${escapeHtml(task.tid)}"
        >${escapeHtml(task.tid)}</button>
      `).join("")
    : '<span class="role-chip is-idle">暂无任务</span>';

  elements.runtimeAutoTargetTid.textContent = focusTask?.tid || "暂无焦点任务";
  if (!focusTask) {
    elements.runtimeAutoTargetHint.textContent = "当前没有活跃任务时，先在左侧创建一个 TID。";
  } else if (selectedTid && selectedTid !== focusTid) {
    elements.runtimeAutoTargetHint.textContent = `当前正在覆盖 ${selectedTid}；点击“跟随当前焦点”可恢复自动。`;
  } else {
    elements.runtimeAutoTargetHint.textContent = `${focusTask.currentRoleLabel} 正在处理，默认动作会直接写到这个任务。`;
  }

  elements.runtimeSelectedTaskSummary.innerHTML = targetTask
    ? `
      <article class="runtime-target-summary-card">
        <div class="runtime-target-summary-head">
          <div>
            <strong>${escapeHtml(targetTask.tid)}</strong>
            <p>${escapeHtml(targetTask.goal)}</p>
          </div>
          <span class="${runtimePillClass(targetTask.state)}">${escapeHtml(targetTask.stateLabel)}</span>
        </div>
        ${renderTaskSignals(targetTask)}
        <div class="runtime-meta-grid">
          <article class="runtime-meta-card">
            <span>当前负责人</span>
            <strong>${escapeHtml(targetTask.owner || "HQ(CoS)")}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>当前动作角色</span>
            <strong>${escapeHtml(targetTask.currentRoleLabel)}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>下一步</span>
            <strong>${escapeHtml(targetTask.nextStep)}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>优先级</span>
            <strong>${escapeHtml(targetTask.priority || "P2")}</strong>
          </article>
          <article class="runtime-meta-card">
            <span>Checklist</span>
            <strong>${escapeHtml(targetTask.planLabel || "No checklist yet")}</strong>
          </article>
        </div>
        ${renderPlanPreview(targetTask)}
        <p>${escapeHtml(targetTask.suggestedAction)}</p>
        ${renderDependencyPanel(targetTask)}
        ${renderEventPanel(targetTask)}
      </article>
    `
    : '<div class="runtime-empty compact">当前没有可推进的任务。</div>';

  for (const button of elements.runtimeTaskTargets.querySelectorAll("[data-runtime-tid]")) {
    button.addEventListener("click", () => {
      setRuntimeSelectedTid(button.dataset.runtimeTid);
    });
  }

  syncRuntimeTaskEditor(targetTask);
}

function collectCreateTaskPayload() {
  return {
    type: elements.createTaskType.value,
    priority: elements.createTaskPriority.value,
    owner: elements.createTaskOwner.value,
    goal: elements.createTaskGoal.value.trim(),
    acceptance: elements.createTaskAcceptance.value.trim(),
    dependsOn: elements.createTaskDependsOn.value.trim(),
    humanGate: elements.createTaskHumanGate.value.trim() || "none",
    plan: elements.createTaskPlan.value.trim()
  };
}

function runtimePlanText(task) {
  if (!Array.isArray(task?.planItems) || task.planItems.length === 0) {
    return "";
  }

  return task.planItems
    .map((item) => `- [${item.done ? "x" : " "}] ${item.text}`)
    .join("\n");
}

function setInputValue(element, value = "") {
  if (!element) {
    return;
  }

  element.value = value == null ? "" : String(value);
}

function syncPlanToggleSelection(task = getRuntimeTargetTask()) {
  const planItems = Array.isArray(task?.planItems) ? task.planItems : [];
  if (planItems.length === 0) {
    elements.planToggleDone.value = "todo";
    return;
  }

  const selectedIndex = Number(elements.planToggleIndex.value || "0");
  const selectedItem = planItems[selectedIndex] || planItems[0];
  elements.planToggleDone.value = selectedItem.done ? "done" : "todo";
}

function syncRuntimeTaskEditor(task = getRuntimeTargetTask()) {
  const planItems = Array.isArray(task?.planItems) ? task.planItems : [];
  const dependsOnValue = Array.isArray(task?.dependsOn) ? task.dependsOn.join(", ") : "";
  const humanGateValue = task?.humanGate && task.humanGate !== "none" ? task.humanGate : "";
  const nextStep = task?.nextStep || "";

  setInputValue(elements.editTaskType, task?.type || "A");
  setInputValue(elements.editTaskPriority, task?.priority || "P2");
  setInputValue(elements.editTaskOwner, task?.owner || "HQ(CoS)");
  setInputValue(elements.editTaskGoal, task?.goal || "");
  setInputValue(elements.editTaskAcceptance, task?.acceptance || "");
  setInputValue(elements.editTaskDependsOn, dependsOnValue);
  setInputValue(elements.editTaskHumanGate, humanGateValue);
  setInputValue(elements.editTaskPlan, runtimePlanText(task));

  setInputValue(elements.approvalActor, "Human");
  setInputValue(elements.approvalNote, "");
  setInputValue(elements.approvalNext, nextStep);
  setInputValue(elements.rejectActor, "Human");
  setInputValue(elements.rejectReason, "");
  setInputValue(elements.rejectNext, nextStep || "CoS re-scope and resubmit");
  setInputValue(elements.rejectHumanGate, humanGateValue);

  elements.planToggleList.innerHTML = planItems.length > 0
    ? planItems.map((item, index) => `
        <article class="runtime-plan-toggle-item ${item.done ? "is-done" : ""}">
          <span class="runtime-plan-toggle-index">#${String(index + 1).padStart(2, "0")}</span>
          <div class="runtime-plan-toggle-copy">
            <strong>${item.done ? "done" : "todo"}</strong>
            <p>${escapeHtml(item.text)}</p>
          </div>
        </article>
      `).join("")
    : '<div class="runtime-empty compact">当前任务还没有 checklist。</div>';

  elements.planToggleIndex.innerHTML = planItems.length > 0
    ? planItems.map((item, index) => `<option value="${index}">#${String(index + 1).padStart(2, "0")} · ${escapeHtml(item.text)}</option>`).join("")
    : '<option value="">暂无 checklist</option>';

  if (planItems.length > 0) {
    const currentValue = elements.planToggleIndex.value;
    const nextValue = planItems.some((item, index) => String(index) === currentValue) ? currentValue : "0";
    elements.planToggleIndex.value = nextValue;
    syncPlanToggleSelection(task);
  } else {
    elements.planToggleIndex.value = "";
    elements.planToggleDone.value = "todo";
  }
}

function collectRuntimeActionPayload() {
  const mode = elements.runtimeActionMode.value;

  if (mode === "handoff") {
    return {
      mode,
      from: elements.handoffFrom.value,
      to: elements.handoffTo.value,
      ask: elements.handoffAsk.value.trim() || "none",
      constraints: elements.handoffConstraints.value.trim() || "none",
      doneWhen: elements.handoffDoneWhen.value.trim() || "none"
    };
  }

  if (mode === "checkpoint") {
    return {
      mode,
      status: elements.checkpointStatus.value,
      completed: elements.checkpointCompleted.value.trim() || "none",
      next: elements.checkpointNext.value.trim() || "none",
      risk: elements.checkpointRisk.value.trim() || "none",
      needFromHuman: elements.checkpointNeedFromHuman.value.trim() || "none"
    };
  }

  if (mode === "edit-metadata") {
    const goal = elements.editTaskGoal.value.trim();
    if (!goal) {
      throw new Error("任务目标不能为空。")
    }

    return {
      mode,
      type: elements.editTaskType.value,
      priority: elements.editTaskPriority.value,
      owner: elements.editTaskOwner.value.trim() || "HQ(CoS)",
      goal,
      acceptance: elements.editTaskAcceptance.value.trim() || "Define a clear done condition",
      dependsOn: elements.editTaskDependsOn.value.trim(),
      humanGate: elements.editTaskHumanGate.value.trim() || "none",
      plan: elements.editTaskPlan.value.trim()
    };
  }

  if (mode === "toggle-plan") {
    const indexValue = elements.planToggleIndex.value;
    if (!indexValue) {
      throw new Error("当前任务还没有 checklist 可切换。")
    }

    return {
      mode,
      index: Number(indexValue),
      done: elements.planToggleDone.value === "done"
    };
  }

  if (mode === "approve") {
    return {
      mode,
      actor: elements.approvalActor.value.trim() || "Human",
      note: elements.approvalNote.value.trim() || "Approved",
      next: elements.approvalNext.value.trim() || "Continue execution"
    };
  }

  if (mode === "reject") {
    return {
      mode,
      actor: elements.rejectActor.value.trim() || "Human",
      reason: elements.rejectReason.value.trim() || "Rejected",
      next: elements.rejectNext.value.trim() || "CoS re-scope and resubmit",
      humanGate: elements.rejectHumanGate.value.trim() || "re-approval required"
    };
  }

  if (mode === "ops-review") {
    return {
      mode,
      verdict: elements.opsVerdict.value,
      mainConcern: elements.opsMainConcern.value.trim() || "none",
      neededMitigation: elements.opsNeededMitigation.value.trim() || "none"
    };
  }

  return {
    mode,
    outcome: elements.closeoutOutcome.value,
    changed: elements.closeoutChanged.value.trim() || "none",
    evidence: elements.closeoutEvidence.value.trim() || "none",
    risk: elements.closeoutRisk.value.trim() || "none",
    next: elements.closeoutNext.value.trim() || "none"
  };
}
function renderRuntimeBoard() {
  const board = state.runtimeBoard;
  if (!board) {
    state.runtimeSelectedTid = "";
    elements.runtimeActiveCount.textContent = "0";
    elements.runtimeBlockedCount.textContent = "0";
    elements.runtimeWaitingCount.textContent = "0";
    elements.runtimeScopeCount.textContent = "0";
    elements.runtimeModeBadge.textContent = "单机器人";
    elements.interactionLoop.innerHTML = '<div class="runtime-empty">内部协作链路尚未加载。</div>';
    elements.supervisionList.innerHTML = '<div class="runtime-empty">运行规则尚未加载。</div>';
    elements.taskCommandList.innerHTML = '<div class="runtime-empty">暂无调度建议。</div>';
    elements.roleRuntimeBoard.innerHTML = '<div class="runtime-empty">暂无角色运行数据。</div>';
    elements.taskBoard.innerHTML = '<div class="runtime-empty">`runtime/tasks` 里还没有任务文件。</div>';
    if (state.runtimeRefreshInFlight) {
      elements.taskBoard.innerHTML = '<div class="runtime-empty is-loading">Loading runtime board...</div>';
    }
    elements.hqVisibleSpeaker.textContent = "CoS";
    elements.hqFocusTid.textContent = "暂无";
    elements.hqFocusRole.textContent = "暂无";
    elements.hqFocusState.textContent = "空闲";
    elements.hqActiveRoleCount.textContent = "0";
    elements.hqActiveRoles.innerHTML = '<span class="role-chip is-idle">暂无内部执行角色</span>';
    elements.runtimeTaskTid.innerHTML = '<option value="">暂无可用任务</option>';
    elements.runtimeTaskTargetCount.textContent = "0";
    elements.runtimeTaskTargets.innerHTML = '<span class="role-chip is-idle">暂无任务</span>';
    elements.runtimeAutoTargetTid.textContent = "暂无焦点任务";
    elements.runtimeAutoTargetHint.textContent = "当前没有活跃任务时，先在左侧创建一个 TID。";
    elements.runtimeSelectedTaskSummary.innerHTML = '<div class="runtime-empty compact">当前没有可推进的任务。</div>';
    elements.hqStage.dataset.stage = "idle";
    elements.hqStageHeadline.textContent = "暂无活跃任务";
    elements.hqStageHint.textContent = "创建 TID 后，这里会显示当前总指挥的监工状态。";
    syncRuntimeTaskEditor(null);
    syncRuntimeModePanel();
    renderRuntimeRefreshLabel();
    return;
  }

  const selectedTid = ensureRuntimeSelectedTid(board);

  elements.runtimeModeBadge.textContent = board.mode === "single-visible-bot" ? "单机器人" : board.mode;
  elements.runtimeActiveCount.textContent = String(board.summary.activeTaskCount);
  elements.runtimeBlockedCount.textContent = String(board.summary.blockedTaskCount);
  elements.runtimeWaitingCount.textContent = String(board.summary.waitingApprovalCount);
  elements.runtimeScopeCount.textContent = String(board.summary.scopeChangedCount);

  elements.interactionLoop.innerHTML = board.interactionLoop
    .map((item, index) => `
      <article class="interaction-step">
        <span class="interaction-step-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="interaction-step-copy">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.description)}</p>
        </div>
        <span class="interaction-step-signal">${escapeHtml(item.signal)}</span>
      </article>
    `)
    .join("");

  elements.supervisionList.innerHTML = board.supervision
    .map((item, index) => `
      <article class="logic-item">
        <span class="logic-index">${String(index + 1).padStart(2, "0")}</span>
        <p>${escapeHtml(item)}</p>
      </article>
    `)
    .join("");

  elements.hqVisibleSpeaker.textContent = board.hq?.visibleSpeaker || "CoS";
  elements.hqFocusTid.textContent = board.hq?.currentFocusTid || "暂无";
  elements.hqFocusRole.textContent = board.hq?.currentFocusRoleLabel || "暂无";
  elements.hqFocusState.textContent = board.hq?.currentFocusStateLabel || "空闲";
  elements.hqActiveRoleCount.textContent = String(board.hq?.activeRoleCount || 0);
  elements.hqActiveRoles.innerHTML = Array.isArray(board.hq?.activeRoles) && board.hq.activeRoles.length > 0
    ? board.hq.activeRoles
      .map((role) => `<span class="role-chip is-active">${escapeHtml(role.title)}</span>`)
      .join("")
    : '<span class="role-chip is-idle">暂无内部执行角色</span>';
  renderRuntimeTargetControls(board);
  syncRuntimeModePanel();

  const visibleTasks = board.tasks
    .filter((task) => !["done", "cancelled"].includes(task.state))
    .slice(0, 3);
  elements.taskCommandList.innerHTML = visibleTasks.length > 0
    ? visibleTasks.map((task) => `
        <article class="task-command-card runtime-selectable ${task.tid === selectedTid ? "is-selected" : ""}" data-runtime-tid="${escapeHtml(task.tid)}">
          <div class="task-command-head">
            <div class="task-command-title">
              <strong>${escapeHtml(task.tid)}</strong>
              <p>${escapeHtml(task.goal)}</p>
            </div>
            <span class="${runtimePillClass(task.state)}">${escapeHtml(task.stateLabel)}</span>
          </div>
          ${renderTaskSignals(task)}
          <div class="runtime-meta-grid">
            <article class="runtime-meta-card">
              <span>当前负责人</span>
              <strong>${escapeHtml(task.owner || "HQ(CoS)")}</strong>
            </article>
            <article class="runtime-meta-card">
              <span>当前动作角色</span>
              <strong>${escapeHtml(task.currentRoleLabel)}</strong>
            </article>
            <article class="runtime-meta-card">
              <span>下一步</span>
              <strong>${escapeHtml(task.nextStep)}</strong>
            </article>
          </div>
          ${task.dependencyBlocked ? '<p class="runtime-task-meta">Blocked by: ' + escapeHtml(task.blockedBy.map((item) => item.tid).join(", ")) + '</p>' : ""}
          ${renderPlanPreview(task, 3)}
          <p>${escapeHtml(task.suggestedAction)}</p>
          ${renderTimeline(task.timeline, "当前还没有内部交互事件。")}
          <span class="runtime-example-label">建议操作模板</span>
          <pre class="runtime-command-example">${escapeHtml(task.commandExample)}</pre>
        </article>
      `).join("")
    : '<div class="runtime-empty">当前没有活跃任务。先用 `new-hq-task.ps1` 创建一个 TID，再用 `update-hq-task.ps1` 推进交接和进度。</div>';

  elements.hqStage.dataset.stage = board.hqStageStatus || "idle";
  if (board.summary.activeTaskCount === 0) {
    elements.hqStageHeadline.textContent = "暂无活跃任务";
    elements.hqStageHint.textContent = "当前没有需要 CoS 监工的任务。";
  } else if (board.hqStageStatus === "alert") {
    elements.hqStageHeadline.textContent = "总指挥正在处理阻塞或待批准事项";
    elements.hqStageHint.textContent = "优先解除阻塞、请求人工批准，避免 Builder 和 CTO 空转。";
  } else {
    elements.hqStageHeadline.textContent = `总指挥正在监工 ${board.summary.activeTaskCount} 个任务`;
    elements.hqStageHint.textContent = "CoS 对外统一发声，内部按角色接力推进。";
  }

  elements.roleRuntimeBoard.innerHTML = board.roleCards
    .map((role) => {
      const queueHtml = role.queue.length > 0
        ? role.queue.map((item) => `
            <article class="runtime-role-queue-item">
              <div>
                <strong>${escapeHtml(item.tid)}</strong>
                <p>${escapeHtml(item.goal)}</p>
              </div>
              <span class="${runtimePillClass(item.state)}">${escapeHtml(item.stateLabel)}</span>
            </article>
          `).join("")
        : '<div class="runtime-empty">当前没有排队任务。</div>';

      return `
        <article class="runtime-role-card">
          <div class="runtime-role-head">
            <div class="runtime-role-title">
              <strong>${escapeHtml(role.title)}</strong>
              <p>${escapeHtml(role.phase)}</p>
            </div>
            <span class="${runtimePillClass(role.status)}">${escapeHtml(role.statusLabel)}</span>
          </div>
          <div class="runtime-meta-grid">
            <article class="runtime-meta-card">
              <span>当前任务</span>
              <strong>${escapeHtml(role.currentTid || "暂无")}</strong>
            </article>
            <article class="runtime-meta-card">
              <span>任务数量</span>
              <strong>${role.id === "cos"
                ? escapeHtml(String(role.supervisingCount))
                : escapeHtml(String(role.activeTaskCount))}</strong>
            </article>
          </div>
          <p>${escapeHtml(role.nextAction)}</p>
          ${renderTimeline((role.timeline || []).slice(-2), "等待首个运行事件。")}
          <div class="runtime-role-queue">${queueHtml}</div>
        </article>
      `;
    })
    .join("");

  elements.taskBoard.innerHTML = board.tasks.length > 0
    ? `
      <div class="runtime-kanban">
        ${board.boardColumns.map((column) => `
          <section class="runtime-kanban-column">
            <div class="runtime-kanban-head">
              <strong>${escapeHtml(column.title)}</strong>
              <span>${escapeHtml(String(column.count))}</span>
            </div>
            <div class="runtime-kanban-body">
              ${column.tasks.length > 0 ? column.tasks.map((task) => `
                <article class="runtime-board-task runtime-selectable ${task.tid === selectedTid ? "is-selected" : ""}" data-runtime-tid="${escapeHtml(task.tid)}">
                  <div class="runtime-board-task-head">
                    <strong>${escapeHtml(task.tid)}</strong>
                    <span class="${runtimePillClass(task.state)}">${escapeHtml(task.stateLabel)}</span>
                  </div>
                  ${renderTaskSignals(task)}
                  <p>${escapeHtml(task.goal)}</p>
                  <p class="runtime-task-meta">优先级：${escapeHtml(task.priority || "P2")} / ${escapeHtml(task.planLabel || "No checklist yet")}</p>
                  <p class="runtime-task-meta">当前负责人：${escapeHtml(task.owner || "HQ(CoS)")}</p>
                  <p class="runtime-task-meta">当前动作角色：${escapeHtml(task.currentRoleLabel)}</p>
                  <p class="runtime-task-meta">下一步：${escapeHtml(task.nextStep)}</p>
                  ${task.dependencyLabel && task.dependencyLabel !== "none" ? '<p class="runtime-task-meta">依赖：' + escapeHtml(task.dependencyLabel) + '</p>' : ""}
                </article>
              `).join("") : '<div class="runtime-empty compact">当前列没有任务。</div>'}
            </div>
          </section>
        `).join("")}
      </div>
    `
    : '<div class="runtime-empty">`runtime/tasks` 里还没有任务文件。可以先创建一个 TID，再让网页自动展示角色状态。</div>';

  for (const item of document.querySelectorAll("[data-runtime-tid]")) {
    item.addEventListener("click", () => {
      setRuntimeSelectedTid(item.dataset.runtimeTid, { silent: true });
    });
  }

  renderRuntimeRefreshLabel();
}

async function refreshRuntimeBoard(silent = false) {
  renderRuntimeRefreshLabel();
  if (state.runtimeRefreshInFlight) {
    state.runtimeRefreshQueued = true;
    state.runtimeRefreshQueuedSilent = state.runtimeRefreshQueuedSilent && silent;
    return;
  }

  state.runtimeRefreshInFlight = true;
  state.runtimeLastRefreshError = "";
  renderRuntimeRefreshLabel();
  try {
    state.runtimeBoard = await requestJson("/api/runtime-board");
    state.runtimeLastRefreshAt = Date.now();
    renderRuntimeBoard();
  } catch (error) {
    state.runtimeLastRefreshError = error.message || "runtime refresh failed";
    if (!silent) {
      setStatus(error.message || "运行态加载失败。", "error");
    }
    renderRuntimeBoard();
  } finally {
    state.runtimeRefreshInFlight = false;
    renderRuntimeRefreshLabel();
    if (state.runtimeRefreshQueued) {
      const queuedSilent = state.runtimeRefreshQueuedSilent;
      state.runtimeRefreshQueued = false;
      state.runtimeRefreshQueuedSilent = true;
      refreshRuntimeBoard(queuedSilent);
    }
  }
}

function refreshOverview() {
  syncRuntimeRoleOptions();
  updateStats();
  updatePreview();
}

function syncRoleFromCard(role, card) {
  role.enabled = card.querySelector(".role-enabled").checked;
  role.mode = card.querySelector(".role-mode").value;
  role.preset = card.querySelector(".role-preset").value;
  role.id = card.querySelector(".role-id").value.trim();
  role.name = card.querySelector(".role-name").value.trim();
  role.bindings = normalizeBindings(card.querySelector(".role-bindings").value);
  role.emoji = card.querySelector(".role-emoji").value.trim();
  role.role = card.querySelector(".role-title-input").value.trim();
  role.vibe = card.querySelector(".role-vibe").value.trim();
  role.mission = card.querySelector(".role-mission").value.trim();
  role.responsibilities = splitResponsibilities(card.querySelector(".role-responsibilities").value);
}

function fillRoleCard(card, role) {
  card.querySelector(".role-enabled").checked = role.enabled !== false;
  card.querySelector(".role-mode").value = role.mode || "builtin";
  card.querySelector(".role-preset").value = role.preset || "cos";
  card.querySelector(".role-id").value = role.id || "";
  card.querySelector(".role-name").value = role.name || "";
  card.querySelector(".role-bindings").value = joinBindings(role.bindings);
  card.querySelector(".role-emoji").value = role.emoji || "";
  card.querySelector(".role-title-input").value = role.role || "";
  card.querySelector(".role-vibe").value = role.vibe || "";
  card.querySelector(".role-mission").value = role.mission || "";
  card.querySelector(".role-responsibilities").value = joinResponsibilities(role.responsibilities);
}

function updateRoleCardPresentation(card, role) {
  const isBuiltin = role.mode === "builtin";
  const enabled = role.enabled !== false;
  const bindingReady = hasBinding(role);
  const roleState = card.querySelector(".role-state");
  const bindingState = card.querySelector(".role-binding-state");

  card.dataset.mode = role.mode;
  card.dataset.enabled = String(enabled);
  card.querySelector(".role-heading").textContent = role.name || role.id || "未命名角色";
  card.querySelector(".role-caption").textContent = formatRoleSummary(role);
  card.querySelector(".role-kind").textContent = isBuiltin ? "预置模板" : "自定义";
  card.querySelector(".role-id-preview").textContent = role.id || "未设置";
  card.querySelector(".role-preset-preview").textContent = isBuiltin ? getPresetLabel(role) : "自定义角色";
  card.querySelector(".role-binding-preview").textContent = bindingReady
    ? `${getBindingCount(role)} 个会话 / ${getBindingSummary(role)}`
    : (enabled ? "启用后至少填写一个会话 ID" : "未填写");
  roleState.textContent = enabled ? "已启用" : "未启用";
  roleState.className = `role-chip role-state ${enabled ? "is-active" : "is-idle"}`;
  if (bindingReady) {
    bindingState.textContent = `${getBindingCount(role)} 个会话`;
    bindingState.className = "role-chip role-binding-state is-active";
  } else if (enabled) {
    bindingState.textContent = "缺会话 ID";
    bindingState.className = "role-chip role-binding-state is-warning";
  } else {
    bindingState.textContent = "未绑定";
    bindingState.className = "role-chip role-binding-state is-idle";
  }
  card.querySelector(".builtin-notice").hidden = !isBuiltin;
  card.querySelector(".role-preset").disabled = !isBuiltin;
  card.querySelector(".remove-role").disabled = isBuiltin;
  card.querySelector(".remove-role").hidden = isBuiltin;

  for (const selector of [
    ".role-id",
    ".role-name",
    ".role-emoji",
    ".role-title-input",
    ".role-vibe",
    ".role-mission",
    ".role-responsibilities"
  ]) {
    card.querySelector(selector).disabled = isBuiltin;
  }
}

function renderEmptyState() {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.textContent = "还没有角色。点击“新增自定义角色”开始配置。";
  elements.roleList.appendChild(emptyState);
}

function duplicateRole(index) {
  const source = state.config.roles[index];
  const role = createCustomRole({
    id: `${source.id}-copy`,
    preset: source.preset || "cos",
    name: source.mode === "builtin" ? `${source.name} 自定义版` : `${source.name} 副本`,
    emoji: source.emoji || "CR",
    role: source.role || "待定义角色边界",
    vibe: source.vibe || "",
    mission: source.mission || "",
    responsibilities: source.responsibilities || []
  });

  state.config.roles.splice(index + 1, 0, role);
  markGeneratedStale();
  renderRoles();
  refreshOverview();
  setStatus(`已复制角色“${source.name || source.id}”，请补全新的飞书会话 ID 后再启用。`, "ok");
}
function renderRoles() {
  elements.roleList.innerHTML = "";

  if (!state.config?.roles?.length) {
    renderEmptyState();
    return;
  }

  state.config.roles.forEach((role, index) => {
    const card = elements.roleTemplate.content.firstElementChild.cloneNode(true);
    fillRoleCard(card, role);
    updateRoleCardPresentation(card, role);
    setRoleCardExpanded(card, false);

    card.querySelector(".toggle-role-detail").addEventListener("click", () => {
      const expanded = !card.classList.contains("is-expanded");
      setRoleCardExpanded(card, expanded);
    });

    card.querySelector(".duplicate-role").addEventListener("click", () => {
      duplicateRole(index);
    });

    card.querySelector(".remove-role").addEventListener("click", () => {
      markGeneratedStale();
      state.config.roles.splice(index, 1);
      renderRoles();
      refreshOverview();
      setStatus("已删除自定义角色。", "ok");
    });

    card.querySelector(".role-mode").addEventListener("change", (event) => {
      markGeneratedStale();
      const nextMode = event.target.value;
      if (nextMode === "builtin") {
        applyPresetToRole(role, card.querySelector(".role-preset").value);
      } else {
        syncRoleFromCard(role, card);
        role.mode = "custom";
        role.id = role.id || uniqueRoleId(`custom-role-${nextCustomSeed()}`, index);
        role.name = role.name || `自定义角色 ${nextCustomSeed()}`;
      }

      fillRoleCard(card, role);
      updateRoleCardPresentation(card, role);
      refreshOverview();
    });

    card.querySelector(".role-preset").addEventListener("change", () => {
      if (card.querySelector(".role-mode").value === "builtin") {
        markGeneratedStale();
        applyPresetToRole(role, card.querySelector(".role-preset").value);
        fillRoleCard(card, role);
        updateRoleCardPresentation(card, role);
        refreshOverview();
      }
    });

    for (const input of card.querySelectorAll("input, textarea")) {
      input.addEventListener("input", () => {
        markGeneratedStale();
        syncRoleFromCard(role, card);
        updateRoleCardPresentation(card, role);
        refreshOverview();
      });
      input.addEventListener("change", () => {
        markGeneratedStale();
        syncRoleFromCard(role, card);
        updateRoleCardPresentation(card, role);
        refreshOverview();
      });
    }

    elements.roleList.appendChild(card);
  });
}

function downloadBlob(name, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function validateBeforeGenerate() {
  const enabledRoles = (state.config?.roles || []).filter((role) => role.enabled !== false);

  if (enabledRoles.length === 0) {
    return "请至少启用一个角色后再生成。";
  }

  const missingBindingRoles = enabledRoles.filter((role) => !hasBinding(role));
  if (missingBindingRoles.length > 0) {
    return `这些启用角色还没有填写飞书会话 ID：${missingBindingRoles
      .map((role) => role.name || role.id)
      .join("、")}`;
  }

  return "";
}

async function ensureRuntimeConfigSynced() {
  if (!state.configDirty) {
    return;
  }

  updatePreview();
  const result = await requestJson("/api/config", {
    method: "POST",
    body: JSON.stringify({ config: state.config })
  });

  state.config = reconcileBuiltins(clone(result.config));
  state.configDirty = false;
  updateProjectFields();
  renderRoles();
  refreshOverview();
}

async function createRuntimeTask() {
  const payload = collectCreateTaskPayload();

  if (!payload.goal) {
    setStatus("请先填写任务目标。", "error");
    return;
  }

  try {
    await ensureRuntimeConfigSynced();
    const result = await requestJson("/api/runtime/tasks", {
      method: "POST",
      body: JSON.stringify({ task: payload })
    });

    state.runtimeBoard = result.runtimeBoard;
    state.runtimeSelectedTid = result.task?.tid || "";
    elements.createTaskGoal.value = "";
    elements.createTaskAcceptance.value = "";
    elements.createTaskDependsOn.value = "";
    elements.createTaskHumanGate.value = "";
    elements.createTaskPlan.value = "";
    elements.createTaskPriority.value = "P2";
    renderRuntimeBoard();
    setStatus(`已创建任务 ${result.task.tid}。`, "ok");
  } catch (error) {
    setStatus(error.message || "创建任务失败。", "error");
  }
}

async function applyRuntimeAction() {
  const tid = state.runtimeSelectedTid || getRuntimeFocusTid(state.runtimeBoard);
  if (!tid) {
    setStatus("当前没有可推进的任务，请先创建一个 TID。", "error");
    return;
  }

  try {
    await ensureRuntimeConfigSynced();
    const action = collectRuntimeActionPayload();
    const result = await requestJson(`/api/runtime/tasks/${encodeURIComponent(tid)}/actions`, {
      method: "POST",
      body: JSON.stringify({ action })
    });

    state.runtimeBoard = result.runtimeBoard;
    if (["closeout"].includes(action.mode)) {
      state.runtimeSelectedTid = getRuntimeFocusTid(result.runtimeBoard);
    } else if (!state.runtimeSelectedTid) {
      state.runtimeSelectedTid = tid;
    }
    renderRuntimeBoard();
    setStatus(`已写入 ${tid} 的${runtimeActionLabel(action.mode)}。`, "ok");
  } catch (error) {
    setStatus(error.message || "写入任务动作失败。", "error");
  }
}

async function loadInitialState() {
  const [configResult, defaultsResult] = await Promise.all([
    requestJson("/api/config"),
    requestJson("/api/default-config")
  ]);

  state.defaults = clone(defaultsResult.config);
  state.config = reconcileBuiltins(clone(configResult.config));
  state.configDirty = false;
  updateProjectFields();
  renderRoles();
  refreshOverview();
  setScriptPreview();
  await refreshRuntimeBoard(true);
  syncRuntimeModePanel();
  setStatus("配置已加载。现在可以直接新增角色并填写飞书会话 ID。", "ok");
}

elements.projectName.addEventListener("input", () => {
  markGeneratedStale();
  updatePreview();
});
elements.openclawCmd.addEventListener("input", () => {
  markGeneratedStale();
  updatePreview();
});
elements.outputScriptName.addEventListener("input", () => {
  markGeneratedStale();
  updatePreview();
});
elements.runtimeActionMode.addEventListener("change", () => {
  syncRuntimeModePanel();
});
elements.planToggleIndex.addEventListener("change", () => {
  syncPlanToggleSelection();
});
elements.runtimeTaskTid.addEventListener("change", (event) => {
  setRuntimeSelectedTid(event.target.value, { silent: true });
});
elements.runtimeFollowFocus.addEventListener("click", () => {
  state.runtimeSelectedTid = getRuntimeFocusTid(state.runtimeBoard);
  renderRuntimeBoard();
  setStatus("已恢复为自动跟随当前焦点任务。", "ok");
});
elements.runtimeRefreshButton.addEventListener("click", () => {
  refreshRuntimeBoard(false);
});
elements.createTaskButton.addEventListener("click", () => {
  createRuntimeTask();
});
elements.applyRuntimeAction.addEventListener("click", () => {
  applyRuntimeAction();
});

elements.addRole.addEventListener("click", () => {
  if (!state.config) {
    setStatus("配置尚未加载完成，请稍后再试。", "error");
    return;
  }

  state.config.roles.push(createCustomRole());
  markGeneratedStale();
  renderRoles();
  refreshOverview();
  setStatus("已新增一个自定义角色。", "ok");
});

elements.resetDefaults.addEventListener("click", () => {
  state.generated = null;
  state.config = reconcileBuiltins(clone(state.defaults));
  state.configDirty = true;
  updateProjectFields();
  renderRoles();
  refreshOverview();
  setScriptPreview();
  setStatus("已恢复默认模板。", "ok");
});

elements.downloadConfig.addEventListener("click", () => {
  updatePreview();
  downloadBlob(
    "opencrew-feishu.json",
    JSON.stringify(state.config, null, 2),
    "application/json"
  );
});

elements.downloadScript.addEventListener("click", () => {
  if (!state.generated?.applyScript) {
    setStatus("还没有生成脚本，请先点击“生成脚本与工作区”。", "error");
    return;
  }

  downloadBlob(
    state.config.outputScriptName || "apply-opencrew-feishu.generated.ps1",
    state.generated.applyScript,
    "text/plain"
  );
});

elements.importConfig.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    state.generated = null;
    state.config = reconcileBuiltins(JSON.parse(text));
    state.configDirty = true;
    updateProjectFields();
    renderRoles();
    refreshOverview();
    setScriptPreview(SCRIPT_IMPORTED_HINT);
    setStatus(`已导入配置文件：${file.name}`, "ok");
  } catch (error) {
    setStatus(error.message || "导入失败。", "error");
  } finally {
    event.target.value = "";
  }
});

elements.saveConfig.addEventListener("click", async () => {
  try {
    updatePreview();
    const result = await requestJson("/api/config", {
      method: "POST",
      body: JSON.stringify({ config: state.config })
    });

    state.config = reconcileBuiltins(clone(result.config));
    state.configDirty = false;
    updateProjectFields();
    renderRoles();
    refreshOverview();
    setStatus(`配置已保存到 ${result.configPath}`, "ok");
  } catch (error) {
    setStatus(error.message || "保存失败。", "error");
  }
});

elements.generateAssets.addEventListener("click", async () => {
  try {
    updatePreview();
    const validationMessage = validateBeforeGenerate();
    if (validationMessage) {
      setStatus(validationMessage, "error");
      return;
    }

    const result = await requestJson("/api/generate", {
      method: "POST",
      body: JSON.stringify({ config: state.config })
    });

    state.generated = result;
    state.config = reconcileBuiltins(clone(result.config));
    state.configDirty = false;
    updateProjectFields();
    renderRoles();
    refreshOverview();
    setScriptPreview(result.applyScript, false);
    await refreshRuntimeBoard(true);
    setStatus(`已生成工作区与脚本：${result.applyScriptPath}`, "ok");
  } catch (error) {
    setStatus(error.message || "生成失败。", "error");
  }
});

normalizeStaticCopy();
loadInitialState().catch((error) => {
  setStatus(error.message || "加载失败。", "error");
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshRuntimeBoard(true);
  }
});

setInterval(() => {
  if (document.hidden) {
    return;
  }
  refreshRuntimeBoard(true);
}, 8000);




