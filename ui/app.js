const state = {
  config: null,
  generated: null,
  defaults: null
};

const elements = {
  addRole: document.getElementById("addRole"),
  configPreview: document.getElementById("configPreview"),
  downloadConfig: document.getElementById("downloadConfig"),
  downloadScript: document.getElementById("downloadScript"),
  generateAssets: document.getElementById("generateAssets"),
  importConfig: document.getElementById("importConfig"),
  openclawCmd: document.getElementById("openclawCmd"),
  outputScriptName: document.getElementById("outputScriptName"),
  projectName: document.getElementById("projectName"),
  resetDefaults: document.getElementById("resetDefaults"),
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
      "Content-Type": "application/json"
    },
    ...options
  }).then(async (response) => {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "请求失败");
    }
    return payload;
  });
}

function setStatus(message, kind = "") {
  elements.statusBar.textContent = message;
  elements.statusBar.className = `status ${kind}`.trim();
}

function updateProjectFields() {
  elements.projectName.value = state.config.projectName || "";
  elements.openclawCmd.value = state.config.openclawCmd || "";
  elements.outputScriptName.value = state.config.outputScriptName || "";
}

function roleSummary(role) {
  if (role.mode === "builtin") {
    return `内置预设：${String(role.preset || "").toUpperCase()}${role.binding ? ` | 飞书：${role.binding}` : ""}`;
  }

  return `${role.role}${role.binding ? ` | 飞书：${role.binding}` : ""}`;
}

function customRoleSeed() {
  const nextIndex = state.config.roles.filter((role) => role.mode === "custom").length + 1;
  return {
    id: `custom-role-${nextIndex}`,
    mode: "custom",
    preset: "cos",
    enabled: true,
    name: `自定义角色 ${nextIndex}`,
    emoji: "CR",
    role: "自定义角色负责人",
    vibe: "清晰、灵活、可靠",
    mission: "清楚地接住任务，并把它推进到可交付状态。",
    responsibilities: [
      "接住已经明确范围的任务。",
      "低噪音推进，不制造无效沟通。",
      "留下可复用的总结或交接。"
    ],
    binding: ""
  };
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

function readProjectFields() {
  state.config.projectName = elements.projectName.value.trim();
  state.config.openclawCmd = elements.openclawCmd.value.trim();
  state.config.outputScriptName = elements.outputScriptName.value.trim();
}

function syncRoleFromCard(role, card) {
  role.enabled = card.querySelector(".role-enabled").checked;
  role.mode = card.querySelector(".role-mode").value;
  role.preset = card.querySelector(".role-preset").value;
  role.id = card.querySelector(".role-id").value.trim();
  role.name = card.querySelector(".role-name").value.trim();
  role.emoji = card.querySelector(".role-emoji").value.trim();
  role.binding = card.querySelector(".role-binding").value.trim();
  role.role = card.querySelector(".role-title-input").value.trim();
  role.vibe = card.querySelector(".role-vibe").value.trim();
  role.mission = card.querySelector(".role-mission").value.trim();
  role.responsibilities = splitResponsibilities(
    card.querySelector(".role-responsibilities").value
  );
}

function refreshPreview() {
  readProjectFields();
  elements.configPreview.textContent = JSON.stringify(state.config, null, 2);
}

function applyModeState(card, role) {
  const isBuiltin = role.mode === "builtin";
  card.querySelector(".role-preset").disabled = !isBuiltin;
  card.querySelector(".remove-role").style.visibility = isBuiltin ? "hidden" : "visible";

  for (const selector of [
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

function renderRoles() {
  elements.roleList.innerHTML = "";

  state.config.roles.forEach((role, index) => {
    const fragment = elements.roleTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".role-card");

    fragment.querySelector(".role-heading").textContent = role.name || role.id;
    fragment.querySelector(".role-caption").textContent = roleSummary(role);
    fragment.querySelector(".role-enabled").checked = role.enabled !== false;
    fragment.querySelector(".role-mode").value = role.mode || "builtin";
    fragment.querySelector(".role-preset").value = role.preset || "cos";
    fragment.querySelector(".role-id").value = role.id || "";
    fragment.querySelector(".role-name").value = role.name || "";
    fragment.querySelector(".role-emoji").value = role.emoji || "";
    fragment.querySelector(".role-binding").value = role.binding || "";
    fragment.querySelector(".role-title-input").value = role.role || "";
    fragment.querySelector(".role-vibe").value = role.vibe || "";
    fragment.querySelector(".role-mission").value = role.mission || "";
    fragment.querySelector(".role-responsibilities").value = joinResponsibilities(role.responsibilities);

    const removeButton = fragment.querySelector(".remove-role");
    removeButton.addEventListener("click", () => {
      state.config.roles.splice(index, 1);
      renderRoles();
      refreshPreview();
    });

    for (const input of fragment.querySelectorAll("input, select, textarea")) {
      input.addEventListener("input", () => {
        syncRoleFromCard(role, card);
        fragment.querySelector(".role-heading").textContent = role.name || role.id || "未命名角色";
        fragment.querySelector(".role-caption").textContent = roleSummary(role);
        applyModeState(card, role);
        refreshPreview();
      });

      input.addEventListener("change", () => {
        syncRoleFromCard(role, card);
        fragment.querySelector(".role-heading").textContent = role.name || role.id || "未命名角色";
        fragment.querySelector(".role-caption").textContent = roleSummary(role);
        applyModeState(card, role);
        refreshPreview();
      });
    }

    applyModeState(card, role);
    elements.roleList.appendChild(fragment);
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

async function loadInitialState() {
  const [configResult, defaultsResult] = await Promise.all([
    requestJson("/api/config"),
    requestJson("/api/default-config")
  ]);

  state.config = clone(configResult.config);
  state.defaults = clone(defaultsResult.config);
  updateProjectFields();
  renderRoles();
  refreshPreview();
  setStatus("已加载当前配置。", "ok");
}

elements.projectName.addEventListener("input", refreshPreview);
elements.openclawCmd.addEventListener("input", refreshPreview);
elements.outputScriptName.addEventListener("input", refreshPreview);

elements.addRole.addEventListener("click", () => {
  state.config.roles.push(customRoleSeed());
  renderRoles();
  refreshPreview();
});

elements.resetDefaults.addEventListener("click", () => {
  state.config = clone(state.defaults);
  state.generated = null;
  updateProjectFields();
  renderRoles();
  refreshPreview();
  elements.scriptPreview.textContent = "暂未生成脚本。";
  setStatus("已重置为默认配置。", "ok");
});

elements.downloadConfig.addEventListener("click", () => {
  refreshPreview();
  downloadBlob("opencrew-feishu.json", JSON.stringify(state.config, null, 2), "application/json");
});

elements.downloadScript.addEventListener("click", () => {
  if (!state.generated || !state.generated.applyScript) {
    setStatus("请先生成产物，再下载应用脚本。", "error");
    return;
  }
  downloadBlob(state.config.outputScriptName || "apply-opencrew-feishu.generated.ps1", state.generated.applyScript, "text/plain");
});

elements.importConfig.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    state.config = JSON.parse(text);
    state.generated = null;
    updateProjectFields();
    renderRoles();
    refreshPreview();
    elements.scriptPreview.textContent = "配置已导入，点击“生成产物”后可预览应用脚本。";
    setStatus(`已导入 ${file.name}。`, "ok");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    event.target.value = "";
  }
});

elements.saveConfig.addEventListener("click", async () => {
  try {
    refreshPreview();
    const result = await requestJson("/api/config", {
      method: "POST",
      body: JSON.stringify({ config: state.config })
    });
    state.config = result.config;
    updateProjectFields();
    renderRoles();
    refreshPreview();
    setStatus(`配置已保存到 ${result.configPath}。`, "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

elements.generateAssets.addEventListener("click", async () => {
  try {
    refreshPreview();
    const result = await requestJson("/api/generate", {
      method: "POST",
      body: JSON.stringify({ config: state.config })
    });
    state.config = result.config;
    state.generated = result;
    updateProjectFields();
    renderRoles();
    refreshPreview();
    elements.scriptPreview.textContent = result.applyScript;
    setStatus(`已生成产物：${result.applyScriptPath}`, "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

loadInitialState().catch((error) => {
  setStatus(error.message, "error");
});
