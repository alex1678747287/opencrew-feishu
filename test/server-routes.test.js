const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { startServer } = require("../app/server");

function requestJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body,
          json: JSON.parse(body)
        });
      });
    }).on("error", reject);
  });
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body
        });
      });
    }).on("error", reject);
  });
}

test("server exposes health, defaults, runtime board, and UI shell", async () => {
  const server = await startServer(0);

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}`;

    const [health, defaults, board, root] = await Promise.all([
      requestJson(`${baseUrl}/api/health`),
      requestJson(`${baseUrl}/api/default-config`),
      requestJson(`${baseUrl}/api/runtime-board`),
      requestText(`${baseUrl}/`)
    ]);

    assert.equal(health.statusCode, 200);
    assert.equal(health.json.ok, true);
    assert.equal(health.json.service, "opencrew-feishu");
    assert.match(health.headers["cache-control"] || "", /no-store/);

    assert.equal(defaults.statusCode, 200);
    assert.equal(Array.isArray(defaults.json.config.roles), true);
    assert.equal(defaults.json.config.roles.length >= 3, true);

    assert.equal(board.statusCode, 200);
    assert.equal(Array.isArray(board.json.tasks), true);

    assert.equal(root.statusCode, 200);
    assert.match(root.body, /OpenCrew Feishu/);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test("server returns structured 404 and 409 API errors", async () => {
  const server = await startServer(0);

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}`;

    const missingTaskAction = await new Promise((resolve, reject) => {
      const request = http.request(
        `${baseUrl}/api/runtime/tasks/TID-missing/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        },
        (response) => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            body += chunk;
          });
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode,
              json: JSON.parse(body)
            });
          });
        }
      );
      request.on("error", reject);
      request.end(JSON.stringify({ action: { mode: "approve", actor: "Human" } }));
    });

    const createTaskResponse = await new Promise((resolve, reject) => {
      const request = http.request(
        `${baseUrl}/api/runtime/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        },
        (response) => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            body += chunk;
          });
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode,
              json: JSON.parse(body)
            });
          });
        }
      );
      request.on("error", reject);
      request.end(JSON.stringify({
        task: {
          goal: "Exercise conflict errors",
          owner: "HQ(CoS)",
          plan: ["Wait for approval"]
        }
      }));
    });

    const taskTid = createTaskResponse.json.task.tid;
    const approvalConflict = await new Promise((resolve, reject) => {
      const request = http.request(
        `${baseUrl}/api/runtime/tasks/${encodeURIComponent(taskTid)}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        },
        (response) => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            body += chunk;
          });
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode,
              json: JSON.parse(body)
            });
          });
        }
      );
      request.on("error", reject);
      request.end(JSON.stringify({ action: { mode: "approve", actor: "Human" } }));
    });

    assert.equal(missingTaskAction.statusCode, 404);
    assert.match(missingTaskAction.json.error, /task does not exist/i);

    assert.equal(createTaskResponse.statusCode, 200);
    assert.equal(approvalConflict.statusCode, 409);
    assert.match(approvalConflict.json.error, /waiting_approval state/i);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});
