const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  generateArtifacts,
  normalizeConfig
} = require("../app/generator");

const ASCII_SAFE_PROMPT_PATTERN = /[鍏鍗褰鎬浣绛鎵璇銆锛€]/;

function withTempProject(run) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencrew-feishu-generator-"));
  try {
    return run(projectRoot);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function collectMarkdownFiles(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files;
}

test("normalizeConfig accepts string bindings with Chinese punctuation", () => {
  const config = normalizeConfig({
    outputScriptName: "apply-demo",
    roles: [
      {
        mode: "builtin",
        preset: "cos",
        bindings: "feishu:group-a；group-b，group-c"
      }
    ]
  });

  assert.equal(config.outputScriptName, "apply-demo.ps1");
  assert.deepEqual(config.roles[0].bindings, ["group-a", "group-b", "group-c"]);
});

test("generateArtifacts writes clean custom role files from string bindings", () => withTempProject((projectRoot) => {
  const result = generateArtifacts(projectRoot, {
    projectName: "demo",
    openclawCmd: "openclaw",
    outputScriptName: "apply-demo",
    roles: [
      {
        mode: "custom",
        id: "planner",
        enabled: true,
        name: "Planner",
        role: "Scope and orchestration owner",
        vibe: "Calm, concise, and boundary-aware.",
        mission: "Turn the ask into a concrete next step.",
        responsibilities: "Clarify the ask\nWrite the next checklist",
        bindings: "feishu:group-a；group-b"
      }
    ]
  });

  assert.deepEqual(result.config.roles[0].bindings, ["group-a", "group-b"]);
  assert.ok(fs.existsSync(path.join(projectRoot, "generated", "apply-demo.ps1")));

  for (const fileName of ["IDENTITY.md", "SOUL.md", "AGENTS.md"]) {
    const content = fs.readFileSync(path.join(projectRoot, "roles", "planner", fileName), "utf8");
    assert.equal(ASCII_SAFE_PROMPT_PATTERN.test(content), false, fileName);
  }

  const agents = fs.readFileSync(path.join(projectRoot, "roles", "planner", "AGENTS.md"), "utf8");
  assert.match(agents, /Start each external reply with `\[Planner\]`\./);
}));

test("generateArtifacts rejects enabled roles without bindings", () => withTempProject((projectRoot) => {
  assert.throws(
    () => generateArtifacts(projectRoot, {
      roles: [
        {
          mode: "custom",
          id: "planner",
          enabled: true,
          name: "Planner"
        }
      ]
    }),
    /requires at least one Feishu session ID/
  );
}));

test("sample config stays parseable and matches builtin default role ids", () => {
  const repoRoot = path.join(__dirname, "..");
  const samplePath = path.join(repoRoot, "config", "opencrew-feishu.sample.json");
  const sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));

  assert.equal(sample.projectName, "opencrew-feishu");
  assert.deepEqual(
    sample.roles.map((role) => role.id),
    ["cos", "cto", "builder", "ko", "ops"]
  );
  assert.equal(
    sample.roles.every((role) => typeof role.name === "string" && role.name.trim().length > 0),
    true
  );
});

test("package metadata stays aligned with the public repository", () => {
  const repoRoot = path.join(__dirname, "..");
  const packagePath = path.join(repoRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.homepage, "https://github.com/alex1678747287/opencrew-feishu");
  assert.equal(pkg.repository?.type, "git");
  assert.equal(pkg.repository?.url, "git+https://github.com/alex1678747287/opencrew-feishu.git");
  assert.equal(pkg.bugs?.url, "https://github.com/alex1678747287/opencrew-feishu/issues");
});

test("runtime and scaffold prompt docs stay ASCII-safe and preserve the CoS identity shortcut", () => {
  const repoRoot = path.join(__dirname, "..");
  const markdownFiles = [
    ...collectMarkdownFiles(path.join(repoRoot, "runtime")),
    ...collectMarkdownFiles(path.join(repoRoot, "scaffold"))
  ];

  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    assert.equal(ASCII_SAFE_PROMPT_PATTERN.test(content), false, path.relative(repoRoot, filePath));
  }

  const cosAgents = fs.readFileSync(path.join(repoRoot, "scaffold", "cos", "AGENTS.md"), "utf8");
  assert.match(cosAgents, /do not emit a `TID` block/i);
  assert.match(cosAgents, /\[CoS\] Current role: Collaboration Lead \(CoS\)\./);
});
