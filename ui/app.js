const PRESET_LABELS = {
  cos: "协作指挥官",
  cto: "技术负责人",
  builder: "执行构建师",
  ko: "知识运营",
  ops: "流程运营"
};

const SCRIPT_PLACEHOLDER = "生成后这里会显示 apply 脚本预览。";
const SCRIPT_IMPORTED_HINT = "已导入配置。重新点击“生成脚本与工作区”后，这里会刷新最新 apply 脚本。";

const state = {
  config: null,
  defaults: null,
  generated: null
};

const elements = {
  addRole: document.getElementById("addRole"),
  boundCount: document.getElementById("boundCount"),
  configPreview: document.getElementById("configPreview"),
  customCount: document.getElementById("customCount"),
  downloadConfig: document.getElementById("downloadConfig"),
  downloadScript: document.getElementById("downloadScript"),
  enabledCount: document.getElementById("enabledCount"),
  generateAssets: document.getElementById("generateAssets"),
  importConfig: document.getElementById("importConfig"),
  openclawCmd: document.getElementById("openclawCmd"),
  outputScriptName: document.getElementById("outputScriptName"),
  projectName: document.getElementById("projectName"),
  resetDefaults: document.getElementById("resetDefaults"),
  roleCount: document.getElementById("roleCount"),
  roleList: document.getElementById("roleList"),
  roleTemplate: document.getElementById("roleTemplate"),
  saveConfig: document.getElementById("saveConfig"),
  scriptPreview: document.getElementById("scriptPreview"),
  statusBar: document.getElementById("statusBar")
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

function setScriptPreview(content = SCRIPT_PLACEHOLDER, muted = true) {
  elements.scriptPreview.textContent = content;
  elements.scriptPreview.className = muted ? "code-block muted" : "code-block";
}

function getPresetMap() {
  const roles = state.defaults?.roles || [];
  return Object.fromEntries(
    roles
      .filter((role) => role.mode === "builtin")
      .map((role) => [role.preset, clone(role)])
  );
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
          responsibilities: Array.isArray(role.responsibilities) ? role.responsibilities : []
        };
      }

      const presetKey = presetMap[role.preset] ? role.preset : "cos";
      return {
        ...clone(presetMap[presetKey]),
        enabled: role.enabled !== false,
        binding: String(role.binding || "").trim()
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
    vibe: seed.vibe || "先确认输入，再按边界交付结果，出现风险时及时同步。",
    mission: seed.mission || "围绕指定目标输出稳定、可复用、可检查的结果。",
    responsibilities: Array.isArray(seed.responsibilities) && seed.responsibilities.length > 0
      ? clone(seed.responsibilities)
      : [
          "接收明确输入并确认边界",
          "按时产出可交付结果",
          "同步风险、依赖和下一步建议"
        ],
    binding: ""
  };
}

function applyPresetToRole(role, presetKey) {
  const presetMap = getPresetMap();
  const preset = presetMap[presetKey] || presetMap.cos;
  const binding = String(role.binding || "").trim();
  const enabled = role.enabled !== false;

  Object.assign(role, clone(preset), {
    enabled,
    binding
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

function formatRoleSummary(role) {
  const modeLabel = role.mode === "builtin"
    ? `预置模板 · ${PRESET_LABELS[role.preset] || role.preset || "未选择"}`
    : "自定义角色";
  const statusLabel = role.enabled !== false ? "已启用" : "未启用";
  const bindingLabel = role.binding ? `飞书群 ID: ${role.binding}` : "未填写飞书群 ID";
  return `${modeLabel} · ${statusLabel} · ${bindingLabel}`;
}

function updateStats() {
  const roles = state.config?.roles || [];
  elements.roleCount.textContent = String(roles.length);
  elements.enabledCount.textContent = String(roles.filter((role) => role.enabled !== false).length);
  elements.boundCount.textContent = String(roles.filter((role) => String(role.binding || "").trim()).length);
  elements.customCount.textContent = String(roles.filter((role) => role.mode === "custom").length);
}

function updatePreview() {
  readProjectFields();
  elements.configPreview.textContent = JSON.stringify(state.config, null, 2);
}

function refreshOverview() {
  updateStats();
  updatePreview();
}

function syncRoleFromCard(role, card) {
  role.enabled = card.querySelector(".role-enabled").checked;
  role.mode = card.querySelector(".role-mode").value;
  role.preset = card.querySelector(".role-preset").value;
  role.id = card.querySelector(".role-id").value.trim();
  role.name = card.querySelector(".role-name").value.trim();
  role.binding = card.querySelector(".role-binding").value.trim();
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
  card.querySelector(".role-binding").value = role.binding || "";
  card.querySelector(".role-emoji").value = role.emoji || "";
  card.querySelector(".role-title-input").value = role.role || "";
  card.querySelector(".role-vibe").value = role.vibe || "";
  card.querySelector(".role-mission").value = role.mission || "";
  card.querySelector(".role-responsibilities").value = joinResponsibilities(role.responsibilities);
}

function updateRoleCardPresentation(card, role) {
  const isBuiltin = role.mode === "builtin";

  card.dataset.mode = role.mode;
  card.querySelector(".role-heading").textContent = role.name || role.id || "未命名角色";
  card.querySelector(".role-caption").textContent = formatRoleSummary(role);
  card.querySelector(".role-kind").textContent = isBuiltin ? "预置模板" : "自定义";
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
  renderRoles();
  refreshOverview();
  setStatus(`已复制角色“${source.name || source.id}”，请补充新的飞书群 ID 后再启用。`, "ok");
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

    card.querySelector(".duplicate-role").addEventListener("click", () => {
      duplicateRole(index);
    });

    card.querySelector(".remove-role").addEventListener("click", () => {
      state.config.roles.splice(index, 1);
      renderRoles();
      refreshOverview();
      setStatus("已删除自定义角色。", "ok");
    });

    card.querySelector(".role-mode").addEventListener("change", (event) => {
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
        applyPresetToRole(role, card.querySelector(".role-preset").value);
        fillRoleCard(card, role);
        updateRoleCardPresentation(card, role);
        refreshOverview();
      }
    });

    for (const input of card.querySelectorAll("input, textarea")) {
      input.addEventListener("input", () => {
        syncRoleFromCard(role, card);
        updateRoleCardPresentation(card, role);
        refreshOverview();
      });
      input.addEventListener("change", () => {
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

  const missingBindingRoles = enabledRoles.filter((role) => !String(role.binding || "").trim());
  if (missingBindingRoles.length > 0) {
    return `这些启用角色还没有填写飞书群 ID：${missingBindingRoles
      .map((role) => role.name || role.id)
      .join("、")}`;
  }

  return "";
}

async function loadInitialState() {
  const [configResult, defaultsResult] = await Promise.all([
    requestJson("/api/config"),
    requestJson("/api/default-config")
  ]);

  state.defaults = clone(defaultsResult.config);
  state.config = reconcileBuiltins(clone(configResult.config));
  updateProjectFields();
  renderRoles();
  refreshOverview();
  setScriptPreview();
  setStatus("配置已加载。你现在可以直接新增角色并填写飞书群 ID。", "ok");
}

elements.projectName.addEventListener("input", updatePreview);
elements.openclawCmd.addEventListener("input", updatePreview);
elements.outputScriptName.addEventListener("input", updatePreview);

elements.addRole.addEventListener("click", () => {
  if (!state.config) {
    setStatus("配置尚未加载完成，请稍后再试。", "error");
    return;
  }

  state.config.roles.push(createCustomRole());
  renderRoles();
  refreshOverview();
  setStatus("已新增一个自定义角色。", "ok");
});

elements.resetDefaults.addEventListener("click", () => {
  state.generated = null;
  state.config = reconcileBuiltins(clone(state.defaults));
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
    updateProjectFields();
    renderRoles();
    refreshOverview();
    setScriptPreview(result.applyScript, false);
    setStatus(`已生成工作区与脚本：${result.applyScriptPath}`, "ok");
  } catch (error) {
    setStatus(error.message || "生成失败。", "error");
  }
});

loadInitialState().catch((error) => {
  setStatus(error.message || "加载失败。", "error");
});
