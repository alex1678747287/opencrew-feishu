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

function normalizeBindings(input) {
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((item) => normalizeBinding(item))
          .filter(Boolean)
      )
    );
  }

  return Array.from(
    new Set(
      String(input || "")
        .split(/\r?\n|[,;\uFF0C\uFF1B]/)
        .map((item) => normalizeBinding(item))
        .filter(Boolean)
    )
  );
}

function normalizeRole(rawRole = {}, index) {
  const mode = rawRole.mode === "custom" ? "custom" : "builtin";
  const rawId = rawRole.id || rawRole.name || `role-${index + 1}`;
  const id = slugify(rawId, `role-${index + 1}`);
  const presetFromId = BUILTIN_ROLE_PRESETS[id] ? id : "cos";
  const preset = mode === "builtin"
    ? (BUILTIN_ROLE_PRESETS[rawRole.preset] ? rawRole.preset : presetFromId)
    : null;
  const base = mode === "builtin" ? BUILTIN_ROLE_PRESETS[preset] : {};

  const name = String(rawRole.name || base.name || id).trim();
  const emoji = String(rawRole.emoji || base.emoji || id.slice(0, 2).toUpperCase()).trim();
  const role = String(rawRole.role || base.role || "Pending role boundary").trim();
  const vibe = String(rawRole.vibe || base.vibe || "Clear, reliable, and delivery-focused.").trim();
  const mission = String(rawRole.mission || base.mission || "Take ownership of the assigned goal and deliver a concrete result.").trim();
  const responsibilities = normalizeResponsibilities(
    rawRole.responsibilities || base.responsibilities || []
  );
  const rawBindings = Array.isArray(rawRole.bindings)
    ? rawRole.bindings
    : (rawRole.bindings ?? rawRole.binding);
  const bindings = normalizeBindings(
    rawBindings
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
    bindings
  };
}

function normalizeConfig(rawConfig = {}) {
  const base = createDefaultConfig();
  const requestedScriptName = String(rawConfig.outputScriptName || base.outputScriptName).trim()
    || base.outputScriptName;
  const outputScriptName = requestedScriptName.toLowerCase().endsWith(".ps1")
    ? requestedScriptName
    : `${requestedScriptName}.ps1`;
  const sourceRoles = Array.isArray(rawConfig.roles) ? rawConfig.roles : base.roles;
  const config = {
    projectName: String(rawConfig.projectName || base.projectName).trim() || base.projectName,
    openclawCmd: String(rawConfig.openclawCmd || base.openclawCmd).trim() || base.openclawCmd,
    outputScriptName,
    roles: sourceRoles.map((role, index) => normalizeRole(role, index))
  };

  const seen = new Set();
  for (const role of config.roles) {
    if (seen.has(role.id)) {
      throw new Error(`role ID is duplicated: ${role.id}`);
    }
    seen.add(role.id);
  }

  return config;
}

function quoteSingle(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toPowerShellStringArray(values) {
  const items = Array.isArray(values) ? values : [];
  return `@(${items.map((item) => quoteSingle(item)).join(", ")})`;
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
    `- Style: ${role.vibe}`,
    `- Emoji: ${role.emoji}`
  ].join("\n");
}

function renderCustomSoul(role) {
  return [
    "# SOUL.md",
    "",
    role.mission,
    "",
    "## Responsibilities",
    "",
    ...role.responsibilities.map((item) => `- ${item}`)
  ].join("\n");
}

function renderCustomAgents(role) {
  const sharedBase = "../../scaffold/shared";
  const responsibilityLines = role.responsibilities.length > 0
    ? role.responsibilities.map((item) => `- ${item}`)
    : ["- Deliver the assigned task with stable, reviewable output."];

  return [
    "# AGENTS.md",
    "",
    "## Read Order",
    "",
    "1. `IDENTITY.md`",
    "2. `SOUL.md`",
    `3. \`${sharedBase}/SYSTEM_RULES.md\``,
    `4. \`${sharedBase}/TASK_PROTOCOL.md\``,
    `5. \`${sharedBase}/CHECKPOINT_TEMPLATE.md\``,
    `6. \`${sharedBase}/CLOSEOUT_TEMPLATE.md\``,
    "",
    "## Current Responsibilities",
    "",
    ...responsibilityLines,
    "",
    "## Collaboration Rules",
    "",
    "Confirm the input and boundary first, then move according to the shared protocol. If a blocker, dependency, or risk appears, report it quickly and provide the next recommended action.",
    "",
    "## Output Rules",
    "",
    `- Start each external reply with \`[${role.name}]\`.`
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
  lines.push("$openclawHome = if ($env:OPENCLAW_HOME) { $env:OPENCLAW_HOME } else { Join-Path $env:USERPROFILE '.openclaw' }");
  lines.push("$configPath = Join-Path $openclawHome 'openclaw.json'");
  lines.push("if (-not (Test-Path $configPath)) { throw \"openclaw config not found: $configPath\" }");
  lines.push("$raw = & $openclawCmd agents list --json");
  lines.push("if ($LASTEXITCODE -ne 0) { throw 'openclaw agents list failed' }");
  lines.push("$existing = @{}");
  lines.push("$parsed = $raw | ConvertFrom-Json");
  lines.push("foreach ($item in $parsed) { $existing[$item.id] = $true }");
  lines.push("$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json");
  lines.push("if (-not $config.PSObject.Properties['bindings']) {");
  lines.push("    Add-Member -InputObject $config -MemberType NoteProperty -Name bindings -Value @()");
  lines.push("}");
  lines.push("function Set-FeishuGroupBindings {");
  lines.push("    param(");
  lines.push("        [Parameter(Mandatory = $true)][pscustomobject]$Config,");
  lines.push("        [Parameter(Mandatory = $true)][string]$AgentId,");
  lines.push("        [Parameter(Mandatory = $true)][string[]]$GroupIds");
  lines.push("    )");
  lines.push("");
  lines.push("    $normalizedGroupIds = New-Object System.Collections.Generic.List[string]");
  lines.push("    foreach ($Item in @($GroupIds)) {");
  lines.push("        if ($null -eq $Item) {");
  lines.push("            continue");
  lines.push("        }");
  lines.push("        $text = $Item.ToString().Trim()");
  lines.push("        if ($text -and -not $normalizedGroupIds.Contains($text)) {");
  lines.push("            $normalizedGroupIds.Add($text) | Out-Null");
  lines.push("        }");
  lines.push("    }");
  lines.push("    $normalizedGroupIds = @($normalizedGroupIds)");
  lines.push("    if ($normalizedGroupIds.Count -eq 0) {");
  lines.push("        return");
  lines.push("    }");
  lines.push("");
  lines.push("    $targetGroupLookup = @{}");
  lines.push("    foreach ($GroupId in $normalizedGroupIds) {");
  lines.push("        $targetGroupLookup[$GroupId] = $true");
  lines.push("    }");
  lines.push("");
  lines.push("    $bindings = @()");
  lines.push("    if ($null -ne $Config.bindings) {");
  lines.push("        $bindings = @($Config.bindings)");
  lines.push("    }");
  lines.push("");
  lines.push("    $Config.bindings = @(");
  lines.push("        $bindings | Where-Object {");
  lines.push("            $match = $_.match");
  lines.push("            if ($null -eq $match) {");
  lines.push("                $true");
  lines.push("            } elseif ($match.channel -ne 'feishu') {");
  lines.push("                $true");
  lines.push("            } else {");
  lines.push("                $sameAgent = $_.agentId -eq $AgentId");
  lines.push("                $legacyAccountBinding = $null -ne $match.accountId -and $targetGroupLookup.ContainsKey($match.accountId)");
  lines.push("                $sameGroupPeer = $null -ne $match.peer -and $match.peer.kind -eq 'group' -and $null -ne $match.peer.id -and $targetGroupLookup.ContainsKey($match.peer.id)");
  lines.push("                -not ($sameAgent -or $legacyAccountBinding -or $sameGroupPeer)");
  lines.push("            }");
  lines.push("        }");
  lines.push("    )");
  lines.push("");
  lines.push("    foreach ($GroupId in $normalizedGroupIds) {");
  lines.push("        $Config.bindings += [pscustomobject]@{");
  lines.push("            agentId = $AgentId");
  lines.push("            match = [pscustomobject]@{");
  lines.push("                channel = 'feishu'");
  lines.push("                peer = [pscustomobject]@{");
  lines.push("                    kind = 'group'");
  lines.push("                    id = $GroupId");
  lines.push("                }");
  lines.push("            }");
  lines.push("        }");
  lines.push("    }");
  lines.push("}");

  for (const role of resolvedRoles) {
    const relativeWorkspace = toWindowsRelative(role.workspaceRelative);
    const workspaceExpr = `Join-Path $repoRoot ${quoteSingle(relativeWorkspace)}`;

    lines.push("");
    lines.push(`$workspace = ${workspaceExpr}`);
    lines.push(`if (-not $existing.ContainsKey(${quoteSingle(role.id)})) {`);
    lines.push(`    Write-Host ${quoteSingle(`adding agent ${role.id}`)}`);
    lines.push(`    & $openclawCmd agents add ${role.id} --workspace $workspace --non-interactive`);
    lines.push(`    if ($LASTEXITCODE -ne 0) { throw 'failed to add ${role.id}' }`);
    lines.push("} else {");
    lines.push(`    Write-Host ${quoteSingle(`agent ${role.id} already exists`)}`);
    lines.push("}");
    lines.push(`Set-FeishuGroupBindings -Config $config -AgentId ${quoteSingle(role.id)} -GroupIds ${toPowerShellStringArray(role.bindings)}`);
    lines.push(`Write-Host ${quoteSingle(`bound ${role.id} to ${role.bindings.length} feishu session(s)`)}`);
  }

  lines.push("");
  lines.push("$configJson = $config | ConvertTo-Json -Depth 20");
  lines.push("$utf8NoBom = New-Object System.Text.UTF8Encoding($false)");
  lines.push("[System.IO.File]::WriteAllText($configPath, $configJson, $utf8NoBom)");
  lines.push("Write-Host ('updated bindings in ' + $configPath)");
  lines.push("$restartExitCode = 0");
  lines.push("try {");
  lines.push("    $restartOutput = & $openclawCmd gateway restart 2>&1");
  lines.push("    $restartExitCode = $LASTEXITCODE");
  lines.push("} catch {");
  lines.push("    $restartOutput = $_");
  lines.push("    $restartExitCode = 1");
  lines.push("}");
  lines.push("if ($restartExitCode -eq 0) {");
  lines.push("    Write-Host 'gateway restarted'");
  lines.push("} else {");
  lines.push("    Write-Warning 'failed to restart gateway automatically; run `openclaw gateway restart` manually.'");
  lines.push("}");
  lines.push("Write-Host 'done'");
  return lines.join("\n");
}

function generateArtifacts(projectRoot, rawConfig) {
  const config = normalizeConfig(rawConfig);
  const enabledRoles = config.roles.filter((role) => role.enabled);
  if (enabledRoles.length === 0) {
    throw new Error("enable at least one role before generating artifacts");
  }

  for (const role of enabledRoles) {
    if (!Array.isArray(role.bindings) || role.bindings.length === 0) {
      throw new Error(`enabled role "${role.name || role.id}" requires at least one Feishu session ID`);
    }
  }

  const generatedDir = path.join(projectRoot, "generated");
  ensureDir(generatedDir);

  const resolvedRoles = enabledRoles.map((role) => ({
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
          bindings: role.bindings,
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
