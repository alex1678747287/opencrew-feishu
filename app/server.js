const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  createDefaultConfig,
  generateArtifacts,
  loadExistingConfig,
  saveConfig
} = require("./generator");
const {
  createTask,
  updateTask
} = require("./hq-tasks");
const { buildRuntimeBoard } = require("./runtime-board");

const projectRoot = path.resolve(__dirname, "..");
const uiRoot = path.join(projectRoot, "ui");
const port = Number(process.env.PORT || 3210);
const packageJsonPath = path.join(projectRoot, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": MIME_TYPES[".json"],
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".txt"] });
  response.end(body);
}

function inferErrorStatus(error, pathname) {
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("task does not exist")) {
    return 404;
  }

  if (
    message.includes("cannot approve a closed task") ||
    message.includes("cannot reject a closed task") ||
    message.includes("cannot closeout a closed task") ||
    message.includes("cannot checkpoint a closed task") ||
    message.includes("cannot handoff a closed task") ||
    message.includes("cannot ops-review a closed task") ||
    message.includes("cannot toggle-plan a closed task") ||
    message.includes("requires waiting_approval state")
  ) {
    return 409;
  }

  if (
    pathname === "/api/config" ||
    pathname === "/api/generate" ||
    pathname === "/api/runtime/tasks" ||
    /^\/api\/runtime\/tasks\/[^/]+\/actions$/.test(pathname)
  ) {
    return 400;
  }

  return 500;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

async function handleApi(request, response, pathname) {
  try {
    const runtimeActionMatch = /^\/api\/runtime\/tasks\/([^/]+)\/actions$/.exec(pathname);

    if (request.method === "GET" && pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        service: packageJson.name,
        version: packageJson.version,
        runtimeTasksDir: path.join(projectRoot, "runtime", "tasks")
      });
    }

    if (request.method === "GET" && pathname === "/api/config") {
      return sendJson(response, 200, { config: loadExistingConfig(projectRoot) });
    }

    if (request.method === "GET" && pathname === "/api/default-config") {
      return sendJson(response, 200, { config: createDefaultConfig() });
    }

    if (request.method === "GET" && pathname === "/api/runtime-board") {
      return sendJson(response, 200, buildRuntimeBoard(projectRoot));
    }

    if (request.method === "POST" && pathname === "/api/runtime/tasks") {
      const body = await readBody(request);
      const parsed = JSON.parse(body || "{}");
      const task = createTask(projectRoot, parsed.task || parsed);
      return sendJson(response, 200, {
        ok: true,
        task,
        runtimeBoard: buildRuntimeBoard(projectRoot)
      });
    }

    if (request.method === "POST" && runtimeActionMatch) {
      const body = await readBody(request);
      const parsed = JSON.parse(body || "{}");
      const tid = decodeURIComponent(runtimeActionMatch[1]);
      const action = updateTask(projectRoot, {
        tid,
        ...(parsed.action || parsed)
      });
      return sendJson(response, 200, {
        ok: true,
        action,
        runtimeBoard: buildRuntimeBoard(projectRoot)
      });
    }

    if (request.method === "POST" && pathname === "/api/config") {
      const body = await readBody(request);
      const parsed = JSON.parse(body || "{}");
      const { config, configPath } = saveConfig(projectRoot, parsed.config || parsed);
      return sendJson(response, 200, {
        ok: true,
        config,
        configPath
      });
    }

    if (request.method === "POST" && pathname === "/api/generate") {
      const body = await readBody(request);
      const parsed = JSON.parse(body || "{}");
      const input = parsed.config || parsed;
      const { config, configPath } = saveConfig(projectRoot, input);
      const result = generateArtifacts(projectRoot, config);
      return sendJson(response, 200, {
        ok: true,
        config,
        configPath,
        applyScript: result.applyScript,
        applyScriptPath: result.applyScriptPath,
        manifestPath: result.manifestPath,
        snapshotPath: result.snapshotPath,
        roles: result.resolvedRoles
      });
    }

    return sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    return sendJson(response, inferErrorStatus(error, pathname), {
      ok: false,
      error: error.message
    });
  }
}

function serveStatic(response, filePath) {
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(uiRoot)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  if (!fs.existsSync(normalized)) {
    sendText(response, 404, "Not found");
    return;
  }

  const extension = path.extname(normalized).toLowerCase();
  response.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
  });
  fs.createReadStream(normalized).pipe(response);
}

function createAppServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApi(request, response, pathname);
      return;
    }

    const target = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.join(uiRoot, target);
    serveStatic(response, filePath);
  });
}

function startServer(listenPort = port, host = "127.0.0.1") {
  const server = createAppServer();
  return new Promise((resolve) => {
    server.listen(listenPort, host, () => {
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().then((server) => {
    const address = server.address();
    const resolvedPort = typeof address === "object" && address ? address.port : port;
    console.log(`OpenCrew Feishu UI: http://127.0.0.1:${resolvedPort}`);
  });
}

module.exports = {
  createAppServer,
  startServer
};
