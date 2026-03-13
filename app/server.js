const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  createDefaultConfig,
  generateArtifacts,
  loadExistingConfig,
  saveConfig
} = require("./generator");

const projectRoot = path.resolve(__dirname, "..");
const uiRoot = path.join(projectRoot, "ui");
const port = Number(process.env.PORT || 3210);

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
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".txt"] });
  response.end(body);
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
    if (request.method === "GET" && pathname === "/api/config") {
      return sendJson(response, 200, { config: loadExistingConfig(projectRoot) });
    }

    if (request.method === "GET" && pathname === "/api/default-config") {
      return sendJson(response, 200, { config: createDefaultConfig() });
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
    return sendJson(response, 400, {
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

const server = http.createServer(async (request, response) => {
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

server.listen(port, "127.0.0.1", () => {
  console.log(`OpenCrew Feishu UI: http://127.0.0.1:${port}`);
});
