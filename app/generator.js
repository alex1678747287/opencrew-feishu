const fs = require("fs");
const path = require("path");
const { BUILTIN_ROLE_PRESETS, createDefaultConfig } = require("./defaults");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slugify(value, fallback = "role") {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return slug || fallback;
}

function normalizeResponsibilities(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(input || "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBinding(input) {
  return String(input || "").replace(/^feishu:/i, "").trim();
}

function normalizeRole(rawRole, index) {
  const mode = rawRole.mode === "custom" ? "custom" : "builtin";
  const rawId = rawRole.id || rawRole.name || `role-${index + 1}`;
  const id = slugify(rawId, `role-${index + 1}`);
  const fallbackPreset = BUILTIN_ROLE_PRESETS[id] ? id : "cos";
  const preset = mode === "builtin"
    ? (BUILTIN_ROLE_PRESETS[rawRole.preset] ? rawRole.preset : fallbackPreset)
    : null;
  const base = mode === "builtin" ? BUILTIN_ROLE_PRESETS[preset] : {};
  const name = String(rawRole.name || base.name || id).trim();
  const emoji = String(rawRole.emoji || base.emoji || id.slice(0, 2).toUpperCase()).trim();
  const role = String(rawRole.role || base.role || "Role owner").trim();
  const vibe = String(rawRole.vibe || base.vibe || "clear, reliable, focused").trim();
  const mission = String(rawRole.mission || base.mission || "Own the assigned work.").trim();
  const responsibilities = normalizeResponsibilities(
    rawRole.responsibilities || base.responsibilities || []
  );

  return {
    id,
    mode,
    preset,
    enabled: rawRole.enabled !== false,
    name,
    emoji,
    role,
    vibe,
    mission,
    responsibilities,
    binding: normalizeBinding(rawRole.binding)
  };
}

function normalizeConfig(rawConfig) {
  const base = createDefaultConfig();
  const requestedScriptName = String(rawConfig.outputScriptName || base.outputScriptName).trim() || base.outputScriptName;
  const outputScriptName = requestedScriptName.toLowerCase().endsWith(".ps1")
    ? requestedScriptName
    : `${requestedScriptName}.ps1`;
  const config = {
    projectName: String(rawConfig.projectName || base.projectName).trim() || base.projectName,
    openclawCmd: String(rawConfig.openclawCmd || base.openclawCmd).trim() || base.openclawCmd,
    outputScriptName,
    roles: Array.isArray(rawConfig.roles) && rawConfig.roles.length > 0
      ? rawConfig.roles.map((role, index) => normalizeRole(role, index))
      : base.roles.map((role, index) => normalizeRole(role, index))
  };

  const seen = new Set();
  for (const role of config.roles) {
    if (seen.has(role.id)) {
      throw new Error(`Duplicate role id: ${role.id}`);
    }
    seen.add(role.id);
  }

  if (!config.roles.some((role) => role.enabled)) {
    throw new Error("At least one role must be enabled.");
  }

  return config;
}

function quoteSingle(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toWindowsRelative(value) {
  return value.split("/").join("\\");
}

function renderCustomIdentity(role) {
  return [
    "# IDENTITY.md",
    "",
    `- Name: ${role.name}`,
    `- Role: ${role.role}`,
    `- Vibe: ${role.vibe}`,
    `- Emoji: ${role.emoji}`
  ].join("\n");
}

function renderCustomSoul(role) {
  return [
    "# SOUL.md",
    "",
    role.mission,
    "",
    "## Operating Style",
    "",
    ...role.responsibilities.map((item) => `- ${item}`)
  ].join("\n");
}

function renderCustomAgents(role) {
  const sharedBase = "../../scaffold/shared";
  const responsibilityLines = role.responsibilities.length > 0
    ? role.responsibilities.map((item) => `- ${item}`)
    : ["- Own the assigned work cleanly."];

  return [
    "# AGENTS.md",
    "",
    "## Startup",
    "",
    "Read:",
    "",
    "1. `IDENTITY.md`",
    "2. `SOUL.md`",
    `3. \`${sharedBase}/SYSTEM_RULES.md\``,
    `4. \`${sharedBase}/TASK_PROTOCOL.md\``,
    `5. \`${sharedBase}/CHECKPOINT_TEMPLATE.md\``,
    `6. \`${sharedBase}/CLOSEOUT_TEMPLATE.md\``,
    "",
    "## Responsibilities",
    "",
    ...responsibilityLines,
    "",
    "## Feishu Mode",
    "",
    "Use `TID` for non-trivial work, keep context compact, and leave a checkpoint or closeout when the task matters."
  ].join("\n");
}

function materializeCustomRole(projectRoot, role) {
  const relativeWorkspace = `roles/${role.id}`;
  const workspacePath = path.join(projectRoot, "roles", role.id);
  ensureDir(workspacePath);

  fs.writeFileSync(path.join(workspacePath, "IDENTITY.md"), renderCustomIdentity(role), "utf8");
  fs.writeFileSync(path.join(workspacePath, "SOUL.md"), renderCustomSoul(role), "utf8");
  fs.writeFileSync(path.join(workspacePath, "AGENTS.md"), renderCustomAgents(role), "utf8");

  return relativeWorkspace;
}

function resolveRoleWorkspace(projectRoot, role) {
  if (role.mode === "builtin") {
    return `scaffold/${role.preset}`;
  }
  return materializeCustomRole(projectRoot, role);
}

function renderApplyScript(config, resolvedRoles) {
  const lines = [];
  lines.push("$ErrorActionPreference = 'Stop'");
  lines.push("$repoRoot = Split-Path -Parent $PSScriptRoot");
  lines.push(`$openclawCmd = ${quoteSingle(config.openclawCmd)}`);
  lines.push("$raw = & $openclawCmd agents list --json");
  lines.push("if ($LASTEXITCODE -ne 0) { throw 'openclaw agents list failed' }");
  lines.push("$existing = @{}");
  lines.push("$parsed = $raw | ConvertFrom-Json");
  lines.push("foreach ($item in $parsed) { $existing[$item.id] = $true }");

  for (const role of resolvedRoles) {
    const relativeWorkspace = toWindowsRelative(role.workspaceRelative);
    const workspaceExpr = `Join-Path $repoRoot ${quoteSingle(relativeWorkspace)}`;

    lines.push("");
    lines.push(`$workspace = ${workspaceExpr}`);
    lines.push(`if (-not $existing.ContainsKey(${quoteSingle(role.id)})) {`);
    lines.push(`    Write-Host ${quoteSingle(`adding agent ${role.id}`)}`);
    lines.push(`    & $openclawCmd agents add ${role.id} --workspace $workspace --non-interactive${role.binding ? ` --bind ${quoteSingle(`feishu:${role.binding}`)}` : ""}`);
    lines.push(`    if ($LASTEXITCODE -ne 0) { throw 'failed to add ${role.id}' }`);
    if (role.binding) {
      lines.push("} else {");
      lines.push(`    Write-Host ${quoteSingle(`binding existing agent ${role.id}`)}`);
      lines.push(`    & $openclawCmd agents bind --agent ${role.id} --bind ${quoteSingle(`feishu:${role.binding}`)}`);
      lines.push(`    if ($LASTEXITCODE -ne 0) { throw 'failed to bind ${role.id}' }`);
      lines.push("}");
    } else {
      lines.push("}");
    }
  }

  lines.push("");
  lines.push("Write-Host 'done'");
  return lines.join("\n");
}

function generateArtifacts(projectRoot, rawConfig) {
  const config = normalizeConfig(rawConfig);
  const generatedDir = path.join(projectRoot, "generated");
  ensureDir(generatedDir);

  for (const role of config.roles) {
    if (role.enabled && !role.binding) {
      throw new Error(`Enabled role ${role.id} requires a Feishu group ID.`);
    }
  }

  const resolvedRoles = config.roles
    .filter((role) => role.enabled)
    .map((role) => ({
      ...role,
      workspaceRelative: resolveRoleWorkspace(projectRoot, role)
    }));

  const applyScript = renderApplyScript(config, resolvedRoles);
  const applyScriptPath = path.join(generatedDir, config.outputScriptName);
  const manifestPath = path.join(generatedDir, "role-manifest.json");
  const snapshotPath = path.join(generatedDir, "config.snapshot.json");

  fs.writeFileSync(applyScriptPath, applyScript, "utf8");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        projectName: config.projectName,
        openclawCmd: config.openclawCmd,
        roles: resolvedRoles.map((role) => ({
          id: role.id,
          mode: role.mode,
          preset: role.preset,
          binding: role.binding,
          workspaceRelative: role.workspaceRelative
        }))
      },
      null,
      2
    ),
    "utf8"
  );
  fs.writeFileSync(snapshotPath, JSON.stringify(config, null, 2), "utf8");

  return {
    config,
    applyScript,
    applyScriptPath,
    manifestPath,
    snapshotPath,
    resolvedRoles
  };
}

function saveConfig(projectRoot, rawConfig, fileName = "opencrew-feishu.local.json") {
  const config = normalizeConfig(rawConfig);
  const configDir = path.join(projectRoot, "config");
  ensureDir(configDir);
  const configPath = path.join(configDir, fileName);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  return { config, configPath };
}

function loadExistingConfig(projectRoot) {
  const localPath = path.join(projectRoot, "config", "opencrew-feishu.local.json");
  if (fs.existsSync(localPath)) {
    return normalizeConfig(JSON.parse(fs.readFileSync(localPath, "utf8")));
  }

  return createDefaultConfig();
}

module.exports = {
  createDefaultConfig,
  deepClone,
  generateArtifacts,
  loadExistingConfig,
  normalizeConfig,
  saveConfig
};
